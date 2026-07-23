/**
 * Lebanon Community Schools 2026–27 + household activities/travel pack.
 * Additive only — merge via {@link mergeHouseholdCalendarIntoData}; never wipes planner.
 */
import type {
  FamilyData,
  FamilyMember,
  PlannerEvent,
  PlannerEventCategory,
  PlannerStickyColor,
} from "../data/familyData";
import { repairCanonicalFamilyMembers } from "./repairCanonicalFamilyMembers";

export const HOUSEHOLD_CALENDAR_PACK_MARKER_ID = "plan-pack-lebanon-2026-27";

type SeedDraft = {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  category: PlannerEventCategory;
  memberNames: string[];
  tags?: string[];
  notes?: string;
  location?: string;
  isAllDay?: boolean;
  isTentative?: boolean;
  noSchoolReason?: string;
  stickyColor?: PlannerStickyColor;
  repeatEnabled?: boolean;
  repeatRule?: PlannerEvent["repeatRule"];
};

function resolveMembers(members: FamilyMember[], names: string[]) {
  const found: FamilyMember[] = [];
  for (const name of names) {
    const match = members.find(
      (m) => m.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );
    if (match) found.push(match);
  }
  return found;
}

function fingerprint(event: Pick<PlannerEvent, "title" | "date" | "category" | "assignedPerson">): string {
  return [
    (event.title ?? "").trim().toLowerCase(),
    (event.date ?? "").slice(0, 10),
    (event.category ?? "").trim().toLowerCase(),
    (event.assignedPerson ?? "").trim().toLowerCase(),
  ].join("|");
}

function noSchool(
  id: string,
  date: string,
  reason: string,
  stickyColor: PlannerStickyColor,
): SeedDraft {
  return {
    id,
    title: "No School",
    date,
    time: "",
    startTime: "",
    isAllDay: true,
    category: "No School",
    memberNames: [],
    tags: ["school", "no-school"],
    noSchoolReason: reason,
    stickyColor,
    notes: reason,
  };
}

