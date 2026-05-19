import { ArrowLeft, Camera, Plus, ShoppingCart } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  type RecipeIdea,
  type ShoppingItem,
  type PantryItem,
} from "../../data/familyData";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Field";
import {
  ModuleActionBar,
  WorkspacePageShell,
  WorkspacePanel,
  EmptyStatePanel,
} from "../../components/workspace/ModuleWorkspace";
import { createActivity } from "../../lib/activity";
import { DS_MAIN_COLUMN } from "../../lib/designSystem";
import { itemMatchesQrLocation, parseInventoryQrSearch } from "../../lib/inventoryDeepLink";
import {
  mapOpenFoodFactsToPantryItemRespectingImages,
  type NormalizedProductLookup,
} from "../../services/openFoodFacts";
import type { PageProps } from "../pageTypes";
import {
  InventoryCategoryView,
  InventoryGridView,
  InventoryQrLabelsView,
  InventoryLocationView,
  InventoryOverviewView,
  InventoryTableView,
  type PantryItemSelectLists,
} from "./InventoryViews";
import { InventoryWorkflowHub } from "./InventoryWorkflowHub";
import {
  FoodStoragePlanPanel,
  FoodStorageSafetyCallout,
  RotationPanel,
  StorageClassFilteredPanel,
} from "./FoodStorageInventoryPanels";
import {
  mergeLists,
  getFridgeFreezerLocationDetailsList,
  getInventoryCategories,
  getInventoryStorageAreas,
  getKitchenLocationDetailsList,
  getPantryShelfOptions,
  getPantryWallOptions,
  getUnitOptions,
} from "../../lib/customization";
import { cn } from "../../lib/utils";
import {
  adjustInventoryQuantity,
  applyConsumeInventoryUpdate,
  createPantryItemFromGroceryItem,
  getInventoryLocationLabel,
  needsConsumeLowOutConfirmation,
  projectConsumeInventoryUpdate,
  type InventoryConsumePayload,
  type InventoryFilterOption,
  isColdStorage,
  isInventoryExpiringSoon,
  isInventoryLowStock,
  isInventoryOverstock,
  isKitchenStorage,
  isUseSoonCandidate,
  getPantryItemDisplayImageSrc,
} from "./inventoryUtils";
import { getRotationStatus } from "../../services/foodStorageGuidance";
import {
  buildShoppingItemFromPantryRestock,
  findActiveShoppingMatch,
} from "../../lib/shoppingInventoryBridge";
import {
  createShoppingItemFromName,
  normalizeShoppingName,
} from "../shopping/shoppingUtils";
import {
  createInventoryStockNotifications,
  memberIdsByFirstNames,
  prependNotifications,
} from "../../lib/householdNotify";
import { siteNotificationEnabled } from "../../lib/notificationPreferences";
import { ConsumeShoppingPrompt } from "../../components/inventory/ConsumeShoppingPrompt";
import { ConsumeLowOutConfirmModal } from "../../components/inventory/ConsumeLowOutConfirmModal";
const BarcodeScannerPanelLazy = lazy(() =>
  import("../../components/scanner/BarcodeScannerPanel").then((m) => ({
    default: m.BarcodeScannerPanel,
  })),
);

const ScanPutAwayWizardLazy = lazy(() =>
  import("../../components/inventory/ScanPutAwayWizard").then((m) => ({
    default: m.ScanPutAwayWizard,
  })),
);

/** SmartHR — matches Shopping / Calendar */
const PAGE_BG = "min-h-full bg-[#f7f7f7] text-[#1f1f1f] [-webkit-font-smoothing:antialiased]";
const CARD_SHELL =
  "rounded-[8px] border border-[#ededed] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.2)]";
const SM_LABEL = "text-[11px] font-semibold uppercase tracking-[0.12em] text-[#637381]";
const SM_INPUT =
  "min-h-10 w-full rounded-[8px] border border-[#ededed] bg-white px-3 py-2 text-[14px] text-[#1f1f1f] shadow-[0_1px_1px_rgba(0,0,0,0.06)] placeholder:text-[#8e8e8e] focus:border-[#FE9F43]/55 focus:outline-none focus:ring-2 focus:ring-[#FE9F43]/25";
const btnPrimaryOrange =
  "bg-gradient-to-r from-[#FF6F28] to-[#FF5325] font-semibold text-white shadow-[0_6px_15px_rgba(242,101,34,0.22)] hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f7f7]";
const btnSecondaryLight =
  "border-[#ededed] bg-white font-semibold text-[#637381] shadow-sm hover:bg-[#f8f9fa] focus-visible:ring-2 focus-visible:ring-[#FE9F43]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f7f7]";
const segmentInactiveLight = "text-[#637381] hover:bg-white hover:text-[#1f1f1f]";
const segmentActiveLight =
  "bg-gradient-to-r from-[#FF6F28] to-[#FF5325] text-white shadow-sm";
const ACTION_BAR_SMARTHR =
  "!rounded-[8px] !border-[#ededed] !shadow-[0_1px_1px_rgba(0,0,0,0.12)] ring-0";
const DETAILS_SMARTHR =
  "rounded-[8px] border border-[#ededed] bg-[#f8f9fa] px-4 py-2 text-[#1f1f1f]";

function PantryHeavyFallback({ label }: { label: string }) {
  return (
    <div className="rounded-[8px] border border-dashed border-[#ededed] bg-white px-4 py-6 text-center text-sm text-[#637381]">
      {label}
    </div>
  );
}

const inventoryPrimaryTabs = [
  { id: "dashboard", label: "Dashboard" },
  { id: "add-item", label: "Add / update stock" },
  { id: "inventory", label: "Inventory" },
  { id: "shopping-needs", label: "Low & restock" },
  { id: "storage-plan", label: "Storage Plan" },
] as const;

type InventoryTab = (typeof inventoryPrimaryTabs)[number]["id"];

