/**
 * Demo pantry inventory (24 household items) for first-run seed
 * and Settings → Backup “Load demo pantry inventory”.
 * Does not call Open Food Facts or external image hosts.
 */
import type { PantryItem, PantryLocation, StockStatus } from "./familyData";

export type DemoPantryZone =
  | "Fridge 1"
  | "Fridge 2"
  | "Freezer 1"
  | "Freezer 2"
  | "Freezer 3"
  | "Kitchen Pantry";

type DemoPantrySeed = {
  id: string;
  name: string;
  brand: string;
  category: string;
  quantity: string;
  unit: string;
  status: StockStatus;
  zone: DemoPantryZone;
  photoHint: string;
  /** Emoji placeholder for thumbnails when no photo URL is set. */
  emoji: string;
};

/** Map friendly demo zones onto existing PantryLocation values. */
export const DEMO_ZONE_TO_LOCATION: Record<
  DemoPantryZone,
  { location: PantryLocation; coldDetail?: string; pantryNote?: string }
> = {
  "Fridge 1": { location: "Kitchen Fridge", coldDetail: "Fridge 1" },
  "Fridge 2": { location: "Laundry Room Fridge", coldDetail: "Fridge 2" },
  "Freezer 1": { location: "Kitchen Freezer", coldDetail: "Freezer 1" },
  "Freezer 2": { location: "Laundry Room Freezer", coldDetail: "Freezer 2" },
  "Freezer 3": { location: "Family Room Freezer", coldDetail: "Freezer 3" },
  "Kitchen Pantry": { location: "Pantry", pantryNote: "Kitchen Pantry" },
};

