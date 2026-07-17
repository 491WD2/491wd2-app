import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { DASH_CARD, DASH_PAGE_BG } from "../../lib/dashboardPremiumTokens";
import {
  wrkAccentRailClassName,
  wrkEyebrowClassName,
  wrkHeroBandClassName,
  wrkMetricCellClassName,
  wrkPanelClassName,
  wrkSupportingTextClassName,
  wrkPageTitleClassName,
  wrkTableClassName,
  wrkTableWrapClassName,
} from "./workspaceDesign";

type WorkspaceMetric = {
  label: string;
  value: ReactNode;
};

type WorkspaceTab<T extends string> = {
  id: T;
  label: string;
};

/** Dark graphite surfaces for kitchen / shopping modules. */
export type ModuleWorkspaceTone = "light" | "premiumDark";

/** Outer stack spacing for workspace module pages (use inside routed main content). */
export function WorkspacePageShell({
  children,
  className,
  tone = "light",
}: {
  children: ReactNode;
  className?: string;
  tone?: ModuleWorkspaceTone;
}) {
  return (
    <div
      className={cn(
        "w-full min-w-0 space-y-5 sm:space-y-6",
        tone === "premiumDark" && cn(DASH_PAGE_BG, "rounded-2xl p-4 sm:p-6"),
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Scrollable shell for data tables / database views. */
export function WorkspaceTableWrap({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(wrkTableWrapClassName, className)}>{children}</div>;
}

/** @deprecated Use wrkTableClassName import from workspaceDesign — alias maintained */
export const workspaceTableClassName = wrkTableClassName;

/** Form blocks inside drawers and inline editors (calendar, tasks, member edit). */
export const workspaceFormSectionClassName =
  "motion-card rounded-[24px] border border-white/[0.16] bg-white/[0.07] p-4 text-slate-100 shadow-[0_16px_44px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.11)] backdrop-blur-xl sm:p-5";

export function WorkspaceFormPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(workspaceFormSectionClassName, className)}>{children}</div>;
}

/** Filter / dense form row region below the main action bar. */
export function WorkspaceFilterBar({
  children,
  className,
  tone = "light",
}: {
  children: ReactNode;
  className?: string;
  tone?: ModuleWorkspaceTone;
}) {
  const dark = tone === "premiumDark";
  return (
    <section
      className={cn(
        "motion-panel rounded-lg border p-4 sm:p-5",
        dark
          ? "border-white/10 bg-[#141922]/90 shadow-lg shadow-black/25 ring-1 ring-white/[0.06]"
          : "rounded-[24px] border-white/[0.16] bg-white/[0.07] text-slate-100 shadow-[0_16px_44px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.11)] backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function ModuleWorkspaceHeader({
  eyebrow,
  title,
  description,
  metrics,
  action,
  tone = "light",
}: {
  eyebrow: string;
  title: string;
  description: string;
  metrics?: WorkspaceMetric[];
  action?: ReactNode;
  tone?: ModuleWorkspaceTone;
}) {
  const dark = tone === "premiumDark";
  return (
    <section
      className={cn(
        "motion-panel overflow-hidden rounded-lg",
        dark ? cn(DASH_CARD, "shadow-black/30") : wrkPanelClassName,
      )}
    >
      <div
        className={cn(
          "p-5 sm:p-7 lg:px-8 lg:pb-8 lg:pt-7",
          dark ? "bg-transparent" : wrkHeroBandClassName,
        )}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={cn(wrkAccentRailClassName, dark && "bg-sky-400/50")}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className={cn(wrkEyebrowClassName, dark && "text-slate-500")}>{eyebrow}</p>
            <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
              <div className="min-w-0 max-w-[56rem] flex-1">
                <h1 className={cn(wrkPageTitleClassName, dark && "text-slate-50")}>{title}</h1>
                <p
                  className={cn(
                    "mt-2.5 max-w-[46rem]",
                    dark ? "text-slate-400" : wrkSupportingTextClassName,
                  )}
                >
                  {description}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-end lg:flex-col lg:items-end">
                {action ? (
                  <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">{action}</div>
                ) : null}
                {metrics && metrics.length > 0 ? (
                  <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:max-w-[460px] sm:grid-cols-4">
                    {metrics.map((metric) => (
                      <SummaryTile
                        key={metric.label}
                        label={metric.label}
                        tone={tone}
                        value={metric.value}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ModuleActionBar({
  children,
  tone = "light",
  className,
}: {
  children: ReactNode;
  tone?: ModuleWorkspaceTone;
  className?: string;
}) {
  const dark = tone === "premiumDark";
  return (
    <section
      className={cn(
        "motion-panel rounded-lg px-4 py-3.5 sm:px-5",
        dark
          ? cn(DASH_CARD, "shadow-black/25")
          : "rounded-[24px] border border-white/[0.16] bg-white/[0.07] text-slate-100 shadow-[0_16px_44px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.11)] backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function ModuleSubnav<T extends string>({
  tabs,
  activeTab,
  onChange,
  tone = "light",
  showSelection = true,
}: {
  tabs: WorkspaceTab<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
  tone?: ModuleWorkspaceTone;
  /** When false, no tab appears selected (e.g. user is on an advanced sub-view). */
  showSelection?: boolean;
}) {
  const dark = tone === "premiumDark";
  return (
    <nav
      className={cn(
        "flex gap-0.5 overflow-x-auto rounded-lg p-1",
        dark
          ? "border border-white/10 bg-[#0d141c] shadow-inner shadow-black/40"
          : "rounded-2xl border border-slate-200/85 bg-slate-50/95 shadow-inner",
      )}
    >
      {tabs.map((tab) => (
        <button
          className={cn(
            "motion-tab min-h-10 whitespace-nowrap rounded-xl border border-transparent px-3.5 text-sm font-semibold transition",
            dark
              ? showSelection && activeTab === tab.id
                ? "bg-white/12 text-slate-50"
                : "text-slate-500 hover:bg-white/[0.06] hover:text-slate-200"
              : showSelection && activeTab === tab.id
                ? "motion-tab-active text-slate-900"
                : "text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900",
          )}
          key={tab.id}
          onClick={() => onChange(tab.id)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export function WorkspacePanel({
  title,
  eyebrow,
  children,
  tone = "light",
  className,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
  tone?: ModuleWorkspaceTone;
  className?: string;
}) {
  const dark = tone === "premiumDark";
  return (
    <section
      className={cn(
        "motion-panel rounded-2xl p-4 sm:p-5",
        dark
          ? cn(DASH_CARD, "shadow-black/30")
          : "border border-slate-200 bg-white shadow-sm ring-1 ring-slate-950/[0.04]",
        className,
      )}
    >
      <SectionHeader eyebrow={eyebrow} title={title} tone={tone} />
      {children}
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  tone = "light",
}: {
  eyebrow: string;
  title: string;
  tone?: ModuleWorkspaceTone;
}) {
  const dark = tone === "premiumDark";
  return (
    <div className={cn("mb-4 border-b pb-3", dark ? "border-white/10" : "border-slate-200")}>
      <p className={cn(wrkEyebrowClassName, dark && "text-slate-500")}>{eyebrow}</p>
      <h2
        className={cn(
          "mt-1 text-base font-semibold tracking-tight",
          dark ? "text-slate-100" : "text-slate-900",
        )}
      >
        {title}
      </h2>
    </div>
  );
}

export function SummaryTile({
  label,
  value,
  tone = "light",
}: {
  label: string;
  value: ReactNode;
  tone?: ModuleWorkspaceTone;
}) {
  const dark = tone === "premiumDark";
  return (
    <div
      className={cn(
        "motion-card p-3 sm:p-3.5",
        dark
          ? "rounded-xl border border-white/10 bg-white/[0.04]"
          : cn(wrkMetricCellClassName),
      )}
    >
      <p
        className={cn(
          "text-[0.68rem] font-semibold uppercase tracking-[0.12em]",
          dark ? "text-slate-500" : "text-slate-600",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 text-lg font-semibold tabular-nums sm:text-xl",
          dark ? "text-slate-50" : "text-slate-950",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function EmptyStatePanel({
  title,
  text,
  action,
  tone = "light",
}: {
  title?: string;
  text: string;
  action?: ReactNode;
  tone?: ModuleWorkspaceTone;
}) {
  const dark = tone === "premiumDark";
  return (
    <div
      className={cn(
        "motion-panel rounded-2xl border border-dashed px-4 py-6 text-center text-sm leading-relaxed sm:px-5 sm:text-left",
        dark
          ? "border-white/15 bg-white/[0.03] text-slate-400"
          : "border-slate-300 bg-slate-50 text-slate-600",
      )}
    >
      {title ? (
        <p className={cn("font-semibold", dark ? "text-slate-200" : "text-slate-900")}>{title}</p>
      ) : null}
      <p className={title ? "mt-2" : ""}>{text}</p>
      {action ? (
        <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">{action}</div>
      ) : null}
    </div>
  );
}

/** Section heading + optional padded panel (use flush when embedding full-width tables). */
export function WorkspaceRoutedSection({
  id,
  title,
  subtitle,
  children,
  flush = false,
  tone = "light",
}: {
  id?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  flush?: boolean;
  tone?: ModuleWorkspaceTone;
}) {
  const dark = tone === "premiumDark";
  return (
    <section className="space-y-3" id={id}>
      <div>
        <h2
          className={cn(
            "text-base font-semibold tracking-tight",
            dark ? "text-slate-100" : "text-slate-900",
          )}
        >
          {title}
        </h2>
        {subtitle ? (
          <p
            className={cn(
              "mt-1 text-sm leading-relaxed",
              dark ? "text-slate-400" : "text-slate-600",
            )}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      {flush ? (
        children
      ) : (
        <div
          className={cn(
            "p-4 sm:p-5",
            dark ? cn(DASH_CARD, "shadow-black/25") : wrkPanelClassName,
          )}
        >
          {children}
        </div>
      )}
    </section>
  );
}
