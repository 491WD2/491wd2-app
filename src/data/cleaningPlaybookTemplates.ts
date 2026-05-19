import type {
  CleaningRoom,
  CleaningRoomTaskGroup,
  CleaningRoomTaskGroupFrequency,
} from "./familyData";

/** Stable IDs — merged into household data when missing; existing rooms preserved. */
export const CLEANING_PLAYBOOK_CANONICAL_IDS = [
  "room-bathroom",
  "room-kitchen",
  "room-living",
  "room-dining",
  "room-main-bed",
  "room-kids-bed",
  "room-laundry",
  "room-entry",
  "room-pantry",
  "room-garage",
] as const;

export type CleaningPlaybookCanonicalId = (typeof CLEANING_PLAYBOOK_CANONICAL_IDS)[number];

function tg(
  id: string,
  title: string,
  frequency: CleaningRoomTaskGroupFrequency,
  tasks: string[],
): CleaningRoomTaskGroup {
  return {
    id,
    title,
    frequency,
    tasks: tasks.map((titleLine, i) => ({
      id: `${id}-t${i + 1}`,
      title: titleLine,
      completed: false,
    })),
  };
}

/** Starter playbooks (no createdAt — added when cloning). */
export const CLEANING_PLAYBOOK_STARTERS: Record<
  CleaningPlaybookCanonicalId,
  Omit<CleaningRoom, "createdAt" | "updatedAt">