/** Stable seed drafts (member IDs resolved at merge time). */
export function buildHouseholdCalendarSeedDrafts(): SeedDraft[] {
  const school: SeedDraft[] = [
    noSchool("plan-school-noschool-2026-08-31", "2026-08-31", "Staff In-Service / Preparation", "yellow"),
    noSchool("plan-school-noschool-2026-09-01", "2026-09-01", "Staff In-Service / Preparation", "yellow"),
    noSchool("plan-school-noschool-2026-09-02", "2026-09-02", "Staff In-Service / Preparation", "yellow"),
    noSchool("plan-school-noschool-2026-09-03", "2026-09-03", "Staff In-Service / Preparation", "yellow"),
    noSchool("plan-school-noschool-2026-09-04", "2026-09-04", "Staff In-Service / Preparation", "yellow"),
    noSchool("plan-school-noschool-2026-09-07", "2026-09-07", "Holiday / Labor Day", "dark"),
    {
      id: "plan-school-first-2026-09-09",
      title: "First Day of School",
      date: "2026-09-09",
      time: "",
      startTime: "",
      isAllDay: true,
      category: "School",
      memberNames: [],
      tags: ["school"],
      noSchoolReason: "First day",
      stickyColor: "green",
      notes: "First day of school — Lebanon Community Schools 2026–2027",
    },
    noSchool("plan-school-noschool-2026-11-04", "2026-11-04", "Staff In-Service / Preparation", "yellow"),
    noSchool("plan-school-noschool-2026-11-05", "2026-11-05", "Conferences", "blue"),
    noSchool("plan-school-noschool-2026-11-06", "2026-11-06", "Conferences", "blue"),
    noSchool("plan-school-noschool-2026-11-11", "2026-11-11", "Holiday / Veterans Day", "dark"),
    noSchool("plan-school-noschool-2026-11-25", "2026-11-25", "Thanksgiving Break", "dark"),
    noSchool("plan-school-noschool-2026-11-26", "2026-11-26", "Thanksgiving Break", "dark"),
    noSchool("plan-school-noschool-2026-11-27", "2026-11-27", "Thanksgiving Break", "dark"),
    noSchool("plan-school-noschool-2026-12-21", "2026-12-21", "Winter Break", "dark"),
    noSchool("plan-school-noschool-2026-12-22", "2026-12-22", "Winter Break", "dark"),
    noSchool("plan-school-noschool-2026-12-23", "2026-12-23", "Winter Break", "dark"),
    noSchool("plan-school-noschool-2026-12-24", "2026-12-24", "Winter Break", "dark"),
    noSchool("plan-school-noschool-2026-12-25", "2026-12-25", "Winter Break / Holiday", "dark"),
    noSchool("plan-school-noschool-2026-12-28", "2026-12-28", "Winter Break", "dark"),
    noSchool("plan-school-noschool-2026-12-29", "2026-12-29", "Winter Break", "dark"),
    noSchool("plan-school-noschool-2026-12-30", "2026-12-30", "Winter Break", "dark"),
    noSchool("plan-school-noschool-2026-12-31", "2026-12-31", "Winter Break", "dark"),
    noSchool("plan-school-noschool-2027-01-01", "2027-01-01", "Winter Break / New Year’s Day", "dark"),
    noSchool("plan-school-noschool-2027-01-18", "2027-01-18", "Holiday / Martin Luther King Jr. Day", "dark"),
    noSchool("plan-school-noschool-2027-02-01", "2027-02-01", "Staff In-Service / Preparation", "yellow"),
    noSchool("plan-school-noschool-2027-02-02", "2027-02-02", "Staff In-Service / Preparation", "yellow"),
    noSchool("plan-school-noschool-2027-02-15", "2027-02-15", "Holiday / Presidents Day", "dark"),
    noSchool("plan-school-noschool-2027-03-22", "2027-03-22", "Spring Break", "dark"),
    noSchool("plan-school-noschool-2027-03-23", "2027-03-23", "Spring Break", "dark"),
    noSchool("plan-school-noschool-2027-03-24", "2027-03-24", "Spring Break", "dark"),
    noSchool("plan-school-noschool-2027-03-25", "2027-03-25", "Spring Break", "dark"),
    noSchool("plan-school-noschool-2027-03-26", "2027-03-26", "Spring Break", "dark"),
    noSchool("plan-school-noschool-2027-04-14", "2027-04-14", "Staff In-Service / Preparation", "yellow"),
    noSchool("plan-school-noschool-2027-04-15", "2027-04-15", "Conferences", "blue"),
    noSchool("plan-school-noschool-2027-04-16", "2027-04-16", "Conferences", "blue"),
    noSchool("plan-school-noschool-2027-05-28", "2027-05-28", "No School", "dark"),
    noSchool("plan-school-noschool-2027-05-31", "2027-05-31", "Holiday / Memorial Day", "dark"),
    {
      id: "plan-school-last-2027-06-15",
      title: "Last Day of School",
      date: "2027-06-15",
      time: "",
      startTime: "",
      isAllDay: true,
      category: "School",
      memberNames: [],
      tags: ["school"],
      noSchoolReason: "Last day",
      stickyColor: "green",
      notes: "Last day of school — Lebanon Community Schools 2026–2027",
    },
    noSchool("plan-school-noschool-2027-06-16", "2027-06-16", "Staff In-Service / Preparation", "yellow"),
  ];

  const activities: SeedDraft[] = [
    {
      id: "plan-nox-horses-weekly",
      title: "Nox — Horses",
      date: "2026-07-24",
      time: "16:30",
      startTime: "16:30",
      category: "Activity",
      memberNames: ["Nox"],
      tags: ["activity"],
      repeatEnabled: true,
      repeatRule: "Weekly",
      notes: "Horses every Friday at 4:30 PM",
    },
    {
      id: "plan-jeremiah-bowling-weekly",
      title: "Jeremiah — Bowling",
      date: "2026-07-22",
      time: "18:30",
      startTime: "18:30",
      category: "Activity",
      memberNames: ["Jeremiah"],
      tags: ["activity"],
      repeatEnabled: true,
      repeatRule: "Weekly",
      notes: "Bowling every Wednesday at 6:30 PM",
    },
    {
      id: "plan-jeremiah-band-midvalley-2026",
      title: "Jeremiah Band Camp — Mid Valley Band Camp",
      date: "2026-07-27",
      endDate: "2026-07-31",
      time: "08:00",
      startTime: "08:00",
      endTime: "16:00",
      category: "Activity",
      memberNames: ["Jeremiah"],
      tags: ["activity", "school", "band", "camp"],
      location:
        "Albany Performing Arts Center, West Albany High School campus, 1975 Liberty Street SW, Albany, Oregon",
      notes:
        "Mid Valley Band Camp at West Albany High School campus. Daily band camp with rehearsals, masterclasses, lunch, recreation, and sectionals.",
    },
    {
      id: "plan-jeremiah-band-2026-08-12",
      title: "Jeremiah Band Camp — Incoming 9th graders & new marchers",
      date: "2026-08-12",
      time: "08:30",
      startTime: "08:30",
      endTime: "16:00",
      category: "Activity",
      memberNames: ["Jeremiah"],
      tags: ["activity", "school", "band", "camp"],
      location: "Lebanon High School",
      notes: "Incoming 9th graders & all new marchers.",
    },
    {
      id: "plan-jeremiah-band-2026-08-13",
      title: "Jeremiah Band Camp — All students",
      date: "2026-08-13",
      time: "08:30",
      startTime: "08:30",
      endTime: "16:00",
      category: "Activity",
      memberNames: ["Jeremiah"],
      tags: ["activity", "school", "band", "camp"],
      location: "Lebanon High School",
      notes: "All students.",
    },
    {
      id: "plan-jeremiah-band-2026-08-14",
      title: "Jeremiah Band Camp — All students",
      date: "2026-08-14",
      time: "08:30",
      startTime: "08:30",
      endTime: "16:00",
      category: "Activity",
      memberNames: ["Jeremiah"],
      tags: ["activity", "school", "band", "camp"],
      location: "Lebanon High School",
      notes: "All students.",
    },
    {
      id: "plan-jeremiah-band-2026-08-17",
      title: "Jeremiah Band Camp — All students",
      date: "2026-08-17",
      time: "08:30",
      startTime: "08:30",
      endTime: "16:00",
      category: "Activity",
      memberNames: ["Jeremiah"],
      tags: ["activity", "school", "band", "camp"],
      location: "Lebanon High School",
      notes: "All students.",
    },
    {
      id: "plan-jeremiah-band-2026-08-18",
      title: "Jeremiah Band Camp — All students",
      date: "2026-08-18",
      time: "08:30",
      startTime: "08:30",
      endTime: "16:00",
      category: "Activity",
      memberNames: ["Jeremiah"],
      tags: ["activity", "school", "band", "camp"],
      location: "Lebanon High School",
      notes: "All students.",
    },
    {
      id: "plan-jeremiah-band-2026-08-19",
      title: "Jeremiah Band Camp — All students",
      date: "2026-08-19",
      time: "08:30",
      startTime: "08:30",
      endTime: "16:00",
      category: "Activity",
      memberNames: ["Jeremiah"],
      tags: ["activity", "school", "band", "camp"],
      location: "Lebanon High School",
      notes: "All students.",
    },
    {
      id: "plan-jeremiah-band-2026-08-20",
      title: "Jeremiah Band Camp — All students",
      date: "2026-08-20",
      time: "08:30",
      startTime: "08:30",
      endTime: "16:00",
      category: "Activity",
      memberNames: ["Jeremiah"],
      tags: ["activity", "school", "band", "camp"],
      location: "Lebanon High School",
      notes: "All students.",
    },
    {
      id: "plan-jeremiah-band-2026-08-21",
      title: "Jeremiah Band Camp — BBQ & Field Show Preview",
      date: "2026-08-21",
      time: "08:30",
      startTime: "08:30",
      endTime: "16:00",
      category: "Activity",
      memberNames: ["Jeremiah"],
      tags: ["activity", "school", "band", "camp"],
      location: "Lebanon High School",
      notes:
        "All students. Families are invited to attend the Friday BBQ and Field Show Preview.",
    },
  ];

  const travel: SeedDraft[] = [
    {
      id: "plan-lh-utah-2026",
      title: "L&H Utah trip",
      date: "2026-07-24",
      endDate: "2026-07-29",
      time: "",
      startTime: "",
      isAllDay: true,
      category: "Travel",
      memberNames: ["Lorraine", "Hershel"],
      tags: ["travel"],
      notes: "Utah trip",
    },
    {
      id: "plan-lh-texas-2026",
      title: "L&H Texas trip",
      date: "2026-08-01",
      endDate: "2026-08-16",
      time: "",
      startTime: "",
      isAllDay: true,
      category: "Travel",
      memberNames: ["Lorraine", "Hershel"],
      tags: ["travel"],
      notes: "Texas trip",
    },
    {
      id: "plan-lh-newport-2026",
      title: "L&H Newport trip",
      date: "2026-08-30",
      endDate: "2026-09-03",
      time: "",
      startTime: "",
      isAllDay: true,
      category: "Travel",
      memberNames: ["Lorraine", "Hershel"],
      tags: ["travel"],
      notes: "Newport trip",
    },
    {
      id: "plan-lh-steve-2026",
      title: "L&H with Steve",
      date: "2026-09-10",
      endDate: "2026-09-15",
      time: "",
      startTime: "",
      isAllDay: true,
      category: "Travel",
      memberNames: ["Lorraine", "Hershel"],
      tags: ["travel", "tentative"],
      isTentative: true,
      notes: "With Steve — not confirmed yet",
    },
    {
      id: "plan-lorraine-wa-2026",
      title: "Lorraine WA trip",
      date: "2026-09-19",
      endDate: "2026-09-25",
      time: "",
      startTime: "",
      isAllDay: true,
      category: "Travel",
      memberNames: ["Lorraine"],
      tags: ["travel"],
      notes: "Washington trip",
    },
  ];

  const marker: SeedDraft = {
    id: HOUSEHOLD_CALENDAR_PACK_MARKER_ID,
    title: "Family calendar pack loaded",
    date: "2026-07-01",
    time: "",
    startTime: "",
    isAllDay: true,
    category: "Reminder",
    memberNames: [],
    tags: ["school", "travel", "activity"],
    notes:
      "Marker for Lebanon 2026–27 school dates + household activities/travel. Safe to hide or ignore.",
  };

  return [marker, ...school, ...activities, ...travel];
}

