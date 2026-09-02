import type { FamilyData, Task } from "../data/familyData";
import { applyChoreToggleComplete, type ChoreToggleCompleteOutcome } from "../household/actions";
import type { HouseholdCapability } from "./types";

export type ChoresCompleteInput = {
  task: Task;
  todayIso: string;
};

export const choresCompleteCapability: HouseholdCapability<
  ChoresCompleteInput,
  ChoreToggleCompleteOutcome
> = {
  id: "chores.complete",
  execute(data: FamilyData, input: ChoresCompleteInput) {
    return applyChoreToggleComplete(data, input.task, input.todayIso);
  },
};