> = {
  "room-bathroom": {
    id: "room-bathroom",
    name: "Bathroom",
    icon: "Bath",
    zone: "Bathroom",
    description: "Keep it fresh, safe, and guest-ready.",
    referenceImageUrl: "",
    referenceImageCaption: "Finished clean look — bathroom",
    whatToDo: [
      "Scrub toilet bowl, seat, and exterior",
      "Wipe down sink, faucet, and countertop",
      "Clean mirror",
      "Scrub shower or tub",
      "Empty trash and replace liner",
      "Sweep and mop floor",
      "Hang fresh towels",
    ],
    whatToAvoid: [],
    suppliesNeeded: [
      "Toilet bowl cleaner and brush",
      "Bathroom cleaner spray",
      "Glass cleaner",
      "Scrub brush",
      "Microfiber cloths",
      "Mop and bucket",
      "Disinfectant",
    ],
    taskGroups: [
      tg("bathroom-daily", "Daily", "daily", [
        "Wipe down sink and counter",
        "Clean toilet quickly",
        "Hang fresh towels",
        "Empty trash if needed",
      ]),
      tg("bathroom-weekly", "Weekly", "weekly", [
        "Scrub toilet thoroughly",
        "Clean shower or tub",
        "Scrub sink and faucet",
        "Clean mirror",
        "Mop floor",
        "Wipe down surfaces",
      ]),
      tg("bathroom-monthly", "Monthly", "monthly", [
        "Clean grout with brush",
        "Wash shower curtain and liner",
        "Wipe down walls and ceiling",
        "Clean baseboards",
        "Organize under sink",
        "Clean light fixture and exhaust fan",
      ]),
    ],
  },
  "room-kitchen": {
    id: "room-kitchen",
    name: "Kitchen",
    icon: "Utensils",
    zone: "Kitchen",
    description: "Counters clear, dishes handled, food safe.",
    referenceImageUrl: "",
    referenceImageCaption: "Finished clean look — kitchen",
    whatToDo: [
      "Clear and sanitize counters",
      "Wash dishes or run dishwasher",
      "Wipe stove and spills",
      "Sweep crumbs",
      "Take trash out when needed",
    ],
    whatToAvoid: [],
    suppliesNeeded: [
      "Dish soap",
      "All-purpose cleaner",
      "Degreaser",
      "Microfiber cloths",
      "Trash bags",
    ],
    taskGroups: [
      tg("kitchen-daily", "Daily", "daily", [
        "Clear counters",
        "Load/run dishwasher",
        "Wipe stove top",
        "Quick sink rinse",
      ]),
      tg("kitchen-weekly", "Weekly", "weekly", [
        "Clean microwave inside",
        "Wipe fridge handles",
        "Scrub sink",
        "Mop floor",
      ]),
      tg("kitchen-monthly", "Monthly", "monthly", [
        "Clean backsplash",
        "Degrease range hood filter",
        "Organize pantry shelf edges",
      ]),
    ],
  },
  "room-living": {
    id: "room-living",
    name: "Living Room",
    icon: "Sofa",
    zone: "Living Room",
    description: "Comfortable shared space — tidy surfaces and floors.",
    referenceImageUrl: "",
    referenceImageCaption: "Finished clean look — living room",
    whatToDo: [
      "Straighten cushions and throws",
      "Clear clutter from tables",
      "Dust visible surfaces",
      "Vacuum or sweep high-traffic areas",
    ],
    whatToAvoid: [],
    suppliesNeeded: ["Microfiber duster", "Vacuum", "Glass cleaner", "Basket for clutter"],
    taskGroups: [
      tg("living-daily", "Daily", "daily", ["Quick tidy surfaces", "Fluff cushions"]),
      tg("living-weekly", "Weekly", "weekly", ["Vacuum rugs", "Dust shelves", "Clean coffee table"]),
      tg("living-monthly", "Monthly", "monthly", ["Vacuum under cushions", "Wipe baseboards"]),
    ],
  },
  "room-dining": {
    id: "room-dining",
    name: "Dining Room",
    icon: "UtensilsCrossed",
    zone: "Dining Room",
    description: "Meals together — keep table and floors inviting.",
    referenceImageUrl: "",
    referenceImageCaption: "Finished clean look — dining room",
    whatToDo: ["Clear table after meals", "Wipe chairs", "Sweep crumbs"],
    whatToAvoid: [],
    suppliesNeeded: ["Wood-safe cleaner", "Microfiber cloths", "Broom"],
    taskGroups: [
      tg("dining-daily", "Daily", "daily", ["Clear table", "Wipe tabletop"]),
      tg("dining-weekly", "Weekly", "weekly", ["Sweep/mop floor", "Clean chair seats"]),
      tg("dining-monthly", "Monthly", "monthly", ["Deep wipe legs/base", "Check light fixture"]),
    ],
  },
  "room-main-bed": {
    id: "room-main-bed",
    name: "Main Bedroom",
    icon: "BedDouble",
    zone: "Main Bedroom",
    description: "Rest zone — calm surfaces and fresh linens.",
    referenceImageUrl: "",
    referenceImageCaption: "Finished clean look — main bedroom",
    whatToDo: ["Make bed", "Clear nightstands", "Hang clothes"],
    whatToAvoid: [],
    suppliesNeeded: ["Lint roller", "Surface cleaner", "Hamper"],
    taskGroups: [
      tg("mainbed-daily", "Daily", "daily", ["Make bed", "Clear surfaces"]),
      tg("mainbed-weekly", "Weekly", "weekly", ["Change sheets", "Vacuum floor", "Dust"]),
      tg("mainbed-monthly", "Monthly", "monthly", ["Rotate mattress pad", "Clean mirrors"]),
    ],
  },
  "room-kids-bed": {
    id: "room-kids-bed",
    name: "Kids Bedroom",
    icon: "BedSingle",
    zone: "Kids Bedroom",
    description: "Kid-friendly tidy routines.",
    referenceImageUrl: "",
    referenceImageCaption: "Finished clean look — kids bedroom",
    whatToDo: ["Reset toys", "Clear desk/shelf hotspots"],
    whatToAvoid: [],
    suppliesNeeded: ["Toy bins", "Surface wipes", "Vacuum"],
    taskGroups: [
      tg("kids-daily", "Daily", "daily", ["Bed neat", "Floor obstacle sweep"]),
      tg("kids-weekly", "Weekly", "weekly", ["Vacuum", "Organize one shelf"]),
      tg("kids-monthly", "Monthly", "monthly", ["Rotate stuffed wash", "Dust blinds"]),
    ],
  },
  "room-laundry": {
    id: "room-laundry",
    name: "Laundry Room",
    icon: "Shirt",
    zone: "Laundry Room",
    description: "Machines, lint, and supplies under control.",
    referenceImageUrl: "",
    referenceImageCaption: "Finished clean look — laundry",
    whatToDo: ["Keep detergents sealed", "Empty lint trap after dryer loads"],
    whatToAvoid: [],
    suppliesNeeded: ["Laundry detergent", "Stain spray", "Dryer sheets"],
    taskGroups: [
      tg("laundry-daily", "Daily", "daily", ["Clear folding surface"]),
      tg("laundry-weekly", "Weekly", "weekly", ["Wipe washer door seal", "Clean lint area"]),
      tg("laundry-monthly", "Monthly", "monthly", ["Vacuum behind units", "Restock supplies"]),
    ],
  },
  "room-entry": {
    id: "room-entry",
    name: "Entry / Mudroom",
    icon: "DoorOpen",
    zone: "Entry / Mudroom",
    description: "First impression — shoes and coats contained.",
    referenceImageUrl: "",
    referenceImageCaption: "Finished clean look — entry",
    whatToDo: ["Reset shoe zone", "Shake mats"],
    whatToAvoid: [],
    suppliesNeeded: ["Floor mat", "Basket for mail", "All-purpose spray"],
    taskGroups: [
      tg("entry-daily", "Daily", "daily", ["Straighten shoes/coats"]),
      tg("entry-weekly", "Weekly", "weekly", ["Sweep entry", "Wipe door handles"]),
      tg("entry-monthly", "Monthly", "monthly", ["Wash mats", "Dust light"]),
    ],
  },
  "room-pantry": {
    id: "room-pantry",
    name: "Pantry",
    icon: "Shelves",
    zone: "Pantry",
    description: "Food storage tidy for fast meal prep.",
    referenceImageUrl: "",
    referenceImageCaption: "Finished clean look — pantry",
    whatToDo: ["Face labels forward", "Rotate oldest items forward"],
    whatToAvoid: [],
    suppliesNeeded: ["Shelf liner optional", "Bins", "Marker labels"],
    taskGroups: [
      tg("pantry-daily", "Daily", "daily", ["Spot-check spills"]),
      tg("pantry-weekly", "Weekly", "weekly", ["Quick wipe shelves"]),
      tg("pantry-monthly", "Monthly", "monthly", ["Expire-date sweep", "Deep wipe"]),
    ],
  },
  "room-garage": {
    id: "room-garage",
    name: "Garage / Storage",
    icon: "Warehouse",
    zone: "Garage",
    description: "Safe walkways and grouped storage.",
    referenceImageUrl: "",
    referenceImageCaption: "Finished clean look — garage",
    whatToDo: ["Keep paths clear", "Group bins by category"],
    whatToAvoid: [],
    suppliesNeeded: ["Broom", "Trash bags", "Bin labels"],
    taskGroups: [
      tg("garage-daily", "Daily", "daily", ["Reset tools to hooks"]),
      tg("garage-weekly", "Weekly", "weekly", ["Sweep floor strip"]),
      tg("garage-monthly", "Monthly", "monthly", ["Recycle pile", "Donate box check"]),
    ],
  },
};

export function cloneCleaningRoomStarter(
  id: CleaningPlaybookCanonicalId,
  now: string,
): CleaningRoom {
  const base = CLEANING_PLAYBOOK_STARTERS[id];
  return {
    ...base,
    taskGroups: base.taskGroups.map((g) => ({
      ...g,
      tasks: g.tasks.map((t) => ({
        ...t,
        id: crypto.randomUUID(),
        completed: false,
        completedAt: undefined,
        completedByMemberId: null,
      })),
    })),
    createdAt: now,
    updatedAt: now,
  };
}

export function sortCleaningRoomsCanonicalFirst(rooms: CleaningRoom[]): CleaningRoom[] {
  const rank = new Map<string, number>(
    CLEANING_PLAYBOOK_CANONICAL_IDS.map((id, i) => [id, i]),
  );
  return [...rooms].sort((a, b) => {
    const ra = rank.get(a.id);
    const rb = rank.get(b.id);
    if (ra !== undefined && rb !== undefined) return ra - rb;
    if (ra !== undefined) return -1;
    if (rb !== undefined) return 1;
    return a.name.localeCompare(b.name);
  });
}
