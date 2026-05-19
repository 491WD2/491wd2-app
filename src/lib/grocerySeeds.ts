import type {
  DataSource,
  GroceryItem,
  PantryLocation,
  PantryShelf,
  PantryWall,
  StoreSection,
} from "../data/familyData";

export type GroceryItemSeed = {
  id?: string;
  name: string;
  category?: string;
  storeSection?: StoreSection;
  preferredStore?: string;
  amountDefault?: string;
  defaultLocation?: PantryLocation;
  defaultWall?: PantryWall;
  defaultShelf?: PantryShelf;
  notes?: string;
  source?: DataSource;
  sourceSystem?: string;
};

export function createGroceryItemFromSeed(seed: GroceryItemSeed): GroceryItem {
  const defaultLocation = seed.defaultLocation ?? "Pantry";

  return {
    id: seed.id ?? crypto.randomUUID(),
    name: seed.name,
    category: seed.category ?? "pantry",
    storeSection: seed.storeSection ?? "aisles",
    preferredStore: seed.preferredStore,
    amountDefault: seed.amountDefault,
    defaultLocation,
    defaultWall: defaultLocation === "Pantry" ? seed.defaultWall ?? "Wall 1" : undefined,
    defaultShelf:
      defaultLocation === "Pantry" ? seed.defaultShelf ?? "Shelf 1" : undefined,
    notes: seed.notes,
    source: seed.source ?? "seed",
    sourceSystem: seed.sourceSystem,
  };
}
