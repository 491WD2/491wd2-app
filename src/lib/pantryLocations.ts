import type { FoodStorageLocation } from "../types/inventory";

export type PantryLocationArea = "kitchen" | "pantry" | "fridge" | "freezer" | "home" | "misc";

export type PantryLocationDetailOption = {
  value: string;
  label: string;
};

export type StructuredPantryLocation = {
  area: PantryLocationArea;
  detail: string;
  note: string;
};

export const PANTRY_LOCATION_AREAS: Array<{ id: PantryLocationArea; label: string }> = [
  { id: "kitchen", label: "Kitchen" },
  { id: "pantry", label: "Pantry" },
  { id: "fridge", label: "Fridge" },
  { id: "freezer", label: "Freezer" },
  { id: "home", label: "Home" },
  { id: "misc", label: "Misc" },
];

const CABINET_LETTERS = "ABCDEFGHIJKL".split("");

const KITCHEN_DETAIL_OPTIONS = [
  ...["A1", "A2", "A3"].map((value) => ({ value, label: value })),
  ...CABINET_LETTERS.flatMap((letter) =>
    [1, 2, 3].map((shelf) => ({
      value: `${letter}${shelf}`,
      label: `Cabinet ${letter} - Shelf ${shelf}`,
    })),
  ),
].filter((option, index, options) => options.findIndex((entry) => entry.value === option.value) === index);

const PANTRY_DETAIL_OPTIONS: PantryLocationDetailOption[] = [
  ...Array.from({ length: 40 }, (_, index) => index + 1).map((shelf) => ({
    value: `shelf-${shelf}`,
    label: `Shelf ${shelf}`,
  })),
  { value: "other", label: "Other" },
];

const FRIDGE_DETAIL_OPTIONS: PantryLocationDetailOption[] = ["A", "B"].flatMap((fridge) => [
  ...[1, 2, 3].map((shelf) => ({
    value: `${fridge}-shelf-${shelf}`,
    label: `Fridge ${fridge} - Shelf ${shelf}`,
  })),
  { value: `${fridge}-door-1`, label: `Fridge ${fridge} - Door 1` },
  { value: `${fridge}-door-2`, label: `Fridge ${fridge} - Door 2` },
]);

const FREEZER_DETAIL_OPTIONS: PantryLocationDetailOption[] = [
  ...["A-kitchen", "B-laundry"].flatMap((freezer) => {
    const label = freezer === "A-kitchen" ? "Freezer A - Kitchen" : "Freezer B - Laundry";
    return [
      ...[1, 2, 3].map((shelf) => ({
        value: `${freezer}-shelf-${shelf}`,
        label: `${label} - Shelf ${shelf}`,
      })),
      { value: `${freezer}-dl`, label: `${label} - Drawer Left` },
      { value: `${freezer}-dr`, label: `${label} - Drawer Right` },
    ];
  }),
  ...[1, 2, 3].map((shelf) => ({
    value: `C-family-shelf-${shelf}`,
    label: `Freezer C - Family Room - Shelf ${shelf}`,
  })),
];

const HOME_DETAIL_OPTIONS: PantryLocationDetailOption[] = [
  { value: "kitchen", label: "Kitchen" },
  { value: "living-room", label: "Living Room" },
  { value: "family-room", label: "Family Room" },
  { value: "dining-room", label: "Dining Room" },
  { value: "bathroom", label: "Bathroom" },
  { value: "laundry-room", label: "Laundry Room" },
  { value: "entry", label: "Entry" },
  { value: "bedrooms", label: "Bedrooms" },
  { value: "garage", label: "Garage" },
  { value: "other", label: "Other" },
];

const MISC_DETAIL_OPTIONS: PantryLocationDetailOption[] = [
  { value: "note", label: "Use note" },
];

const LOCATION_LINE_PREFIX = "Location:";
const LOCATION_NOTE_PREFIX = "Location note:";

