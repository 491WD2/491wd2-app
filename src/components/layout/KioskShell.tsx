import { useCallback, useState, type ReactNode } from "react";
import { cn } from "../../lib/utils";
import type { KioskNavId } from "../../lib/kioskShellConfig";
import { KioskShellProvider } from "./KioskShellContext";
import { KioskSidebar } from "./KioskSidebar";
import { KioskHeader, type KioskHeaderMember } from "./KioskHeader";
import "./kiosk-shell.css";

export type KioskShellProps = {
  activeNav: KioskNavId;
  householdName: string;
  children: ReactNode;
  onNavigate: (nav: KioskNavId) => void;
  members?: KioskHeaderMember[];
  activeMemberId?: string | null;
  onMemberChange?: (memberId: string) => void;
  sidebarCollapsed?: boolean;
  onSidebarCollapsedChange?: (collapsed: boolean) => void;
  hiddenNav?: KioskNavId[];
  className?: string;
  onScanFallback?: () => void;
  onAddFallback?: () => void;
};

/**
 * Unified kiosk dashboard chrome — warm shell, sidebar, header, white content panel.
 */
export function KioskShell({
  activeNav,
  householdName,
  children,
  onNavigate,
  members,
  activeMemberId,
  onMemberChange,
  sidebarCollapsed: sidebarCollapsedProp,
  onSidebarCollapsedChange,
  hiddenNav,
  className,
  onScanFallback,
  onAddFallback,
}: KioskShellProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const collapsed = sidebarCollapsedProp ?? internalCollapsed;

  const toggleCollapsed = useCallback(() => {
    const next = !collapsed;
    onSidebarCollapsedChange?.(next);
    if (sidebarCollapsedProp === undefined) {
      setInternalCollapsed(next);
    }
  }, [collapsed, onSidebarCollapsedChange, sidebarCollapsedProp]);

  return (
    <KioskShellProvider>
      <div
        className={cn(
          "fh-kiosk-shell",
          collapsed && "fh-kiosk-shell--collapsed",
          className,
        )}
      >
        {mobileOpen ? (
          <button
            type="button"
            className="fh-kiosk-shell__backdrop"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}

        <div className="fh-kiosk-shell__grid">
          <KioskSidebar
            activeNav={activeNav}
            householdName={householdName}
            collapsed={collapsed}
            mobileOpen={mobileOpen}
            onNavigate={onNavigate}
            onToggleCollapsed={toggleCollapsed}
            onCloseMobile={() => setMobileOpen(false)}
            hiddenNav={hiddenNav}
          />

          <div className="fh-kiosk-shell__main">
            <div className="fh-kiosk-shell__panel">
              <KioskHeader
                onOpenMenu={() => setMobileOpen(true)}
                members={members}
                activeMemberId={activeMemberId}
                onMemberChange={onMemberChange}
                onScanFallback={onScanFallback}
                onAddFallback={onAddFallback}
              />
              <div className="fh-kiosk-shell__panel-body">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </KioskShellProvider>
  );
}
