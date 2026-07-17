import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Apple,
  Barcode,
  Check,
  CheckCircle2,
  ChevronRight,
  DollarSign,
  Home,
  MapPin,
  Package,
  PackagePlus,
  Plus,
  ScanLine,
  Search,
  ShoppingCart,
  Snowflake,
  X,
} from "lucide-react";
import { PantryBoardEditSheet } from "../components/pantry/PantryBoardEditSheet";
import { ProductDetailPanel } from "../components/ProductDetailPanel";
import { ProductScanPanel } from "../components/ProductScanPanel";
import { useHouseholdProducts } from "../context/HouseholdProductContext";
import { useGroceryProductActions, useInventoryActivityHistory } from "../lib/groceryProductActions";
import { useGroceryCart } from "../lib/groceryCartStore";
import { trackCardScan } from "../lib/kioskCardAnalytics";
import {
  categoryGroupToFoodLocation,
  foodLocationToCategoryGroup,
  householdProductToPantryItem,
  pantryItemToFoodInventory,
} from "../lib/pantryData";
import {
  applyStructuredPantryLocationToNotes,
  formatStructuredPantryLocation,
  getPantryLocationDetailOptions,
  PANTRY_LOCATION_AREAS,
  pantryAreaToFoodStorageLocation,
  parseStructuredPantryLocation,
  type PantryLocationArea,
} from "../lib/pantryLocations";
import { recordPantryItemUsed } from "../lib/pantryUsagePatterns";
import { isLowStockItem, isUseFirstItem } from "../lib/pantryBoard";
import {
  FOOD_STORAGE_LOCATIONS,
  INVENTORY_LOCATION_META,
} from "../types/inventory";
import type { FoodInventoryItem, FoodStorageLocation } from "../types/inventory";
import type { GroceryCategoryGroupId, HouseholdProduct } from "../types/grocery";
import type { PantryItem } from "../types/pantry";
import "../styles/pantry-shopping-grofast.css";

const ANALYTICS_SURFACE = "pantry:kiosk";

type PantryKioskFlow = "add" | "search";

type InventoryLocationArea = "fridge" | "freezer" | "pantry" | "home";
type InventoryLocationScreen = "fridges" | "freezers" | "pantryLocation" | "homeLocation";

type PantryKioskScreen = "home" | "inventory" | InventoryLocationScreen | "foodStorage" | "detail" | "settings";
type SharedPantryShoppingPage = PantryKioskScreen | "shopping";

export type PantryTabPageProps = {
  onOpenShopping?: () => void;
  navigateWithinApp?: (href: string) => void;
  initialScreen?: PantryKioskScreen;
};

type AddWizardStep = "product" | "quantity" | "location" | "pantry-list" | "confirm";

type PantryListChoice = "main" | "backup" | "one-time";

type PantryKioskCompletion = {
  title: string;
  detail: string;
} | null;

type FoodStorageEntry = {
  id: string;
  productId?: string;
  item: string;
  unitMeasure: string;
  targetAmount: string;
  quantityOnHand: string;
  unitCost: string;
  minimumShelfLife: string;
  dateBought: string;
  expireDate: string;
  dateToRotate: string;
  adultShareTarget: string;
  custom?: boolean;
};

const FOOD_STORAGE_STATE_KEY = "491wd-food-storage-state";

const FOOD_STORAGE_SECTIONS = [
  "Bread / Cereal / Rice / Pasta",
  "Meat / Poultry / Fish / Beans / Eggs / Nuts",
  "Vegetables",
  "Fruit",
  "Milk / Cheese / Yogurt",
  "Fats / Oils / Sweets",
  "Baking Items",
  "Spices / Flavorings / Condiments",
  "Beverages",
  "Pet Supplies",
  "Household Items",
  "Health / Hygiene",
] as const;

type FoodStorageSection = (typeof FOOD_STORAGE_SECTIONS)[number];

const FOOD_STORAGE_HOUSEHOLD_SIZES = Array.from({ length: 10 }, (_, index) => index + 1);

const FOOD_STORAGE_TARGET_REFERENCES: Array<{
  pattern: RegExp;
  amountPerPerson: number;
  unitMeasure: string;
  label: string;
}> = [
  { pattern: /\b(wheat|whole wheat|grain)\b/i, amountPerPerson: 150, unitMeasure: "lb", label: "Wheat / whole grains" },
  { pattern: /\b(rice)\b/i, amountPerPerson: 50, unitMeasure: "lb", label: "Rice" },
  { pattern: /\b(pasta|spaghetti|noodle)\b/i, amountPerPerson: 25, unitMeasure: "lb", label: "Pasta" },
  { pattern: /\b(oat|oats|oatmeal)\b/i, amountPerPerson: 25, unitMeasure: "lb", label: "Oats" },
  { pattern: /\b(flour)\b/i, amountPerPerson: 25, unitMeasure: "lb", label: "Flour" },
  { pattern: /\b(bean|beans|lentil|legume)\b/i, amountPerPerson: 60, unitMeasure: "lb", label: "Beans / legumes" },
  { pattern: /\b(milk powder|powdered milk|dry milk)\b/i, amountPerPerson: 16, unitMeasure: "lb", label: "Powdered milk" },
  { pattern: /\b(oil|shortening|cooking oil)\b/i, amountPerPerson: 10, unitMeasure: "qt", label: "Cooking oils" },
  { pattern: /\b(sugar|honey|syrup)\b/i, amountPerPerson: 60, unitMeasure: "lb", label: "Sweeteners" },
  { pattern: /\b(salt)\b/i, amountPerPerson: 8, unitMeasure: "lb", label: "Salt" },
  { pattern: /\b(water)\b/i, amountPerPerson: 14, unitMeasure: "gal", label: "Emergency water" },
];

function itemMatchesSearch(item: PantryItem, query: string): boolean {
  if (!query) {
    return true;
  }
  const hay = [
    item.productName,
    item.category,
    item.categoryGroup,
    item.store,
    item.storageLocation,
    item.notes,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(query);
}

const ADD_QUANTITY_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);

const PANTRY_LIST_OPTIONS: Array<{ id: PantryListChoice; label: string; hint: string }> = [
  { id: "main", label: "Main pantry", hint: "Regular household staple" },
  { id: "backup", label: "Backup shelf", hint: "Extra item to keep on hand" },
  { id: "one-time", label: "One-time item", hint: "Temporary or special purchase" },
];

const INVENTORY_LOCATION_PAGES: Array<{
  screen: InventoryLocationScreen;
  area: InventoryLocationArea;
  title: string;
  detail: string;
  helper: string;
  icon: typeof PackagePlus;
}> = [
  {
    screen: "fridges",
    area: "fridge",
    title: "Fridges",
    detail: "Fridge shelves, doors, and fresh-food zones.",
    helper: "A/B fridges with shelves and doors",
    icon: Apple,
  },
  {
    screen: "freezers",
    area: "freezer",
    title: "Freezers",
    detail: "Kitchen, laundry, and family-room freezer locations.",
    helper: "A/B/C freezers with shelves and drawers",
    icon: Snowflake,
  },
  {
    screen: "pantryLocation",
    area: "pantry",
    title: "Pantry",
    detail: "Pantry shelves and household staple storage.",
    helper: "Shelves 1-5 plus other notes",
    icon: Package,
  },
  {
    screen: "homeLocation",
    area: "home",
    title: "Home",
    detail: "House rooms and non-food household inventory.",
    helper: "Rooms, supplies, and miscellaneous spaces",
    icon: Home,
  },
];