function normalizeInventoryTabParam(raw: string | null): InventoryTab | null {
  if (!raw) {
    return null;
  }
  const legacy: Record<string, InventoryTab> = {
    workflow: "dashboard",
    overview: "dashboard",
    scan: "add-item",
    inventory: "inventory",
    "low-stock": "shopping-needs",
    expiring: "shopping-needs",
    rotation: "storage-plan",
    food_plan: "storage-plan",
    long_term: "storage-plan",
    everyday: "storage-plan",
    household_inv: "storage-plan",
    staples: "storage-plan",
    categories: "storage-plan",
    "qr-labels": "storage-plan",
    storage: "storage-plan",
    table: "storage-plan",
    inactive: "storage-plan",
  };
  if (legacy[raw]) {
    return legacy[raw];
  }
  const ids: InventoryTab[] = [
    "dashboard",
    "add-item",
    "inventory",
    "shopping-needs",
    "storage-plan",
  ];
  return ids.includes(raw as InventoryTab) ? (raw as InventoryTab) : null;
}

export function PantryInventoryModulePage({
  data,
  setData,
  onOpenDashboard,
  onOpenShopping,
  inventorySearch = "",
  navigateWithinApp,
}: PageProps) {
  const workspaceTone = "light" as const;
  const [activeTab, setActiveTab] = useState<InventoryTab>("dashboard");
  const [shoppingNeedDismissedIds, setShoppingNeedDismissedIds] = useState<string[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanBarcodeSeed, setScanBarcodeSeed] = useState<string | undefined>(undefined);
  const [selectedLibraryItemId, setSelectedLibraryItemId] = useState("");
  const [storageAreaFilter, setStorageAreaFilter] = useState("all");
  const [locationDetailFilter, setLocationDetailFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [pantryImageEditId, setPantryImageEditId] = useState<string | null>(null);
  const clearPantryImageEditRequest = useCallback(() => setPantryImageEditId(null), []);
  const parsedInventoryQr = useMemo(
    () => parseInventoryQrSearch(inventorySearch),
    [inventorySearch],
  );
  const tabFromQuery = useMemo(() => {
    if (!inventorySearch?.trim()) {
      return null;
    }
    const q = inventorySearch.startsWith("?") ? inventorySearch.slice(1) : inventorySearch;
    try {
      return new URLSearchParams(q).get("tab");
    } catch {
      return null;
    }
  }, [inventorySearch]);
  const deepLinkOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const missingDeepLinkItem =
    parsedInventoryQr.itemId &&
    !data.pantry.some((p) => p.id === parsedInventoryQr.itemId);

  const outItems = useMemo(
    () => data.pantry.filter((p) => !p.inactiveInInventory && p.status === "Out"),
    [data.pantry],
  );
  const useSoonNeedItems = useMemo(
    () =>
      data.pantry.filter(
        (p) =>
          !p.inactiveInInventory &&
          (isInventoryExpiringSoon(p) || isUseSoonCandidate(p)),
      ),
    [data.pantry],
  );
  const recentlyAddedItems = useMemo(() => {
    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
    return data.pantry.filter((p) => {
      if (p.inactiveInInventory) {
        return false;
      }
      const t = Date.parse(p.createdAt);
      return Number.isFinite(t) && t >= cutoff;
    });
  }, [data.pantry]);
  const overstockItems = useMemo(
    () => data.pantry.filter((p) => !p.inactiveInInventory && isInventoryOverstock(p)),
    [data.pantry],
  );
  const rotationAttentionItems = useMemo(
    () =>
      data.pantry.filter(
        (p) => !p.inactiveInInventory && getRotationStatus(p) !== "fresh",
      ),
    [data.pantry],
  );

  function withoutDismissedNeeds(items: PantryItem[]) {
    return items.filter((i) => !shoppingNeedDismissedIds.includes(i.id));
  }

  function dismissShoppingNeed(id: string) {
    setShoppingNeedDismissedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  useEffect(() => {
    const p = parseInventoryQrSearch(inventorySearch);
    if (!inventorySearch || (!p.itemId && !p.location)) {
      return;
    }
    if (p.itemId) {
      setActiveTab("inventory");
      setStorageAreaFilter("all");
      setLocationDetailFilter("all");
      setCategoryFilter("all");
      setSourceFilter("all");
      setStatusFilter("all");
      setSearchText("");
      return;
    }
    if (p.location) {
      setActiveTab("inventory");
      setStorageAreaFilter(p.location.storage);
      setLocationDetailFilter("all");
      setCategoryFilter("all");
      setSourceFilter("all");
      setStatusFilter("all");
      setSearchText("");
    }
  }, [inventorySearch]);

  useEffect(() => {
    const n = normalizeInventoryTabParam(tabFromQuery);
    if (n) {
      setActiveTab(n);
    }
  }, [tabFromQuery]);

  const seedBarcodeFromUrl = useMemo(() => {
    if (!inventorySearch?.trim()) {
      return undefined;
    }
    const q = inventorySearch.startsWith("?") ? inventorySearch.slice(1) : inventorySearch;
    try {
      return new URLSearchParams(q).get("seedBarcode") ?? undefined;
    } catch {
      return undefined;
    }
  }, [inventorySearch]);

  useEffect(() => {
    if (!seedBarcodeFromUrl?.trim()) {
      return;
    }
    setScanBarcodeSeed(seedBarcodeFromUrl.replace(/\s+/g, ""));
    setActiveTab("add-item");
  }, [seedBarcodeFromUrl]);

  useEffect(() => {
    if (!parsedInventoryQr.itemId || activeTab !== "inventory") {
      return;
    }
    const id = parsedInventoryQr.itemId;
    const handle = window.setTimeout(() => {
      document
        .getElementById(`inventory-card-${id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    return () => window.clearTimeout(handle);
  }, [parsedInventoryQr.itemId, activeTab, data.pantry.length]);

  const [statusFilter, setStatusFilter] =
    useState<InventoryFilterOption>("all");
  const [consumePrompt, setConsumePrompt] = useState<{
    item: PantryItem;
    isOut: boolean;
  } | null>(null);
  const [consumeLowOutModal, setConsumeLowOutModal] = useState<{
    item: PantryItem;
    payload: InventoryConsumePayload;
    projected: PantryItem;
  } | null>(null);
  const pantrySelectLists = useMemo((): PantryItemSelectLists => {
    const admin = data.adminSettings;
    return {
      storageAreas: mergeLists(
        getInventoryStorageAreas(admin),
        data.pantry.map((item) => item.storageArea),
      ),
      categories: mergeLists(
        getInventoryCategories(admin),
        data.pantry.map((item) => item.category),
      ),
      units: mergeLists(
        getUnitOptions(admin),
        data.pantry.map((item) => item.unit),
      ),
      kitchenLocationDetails: mergeLists(
        getKitchenLocationDetailsList(admin),
        data.pantry.flatMap((item) => [
          item.kitchenLocationDetail,
          isKitchenStorage(item.storageArea) ? item.locationDetail : undefined,
        ]),
      ),
      pantryWalls: mergeLists(
        getPantryWallOptions(admin),
        data.pantry.flatMap((item) => [item.pantryWall, item.wall]),
      ),
      pantryShelves: mergeLists(
        getPantryShelfOptions(admin),
        data.pantry.flatMap((item) => [item.pantryShelf, item.shelf]),
      ),
      coldLocationDetails: mergeLists(
        getFridgeFreezerLocationDetailsList(admin),
        data.pantry.flatMap((item) => [
          item.coldLocationDetail,
          isColdStorage(item.storageArea) ? item.locationDetail : undefined,
        ]),
      ),
    };
  }, [data.adminSettings, data.pantry]);
  const categories = pantrySelectLists.categories;
  const lowStockItems = data.pantry.filter(
    (p) => !p.inactiveInInventory && isInventoryLowStock(p),
  );
  const staples = data.pantry.filter((item) => !item.inactiveInInventory && item.isStaple);
  const archivedItems = useMemo(
    () => data.pantry.filter((item) => item.inactiveInInventory),
    [data.pantry],
  );
  const locationDetails = Array.from(
    new Set(data.pantry.map(getInventoryLocationLabel).filter(Boolean)),
  ).sort();
  const sourceOptions = Array.from(
    new Set(
      data.pantry
        .map((item) => item.sourceSystem || item.source)
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort();
  const filteredItems = data.pantry.filter((item) => {
    if (parsedInventoryQr.itemId) {
      return item.id === parsedInventoryQr.itemId;
    }
    if (
      parsedInventoryQr.location &&
      !itemMatchesQrLocation(item, parsedInventoryQr.location)
    ) {
      return false;
    }

    if (storageAreaFilter !== "all" && item.storageArea !== storageAreaFilter) {
      return false;
    }

    if (
      locationDetailFilter !== "all" &&
      getInventoryLocationLabel(item) !== locationDetailFilter
    ) {
      return false;
    }

    if (categoryFilter !== "all" && item.category !== categoryFilter) {
      return false;
    }

    if (
      sourceFilter !== "all" &&
      item.sourceSystem !== sourceFilter &&
      item.source !== sourceFilter
    ) {
      return false;
    }

    if (statusFilter === "low-stock" && !isInventoryLowStock(item)) {
      return false;
    }

    if (statusFilter === "expiring" && !isInventoryExpiringSoon(item)) {
      return false;
    }

    if (statusFilter === "staples" && !item.isStaple) {
      return false;
    }

    const normalizedSearch = searchText.trim().toLowerCase();

    if (item.inactiveInInventory) {
      return false;
    }

    if (
      normalizedSearch &&
      ![
        item.name,
        item.category,
        item.storageArea,
        getInventoryLocationLabel(item),
        item.brand ?? "",
        item.barcode ?? "",
        item.source ?? "",
        item.sourceSystem ?? "",
        item.notes ?? "",
        item.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    ) {
      return false;
    }

    return true;
  });
  function addItem() {
    const now = new Date().toISOString();
    const item: PantryItem = {
      id: crypto.randomUUID(),
      name: "New inventory item",
      quantity: "1",
      unit: "",
      category: "Grocery",
      storageArea: "Pantry",
      location: "Pantry",
      barcode: "",
      brand: "",
      productImageUrl: "",
      locationDetail: "",
      customLocationName: "",
      kitchenLocationDetail: "",
      pantryLocationNote: "",
      coldLocationDetail: "",
      pantryWall: "Wall 1",
      pantryShelf: "Shelf 1",
      wall: "Wall 1",
      shelf: "Shelf 1",
      status: "Stocked",
      groceryItemId: "",
      expiryDate: "",
      bestByDate: "",
      notes: "",
      isStaple: false,
      minQuantity: "",
      tags: [],
      source: "manual",
      lastUpdated: now,
      createdAt: now,
    };
    setData((current) =>
      createActivity(
        {
          ...current,
          pantry: [...current.pantry, item],
        },
        {
          type: "created",
          entityType: "pantryItem",
          entityId: item.id,
          entityTitle: item.name,
          message: `Created inventory item ${item.name}.`,
        },
      ),
    );
    setActiveTab("inventory");
  }

  function addLibraryItem() {
    const groceryItem = data.groceryItems.find(
      (item) => item.id === selectedLibraryItemId,
    );

    if (!groceryItem) {
      return;
    }

    const item = createPantryItemFromGroceryItem(groceryItem);
    setData((current) =>
      createActivity(
        {
          ...current,
          pantry: [...current.pantry, item],
        },
        {
          type: "created",
          entityType: "pantryItem",
          entityId: item.id,
          entityTitle: item.name,
          message: `Created inventory item ${item.name} from grocery library.`,
        },
      ),
    );
    setSelectedLibraryItemId("");
    setActiveTab("inventory");
  }

  function updateItem(id: string, updates: Partial<PantryItem>) {
    const now = new Date().toISOString();
    setData((current) => ({
      ...current,
      pantry: current.pantry.map((pantryItem) =>
        pantryItem.id === id
          ? {
              ...pantryItem,
              ...updates,
              lastUpdated: now,
            }
          : pantryItem,
      ),
    }));
  }

  function adjustItemQuantity(item: PantryItem, delta: number) {
    const adjustedItem = adjustInventoryQuantity(item, delta);

    if (!adjustedItem) {
      return;
    }

    setData((current) =>
      createActivity(
        {
          ...current,
          pantry: current.pantry.map((pantryItem) =>
            pantryItem.id === item.id ? adjustedItem : pantryItem,
          ),
        },
        {
          type: "updated",
          entityType: "pantryItem",
          entityId: item.id,
          entityTitle: item.name,
          message: `Updated ${item.name} quantity to ${adjustedItem.quantity}${item.unit ? ` ${item.unit}` : ""}.`,
        },
      ),
    );
  }

  function commitConsumeUpdate(
    item: PantryItem,
    payload: InventoryConsumePayload,
    options?: { addToShopping?: boolean; notifyRecipients?: boolean },
  ) {
    const next = applyConsumeInventoryUpdate(item, payload);
    if (!next) {
      return;
    }

    setData((current) => {
      let shopping = current.shopping;
      let notifications = current.notifications;
      let activityMsg = "Inventory updated.";
      const dup =
        options?.addToShopping === true
          ? findActiveShoppingMatch(shopping, next)
          : undefined;

      if (options?.addToShopping && !dup) {
        const row = buildShoppingItemFromPantryRestock(next);
        shopping = [...shopping, row];
        activityMsg = "Updated inventory and added low item to shopping list.";
        if (options.notifyRecipients) {
          const site = current.adminSettings.siteNotificationDefaults;
          if (
            siteNotificationEnabled(site, "enableReminders") &&
            siteNotificationEnabled(site, "inventoryLowStock")
          ) {
            const recipientIds = memberIdsByFirstNames(current.familyMembers, [
              "Lorraine",
              "Stella",
            ]);
            const incoming = createInventoryStockNotifications({
              recipientMemberIds: recipientIds,
              itemName: next.name,
              kind: next.status === "Out" ? "out" : "low",
              shoppingAdded: true,
              pantryItemId: next.id,
            });
            notifications = prependNotifications(current.notifications, incoming);
          }
        }
      }

      return createActivity(
        {
          ...current,
          pantry: current.pantry.map((pantryItem) =>
            pantryItem.id === item.id ? next : pantryItem,
          ),
          shopping,
          notifications,
        },
        {
          type: "updated",
          entityType: "pantryItem",
          entityId: item.id,
          entityTitle: item.name,
          message: activityMsg,
        },
      );
    });

    if (!options?.addToShopping && (next.status === "Low" || next.status === "Out")) {
      setConsumePrompt({ item: next, isOut: next.status === "Out" });
    }
  }

  function consumeInventoryAmount(item: PantryItem, payload: InventoryConsumePayload) {
    const projected = projectConsumeInventoryUpdate(item, payload);
    if (!projected) {
      return;
    }
    if (needsConsumeLowOutConfirmation(item, projected)) {
      setConsumeLowOutModal({ item, payload, projected });
      return;
    }
    commitConsumeUpdate(item, payload);
  }

  function addMissingIngredientsToShopping(names: string[]) {
    const trimmed = names.map((n) => n.trim()).filter(Boolean);
    if (!trimmed.length) {
      return;
    }
    setData((current) => {
      let shopping = current.shopping;
      const added: ShoppingItem[] = [];
      for (const name of trimmed) {
        const dup = shopping.some(
          (s) =>
            !s.purchased &&
            normalizeShoppingName(s.name) === normalizeShoppingName(name),
        );
        if (dup) {
          continue;
        }
        const row = createShoppingItemFromName(name);
        shopping = [...shopping, row];
        added.push(row);
      }
      if (!added.length) {
        return current;
      }
      const first = added[0];
      return createActivity(
        { ...current, shopping },
        {
          type: "created",
          entityType: "shoppingItem",
          entityId: first.id,
          entityTitle: first.name,
          message:
            added.length === 1
              ? `Added ${first.name} to shopping list.`
              : `Added ${added.length} items to shopping list.`,
        },
      );
    });
  }

  function addRecipeIdeaFromInventory(idea: RecipeIdea) {
    setData((current) =>
      createActivity(
        {
          ...current,
          recipeIdeas: [...current.recipeIdeas, idea],
        },
        {
          type: "created",
          entityType: "data",
          entityId: idea.id,
          entityTitle: idea.title,
          message: `Added recipe idea: ${idea.title}.`,
        },
      ),
    );
  }

  function handleAddToShoppingFromConsumePrompt() {
    if (!consumePrompt) {
      return;
    }
    const dup = findActiveShoppingMatch(data.shopping, consumePrompt.item);
    if (dup) {
      window.alert("This item is already on the shopping list.");
      setConsumePrompt(null);
      return;
    }
    const row = buildShoppingItemFromPantryRestock(consumePrompt.item);
    setData((current) =>
      createActivity(
        {
          ...current,
          shopping: [...current.shopping, row],
        },
        {
          type: "created",
          entityType: "shoppingItem",
          entityId: row.id,
          entityTitle: row.name,
          message: "Added low item to shopping list.",
        },
      ),
    );
    setConsumePrompt(null);
    window.alert("Added to shopping list.");
  }

  function applyProductLookupToInventory(
    item: PantryItem,
    product: NormalizedProductLookup,
  ) {
    const updates = mapOpenFoodFactsToPantryItemRespectingImages(item, product);

    setData((current) =>
      createActivity(
        {
          ...current,
          pantry: current.pantry.map((pantryItem) =>
            pantryItem.id === item.id
              ? {
                  ...pantryItem,
                  ...updates,
                  lastUpdated: new Date().toISOString(),
                }
              : pantryItem,
          ),
        },
        {
          type: "updated",
          entityType: "pantryItem",
          entityId: item.id,
          entityTitle: updates.name || item.name,
          message: `Added product details from OpenFoodFacts for ${updates.name || item.name}.`,
        },
      ),
    );
  }

  function openFilteredInventory(updates: {
    storageArea?: string;
    locationDetail?: string;
    category?: string;
    source?: string;
    status?: InventoryFilterOption;
    searchText?: string;
  }) {
    setStorageAreaFilter(updates.storageArea ?? "all");
    setLocationDetailFilter(updates.locationDetail ?? "all");
    setCategoryFilter(updates.category ?? "all");
    setSourceFilter(updates.source ?? "all");
    setStatusFilter(updates.status ?? "all");
    setSearchText(updates.searchText ?? "");
    setActiveTab("inventory");
  }

  function addInventoryItemToShopping(item: PantryItem) {
    const now = new Date().toISOString();
    const shoppingItem: ShoppingItem = {
      id: crypto.randomUUID(),
      name: item.name,
      quantity: item.quantity || item.minQuantity || "1",
      unit: item.unit,
      category: item.category,
      storeSection: "aisles",
      preferredStore: "",
      neededBy: new Date().toISOString().slice(0, 10),
      purchased: false,
      needsPutAway: false,
      destination: item.storageArea,
      barcode: item.barcode,
      brand: item.brand,
      productImageUrl: getPantryItemDisplayImageSrc(item) || item.productImageUrl,
      source: item.source,
      sourceSystem: item.sourceSystem,
      lookupMetadata: item.lookupMetadata,
      destinationDetail: item.locationDetail,
      customDestinationName: item.customLocationName,
      pantryNote: item.pantryLocationNote,
      wall: item.pantryWall,
      shelf: item.pantryShelf,
      groceryItemId: item.groceryItemId,
      notes: "",
      createdAt: now,
      updatedAt: now,
    };

    setData((current) =>
      createActivity(
        {
          ...current,
          shopping: [...current.shopping, shoppingItem],
        },
        {
          type: "created",
          entityType: "shoppingItem",
          entityId: shoppingItem.id,
          entityTitle: shoppingItem.name,
          message: `Added ${shoppingItem.name} to shopping from inventory.`,
        },
      ),
    );
  }

  return (
    <div className={PAGE_BG}>
      <WorkspacePageShell
        className={cn(
          "flex flex-col gap-4 px-[15px] pb-10 pt-0 sm:gap-5 sm:px-[30px] md:pb-10",
          DS_MAIN_COLUMN,
        )}
        tone={workspaceTone}
      >
        <header className={cn(CARD_SHELL, "p-5 sm:p-6")}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 gap-3">
              <div
                className="h-14 w-1 shrink-0 rounded-full bg-gradient-to-b from-[#FF6F28] to-[#FF5325]"
                aria-hidden
              />
              <div className="min-w-0">
                <p className={SM_LABEL}>Kitchen</p>
                <h1 className="mt-1 text-[22px] font-medium leading-snug tracking-tight text-[#1f1f1f]">
                  Pantry &amp; Inventory
                </h1>
                <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-[#575757]">
                  Track what is on hand, low, or needs attention.
                </p>
              </div>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4 sm:max-w-2xl lg:w-auto">
              {(
                [
                  ["On hand", data.pantry.filter((p) => !p.inactiveInInventory).length],
                  ["Low stock", lowStockItems.length],
                  ["Use soon", useSoonNeedItems.length],
                  ["Out", outItems.length],
                ] as const
              ).map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-[8px] border border-[#ededed] bg-[#f8f9fa] px-3 py-3 text-center shadow-[inset_0_1px_0_rgba(0,0,0,0.04)]"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#637381]">{label}</p>
                  <p className="text-xl font-semibold tabular-nums text-[#F26522]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </header>

        <ModuleActionBar className={ACTION_BAR_SMARTHR} tone={workspaceTone}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Button className={btnPrimaryOrange} onClick={addItem} variant="primary">
                <Plus className="h-4 w-4" />
                Add Stock
              </Button>
              <Button
                onClick={() => {
                  setActiveTab("add-item");
                  setScannerOpen(true);
                }}
                variant="secondary"
                className={cn(btnSecondaryLight, "min-h-12 text-base")}
              >
                <Camera className="h-5 w-5" />
                Scan item
              </Button>
              <Button
                type="button"
                variant="secondary"
                className={cn(btnSecondaryLight, "min-h-12 text-base")}
                onClick={() => setActiveTab("inventory")}
              >
                Use item
              </Button>
            </div>
            <details className="rounded-[8px] border border-[#ededed] bg-[#f8f9fa] px-3 py-1">
              <summary className="cursor-pointer select-none py-3 text-sm font-semibold text-[#1f1f1f]">
                More — navigation and library
              </summary>
              <div className="space-y-4 border-t border-[#ededed] pb-3 pt-3">
                <div className="flex flex-wrap gap-2">
                  <Button className="text-[#637381] hover:bg-white" onClick={onOpenDashboard} variant="ghost">
                    <ArrowLeft className="h-4 w-4" />
                    Home
                  </Button>
                  <Button className={btnSecondaryLight} onClick={onOpenShopping} variant="secondary">
                    <ShoppingCart className="h-4 w-4" />
                    Shopping list
                  </Button>
                </div>
                <div className="grid gap-2 md:grid-cols-[minmax(220px,360px)_auto]">
                  <label className="space-y-1.5">
                    <span className={SM_LABEL}>Saved grocery items</span>
                    <Select className={SM_INPUT} value={selectedLibraryItemId} onChange={(event) => setSelectedLibraryItemId(event.target.value)}>
                      <option value="">Choose a frequent item</option>
                      {data.groceryItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} · {item.defaultLocation}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <div className="flex items-end">
                    <Button
                      className={cn("w-full", btnSecondaryLight)}
                      disabled={!selectedLibraryItemId}
                      onClick={addLibraryItem}
                      variant="secondary"
                    >
                      Add from library
                    </Button>
                  </div>
                </div>
              </div>
            </details>
          </div>
        </ModuleActionBar>

        <nav
          className="flex gap-0.5 overflow-x-auto rounded-[8px] border border-[#ededed] bg-[#f8f9fa] p-1 shadow-[inset_0_1px_0_rgba(0,0,0,0.04)]"
          aria-label="Pantry sections"
        >
          {inventoryPrimaryTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={cn(
                "motion-tab min-h-10 whitespace-nowrap rounded-[6px] border border-transparent px-3.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f7f7]",
                activeTab === tab.id ? segmentActiveLight : segmentInactiveLight,
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <p className="text-xs leading-relaxed text-[#637381]">
          QR labels open the matching item or shelf on this device.
        </p>

      {inventorySearch ? (
        <div
          className={cn(
            "flex flex-col gap-3 rounded-[8px] border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
            missingDeepLinkItem
              ? "border-amber-200 bg-amber-50/90 text-amber-950"
              : "border-[#ededed] bg-[#f8f9fa] text-[#1f1f1f]",
          )}
        >
          <p className="text-sm leading-relaxed">
            {missingDeepLinkItem
              ? "This link does not match an item or filter in your household file. Clear the link or check the label."
              : "Opened from a QR label. Filters follow the scanned location or item."}
          </p>
          {navigateWithinApp ? (
            <Button onClick={() => navigateWithinApp("/pantry")} variant="secondary">
              Clear link
            </Button>
          ) : null}
        </div>
      ) : null}

      {activeTab === "dashboard" ? (
        <InventoryOverviewView
          lowStockItems={lowStockItems}
          onAddItem={addItem}
          onOpenInventory={() => openFilteredInventory({})}
          onOpenShoppingNeeds={() => setActiveTab("shopping-needs")}
          onScanItem={() => {
            setActiveTab("add-item");
            setScannerOpen(true);
          }}
          onUseInventory={() => setActiveTab("inventory")}
          outItems={outItems}
          recentlyAddedItems={recentlyAddedItems}
          tone={workspaceTone}
          useSoonItems={useSoonNeedItems}
        />
      ) : null}

      {activeTab === "add-item" ? (
        <div className="flex flex-col gap-6">
          <WorkspacePanel className={CARD_SHELL} eyebrow="Three steps" title="Add item" tone={workspaceTone}>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-[#575757]">
              <li>Scan a barcode with the camera.</li>
              <li>Pick a saved grocery item from the bar above, or search in the form.</li>
              <li>Add manually in the form — fields stay optional until you need them.</li>
            </ol>
          </WorkspacePanel>
          <FoodStorageSafetyCallout />
          <div className="flex flex-wrap gap-2">
            <Button
              className={cn(
                btnPrimaryOrange,
                "flex min-h-[48px] min-w-[200px] flex-1 items-center justify-center gap-2 sm:flex-none",
              )}
              type="button"
              variant="primary"
              onClick={() => setScannerOpen(true)}
            >
              <Camera className="h-5 w-5" />
              Open camera scanner
            </Button>
            <Button
              type="button"
              variant="secondary"
              className={btnSecondaryLight}
              onClick={() => navigateWithinApp?.("/pantry?tab=storage-plan")}
            >
              Storage plan tools
            </Button>
          </div>
          {scannerOpen ? (
            <Suspense fallback={<PantryHeavyFallback label="Opening camera scanner…" />}>
              <BarcodeScannerPanelLazy
                open={scannerOpen}
                onClose={() => setScannerOpen(false)}
                onDetected={(code) => {
                  setScanBarcodeSeed(code);
                  setScannerOpen(false);
                }}
              />
            </Suspense>
          ) : null}
          <Suspense fallback={<PantryHeavyFallback label="Loading add-item flow…" />}>
            <ScanPutAwayWizardLazy
              key={scanBarcodeSeed ?? "blank"}
              data={data}
              initialBarcode={scanBarcodeSeed}
              navigateWithinApp={navigateWithinApp}
              onOpenShopping={onOpenShopping ?? (() => {})}
              pantrySelectLists={pantrySelectLists}
              setData={setData}
            />
          </Suspense>
        </div>
      ) : null}

      {activeTab === "shopping-needs" ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-[#ededed] bg-white px-4 py-3 shadow-[0_1px_1px_rgba(0,0,0,0.06)]">
            <p className="text-sm text-[#575757]">
              Dismiss hides a line until you reload the page or reset the list.
            </p>
            <Button type="button" variant="ghost" onClick={() => setShoppingNeedDismissedIds([])}>
              Reset dismissed
            </Button>
          </div>
          {(
            [
              { id: "out", title: "Out", eyebrow: "Empty on the shelf", items: outItems },
              {
                id: "low",
                title: "Low stock",
                eyebrow: "Below comfortable levels",
                items: lowStockItems,
              },
              {
                id: "soon",
                title: "Use soon",
                eyebrow: "Dates and use-up flags",
                items: useSoonNeedItems,
              },
              {
                id: "over",
                title: "Use up extra",
                eyebrow: "More than you like to store",
                items: overstockItems,
              },
              {
                id: "rot",
                title: "Past date / rotate",
                eyebrow: "Best-by and shelf-life cues",
                items: rotationAttentionItems,
              },
            ] as const
          ).map((sec) => {
            const rows = withoutDismissedNeeds(sec.items);
            return (
              <WorkspacePanel
                className={CARD_SHELL}
                eyebrow={sec.eyebrow}
                key={sec.id}
                title={sec.title}
                tone={workspaceTone}
              >
                {rows.length === 0 ? (
                  <EmptyStatePanel text="Nothing in this group right now." tone={workspaceTone} />
                ) : (
                  <div className="space-y-2">
                    {rows.map((item) => (
                      <div
                        className="flex flex-col gap-3 rounded-[8px] border border-[#ededed] bg-white p-3 shadow-[0_1px_1px_rgba(0,0,0,0.06)] sm:flex-row sm:items-center sm:justify-between"
                        key={item.id}
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-[#1f1f1f]">{item.name}</p>
                          <p className="text-sm text-[#575757]">
                            {item.quantity}
                            {item.unit ? ` ${item.unit}` : ""} · {item.storageArea}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => addInventoryItemToShopping(item)}
                          >
                            Add to shopping
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setActiveTab("inventory");
                              navigateWithinApp?.(`/pantry?tab=inventory&item=${item.id}`);
                            }}
                          >
                            Details
                          </Button>
                          <Button type="button" variant="ghost" onClick={() => dismissShoppingNeed(item.id)}>
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </WorkspacePanel>
            );
          })}
        </div>
      ) : null}

      {activeTab === "storage-plan" ? (
        <div className="space-y-4">
          <InventoryWorkflowHub
            onSelectTab={(tab) => {
              const next: Record<
                | "inventory"
                | "low-stock"
                | "expiring"
                | "food_plan"
                | "rotation"
                | "scan"
                | "inactive",
                InventoryTab
              > = {
                inventory: "inventory",
                "low-stock": "shopping-needs",
                expiring: "shopping-needs",
                food_plan: "storage-plan",
                rotation: "storage-plan",
                scan: "add-item",
                inactive: "storage-plan",
              };
              setActiveTab(next[tab]);
            }}
          />
          <details className={DETAILS_SMARTHR}>
            <summary className="cursor-pointer py-2 text-sm font-semibold text-[#1f1f1f]">Rotation & FIFO</summary>
            <div className="pb-4 pt-2">
              <RotationPanel
                addToShopping={addInventoryItemToShopping}
                adjustQuantity={adjustItemQuantity}
                items={data.pantry}
                openFilteredInventory={openFilteredInventory}
                updateItem={updateItem}
              />
            </div>
          </details>
          <details className={DETAILS_SMARTHR}>
            <summary className="cursor-pointer py-2 text-sm font-semibold text-[#1f1f1f]">Food storage targets</summary>
            <div className="pb-4 pt-2">
              <FoodStoragePlanPanel data={data} setData={setData} />
            </div>
          </details>
          <details className={DETAILS_SMARTHR}>
            <summary className="cursor-pointer py-2 text-sm font-semibold text-[#1f1f1f]">Long-term & everyday storage</summary>
            <div className="space-y-4 pb-4 pt-2">
              <FoodStorageSafetyCallout />
              <StorageClassFilteredPanel
                description="Items tagged for longer rotation cycles and staples."
                items={data.pantry}
                storageClass="long_term_storage"
                title="Long-term shelf items"
              />
              <StorageClassFilteredPanel
                description="Day-to-day foods in fridge, freezer, and quick-use pantry."
                items={data.pantry}
                storageClass="everyday"
                title="Everyday pantry & cold storage"
              />
            </div>
          </details>
          <details className={DETAILS_SMARTHR}>
            <summary className="cursor-pointer py-2 text-sm font-semibold text-[#1f1f1f]">Household & staples</summary>
            <div className="space-y-4 pb-4 pt-2">
              <StorageClassFilteredPanel
                alternateFilter={(item) =>
                  item.itemType === "household" ||
                  item.storageClass === "household_supply" ||
                  item.foodStorageCategory === "household_supply"
                }
                description="Non-food essentials and household-class inventory."
                items={data.pantry}
                title="Household supplies"
              />
              <InventoryGridView
                addInventoryItemToShopping={addInventoryItemToShopping}
                applyProductLookupToInventory={applyProductLookupToInventory}
                adjustItemQuantity={adjustItemQuantity}
                allPantryItems={data.pantry}
                categories={categories}
                categoryFilter="all"
                deepLinkOrigin={deepLinkOrigin}
                filteredItems={staples}
                highlightItemId={parsedInventoryQr.itemId}
                inventoryPanelEyebrow="Staple checklist"
                inventoryPanelTitle="Staples"
                locationDetailFilter="all"
                locationDetails={locationDetails}
                onAddMissingIngredientsToShopping={addMissingIngredientsToShopping}
                onAddRecipeIdea={addRecipeIdeaFromInventory}
                onClearPantryImageEditRequest={clearPantryImageEditRequest}
                onConsumeInventory={consumeInventoryAmount}
                onRequestPantryImageEdit={setPantryImageEditId}
                pantryImageEditRequestId={pantryImageEditId}
                pantryNamesForRecipes={data.pantry.map((p) => p.name)}
                searchText=""
                setCategoryFilter={setCategoryFilter}
                setLocationDetailFilter={setLocationDetailFilter}
                setSearchText={setSearchText}
                setSourceFilter={setSourceFilter}
                setStatusFilter={setStatusFilter}
                setStorageAreaFilter={setStorageAreaFilter}
                sourceFilter="all"
                sourceOptions={sourceOptions}
                statusFilter="staples"
                storageAreaFilter="all"
                selectLists={pantrySelectLists}
                tone={workspaceTone}
                updateItem={updateItem}
                familyMembers={data.familyMembers}
              />
            </div>
          </details>
          <details className={DETAILS_SMARTHR}>
            <summary className="cursor-pointer py-2 text-sm font-semibold text-[#1f1f1f]">Categories & locations</summary>
            <div className="space-y-4 pb-4 pt-2">
              <InventoryCategoryView
                categories={categories}
                items={data.pantry}
                openFilteredInventory={openFilteredInventory}
              />
              <InventoryLocationView
                deepLinkOrigin={deepLinkOrigin}
                items={data.pantry}
                openFilteredInventory={openFilteredInventory}
                selectLists={pantrySelectLists}
              />
            </div>
          </details>
          <details className={DETAILS_SMARTHR}>
            <summary className="cursor-pointer py-2 text-sm font-semibold text-[#1f1f1f]">QR labels</summary>
            <div className="pb-4 pt-2">
              <InventoryQrLabelsView
                deepLinkOrigin={deepLinkOrigin}
                inventoryItems={data.pantry}
                selectLists={pantrySelectLists}
              />
            </div>
          </details>
          <details className={DETAILS_SMARTHR}>
            <summary className="cursor-pointer py-2 text-sm font-semibold text-[#1f1f1f]">Shelf table</summary>
            <div className="pb-4 pt-2">
              <InventoryTableView
                adjustItemQuantity={adjustItemQuantity}
                items={filteredItems}
                onRequestImageEdit={(id) => {
                  setPantryImageEditId(id);
                  setActiveTab("inventory");
                }}
                selectLists={pantrySelectLists}
                updateItem={updateItem}
              />
            </div>
          </details>
          <details className={DETAILS_SMARTHR}>
            <summary className="cursor-pointer py-2 text-sm font-semibold text-[#1f1f1f]">Archived items</summary>
            <div className="pb-4 pt-2">
              <InventoryGridView
                addInventoryItemToShopping={addInventoryItemToShopping}
                applyProductLookupToInventory={applyProductLookupToInventory}
                adjustItemQuantity={adjustItemQuantity}
                allPantryItems={data.pantry}
                archivedPresentation
                categories={categories}
                categoryFilter="all"
                deepLinkOrigin={deepLinkOrigin}
                filteredItems={archivedItems}
                highlightItemId={parsedInventoryQr.itemId}
                inventoryPanelEyebrow="Items removed from active views"
                inventoryPanelTitle="Archived"
                locationDetailFilter="all"
                locationDetails={locationDetails}
                onAddMissingIngredientsToShopping={addMissingIngredientsToShopping}
                onAddRecipeIdea={addRecipeIdeaFromInventory}
                onClearPantryImageEditRequest={clearPantryImageEditRequest}
                onConsumeInventory={consumeInventoryAmount}
                onRequestPantryImageEdit={setPantryImageEditId}
                pantryImageEditRequestId={pantryImageEditId}
                pantryNamesForRecipes={data.pantry.map((p) => p.name)}
                searchText=""
                setCategoryFilter={setCategoryFilter}
                setLocationDetailFilter={setLocationDetailFilter}
                setSearchText={setSearchText}
                setSourceFilter={setSourceFilter}
                setStatusFilter={setStatusFilter}
                setStorageAreaFilter={setStorageAreaFilter}
                sourceFilter="all"
                sourceOptions={sourceOptions}
                statusFilter="all"
                storageAreaFilter="all"
                selectLists={pantrySelectLists}
                tone={workspaceTone}
                updateItem={updateItem}
                familyMembers={data.familyMembers}
              />
            </div>
          </details>
        </div>
      ) : null}

      {activeTab === "inventory" ? (
        <InventoryGridView
          addInventoryItemToShopping={addInventoryItemToShopping}
          applyProductLookupToInventory={applyProductLookupToInventory}
          adjustItemQuantity={adjustItemQuantity}
          allPantryItems={data.pantry}
          categories={categories}
          categoryFilter={categoryFilter}
          deepLinkOrigin={deepLinkOrigin}
          filteredItems={filteredItems}
          highlightItemId={parsedInventoryQr.itemId}
          inventoryPanelEyebrow="What you have now"
          inventoryPanelTitle="Inventory"
          locationDetailFilter={locationDetailFilter}
          locationDetails={locationDetails}
          onAddItem={addItem}
          onAddMissingIngredientsToShopping={addMissingIngredientsToShopping}
          onAddRecipeIdea={addRecipeIdeaFromInventory}
          onClearPantryImageEditRequest={clearPantryImageEditRequest}
          onConsumeInventory={consumeInventoryAmount}
          onRequestPantryImageEdit={setPantryImageEditId}
          pantryImageEditRequestId={pantryImageEditId}
          pantryNamesForRecipes={data.pantry.map((p) => p.name)}
          searchText={searchText}
          setCategoryFilter={setCategoryFilter}
          setLocationDetailFilter={setLocationDetailFilter}
          setSearchText={setSearchText}
          setSourceFilter={setSourceFilter}
          setStatusFilter={setStatusFilter}
          setStorageAreaFilter={setStorageAreaFilter}
          sourceFilter={sourceFilter}
          sourceOptions={sourceOptions}
          statusFilter={statusFilter}
          storageAreaFilter={storageAreaFilter}
          selectLists={pantrySelectLists}
          tone={workspaceTone}
          updateItem={updateItem}
          familyMembers={data.familyMembers}
        />
      ) : null}

      <ConsumeLowOutConfirmModal
        open={consumeLowOutModal !== null}
        itemName={consumeLowOutModal?.item.name ?? ""}
        currentQuantityLabel={consumeLowOutModal?.item.quantity ?? ""}
        amountUsedLabel={
          consumeLowOutModal?.payload.markFinished
            ? "All (finished)"
            : String(consumeLowOutModal?.payload.amountUsed ?? "")
        }
        estimatedRemainingLabel={consumeLowOutModal?.projected.quantity ?? ""}
        minQuantityLabel={consumeLowOutModal?.item.minQuantity ?? ""}
        unitLabel={consumeLowOutModal?.item.unit?.trim() ?? ""}
        alreadyOnShopping={
          consumeLowOutModal
            ? Boolean(findActiveShoppingMatch(data.shopping, consumeLowOutModal.item))
            : false
        }
        alreadyLow={
          consumeLowOutModal
            ? consumeLowOutModal.item.status === "Low" ||
              consumeLowOutModal.item.status === "Out"
            : false
        }
        onContinueWithShopping={() => {
          if (!consumeLowOutModal) {
            return;
          }
          commitConsumeUpdate(consumeLowOutModal.item, consumeLowOutModal.payload, {
            addToShopping: true,
            notifyRecipients: true,
          });
          setConsumeLowOutModal(null);
        }}
        onContinueWithout={() => {
          if (!consumeLowOutModal) {
            return;
          }
          commitConsumeUpdate(consumeLowOutModal.item, consumeLowOutModal.payload);
          setConsumeLowOutModal(null);
        }}
        onCancel={() => setConsumeLowOutModal(null)}
      />

      <ConsumeShoppingPrompt
        open={consumePrompt !== null}
        onYesAdd={handleAddToShoppingFromConsumePrompt}
        onNo={() => setConsumePrompt(null)}
      />
      </WorkspacePageShell>
    </div>
  );
}
