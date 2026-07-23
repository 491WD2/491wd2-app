import { Camera, Plus, ShoppingCart } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  type RecipeIdea,
  type ShoppingItem,
  type PantryItem,
} from "../../data/familyData";
import type { DemoPantryZone } from "../../data/demoPantryInventory";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Field";
import {
  WorkspacePageShell,
  WorkspacePanel,
  EmptyStatePanel,
} from "../../components/workspace/ModuleWorkspace";
import { PantryAdminUxChrome, type PantryInventorySort } from "../../components/inventory/PantryAdminUxChrome";
import { PantryAdminUxInventoryList } from "../../components/inventory/PantryAdminUxInventoryList";
import { createActivity } from "../../lib/activity";
import { DS_MAIN_COLUMN } from "../../lib/designSystem";
import { itemMatchesQrLocation, parseInventoryQrSearch } from "../../lib/inventoryDeepLink";
import {
  itemMatchesStorageZone,
  summarizePantryByZone,
  PANTRY_STORAGE_ZONES,
} from "../../lib/pantryStorageZones";
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

const PAGE_BG = "aux-pantry__canvas min-h-full text-[#0f172a] [-webkit-font-smoothing:antialiased]";
const CARD_SHELL =
  "rounded-[1.15rem] border border-[rgba(15,23,42,0.08)] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.07)]";
const SM_LABEL = "text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748b]";
const SM_INPUT =
  "min-h-10 w-full rounded-[0.75rem] border border-[rgba(15,23,42,0.08)] bg-white px-3 py-2 text-[14px] text-[#0f172a] shadow-[0_1px_2px_rgba(15,23,42,0.04)] placeholder:text-[#94a3b8] focus:border-[#3b82f6]/55 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/25";
const btnPrimaryOrange =
  "bg-gradient-to-r from-[#3b82f6] to-[#2563eb] font-semibold text-white shadow-[0_6px_15px_rgba(37,99,235,0.22)] hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#eff6ff]";
const btnSecondaryLight =
  "border-[rgba(15,23,42,0.08)] bg-white font-semibold text-[#64748b] shadow-sm hover:bg-[#f8fafc] focus-visible:ring-2 focus-visible:ring-[#3b82f6]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#eff6ff]";
const DETAILS_SMARTHR =
  "rounded-[1rem] border border-[rgba(15,23,42,0.08)] bg-white/80 px-4 py-2 text-[#0f172a]";

function PantryHeavyFallback({ label }: { label: string }) {
  return (
    <div className="rounded-[8px] border border-dashed border-[#ededed] bg-white px-4 py-6 text-center text-sm text-[#637381]">
      {label}
    </div>
  );
}