function readFoodStorageEntries(): FoodStorageEntry[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const parsed = JSON.parse(window.localStorage.getItem(FOOD_STORAGE_STATE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((entry) => entry && typeof entry.id === "string") : [];
  } catch {
    return [];
  }
}

function writeFoodStorageEntries(entries: FoodStorageEntry[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(FOOD_STORAGE_STATE_KEY, JSON.stringify(entries));
}

function numberString(value: number | string | null | undefined): string {
  if (value == null || value === "") {
    return "";
  }
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? String(numeric) : "";
}

function parseCurrency(value: string | null | undefined): string {
  const match = value?.match(/\d+(?:\.\d+)?/);
  return match?.[0] ?? "";
}

function toDateInputValue(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

function calculateAmountNeeded(entry: FoodStorageEntry): number {
  const target = Number(entry.targetAmount) || 0;
  const onHand = Number(entry.quantityOnHand) || 0;
  return Math.max(0, target - onHand);
}

function calculateExtendedCost(entry: FoodStorageEntry): number {
  const onHand = Number(entry.quantityOnHand) || 0;
  const unitCost = Number(entry.unitCost) || 0;
  return onHand * unitCost;
}

function formatMoney(value: number): string {
  return value > 0 ? `$${value.toFixed(2)}` : "$0.00";
}

function getFoodStorageTargetSuggestion(entry: FoodStorageEntry, householdSize: number) {
  const reference = FOOD_STORAGE_TARGET_REFERENCES.find((candidate) => candidate.pattern.test(entry.item));
  if (!reference) {
    return null;
  }
  return {
    amount: reference.amountPerPerson * householdSize,
    unitMeasure: reference.unitMeasure,
    label: reference.label,
  };
}

function resolveFoodStorageSection(entry: FoodStorageEntry, category = ""): FoodStorageSection {
  const hay = `${entry.item} ${category}`.toLowerCase();

  if (/\b(dog|cat|pet|bird|fish food|litter|kibble)\b/.test(hay)) return "Pet Supplies";
  if (/\b(medicine|medical|health|hygiene|pharmacy|aspirin|conditioner|shampoo|soap|tooth|cooling gel|eye drops|vitamin|bath)\b/.test(hay)) return "Health / Hygiene";
  if (/\b(water|juice|coffee|tea|soda|drink|beverage|sparkling)\b/.test(hay)) return "Beverages";
  if (/\b(spice|seasoning|flavor|flavour|condiment|sauce|ketchup|mustard|dressing|vinegar|salt|pepper|garlic|onion)\b/.test(hay)) return "Spices / Flavorings / Condiments";
  if (/\b(flour|baking|yeast|baking powder|baking soda|cornstarch|cocoa)\b/.test(hay)) return "Baking Items";
  if (/\b(oil|fat|butter|sweet|candy|chocolate|dessert|syrup|honey|jam|jelly)\b/.test(hay)) return "Fats / Oils / Sweets";
  if (/\b(milk|cheese|yogurt|yoghurt|dairy|cream)\b/.test(hay)) return "Milk / Cheese / Yogurt";
  if (/\b(apple|banana|orange|fruit|berries|berry|grape|melon|peach|pear|lemon|lime)\b/.test(hay)) return "Fruit";
  if (/\b(vegetable|carrot|tomato|spinach|lettuce|romaine|asparagus|broccoli|edamame|potato|cucumber|cabbage|pepper)\b/.test(hay)) return "Vegetables";
  if (/\b(meat|beef|chicken|poultry|fish|seafood|bean|egg|nut|pork|turkey|sausage|bacon)\b/.test(hay)) return "Meat / Poultry / Fish / Beans / Eggs / Nuts";
  if (/\b(bread|cereal|rice|pasta|spaghetti|bagel|grain|oat|oats|cracker|noodle)\b/.test(hay)) return "Bread / Cereal / Rice / Pasta";
  return "Household Items";
}

function productMatchesSearch(product: HouseholdProduct, query: string): boolean {
  if (!query) {
    return true;
  }
  const hay = [
    product.productName,
    product.brand ?? "",
    product.category,
    product.categoryGroup,
    product.barcode ?? "",
    product.notes,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(query);
}

function pantryListLabel(choice: PantryListChoice): string {
  return PANTRY_LIST_OPTIONS.find((option) => option.id === choice)?.label ?? "Main pantry";
}

function applyPantryListNote(notes: string, choice: PantryListChoice): string {
  const cleaned = notes
    .split("\n")
    .filter((line) => !line.toLowerCase().startsWith("pantry list:"))
    .join("\n")
    .trim();
  const line = `Pantry list: ${pantryListLabel(choice)}`;
  return cleaned ? `${cleaned}\n${line}` : line;
}

export default function PantryTabPage({
  onOpenShopping,
  navigateWithinApp,
  initialScreen = "home",
}: PantryTabPageProps) {
  const { products, pantryProducts, updateProduct, getProductById } = useHouseholdProducts();
  const {
    detailView,
    detailProduct,
    detailMode,
    closeProductDetail,
    updateDetailDraft,
    beginBlankProductDetail,
    beginManualDetailDraft,
    lookupBarcodeDraft,
    lookupBusy,
    lookupMessage,
    duplicateMatch,
    duplicateChoice,
    saveDetailProduct,
    addProductToPantry,
    addDetailToShopping,
    addDetailToPantry,
    enrichProductFromOpenFoodFacts,
  } = useGroceryProductActions();
  const { recordAddToShoppingActivity, commitPantryPendingDeltas } = useInventoryActivityHistory();
  const { addItem, addFromProduct, removeItemsByProductId } = useGroceryCart();

  const productById = useMemo(() => {
    const map = new Map(pantryProducts.map((p) => [p.id, p]));
    return map;
  }, [pantryProducts]);

  const allItems = useMemo(
    () => pantryProducts.map(householdProductToPantryItem),
    [pantryProducts],
  );

  const inventoryItems = useMemo(
    () =>
      allItems.map((item) => pantryItemToFoodInventory(item, productById.get(item.id) ?? null)),
    [allItems, productById],
  );

  const [activeFlow, setActiveFlow] = useState<PantryKioskFlow | null>(null);
  const [screen, setScreen] = useState<PantryKioskScreen>(initialScreen);
  const [selectedItem, setSelectedItem] = useState<FoodInventoryItem | null>(null);
  const [flowSearch, setFlowSearch] = useState("");
  const [inventoryProductSearch, setInventoryProductSearch] = useState("");
  const [locationDetailFilter, setLocationDetailFilter] = useState("all");
  const [locationNoteFilter, setLocationNoteFilter] = useState("");
  const [foodStorageSearch, setFoodStorageSearch] = useState("");
  const [foodStorageHouseholdSize, setFoodStorageHouseholdSize] = useState("1");
  const [foodStorageEntries, setFoodStorageEntries] = useState<FoodStorageEntry[]>(readFoodStorageEntries);
  const [detailItemId, setDetailItemId] = useState("");
  const [physicalCount, setPhysicalCount] = useState(0);
  const [addStep, setAddStep] = useState<AddWizardStep>("product");
  const [addProductId, setAddProductId] = useState("");
  const [addQuantity, setAddQuantity] = useState("1");
  const [addLocation, setAddLocation] = useState<FoodStorageLocation>("pantry");
  const [addLocationArea, setAddLocationArea] = useState<PantryLocationArea>("pantry");
  const [addLocationDetail, setAddLocationDetail] = useState("");
  const [addLocationNote, setAddLocationNote] = useState("");
  const [addPantryList, setAddPantryList] = useState<PantryListChoice>("main");
  const [searchMode, setSearchMode] = useState<"choose" | "actions" | "move">("choose");
  const [completion, setCompletion] = useState<PantryKioskCompletion>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [editing, setEditing] = useState<FoodInventoryItem | null>(null);
  const [manualAddArea, setManualAddArea] = useState<PantryLocationArea | null>(null);
  const [buyMoreItem, setBuyMoreItem] = useState<FoodInventoryItem | null>(null);
  const [buyMoreQuantity, setBuyMoreQuantity] = useState(1);
  const [buyMoreUnit, setBuyMoreUnit] = useState("items");

  const flowSearchNorm = flowSearch.trim().toLowerCase();
  const chooserItems = useMemo(() => {
    return inventoryItems
      .filter((item) => {
        if (!flowSearchNorm) {
          return true;
        }
        const row = allItems.find((entry) => entry.id === item.id);
        return row ? itemMatchesSearch(row, flowSearchNorm) : item.name.toLowerCase().includes(flowSearchNorm);
      })
      .sort((left, right) => {
        const leftPriority = Number(isUseFirstItem(left) || isLowStockItem(left));
        const rightPriority = Number(isUseFirstItem(right) || isLowStockItem(right));
        if (leftPriority !== rightPriority) {
          return rightPriority - leftPriority;
        }
        return left.name.localeCompare(right.name);
      })
      .slice(0, flowSearchNorm ? 18 : 10);
  }, [allItems, flowSearchNorm, inventoryItems]);

  const addProduct = useMemo(
    () => products.find((product) => product.id === addProductId) ?? null,
    [addProductId, products],
  );
  const addLocationDetailOptions = getPantryLocationDetailOptions(addLocationArea);
  const addLocationSummary = formatStructuredPantryLocation({
    area: addLocationArea,
    detail: addLocationDetail || addLocationDetailOptions[0]?.value || "",
    note: addLocationNote,
  });

  const addProductSuggestions = useMemo(() => {
    const query = flowSearch.trim().toLowerCase();
    return products
      .filter((product) => productMatchesSearch(product, query))
      .sort((left, right) => left.productName.localeCompare(right.productName))
      .slice(0, query ? 10 : 6);
  }, [flowSearch, products]);

  const inventoryProductSuggestions = useMemo(() => {
    const query = inventoryProductSearch.trim().toLowerCase();
    if (!query) {
      return [];
    }
    return products
      .filter((product) => productMatchesSearch(product, query))
      .sort((left, right) => left.productName.localeCompare(right.productName))
      .slice(0, 8);
  }, [inventoryProductSearch, products]);

  const foodStorageRows = useMemo(() => {
    const entriesById = new Map(foodStorageEntries.map((entry) => [entry.id, entry]));
    const productRows = inventoryItems.map((item) => {
      const product = productById.get(item.id);
      const fallback: FoodStorageEntry = {
        id: item.id,
        productId: item.id,
        item: item.name,
        unitMeasure: item.unit || product?.unit || "each",
        targetAmount: numberString(Math.max(item.quantity, 1)),
        quantityOnHand: numberString(item.quantity),
        unitCost: parseCurrency(product?.price),
        minimumShelfLife: "",
        dateBought: toDateInputValue(product?.dateAdded ?? product?.createdAt ?? item.createdAt ?? item.updatedAt),
        expireDate: toDateInputValue(product?.expirationDate ?? item.expiryDate),
        dateToRotate: toDateInputValue(product?.expirationDate ?? item.expiryDate),
        adultShareTarget: "",
        custom: false,
      };
      return { ...fallback, ...entriesById.get(item.id), id: item.id, productId: item.id };
    });
    const productIds = new Set(productRows.map((entry) => entry.id));
    const customRows = foodStorageEntries.filter((entry) => entry.custom || !productIds.has(entry.id));
    const rows = [...productRows, ...customRows];
    const query = foodStorageSearch.trim().toLowerCase();
    if (!query) {
      return rows;
    }
    return rows.filter((entry) =>
      [
        entry.item,
        entry.unitMeasure,
        entry.minimumShelfLife,
        entry.dateBought,
        entry.expireDate,
        entry.dateToRotate,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [foodStorageEntries, foodStorageSearch, inventoryItems, productById]);

  useEffect(() => {
    if (!manualAddArea || detailMode !== "edit" || !detailView || detailProduct) {
      return;
    }
    const nextDetail = getPantryLocationDetailOptions(manualAddArea)[0]?.value ?? "";
    updateDetailDraft({
      notes: applyStructuredPantryLocationToNotes(detailView.notes, {
        area: manualAddArea,
        detail: nextDetail,
        note: "",
      }),
    });
    setManualAddArea(null);
  }, [detailMode, detailProduct, detailView, manualAddArea, updateDetailDraft]);

  const detailItem = useMemo(
    () => inventoryItems.find((item) => item.id === detailItemId) ?? null,
    [detailItemId, inventoryItems],
  );
  const detailProductRecord = useMemo(
    () => (detailItem ? getProductById(detailItem.id) : null),
    [detailItem, getProductById],
  );

  function resetFlow() {
    setActiveFlow(null);
    setSelectedItem(null);
    setFlowSearch("");
    setAddStep("product");
    setAddProductId("");
    setAddQuantity("1");
    setAddLocation("pantry");
    setAddLocationArea("pantry");
    setAddLocationDetail(getPantryLocationDetailOptions("pantry")[0]?.value ?? "");
    setAddLocationNote("");
    setAddPantryList("main");
    setSearchMode("choose");
  }

  function startFlow(flow: PantryKioskFlow) {
    setCompletion(null);
    setActiveFlow(flow);
    setSelectedItem(null);
    setFlowSearch("");
    setSearchMode("choose");
    if (flow === "add") {
      setAddStep("product");
      setAddProductId("");
      setAddQuantity("1");
      setAddLocation("pantry");
      setAddLocationArea("pantry");
      setAddLocationDetail(getPantryLocationDetailOptions("pantry")[0]?.value ?? "");
      setAddLocationNote("");
      setAddPantryList("main");
    }
  }

  function updateAddLocationArea(area: PantryLocationArea) {
    const detail = getPantryLocationDetailOptions(area)[0]?.value ?? "";
    setAddLocationArea(area);
    setAddLocationDetail(detail);
    setAddLocation(pantryAreaToFoodStorageLocation(area));
  }

  function hasStructuredLocation(notes: string): boolean {
    return notes.split(/\r?\n/).some((line) => line.trim().toLowerCase().startsWith("location:"));
  }

  function resolveInventoryLocation(item: FoodInventoryItem): {
    area: InventoryLocationArea;
    detail: string;
    detailLabel: string;
    note: string;
  } {
    const product = productById.get(item.id) ?? null;
    const notes = product?.notes ?? "";
    const structured = parseStructuredPantryLocation(notes, item.location);
    const structuredArea = structured.area;
    const detailLabel = formatStructuredPantryLocation(structured).split(" - ").slice(1).join(" - ");

    if (hasStructuredLocation(notes)) {
      if (structuredArea === "fridge" || structuredArea === "freezer" || structuredArea === "pantry") {
        return {
          area: structuredArea,
          detail: structured.detail,
          detailLabel: detailLabel || "Unassigned location",
          note: structured.note,
        };
      }
      return {
        area: "home",
        detail: structured.detail,
        detailLabel: detailLabel || "Home",
        note: structured.note,
      };
    }

    if (product?.categoryGroup === "Home") {
      return {
        area: "home",
        detail: "unassigned",
        detailLabel: "Home items",
        note: notes,
      };
    }

    return {
      area: item.location,
      detail: "unassigned",
      detailLabel: "Unassigned location",
      note: notes,
    };
  }

  function locationScreenForArea(area: InventoryLocationArea): InventoryLocationScreen {
    if (area === "fridge") return "fridges";
    if (area === "freezer") return "freezers";
    if (area === "home") return "homeLocation";
    return "pantryLocation";
  }

  function currentLocationFallback(): FoodStorageLocation | undefined {
    if (screen === "fridges") return "fridge";
    if (screen === "freezers") return "freezer";
    if (screen === "pantryLocation" || screen === "homeLocation") return "pantry";
    return undefined;
  }

  function openInventoryLocation(screenId: InventoryLocationScreen) {
    setScreen(screenId);
    setLocationDetailFilter("all");
    setLocationNoteFilter("");
  }

  function updateFoodStorageEntry(id: string, patch: Partial<FoodStorageEntry>) {
    const current = foodStorageRows.find((entry) => entry.id === id);
    if (!current) {
      return;
    }
    const nextEntry = { ...current, ...patch };
    const nextEntries = [
      ...foodStorageEntries.filter((entry) => entry.id !== id),
      nextEntry,
    ];
    setFoodStorageEntries(nextEntries);
    writeFoodStorageEntries(nextEntries);
  }

  function addCustomFoodStorageItem() {
    const today = new Date().toISOString().slice(0, 10);
    const entry: FoodStorageEntry = {
      id: `custom-food-storage-${crypto.randomUUID()}`,
      item: "Custom item",
      unitMeasure: "each",
      targetAmount: "",
      quantityOnHand: "",
      unitCost: "",
      minimumShelfLife: "",
      dateBought: today,
      expireDate: "",
      dateToRotate: "",
      adultShareTarget: "",
      custom: true,
    };
    const nextEntries = [...foodStorageEntries, entry];
    setFoodStorageEntries(nextEntries);
    writeFoodStorageEntries(nextEntries);
    setFoodStorageSearch("");
  }

  function applyFoodStorageTargetSuggestions() {
    const householdSize = Number(foodStorageHouseholdSize) || 1;
    const suggestedRows = foodStorageRows
      .map((entry) => ({ entry, suggestion: getFoodStorageTargetSuggestion(entry, householdSize) }))
      .filter((row): row is { entry: FoodStorageEntry; suggestion: NonNullable<ReturnType<typeof getFoodStorageTargetSuggestion>> } => row.suggestion != null);
    if (suggestedRows.length === 0) {
      return;
    }
    const suggestionsById = new Map(suggestedRows.map((row) => [row.entry.id, row.suggestion]));
    const nextEntries = foodStorageRows.map((entry) => {
      const suggestion = suggestionsById.get(entry.id);
      if (!suggestion) {
        return entry;
      }
      return {
        ...entry,
        targetAmount: String(suggestion.amount),
        unitMeasure: entry.unitMeasure.trim() ? entry.unitMeasure : suggestion.unitMeasure,
      };
    });
    setFoodStorageEntries(nextEntries);
    writeFoodStorageEntries(nextEntries);
  }

  function startAddFromProduct(product: HouseholdProduct, preferredArea?: PantryLocationArea) {
    startFlow("add");
    chooseAddProduct(product);
    if (preferredArea) {
      const detail = getPantryLocationDetailOptions(preferredArea)[0]?.value ?? "";
      setAddLocationArea(preferredArea);
      setAddLocationDetail(detail);
      setAddLocation(pantryAreaToFoodStorageLocation(preferredArea));
    }
    setInventoryProductSearch("");
  }

  function openManualAdd(preferredArea?: PantryLocationArea) {
    resetFlow();
    setManualAddArea(preferredArea ?? null);
    beginBlankProductDetail();
  }

  function goBack() {
    if (screen === "fridges" || screen === "freezers" || screen === "pantryLocation" || screen === "homeLocation" || screen === "foodStorage") {
      openInventory(false);
      return;
    }
    if (screen === "home" || screen === "inventory") {
      navigateWithinApp?.("/dashboard");
      return;
    }
    openInventory(false);
  }

  function openInventory(searchFirst = false) {
    setScreen("inventory");
    setLocationDetailFilter("all");
    setLocationNoteFilter("");
    if (searchFirst) {
      setInventoryProductSearch("");
    }
  }

  function openItemDetail(item: FoodInventoryItem) {
    setDetailItemId(item.id);
    setPhysicalCount(Math.max(0, item.quantity));
    setScreen("detail");
    resetFlow();
  }

  function openProductDetailsScreen() {
    const item = detailItem ?? inventoryItems[0] ?? null;
    if (item) {
      openItemDetail(item);
      return;
    }
    setScreen("detail");
  }

  function openShoppingPage() {
    if (navigateWithinApp) {
      navigateWithinApp("/shopping");
      return;
    }
    if (onOpenShopping) {
      onOpenShopping();
    }
  }

  function openBuyMore(item: FoodInventoryItem) {
    setBuyMoreItem(item);
    setBuyMoreQuantity(1);
    setBuyMoreUnit(item.unit?.trim() || "items");
  }

  function submitBuyMore() {
    if (!buyMoreItem) {
      return;
    }
    const product = getProductById(buyMoreItem.id);
    if (!product) {
      setBuyMoreItem(null);
      return;
    }
    const quantity = Math.max(1, buyMoreQuantity);
    addItem({
      productId: product.id,
      productName: product.productName,
      imageUrl: product.imageUrl,
      category: product.category,
      quantity,
      unit: buyMoreUnit.trim() || product.unit || "items",
      store: product.store,
      notes: product.notes,
      purchased: false,
    });
    recordAddToShoppingActivity(product);
    setCompletion({
      title: "Added to shopping",
      detail: `${quantity} ${buyMoreUnit.trim() || "items"} of ${product.productName} was added to your shopping list.`,
    });
    setBuyMoreItem(null);
    openShoppingPage();
  }

  function recordPhysicalCount() {
    if (!detailItem) {
      return;
    }
    if (!getProductById(detailItem.id)) {
      return;
    }
    updateProduct(detailItem.id, { quantity: Math.max(0, physicalCount) });
    if (physicalCount > 0) {
      removeItemsByProductId(detailItem.id);
    }
    setCompletion({
      title: "Count recorded",
      detail: `${detailItem.name} now shows ${Math.max(0, physicalCount)} ${detailItem.unit}.`,
    });
    setScreen("inventory");
  }

  function PantryTopBar({ title }: { title: string }) {
    return (
      <header className="wd-pantry-flow__topbar" aria-label={`${title} navigation`}>
        <button type="button" className="wd-pantry-flow__topbar-btn" onClick={goBack}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </button>
        <strong>{title}</strong>
        <span aria-hidden />
      </header>
    );
  }

  function SharedPageSwitcher() {
    const pages: Array<{ id: SharedPantryShoppingPage; label: string; onClick: () => void }> = [
      { id: "inventory", label: "Inventory", onClick: () => openInventory(false) },
      { id: "shopping", label: "Shopping", onClick: openShoppingPage },
      { id: "detail", label: "Product Details", onClick: openProductDetailsScreen },
      { id: "settings", label: "Settings", onClick: () => setScreen("settings") },
    ];
    return (
      <nav className="wd-pantry-flow__page-switcher" aria-label="Shared pantry and shopping pages">
        {pages.map((page) => (
          <button
            key={page.id}
            type="button"
            className={screen === page.id ? "wd-pantry-flow__page-switcher-btn wd-pantry-flow__page-switcher-btn--active" : "wd-pantry-flow__page-switcher-btn"}
            aria-current={screen === page.id ? "page" : undefined}
            disabled={screen === page.id}
            onClick={page.onClick}
          >
            {page.label}
          </button>
        ))}
      </nav>
    );
  }

  function PantryHero({
    title,
    subtitle,
    icon: Icon = PackagePlus,
  }: {
    title: string;
    subtitle: string;
    icon?: typeof PackagePlus;
  }) {
    return (
      <section className="wd-pantry-flow__green-hero">
        <div className="wd-pantry-flow__hero-icon" aria-hidden>
          <Icon className="h-7 w-7" />
        </div>
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </section>
    );
  }

  function renderInventorySearchPanel(label = "Search products", preferredArea?: PantryLocationArea) {
    return (
      <section className="wd-pantry-flow__inventory-command" aria-label={label}>
        <label className="wd-pantry-flow__inventory-command-search">
          <Search className="h-5 w-5" aria-hidden />
          <input
            type="search"
            value={inventoryProductSearch}
            onChange={(event) => setInventoryProductSearch(event.target.value)}
            placeholder="Search product library, category, brand, or barcode..."
          />
        </label>
        <div className="wd-pantry-flow__inventory-command-actions">
          <button type="button" onClick={() => setScanOpen(true)}>
            <ScanLine className="h-4 w-4" aria-hidden />
            Scan New
          </button>
          <button type="button" onClick={() => openManualAdd(preferredArea)}>
            <Plus className="h-4 w-4" aria-hidden />
            Manual Add
          </button>
        </div>
        {inventoryProductSearch.trim() ? (
          <div className="wd-pantry-flow__inventory-suggestions" role="listbox" aria-label="Product library results">
            {inventoryProductSuggestions.length === 0 ? (
              <p>No product match in your current library. Use Scan New or Manual Add.</p>
            ) : (
              inventoryProductSuggestions.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  role="option"
                  onClick={() => startAddFromProduct(product, preferredArea)}
                >
                  <span>
                    <strong>{product.productName}</strong>
                    <small>{product.category} · {product.categoryGroup}</small>
                  </span>
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              ))
            )}
          </div>
        ) : null}
      </section>
    );
  }

  function renderHomeScreen() {
    return renderInventoryScreen();
  }

  function renderInventoryScreen() {
    const locationCards = INVENTORY_LOCATION_PAGES.map((page) => ({
      ...page,
      count: inventoryItems.filter((item) => resolveInventoryLocation(item).area === page.area).length,
      spaceCount: getPantryLocationDetailOptions(page.area as PantryLocationArea).length,
    }));
    const storageCard = {
      count: foodStorageRows.length,
      extendedCost: foodStorageRows.reduce((total, entry) => total + calculateExtendedCost(entry), 0),
    };

    return (
      <div className="wd-pantry-flow__screen wd-pantry-flow__screen--inventory wd-pantry-flow__screen--inventory-hub">
        <PantryTopBar title="Inventory" />
        <SharedPageSwitcher />
        <section className="wd-pantry-flow__inventory-hero" aria-label="Inventory">
          <div>
            <p className="wd-pantry-flow__eyebrow">Inventory</p>
            <h1>Inventory</h1>
            <span>Choose the right storage space, search your product library, scan a new item, or add one manually.</span>
          </div>
          <strong>{inventoryItems.length} items</strong>
        </section>
        {renderInventorySearchPanel("Inventory product search")}
        <section className="wd-pantry-flow__location-hub-grid" aria-label="Inventory locations">
          {locationCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.screen}
                type="button"
                className={`wd-pantry-flow__location-hub-card wd-pantry-flow__location-hub-card--${card.area}`}
                onClick={() => openInventoryLocation(card.screen)}
              >
                <span aria-hidden><Icon className="h-8 w-8" /></span>
                <span className="wd-pantry-flow__location-hub-copy">
                  <strong>{card.title}</strong>
                  <small>{card.detail}</small>
                  <b>{card.helper}</b>
                </span>
                <span className="wd-pantry-flow__location-hub-meta">
                  <em>{card.count} item{card.count === 1 ? "" : "s"}</em>
                  <em>{card.spaceCount} location{card.spaceCount === 1 ? "" : "s"}</em>
                </span>
                <ChevronRight className="wd-pantry-flow__location-hub-arrow h-5 w-5" aria-hidden />
              </button>
            );
          })}
          <button
            type="button"
            className="wd-pantry-flow__location-hub-card wd-pantry-flow__location-hub-card--food-storage"
            onClick={() => setScreen("foodStorage")}
          >
            <span aria-hidden><PackagePlus className="h-8 w-8" /></span>
            <span className="wd-pantry-flow__location-hub-copy">
              <strong>Food Storage</strong>
              <small>Plan target amounts, shelf life, rotate dates, and storage costs.</small>
              <b>Editable planning table</b>
            </span>
            <span className="wd-pantry-flow__location-hub-meta">
              <em>{storageCard.count} row{storageCard.count === 1 ? "" : "s"}</em>
              <em>{formatMoney(storageCard.extendedCost)}</em>
            </span>
            <ChevronRight className="wd-pantry-flow__location-hub-arrow h-5 w-5" aria-hidden />
          </button>
        </section>
        <button type="button" className="wd-pantry-flow__fab" aria-label="Scan item" onClick={() => setScanOpen(true)}>
          <ScanLine className="h-6 w-6" aria-hidden />
        </button>
      </div>
    );
  }

  function renderInventoryLocationScreen(screenId: InventoryLocationScreen) {
    const page = INVENTORY_LOCATION_PAGES.find((entry) => entry.screen === screenId) ?? INVENTORY_LOCATION_PAGES[0];
    const detailOptions = getPantryLocationDetailOptions(page.area as PantryLocationArea);
    const noteQuery = locationNoteFilter.trim().toLowerCase();
    const locationItems = inventoryItems
      .map((item) => ({ item, location: resolveInventoryLocation(item) }))
      .filter((entry) => entry.location.area === page.area)
      .filter((entry) => !noteQuery || entry.location.note.toLowerCase().includes(noteQuery))
      .filter((entry) => locationDetailFilter === "all" || entry.location.detail === locationDetailFilter);

    return (
      <div className="wd-pantry-flow__screen wd-pantry-flow__screen--inventory wd-pantry-flow__screen--location">
        <PantryTopBar title={page.title} />
        <SharedPageSwitcher />
        <section className="wd-pantry-flow__inventory-hero wd-pantry-flow__inventory-hero--location" aria-label={`${page.title} inventory`}>
          <div>
            <p className="wd-pantry-flow__eyebrow">Inventory Location</p>
            <h1>{page.title}</h1>
            <span>{page.detail}</span>
          </div>
          <strong>{locationItems.length} items</strong>
        </section>
        {renderInventorySearchPanel(`${page.title} product search`, page.area as PantryLocationArea)}

        <section className="wd-pantry-flow__location-controls" aria-label={`${page.title} location controls`}>
          <label>
            <span>Location Group</span>
            <select
              value={page.area}
              onChange={(event) => openInventoryLocation(locationScreenForArea(event.target.value as InventoryLocationArea))}
              disabled={page.area === "fridge" || page.area === "freezer" || page.area === "pantry"}
            >
              {page.area === "fridge" || page.area === "freezer" || page.area === "pantry" ? (
                <option value={page.area}>
                  {page.area === "fridge" ? "Fridge" : page.area === "freezer" ? "Freezer" : "Pantry"}
                </option>
              ) : (
                INVENTORY_LOCATION_PAGES.map((entry) => (
                  <option key={entry.area} value={entry.area}>
                    {entry.title}
                  </option>
                ))
              )}
            </select>
          </label>
          <label>
            <span>Location Detail</span>
            <select value={locationDetailFilter} onChange={(event) => setLocationDetailFilter(event.target.value)}>
              <option value="all">All {page.title}</option>
              {detailOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Location Note</span>
            <input
              value={locationNoteFilter}
              placeholder="Filter by saved location note"
              onChange={(event) => setLocationNoteFilter(event.target.value)}
            />
          </label>
        </section>

        <button type="button" className="wd-pantry-flow__fab" aria-label="Scan item" onClick={() => setScanOpen(true)}>
          <ScanLine className="h-6 w-6" aria-hidden />
        </button>
      </div>
    );
  }

  function renderFoodStorageScreen() {
    const totalNeeded = foodStorageRows.reduce((total, entry) => total + calculateAmountNeeded(entry), 0);
    const totalCost = foodStorageRows.reduce((total, entry) => total + calculateExtendedCost(entry), 0);
    const householdSize = Number(foodStorageHouseholdSize) || 1;
    const suggestedTargetCount = foodStorageRows.filter((entry) =>
      getFoodStorageTargetSuggestion(entry, householdSize) != null,
    ).length;
    const foodStorageGroups = FOOD_STORAGE_SECTIONS.map((section) => ({
      section,
      rows: foodStorageRows.filter((entry) => {
        const product = productById.get(entry.productId ?? entry.id);
        return resolveFoodStorageSection(entry, product?.category) === section;
      }),
    })).filter((group) => group.rows.length > 0);

    function renderFoodStorageRow(entry: FoodStorageEntry) {
      const amountNeeded = calculateAmountNeeded(entry);
      const extendedCost = calculateExtendedCost(entry);
      const suggestion = getFoodStorageTargetSuggestion(entry, householdSize);
      return (
        <article key={entry.id} className="wd-pantry-flow__food-storage-row">
          <label>
            <span>Item</span>
            <input
              value={entry.item}
              onChange={(event) => updateFoodStorageEntry(entry.id, { item: event.target.value })}
            />
          </label>
          <label>
            <span>Unit Measure</span>
            <input
              value={entry.unitMeasure}
              onChange={(event) => updateFoodStorageEntry(entry.id, { unitMeasure: event.target.value })}
            />
          </label>
          <label>
            <span>Target Amount</span>
            <input
              type="number"
              min={0}
              step="any"
              value={entry.targetAmount}
              placeholder={suggestion ? String(suggestion.amount) : "Manual"}
              onChange={(event) => updateFoodStorageEntry(entry.id, { targetAmount: event.target.value })}
            />
            {suggestion ? <small>Suggested: {suggestion.amount} {suggestion.unitMeasure}</small> : null}
          </label>
          <label>
            <span>Quantity On Hand</span>
            <input
              type="number"
              min={0}
              step="any"
              value={entry.quantityOnHand}
              onChange={(event) => updateFoodStorageEntry(entry.id, { quantityOnHand: event.target.value })}
            />
          </label>
          <div>
            <span>Amount Needed</span>
            <strong>{amountNeeded}</strong>
          </div>
          <label>
            <span>Unit Cost</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={entry.unitCost}
              onChange={(event) => updateFoodStorageEntry(entry.id, { unitCost: event.target.value })}
            />
          </label>
          <div>
            <span>Extended Cost</span>
            <strong>{formatMoney(extendedCost)}</strong>
          </div>
          <label>
            <span>Minimum Shelf Life</span>
            <input
              value={entry.minimumShelfLife}
              placeholder="e.g. 12 months"
              onChange={(event) => updateFoodStorageEntry(entry.id, { minimumShelfLife: event.target.value })}
            />
          </label>
          <label>
            <span>Date Bought</span>
            <input
              type="date"
              value={entry.dateBought}
              onChange={(event) => updateFoodStorageEntry(entry.id, { dateBought: event.target.value })}
            />
          </label>
          <label>
            <span>Expire Date</span>
            <input
              type="date"
              value={entry.expireDate}
              onChange={(event) => updateFoodStorageEntry(entry.id, { expireDate: event.target.value })}
            />
          </label>
          <label>
            <span>Date to Rotate</span>
            <input
              type="date"
              value={entry.dateToRotate}
              onChange={(event) => updateFoodStorageEntry(entry.id, { dateToRotate: event.target.value })}
            />
          </label>
          <label>
            <span>Adult Share</span>
            <input
              type="number"
              min={0}
              step="any"
              value={entry.adultShareTarget}
              onChange={(event) => updateFoodStorageEntry(entry.id, { adultShareTarget: event.target.value })}
            />
          </label>
        </article>
      );
    }

    return (
      <div className="wd-pantry-flow__screen wd-pantry-flow__screen--inventory wd-pantry-flow__screen--food-storage">
        <PantryTopBar title="Food Storage" />
        <SharedPageSwitcher />
        <section className="wd-pantry-flow__inventory-hero wd-pantry-flow__inventory-hero--location" aria-label="Food Storage">
          <div>
            <p className="wd-pantry-flow__eyebrow">Inventory Planner</p>
            <h1>Food Storage</h1>
            <span>Editable storage planning fields for quantities, shelf life, rotate dates, and cost.</span>
          </div>
          <strong>{foodStorageRows.length} rows</strong>
        </section>

        {renderInventorySearchPanel("Food Storage product search")}

        <section className="wd-pantry-flow__food-storage-calculator" aria-label="Food Storage target setup">
          <div>
            <p className="wd-pantry-flow__eyebrow">1-Year Target Setup</p>
            <h2>Household-size target suggestions</h2>
            <span>
              Suggested targets fill supported rows only. Every Target Amount remains editable after applying.
            </span>
          </div>
          <label>
            <span>Household size</span>
            <select
              value={foodStorageHouseholdSize}
              onChange={(event) => setFoodStorageHouseholdSize(event.target.value)}
            >
              {FOOD_STORAGE_HOUSEHOLD_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size} {size === 1 ? "person" : "people"}
                </option>
              ))}
            </select>
          </label>
          <article>
            <span>Supported matches</span>
            <strong>{suggestedTargetCount}</strong>
          </article>
          <button type="button" onClick={applyFoodStorageTargetSuggestions} disabled={suggestedTargetCount === 0}>
            Apply Suggested Targets
          </button>
        </section>

        <section className="wd-pantry-flow__food-storage-summary" aria-label="Food Storage summary">
          <article>
            <span>Rows</span>
            <strong>{foodStorageRows.length}</strong>
          </article>
          <article>
            <span>Amount Needed</span>
            <strong>{totalNeeded}</strong>
          </article>
          <article>
            <span>Extended Cost</span>
            <strong>{formatMoney(totalCost)}</strong>
          </article>
          <button type="button" onClick={addCustomFoodStorageItem}>
            <Plus className="h-4 w-4" aria-hidden />
            Add Custom Item
          </button>
        </section>

        <section className="wd-pantry-flow__food-storage-search" aria-label="Search Food Storage rows">
          <label>
            <Search className="h-4 w-4" aria-hidden />
            <input
              type="search"
              value={foodStorageSearch}
              onChange={(event) => setFoodStorageSearch(event.target.value)}
              placeholder="Filter Food Storage rows..."
            />
          </label>
        </section>

        <section className="wd-pantry-flow__food-storage-table" aria-label="Food Storage editable table">
          {foodStorageGroups.length === 0 ? (
            <p className="wd-pantry-flow__empty">No Food Storage rows match this search.</p>
          ) : (
            foodStorageGroups.map((group) => (
              <section key={group.section} className="wd-pantry-flow__food-storage-section">
                <header className="wd-pantry-flow__food-storage-section-head">
                  <div>
                    <p className="wd-pantry-flow__eyebrow">Food Planner Section</p>
                    <h2>{group.section}</h2>
                  </div>
                  <span>{group.rows.length} row{group.rows.length === 1 ? "" : "s"}</span>
                </header>
                <div className="wd-pantry-flow__food-storage-scroll">
                  <div className="wd-pantry-flow__food-storage-head" aria-hidden>
                    <span>Item</span>
                    <span>Unit</span>
                    <span>Target</span>
                    <span>On Hand</span>
                    <span>Needed</span>
                    <span>Unit Cost</span>
                    <span>Extended</span>
                    <span>Shelf Life</span>
                    <span>Date Bought</span>
                    <span>Expire</span>
                    <span>Rotate</span>
                    <span>Adult Share</span>
                  </div>
                  {group.rows.map(renderFoodStorageRow)}
                </div>
              </section>
            ))
          )}
        </section>
      </div>
    );
  }

  function renderDetailScreen() {
    if (!detailItem) {
      return (
        <div className="wd-pantry-flow__screen wd-pantry-flow__screen--detail">
          <PantryTopBar title="Product Details" />
          <SharedPageSwitcher />
          <PantryHero title="Product Details" subtitle="Choose a pantry item first." />
          <section className="wd-pantry-flow__detail-card">
            <header>
              <h2>Product Information</h2>
            </header>
            <p className="wd-pantry-flow__empty">No product selected yet. Open Inventory and choose a location item.</p>
          </section>
        </div>
      );
    }
    const adjustment = physicalCount - detailItem.quantity;
    const priceLabel = detailProductRecord?.price?.trim() || "Not set";
    return (
      <div className="wd-pantry-flow__screen wd-pantry-flow__screen--detail">
        <PantryTopBar title="Product Details" />
        <SharedPageSwitcher />
        <PantryHero title="Product Details" subtitle="Pantry" />
        <section className="wd-pantry-flow__detail-card">
          <header>
            <h2>Product Information</h2>
            <button type="button" onClick={() => setEditing(detailItem)}>Edit</button>
          </header>
          <div className="wd-pantry-flow__detail-product">
            <span className="wd-pantry-flow__product-thumb wd-pantry-flow__product-thumb--large" aria-hidden>
              {detailItem.imageUrl ? <img src={detailItem.imageUrl} alt="" loading="lazy" /> : detailItem.name.charAt(0)}
            </span>
            <div>
              <h3>{detailItem.name}</h3>
              <p>{detailItem.category} · {INVENTORY_LOCATION_META[detailItem.location].label}</p>
            </div>
          </div>
          <dl className="wd-pantry-flow__detail-info-list">
            <div>
              <dt><Barcode className="h-4 w-4" aria-hidden /> Barcode</dt>
              <dd>{detailItem.barcode?.trim() || "Not saved"}</dd>
            </div>
            <div>
              <dt><DollarSign className="h-4 w-4" aria-hidden /> Price</dt>
              <dd>{priceLabel}</dd>
            </div>
            <div>
              <dt><MapPin className="h-4 w-4" aria-hidden /> Location</dt>
              <dd>{INVENTORY_LOCATION_META[detailItem.location].label}</dd>
            </div>
          </dl>
        </section>

        <h2 className="wd-pantry-flow__section-title">Inventory Check</h2>
        <section className="wd-pantry-flow__count-grid" aria-label="Inventory check">
          <article>
            <span><PackagePlus className="h-7 w-7" aria-hidden /></span>
            <strong>{detailItem.quantity}</strong>
            <small>Current Stock</small>
          </article>
          <article>
            <span><CheckCircle2 className="h-7 w-7" aria-hidden /></span>
            <strong>{physicalCount}</strong>
            <small>Physical Count</small>
          </article>
        </section>

        <section className="wd-pantry-flow__count-card">
          <h2>Adjust Physical Count</h2>
          <p>Quantity</p>
          <div className="wd-pantry-flow__stepper">
            <button type="button" onClick={() => setPhysicalCount((count) => Math.max(0, count - 1))}>-</button>
            <strong>{physicalCount}<span>items</span></strong>
            <button type="button" onClick={() => setPhysicalCount((count) => count + 1)}>+</button>
          </div>
          <div className="wd-pantry-flow__quick-counts">
            {[...new Set([Math.max(0, detailItem.quantity - 1), detailItem.quantity, detailItem.quantity + 1])].map((count) => (
              <button
                key={count}
                type="button"
                className={count === physicalCount ? "wd-pantry-flow__quick-count wd-pantry-flow__quick-count--active" : "wd-pantry-flow__quick-count"}
                onClick={() => setPhysicalCount(count)}
              >
                {count}
              </button>
            ))}
          </div>
        </section>

        <section className="wd-pantry-flow__summary-card">
          <div>
            <h2>Adjustment Summary</h2>
            <p>{adjustment === 0 ? "No Change" : adjustment > 0 ? `+${adjustment}` : String(adjustment)}</p>
          </div>
          <div>
            <span>New Total</span>
            <strong>{physicalCount}</strong>
          </div>
        </section>

        <footer className="wd-pantry-flow__bottom-bar">
          <button type="button" className="wd-pantry-flow__bottom-primary" onClick={recordPhysicalCount}>
            <Check className="h-4 w-4" aria-hidden />
            Record Count
          </button>
          <div>
            <button type="button" onClick={() => handleMarkUsed(detailItem)}>
              Used Up
            </button>
            <button type="button" onClick={() => handleMarkUsed(detailItem, true)}>
              Used Up + Shopping
            </button>
            <button type="button" onClick={() => setScanOpen(true)}>Scan Another</button>
            <button type="button" onClick={() => setScreen("inventory")}>Finish Session</button>
          </div>
        </footer>
      </div>
    );
  }

  function renderSettingsScreen() {
    const locationCards = FOOD_STORAGE_LOCATIONS.map((location) => ({
      location,
      label: INVENTORY_LOCATION_META[location].label,
      count: inventoryItems.filter((item) => item.location === location).length,
    }));

    return (
      <div className="wd-pantry-flow__screen wd-pantry-flow__screen--settings">
        <PantryTopBar title="Settings" />
        <SharedPageSwitcher />
        <PantryHero title="Settings" subtitle="Shared household pantry settings." />
        <section className="wd-pantry-flow__settings-stack" aria-label="Pantry settings">
          <article className="wd-pantry-flow__settings-card">
            <header>
              <span aria-hidden><Barcode className="h-5 w-5" /></span>
              <h2>Barcode Lookup</h2>
            </header>
            <div className="wd-pantry-flow__settings-row">
              <div>
                <strong>Product Name Format</strong>
                <small>Long Names (Recommended)</small>
              </div>
              <ChevronRight className="h-4 w-4" aria-hidden />
            </div>
            <p>Products keep brand names when scanned and can still be edited after lookup.</p>
          </article>

          <article className="wd-pantry-flow__settings-card">
            <header>
              <span aria-hidden><Home className="h-5 w-5" /></span>
              <h2>Inventory Spaces</h2>
            </header>
            {locationCards.map((entry) => (
              <button
                key={entry.location}
                type="button"
                className="wd-pantry-flow__settings-row"
                onClick={() => {
                  setScreen("inventory");
                }}
              >
                <div>
                  <strong>{entry.label}</strong>
                  <small>{entry.count} item{entry.count === 1 ? "" : "s"}</small>
                </div>
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            ))}
          </article>
        </section>
      </div>
    );
  }

  function renderBuyMoreSheet() {
    if (!buyMoreItem) {
      return null;
    }
    const quickCounts = [1, 2, 3, 5];
    return (
      <div className="wd-pantry-flow__sheet-backdrop" role="presentation" onClick={() => setBuyMoreItem(null)}>
        <section
          className="wd-pantry-flow__buy-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wd-pantry-buy-title"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="wd-pantry-flow__buy-head">
            <span aria-hidden><ShoppingCart className="h-5 w-5" /></span>
            <div>
              <h2 id="wd-pantry-buy-title">Buy More</h2>
              <p>Add {buyMoreItem.name} to your shopping list</p>
            </div>
            <button type="button" aria-label="Close Buy More" onClick={() => setBuyMoreItem(null)}>
              <X className="h-4 w-4" aria-hidden />
            </button>
          </header>

          <article className="wd-pantry-flow__buy-stock">
            <span>Current Stock</span>
            <strong>{buyMoreItem.quantity} {buyMoreItem.unit}</strong>
          </article>

          <section className="wd-pantry-flow__buy-count" aria-label="Buy more quantity">
            <p>How many would you like to buy?</p>
            <div className="wd-pantry-flow__stepper">
              <button type="button" onClick={() => setBuyMoreQuantity((count) => Math.max(1, count - 1))}>-</button>
              <strong>{buyMoreQuantity}</strong>
              <button type="button" onClick={() => setBuyMoreQuantity((count) => count + 1)}>+</button>
            </div>
            <div className="wd-pantry-flow__quick-counts">
              {quickCounts.map((count) => (
                <button
                  key={count}
                  type="button"
                  className={count === buyMoreQuantity ? "wd-pantry-flow__quick-count wd-pantry-flow__quick-count--active" : "wd-pantry-flow__quick-count"}
                  onClick={() => setBuyMoreQuantity(count)}
                >
                  {count}
                </button>
              ))}
            </div>
          </section>

          <label className="wd-pantry-flow__buy-field">
            <span>Unit</span>
            <select value={buyMoreUnit} onChange={(event) => setBuyMoreUnit(event.target.value)}>
              {[...new Set([buyMoreItem.unit || "items", "items", "boxes", "bags", "jars", "gallons"])].map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </label>
          <label className="wd-pantry-flow__buy-field">
            <span>Add to</span>
            <select defaultValue="shopping-list">
              <option value="shopping-list">Shopping List</option>
            </select>
          </label>

          <article className="wd-pantry-flow__buy-summary">
            <span>Summary</span>
            <strong>Add <em>{buyMoreQuantity} {buyMoreUnit || "items"}</em> of {buyMoreItem.name}</strong>
          </article>

          <footer className="wd-pantry-flow__buy-actions">
            <button type="button" onClick={() => setBuyMoreItem(null)}>Cancel</button>
            <button type="button" onClick={submitBuyMore}>
              <ShoppingCart className="h-4 w-4" aria-hidden />
              Add to List
            </button>
          </footer>
        </section>
      </div>
    );
  }

  function chooseAddProduct(product: HouseholdProduct) {
    const fallbackLocation = product.categoryGroup === "Cold" ? "freezer" : product.categoryGroup === "Fresh" ? "fridge" : "pantry";
    const structuredLocation = parseStructuredPantryLocation(product.notes, fallbackLocation);
    const nextArea = product.categoryGroup === "Home" && !hasStructuredLocation(product.notes)
      ? "home"
      : structuredLocation.area;
    const nextDetail = nextArea === structuredLocation.area
      ? structuredLocation.detail
      : getPantryLocationDetailOptions(nextArea)[0]?.value ?? "";
    setAddProductId(product.id);
    setAddQuantity(String(Math.max(1, product.quantity ?? 1)));
    setAddLocationArea(nextArea);
    setAddLocationDetail(nextDetail);
    setAddLocationNote(structuredLocation.note);
    setAddLocation(pantryAreaToFoodStorageLocation(nextArea));
    setAddStep("quantity");
  }

  function addStepBack() {
    if (addStep === "product") {
      resetFlow();
      return;
    }
    if (addStep === "quantity") {
      setAddStep("product");
      return;
    }
    if (addStep === "location") {
      setAddStep("quantity");
      return;
    }
    if (addStep === "pantry-list") {
      setAddStep("location");
      return;
    }
    setAddStep(addLocationArea === "pantry" ? "pantry-list" : "location");
  }

  function submitAddWizard() {
    if (!addProduct) {
      return;
    }
    const quantity = Math.max(1, Number(addQuantity) || 1);
    const nextCategoryGroup = (
      addLocationArea === "home" ? "Home" : foodLocationToCategoryGroup(addLocation)
    ) as GroceryCategoryGroupId;
    const listNotes = addLocationArea === "pantry"
      ? applyPantryListNote(addProduct.notes, addPantryList)
      : addProduct.notes;
    const notes = applyStructuredPantryLocationToNotes(listNotes, {
      area: addLocationArea,
      detail: addLocationDetail || getPantryLocationDetailOptions(addLocationArea)[0]?.value || "",
      note: addLocationNote,
    });

    updateProduct(addProduct.id, {
      need: false,
      categoryGroup: nextCategoryGroup,
      notes,
    });
    commitPantryPendingDeltas({ [addProduct.id]: quantity }, products);
    removeItemsByProductId(addProduct.id);
    setCompletion({
      title: "Pantry item added",
      detail: `${quantity} ${addProduct.unit?.trim() || "each"} of ${addProduct.productName} went to ${addLocationSummary}.`,
    });
    resetFlow();
  }

  const handleMarkUsed = useCallback(
    (item: FoodInventoryItem, addToShopping = false) => {
      const row = allItems.find((entry) => entry.id === item.id);
      if (row) {
        recordPantryItemUsed(row.productName || row.name, row.category);
      }
      const product = getProductById(item.id);
      const usedQuantity = Math.max(1, item.quantity);
      commitPantryPendingDeltas({ [item.id]: -usedQuantity }, pantryProducts);
      if (addToShopping && product) {
        addFromProduct(product);
      }
      setCompletion({
        title: addToShopping ? "Used up and added to shopping" : "Pantry updated",
        detail: addToShopping
          ? `${item.name} was marked used up and added to the shared shopping list.`
          : `${item.name} was marked used up and removed from inventory.`,
      });
      resetFlow();
    },
    [addFromProduct, allItems, commitPantryPendingDeltas, getProductById, pantryProducts],
  );

  const handleProductDetailUsedUp = useCallback(
    (productId: string, addToShopping = false) => {
      const item = inventoryItems.find((entry) => entry.id === productId);
      if (!item) {
        return;
      }
      handleMarkUsed(item, addToShopping);
      closeProductDetail();
    },
    [closeProductDetail, handleMarkUsed, inventoryItems],
  );

  const handleSaveEdit = useCallback(
    (id: string, patch: Partial<Omit<FoodInventoryItem, "id">> & { notes?: string }) => {
      const product = getProductById(id);
      if (!product) {
        return;
      }
      const structuredLocation = patch.notes
        ? parseStructuredPantryLocation(
            patch.notes,
            patch.location ?? categoryGroupToFoodLocation(product.categoryGroup),
          )
        : null;
      updateProduct(id, {
        productName: patch.name?.trim() || product.productName,
        quantity: patch.quantity ?? product.quantity,
        unit: patch.unit ?? product.unit,
        expirationDate: patch.expiryDate ?? product.expirationDate,
        category: patch.category?.trim() || product.category,
        categoryGroup: structuredLocation?.area === "home"
          ? "Home"
          : patch.location
            ? foodLocationToCategoryGroup(patch.location)
            : product.categoryGroup,
        notes: patch.notes ?? product.notes,
      });
      setCompletion({
        title: "Item saved",
        detail: `${patch.name?.trim() || product.productName} was updated.`,
      });
    },
    [getProductById, updateProduct],
  );

  const handleMove = useCallback(
    (item: FoodInventoryItem, location: FoodStorageLocation) => {
      const product = getProductById(item.id);
      if (!product) {
        return;
      }
      updateProduct(item.id, { categoryGroup: foodLocationToCategoryGroup(location) });
      setCompletion({
        title: "Item moved",
        detail: `${item.name} now lives in ${INVENTORY_LOCATION_META[location].label}.`,
      });
      resetFlow();
    },
    [getProductById, updateProduct],
  );

  async function handleScanLookup(barcode: string) {
    trackCardScan(ANALYTICS_SURFACE);
    const draft = await lookupBarcodeDraft(barcode);
    if (draft) {
      setScanOpen(false);
    }
  }

  function handleManualScanEntry(barcode: string) {
    beginManualDetailDraft(barcode);
    setScanOpen(false);
  }

  function renderItemSummary(item: FoodInventoryItem) {
    const letter = item.name.trim().charAt(0).toUpperCase() || "?";
    return (
      <div className="wd-pantry-flow__item-summary">
        <span className="wd-pantry-flow__item-media" aria-hidden>
          {item.imageUrl ? <img src={item.imageUrl} alt="" loading="lazy" /> : <span>{letter}</span>}
        </span>
        <span className="wd-pantry-flow__item-copy">
          <strong>{item.name}</strong>
          <span>
            {item.quantity} {item.unit} · {INVENTORY_LOCATION_META[item.location].label} · {item.category}
          </span>
        </span>
      </div>
    );
  }

  function ProductChoiceSummary({ product }: { product: HouseholdProduct }) {
    const letter = product.productName.trim().charAt(0).toUpperCase() || "?";
    return (
      <div className="wd-pantry-flow__item-summary wd-pantry-flow__item-summary--product">
        <span className="wd-pantry-flow__item-media" aria-hidden>
          {product.imageUrl ? <img src={product.imageUrl} alt="" loading="lazy" /> : <span>{letter}</span>}
        </span>
        <span className="wd-pantry-flow__item-copy">
          <strong>{product.productName}</strong>
          <span>
            {product.category} · {product.categoryGroup} · {product.quantity ?? 0} {product.unit || "each"} now
          </span>
        </span>
      </div>
    );
  }

  function renderFlowSheet() {
    if (!activeFlow) {
      return null;
    }
    const isAddFlow = activeFlow === "add";
    const title = isAddFlow
      ? addStep === "product"
        ? "What are you adding?"
        : addStep === "quantity"
          ? "How many are you adding?"
          : addStep === "location"
            ? "Where should it live?"
            : addStep === "pantry-list"
              ? "Which pantry list?"
              : "Confirm pantry item"
      : selectedItem
        ? "Item actions"
        : "Search pantry";
    const description = isAddFlow
      ? "Answer one question at a time, then save the item to the pantry."
      : selectedItem
        ? "Choose what you want to do with this item."
        : "Find one item, then open details or take a quick action.";

    return (
      <div className="wd-pantry-flow__sheet-backdrop" role="presentation" onClick={resetFlow}>
        <section
          className="wd-pantry-flow__sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wd-pantry-flow-title"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="wd-pantry-flow__sheet-head">
            <div>
              <p className="wd-pantry-flow__eyebrow">
                {isAddFlow ? `Add item · ${addStep === "product" ? "Step 1" : addStep === "quantity" ? "Step 2" : addStep === "location" ? "Step 3" : addStep === "pantry-list" ? "Step 4" : "Final step"}` : "Search"}
              </p>
              <h2 id="wd-pantry-flow-title" className="wd-pantry-flow__sheet-title">
                {title}
              </h2>
              <p className="wd-pantry-flow__sheet-copy">{description}</p>
            </div>
            <button
              type="button"
              className="wd-pantry-flow__icon-btn"
              aria-label="Close pantry action"
              onClick={resetFlow}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </header>

          {isAddFlow ? (
            <div className="wd-pantry-flow__step">
              {addStep === "product" ? (
                <>
                  <label className="wd-pantry-flow__search">
                    <Search className="h-4 w-4" aria-hidden />
                    <input
                      type="search"
                      value={flowSearch}
                      onChange={(event) => setFlowSearch(event.target.value)}
                      placeholder="Search product name, category, brand, or barcode..."
                      autoFocus
                    />
                  </label>
                  <div className="wd-pantry-flow__chooser" role="listbox" aria-label="Choose product to add">
                    {addProductSuggestions.length === 0 ? (
                      <div className="wd-pantry-flow__empty">
                        <p>No local product match yet.</p>
                        <button type="button" className="wd-pantry-flow__primary" onClick={() => setScanOpen(true)}>
                          Scan barcode instead
                        </button>
                      </div>
                    ) : (
                      addProductSuggestions.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          className="wd-pantry-flow__chooser-row"
                          role="option"
                          onClick={() => chooseAddProduct(product)}
                        >
                          <span className="wd-pantry-flow__item-copy">
                            <strong>{product.productName}</strong>
                            <span>
                              {product.category} · {product.categoryGroup} · {product.quantity ?? 0} {product.unit || "each"}
                            </span>
                          </span>
                          <ChevronRight className="h-4 w-4" aria-hidden />
                        </button>
                      ))
                    )}
                  </div>
                </>
              ) : null}

              {addStep === "quantity" && addProduct ? (
                <div className="wd-pantry-flow__confirm">
                  <ProductChoiceSummary product={addProduct} />
                  <label className="wd-pantry-flow__field">
                    <span>How many are you adding?</span>
                    <select value={addQuantity} onChange={(event) => setAddQuantity(event.target.value)} autoFocus>
                      {ADD_QUANTITY_OPTIONS.map((quantity) => (
                        <option key={quantity} value={quantity}>
                          {quantity}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="wd-pantry-flow__confirm-actions">
                    <button type="button" className="wd-pantry-flow__secondary" onClick={addStepBack}>
                      Back
                    </button>
                    <button type="button" className="wd-pantry-flow__primary" onClick={() => setAddStep("location")}>
                      Continue
                    </button>
                  </div>
                </div>
              ) : null}

              {addStep === "location" && addProduct ? (
                <div className="wd-pantry-flow__confirm">
                  <ProductChoiceSummary product={addProduct} />
                  <label className="wd-pantry-flow__field">
                    <span>Location group</span>
                    <select
                      value={addLocationArea}
                      onChange={(event) => updateAddLocationArea(event.target.value as PantryLocationArea)}
                      autoFocus
                    >
                      {PANTRY_LOCATION_AREAS.map((area) => (
                        <option key={area.id} value={area.id}>
                          {area.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="wd-pantry-flow__field">
                    <span>Location detail</span>
                    <select value={addLocationDetail} onChange={(event) => setAddLocationDetail(event.target.value)}>
                      {addLocationDetailOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="wd-pantry-flow__field">
                    <span>Location note</span>
                    <input
                      value={addLocationNote}
                      placeholder="Add shelf detail, other location, or notes"
                      onChange={(event) => setAddLocationNote(event.target.value)}
                    />
                  </label>
                  <div className="wd-pantry-flow__confirm-actions">
                    <button type="button" className="wd-pantry-flow__secondary" onClick={addStepBack}>
                      Back
                    </button>
                    <button
                      type="button"
                      className="wd-pantry-flow__primary"
                      onClick={() => setAddStep(addLocationArea === "pantry" ? "pantry-list" : "confirm")}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              ) : null}

              {addStep === "pantry-list" && addProduct ? (
                <div className="wd-pantry-flow__confirm">
                  <ProductChoiceSummary product={addProduct} />
                  <label className="wd-pantry-flow__field">
                    <span>Which pantry list?</span>
                    <select value={addPantryList} onChange={(event) => setAddPantryList(event.target.value as PantryListChoice)} autoFocus>
                      {PANTRY_LIST_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <small>{PANTRY_LIST_OPTIONS.find((option) => option.id === addPantryList)?.hint}</small>
                  </label>
                  <div className="wd-pantry-flow__confirm-actions">
                    <button type="button" className="wd-pantry-flow__secondary" onClick={addStepBack}>
                      Back
                    </button>
                    <button type="button" className="wd-pantry-flow__primary" onClick={() => setAddStep("confirm")}>
                      Continue
                    </button>
                  </div>
                </div>
              ) : null}

              {addStep === "confirm" && addProduct ? (
                <div className="wd-pantry-flow__confirm">
                  <ProductChoiceSummary product={addProduct} />
                  <article className="wd-pantry-flow__review-card">
                    <dl>
                      <div>
                        <dt>Adding</dt>
                        <dd>{addQuantity} {addProduct.unit || "each"}</dd>
                      </div>
                      <div>
                        <dt>Location</dt>
                        <dd>{addLocationSummary}</dd>
                      </div>
                      {addLocationArea === "pantry" ? (
                        <div>
                          <dt>List</dt>
                          <dd>{pantryListLabel(addPantryList)}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </article>
                  <div className="wd-pantry-flow__confirm-actions">
                    <button type="button" className="wd-pantry-flow__secondary" onClick={addStepBack}>
                      Back
                    </button>
                    <button type="button" className="wd-pantry-flow__primary" onClick={submitAddWizard}>
                      Submit
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : !selectedItem ? (
            <>
              <label className="wd-pantry-flow__search">
                <Search className="h-4 w-4" aria-hidden />
                <input
                  type="search"
                  value={flowSearch}
                  onChange={(event) => setFlowSearch(event.target.value)}
                  placeholder="Search pantry item..."
                  autoFocus
                />
              </label>
              <div className="wd-pantry-flow__chooser" role="listbox" aria-label="Choose pantry item">
                {chooserItems.length === 0 ? (
                  <p className="wd-pantry-flow__empty">No matching pantry items. Try another search.</p>
                ) : (
                  chooserItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="wd-pantry-flow__chooser-row"
                      role="option"
                      onClick={() => {
                        setSelectedItem(item);
                        setSearchMode("actions");
                      }}
                    >
                      {renderItemSummary(item)}
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </button>
                  ))
                )}
              </div>
            </>
          ) : searchMode === "move" ? (
            <div className="wd-pantry-flow__confirm">
              {renderItemSummary(selectedItem)}
              <div className="wd-pantry-flow__location-grid">
                {FOOD_STORAGE_LOCATIONS.map((location) => (
                  <button
                    key={location}
                    type="button"
                    className="wd-pantry-flow__location-btn"
                    disabled={selectedItem.location === location}
                    onClick={() => handleMove(selectedItem, location)}
                  >
                    <span>{INVENTORY_LOCATION_META[location].label}</span>
                    <small>
                      {selectedItem.location === location ? "Current spot" : "Move here"}
                    </small>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="wd-pantry-flow__confirm">
              {renderItemSummary(selectedItem)}
              <div className="wd-pantry-flow__action-list">
                <button type="button" className="wd-pantry-flow__secondary" onClick={() => setSelectedItem(null)}>
                  Pick another item
                </button>
                <button
                  type="button"
                  className="wd-pantry-flow__primary"
                  onClick={() => {
                    setEditing(selectedItem);
                    resetFlow();
                  }}
                >
                  Open details
                </button>
                <button type="button" className="wd-pantry-flow__secondary" onClick={() => handleMarkUsed(selectedItem)}>
                  Used one
                </button>
                <button type="button" className="wd-pantry-flow__secondary" onClick={() => setSearchMode("move")}>
                  Move spot
                </button>
                <button type="button" className="wd-pantry-flow__secondary" onClick={() => openBuyMore(selectedItem)}>
                  Add to shopping
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <>
      <div className="wd-pantry-flow">
        {screen === "home" ? renderHomeScreen() : null}
        {screen === "inventory" ? renderInventoryScreen() : null}
        {screen === "fridges" ? renderInventoryLocationScreen("fridges") : null}
        {screen === "freezers" ? renderInventoryLocationScreen("freezers") : null}
        {screen === "pantryLocation" ? renderInventoryLocationScreen("pantryLocation") : null}
        {screen === "homeLocation" ? renderInventoryLocationScreen("homeLocation") : null}
        {screen === "foodStorage" ? renderFoodStorageScreen() : null}
        {screen === "detail" ? renderDetailScreen() : null}
        {screen === "settings" ? renderSettingsScreen() : null}
        {completion ? (
          <section className="wd-pantry-flow__toast" role="status">
            <CheckCircle2 className="h-5 w-5" aria-hidden />
            <div>
              <h2>{completion.title}</h2>
              <p>{completion.detail}</p>
            </div>
            <button type="button" onClick={() => setCompletion(null)}>
              Dismiss
            </button>
          </section>
        ) : null}
      </div>

      {renderFlowSheet()}
      {renderBuyMoreSheet()}

      <PantryBoardEditSheet
        item={editing}
        itemNotes={editing ? productById.get(editing.id)?.notes ?? "" : ""}
        onClose={() => setEditing(null)}
        onSave={handleSaveEdit}
      />

      {scanOpen ? (
        <ProductScanPanel
          title="Scan pantry product"
          lookupBusy={lookupBusy}
          lookupMessage={lookupMessage}
          onClose={() => setScanOpen(false)}
          onLookup={handleScanLookup}
          onManualEntry={handleManualScanEntry}
        />
      ) : null}

      {detailView ? (
        <ProductDetailPanel
          product={detailView}
          mode={detailMode}
          locationFallback={detailProduct ? categoryGroupToFoodLocation(detailProduct.categoryGroup) : currentLocationFallback()}
          lookupBusy={lookupBusy}
          lookupMessage={lookupMessage}
          onClose={closeProductDetail}
          onChange={detailMode === "edit" ? updateDetailDraft : undefined}
          onAddToShopping={() => {
            if (detailMode === "edit") {
              addDetailToShopping(detailView);
              if (!duplicateMatch || duplicateChoice !== "pending") {
                setCompletion({
                  title: "Added to shopping",
                  detail: `${detailView.productName} was added to the shared shopping list.`,
                });
              }
              return;
            }
            if (detailProduct) {
              addFromProduct(detailProduct);
              setCompletion({
                title: "Added to shopping",
                detail: `${detailProduct.productName} was added to the shared shopping list.`,
              });
              closeProductDetail();
            }
          }}
          onAddToPantry={() => {
            if (detailMode === "edit") {
              addDetailToPantry(detailView);
              if (!duplicateMatch || duplicateChoice !== "pending") {
                setCompletion({
                  title: "Pantry item added",
                  detail: `${detailView.productName} was saved to the pantry.`,
                });
              }
              return;
            }
            if (detailProduct) {
              addProductToPantry(detailProduct);
              setCompletion({
                title: "Pantry item added",
                detail: `${detailProduct.productName} was saved to the pantry.`,
              });
              closeProductDetail();
            }
          }}
          onUsedUp={
            detailProduct
              ? () => handleProductDetailUsedUp(detailProduct.id)
              : undefined
          }
          onUsedUpToShopping={
            detailProduct
              ? () => handleProductDetailUsedUp(detailProduct.id, true)
              : undefined
          }
          onSaveProduct={detailMode === "edit" ? () => saveDetailProduct(detailView) : undefined}
          onUpdateFromOpenFoodFacts={
            detailMode === "view" && detailProduct
              ? async () => {
                  await enrichProductFromOpenFoodFacts(detailProduct);
                }
              : undefined
          }
          onNavigateToPantry={() => {
            closeProductDetail();
            openInventory(false);
          }}
          onNavigateToShopping={() => {
            closeProductDetail();
            openShoppingPage();
          }}
          onNavigateToSettings={() => {
            closeProductDetail();
            setScreen("settings");
          }}
        />
      ) : null}
    </>
  );
}
