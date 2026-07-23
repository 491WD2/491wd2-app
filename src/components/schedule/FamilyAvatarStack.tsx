import type { FamilyMember } from "../../data/familyData";
import { getMemberColor } from "../../lib/memberColors";
import { cn, getMemberFullName, getMemberInitials } from "../../lib/utils";

export type FamilyAvatarStackProps = {
  members: FamilyMember[];
  selectedId?: string | "all";
  onSelect?: (id: string | "all") => void;
  showAllChip?: boolean;
  max?: number;
  className?: string;
};

/** Compact family member avatar chips for toolbar filters. */
export function FamilyAvatarStack({
  members,
  selectedId = "all",
  onSelect,
  showAllChip = true,
  max = 8,
  className,
}: FamilyAvatarStackProps) {
  const visible = members.slice(0, max);

  return (
    <div className={cn("fh-sched-avatars", className)} role="group" aria-label="Family members">
      {showAllChip ? (
        <button
          type="button"
          className={cn(
            "fh-sched-avatar fh-sched-avatar--all",
            selectedId === "all" && "fh-sched-avatar--active",
          )}
          aria-pressed={selectedId === "all"}
          onClick={() => onSelect?.("all")}
        >
          Family
        </button>
      ) : null}
      {visible.map((member) => {
        const color = getMemberColor(member);
        const active = selectedId === member.id;
        return (
          <button
            key={member.id}
            type="button"
            title={getMemberFullName(member)}
            aria-label={getMemberFullName(member)}
            aria-pressed={active}
            className={cn("fh-sched-avatar", active && "fh-sched-avatar--active")}
            style={{ background: `${color}22`, color }}
            onClick={() => onSelect?.(member.id)}
          >
            {getMemberInitials(member)}
          </button>
        );
      })}
    </div>
  );
}
