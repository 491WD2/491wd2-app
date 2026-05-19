import type {
  ActivityEntityType,
  ActivityLogItem,
  ActivityType,
  FamilyData,
} from "../data/familyData";

export const ACTIVITY_LOG_LIMIT = 200;

export type ActivityInput = {
  type: ActivityType;
  entityType: ActivityEntityType;
  entityId: string;
  entityTitle?: string;
  memberId?: string;
  message: string;
};

export function createActivity(
  data: FamilyData,
  activityInput: ActivityInput,
): FamilyData {
  const activity: ActivityLogItem = {
    ...activityInput,
    id: crypto.randomUUID(),
    entityTitle: sanitizeActivityText(
      activityInput.entityTitle || activityInput.message || "Household item",
    ),
    message: sanitizeActivityText(activityInput.message),
    createdAt: new Date().toISOString(),
  };

  return {
    ...data,
    activityLog: [activity, ...(data.activityLog ?? [])].slice(
      0,
      ACTIVITY_LOG_LIMIT,
    ),
  };
}

export function getRecentActivity(data: FamilyData, limit = 5) {
  return [...(data.activityLog ?? [])]
    .filter((activity) => activity.message)
    .sort((a, b) => getActivityTime(b.createdAt) - getActivityTime(a.createdAt))
    .slice(0, limit);
}

function sanitizeActivityText(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 140);
}

function getActivityTime(value?: string) {
  if (!value) {
    return 0;
  }

  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}
