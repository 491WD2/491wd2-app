import { useCallback, useEffect, useMemo, useState } from "react";
import BackendConsoleShell from "../components/BackendConsoleShell";
import UiLayoutRenderer from "../components/UiLayoutRenderer";
import BuildPageWizardPage from "./BuildPageWizardPage";
import BuilderDemoPage from "./BuilderDemoPage";
import HelpCenterPage from "./HelpCenterPage";
import LayoutChoicesPage from "./LayoutChoicesPage";
import PageComposerPage from "./PageComposerPage";
import ReferencePagesPage from "./ReferencePagesPage";
import TemplateWorkbenchPage from "./TemplateWorkbenchPage";
import UiBuilderPage from "../UiBuilderPage";
import {
  BACKEND_CONSOLE_NAV_GROUPS,
  findNavItem,
  findNavGroupIdForItem,
  findNavLocation,
  loadBackendConsoleActiveView,
  loadBackendConsoleExpandedGroups,
  loadBackendConsoleSidebarCollapsed,
  saveBackendConsoleActiveView,
  saveBackendConsoleExpandedGroups,
  saveBackendConsoleSidebarCollapsed,
  type BackendConsoleWiredView,
} from "../lib/backendConsoleNav";

function BackendPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="wd-bc-placeholder">
      <h2 className="wd-bc-placeholder__title">{title}</h2>
      <p className="wd-bc-placeholder__body">{description}</p>
      <p className="wd-bc-placeholder__muted">Coming soon / not wired yet.</p>
    </div>
  );
}

function renderWiredView(
  wired: Exclude<BackendConsoleWiredView, "ui-builder">,
  onSelectBackendView: (viewId: string) => void,
) {
  switch (wired) {
    case "build-page-wizard":
      return <BuildPageWizardPage onSelectBackendView={onSelectBackendView} />;
    case "builder-demo-lab":
      return <BuilderDemoPage />;
    case "page-composer":
      return <PageComposerPage />;
    case "saved-preview":
      return <UiLayoutRenderer />;
    case "help-center":
      return <HelpCenterPage />;
    case "layout-choices":
      return <LayoutChoicesPage onSelectBackendView={onSelectBackendView} />;
    case "reference-pages":
      return <ReferencePagesPage />;
    case "template-workbench":
      return <TemplateWorkbenchPage />;
    default:
      return null;
  }
}

export default function BackendConsolePage() {
  const [activeView, setActiveView] = useState(() => loadBackendConsoleActiveView());
  const [expandedByGroup, setExpandedByGroup] = useState(() => loadBackendConsoleExpandedGroups());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => loadBackendConsoleSidebarCollapsed());

  const selectView = useCallback((id: string) => {
    setActiveView(id);
    saveBackendConsoleActiveView(id);
  }, []);

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedByGroup((prev) => {
      const expanded = prev[groupId] !== false;
      const next = { ...prev, [groupId]: !expanded };
      saveBackendConsoleExpandedGroups(next);
      return next;
    });
  }, []);

  const setSidebarCollapsedPersisted = useCallback((collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    saveBackendConsoleSidebarCollapsed(collapsed);
  }, []);

  useEffect(() => {
    const groupId = findNavGroupIdForItem(activeView);
    if (!groupId) {
      return;
    }
    setExpandedByGroup((prev) => {
      if (prev[groupId] !== false) {
        return prev;
      }
      const next = { ...prev, [groupId]: true };
      saveBackendConsoleExpandedGroups(next);
      return next;
    });
  }, [activeView]);

  const main = useMemo(() => {
    const item = findNavItem(activeView);
    if (item?.wired === "ui-builder" || item?.uiBuilderPalette) {
      return <UiBuilderPage palettePreset={item?.uiBuilderPalette ?? null} embedded />;
    }
    if (item?.wired) {
      return renderWiredView(item.wired, selectView);
    }
    if (item) {
      return <BackendPlaceholder title={item.label} description={item.description} />;
    }
    return <BackendPlaceholder title="Unknown view" description="Select an item from the sidebar." />;
  }, [activeView, selectView]);

  const headerContext = useMemo(() => {
    const loc = findNavLocation(activeView);
    if (loc) {
      const breadcrumb = `Backend Console / ${loc.group.label} / ${loc.item.label}`;
      return {
        sectionTitle: loc.item.label,
        sectionDescription: loc.item.description,
        breadcrumb,
      };
    }
    return {
      sectionTitle: "Backend Console",
      sectionDescription: "Select a section from the sidebar to open a tool or document.",
      breadcrumb: "Backend Console",
    };
  }, [activeView]);

  return (
    <BackendConsoleShell
      navGroups={BACKEND_CONSOLE_NAV_GROUPS}
      activeView={activeView}
      onSelectView={selectView}
      expandedByGroup={expandedByGroup}
      onToggleGroup={toggleGroup}
      sidebarCollapsed={sidebarCollapsed}
      onSidebarCollapsedChange={setSidebarCollapsedPersisted}
      main={main}
      sectionTitle={headerContext.sectionTitle}
      sectionDescription={headerContext.sectionDescription}
      breadcrumb={headerContext.breadcrumb}
    />
  );
}
