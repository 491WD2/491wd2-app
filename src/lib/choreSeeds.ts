import type {
  FamilyMember,
  Priority,
  Task,
  TaskFrequency,
  TaskSource,
  TaskStatus,
} from "../data/familyData";

export type ChoreSeed = {
  id?: string;
  title: string;
  type?: "chore";
  frequency?: TaskFrequency;
  zone?: string;
  room?: string;
  category?: string;
  assignedMemberId?: string;
  status?: TaskStatus;
  dueDate?: string;
  nextDueDate?: string;
  lastCompletedDate?: string;
  notes?: string;
  lastCompletedByMemberId?: string;
  owner?: string;
  priority?: Priority;
  source?: TaskSource;
  sourceSystem?: string;
};

type CreateChoreOptions = {
  id?: string;
  today?: string;
};

export function createChoreFromSeed(
  seed: ChoreSeed,
  existingMembers: FamilyMember[],
  options: CreateChoreOptions = {},
): Task {
  const today = options.today ?? new Date().toISOString().slice(0, 10);
  const dueDate = seed.dueDate || seed.nextDueDate || today;
  const assignedMember = existingMembers.find(
    (member) => member.status === "active" && member.id === seed.assignedMemberId,
  );

  return {
    id: options.id ?? seed.id ?? crypto.randomUUID(),
    title: seed.title,
    owner: assignedMember?.name ?? seed.owner ?? "Family",
    status: normalizeSeedStatus(seed.status),
    priority: seed.priority ?? "Medium",
    dueDate,
    type: "chore",
    frequency: seed.frequency ?? "weekly",
    lastCompletedDate: seed.lastCompletedDate ?? "",
    nextDueDate: seed.nextDueDate ?? dueDate,
    assignedMemberId: assignedMember?.id ?? "",
    zone: seed.zone,
    room: seed.room,
    category: seed.category,
    notes: seed.notes,
    lastCompletedByMemberId: seed.lastCompletedByMemberId,
    source: seed.source ?? "seed",
    sourceSystem: seed.sourceSystem,
  };
}

function normalizeSeedStatus(status?: TaskStatus) {
  if (status === "Completed") {
    return "Done";
  }
  return status === "Today" ||
    status === "In Progress" ||
    status === "Done" ||
    status === "Not Started"
    ? status
    : "Not Started";
}
