import { Bell, Plus, ScanLine } from "lucide-react";
import { useEffect, useState } from "react";
import type { FamilyMember } from "../../data/familyData";
import type { DashboardHomeViewScope } from "../../lib/dashboardHomeViewStorage";
import { cn } from "../../lib/utils";
import {
  SMARTHR_DASH_HOME_CARD,
  SMARTHR_DASH_HOME_SCOPE_DIVIDER,
  SMARTHR_DASH_ICON_BTN,
  SMARTHR_DASH_ICON_MUTED,
  SMARTHR_DASH_MEMBER_CHIP,
  SMARTHR_DASH_MEMBER_NAME,
  SMARTHR_DASH_PILL_CAPTION,
  SMARTHR_DASH_QUICK_ADD_BTN,
  SMARTHR_DASH_STATUS_DATE,
  SMARTHR_DASH_STATUS_TIME,
  SMARTHR_DASH_STATUS_WELL,
  SMARTHR_DASH_TOOL_BTN,
  SMARTHR_GRADIENT_PRIMARY_INLINE,
} from "../../lib/smarthrUi";
import { useOpenQuickActions } from "./quickActionsOpenerContext";
import { DashboardHomeMemberScopePicker } from "./DashboardHomeMemberLanding";

const CLOCK_TICK_MS = 30_000;

type Props = {
  greeting: string;
  householdName: string;
  notificationCount: number;
  activeMemberLabel?: string;
  variant?: "embedded" | "full";
  navigateWithinApp?: (href: string) => void;
  onNotificationsClick: () => void;
  onSwitchUser?: () => void;
  onLockScreen?: () => void;
  restrictChildNavigation?: boolean;
  showQuickAdd?: boolean;
  showScanItem?: boolean;
  /** When set, Family + member names render centered in this hero card; scope changes persist via parent. */
  scopePicker?: {
    activeScope: DashboardHomeViewScope;
    members: FamilyMember[];
    onScopeChange: (scope: DashboardHomeViewScope) => void;
  };
};

/**
 * Home top card: centered Family + member scope, date/time status row, compact Quick Add / Scan / notifications.
 */
export function DashboardHomeTopBar({
  greeting,
  householdName,
  notificationCount,
  activeMemberLabel,
  variant: _variant = "embedded",
  navigateWithinApp,
  onNotificationsClick,
  onSwitchUser,
  onLockScreen,
  restrictChildNavigation,
  showQuickAdd = true,
  showScanItem = true,
  scopePicker,
}: Props) {
  const openQuickActions = useOpenQuickActions();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  const dateLine = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(now);

  const timeLine = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(now);

  function handleQuickAdd() {
    if (restrictChildNavigation || !navigateWithinApp) {
      return;
    }
    openQuickActions();
  }

  return (
    <div
      className={cn(
        SMARTHR_DASH_HOME_CARD,
        "flex flex-col gap-0",
      )}
    >
      <h1 className="sr-only">
        {greeting} — {householdName}
      </h1>

      {scopePicker ? (
        <DashboardHomeMemberScopePicker
          activeScope={scopePicker.activeScope}
          members={scopePicker.members}
          onScopeChange={scopePicker.onScopeChange}
        />
      ) : null}

      <div
        className={cn(
          SMARTHR_DASH_HOME_SCOPE_DIVIDER,
          "flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3",
          !scopePicker && "mt-0 border-t-0 pt-0",
        )}
      >
        <div className={SMARTHR_DASH_STATUS_WELL}>
          <p className={SMARTHR_DASH_STATUS_DATE}>{dateLine}</p>
          <p className={SMARTHR_DASH_STATUS_TIME}>{timeLine}</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-end sm:gap-2">
          {navigateWithinApp && !restrictChildNavigation && showQuickAdd ? (
            <button
              type="button"
              onClick={handleQuickAdd}
              aria-label="Open quick actions"
              className={SMARTHR_DASH_QUICK_ADD_BTN}
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              Quick Add
            </button>
          ) : null}

          {navigateWithinApp && !restrictChildNavigation && showScanItem ? (
            <button
              type="button"
              onClick={() => navigateWithinApp("/pantry?tab=scan")}
              aria-label="Open scan item"
              className={cn(SMARTHR_DASH_TOOL_BTN, "gap-1.5 text-[13px]")}
            >
              <ScanLine className={cn("h-4 w-4 shrink-0", SMARTHR_DASH_ICON_MUTED)} aria-hidden />
              Scan
            </button>
          ) : null}

          <button
            type="button"
            aria-label={`Notifications, ${notificationCount} unread`}
            onClick={onNotificationsClick}
            className={SMARTHR_DASH_ICON_BTN}
          >
            <Bell className="h-[17px] w-[17px]" aria-hidden />
            {notificationCount > 0 ? (
              <span
                className={cn(
                  "absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow-sm",
                  SMARTHR_GRADIENT_PRIMARY_INLINE,
                )}
              >
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            ) : null}
          </button>

          {activeMemberLabel ? (
            <div className={SMARTHR_DASH_MEMBER_CHIP}>
              <span className={SMARTHR_DASH_MEMBER_NAME} title={activeMemberLabel}>
                {activeMemberLabel}
              </span>
              <span className={SMARTHR_DASH_PILL_CAPTION}>Active</span>
            </div>
          ) : null}

          {onSwitchUser ? (
            <button
              type="button"
              onClick={onSwitchUser}
              aria-label="Switch user"
              className={SMARTHR_DASH_TOOL_BTN}
            >
              Switch user
            </button>
          ) : null}
          {onLockScreen ? (
            <button type="button" onClick={onLockScreen} aria-label="Lock screen" className={SMARTHR_DASH_TOOL_BTN}>
              Lock
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