const DEMO_PANTRY_SEEDS: DemoPantrySeed[] = [
  // Fridge 1
  {
    id: "demo-pantry-f1-milk",
    name: "Organic Valley Whole Milk",
    brand: "Organic Valley",
    category: "Dairy",
    quantity: "1",
    unit: "gallon",
    status: "Stocked",
    zone: "Fridge 1",
    photoHint: "generic milk",
    emoji: "🥛",
  },
  {
    id: "demo-pantry-f1-yogurt",
    name: "Chobani Greek Yogurt Vanilla",
    brand: "Chobani",
    category: "Dairy",
    quantity: "6",
    unit: "cups",
    status: "Stocked",
    zone: "Fridge 1",
    photoHint: "generic yogurt",
    emoji: "🥣",
  },
  {
    id: "demo-pantry-f1-snapple",
    name: "Snapple Lemon Iced Tea",
    brand: "Snapple",
    category: "Drinks",
    quantity: "4",
    unit: "bottles",
    status: "Low",
    zone: "Fridge 1",
    photoHint: "generic iced tea",
    emoji: "🧃",
  },
  {
    id: "demo-pantry-f1-strawberries",
    name: "Fresh Strawberries",
    brand: "",
    category: "Produce",
    quantity: "1",
    unit: "container",
    status: "Stocked",
    zone: "Fridge 1",
    photoHint: "generic fruit",
    emoji: "🍓",
  },
  // Fridge 2
  {
    id: "demo-pantry-f2-cheddar",
    name: "Tillamook Cheddar Cheese",
    brand: "Tillamook",
    category: "Dairy",
    quantity: "1",
    unit: "block",
    status: "Stocked",
    zone: "Fridge 2",
    photoHint: "generic cheese",
    emoji: "🧀",
  },
  {
    id: "demo-pantry-f2-turkey",
    name: "Oscar Mayer Turkey Breast",
    brand: "Oscar Mayer",
    category: "Meat / Deli",
    quantity: "1",
    unit: "pack",
    status: "Low",
    zone: "Fridge 2",
    photoHint: "generic deli meat",
    emoji: "🦃",
  },
  {
    id: "demo-pantry-f2-carrots",
    name: "Baby Carrots",
    brand: "",
    category: "Produce",
    quantity: "1",
    unit: "bag",
    status: "Stocked",
    zone: "Fridge 2",
    photoHint: "generic carrots",
    emoji: "🥕",
  },
  {
    id: "demo-pantry-f2-oj",
    name: "Simply Orange Juice",
    brand: "Simply",
    category: "Drinks",
    quantity: "1",
    unit: "bottle",
    status: "Stocked",
    zone: "Fridge 2",
    photoHint: "generic orange juice",
    emoji: "🍊",
  },
  // Freezer 1
  {
    id: "demo-pantry-z1-eggo",
    name: "Eggo Homestyle Waffles",
    brand: "Eggo",
    category: "Breakfast",
    quantity: "1",
    unit: "box",
    status: "Stocked",
    zone: "Freezer 1",
    photoHint: "generic waffles",
    emoji: "🧇",
  },
  {
    id: "demo-pantry-z1-nuggets",
    name: "Tyson Chicken Nuggets",
    brand: "Tyson",
    category: "Frozen",
    quantity: "1",
    unit: "bag",
    status: "Low",
    zone: "Freezer 1",
    photoHint: "generic frozen chicken",
    emoji: "🍗",
  },
  {
    id: "demo-pantry-z1-blueberries",
    name: "Frozen Blueberries",
    brand: "",
    category: "Fruit",
    quantity: "1",
    unit: "bag",
    status: "Stocked",
    zone: "Freezer 1",
    photoHint: "generic frozen berries",
    emoji: "🫐",
  },
  {
    id: "demo-pantry-z1-bj",
    name: "Ben & Jerry’s Vanilla Ice Cream",
    brand: "Ben & Jerry’s",
    category: "Dessert",
    quantity: "1",
    unit: "pint",
    status: "Stocked",
    zone: "Freezer 1",
    photoHint: "generic ice cream",
    emoji: "🍦",
  },
  // Freezer 2
  {
    id: "demo-pantry-z2-digiorno",
    name: "DiGiorno Pepperoni Pizza",
    brand: "DiGiorno",
    category: "Frozen Meal",
    quantity: "2",
    unit: "boxes",
    status: "Stocked",
    zone: "Freezer 2",
    photoHint: "generic pizza",
    emoji: "🍕",
  },
  {
    id: "demo-pantry-z2-veggies",
    name: "Birds Eye Mixed Vegetables",
    brand: "Birds Eye",
    category: "Vegetables",
    quantity: "2",
    unit: "bags",
    status: "Stocked",
    zone: "Freezer 2",
    photoHint: "generic frozen vegetables",
    emoji: "🥦",
  },
  {
    id: "demo-pantry-z2-jimmy",
    name: "Jimmy Dean Breakfast Sandwiches",
    brand: "Jimmy Dean",
    category: "Breakfast",
    quantity: "1",
    unit: "box",
    status: "Low",
    zone: "Freezer 2",
    photoHint: "generic breakfast sandwich",
    emoji: "🥪",
  },
  {
    id: "demo-pantry-z2-salmon",
    name: "Frozen Salmon Fillets",
    brand: "",
    category: "Seafood",
    quantity: "4",
    unit: "fillets",
    status: "Stocked",
    zone: "Freezer 2",
    photoHint: "generic fish",
    emoji: "🐟",
  },
  // Freezer 3
  {
    id: "demo-pantry-z3-pizza-rolls",
    name: "Totino’s Pizza Rolls",
    brand: "Totino’s",
    category: "Snacks",
    quantity: "1",
    unit: "bag",
    status: "Low",
    zone: "Freezer 3",
    photoHint: "generic pizza bites",
    emoji: "🍕",
  },
  {
    id: "demo-pantry-z3-broccoli",
    name: "Frozen Broccoli Florets",
    brand: "",
    category: "Vegetables",
    quantity: "2",
    unit: "bags",
    status: "Stocked",
    zone: "Freezer 3",
    photoHint: "generic broccoli",
    emoji: "🥦",
  },
  {
    id: "demo-pantry-z3-hd",
    name: "Haagen-Dazs Strawberry Ice Cream",
    brand: "Häagen-Dazs",
    category: "Dessert",
    quantity: "1",
    unit: "pint",
    status: "Stocked",
    zone: "Freezer 3",
    photoHint: "generic ice cream",
    emoji: "🍨",
  },
  {
    id: "demo-pantry-z3-beef",
    name: "Ground Beef",
    brand: "",
    category: "Meat",
    quantity: "2",
    unit: "pounds",
    status: "Stocked",
    zone: "Freezer 3",
    photoHint: "generic beef",
    emoji: "🥩",
  },
  // Kitchen Pantry
  {
    id: "demo-pantry-p-kix",
    name: "Kix Cereal",
    brand: "Kix",
    category: "Cereal",
    quantity: "1",
    unit: "box",
    status: "Stocked",
    zone: "Kitchen Pantry",
    photoHint: "generic cereal",
    emoji: "🥣",
  },
  {
    id: "demo-pantry-p-spaghetti",
    name: "Barilla Spaghetti",
    brand: "Barilla",
    category: "Pasta",
    quantity: "2",
    unit: "boxes",
    status: "Stocked",
    zone: "Kitchen Pantry",
    photoHint: "generic pasta",
    emoji: "🍝",
  },
  {
    id: "demo-pantry-p-jif",
    name: "Jif Creamy Peanut Butter",
    brand: "Jif",
    category: "Spreads",
    quantity: "1",
    unit: "jar",
    status: "Low",
    zone: "Kitchen Pantry",
    photoHint: "generic peanut butter",
    emoji: "🥜",
  },
  {
    id: "demo-pantry-p-soup",
    name: "Campbell’s Tomato Soup",
    brand: "Campbell’s",
    category: "Canned Goods",
    quantity: "4",
    unit: "cans",
    status: "Stocked",
    zone: "Kitchen Pantry",
    photoHint: "generic canned soup",
    emoji: "🥫",
  },
];

