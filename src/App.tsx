import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { AppLoading } from "./components/layout/AppLoading";
import { KioskShell } from "./components/layout/KioskShell";
import { resolveKioskNavFromBuildView } from "./lib/kioskShellConfig";
import { navigateKioskNavMyBuild } from "./lib/kioskShellNavigation";
import AppliedUiSection from "./components/AppliedUiSection";
import { HelpHint } from "./components/HelpHint";
import CurrentBuild from "./CurrentBuild";
import { HouseholdProductProvider } from "./context/HouseholdProductContext";
import { HelpModeProvider } from "./lib/HelpModeContext";
import {
  applyAppNavPageNavigation,
  findAppNavCategoryForPage,
  isAdminNavEnabled,
  loadMyBuildExpandedCategories,
  loadMyBuildSidebarCollapsed,
  resolveAppNavActivePageId,
  resolveAppShellFromHref,
  resolveCleaningFromPathname,
  readAppLocationHref,
  saveMyBuildExpandedCategories,
  saveMyBuildSidebarCollapsed,
  type AppShellView,
  type MyBuildUserView,
} from "./lib/appNavigation";
import { resolveHomeCardNavigation } from "./lib/homeDashboardData";
import { KioskReleaseChecklistPage } from "./pages/KioskReleaseChecklistPage";
import { HubCardsExample } from "./components/cards/HubCardsExample";

const HomeDashboardPage = lazy(() => import("./pages/HomeDashboardPage"));
const ChoresPage = lazy(() =>
  import("./pages/ChoresPage").then((m) => ({ default: m.ChoresPage })),
);
const CleaningRouter = lazy(() =>
  import("./pages/cleaning/CleaningRouter").then((m) => ({ default: m.CleaningRouter })),
);
const BackendConsolePage = lazy(() => import("./pages/BackendConsolePage"));

function ChoresRouteFallback() {
  return (
    <p className="wd-chore-hh__empty wd-chore-hh__empty--inline" role="status" aria-live="polite">
      Loading chores…
    </p>
  );
}
import { ProductLibraryPage } from "./pages/ProductLibraryPage";
import type { HomeDashboardCardId } from "./types/homeDashboard";
import "./styles.css";
import "./ui-builder.css";

const INITIAL_BUILD_USER_VIEW: MyBuildUserView = { screen: "home" };

function UserFacingModulePlaceholder({
  title,
  onBackHome,
}: {
  title: string;
  onBackHome: () => void;
}) {
  return (
    <div className="wd-user-module-placeholder">
      <div className="wd-user-module-placeholder__panel">
        <h1 className="wd-user-module-placeholder__title">{title}</h1>
        <p className="wd-user-module-placeholder__message">This page will be built next.</p>
        <button type="button" className="wd-user-module-placeholder__btn" onClick={onBackHome}>
          Back to Home
        </button>
      </div>
    </div>
  );
}

function AdminShellBar({ onBackToHousehold }: { onBackToHousehold: () => void }) {
  return (
    <div className="wd-admin-shell-bar">
      <div className="wd-admin-shell-bar__copy">
        <strong>Backend Console</strong>
        <span>Builder and reference tools — not part of the household kiosk.</span>
      </div>
      <button type="button" className="wd-admin-shell-bar__btn" onClick={onBackToHousehold}>
        Back to My Build
      </button>
    </div>
  );
}

