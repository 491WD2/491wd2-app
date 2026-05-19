import { Bell } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type {
  FamilyData,
  HouseholdNotification,
  HouseholdNotificationType,
} from "../../data/familyData";
import { dedupeNotificationsForDisplay } from "../../lib/householdNotify";
import type { DashboardInboxMode } from "../../lib/dashboardCommandCenterFilters";
import { notificationMatchesDashboardInbox } from "../../lib/dashboardCommandCenterFilters";
import { cn, getMemberFullName } from "../../lib/utils";
import { HOME_PANEL } from "../../lib/designSystem";
import {
  SMARTHR_BODY,
  SMARTHR_BORDER_TOP,
  SMARTHR_CARD,
  SMARTHR_HUB_ALERT_COUNT_BADGE,
  SMARTHR_HUB_ALERT_DISMISS,
  SMARTHR_HUB_ALERT_HEADER,
  SMARTHR_HUB_ALERT_ICON_WRAP,
  SMARTHR_HUB_ALERT_ROW_DEFAULT,
  SMARTHR_HUB_ALERT_ROW_READ,
  SMARTHR_HUB_ALERT_VIEW_ALL,
  SMARTHR_TITLE,
} from "../../lib/smarthrUi";
import { Button } from "../ui/Button";

function notificationKindLabel(type: HouseholdNotificationType): string {
  switch (type) {
    case "inventory_low":
      return "Low stock";
    case "inventory_out":
      return "Out of stock";
    case "shopping_added":
      return "Shopping list";
    case "message":
      return "Message";
    case "kitchen_duty":
      return "Kitchen duty";
    case "pet_flea_med_due":
      return "Pets";
    case "chore_due":
      return "Chores";
    case "calendar_reminder":
      return "Calendar";
    default:
      return "Alert";
  }
}

function formatAlertTime(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return iso;
    }
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  } catch {
    return iso;
  }
}

