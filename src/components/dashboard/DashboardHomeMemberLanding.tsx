import type { FamilyMember } from "../../data/familyData";
import { CANONICAL_HOUSEHOLD_ROSTER_NAMES } from "../../data/familyData";
import { cn, getMemberFullName } from "../../lib/utils";
import { getMemberColor, rgbaFromHex } from "../../lib/memberColors";
import type { DashboardHomeViewScope } from "../../lib/dashboardHomeViewStorage";
import { DASHBOARD_LAYOUT_SCOPE_FAMILY } from "../../lib/dashboardLayoutPreferences";
import { SMARTHR_FOCUS_RING_ACCENT_50, SMARTHR_TITLE, SMARTHR_UI_COLORS } from "../../lib/smarthrUi";

type Props = {
  activeScope: DashboardHomeViewScope;
  onScopeChange: (scope: DashboardHomeViewScope) => void;
  members: FamilyMember[];
};

function sortActiveMembersForHome(members: FamilyMember[]): FamilyMember[] {
  const order = new Map(
    CANONICAL_HOUSEHOLD_ROSTER_NAMES.map((name, index) => [name.toLowerCase(), index]),
  );
  return [...members]
    .filter((m) => m.status === "active")
    .sort((a, b) => {
      const fa = a.name.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
      const fb = b.name.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
      const ia = order.has(fa) ? order.get(fa)! : 100;
      const ib = order.has(fb) ? order.get(fb)! : 100;
      if (ia !== ib) {
        return ia - ib;
      }
      return getMemberFullName(a).localeCompare(getMemberFullName(b));
    });
}

/**
 * Family + member scope tabs for Home — persists via parent calling `writeDashboardHomeViewScope` only.
 * Renders **without** an outer card; embed inside {@link DashboardHomeTopBar}.
 */
export function DashboardHomeMemberScopePicker({ activeScope, onScopeChange, members }: Props) {
  const sorted = sortActiveMembersForHome(members);

  return (
    <div
      className="flex flex-wrap items-baseline justify-center gap-x-5 gap-y-3 px-2 py-2 sm:gap-x-8 sm:gap-y-4 sm:px-4 sm:py-3"
      aria-label="Choose whose home dashboard to show"
      role="tablist"
    >
      <ScopeTab
        label="Family"
        selected={activeScope === DASHBOARD_LAYOUT_SCOPE_FAMILY}
        onSelect={() => onScopeChange(DASHBOARD_LAYOUT_SCOPE_FAMILY)}
        accentHex="var(--fs-primary, #F26522)"
      />
      {sorted.map((m) => {
        const label = getMemberFullName(m).trim().split(/\s+/)[0] || getMemberFullName(m);
        const hex = getMemberColor(m);
        return (
          <ScopeTab
            key={m.id}
            label={label}
            selected={activeScope === m.id}
            onSelect={() => onScopeChange(m.id)}
            accentHex={hex}
          />
        );
      })}
    </div>
  );
}

function ScopeTab({
  label,
  selected,
  onSelect,
  accentHex,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  accentHex: string;
}) {
  const isCssVar = accentHex.startsWith("var(");
  const dotStyle = isCssVar
    ? { background: SMARTHR_UI_COLORS.primary }
    : { backgroundColor: accentHex, boxShadow: `0 0 0 2px ${rgbaFromHex(accentHex, 0.35)}` };

  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        "group flex flex-col items-center gap-2 rounded-[5px] px-2 py-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        SMARTHR_FOCUS_RING_ACCENT_50,
        selected ? "opacity-100" : "opacity-85 hover:opacity-100",
      )}
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full transition group-hover:scale-110 sm:h-3 sm:w-3"
        style={dotStyle}
        aria-hidden
      />
      <span
        className={cn(
          "text-center font-bold leading-none tracking-tight",
          "text-[clamp(1.05rem,3.8vw,1.85rem)]",
          SMARTHR_TITLE,
          selected && "underline decoration-[3px] underline-offset-[0.35em]",
        )}
        style={
          selected && !isCssVar
            ? { textDecorationColor: accentHex }
            : selected && isCssVar
              ? { textDecorationColor: SMARTHR_UI_COLORS.primary }
              : undefined
        }
      >
        {label}
      </span>
    </button>
  );
}