function MyBuildTopBar({
  activeView,
  onViewChange,
  showAdminSwitcher,
  showFullAppLink,
  onOpenFullApp,
}: {
  activeView: AppShellView;
  onViewChange: (v: AppShellView) => void;
  showAdminSwitcher: boolean;
  showFullAppLink: boolean;
  onOpenFullApp: () => void;
}) {
  return (
    <div className="wd-my-build-topbar">
      <div className="wd-my-build-topbar__brand">
        <strong>My Build</strong>
        <span>Household kiosk — shopping, pantry, chores, members</span>
      </div>

      <div className="wd-my-build-topbar__actions">
        {showFullAppLink ? (
          <HelpHint
            layout="inline"
            title="Full household app"
            description="Opens the complete family workspace (dashboard, shopping, pantry, settings)."
          >
            <button type="button" className="wd-my-build-topbar__btn" onClick={onOpenFullApp}>
              Full household app
            </button>
          </HelpHint>
        ) : null}

        {showAdminSwitcher ? (
          <div className="wd-integrated-actions">
            <HelpHint
              layout="inline"
              title="Household app"
              description="Shopping, pantry, inventory, chores, and members."
            >
              <button
                className={activeView === "build" ? "wd-integrated-active" : ""}
                onClick={() => onViewChange("build")}
                type="button"
                aria-current={activeView === "build" ? "page" : undefined}
              >
                Household app
              </button>
            </HelpHint>
            <HelpHint
              layout="inline"
              title="Backend Console"
              description="UI Builder, templates, saved preview, reference pages, and layout tools."
            >
              <button
                className={activeView === "backend" ? "wd-integrated-active" : ""}
                onClick={() => onViewChange("backend")}
                type="button"
                aria-current={activeView === "backend" ? "page" : undefined}
              >
                Backend Console
              </button>
            </HelpHint>
          </div>
        ) : (
          <HelpHint
            layout="inline"
            title="Builder tools"
            description="UI Builder, Template Workbench, Saved UI Preview, and other internal tools."
          >
            <button
              type="button"
              className="wd-my-build-topbar__btn wd-my-build-topbar__btn--accent"
              onClick={() => onViewChange("backend")}
            >
              Builder tools
            </button>
          </HelpHint>
        )}
      </div>
    </div>
  );
}

function ModuleHubDateTime() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const date = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(now);
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(now);

  return (
    <p className="wd-home-hub-bar__datetime" aria-live="polite">
      <strong>{date}</strong>
      <strong>{time}</strong>
    </p>
  );
}

function AppRoutes({
  activeView,
  buildUserView,
  onOpenHomeCard,
  onOpenOriginalBuild,
  onBackToHome,
  onNavigatePath,
  sidebarCollapsed = false,
}: {
  activeView: AppShellView;
  buildUserView: MyBuildUserView;
  onOpenHomeCard: (cardId: HomeDashboardCardId) => void;
  onOpenOriginalBuild: () => void;
  onBackToHome: () => void;
  onNavigatePath: (path: string) => void;
  sidebarCollapsed?: boolean;
}) {
  const isShoppingModule =
    buildUserView.screen === "module" && buildUserView.moduleId === "shopping";

  if (activeView === "build") {
    if (buildUserView.screen === "home") {
      return (
        <>
          <Suspense fallback={<AppLoading />}>
            <HomeDashboardPage
              onOpenHomeCard={onOpenHomeCard}
              onOpenOriginalBuild={onOpenOriginalBuild}
            />
          </Suspense>
          <AppliedUiSection />
        </>
      );
    }

    if (buildUserView.screen === "planned") {
      return (
        <>
          <UserFacingModulePlaceholder title={buildUserView.pageLabel} onBackHome={onBackToHome} />
          <AppliedUiSection />
        </>
      );
    }

    if (buildUserView.screen === "product-library") {
      return (
        <>
          <div className="wd-home-hub-bar">
            <button type="button" className="wd-home-hub-bar__btn" onClick={onBackToHome}>
              ← Household home
            </button>
          </div>
          <HouseholdProductProvider>
            <ProductLibraryPage />
          </HouseholdProductProvider>
          <AppliedUiSection />
        </>
      );
    }

    if (buildUserView.screen === "release-checklist") {
      return (
        <>
          <div className="wd-home-hub-bar">
            <button type="button" className="wd-home-hub-bar__btn" onClick={onBackToHome}>
              ← Household home
            </button>
          </div>
          <KioskReleaseChecklistPage />
          <AppliedUiSection />
        </>
      );
    }

    if (buildUserView.screen === "chores") {
      return (
        <>
          <div className="wd-home-hub-bar">
            <button type="button" className="wd-home-hub-bar__btn" onClick={onBackToHome}>
              ← Household home
            </button>
          </div>
          <Suspense fallback={<ChoresRouteFallback />}>
            <ChoresPage onNavigate={onNavigatePath} sidebarCollapsed={sidebarCollapsed} />
          </Suspense>
          <AppliedUiSection />
        </>
      );
    }

    if (buildUserView.screen === "cleaning") {
      return (
        <>
          <div className="wd-home-hub-bar">
            <button type="button" className="wd-home-hub-bar__btn" onClick={onBackToHome}>
              ← Household home
            </button>
          </div>
          <Suspense fallback={<AppLoading />}>
            <CleaningRouter
              page={buildUserView.page}
              roomSlug={buildUserView.roomSlug}
              onNavigate={onNavigatePath}
            />
          </Suspense>
          <AppliedUiSection />
        </>
      );
    }

    return (
      <>
        <div
          className={`wd-home-hub-bar${
            isShoppingModule ? " wd-home-hub-bar--shopping" : ""
          }`}
        >
          {isShoppingModule ? (
            <ModuleHubDateTime />
          ) : (
            <button type="button" className="wd-home-hub-bar__btn" onClick={onBackToHome}>
              ← Household home
            </button>
          )}
        </div>
        <CurrentBuild
          key={`${buildUserView.moduleId}:${buildUserView.path}`}
        />
        <AppliedUiSection />
      </>
    );
  }
  return (
    <Suspense fallback={<AppLoading />}>
      <BackendConsolePage />
    </Suspense>
  );
}