const inventoryPrimaryTabs = [
  { id: "dashboard", label: "Dashboard" },
  { id: "add-item", label: "Add to Inventory" },
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
  const [activeTab, setActiveTab] = useState<InventoryTab>("inventory");
  const [shoppingNeedDismissedIds, setShoppingNeedDismissedIds] = useState<string[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanBarcodeSeed, setScanBarcodeSeed] = useState<string | undefined>(undefined);
  const [selectedLibraryItemId, setSelectedLibraryItemId] = useState("");
  const [storageAreaFilter, setStorageAreaFilter] = useState("all");
  const [locationDetailFilter, setLocationDetailFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [storageZoneFilter, setStorageZoneFilter] = useState<DemoPantryZone | "all">("all");
  const [inventorySort, setInventorySort] = useState<PantryInventorySort>("name");
  const [stockStatusFilter, setStockStatusFilter] = useState("all");
  const [showDetailedInventory, setShowDetailedInventory] = useState(false);
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
  const zoneFromQuery = useMemo((): DemoPantryZone | null => {
    if (!inventorySearch?.trim()) {
      return null;
    }
    const q = inventorySearch.startsWith("?") ? inventorySearch.slice(1) : inventorySearch;
    try {
      const raw = new URLSearchParams(q).get("zone")?.trim() ?? "";
      if (PANTRY_STORAGE_ZONES.includes(raw as DemoPantryZone)) {
        return raw as DemoPantryZone;
      }
      return null;
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
  const recentlyUpdatedItems = useMemo(() => {
    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
    return data.pantry.filter((p) => {
      if (p.inactiveInInventory) {
        return false;
      }
      const t = Date.parse(p.lastUpdated || p.createdAt);
      return Number.isFinite(t) && t >= cutoff;
    });
  }, [data.pantry]);
  const purchasedItemsToAdd = useMemo(
    () =>
      data.shopping.filter(
        (item) => item.purchased === true || item.needsPutAway === true,
      ),
    [data.shopping],
  );
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

  useEffect(() => {
    if (!zoneFromQuery) {
      return;
    }
    setStorageZoneFilter(zoneFromQuery);
    setActiveTab("inventory");
  }, [zoneFromQuery]);

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
    setShowDetailedInventory(true);
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

    if (storageZoneFilter !== "all" && !itemMatchesStorageZone(item, storageZoneFilter)) {
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

    if (stockStatusFilter === "Stocked" || stockStatusFilter === "Low" || stockStatusFilter === "Out") {
      if (item.status !== stockStatusFilter) {
        return false;
      }
    }

    if (statusFilter === "low-stock" || stockStatusFilter === "low-stock") {
      if (!isInventoryLowStock(item)) {
        return false;
      }
    }

    if (statusFilter === "expiring" || stockStatusFilter === "expiring") {
      if (!isInventoryExpiringSoon(item)) {
        return false;
      }
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

  const sortedFilteredItems = useMemo(() => {
    const rows = [...filteredItems];
    const statusRank = (status: string) => {
      if (status === "Out") return 0;
      if (status === "Low") return 1;
      return 2;
    };
    rows.sort((a, b) => {
      if (inventorySort === "status") {
        const diff = statusRank(a.status) - statusRank(b.status);
        if (diff !== 0) return diff;
      }
      if (inventorySort === "updated") {
        const ta = Date.parse(a.lastUpdated || a.createdAt) || 0;
        const tb = Date.parse(b.lastUpdated || b.createdAt) || 0;
        if (tb !== ta) return tb - ta;
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
    return rows;
  }, [filteredItems, inventorySort]);

  const zoneSummaries = useMemo(() => summarizePantryByZone(data.pantry), [data.pantry]);
  const activeInventoryCount = data.pantry.filter((p) => !p.inactiveInInventory).length;
  const storageAreaCount = useMemo(() => {
    const set = new Set(
      data.pantry.filter((p) => !p.inactiveInInventory).map((p) => p.storageArea).filter(Boolean),
    );
    return Math.max(set.size, zoneSummaries.filter((z) => z.count > 0).length);
  }, [data.pantry, zoneSummaries]);

  function handleStatFilter(kind: "all" | "low" | "out" | "recent" | "purchased" | "storage") {
    setActiveTab("inventory");
    setStorageZoneFilter("all");
    setCategoryFilter("all");
    setLocationDetailFilter("all");
    setStorageAreaFilter("all");
    setSourceFilter("all");
    setSearchText("");
    if (kind === "all") {
      setStatusFilter("all");
      setStockStatusFilter("all");
      return;
    }
    if (kind === "low") {
      setStatusFilter("low-stock");
      setStockStatusFilter("low-stock");
      return;
    }
    if (kind === "out") {
      setStatusFilter("all");
      setStockStatusFilter("Out");
      return;
    }
    if (kind === "recent") {
      setStatusFilter("all");
      setStockStatusFilter("all");
      setInventorySort("updated");
      return;
    }
    if (kind === "purchased") {
      onOpenShopping?.();
      navigateWithinApp?.("/shopping");
      return;
    }
    if (kind === "storage") {
      setActiveTab("storage-plan");
    }
  }

  function handleSelectZone(zone: DemoPantryZone | "all") {
    setStorageZoneFilter(zone);
    setActiveTab("inventory");
    if (zone === "all") {
      setStorageAreaFilter("all");
      setLocationDetailFilter("all");
      return;
    }
    // Prefer friendly zone filter; clear conflicting storage selects.
    setStorageAreaFilter("all");
    setLocationDetailFilter("all");
  }

  function handleChromeStatusFilter(value: string) {
    setStockStatusFilter(value);
    if (value === "low-stock" || value === "expiring") {
      setStatusFilter(value);
    } else if (value === "all") {
      setStatusFilter("all");
    } else {
      setStatusFilter("all");
    }
    setActiveTab("inventory");
  }
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
          "aux-pantry flex flex-col gap-4 px-[15px] pb-10 pt-0 sm:gap-5 sm:px-[30px] md:pb-10",
          DS_MAIN_COLUMN,
        )}
        tone={workspaceTone}
      >
        <PantryAdminUxChrome
          totalItems={activeInventoryCount}
          lowStock={lowStockItems.length}
          outOfStock={outItems.length}
          recentlyUpdated={recentlyUpdatedItems.length}
          purchasedToAdd={purchasedItemsToAdd.length}
          storageAreaCount={storageAreaCount}
          zoneSummaries={zoneSummaries}
          activeZone={storageZoneFilter}
          onSelectZone={handleSelectZone}
          onAddItem={() => {
            setActiveTab("add-item");
          }}
          onScanItem={() => {
            setActiveTab("add-item");
            setScannerOpen(true);
          }}
          onOpenSettings={
            navigateWithinApp
              ? () => navigateWithinApp("/settings")
              : onOpenDashboard
                ? () => onOpenDashboard()
                : undefined
          }
          onStatFilter={handleStatFilter}
          searchText={searchText}
          setSearchText={(value) => {
            setSearchText(value);
            setActiveTab("inventory");
          }}
          categoryFilter={categoryFilter}
          setCategoryFilter={(value) => {
            setCategoryFilter(value);
            setActiveTab("inventory");
          }}
          locationFilter={locationDetailFilter}
          setLocationFilter={(value) => {
            setLocationDetailFilter(value);
            setActiveTab("inventory");
          }}
          statusFilter={stockStatusFilter}
          setStatusFilter={handleChromeStatusFilter}
          sortBy={inventorySort}
          setSortBy={setInventorySort}
          categories={categories}
          locations={locationDetails}
        />

        <details className={cn(CARD_SHELL, "px-4 py-2")}>
          <summary className="cursor-pointer select-none py-3 text-sm font-semibold text-[#0f172a]">
            More — shopping link &amp; grocery library
          </summary>
          <div className="space-y-4 border-t border-[rgba(15,23,42,0.08)] pb-3 pt-3">
            <div className="flex flex-wrap gap-2">
              <Button className={btnSecondaryLight} onClick={onOpenShopping} variant="secondary">
                <ShoppingCart className="h-4 w-4" />
                Shopping list
              </Button>
              {purchasedItemsToAdd.length > 0 ? (
                <Button
                  className={btnSecondaryLight}
                  variant="secondary"
                  onClick={() => {
                    onOpenShopping?.();
                    navigateWithinApp?.("/shopping");
                  }}
                >
                  Purchased Items to Add ({purchasedItemsToAdd.length})
                </Button>
              ) : null}
            </div>
            <div className="grid gap-2 md:grid-cols-[minmax(220px,360px)_auto]">
              <label className="space-y-1.5">
                <span className={SM_LABEL}>Saved grocery items</span>
                <Select
                  className={SM_INPUT}
                  value={selectedLibraryItemId}
                  onChange={(event) => setSelectedLibraryItemId(event.target.value)}
                >
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

        <nav className="aux-pantry__tabs" aria-label="Pantry sections">
          {inventoryPrimaryTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={cn("aux-pantry__tab", activeTab === tab.id && "is-active")}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <p className="text-xs leading-relaxed text-[#64748b]">
          QR labels open the matching item or shelf on this device. Scan and Open Food Facts lookup stay available
          under Add to Inventory.
        </p>

      {inventorySearch ? (
        <div
          className={cn(
            "flex flex-col gap-3 rounded-[1rem] border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
            missingDeepLinkItem
              ? "border-amber-200 bg-amber-50/90 text-amber-950"
              : "border-[rgba(15,23,42,0.08)] bg-white text-[#0f172a]",
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
          <WorkspacePanel
            className={CARD_SHELL}
            eyebrow="Add to Inventory"
            title="Scan or enter stock"
            tone={workspaceTone}
          >
            <ol className="list-decimal space-y-2 pl-5 text-sm text-[#575757]">
              <li>Scan a barcode with the camera.</li>
              <li>Pick a saved grocery item from the library, or search in the form.</li>
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
            <Button type="button" variant="secondary" className={btnSecondaryLight} onClick={addItem}>
              <Plus className="h-4 w-4" />
              Add Item
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
        <div className="space-y-4">
          <PantryAdminUxInventoryList
            items={sortedFilteredItems}
            adjustItemQuantity={adjustItemQuantity}
            addInventoryItemToShopping={addInventoryItemToShopping}
            onEditItem={(itemId) => {
              setPantryImageEditId(itemId);
              setActiveTab("inventory");
              window.requestAnimationFrame(() => {
                document
                  .getElementById(`inventory-card-${itemId}`)
                  ?.scrollIntoView({ behavior: "smooth", block: "center" });
              });
              // Fall through to detailed card editor below when user wants full edit.
              setShowDetailedInventory(true);
            }}
            onUpdateStock={(itemId) => {
              setShowDetailedInventory(true);
              setPantryImageEditId(itemId);
              window.requestAnimationFrame(() => {
                document
                  .getElementById(`inventory-card-${itemId}`)
                  ?.scrollIntoView({ behavior: "smooth", block: "center" });
              });
            }}
          />
          {showDetailedInventory ? (
            <details className={DETAILS_SMARTHR} open>
              <summary className="cursor-pointer py-2 text-sm font-semibold text-[#0f172a]">
                Detailed inventory editor
              </summary>
              <div className="pb-4 pt-2">
                <InventoryGridView
                  addInventoryItemToShopping={addInventoryItemToShopping}
                  applyProductLookupToInventory={applyProductLookupToInventory}
                  adjustItemQuantity={adjustItemQuantity}
                  allPantryItems={data.pantry}
                  categories={categories}
                  categoryFilter={categoryFilter}
                  deepLinkOrigin={deepLinkOrigin}
                  filteredItems={sortedFilteredItems}
                  highlightItemId={parsedInventoryQr.itemId ?? pantryImageEditId ?? undefined}
                  inventoryPanelEyebrow="Full edit cards"
                  inventoryPanelTitle="Edit inventory"
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
              </div>
            </details>
          ) : (
            <button
              type="button"
              className="aux-pantry__btn aux-pantry__btn--ghost"
              onClick={() => setShowDetailedInventory(true)}
            >
              Open detailed inventory editor
            </button>
          )}
        </div>
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