export function getPantryLocationDetailOptions(area: PantryLocationArea): PantryLocationDetailOption[] {
  if (area === "kitchen") return KITCHEN_DETAIL_OPTIONS;
  if (area === "pantry") return PANTRY_DETAIL_OPTIONS;
  if (area === "fridge") return FRIDGE_DETAIL_OPTIONS;
  if (area === "freezer") return FREEZER_DETAIL_OPTIONS;
  if (area === "home") return HOME_DETAIL_OPTIONS;
  return MISC_DETAIL_OPTIONS;
}

export function pantryAreaToFoodStorageLocation(area: PantryLocationArea): FoodStorageLocation {
  if (area === "fridge") return "fridge";
  if (area === "freezer") return "freezer";
  return "pantry";
}

export function pantryAreaFromFoodStorageLocation(location: FoodStorageLocation): PantryLocationArea {
  if (location === "fridge") return "fridge";
  if (location === "freezer") return "freezer";
  return "pantry";
}

export function getPantryLocationAreaLabel(area: PantryLocationArea): string {
  return PANTRY_LOCATION_AREAS.find((entry) => entry.id === area)?.label ?? "Pantry";
}

export function getPantryLocationDetailLabel(area: PantryLocationArea, detail: string): string {
  return getPantryLocationDetailOptions(area).find((entry) => entry.value === detail)?.label ?? detail;
}

function normalizeArea(value: string): PantryLocationArea | null {
  const normalized = value.trim().toLowerCase();
  return PANTRY_LOCATION_AREAS.some((entry) => entry.id === normalized)
    ? (normalized as PantryLocationArea)
    : null;
}

export function parseStructuredPantryLocation(
  notes: string,
  fallbackLocation: FoodStorageLocation = "pantry",
): StructuredPantryLocation {
  const fallbackArea = pantryAreaFromFoodStorageLocation(fallbackLocation);
  const fallbackDetail = getPantryLocationDetailOptions(fallbackArea)[0]?.value ?? "";
  let area = fallbackArea;
  let detail = fallbackDetail;
  let note = "";

  for (const line of notes.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().startsWith(LOCATION_LINE_PREFIX.toLowerCase())) {
      const raw = trimmed.slice(LOCATION_LINE_PREFIX.length).trim();
      const [rawArea, rawDetail = ""] = raw.split("/").map((part) => part.trim());
      const nextArea = normalizeArea(rawArea);
      if (nextArea) {
        const matchedDetail = getPantryLocationDetailOptions(nextArea).find(
          (option) => option.value === rawDetail || option.label === rawDetail,
        );
        area = nextArea;
        detail = matchedDetail?.value || rawDetail || getPantryLocationDetailOptions(nextArea)[0]?.value || "";
      }
    }
    if (trimmed.toLowerCase().startsWith(LOCATION_NOTE_PREFIX.toLowerCase())) {
      note = trimmed.slice(LOCATION_NOTE_PREFIX.length).trim();
    }
  }

  const validDetail = getPantryLocationDetailOptions(area).some((option) => option.value === detail);
  return {
    area,
    detail: validDetail ? detail : getPantryLocationDetailOptions(area)[0]?.value ?? "",
    note,
  };
}

export function applyStructuredPantryLocationToNotes(
  notes: string,
  location: StructuredPantryLocation,
): string {
  const remaining = notes
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim().toLowerCase();
      return (
        !trimmed.startsWith(LOCATION_LINE_PREFIX.toLowerCase()) &&
        !trimmed.startsWith(LOCATION_NOTE_PREFIX.toLowerCase())
      );
    })
    .join("\n")
    .trim();
  const detailLabel = getPantryLocationDetailLabel(location.area, location.detail);
  const locationLines = [
    `${LOCATION_LINE_PREFIX} ${getPantryLocationAreaLabel(location.area)} / ${detailLabel}`,
    location.note.trim() ? `${LOCATION_NOTE_PREFIX} ${location.note.trim()}` : "",
  ].filter(Boolean);

  return [remaining, ...locationLines].filter(Boolean).join("\n");
}

export function formatStructuredPantryLocation(location: StructuredPantryLocation): string {
  return `${getPantryLocationAreaLabel(location.area)} - ${getPantryLocationDetailLabel(location.area, location.detail)}`;
}