function App() {
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "cards") {
    return (
      <HelpModeProvider>
        <HubCardsExample />
      </HelpModeProvider>
    );
  }

  const initialShell = resolveAppShellFromHref();
  const [activeView, setActiveView] = useState<AppShellView>(initialShell.activeView);
  const [buildUserView, setBuildUserView] = useState<MyBuildUserView>(initialShell.buildUserView);
  const [, setExpandedByCategory] = useState(() => loadMyBuildExpandedCategories());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => loadMyBuildSidebarCollapsed());
  const [adminNavEnabled, setAdminNavEnabledState] = useState(() => isAdminNavEnabled());

  const activePageId = resolveAppNavActivePageId({ activeView, buildUserView });
  const showAdminSwitcher = adminNavEnabled || activeView === "backend";
  const showFullAppLink =
    activeView === "build" &&
    (buildUserView.screen === "home" || buildUserView.screen === "planned");

  useEffect(() => {
    function handlePopState() {
      const next = resolveAppShellFromHref(readAppLocationHref());
      setActiveView(next.activeView);
      setBuildUserView(next.buildUserView);
      setAdminNavEnabledState(isAdminNavEnabled());
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (isAdminNavEnabled()) {
      setAdminNavEnabledState(true);
    }
  }, []);

  useEffect(() => {
    const categoryId = findAppNavCategoryForPage(activePageId);
    if (!categoryId) {
      return;
    }
    setExpandedByCategory((current) => {
      if (current[categoryId] !== false) {
        return current;
      }
      const next = { ...current, [categoryId]: true };
      saveMyBuildExpandedCategories(next);
      return next;
    });
  }, [activePageId]);

  const backToHome = useCallback(() => {
    window.history.pushState(null, "", "/");
    setBuildUserView({ screen: "home" });
    setActiveView("build");
  }, []);

  const openHomeCard = useCallback((cardId: HomeDashboardCardId) => {
    const target = resolveHomeCardNavigation(cardId);
    if (target.kind === "planned") {
      setBuildUserView({
        screen: "planned",
        moduleId: target.moduleId,
        pageLabel: target.pageLabel,
      });
      setActiveView("build");
      return;
    }
    window.history.pushState(null, "", target.path);
    setBuildUserView({
      screen: "module",
      moduleId: target.moduleId,
      path: target.path,
    });
    setActiveView("build");
  }, []);

  const openOriginalBuild = useCallback(() => {
    window.history.pushState(null, "", "/");
    setBuildUserView({ screen: "module", moduleId: "home", path: "/" });
    setActiveView("build");
  }, []);

  const handleViewChange = useCallback((view: AppShellView) => {
    if (view === "build") {
      setBuildUserView(INITIAL_BUILD_USER_VIEW);
      window.history.pushState(null, "", "/");
    } else {
      window.history.pushState(null, "", "/admin/backend");
    }
    setActiveView(view);
  }, []);

  const backToHouseholdFromAdmin = useCallback(() => {
    setActiveView("build");
    setBuildUserView(INITIAL_BUILD_USER_VIEW);
    window.history.pushState(null, "", "/");
  }, []);

  const navigateAppPage = useCallback((pageId: string) => {
    const target = applyAppNavPageNavigation(pageId);
    if (!target) {
      return;
    }
    window.history.pushState(null, "", target.historyPath);
    setActiveView(target.activeView);
    setBuildUserView(target.buildUserView);
  }, []);

  const navigateByPath = useCallback((path: string) => {
    const pathname = path.split("?")[0]?.split("#")[0] ?? path;
    const cleaning = resolveCleaningFromPathname(pathname);
    if (cleaning) {
      window.history.pushState(null, "", pathname);
      setActiveView("build");
      setBuildUserView({
        screen: "cleaning",
        page: cleaning.page,
        roomSlug: cleaning.roomSlug,
      });
      return;
    }
    if (pathname === "/chores") {
      window.history.pushState(null, "", "/chores");
      setActiveView("build");
      setBuildUserView({ screen: "chores" });
    }
  }, []);

  const handleSidebarCollapsedChange = useCallback((collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    saveMyBuildSidebarCollapsed(collapsed);
  }, []);

  return (
    <HelpModeProvider>
      <div className="wd-integrated-app">
        {activeView === "backend" ? (
          <AdminShellBar onBackToHousehold={backToHouseholdFromAdmin} />
        ) : (
          <MyBuildTopBar
            activeView={activeView}
            onViewChange={handleViewChange}
            showAdminSwitcher={showAdminSwitcher}
            showFullAppLink={showFullAppLink}
            onOpenFullApp={openOriginalBuild}
          />
        )}
        {activeView === "build" ? (
          <KioskShell
            activeNav={resolveKioskNavFromBuildView(buildUserView)}
            householdName="Family Hub"
            onNavigate={(nav) => navigateKioskNavMyBuild(nav, navigateAppPage)}
            sidebarCollapsed={sidebarCollapsed}
            onSidebarCollapsedChange={handleSidebarCollapsedChange}
            onScanFallback={() => navigateAppPage("scan-product")}
            onAddFallback={() => navigateAppPage("home")}
            className="wd-my-build-kiosk-shell"
          >
            <main className="wd-my-build-main wd-my-build-shell min-h-0">
              <AppRoutes
                activeView={activeView}
                buildUserView={buildUserView}
                onOpenHomeCard={openHomeCard}
                onOpenOriginalBuild={openOriginalBuild}
                onBackToHome={backToHome}
                onNavigatePath={navigateByPath}
                sidebarCollapsed={sidebarCollapsed}
              />
            </main>
          </KioskShell>
        ) : (
          <AppRoutes
            activeView={activeView}
            buildUserView={buildUserView}
            onOpenHomeCard={openHomeCard}
            onOpenOriginalBuild={openOriginalBuild}
            onBackToHome={backToHome}
            onNavigatePath={navigateByPath}
            sidebarCollapsed={sidebarCollapsed}
          />
        )}
      </div>
    </HelpModeProvider>
  );
}

export default App;
