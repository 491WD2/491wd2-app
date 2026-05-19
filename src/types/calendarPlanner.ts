import type { PlannerEvent, Task } from "../data/familyData";

/** Planning board item kinds — no meal planning. */
export type PlannerItemKind = "chore" | "food" | "inventory" | "event" | "reminder";

export type PlannerBoardItem = {
  id: string;
  kind: PlannerItemKind;
  dateIso: string;
  title: string;
  subtitle: string;
  emoji: string;
  memberIds: string[];
  sourceId: string;
  draggable: boolean;
  overdue?: boolean;
  plannerEvent?: PlannerEvent;
  task?: Task;
  pantryId?: string;
  notificationId?: string;
};

export type PlannerTypeFilter = PlannerItemKind | "all";