export function HouseholdAlertsPanel({
  data,
  setData,
  currentMemberId,
  className,
  premiumDark,
  maxItems = 8,
  excludeTypes,
  onViewAll,
  viewAllLabel = "View all",
  /** Default `session` — signed-in member + broadcasts. `household` = all active. `targetMember` = that member + broadcasts. */
  inboxMode,
  targetMemberId,
}: {
  data: FamilyData;
  setData: Dispatch<SetStateAction<FamilyData>>;
  currentMemberId?: string;
  className?: string;
  premiumDark?: boolean;
  maxItems?: number;
  /** Optional filter when the same notification type is surfaced in another panel on the same page. */
  excludeTypes?: HouseholdNotificationType[];
  onViewAll?: () => void;
  viewAllLabel?: string;
  inboxMode?: DashboardInboxMode;
  targetMemberId?: string;
}) {
  const rawMine = data.notifications.filter((n) =>
    notificationMatchesDashboardInbox(n, inboxMode, currentMemberId, targetMemberId),
  );
  const mine = dedupeNotificationsForDisplay(rawMine).filter(
    (n) => !excludeTypes?.includes(n.type),
  );
  const unread = mine.filter((n) => !n.readAt);
  const sorted = [...mine].sort((a, b) => {
    const au = a.readAt ? 1 : 0;
    const bu = b.readAt ? 1 : 0;
    if (au !== bu) {
      return au - bu;
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
  const latest = sorted.slice(0, maxItems);
  const hasMore = sorted.length > maxItems;
  const compactHome = Boolean(premiumDark && maxItems <= 4);

  function dismiss(id: string) {
    const now = new Date().toISOString();
    setData((d) => ({
      ...d,
      notifications: d.notifications.map((n) =>
        n.id === id ? { ...n, dismissedAt: n.dismissedAt ?? now } : n,
      ),
    }));
  }

  function markRead(id: string) {
    const now = new Date().toISOString();
    setData((d) => ({
      ...d,
      notifications: d.notifications.map((n) =>
        n.id === id ? { ...n, readAt: n.readAt ?? now } : n,
      ),
    }));
  }

  function markAllRead() {
    const now = new Date().toISOString();
    setData((d) => ({
      ...d,
      notifications: d.notifications.map((n) =>
        notificationMatchesDashboardInbox(n, inboxMode, currentMemberId, targetMemberId)
          ? { ...n, readAt: n.readAt ?? now }
          : n,
      ),
    }));
  }

  return (
    <div
      className={cn(
        premiumDark ? cn(HOME_PANEL, "p-4") : cn(SMARTHR_CARD, "px-3 py-3"),
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bell className={cn("h-4 w-4", premiumDark ? "text-slate-400" : SMARTHR_BODY)} aria-hidden />
          <p className={cn(premiumDark ? "text-[15px] font-semibold tracking-tight text-[#CBD5E1]" : SMARTHR_HUB_ALERT_HEADER)}>
            Notifications
          </p>
          {mine.length > 0 ? (
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-[13px] font-semibold tabular-nums",
                premiumDark
                  ? "border border-white/10 bg-white/[0.05] text-[#94A3B8]"
                  : SMARTHR_HUB_ALERT_COUNT_BADGE,
              )}
            >
              {mine.length} active
            </span>
          ) : null}
          {!premiumDark && unread.length > 0 ? (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-bold text-amber-950">
              {unread.length} unread
            </span>
          ) : null}
        </div>
        {!compactHome && unread.length > 0 ? (
          <Button type="button" variant="ghost" className="min-h-10 px-3 text-xs" onClick={markAllRead}>
            Mark all read
          </Button>
        ) : null}
      </div>
      {latest.length === 0 ? (
        <div
          className={cn(
            "mt-3 flex flex-col items-center text-center",
            premiumDark ? "text-slate-400" : SMARTHR_BODY,
          )}
        >
          <div
            className={
              premiumDark
                ? "flex h-10 w-10 items-center justify-center rounded-[10px] border border-white/10 bg-white/[0.04] text-slate-400"
                : SMARTHR_HUB_ALERT_ICON_WRAP
            }
          >
            <Bell className="h-5 w-5" aria-hidden />
          </div>
          <p className={cn("mt-3 text-sm font-semibold", premiumDark ? "text-slate-200" : SMARTHR_TITLE)}>
            No urgent alerts.
          </p>
          <p className={cn("mt-1 text-sm", premiumDark ? "text-slate-400" : SMARTHR_BODY)}>
            You&apos;re all caught up.
          </p>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {latest.map((n: HouseholdNotification) => {
            const recipient = data.familyMembers.find((m) => m.id === n.recipientMemberId);
            const timeLabel = formatAlertTime(n.createdAt);
            const tone = premiumDark
                ? !n.readAt
                  ? n.type === "inventory_out"
                    ? "border-rose-500/35 bg-rose-500/10 text-rose-50"
                    : n.type === "inventory_low"
                      ? "border-amber-500/35 bg-amber-500/10 text-amber-50"
                      : n.type === "pet_flea_med_due"
                        ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-50"
                        : "border-sky-500/25 bg-sky-500/10 text-sky-50"
                  : "border-white/[0.08] bg-white/[0.03] text-slate-400"
              : !n.readAt
                ? n.type === "inventory_out"
                  ? "border-rose-200 bg-rose-50/95 text-rose-950"
                  : n.type === "inventory_low"
                    ? "border-amber-200 bg-amber-50/95 text-amber-950"
                    : n.type === "shopping_added"
                      ? "border-sky-200 bg-sky-50/95 text-sky-950"
                      : SMARTHR_HUB_ALERT_ROW_DEFAULT
                : SMARTHR_HUB_ALERT_ROW_READ;
            return (
              <li
                key={n.id}
                className={cn(
                  "rounded-[8px] border px-3 py-2 text-[15px] leading-snug",
                  tone,
                  compactHome && "py-2",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className={cn("font-semibold leading-snug", compactHome && "text-sm")}>
                    {n.title}
                  </p>
                  <button
                    type="button"
                    aria-label={`Dismiss notification: ${n.title}`}
                    className={cn(
                      premiumDark
                        ? "min-h-10 shrink-0 rounded-[8px] px-3 py-2 text-[0.65rem] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/50 focus-visible:ring-offset-2 text-slate-200 hover:bg-white/10 hover:text-white focus-visible:ring-offset-[#101720]"
                        : SMARTHR_HUB_ALERT_DISMISS,
                    )}
                    onClick={() => dismiss(n.id)}
                  >
                    Dismiss
                  </button>
                </div>
                <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-wide opacity-95">
                  {notificationKindLabel(n.type)}
                  <span className="font-normal normal-case opacity-90">
                    {" "}
                    — {n.readAt ? "Read" : "Unread"}
                  </span>
                </p>
                <p className={cn("mt-0.5 text-[0.65rem]", premiumDark ? "text-slate-400" : SMARTHR_BODY)}>
                  {timeLabel}
                </p>
                {!compactHome ? (
                  recipient ? (
                    <p className="mt-0.5 text-[0.65rem] font-medium opacity-90">
                      For {getMemberFullName(recipient)}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[0.65rem] font-medium opacity-90">Household</p>
                  )
                ) : null}
                {n.body?.trim() ? (
                  <p
                    className={cn(
                      "mt-1 text-xs leading-snug opacity-95",
                      compactHome ? "line-clamp-1" : "line-clamp-2",
                    )}
                  >
                    {n.body}
                  </p>
                ) : null}
                {!compactHome ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {!n.readAt ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-10 px-3 text-xs"
                        onClick={() => markRead(n.id)}
                      >
                        Mark read
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      {hasMore && onViewAll ? (
        <div
          className={cn(
            "mt-4 border-t pt-3",
            premiumDark ? "border-white/[0.08]" : SMARTHR_BORDER_TOP,
          )}
        >
          <Button
            type="button"
            variant="secondary"
            className={cn(
              premiumDark
                ? "min-h-10 w-full rounded-[10px] text-[15px] font-semibold border-white/[0.12] bg-white/[0.06] text-[#F8FAFC]"
                : SMARTHR_HUB_ALERT_VIEW_ALL,
            )}
            onClick={onViewAll}
          >
            {viewAllLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
