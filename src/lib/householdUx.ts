import type { FamilyMember } from "../data/familyData";

export function buildFriendlyGreeting(
  now: Date,
  member: FamilyMember | undefined,
  householdFallback = "Family",
): string {
  const h = now.getHours();
  const segment =
    h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  if (!member) {
    return `${segment}, ${householdFallback}`;
  }
  const first = member.name.trim().split(/\s+/)[0] ?? member.name;
  return `${segment}, ${first}`;
}

/** Hide admin-heavy destinations for younger profiles (heuristic by age group / role label). */
export function isRestrictedHouseholdMember(member: FamilyMember | undefined): boolean {
  if (!member) {
    return false;
  }
  const age = (member.ageGroup ?? "").toLowerCase();
  const role = (member.roleLabel ?? member.role ?? "").toLowerCase();
  return age === "child" || role === "child";
}