export function draftsToPlannerEvents(
  drafts: SeedDraft[],
  members: FamilyMember[],
): PlannerEvent[] {
  const now = new Date().toISOString();
  return drafts.map((draft) => {
    const resolved = resolveMembers(members, draft.memberNames);
    const assignedMemberIds = resolved.map((m) => m.id);
    const assignedPerson =
      resolved.length === 0
        ? "Family"
        : resolved.length === 1
          ? resolved[0].name
          : resolved.map((m) => m.name).join(" & ");
    return {
      id: draft.id,
      title: draft.title,
      date: draft.date,
      endDate: draft.endDate,
      time: draft.time ?? draft.startTime ?? "",
      startTime: draft.startTime ?? draft.time ?? "",
      endTime: draft.endTime,
      category: draft.category,
      assignedMemberId: assignedMemberIds[0] ?? "",
      assignedPerson,
      assignedMemberIds,
      isAllDay: draft.isAllDay ?? false,
      repeatEnabled: draft.repeatEnabled ?? false,
      repeatRule: draft.repeatRule,
      location: draft.location,
      notes: draft.notes,
      tags: draft.tags ?? [],
      isTentative: draft.isTentative ?? false,
      noSchoolReason: draft.noSchoolReason,
      stickyColor: draft.stickyColor,
      prepChecklist: [],
      reminderSettings: [],
      createdAt: now,
      updatedAt: now,
    };
  });
}