const STAMP = "2026-07-22";

export function createDemoPantryInventoryItems(): PantryItem[] {
  return DEMO_PANTRY_SEEDS.map((seed) => {
    const map = DEMO_ZONE_TO_LOCATION[seed.zone];
    const isPantry = map.location === "Pantry";
    return {
      id: seed.id,
      name: seed.name,
      productName: seed.name,
      brand: seed.brand || undefined,
      quantity: seed.quantity,
      unit: seed.unit,
      category: seed.category,
      storageArea: map.location,
      location: map.location,
      coldLocationDetail: map.coldDetail,
      locationDetail: map.coldDetail,
      pantryLocationNote: map.pantryNote,
      ...(isPantry
        ? { pantryWall: "Wall 1" as const, pantryShelf: "Shelf 1" as const }
        : {}),
      status: seed.status,
      expiryDate: "",
      notes: `Demo inventory · ${seed.zone} · ${seed.photoHint}`,
      isStaple: seed.status === "Low" || seed.category === "Dairy",
      minQuantity: seed.status === "Low" ? seed.quantity : "1",
      tags: ["demo-pantry", seed.zone.toLowerCase().replace(/\s+/g, "-")],
      source: "seed",
      lastUpdated: STAMP,
      createdAt: STAMP,
      itemPhotoCaption: seed.emoji,
      productDescription: `Placeholder photo: ${seed.photoHint}. No remote product image stored.`,
    };
  });
}

export type ApplyDemoPantryResult = {
  pantry: PantryItem[];
  applied: boolean;
  /** Human-readable status for Settings UI. */
  message: string;
};

/**
 * Safe apply: fills pantry only when empty, unless `forceReplace` is true.
 * Never touches other FamilyData fields.
 */
export function applyDemoPantryInventory(
  currentPantry: PantryItem[] | null | undefined,
  options?: { forceReplace?: boolean },
): ApplyDemoPantryResult {
  const existing = (currentPantry ?? []).filter((p) => p && !p.inactiveInInventory);
  const demo = createDemoPantryInventoryItems();

  if (existing.length === 0) {
    return {
      pantry: demo,
      applied: true,
      message: `Loaded ${demo.length} demo pantry items (Fridge 1–2, Freezer 1–3, Kitchen Pantry).`,
    };
  }

  if (options?.forceReplace) {
    return {
      pantry: demo,
      applied: true,
      message: `Replaced pantry with ${demo.length} demo items. Previous pantry rows were removed on this device only.`,
    };
  }

  return {
    pantry: currentPantry ?? [],
    applied: false,
    message: `Pantry already has ${existing.length} item${existing.length === 1 ? "" : "s"}. Export a backup first, or confirm replace to load the demo inventory.`,
  };
}

export const DEMO_PANTRY_ITEM_COUNT = DEMO_PANTRY_SEEDS.length;
