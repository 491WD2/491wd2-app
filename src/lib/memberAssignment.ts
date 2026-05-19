import type { FamilyMember } from "../data/familyData";
import { getMemberFullName } from "./utils";

/** Shown when a stored member id no longer exists in the roster. */
export const UNKNOWN_ASSIGNED_MEMBER_LABEL = "Former member";

export function syntheticAssignedMember(memberId: string): FamilyMember {
  return {
    id: memberId,
    name: UNKNOWN_ASSIGNED_MEMBER_LABEL,
    status: "archived",
    colorTheme: "slate",
    notes: "",
  };
}

/**
 * Active members first, then any roster members tied to `referencedMemberIds`, then
 * synthetic rows for unknown ids — so assignments stay visible after someone is archived or removed.
 */
export function membersForAssignmentSelect(
  allMembers: FamilyMember[],
  ...referencedMemberIds: Array<string | undefined | null>
): FamilyMember[] {
  const idSet = new Set<string>();
  for (const raw of referencedMemberIds) {
    const id = raw?.trim();
    if (id) idSet.add(id);
  }

  const byId = new Map(allMembers.map((m) => [m.id, m]));
  const active = allMembers
    .filter((m) => m.status === "active")
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  const included = new Set(active.map((m) => m.id));
  const extras: FamilyMember[] = [];

  for (const id of idSet) {
    if (included.has(id)) continue;
    const member = byId.get(id);
    if (member) {
      extras.push(member);
      included.add(id);
    } else {
      extras.push(syntheticAssignedMember(id));
      included.add(id);
    }
  }

  extras.sort((a, b) => a.name.localeCompare(b.name));
  return [...active, ...extras];
}

export function resolveAssignmentMember(
  roster: FamilyMember[],
  memberId: string | undefined | null,
): FamilyMember | undefined {
  if (!memberId?.trim()) return undefined;
  return roster.find((m) => m.id === memberId);
}

export function ownerLabelForAssignment(
  roster: FamilyMember[],
  memberId: string | undefined | null,
  fallback = "Family",
): string {
  const m = resolveAssignmentMember(roster, memberId);
  if (m) return getMemberFullName(m);
  return fallback;
}

/** Everyone who should appear in task/shopping person filters: active roster plus anyone currently assigned on records. */
export function membersReferencedByTasks(
  allMembers: FamilyMember[],
  tasks: Array<{ assignedMemberId?: string }>,
): FamilyMember[] {
  return membersForAssignmentSelect(
    allMembers,
    ...tasks.map((t) => t.assignedMemberId),
  );
}