export type MergeHouseholdCalendarResult = {
  data: FamilyData;
  addedCount: number;
  skippedCount: number;
  membersRepaired: boolean;
};

/**
 * Additive merge into `FamilyData.planner`.
 * Skips when stable ID already exists OR title/date/category/person fingerprint matches.
 * Optionally repairs missing canonical members (e.g. Selena) without overwriting others.
 */
export function mergeHouseholdCalendarIntoData(
  data: FamilyData,
  options?: { repairMembers?: boolean },
): MergeHouseholdCalendarResult {
  let members = data.familyMembers ?? [];
  let membersRepaired = false;
  if (options?.repairMembers !== false) {
    const repair = repairCanonicalFamilyMembers(members);
    if (repair.addedNames.length > 0 || repair.renamed.length > 0) {
      members = repair.members;
      membersRepaired = true;
    }
  }

  const existing = data.planner ?? [];
  const byId = new Set(existing.map((e) => e.id));
  const byFp = new Set(existing.map((e) => fingerprint(e)));
  const incoming = draftsToPlannerEvents(buildHouseholdCalendarSeedDrafts(), members);

  const toAdd: PlannerEvent[] = [];
  let skippedCount = 0;
  for (const event of incoming) {
    if (byId.has(event.id) || byFp.has(fingerprint(event))) {
      skippedCount += 1;
      continue;
    }
    toAdd.push(event);
    byId.add(event.id);
    byFp.add(fingerprint(event));
  }

  return {
    data: {
      ...data,
      familyMembers: members,
      planner: [...existing, ...toAdd],
    },
    addedCount: toAdd.length,
    skippedCount,
    membersRepaired,
  };
}

/** True when the Lebanon/household pack marker (or majority of school IDs) is present. */
export function hasHouseholdCalendarPack(planner: PlannerEvent[] | undefined): boolean {
  const list = planner ?? [];
  if (list.some((e) => e.id === HOUSEHOLD_CALENDAR_PACK_MARKER_ID)) {
    return true;
  }
  return list.some((e) => e.id.startsWith("plan-school-noschool-2026-08-31"));
}
