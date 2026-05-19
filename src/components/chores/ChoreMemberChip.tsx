import type { CSSProperties } from "react";
import { CHORE_MEMBER_COLORS } from "../../lib/choreTheme";
import { choreCn, choreTw } from "../../lib/choreUi";
import type { HouseholdMember } from "../../types/chore";

export function ChoreMemberChip({
  member,
  selected,
  onSelect,
}: {
  member: HouseholdMember;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const color = CHORE_MEMBER_COLORS[member] ?? "#735DFF";
  if (!onSelect) {
    return (
      <span
        className="wd-chore-hh__member"
        style={{ "--member-color": color } as CSSProperties}
      >
        <span className="wd-chore-hh__member-dot" aria-hidden />
        {member}
      </span>
    );
  }
  return (
    <button
      type="button"
      className={choreCn(
        selected ? "wd-chore-hh__member wd-chore-hh__member--active" : "wd-chore-hh__member",
        choreTw.focusRing,
      )}
      style={{ "--member-color": color } as CSSProperties}
      onClick={onSelect}
      aria-pressed={Boolean(selected)}
      aria-label={`Show ${member}'s chores${selected ? ", selected" : ""}`}
    >
      <span className="wd-chore-hh__member-dot" aria-hidden />
      {member}
    </button>
  );
}
