import type {
  FamilyData,
  FamilyMember,
  TaskFrequency,
} from "../data/familyData";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatShortDate(value?: string) {
  return safeDateLabel(value);
}

export function getActiveMembers(data: FamilyData) {
  return data.familyMembers.filter((member) => member.status === "active");
}

export function findMemberById(data: FamilyData, memberId?: string) {
  if (!memberId) {
    return undefined;
  }

  return data.familyMembers.find((member) => member.id === memberId);
}

export function getMemberDisplay(member?: FamilyMember) {
  if (!member) {
    return "Unassigned";
  }

  return getMemberFullName(member);
}

/** Primary label for UI: always the legal/display name, never initials-only. */
export function getMemberFullName(member?: Pick<FamilyMember, "name">) {
  const raw = member?.name?.trim() ?? "";
  return raw.length > 0 ? raw : "Unnamed member";
}

export function getMemberInitials(member?: Pick<FamilyMember, "name">) {
  const name = member?.name?.trim() ?? "";
  if (!name) {
    return "--";
  }

  const parts = name.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function getMemberAvatarLabel(member?: Pick<FamilyMember, "name">) {
  return getMemberInitials(member);
}

export function isDueToday(value?: string) {
  const date = parseLocalDate(value);

  if (!date) {
    return false;
  }

  const today = parseLocalDate(new Date().toISOString().slice(0, 10));
  return today ? date.getTime() === today.getTime() : false;
}

export function isOverdue(value?: string) {
  const date = parseLocalDate(value);

  if (!date) {
    return false;
  }

  const today = parseLocalDate(new Date().toISOString().slice(0, 10));
  return today ? date.getTime() < today.getTime() : false;
}

export function addDays(value: string, count: number) {
  const date = parseLocalDate(value);

  if (!date) {
    return value;
  }

  date.setDate(date.getDate() + count);
  return toDateInputValue(date);
}

export function addMonths(value: string, count: number) {
  const date = parseLocalDate(value);

  if (!date) {
    return value;
  }

  date.setMonth(date.getMonth() + count);
  return toDateInputValue(date);
}

export function getNextDueDate(value: string, frequency: TaskFrequency) {
  if (frequency === "daily") {
    return addDays(value, 1);
  }

  if (frequency === "weekly") {
    return addDays(value, 7);
  }

  if (frequency === "monthly") {
    return addMonths(value, 1);
  }

  if (frequency === "quarterly") {
    return addMonths(value, 3);
  }

  if (frequency === "as-needed") {
    return value;
  }

  return value;
}

export function groupBy<T, K extends string | number | symbol>(
  list: T[],
  keyFn: (item: T) => K,
) {
  return list.reduce(
    (groups, item) => {
      const key = keyFn(item);
      groups[key] = [...(groups[key] ?? []), item];
      return groups;
    },
    {} as Record<K, T[]>,
  );
}

export function safeDateLabel(value?: string) {
  if (!value) {
    return "No date";
  }

  const date = parseLocalDate(value);

  if (!date) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function parseLocalDate(value?: string) {
  if (!value) {
    return undefined;
  }

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = dateOnly
    ? new Date(
        Number(dateOnly[1]),
        Number(dateOnly[2]) - 1,
        Number(dateOnly[3]),
      )
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

function toDateInputValue(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
