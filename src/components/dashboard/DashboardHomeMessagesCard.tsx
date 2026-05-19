import { Bell, ChevronRight } from "lucide-react";
import type { FamilyData } from "../../data/familyData";
import { selectImportantMessagesForDashboardHomeView } from "../../lib/familyDataSelectors";
import {
  SMARTHR_HUB_EMPTY_WELL,
  SMARTHR_HUB_LINK_ACCENT,
  SMARTHR_HUB_MSG_BELL_MUTED,
  SMARTHR_HUB_MSG_BELL_PRIMARY,
  SMARTHR_HUB_PIN_LABEL,
  SMARTHR_HUB_SURFACE_MUTED,
  SMARTHR_HUB_SURFACE_PRIMARY,
  SMARTHR_HUB_TITLE_MUTED,
  SMARTHR_TITLE,
} from "../../lib/smarthrUi";
import { cn } from "../../lib/utils";
import { hubCardClass, hubCardTitleClass, hubMutedClass } from "./hub/dashboardHubTokens";

type Props = {
  data: FamilyData;
  navigateWithinApp?: (href: string) => void;
  /** When set, only messages authored by or mentioning this member. */
  filterMemberId?: string;
};

/**
 * Messages-only home tile — no pets (Pets stay off Home per product rules).
 */
export function DashboardHomeMessagesCard({ data, navigateWithinApp, filterMemberId }: Props) {
  const rows = selectImportantMessagesForDashboardHomeView(data, filterMemberId, 5);

  if (rows.length === 0) {
    return (
      <section className={hubCardClass} aria-labelledby="home-important-msgs">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 id="home-important-msgs" className={hubCardTitleClass}>
            Important messages
          </h2>
          <button type="button" className={cn(SMARTHR_HUB_LINK_ACCENT, "inline-flex items-center gap-1")} onClick={() => navigateWithinApp?.("/messages")}>
            Open Messages
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <p className={SMARTHR_HUB_EMPTY_WELL}>
          {filterMemberId
            ? "No important messages mentioning this person right now."
            : "No important messages right now."}
        </p>
      </section>
    );
  }

  return (
    <section className={hubCardClass} aria-labelledby="home-important-msgs">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="home-important-msgs" className={hubCardTitleClass}>
          Important messages
        </h2>
        <button
          type="button"
          className={cn(SMARTHR_HUB_LINK_ACCENT, "inline-flex items-center gap-1")}
          onClick={() => navigateWithinApp?.("/messages")}
        >
          Open Messages
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <ul className="space-y-2">
        {rows.map(({ item: m, primary }) => (
          <li
            key={m.id}
            className={cn("flex gap-2", primary ? SMARTHR_HUB_SURFACE_PRIMARY : SMARTHR_HUB_SURFACE_MUTED)}
          >
            <Bell
              className={cn("mt-0.5 h-4 w-4 shrink-0", primary ? SMARTHR_HUB_MSG_BELL_PRIMARY : SMARTHR_HUB_MSG_BELL_MUTED)}
              aria-hidden
            />
            <div className="min-w-0">
              <p
                className={cn(
                  "text-[15px] font-semibold leading-snug",
                  primary ? SMARTHR_TITLE : SMARTHR_HUB_TITLE_MUTED,
                )}
              >
                {m.title?.trim() || "Message"}
                {m.pinned ? <span className={SMARTHR_HUB_PIN_LABEL}>Pinned</span> : null}
              </p>
              <p className={cn(hubMutedClass, "mt-0.5 line-clamp-2 text-[14px]")}>
                {m.message.trim()}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
