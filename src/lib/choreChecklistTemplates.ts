import type {
  CleaningRoomTaskGroupFrequency,
  FamilyData,
  Task,
  TaskFrequency,
} from "../data/familyData";
import {
  CLEANING_PLAYBOOK_STARTERS,
  type CleaningPlaybookCanonicalId,
} from "../data/cleaningPlaybookTemplates";
import { createChoreFromSeed, type ChoreSeed } from "./choreSeeds";

export type ChoreChecklistBundleId = "nox" | "jeremiah" | "noxJeremiah";

export type ChoreChecklistTemplateRow = {
  id: string;
  title: string;
  /** Match roster first name, or empty string for Family (unassigned). */
  assigneeFirstName: string;
  frequency: TaskFrequency;
  category: "nox-reset" | "jeremiah-deep-clean";
};

function cleaningGroupFreqToTaskFreq(f: CleaningRoomTaskGroupFrequency | undefined): TaskFrequency {
  if (f === "daily") {
    return "daily";
  }
  if (f === "weekly") {
    return "weekly";
  }
  if (f === "monthly") {
    return "monthly";
  }
  if (f === "quarterly") {
    return "quarterly";
  }
  return "as-needed";
}

function playbookTaskRows(input: {
  roomIds: CleaningPlaybookCanonicalId[];
  category: ChoreChecklistTemplateRow["category"];
  assigneeFirstName: string;
  allowGroupFreq: Set<CleaningRoomTaskGroupFrequency>;
}): ChoreChecklistTemplateRow[] {
  const out: ChoreChecklistTemplateRow[] = [];
  for (const roomId of input.roomIds) {
    const room = CLEANING_PLAYBOOK_STARTERS[roomId];
    for (const g of room.taskGroups) {
      const gf = g.frequency ?? "custom";
      if (!input.allowGroupFreq.has(gf)) {
        continue;
      }
      g.tasks.forEach((t, i) => {
        out.push({
          id: `chore-pb-${roomId}-${g.id}-${i}`,
          title: `${t.title} (${room.name})`,
          assigneeFirstName: input.assigneeFirstName,
          frequency: cleaningGroupFreqToTaskFreq(gf),
          category: input.category,
        });
      });
    }
  }
  return out;
}

/** Nox reset — quick resets from Laundry + Entry playbooks (same tasks as Cleaning Hub). */
export const NOX_RESET_CHORE_TEMPLATES: ChoreChecklistTemplateRow[] = playbookTaskRows({
  roomIds: ["room-laundry", "room-entry"],
  category: "nox-reset",
  assigneeFirstName: "Nox",
  allowGroupFreq: new Set<CleaningRoomTaskGroupFrequency>(["daily", "weekly"]),
});

/** Jeremiah deep clean — bathroom + kitchen weekly/monthly playbook tasks. */
export const JEREMIAH_DEEP_CLEAN_CHORE_TEMPLATES: ChoreChecklistTemplateRow[] = playbookTaskRows({
  roomIds: ["room-bathroom", "room-kitchen"],
  category: "jeremiah-deep-clean",
  assigneeFirstName: "Jeremiah",
  allowGroupFreq: new Set<CleaningRoomTaskGroupFrequency>(["weekly", "monthly"]),
});

export function templatesForBundle(bundle: ChoreChecklistBundleId): ChoreChecklistTemplateRow[] {
  if (bundle === "nox") {
    return NOX_RESET_CHORE_TEMPLATES;
  }
  if (bundle === "jeremiah") {
    return JEREMIAH_DEEP_CLEAN_CHORE_TEMPLATES;
  }
  return [...NOX_RESET_CHORE_TEMPLATES, ...JEREMIAH_DEEP_CLEAN_CHORE_TEMPLATES];
}

function memberIdForTemplateAssignee(
  members: FamilyData["familyMembers"],
  assigneeFirstName: string,
): string {
  const key = assigneeFirstName.trim().toLowerCase();
  if (!key || key === "family") {
    return "";
  }
  const hit = members.find((m) => {
    const first = m.name.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
    return first === key;
  });
  return hit?.id ?? "";
}

function rowToSeed(row: ChoreChecklistTemplateRow, todayIso: string): ChoreSeed {
  return {
    id: row.id,
    title: row.title,
    type: "chore",
    frequency: row.frequency,
    category: row.category,
    status: "Not Started",
    dueDate: todayIso,
    nextDueDate: todayIso,
    source: "seed",
    sourceSystem: "chore-checklist-template",
  };
}

/**
 * Append template chores that are not already present (by id). Does not remove or reset anything.
 */
export function appendChoreChecklistTemplates(
  data: FamilyData,
  bundle: ChoreChecklistBundleId,
  todayIso: string,
): Task[] {
  const existing = new Set(data.tasks.map((t) => t.id));
  const additions: Task[] = [];

  for (const row of templatesForBundle(bundle)) {
    if (existing.has(row.id)) {
      continue;
    }
    const seed = rowToSeed(row, todayIso);
    seed.assignedMemberId = memberIdForTemplateAssignee(data.familyMembers, row.assigneeFirstName);
    additions.push(createChoreFromSeed(seed, data.familyMembers, { id: row.id, today: todayIso }));
    existing.add(row.id);
  }

  return additions;
}
