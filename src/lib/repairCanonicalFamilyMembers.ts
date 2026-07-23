import type { FamilyMember } from "../data/familyData";
import {
  CANONICAL_HOUSEHOLD_ROSTER_NAMES,
  memberColorThemes,
} from "../data/familyData";

const REPAIR_COLOR_THEMES: (typeof memberColorThemes)[number][] = [
  "rose",
  "blue",
  "purple",
  "green",
  "orange",
  "emerald",
];

/** Legacy demo labels → canonical names (case-insensitive match on `name`). */
const DEMO_NAME_RENAMES: Record<string, string> = {
  mom: "Lorraine",
  dad: "Hershel",
  herschel: "Hershel",
  avery: "Stella",
};

const CANONICAL_LOWER = new Set(
  CANONICAL_HOUSEHOLD_ROSTER_NAMES.map((n) => n.toLowerCase()),
);

function otherMemberHasName(
  members: FamilyMember[],
  excludeId: string,
  targetName: string,
): boolean {
  const t = targetName.trim().toLowerCase();
  return members.some(
    (m) => m.id !== excludeId && m.name.trim().toLowerCase() === t,
  );
}

export type RepairFamilyMembersResult = {
  members: FamilyMember[];
  addedNames: string[];
  renamed: Array<{ from: string; to: string; id: string }>;
  clearedAnimalIcons: number;
};

/**
 * Safe roster repair: rename Mom/Dad/Herschel/Avery → Lorraine/Hershel/Stella when no name
 * conflict; clear `animalIcon` on canonical members; append missing canonical names
 * (including Selena). Member IDs are preserved; no other `FamilyData` fields are modified here.
 */
export function repairCanonicalFamilyMembers(
  existing: FamilyMember[],
): RepairFamilyMembersResult {
  const renamed: Array<{ from: string; to: string; id: string }> = [];
  const now = new Date().toISOString();
  const next: FamilyMember[] = existing.map((m) => ({ ...m }));

  for (let i = 0; i < next.length; i++) {
    const member = next[i];
    const key = member.name.trim().toLowerCase();
    const target = DEMO_NAME_RENAMES[key];
    if (!target) {
      continue;
    }
    if (otherMemberHasName(next, member.id, target)) {
      continue;
    }
    renamed.push({ from: member.name.trim(), to: target, id: member.id });
    next[i] = { ...member, name: target, updatedAt: now };
  }

  let clearedAnimalIcons = 0;
  for (let i = 0; i < next.length; i++) {
    const member = next[i];
    const isCanonical = CANONICAL_LOWER.has(member.name.trim().toLowerCase());
    if (!isCanonical || !member.animalIcon) {
      continue;
    }
    clearedAnimalIcons += 1;
    next[i] = { ...member, animalIcon: undefined, updatedAt: now };
  }

  const present = new Set(
    next.map((m) => m.name.trim().toLowerCase()).filter(Boolean),
  );
  const addedNames: string[] = [];

  CANONICAL_HOUSEHOLD_ROSTER_NAMES.forEach((expected, index) => {
    const key = expected.toLowerCase();
    if (present.has(key)) {
      return;
    }
    const id = crypto.randomUUID();
    next.push({
      id,
      name: expected,
      status: "active",
      colorTheme: REPAIR_COLOR_THEMES[index] ?? "slate",
      notes: "",
      updatedAt: now,
    });
    present.add(key);
    addedNames.push(expected);
  });

  return { members: next, addedNames, renamed, clearedAnimalIcons };
}
