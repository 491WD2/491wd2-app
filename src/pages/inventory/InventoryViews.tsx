import {
  BookOpen,
  Camera,
  ChevronRight,
  Grid2X2,
  Image,
  Link2,
  MoreHorizontal,
  Plus,
  QrCode,
  StickyNote,
  UtensilsCrossed,
  X,
} from "lucide-react";
import {
  lazy,
  Suspense,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
  type CSSProperties,
} from "react";
import { useInventoryActivityHistory } from "../../lib/groceryProductActions";
import type { GroceryInventoryActivityEntry, HouseholdProduct } from "../../types/grocery";
import {
  pantryLocations,
  pantryShelves,
  pantryWalls,
  kitchenLocationDetails,
  coldLocationDetails,
  stockStatuses,
  type FamilyMember,
  type PantryItem,
  type RecipeIdea,
} from "../../data/familyData";
import { selectOptionsWithCurrent } from "../../lib/customization";
import {
  buildInventoryItemDeepLink,
  buildInventoryLocationDeepLink,
  locationDeepLinkFromPantryItem,
} from "../../lib/inventoryDeepLink";
import { Badge } from "../../components/ui/Badge";
import { RecipeUseUpModal } from "../../components/inventory/RecipeUseUpModal";
import type { QrPreviewTarget } from "../../components/inventory/InventoryQrLabelDrawer";
import { Button } from "../../components/ui/Button";
import { Input, Select, Textarea } from "../../components/ui/Field";
import {
  EmptyStatePanel,
  type ModuleWorkspaceTone,
  WorkspacePanel,
  WorkspaceTableWrap,
  workspaceTableClassName,
} from "../../components/workspace/ModuleWorkspace";
import { wrkMetricCellClassName } from "../../components/workspace/workspaceDesign";
import { membersForAssignmentSelect } from "../../lib/memberAssignment";
import { cn, formatShortDate, getMemberFullName } from "../../lib/utils";
import {
  getGroceryCategoryTheme,
  PANTRY_VISIBLE_CATEGORY_ORDER,
} from "../../lib/groceryCategoryTheme";
import type { InventoryQrLocationFilters } from "../../services/qrInventory";
import {
  type InventoryConsumePayload,
  type InventoryFilterOption,
  type OpenFilteredInventory,
  getInventoryLocationLabel,
  isColdStorage,
  isKitchenStorage,
  parseQuantity,
  isInventoryExpiringSoon,
  isInventoryLowStock,
  consumeNeedsPartialZeroConfirm,
  buildPantryTypeBrandSuggestions,
  isInventoryOverstock,
  isUseSoonCandidate,
  getPantryItemDisplayImageSrc,
  getPantryItemPlaceholderEmoji,
  groupPantryItemsByShelfForTable,
} from "./inventoryUtils";
import { effectiveBestByDate } from "../../lib/inventoryDates";
import { compressImageFileToDataUrl } from "../../lib/imageCompression";
import type { NormalizedProductLookup } from "../../services/openFoodFacts";
import {
  getInventoryStatusColor,
  getInventoryStatusLabel,
  shouldSuggestRecipeIdeas,
} from "../../services/inventoryStatus";

/** Pantry SmartHR — white cards, #ededed border, 8px radius */
const PANTRY_SMARTHR_PANEL =
  "!rounded-[8px] !border-[#ededed] shadow-[0_1px_1px_rgba(0,0,0,0.12)] ring-0";

const BTN_PRIMARY_ORANGE =
  "bg-gradient-to-r from-[#FF6F28] to-[#FF5325] font-semibold text-white shadow-[0_6px_15px_rgba(242,101,34,0.22)] hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f7f7]";

const LIGHT_FIELD_SMARTHR =
  "rounded-[8px] border border-[#ededed] bg-white text-[#1f1f1f] shadow-[0_1px_1px_rgba(0,0,0,0.06)] placeholder:text-[#8e8e8e] focus:border-[#FE9F43]/55 focus:outline-none focus:ring-2 focus:ring-[#FE9F43]/25";

function pantryPanelExtras(tone?: ModuleWorkspaceTone) {
  return tone === "light" ? PANTRY_SMARTHR_PANEL : undefined;
}

const InventoryQrLabelDrawerLazy = lazy(() =>
  import("../../components/inventory/InventoryQrLabelDrawer").then((m) => ({
    default: m.InventoryQrLabelDrawer,
  })),
);

const ProductLookupPanelLazy = lazy(() =>
  import("../../components/product/ProductLookupPanel").then((m) => ({
    default: m.ProductLookupPanel,
  })),
);

function PantryItemThumb({
  item,
  dark,
  size = "md",
  onClick,
  title,
}: {
  item: PantryItem;
  dark: boolean;
  size?: "md" | "lg" | "table";
  /** When set, thumb is focusable and opens image controls (e.g. shelf table). */
  onClick?: () => void;
  title?: string;
}) {
  const src = getPantryItemDisplayImageSrc(item);
  const [broken, setBroken] = useState(false);
  const placeholderEmoji = getPantryItemPlaceholderEmoji(item);
  const box =
    size === "lg"
      ? "h-14 w-14 rounded-[8px]"
      : size === "table"
        ? "h-12 w-12 rounded-[6px]"
        : "h-11 w-11 rounded-md";
  const iconClass =
    size === "lg" ? "h-5 w-5" : size === "table" ? "h-[18px] w-[18px]" : "h-4 w-4";
  const ring =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/40 focus-visible:ring-offset-2";
  const inner =
    !src || broken ? (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center border border-dashed object-cover",
          box,
          dark ? "border-white/20 bg-white/5" : "border-[#ededed] bg-[#f0f9ff]",
        )}
        aria-hidden
      >
        {placeholderEmoji ? (
          <span className={size === "lg" ? "text-xl" : "text-base"}>{placeholderEmoji}</span>
        ) : (
          <Image className={cn("opacity-45", iconClass)} aria-hidden />
        )}
      </div>
    ) : (
      <img
        alt=""
        src={src}
        className={cn("shrink-0 border object-cover", box, dark ? "border-white/10" : "border-[#ededed]")}
        onError={() => setBroken(true)}
      />
    );
  if (onClick) {
    return (
      <button
        type="button"
        title={title ?? "Edit image"}
        aria-label={title ?? `Edit image for ${item.name}`}
        className={cn(
          "shrink-0 rounded-[6px] transition hover:opacity-95 active:scale-[0.98]",
          ring,
          dark ? "ring-offset-[#141c28]" : "ring-offset-white",
        )}
        onClick={onClick}
      >
        {inner}
      </button>
    );
  }
  return inner;
}

function PantryHeroImageFrame({
  src,
  alt,
  dark,
}: {
  src: string;
  alt: string;
  dark: boolean;
}) {
  const [broken, setBroken] = useState(false);
  return (
    <div
      className={cn(
        "flex max-h-52 min-h-[10rem] w-full items-center justify-center overflow-hidden rounded-md border",
        dark ? "border-white/10 bg-black/50" : "border-[#ededed] bg-[#f8f9fa]",
      )}
    >
      {!src || broken ? (
        <span className="px-4 text-center text-xs text-[#8e8e8e]">No image yet</span>
      ) : (
        <img
          alt={alt}
          src={src}
          className="max-h-52 w-full object-contain"
          onError={() => setBroken(true)}
        />
      )}
    </div>
  );
}

export type PantryItemSelectLists = {
  storageAreas: string[];
  categories: string[];
  units: string[];
  kitchenLocationDetails: string[];
  pantryWalls: string[];
  pantryShelves: string[];
  coldLocationDetails: string[];
};

function defaultSelectLists(overrides?: PantryItemSelectLists): PantryItemSelectLists {
  return (
    overrides ?? {
      storageAreas: [...pantryLocations],
      categories: [],
      units: [],
      kitchenLocationDetails: [...kitchenLocationDetails],
      pantryWalls: [...pantryWalls],
      pantryShelves: [...pantryShelves],
      coldLocationDetails: [...coldLocationDetails],
    }
  );
}

function InvMetric({
  label,
  value,
  onPress,
  tone = "light",
}: {
  label: string;
  value: ReactNode;
  onPress?: () => void;
  tone?: ModuleWorkspaceTone;
}) {
  const dark = tone === "premiumDark";
  const inner = (
    <>
      <p
        className={cn(
          "text-[0.7rem] font-semibold uppercase tracking-[0.1em]",
          dark ? "text-slate-500" : "text-slate-500",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-xl font-semibold tabular-nums",
          dark ? "text-slate-50" : "text-slate-950",
        )}
      >
        {value}
      </p>
    </>
  );
  if (onPress) {
    return (
      <button
        className={cn(
          "motion-card w-full rounded-xl border p-3 text-left transition hover:brightness-[1.06] active:scale-[0.99]",
          dark
            ? "border-white/10 bg-white/[0.04]"
            : cn(wrkMetricCellClassName),
        )}
        onClick={onPress}
        type="button"
      >
        {inner}
      </button>
    );
  }
  return (
    <div
      className={cn(
        "motion-card rounded-xl border p-3",
        dark ? "border-white/10 bg-white/[0.04]" : cn(wrkMetricCellClassName),
      )}
    >
      {inner}
    </div>
  );
}

export function InventoryOverviewView({
  lowStockItems,
  outItems,
  useSoonItems,
  recentlyAddedItems,
  onAddItem,
  onScanItem,
  onUseInventory,
  onOpenInventory,
  onOpenShoppingNeeds,
  tone = "light",
}: {
  lowStockItems: PantryItem[];
  outItems: PantryItem[];
  useSoonItems: PantryItem[];
  recentlyAddedItems: PantryItem[];
  onAddItem: () => void;
  onScanItem: () => void;
  onUseInventory: () => void;
  onOpenInventory: () => void;
  onOpenShoppingNeeds: () => void;
  tone?: ModuleWorkspaceTone;
}) {
  const panelChrome = pantryPanelExtras(tone);
  return (
    <section className="grid gap-5">
      <WorkspacePanel className={panelChrome} title="Home" eyebrow="Pantry dashboard" tone={tone}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <InvMetric
            label="Low Stock"
            onPress={onOpenShoppingNeeds}
            tone={tone}
            value={lowStockItems.length}
          />
          <InvMetric
            label="Out"
            onPress={onOpenShoppingNeeds}
            tone={tone}
            value={outItems.length}
          />
          <InvMetric
            label="Use Soon"
            onPress={onOpenShoppingNeeds}
            tone={tone}
            value={useSoonItems.length}
          />
          <InvMetric label="Recently Updated" tone={tone} value={recentlyAddedItems.length} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            detail="Create a new row you can edit in place"
            icon={<Plus className="h-4 w-4" />}
            onClick={onAddItem}
            title="Add Item"
            tone={tone}
          />
          <QuickAction
            detail="Use your camera to read a barcode"
            icon={<Camera className="h-4 w-4" />}
            onClick={onScanItem}
            title="Scan Item"
            tone={tone}
          />
          <QuickAction
            detail="Subtract what you cooked or finished"
            icon={<UtensilsCrossed className="h-4 w-4" />}
            onClick={onUseInventory}
            title="Use Item"
            tone={tone}
          />
          <QuickAction
            detail="Search, filter, and update everything on hand"
            icon={<Grid2X2 className="h-4 w-4" />}
            onClick={onOpenInventory}
            title="Open Pantry"
            tone={tone}
          />
        </div>
      </WorkspacePanel>

      <WorkspacePanel className={panelChrome} title="Low stock" eyebrow="Needs attention" tone={tone}>
        <AlertList
          emptyText="No low-stock items right now."
          items={lowStockItems}
          tone={tone}
        />
      </WorkspacePanel>

      <WorkspacePanel className={panelChrome} title="Out" eyebrow="Empty on the shelf" tone={tone}>
        <AlertList emptyText="Nothing is marked out." items={outItems} tone={tone} />
      </WorkspacePanel>

      <WorkspacePanel className={panelChrome} title="Use soon" eyebrow="Dates and use-up cues" tone={tone}>
        <AlertList
          emptyText="No items need attention for dates right now."
          items={useSoonItems}
          tone={tone}
        />
      </WorkspacePanel>

      <WorkspacePanel className={panelChrome} title="Recently updated" eyebrow="Last 14 days" tone={tone}>
        <AlertList
          emptyText="No inventory updates in the last two weeks."
          items={recentlyAddedItems}
          tone={tone}
        />
      </WorkspacePanel>
    </section>
  );
}

export function InventoryGridView({
  categories,
  filteredItems,
  storageAreaFilter,
  setStorageAreaFilter,
  categoryFilter,
  setCategoryFilter,
  locationDetailFilter,
  setLocationDetailFilter,
  locationDetails,
  sourceFilter,
  setSourceFilter,
  sourceOptions,
  searchText,
  setSearchText,
  statusFilter,
  setStatusFilter,
  updateItem,
  adjustItemQuantity,
  addInventoryItemToShopping,
  applyProductLookupToInventory,
  onConsumeInventory,
  familyMembers,
  selectLists,
  deepLinkOrigin = "",
  highlightItemId,
  onAddRecipeIdea,
  onAddMissingIngredientsToShopping,
  pantryNamesForRecipes = [],
  inventoryPanelTitle = "Inventory",
  inventoryPanelEyebrow = "Editable card view",
  archivedPresentation = false,
  onAddItem,
  tone = "light",
  allPantryItems,
  pantryImageEditRequestId,
  onClearPantryImageEditRequest,
  onRequestPantryImageEdit,
}: {
  categories: string[];
  filteredItems: PantryItem[];
  /** Full pantry list for type/brand suggestions (same category). */
  allPantryItems: PantryItem[];
  storageAreaFilter: string;
  setStorageAreaFilter: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  locationDetailFilter: string;
  setLocationDetailFilter: (value: string) => void;
  locationDetails: string[];
  sourceFilter: string;
  setSourceFilter: (value: string) => void;
  sourceOptions: string[];
  searchText: string;
  setSearchText: (value: string) => void;
  statusFilter: InventoryFilterOption;
  setStatusFilter: (value: InventoryFilterOption) => void;
  updateItem: (id: string, updates: Partial<PantryItem>) => void;
  adjustItemQuantity: (item: PantryItem, delta: number) => void;
  addInventoryItemToShopping: (item: PantryItem) => void;
  applyProductLookupToInventory: (
    item: PantryItem,
    product: NormalizedProductLookup,
  ) => void;
  /** Subtract a cooked / consumed amount (does not replace ± quick adjust). */
  onConsumeInventory?: (item: PantryItem, payload: InventoryConsumePayload) => void;
  familyMembers?: FamilyMember[];
  selectLists?: PantryItemSelectLists;
  /** When set (e.g. `window.location.origin`), show copy-to-clipboard QR URL actions on cards. */
  deepLinkOrigin?: string;
  /** Scroll / highlight target from `?item=` deep link. */
  highlightItemId?: string;
  onAddRecipeIdea?: (idea: RecipeIdea) => void;
  onAddMissingIngredientsToShopping?: (ingredientLabels: string[]) => void;
  pantryNamesForRecipes?: string[];
  inventoryPanelTitle?: string;
  inventoryPanelEyebrow?: string;
  archivedPresentation?: boolean;
  onAddItem?: () => void;
  tone?: ModuleWorkspaceTone;
  pantryImageEditRequestId?: string | null;
  onClearPantryImageEditRequest?: () => void;
  onRequestPantryImageEdit?: (itemId: string) => void;
}) {
  const lists = defaultSelectLists(selectLists);
  const [qrTarget, setQrTarget] = useState<QrPreviewTarget | null>(null);
  const [pantryMainLayout, setPantryMainLayout] = useState<"shelf-table" | "cards">("shelf-table");
  const origin = deepLinkOrigin || (typeof window !== "undefined" ? window.location.origin : "");
  const panelTone = tone ?? "light";
  const effectiveLayout = archivedPresentation ? "cards" : pantryMainLayout;

  function openPantryImageEdit(itemId: string) {
    if (!archivedPresentation) {
      setPantryMainLayout("cards");
    }
    onRequestPantryImageEdit?.(itemId);
  }

  return (
    <WorkspacePanel
      className={cn(pantryPanelExtras(panelTone), "min-w-0 max-w-full")}
      title={inventoryPanelTitle}
      eyebrow={inventoryPanelEyebrow}
      tone={panelTone}
    >
      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <InventoryField label="Search">
          <Input
            placeholder="Search name, notes, tags, location"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </InventoryField>
        <InventoryField label="Storage">
          <Select
            value={storageAreaFilter}
            onChange={(event) => setStorageAreaFilter(event.target.value)}
          >
            <option value="all">All storage areas</option>
            {lists.storageAreas.map((location) => (
              <option key={location}>{location}</option>
            ))}
          </Select>
        </InventoryField>
        <InventoryField label="Location detail">
          <Select
            value={locationDetailFilter}
            onChange={(event) => setLocationDetailFilter(event.target.value)}
          >
            <option value="all">All location details</option>
            {locationDetails.map((locationDetail) => (
              <option key={locationDetail}>{locationDetail}</option>
            ))}
          </Select>
        </InventoryField>
        <InventoryField label="Category">
          <Select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </Select>
        </InventoryField>
        <InventoryField label="Status">
          <Select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as InventoryFilterOption)
            }
          >
            <option value="all">All items</option>
            <option value="low-stock">Low stock</option>
            <option value="expiring">Use soon (dates)</option>
            <option value="staples">Staples</option>
          </Select>
        </InventoryField>
        <InventoryField label="Type">
          <Select
            value={sourceFilter}
            onChange={(event) => setSourceFilter(event.target.value)}
          >
            <option value="all">All types</option>
            {sourceOptions.map((source) => (
              <option key={source}>{source}</option>
            ))}
          </Select>
        </InventoryField>
      </div>

      {!archivedPresentation ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#637381]">
            View
          </span>
          <div className="inline-flex rounded-[8px] border border-[#ededed] bg-[#f8f9fa] p-0.5">
            <button
              type="button"
              className={cn(
                "rounded-[6px] px-3 py-1.5 text-[13px] font-semibold transition",
                pantryMainLayout === "shelf-table"
                  ? "bg-gradient-to-r from-[#FF6F28] to-[#FF5325] text-white shadow-sm"
                  : "text-[#637381] hover:bg-white hover:text-[#1f1f1f]",
              )}
              onClick={() => setPantryMainLayout("shelf-table")}
            >
              Shelf table
            </button>
            <button
              type="button"
              className={cn(
                "rounded-[6px] px-3 py-1.5 text-[13px] font-semibold transition",
                pantryMainLayout === "cards"
                  ? "bg-gradient-to-r from-[#FF6F28] to-[#FF5325] text-white shadow-sm"
                  : "text-[#637381] hover:bg-white hover:text-[#1f1f1f]",
              )}
              onClick={() => setPantryMainLayout("cards")}
            >
              Cards
            </button>
          </div>
        </div>
      ) : null}

      {effectiveLayout === "shelf-table" && filteredItems.length > 0 ? (
        <div className="mb-6 min-w-0 max-w-full">
          <InventoryTableView
            embedded
            adjustItemQuantity={adjustItemQuantity}
            items={filteredItems}
            onRequestImageEdit={openPantryImageEdit}
            selectLists={selectLists}
            updateItem={updateItem}
          />
        </div>
      ) : null}

      {effectiveLayout === "cards" ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {filteredItems.length === 0 ? (
            <EmptyStatePanel
              action={
                onAddItem ? (
                  <Button type="button" variant="primary" className="min-h-11" onClick={onAddItem}>
                    Add Item
                  </Button>
                ) : undefined
              }
              text="Try a different filter or add a new item."
              title="No items found."
              tone={panelTone}
            />
          ) : null}
          {filteredItems.map((item) => (
            <InventoryCard
              addInventoryItemToShopping={addInventoryItemToShopping}
              adjustItemQuantity={adjustItemQuantity}
              allPantryItems={allPantryItems}
              applyProductLookupToInventory={applyProductLookupToInventory}
              archivedPresentation={archivedPresentation}
              deepLinkOrigin={deepLinkOrigin}
              familyMembers={familyMembers}
              highlight={highlightItemId === item.id}
              item={item}
              key={item.id}
              onAddMissingIngredientsToShopping={onAddMissingIngredientsToShopping}
              onAddRecipeIdea={onAddRecipeIdea}
              onClearPantryImageEditRequest={onClearPantryImageEditRequest}
              onConsumeInventory={onConsumeInventory}
              onOpenQrLabel={origin ? () => setQrTarget({ kind: "item", item }) : undefined}
              pantryImageEditRequestId={pantryImageEditRequestId}
              pantryNamesForRecipes={pantryNamesForRecipes}
              selectLists={lists}
              tone={panelTone}
              updateItem={updateItem}
            />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyStatePanel
          action={
            onAddItem ? (
              <Button type="button" variant="primary" className="min-h-11" onClick={onAddItem}>
                Add Item
              </Button>
            ) : undefined
          }
          text="Try a different filter or add a new item."
          title="No items found."
          tone={panelTone}
        />
      ) : null}
      {qrTarget && origin ? (
        <Suspense fallback={null}>
          <InventoryQrLabelDrawerLazy
            origin={origin}
            target={qrTarget}
            onClose={() => setQrTarget(null)}
          />
        </Suspense>
      ) : null}
    </WorkspacePanel>
  );
}

export function InventoryCategoryView({
  categories,
  items,
  openFilteredInventory,
}: {
  categories: string[];
  items: PantryItem[];
  openFilteredInventory: OpenFilteredInventory;
}) {
  const visibleCategories = categories.length > 0 ? categories : ["Uncategorized"];

  return (
    <WorkspacePanel className={PANTRY_SMARTHR_PANEL} title="Categories" eyebrow="Grouped by food type">
      <div className="grid gap-4 lg:grid-cols-2">
        {visibleCategories.map((category) => {
          const categoryItems = items.filter((item) =>
            category === "Uncategorized"
              ? !item.category
              : item.category === category,
          );
          return (
            <button
              className="motion-card rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50"
              key={category}
              onClick={() => openFilteredInventory({ category })}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-950">{category}</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {categoryItems.length} tracked item
                    {categoryItems.length === 1 ? "" : "s"}
                  </p>
                </div>
                <Badge tone="neutral">{categoryItems.length}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {categoryItems.slice(0, 5).map((item) => (
                  <Badge
                    key={item.id}
                    tone={isInventoryLowStock(item) ? "amber" : "blue"}
                  >
                    {item.name}
                  </Badge>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </WorkspacePanel>
  );
}

export function InventoryLocationView({
  items,
  openFilteredInventory,
  selectLists,
  deepLinkOrigin,
}: {
  items: PantryItem[];
  openFilteredInventory: OpenFilteredInventory;
  selectLists?: PantryItemSelectLists;
  deepLinkOrigin?: string;
}) {
  const lists = defaultSelectLists(selectLists);
  const [copiedStorage, setCopiedStorage] = useState<string | null>(null);

  async function copyStorageUrl(storage: string) {
    if (!deepLinkOrigin) {
      return;
    }
    const url = buildInventoryLocationDeepLink(deepLinkOrigin, { storage });
    try {
      await navigator.clipboard.writeText(url);
      setCopiedStorage(storage);
      window.setTimeout(() => setCopiedStorage(null), 2000);
    } catch {
      setCopiedStorage(null);
    }
  }
  return (
    <WorkspacePanel className={PANTRY_SMARTHR_PANEL} title="Storage Locations" eyebrow="Physical map">
      <div className="grid gap-4 xl:grid-cols-2">
        {lists.storageAreas.map((location) => {
          const locationItems = items.filter(
            (item) => item.storageArea === location,
          );
          return (
            <section
              className="motion-card rounded-lg border border-slate-200 bg-white p-4"
              key={location}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-950">{location}</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {locationItems.length} item
                    {locationItems.length === 1 ? "" : "s"} stored here
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {deepLinkOrigin ? (
                    <Button
                      onClick={() => void copyStorageUrl(location)}
                      type="button"
                      variant="secondary"
                    >
                      <QrCode className="h-4 w-4" aria-hidden />
                      {copiedStorage === location ? "Copied" : "Copy area QR URL"}
                    </Button>
                  ) : null}
                  <Button
                    onClick={() => openFilteredInventory({ storageArea: location })}
                    variant="ghost"
                  >
                    Open
                  </Button>
                </div>
              </div>
              {location === "Pantry" ? (
                <PantryBreakdown
                  items={locationItems}
                  shelves={lists.pantryShelves}
                  walls={lists.pantryWalls}
                />
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {locationItems.slice(0, 8).map((item) => (
                    <Badge key={item.id} tone="neutral">
                      {item.name}
                      {getInventoryLocationLabel(item) !== item.storageArea
                        ? ` · ${getInventoryLocationLabel(item).replace(`${item.storageArea} · `, "")}`
                        : ""}
                    </Badge>
                  ))}
                  {locationItems.length === 0 ? (
                    <p className="text-sm text-slate-400">No items here yet.</p>
                  ) : null}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </WorkspacePanel>
  );
}

const IMAGE_EDIT_SECTION_SHELL =
  "mb-4 w-full space-y-4 rounded-[8px] border border-[#ededed] bg-[#f8f9fa] p-4 shadow-[0_1px_1px_rgba(0,0,0,0.06)]";

function PantryItemImageEditorBlock({
  item,
  updateItem,
  dark,
  imageSectionRef,
}: {
  item: PantryItem;
  updateItem: (id: string, updates: Partial<PantryItem>) => void;
  dark: boolean;
  imageSectionRef?: RefObject<HTMLDivElement | null>;
}) {
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const displaySrc = getPantryItemDisplayImageSrc(item);
  const canRemove = Boolean(
    item.productImageDataUrl?.trim() ||
      item.itemPhotoUrl?.trim() ||
      item.productImageUrl?.trim(),
  );

  function removeAllImages() {
    updateItem(item.id, {
      productImageDataUrl: undefined,
      itemPhotoUrl: undefined,
      productImageUrl: undefined,
    });
  }

  return (
    <div
      ref={imageSectionRef}
      className={cn(IMAGE_EDIT_SECTION_SHELL, dark && "border-white/10 bg-[#0a1018] shadow-black/20")}
      id={`pantry-image-section-${item.id}`}
    >
      <div>
        <p
          className={cn(
            "text-[11px] font-semibold uppercase tracking-[0.12em]",
            dark ? "text-slate-500" : "text-[#637381]",
          )}
        >
          Image
        </p>
        <p className={cn("mt-1 text-[13px] leading-snug", dark ? "text-slate-400" : "text-[#575757]")}>
          Preview uses uploaded photo first, then pasted URL, then barcode or Open Food Facts. Uploads are
          compressed before save.
        </p>
      </div>
      <PantryHeroImageFrame
        alt={item.itemPhotoCaption || item.name}
        dark={dark}
        src={displaySrc}
      />
      <input
        ref={uploadInputRef}
        accept="image/*"
        aria-hidden
        className="sr-only"
        type="file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file?.type.startsWith("image/")) {
            return;
          }
          void (async () => {
            try {
              const dataUrl = await compressImageFileToDataUrl(file);
              updateItem(item.id, { productImageDataUrl: dataUrl });
            } catch {
              window.alert("Could not process this image. Try JPG or PNG.");
            }
          })();
        }}
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          className={cn(BTN_PRIMARY_ORANGE, "min-h-10 w-full sm:w-auto")}
          type="button"
          onClick={() => uploadInputRef.current?.click()}
        >
          Upload image
        </Button>
        <Button
          className={cn(
            "min-h-10 w-full sm:w-auto",
            dark && "border-white/12 bg-white/[0.06] text-slate-100",
          )}
          disabled={!canRemove}
          type="button"
          variant="secondary"
          onClick={removeAllImages}
        >
          Remove image
        </Button>
      </div>
      <InventoryField label="Paste image URL">
        <Input
          className={dark ? "border-white/12 bg-[#060a0f] text-slate-100 placeholder:text-slate-600" : LIGHT_FIELD_SMARTHR}
          placeholder="https://…"
          value={item.itemPhotoUrl ?? ""}
          onChange={(event) =>
            updateItem(item.id, { itemPhotoUrl: event.target.value.trim() || undefined })
          }
        />
      </InventoryField>
      <InventoryField label="Product / barcode image URL (optional)">
        <Input
          className={dark ? "border-white/12 bg-[#060a0f] text-slate-100" : LIGHT_FIELD_SMARTHR}
          value={item.productImageUrl ?? ""}
          onChange={(event) =>
            updateItem(item.id, { productImageUrl: event.target.value.trim() || undefined })
          }
        />
      </InventoryField>
      <InventoryField label="Photo caption">
        <Input
          className={dark ? "border-white/12 bg-[#060a0f] text-slate-100" : LIGHT_FIELD_SMARTHR}
          value={item.itemPhotoCaption ?? ""}
          onChange={(event) =>
            updateItem(item.id, { itemPhotoCaption: event.target.value || undefined })
          }
        />
      </InventoryField>
      {item.productLookupSource ? (
        <p className={cn("text-[12px]", dark ? "text-slate-500" : "text-[#637381]")}>
          Last lookup: {item.productLookupSource}
          {item.productLookupUpdatedAt ? ` · ${formatShortDate(item.productLookupUpdatedAt)}` : ""}
        </p>
      ) : null}
    </div>
  );
}

const TABLE_HEAD_CELL =
  "px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[#637381]";

const PANTRY_TABLE_FIELD_LABEL =
  "text-[10px] font-semibold uppercase tracking-[0.12em] text-[#637381]";

function InventoryTableMobileCards({
  items,
  updateItem,
  adjustItemQuantity,
  selectLists,
  onRequestImageEdit,
}: {
  items: PantryItem[];
  updateItem: (id: string, updates: Partial<PantryItem>) => void;
  adjustItemQuantity: (item: PantryItem, delta: number) => void;
  selectLists?: PantryItemSelectLists;
  onRequestImageEdit?: (itemId: string) => void;
}) {
  const lists = defaultSelectLists(selectLists);
  const groups = useMemo(() => groupPantryItemsByShelfForTable(items), [items]);
  return (
    <div className="space-y-6">
      {groups.map(({ label, items: groupItems }) => (
        <div className="space-y-3" key={label}>
          <p className="break-words text-[12px] font-semibold uppercase tracking-[0.08em] text-[#637381]">
            {label}
          </p>
          {groupItems.map((item) => {
            const exp = effectiveBestByDate(item);
            return (
              <div
                className="motion-card space-y-3 overflow-hidden rounded-[8px] border border-[#ededed] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.12)]"
                key={item.id}
              >
                <p className={PANTRY_TABLE_FIELD_LABEL}>Image</p>
                <div className="flex gap-3">
                  <PantryItemThumb
                    dark={false}
                    item={item}
                    size="table"
                    onClick={
                      onRequestImageEdit ? () => onRequestImageEdit(item.id) : undefined
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#1f1f1f]">{item.name}</p>
                    <p className="mt-1 text-[12px] text-[#637381]">{getInventoryLocationLabel(item)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <QuantityQuickAdjust item={item} onAdjust={adjustItemQuantity} />
                  <Select
                    className={LIGHT_FIELD_SMARTHR}
                    value={item.unit ?? ""}
                    onChange={(event) => updateItem(item.id, { unit: event.target.value })}
                  >
                    <option value="">Unit</option>
                    {selectOptionsWithCurrent(lists.units, item.unit).map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[13px] text-[#575757]">
                  <div>
                    <span className={PANTRY_TABLE_FIELD_LABEL}>Bought</span>
                    <p className="mt-0.5 font-medium text-[#1f1f1f]">
                      {item.purchaseDate ? formatShortDate(item.purchaseDate) : "—"}
                    </p>
                  </div>
                  <div>
                    <span className={PANTRY_TABLE_FIELD_LABEL}>Expire</span>
                    <p className="mt-0.5 font-medium text-[#1f1f1f]">
                      {exp ? formatShortDate(exp) : "—"}
                    </p>
                  </div>
                  <div>
                    <span className={PANTRY_TABLE_FIELD_LABEL}>Trigger low</span>
                    <p className="mt-0.5 font-medium text-[#1f1f1f]">{item.minQuantity?.trim() || "—"}</p>
                  </div>
                </div>
                <p className={PANTRY_TABLE_FIELD_LABEL}>Notes</p>
                {item.notes ? (
                  <p className="break-words text-[13px] leading-snug text-[#575757] line-clamp-5">
                    {item.notes}
                  </p>
                ) : (
                  <p className="text-[13px] text-[#8e8e8e]">No notes</p>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function InventoryTableView({
  items,
  updateItem,
  adjustItemQuantity,
  selectLists,
  embedded = false,
  onRequestImageEdit,
}: {
  items: PantryItem[];
  updateItem: (id: string, updates: Partial<PantryItem>) => void;
  adjustItemQuantity: (item: PantryItem, delta: number) => void;
  selectLists?: PantryItemSelectLists;
  /** When true, render only the scrollable table (no panel chrome); parent supplies empty state. */
  embedded?: boolean;
  /** Shelf table / mobile: open image editor for this item (parent switches to cards + focus). */
  onRequestImageEdit?: (itemId: string) => void;
}) {
  const lists = defaultSelectLists(selectLists);
  const groups = useMemo(() => groupPantryItemsByShelfForTable(items), [items]);

  const tableBody = (
    <>
      <div className="md:hidden">
        {items.length === 0 ? null : (
          <InventoryTableMobileCards
            adjustItemQuantity={adjustItemQuantity}
            items={items}
            onRequestImageEdit={onRequestImageEdit}
            selectLists={selectLists}
            updateItem={updateItem}
          />
        )}
      </div>
      <div className="hidden min-w-0 max-w-full md:block">
        <WorkspaceTableWrap className="min-w-0 max-w-full border-[#ededed] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.08)]">
          <table className={cn(workspaceTableClassName, "min-w-[860px] text-[13px]")}>
            <thead>
              <tr className="border-b border-[#ededed] bg-[#f8f9fa]">
                <th className={cn(TABLE_HEAD_CELL, "w-16 shrink-0")} scope="col">
                  Image
                </th>
                <th className={cn(TABLE_HEAD_CELL, "min-w-0")} scope="col">
                  Name
                </th>
                <th className={cn(TABLE_HEAD_CELL, "min-w-0 max-w-[11rem]")} scope="col">
                  Stock
                </th>
                <th className={cn(TABLE_HEAD_CELL, "whitespace-nowrap")} scope="col">
                  Bought
                </th>
                <th className={cn(TABLE_HEAD_CELL, "whitespace-nowrap")} scope="col">
                  Expire
                </th>
                <th className={cn(TABLE_HEAD_CELL, "whitespace-nowrap")} scope="col">
                  Trigger low
                </th>
                <th className={cn(TABLE_HEAD_CELL, "min-w-[11rem] max-w-[min(22rem,32vw)]")} scope="col">
                  Notes
                </th>
              </tr>
            </thead>
            {groups.map(({ label, items: groupItems }) => (
              <tbody key={label}>
                <tr className="border-t border-[#ededed] bg-[#f0f4f6]">
                  <td
                    className="break-words px-3 py-2 text-[13px] font-semibold tracking-tight text-[#637381]"
                    colSpan={7}
                  >
                    {label}
                  </td>
                </tr>
                {groupItems.map((item) => {
                  const exp = effectiveBestByDate(item);
                  return (
                    <tr
                      className="motion-row border-t border-[#ededed] bg-white hover:bg-[#fafafa]"
                      key={item.id}
                    >
                      <td className="w-16 shrink-0 px-3 py-2 align-middle">
                        <PantryItemThumb
                          dark={false}
                          item={item}
                          size="table"
                          onClick={
                            onRequestImageEdit
                              ? () => onRequestImageEdit(item.id)
                              : undefined
                          }
                        />
                      </td>
                      <td className="min-w-0 max-w-[14rem] px-3 py-2 align-middle font-medium text-[#1f1f1f]">
                        <span className="break-words" title={item.name}>
                          {item.name}
                        </span>
                      </td>
                      <td className="min-w-0 max-w-[11rem] px-3 py-2 align-middle">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <QuantityQuickAdjust
                            density="compact"
                            item={item}
                            onAdjust={adjustItemQuantity}
                          />
                          <Select
                            className={cn(LIGHT_FIELD_SMARTHR, "min-h-9 w-[4.5rem] shrink-0 text-[12px]")}
                            value={item.unit ?? ""}
                            onChange={(event) => updateItem(item.id, { unit: event.target.value })}
                          >
                            <option value="">—</option>
                            {selectOptionsWithCurrent(lists.units, item.unit).map((unit) => (
                              <option key={unit} value={unit}>
                                {unit}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 align-middle text-[13px] text-[#575757]">
                        {item.purchaseDate ? formatShortDate(item.purchaseDate) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 align-middle text-[13px] text-[#575757]">
                        {exp ? formatShortDate(exp) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 align-middle text-[13px] text-[#575757]">
                        {item.minQuantity?.trim() || "—"}
                      </td>
                      <td className="min-w-[11rem] max-w-[min(22rem,32vw)] px-3 py-2 align-middle text-left text-[13px] text-[#575757]">
                        <span
                          className="line-clamp-3 break-words [overflow-wrap:anywhere]"
                          title={item.notes?.trim() || undefined}
                        >
                          {item.notes?.trim() || "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            ))}
          </table>
        </WorkspaceTableWrap>
      </div>
    </>
  );

  if (embedded) {
    if (items.length === 0) {
      return null;
    }
    return tableBody;
  }

  return (
    <WorkspacePanel
      className={PANTRY_SMARTHR_PANEL}
      eyebrow="Shelf layout"
      title="Pantry shelf table"
    >
      {tableBody}
      {items.length === 0 ? (
        <EmptyStatePanel
          text="Add a staple or scan a label to start tracking what you keep at home."
          title="No inventory yet"
        />
      ) : null}
    </WorkspacePanel>
  );
}

function InventoryCard({
  item,
  updateItem,
  adjustItemQuantity,
  addInventoryItemToShopping,
  applyProductLookupToInventory,
  onConsumeInventory,
  familyMembers,
  selectLists,
  deepLinkOrigin,
  highlight,
  onOpenQrLabel,
  onAddRecipeIdea,
  onAddMissingIngredientsToShopping,
  pantryNamesForRecipes = [],
  archivedPresentation = false,
  tone = "light",
  allPantryItems,
  pantryImageEditRequestId,
  onClearPantryImageEditRequest,
}: {
  item: PantryItem;
  updateItem: (id: string, updates: Partial<PantryItem>) => void;
  adjustItemQuantity: (item: PantryItem, delta: number) => void;
  addInventoryItemToShopping: (item: PantryItem) => void;
  applyProductLookupToInventory: (
    item: PantryItem,
    product: NormalizedProductLookup,
  ) => void;
  onConsumeInventory?: (item: PantryItem, payload: InventoryConsumePayload) => void;
  familyMembers?: FamilyMember[];
  selectLists: PantryItemSelectLists;
  deepLinkOrigin?: string;
  highlight?: boolean;
  onOpenQrLabel?: () => void;
  onAddRecipeIdea?: (idea: RecipeIdea) => void;
  onAddMissingIngredientsToShopping?: (ingredientLabels: string[]) => void;
  pantryNamesForRecipes?: string[];
  archivedPresentation?: boolean;
  tone?: ModuleWorkspaceTone;
  allPantryItems: PantryItem[];
  /** When this matches `item.id`, details open and the Image section is scrolled into view. */
  pantryImageEditRequestId?: string | null;
  onClearPantryImageEditRequest?: () => void;
}) {
  const lists = defaultSelectLists(selectLists);
  const presentation = getInventoryStatusColor(item);
  const dark = tone === "premiumDark";
  const datalistId = useId();
  const imageSectionRef = useRef<HTMLDivElement>(null);
  const [copiedKind, setCopiedKind] = useState<null | "item" | "spot">(null);
  const [detailsOpen, setDetailsOpen] = useState(archivedPresentation);
  const [consumeAmt, setConsumeAmt] = useState("1");
  const [consumeFinished, setConsumeFinished] = useState(false);
  const [consumeMemberId, setConsumeMemberId] = useState("");
  const [consumeMarkLow, setConsumeMarkLow] = useState(false);
  const [confirmPartialEmpty, setConfirmPartialEmpty] = useState(false);
  const [recipeIdeasModalOpen, setRecipeIdeasModalOpen] = useState(false);
  const [stockNotesModalOpen, setStockNotesModalOpen] = useState(false);
  const [stockRecipeModalOpen, setStockRecipeModalOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [recipeDraft, setRecipeDraft] = useState("");

  const typeBrandSuggestions = useMemo(
    () => buildPantryTypeBrandSuggestions(item, allPantryItems),
    [item, allPantryItems],
  );
  const usedByOptions = useMemo(
    () =>
      familyMembers?.length
        ? membersForAssignmentSelect(familyMembers, item.lastConsumptionMemberId)
        : [],
    [familyMembers, item.lastConsumptionMemberId],
  );

  function openImageEditorFromThumb() {
    setDetailsOpen(true);
    window.requestAnimationFrame(() => {
      imageSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  useEffect(() => {
    if (!pantryImageEditRequestId || pantryImageEditRequestId !== item.id) {
      return;
    }
    setDetailsOpen(true);
    window.requestAnimationFrame(() => {
      imageSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      onClearPantryImageEditRequest?.();
    });
  }, [pantryImageEditRequestId, item.id, onClearPantryImageEditRequest]);

  async function copyDeepLink(kind: "item" | "spot") {
    if (!deepLinkOrigin) {
      return;
    }
    const url =
      kind === "item"
        ? buildInventoryItemDeepLink(deepLinkOrigin, item.id)
        : locationDeepLinkFromPantryItem(deepLinkOrigin, item);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKind(kind);
      window.setTimeout(() => setCopiedKind(null), 2000);
    } catch {
      setCopiedKind(null);
    }
  }

  return (
    <div
      className={cn(
        "rounded-[8px] border p-4 shadow-[0_1px_1px_rgba(0,0,0,0.06)] ring-1",
        highlight
          ? "border-blue-400 ring-2 ring-blue-200/80"
          : cn(presentation.borderClass, presentation.ringClass),
        dark && !highlight && "border-white/10 bg-[#141c28] shadow-black/20",
        !dark && !highlight && "bg-white",
      )}
      id={`inventory-card-${item.id}`}
    >
      {archivedPresentation ? (
        <div className="mb-3 rounded-lg border border-slate-200 bg-slate-100/90 px-3 py-2 text-sm text-slate-800">
          <span className="font-semibold text-slate-950">Archived</span>
          <span className="text-slate-600">
            {" "}
            — hidden from on-hand views. Restore when you stock this again.
          </span>
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <PantryItemThumb
            dark={dark}
            item={item}
            title="Edit image"
            onClick={openImageEditorFromThumb}
          />
          <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
            {getInventoryLocationLabel(item)}
          </p>
          <h3
            className={cn(
              "mt-1 text-lg font-semibold",
              dark ? "text-slate-50" : "text-slate-950",
            )}
          >
            {item.name}
          </h3>
          <p
            className={cn(
              "mt-1 inline-flex rounded-md px-2 py-0.5 text-xs font-semibold",
              presentation.chipBgClass,
              presentation.chipTextClass,
            )}
          >
            {getInventoryStatusLabel(item)}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {item.quantity}
            {item.unit ? ` ${item.unit}` : ""} ·{" "}
            {item.category?.trim() ? item.category : "—"}
          </p>
          {item.brand?.trim() ? (
            <p className="mt-0.5 text-xs text-slate-500">{item.brand}</p>
          ) : null}
          {item.barcode?.trim() ? (
            <p className="mt-1 font-mono text-[0.65rem] text-slate-500" title="Barcode">
              {item.barcode}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.notes?.trim() ? (
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold",
                  dark
                    ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100"
                    : "border-emerald-200 bg-emerald-50 text-emerald-900",
                )}
              >
                Note added
              </span>
            ) : null}
            {item.lastConsumptionRecipeNote?.trim() ? (
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold",
                  dark
                    ? "border-violet-400/30 bg-violet-500/15 text-violet-100"
                    : "border-violet-200 bg-violet-50 text-violet-900",
                )}
              >
                Recipe added
              </span>
            ) : null}
          </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {item.isStaple ? <Badge tone="blue">Staple</Badge> : null}
          {isInventoryLowStock(item) ? <Badge tone="amber">Low stock</Badge> : null}
          {isInventoryExpiringSoon(item) ? <Badge tone="red">Expiring</Badge> : null}
          {isInventoryOverstock(item) ? (
            <Badge tone="purple">Too much · use up</Badge>
          ) : null}
          {isUseSoonCandidate(item) ? <Badge tone="amber">Use soon</Badge> : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {onConsumeInventory ? (
          <>
            <button
              type="button"
              className={cn(
                "rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold transition",
                dark
                  ? "border-amber-400/35 bg-amber-500/12 text-amber-100 hover:bg-amber-500/20"
                  : "border-amber-200 bg-amber-50 text-amber-950",
              )}
              onClick={() => updateItem(item.id, { status: "Low" })}
            >
              Almost out
            </button>
            <button
              type="button"
              className={cn(
                "rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold transition",
                dark
                  ? "border-rose-400/35 bg-rose-500/12 text-rose-100 hover:bg-rose-500/20"
                  : "border-rose-200 bg-rose-50 text-rose-950",
              )}
              onClick={() => {
                if (!window.confirm(`Mark “${item.name}” out of stock?`)) {
                  return;
                }
                updateItem(item.id, { quantity: "0", status: "Out" });
              }}
            >
              Out
            </button>
            <button
              type="button"
              className={cn(
                "rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold transition",
                dark
                  ? "border-[#FF6F28]/35 bg-[#F26522]/12 text-orange-100 hover:bg-[#F26522]/20"
                  : "border-[#fed7aa] bg-orange-50 text-orange-950",
              )}
              onClick={() => adjustItemQuantity(item, 1)}
            >
              Add quantity
            </button>
          </>
        ) : null}
      </div>

      {onConsumeInventory ? (
        <div
          className={cn(
            "mt-4 space-y-4 rounded-[8px] border p-4",
            dark ? "border-white/10 bg-black/25" : "border-[#ededed] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.06)]",
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Update Stock
              </p>
              <p
                className={cn(
                  "mt-1 text-lg font-semibold",
                  dark ? "text-slate-50" : "text-slate-950",
                )}
              >
                {item.name}
              </p>
            </div>
            <details className="relative min-w-0">
              <summary
                className={cn(
                  "flex cursor-pointer list-none items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold",
                  dark
                    ? "border-white/12 bg-white/[0.06] text-slate-200"
                    : "border-slate-200 bg-white text-slate-800",
                )}
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden />
                More
              </summary>
              <div
                className={cn(
                  "absolute right-0 z-10 mt-1 min-w-[11rem] space-y-1 rounded-lg border p-2 shadow-xl",
                  dark ? "border-white/10 bg-[#141c28]" : "border-slate-200 bg-white",
                )}
              >
                <button
                  type="button"
                  className={cn(
                    "flex w-full rounded-md px-2 py-1.5 text-left text-xs font-medium",
                    dark ? "text-slate-200 hover:bg-white/[0.06]" : "text-slate-800 hover:bg-slate-50",
                  )}
                  onClick={() => addInventoryItemToShopping(item)}
                >
                  Add to shopping
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex w-full rounded-md px-2 py-1.5 text-left text-xs font-medium",
                    dark ? "text-slate-200 hover:bg-white/[0.06]" : "text-slate-800 hover:bg-slate-50",
                  )}
                  onClick={() => setDetailsOpen((o) => !o)}
                >
                  {detailsOpen ? "Hide item details" : "Item details"}
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex w-full rounded-md px-2 py-1.5 text-left text-xs font-medium",
                    dark ? "text-slate-200 hover:bg-white/[0.06]" : "text-slate-800 hover:bg-slate-50",
                  )}
                  onClick={() => {
                    if (!window.confirm(`Mark “${item.name}” out of stock?`)) {
                      return;
                    }
                    updateItem(item.id, { quantity: "0", status: "Out" });
                  }}
                >
                  Mark out
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex w-full rounded-md px-2 py-1.5 text-left text-xs font-medium",
                    dark ? "text-slate-200 hover:bg-white/[0.06]" : "text-slate-800 hover:bg-slate-50",
                  )}
                  onClick={() => {
                    if (!window.confirm(`Clear stock for “${item.name}” (quantity to zero)?`)) {
                      return;
                    }
                    updateItem(item.id, { quantity: "0", status: "Out" });
                  }}
                >
                  Clear stock
                </button>
                {onOpenQrLabel ? (
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium",
                      dark ? "text-slate-200 hover:bg-white/[0.06]" : "text-slate-800 hover:bg-slate-50",
                    )}
                    onClick={onOpenQrLabel}
                  >
                    <QrCode className="h-4 w-4 shrink-0" aria-hidden />
                    QR label
                  </button>
                ) : null}
                {archivedPresentation ? (
                  <button
                    type="button"
                    className={cn(
                      "flex w-full rounded-md px-2 py-1.5 text-left text-xs font-medium",
                      dark ? "text-orange-200 hover:bg-white/[0.06]" : "text-orange-900 hover:bg-orange-50",
                    )}
                    onClick={() => updateItem(item.id, { inactiveInInventory: false })}
                  >
                    Restore item
                  </button>
                ) : (
                  <button
                    type="button"
                    className={cn(
                      "flex w-full rounded-md px-2 py-1.5 text-left text-xs font-medium",
                      dark ? "text-slate-300 hover:bg-white/[0.06]" : "text-slate-600 hover:bg-slate-50",
                    )}
                    onClick={() => {
                      if (
                        !window.confirm(
                          `Archive “${item.name}”? It will move out of the main inventory list.`,
                        )
                      ) {
                        return;
                      }
                      updateItem(item.id, { inactiveInInventory: true });
                    }}
                  >
                    Archive
                  </button>
                )}
              </div>
            </details>
          </div>

          <label className="block text-xs font-medium text-slate-400">
            Type / Brand
            <Input
              aria-label="Type or brand"
              className={cn(
                "mt-1",
                dark
                  ? "border-white/12 bg-[#0a0f14] text-slate-100 placeholder:text-slate-500 focus:border-[#FE9F43]/50 focus:ring-[#FE9F43]/25"
                  : LIGHT_FIELD_SMARTHR,
              )}
              list={datalistId}
              value={item.brand ?? ""}
              onChange={(e) => updateItem(item.id, { brand: e.target.value })}
              placeholder="Search or type…"
            />
            <datalist id={datalistId}>
              {typeBrandSuggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>

          <label
            className={cn(
              "flex items-start gap-2 text-sm font-medium",
              dark ? "text-slate-100" : "text-[#1f1f1f]",
            )}
          >
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-[#F26522]"
              checked={consumeFinished}
              onChange={(e) => {
                setConsumeFinished(e.target.checked);
                if (e.target.checked) {
                  setConsumeMarkLow(false);
                }
              }}
            />
            <span>Mark as finished / empty (sets quantity to out)</span>
          </label>

          <label className="block text-xs font-medium text-slate-400">
            Amount used
            <Input
              className={cn(
                "mt-1 max-w-[12rem]",
                dark
                  ? "border-white/12 bg-[#0a0f14] text-slate-100 focus:border-[#FE9F43]/50 focus:ring-[#FE9F43]/25"
                  : LIGHT_FIELD_SMARTHR,
              )}
              disabled={consumeFinished}
              inputMode="decimal"
              value={consumeAmt}
              onChange={(e) => setConsumeAmt(e.target.value)}
            />
          </label>

          {usedByOptions.length > 0 ? (
            <label className="block text-xs font-medium text-slate-400">
              Used by (optional)
              <Select
                className={cn(
                  "mt-1",
                  dark
                    ? "border-white/12 bg-[#0a0f14] text-slate-100 focus:border-[#FE9F43]/50 focus:ring-[#FE9F43]/25"
                    : LIGHT_FIELD_SMARTHR,
                )}
                value={consumeMemberId}
                onChange={(e) => setConsumeMemberId(e.target.value)}
              >
                <option value="">—</option>
                {usedByOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {getMemberFullName(m)}
                  </option>
                ))}
              </Select>
            </label>
          ) : null}

          <label
            className={cn(
              "flex items-start gap-2 text-sm font-medium",
              dark ? "text-slate-100" : "text-[#1f1f1f]",
            )}
          >
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-amber-500"
              checked={consumeMarkLow}
              disabled={consumeFinished}
              onChange={(e) => setConsumeMarkLow(e.target.checked)}
            />
            <span>Mark as low after this use</span>
          </label>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              className={cn(
                "min-h-10 gap-2 text-xs",
                dark && "border-white/12 bg-white/[0.06] text-slate-100 hover:bg-white/10",
              )}
              onClick={() => {
                setNotesDraft(item.notes ?? "");
                setStockNotesModalOpen(true);
              }}
            >
              <StickyNote className="h-3.5 w-3.5" aria-hidden />
              Notes
            </Button>
            <Button
              type="button"
              variant="secondary"
              className={cn(
                "min-h-10 gap-2 text-xs",
                dark && "border-white/12 bg-white/[0.06] text-slate-100 hover:bg-white/10",
              )}
              onClick={() => {
                setRecipeDraft(item.lastConsumptionRecipeNote ?? "");
                setStockRecipeModalOpen(true);
              }}
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden />
              Recipe
            </Button>
          </div>

          {(() => {
            const payloadTry: InventoryConsumePayload = {
              amountUsed: consumeFinished ? 0 : Number.parseFloat(consumeAmt),
              markFinished: consumeFinished,
              memberId: consumeMemberId || undefined,
              recipeNote: item.lastConsumptionRecipeNote?.trim() || undefined,
              note: item.notes?.trim() || undefined,
              markLow: consumeMarkLow,
              confirmZeroPartialUse: confirmPartialEmpty,
            };
            const needsPartial =
              !consumeFinished &&
              consumeNeedsPartialZeroConfirm(item, {
                ...payloadTry,
                confirmZeroPartialUse: false,
              });
            return needsPartial ? (
              <div
                className={cn(
                  "rounded-lg border p-2 text-xs",
                  dark
                    ? "border-amber-400/30 bg-amber-500/15 text-amber-50"
                    : "border-amber-200 bg-amber-50 text-amber-950",
                )}
              >
                <label className="flex items-start gap-2 font-medium">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 accent-amber-500"
                    checked={confirmPartialEmpty}
                    onChange={(e) => setConfirmPartialEmpty(e.target.checked)}
                  />
                  This looks like it empties a partial-use container — confirm before updating stock.
                </label>
              </div>
            ) : null;
          })()}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              variant="primary"
              className={cn(
                "min-h-12 flex-1 text-base font-semibold",
                !dark && BTN_PRIMARY_ORANGE,
              )}
              onClick={() => {
                const payload: InventoryConsumePayload = {
                  amountUsed: consumeFinished ? 0 : Number.parseFloat(consumeAmt),
                  markFinished: consumeFinished,
                  memberId: consumeMemberId || undefined,
                  recipeNote: item.lastConsumptionRecipeNote?.trim() || undefined,
                  note: item.notes?.trim() || undefined,
                  markLow: consumeMarkLow,
                  confirmZeroPartialUse: confirmPartialEmpty,
                };
                if (!consumeFinished && (!Number.isFinite(payload.amountUsed) || payload.amountUsed <= 0)) {
                  return;
                }
                if (
                  consumeNeedsPartialZeroConfirm(item, {
                    ...payload,
                    confirmZeroPartialUse: false,
                  }) &&
                  !confirmPartialEmpty
                ) {
                  return;
                }
                onConsumeInventory(item, payload);
                setConsumeAmt("1");
                setConsumeFinished(false);
                setConsumeMemberId("");
                setConsumeMarkLow(false);
                setConfirmPartialEmpty(false);
              }}
            >
              Update Stock
            </Button>
            <Button
              type="button"
              variant="secondary"
              className={cn(
                "min-h-12 px-5",
                dark && "border-white/12 bg-transparent text-slate-200 hover:bg-white/[0.06]",
              )}
              onClick={() => {
                setConsumeAmt("1");
                setConsumeFinished(false);
                setConsumeMemberId("");
                setConsumeMarkLow(false);
                setConfirmPartialEmpty(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {stockNotesModalOpen ? (
        <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/55 p-3 backdrop-blur-sm sm:items-center">
          <div
            className={cn(
              "w-full max-w-md rounded-[8px] border p-4 shadow-2xl",
              dark ? "border-white/10 bg-[#141c28]" : "border-[#ededed] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className={cn("text-lg font-semibold", dark ? "text-slate-50" : "text-[#1f1f1f]")}>
                Notes
              </h3>
              <button
                type="button"
                aria-label="Close"
                className={cn(
                  "rounded-lg p-2",
                  dark
                    ? "text-slate-400 hover:bg-white/[0.06] hover:text-slate-100"
                    : "text-[#575757] hover:bg-slate-100",
                )}
                onClick={() => setStockNotesModalOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Textarea
              className={cn(
                "mt-3",
                dark
                  ? "border-white/12 bg-[#0a0f14] text-slate-100 placeholder:text-slate-500"
                  : "border-[#ededed] bg-white text-[#1f1f1f] placeholder:text-[#8e8e8e]",
              )}
              placeholder="Add a note for this item."
              rows={5}
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="primary"
                className="min-h-11 flex-1"
                onClick={() => {
                  updateItem(item.id, { notes: notesDraft.trim() });
                  setStockNotesModalOpen(false);
                }}
              >
                Save Note
              </Button>
              <Button
                type="button"
                variant="secondary"
                className={cn(
                  "min-h-11",
                  dark && "border-white/12 bg-white/[0.06] text-slate-100",
                )}
                onClick={() => setStockNotesModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {stockRecipeModalOpen ? (
        <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/55 p-3 backdrop-blur-sm sm:items-center">
          <div
            className={cn(
              "w-full max-w-md rounded-[8px] border p-4 shadow-2xl",
              dark ? "border-white/10 bg-[#141c28]" : "border-[#ededed] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className={cn("text-lg font-semibold", dark ? "text-slate-50" : "text-[#1f1f1f]")}>
                Recipe
              </h3>
              <button
                type="button"
                aria-label="Close"
                className={cn(
                  "rounded-lg p-2",
                  dark
                    ? "text-slate-400 hover:bg-white/[0.06] hover:text-slate-100"
                    : "text-[#575757] hover:bg-slate-100",
                )}
                onClick={() => setStockRecipeModalOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Textarea
              className={cn(
                "mt-3",
                dark
                  ? "border-white/12 bg-[#0a0f14] text-slate-100 placeholder:text-slate-500"
                  : "border-[#ededed] bg-white text-[#1f1f1f] placeholder:text-[#8e8e8e]",
              )}
              placeholder="Add recipe or meal idea."
              rows={5}
              value={recipeDraft}
              onChange={(e) => setRecipeDraft(e.target.value)}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="primary"
                className="min-h-11 flex-1"
                onClick={() => {
                  updateItem(item.id, {
                    lastConsumptionRecipeNote: recipeDraft.trim() || undefined,
                  });
                  setStockRecipeModalOpen(false);
                }}
              >
                Save Recipe
              </Button>
              <Button
                type="button"
                variant="secondary"
                className={cn(
                  "min-h-11",
                  dark && "border-white/12 bg-white/[0.06] text-slate-100",
                )}
                onClick={() => setStockRecipeModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {detailsOpen ? (
      <>
        <PantryItemImageEditorBlock
          dark={dark}
          imageSectionRef={imageSectionRef}
          item={item}
          updateItem={updateItem}
        />
      <div className="grid gap-3 sm:grid-cols-2">
        <div
          className={cn(
            "sm:col-span-2 border-b pb-2 pt-1",
            dark ? "border-white/10" : "border-slate-200",
          )}
        >
          <p
            className={cn(
              "text-[0.65rem] font-semibold uppercase tracking-[0.14em]",
              dark ? "text-slate-500" : "text-slate-500",
            )}
          >
            Product
          </p>
        </div>
        <InventoryField label="Item name">
          <Input
            value={item.name}
            onChange={(event) => updateItem(item.id, { name: event.target.value })}
          />
        </InventoryField>
        <InventoryField label="Brand">
          <Input
            value={item.brand ?? ""}
            onChange={(event) => updateItem(item.id, { brand: event.target.value })}
          />
        </InventoryField>
        <InventoryField label="Type / category">
          <Select
            value={item.category ?? ""}
            onChange={(event) =>
              updateItem(item.id, { category: event.target.value })
            }
          >
            {selectOptionsWithCurrent(lists.categories, item.category ?? "").map(
              (category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ),
            )}
          </Select>
        </InventoryField>
        <InventoryField label="Barcode">
          <Input
            value={item.barcode ?? ""}
            onChange={(event) =>
              updateItem(item.id, { barcode: event.target.value })
            }
          />
        </InventoryField>
        <div className="sm:col-span-2">
          <Suspense
            fallback={
              <div
                className={cn(
                  "rounded-lg border border-dashed px-3 py-4 text-center text-sm",
                  dark ? "border-white/15 text-slate-500" : "border-slate-200 text-slate-500",
                )}
              >
                Loading product lookup…
              </div>
            }
          >
            <ProductLookupPanelLazy
              applyLabel="Apply Product Info"
              initialBarcode={item.barcode ?? ""}
              variant={dark ? "dark" : "light"}
              onApply={(product) => applyProductLookupToInventory(item, product)}
            />
          </Suspense>
        </div>

        <div className="sm:col-span-2 border-b border-white/10 pb-2 pt-3 dark:border-white/10">
          <p
            className={cn(
              "text-[0.65rem] font-semibold uppercase tracking-[0.14em]",
              dark ? "text-slate-500" : "text-slate-500",
            )}
          >
            Stock
          </p>
        </div>
        <InventoryField label="Quantity">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <QuantityQuickAdjust item={item} onAdjust={adjustItemQuantity} />
            </div>
            <Input
              value={item.quantity}
              onChange={(event) =>
                updateItem(item.id, { quantity: event.target.value })
              }
            />
          </div>
        </InventoryField>
        <InventoryField label="Unit">
          <Select
            value={item.unit ?? ""}
            onChange={(event) => updateItem(item.id, { unit: event.target.value })}
          >
            <option value="">—</option>
            {selectOptionsWithCurrent(lists.units, item.unit).map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </Select>
        </InventoryField>
        <InventoryField label="Stock status">
          <Select
            value={item.status}
            onChange={(event) =>
              updateItem(item.id, {
                status: event.target.value as PantryItem["status"],
              })
            }
          >
            {stockStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </Select>
        </InventoryField>
        <InventoryField label="Best-by / expiry">
          <Input
            type="date"
            value={effectiveBestByDate(item) ?? ""}
            onChange={(event) => {
              const v = event.target.value;
              updateItem(item.id, { bestByDate: v, expiryDate: v });
            }}
          />
        </InventoryField>
        <InventoryField label="Minimum quantity">
          <Input
            value={item.minQuantity ?? ""}
            onChange={(event) =>
              updateItem(item.id, { minQuantity: event.target.value })
            }
          />
        </InventoryField>
        <InventoryField label="Storage area">
          <Select
            value={item.storageArea}
            onChange={(event) => {
              const storageArea = event.target.value as PantryItem["storageArea"];
              updateItem(item.id, getStorageAreaUpdates(item, storageArea));
            }}
          >
            {selectOptionsWithCurrent(lists.storageAreas, item.storageArea).map(
              (location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ),
            )}
          </Select>
        </InventoryField>
        <LocationDetailFields item={item} lists={lists} updateItem={updateItem} />
        <label className="flex min-h-10 items-center gap-3 text-sm font-medium text-slate-400">
          <input
            checked={item.isStaple}
            className="h-5 w-5 accent-blue-500"
            onChange={(event) =>
              updateItem(item.id, { isStaple: event.target.checked })
            }
            type="checkbox"
          />
          Staple item
        </label>
        <label className="flex min-h-10 items-center gap-3 text-sm font-medium text-slate-400">
          <input
            checked={Boolean(item.useSoonMarked)}
            className="h-5 w-5 accent-amber-500"
            onChange={(event) =>
              updateItem(item.id, { useSoonMarked: event.target.checked })
            }
            type="checkbox"
          />
          Mark use soon
        </label>

        <div
          className={cn(
            "sm:col-span-2 border-b pb-2 pt-3",
            dark ? "border-white/10" : "border-slate-200",
          )}
        >
          <p
            className={cn(
              "text-[0.65rem] font-semibold uppercase tracking-[0.14em]",
              dark ? "text-slate-500" : "text-slate-500",
            )}
          >
            Notes
          </p>
        </div>
        <InventoryField label="Tags">
          <Input
            value={item.tags.join(", ")}
            onChange={(event) =>
              updateItem(item.id, {
                tags: event.target.value
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              })
            }
          />
        </InventoryField>
        <div className="sm:col-span-2">
          <InventoryField label="Notes">
            <Textarea
              rows={4}
              value={item.notes ?? ""}
              placeholder="Household notes (optional)"
              onChange={(event) =>
                updateItem(item.id, { notes: event.target.value })
              }
              className={
                dark ? "border-white/12 bg-[#060a0f] text-slate-100 placeholder:text-slate-600" : ""
              }
            />
          </InventoryField>
        </div>
        <div
          className={cn(
            "sm:col-span-2 space-y-3 rounded-[8px] border border-[#ededed] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.06)]",
            dark && "border-white/10 bg-[#0a1018] shadow-black/20",
          )}
        >
          <p
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.12em]",
              dark ? "text-slate-500" : "text-[#637381]",
            )}
          >
            Product description
          </p>
          <InventoryField label="Details from packaging or lookup">
            <Textarea
              rows={4}
              value={item.productDescription ?? ""}
              placeholder="Ingredients, serving notes, or details from packaging."
              onChange={(event) =>
                updateItem(item.id, {
                  productDescription: event.target.value || undefined,
                })
              }
              className={
                dark ? "border-white/12 bg-[#060a0f] text-slate-100 placeholder:text-slate-600" : LIGHT_FIELD_SMARTHR
              }
            />
          </InventoryField>
        </div>
      </div>
      {deepLinkOrigin ? (
        <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:flex-wrap">
          <Button
            className="justify-center gap-2 sm:min-h-10"
            onClick={() => void copyDeepLink("item")}
            type="button"
            variant="ghost"
          >
            <QrCode className="h-4 w-4" aria-hidden />
            {copiedKind === "item" ? "Item link copied" : "Copy item QR URL"}
          </Button>
          {onOpenQrLabel ? (
            <Button
              className="justify-center gap-2 sm:min-h-10"
              onClick={onOpenQrLabel}
              type="button"
              variant="ghost"
            >
              <QrCode className="h-4 w-4" aria-hidden />
              QR label
            </Button>
          ) : null}
          <Button
            className="justify-center gap-2 sm:min-h-10"
            onClick={() => void copyDeepLink("spot")}
            type="button"
            variant="ghost"
          >
            <Link2 className="h-4 w-4" aria-hidden />
            {copiedKind === "spot" ? "Spot link copied" : "Copy location QR URL"}
          </Button>
          <p className="w-full text-xs text-slate-500">
            Paste into any QR generator. Item opens this card; location filters inventory to this shelf,
            bin, or zone.
          </p>
        </div>
      ) : null}
      {shouldSuggestRecipeIdeas(item) && onAddRecipeIdea ? (
        <div className="mt-3 border-t border-slate-100 pt-3 dark:border-white/10">
          <Button
            type="button"
            variant="secondary"
            className="min-h-10 w-full text-sm sm:w-auto"
            onClick={() => setRecipeIdeasModalOpen(true)}
          >
            Recipe ideas
          </Button>
        </div>
      ) : null}
      </>
      ) : null}
      {onAddRecipeIdea ? (
        <RecipeUseUpModal
          open={recipeIdeasModalOpen}
          itemName={item.name}
          pantryItemNames={pantryNamesForRecipes}
          inventoryStatusNote={getInventoryStatusLabel(item)}
          onAddRecipeIdea={(idea) => {
            onAddRecipeIdea(idea);
            setRecipeIdeasModalOpen(false);
          }}
          onAddMissingIngredientsToShopping={onAddMissingIngredientsToShopping}
          onClose={() => setRecipeIdeasModalOpen(false)}
        />
      ) : null}
      <p className="text-xs text-slate-400">
        Expires: {formatShortDate(item.expiryDate)} · Updated:{" "}
        {formatShortDate(item.lastUpdated)}
      </p>
    </div>
  );
}

function LocationDetailFields({
  item,
  updateItem,
  lists,
}: {
  item: PantryItem;
  updateItem: (id: string, updates: Partial<PantryItem>) => void;
  lists: PantryItemSelectLists;
}) {
  if (item.storageArea === "Pantry") {
    const wallValue = item.pantryWall ?? item.wall ?? "";
    const shelfValue = item.pantryShelf ?? item.shelf ?? "";
    return (
      <>
        <InventoryField label="Pantry wall">
          <Select
            value={wallValue}
            onChange={(event) =>
              updateItem(item.id, {
                pantryWall: event.target.value as PantryItem["pantryWall"],
                wall: event.target.value as PantryItem["wall"],
              })
            }
          >
            {selectOptionsWithCurrent(lists.pantryWalls, wallValue).map((wall) => (
              <option key={wall} value={wall}>
                {wall}
              </option>
            ))}
          </Select>
        </InventoryField>
        <InventoryField label="Pantry shelf">
          <Select
            value={shelfValue}
            onChange={(event) =>
              updateItem(item.id, {
                pantryShelf: event.target.value as PantryItem["pantryShelf"],
                shelf: event.target.value as PantryItem["shelf"],
              })
            }
          >
            {selectOptionsWithCurrent(lists.pantryShelves, shelfValue).map(
              (shelf) => (
                <option key={shelf} value={shelf}>
                  {shelf}
                </option>
              ),
            )}
          </Select>
        </InventoryField>
        <InventoryField label="Custom pantry note">
          <Input
            placeholder="Back corner, overflow bin, etc."
            value={item.pantryLocationNote ?? ""}
            onChange={(event) =>
              updateItem(item.id, { pantryLocationNote: event.target.value })
            }
          />
        </InventoryField>
      </>
    );
  }

  if (isKitchenStorage(item.storageArea)) {
    const kitchenDetail =
      item.kitchenLocationDetail || item.locationDetail || "";
    return (
      <>
        <InventoryField label="Kitchen location">
          <Select
            value={kitchenDetail}
            onChange={(event) =>
              updateItem(item.id, {
                kitchenLocationDetail: event.target.value,
                locationDetail: event.target.value,
              })
            }
          >
            <option value="">No detail</option>
            {selectOptionsWithCurrent(
              lists.kitchenLocationDetails,
              kitchenDetail,
            ).map((detail) => (
              <option key={detail} value={detail}>
                {detail}
              </option>
            ))}
          </Select>
        </InventoryField>
        <InventoryField label="Custom kitchen detail">
          <Input
            placeholder="Baking cabinet, snack drawer, etc."
            value={item.customLocationName ?? ""}
            onChange={(event) =>
              updateItem(item.id, { customLocationName: event.target.value })
            }
          />
        </InventoryField>
      </>
    );
  }

  if (isColdStorage(item.storageArea)) {
    const coldDetail = item.coldLocationDetail || item.locationDetail || "";
    return (
      <>
        <InventoryField label="Fridge/freezer location">
          <Select
            value={coldDetail}
            onChange={(event) =>
              updateItem(item.id, {
                coldLocationDetail: event.target.value,
                locationDetail: event.target.value,
              })
            }
          >
            <option value="">No detail</option>
            {selectOptionsWithCurrent(lists.coldLocationDetails, coldDetail).map(
              (detail) => (
                <option key={detail} value={detail}>
                  {detail}
                </option>
              ),
            )}
          </Select>
        </InventoryField>
        <InventoryField label="Custom cold detail">
          <Input
            placeholder="Left bin, meat drawer, garage basket, etc."
            value={item.customLocationName ?? ""}
            onChange={(event) =>
              updateItem(item.id, { customLocationName: event.target.value })
            }
          />
        </InventoryField>
      </>
    );
  }

  return (
    <InventoryField label="Custom location name">
      <Input
        placeholder="Garage shelf, hallway closet, etc."
        value={item.customLocationName ?? ""}
        onChange={(event) =>
          updateItem(item.id, { customLocationName: event.target.value })
        }
      />
    </InventoryField>
  );
}

function QuantityQuickAdjust({
  item,
  onAdjust,
  density = "default",
}: {
  item: PantryItem;
  onAdjust: (item: PantryItem, delta: number) => void;
  /** Tighter control for pantry shelf table (Surface / dense layouts). */
  density?: "default" | "compact";
}) {
  const parsedQuantity = parseQuantity(item.quantity);
  const canAdjust = parsedQuantity !== undefined;
  const compact = density === "compact";

  return (
    <div
      className={cn(
        "flex items-center overflow-hidden rounded-md border bg-white",
        compact
          ? "min-w-0 max-w-full border-[#ededed] shadow-[0_1px_1px_rgba(0,0,0,0.06)]"
          : "min-w-[150px] border-slate-200",
      )}
    >
      <button
        aria-label={`Decrease ${item.name} quantity`}
        className={cn(
          "font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35",
          compact ? "min-h-11 min-w-11 px-0 text-base" : "min-h-11 px-3 text-sm",
        )}
        disabled={!canAdjust || parsedQuantity <= 0}
        onClick={() => onAdjust(item, -1)}
        type="button"
      >
        -
      </button>
      <div
        className={cn(
          "min-w-0 flex-1 border-x text-center",
          compact ? "border-[#ededed] px-2 py-1.5" : "border-slate-200 px-3 py-2",
        )}
      >
        <p className={cn("truncate font-semibold text-slate-900", compact ? "text-xs" : "text-sm")}>
          {item.quantity || "0"}
          {item.unit ? ` ${item.unit}` : ""}
        </p>
        {!canAdjust ? (
          <p
            className={cn(
              "uppercase tracking-[0.14em] text-amber-600/90",
              compact ? "mt-0.5 text-[0.6rem]" : "mt-0.5 text-[0.65rem] text-amber-300/80",
            )}
          >
            manual
          </p>
        ) : null}
      </div>
      <button
        aria-label={`Increase ${item.name} quantity`}
        className={cn(
          "font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35",
          compact ? "min-h-11 min-w-11 px-0 text-base" : "min-h-11 px-3 text-sm",
        )}
        disabled={!canAdjust}
        onClick={() => onAdjust(item, 1)}
        type="button"
      >
        +
      </button>
    </div>
  );
}

function PantryBreakdown({
  items,
  walls = [...pantryWalls],
  shelves = [...pantryShelves],
}: {
  items: PantryItem[];
  walls?: string[];
  shelves?: string[];
}) {
  if (items.length === 0) {
    return <p className="mt-3 text-sm text-slate-400">No pantry items yet.</p>;
  }

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {walls.map((wall) => {
        const wallItems = items.filter((item) => item.pantryWall === wall);
        return (
          <div
            className="motion-card rounded-lg border border-slate-200 bg-white p-3"
            key={wall}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              {wall}
            </p>
            <div className="mt-2 space-y-2">
              {shelves.map((shelf) => {
                const shelfCount = wallItems.filter(
                  (item) => item.pantryShelf === shelf,
                ).length;
                return (
                  <div
                    className="flex items-center justify-between gap-2 text-sm"
                    key={shelf}
                  >
                    <span className="text-slate-400">{shelf}</span>
                    <Badge tone="neutral">{shelfCount}</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AlertList({
  items,
  emptyText,
  tone = "light",
}: {
  items: PantryItem[];
  emptyText: string;
  tone?: ModuleWorkspaceTone;
}) {
  const dark = tone === "premiumDark";
  return (
    <div className="space-y-2">
      {items.slice(0, 5).map((item) => (
        <div
          className={cn(
            "motion-row flex items-center justify-between gap-3 rounded-lg border p-3",
            dark ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-white",
          )}
          key={item.id}
        >
          <div>
            <p className={cn("font-medium", dark ? "text-slate-100" : "text-slate-900")}>
              {item.name}
            </p>
            <p className={cn("text-sm", dark ? "text-slate-500" : "text-slate-400")}>
              {item.quantity}
              {item.unit ? ` ${item.unit}` : ""} · {item.storageArea}
            </p>
          </div>
          <Badge tone={isInventoryLowStock(item) ? "amber" : "neutral"}>
            {isInventoryLowStock(item) ? "low" : formatShortDate(item.expiryDate)}
          </Badge>
        </div>
      ))}
      {items.length === 0 ? <EmptyStatePanel text={emptyText} tone={tone} /> : null}
    </div>
  );
}

function QuickAction({
  title,
  detail,
  icon,
  onClick,
  tone = "light",
}: {
  title: string;
  detail: string;
  icon: ReactNode;
  onClick: () => void;
  tone?: ModuleWorkspaceTone;
}) {
  const dark = tone === "premiumDark";
  return (
    <button
      className={cn(
        "motion-card rounded-lg border p-4 text-left transition",
        dark
          ? "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
          : "border-slate-200 bg-white hover:bg-slate-50",
      )}
      onClick={onClick}
      type="button"
    >
      <div
        className={cn(
          "mb-3 inline-flex border p-2",
          dark ? "border-white/10 bg-white/[0.06] text-slate-100" : "border-slate-200 bg-[#f7f6f3] text-slate-900",
        )}
      >
        {icon}
      </div>
      <h3 className={cn("font-semibold", dark ? "text-slate-50" : "text-slate-950")}>{title}</h3>
      <p className={cn("mt-1 text-sm leading-6", dark ? "text-slate-500" : "text-slate-400")}>
        {detail}
      </p>
    </button>
  );
}

function InventoryField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs uppercase tracking-[0.16em] text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function getStorageAreaUpdates(
  item: PantryItem,
  storageArea: PantryItem["storageArea"],
): Partial<PantryItem> {
  return {
    storageArea,
    location: storageArea,
    pantryWall:
      storageArea === "Pantry" ? item.pantryWall ?? "Wall 1" : undefined,
    pantryShelf:
      storageArea === "Pantry" ? item.pantryShelf ?? "Shelf 1" : undefined,
    wall: storageArea === "Pantry" ? item.pantryWall ?? "Wall 1" : undefined,
    shelf: storageArea === "Pantry" ? item.pantryShelf ?? "Shelf 1" : undefined,
    locationDetail: "",
    customLocationName: "",
    kitchenLocationDetail: "",
    pantryLocationNote: "",
    coldLocationDetail: "",
  };
}

export function InventoryQrLabelsView({
  inventoryItems,
  selectLists,
  deepLinkOrigin,
}: {
  inventoryItems: PantryItem[];
  selectLists?: PantryItemSelectLists;
  deepLinkOrigin?: string;
}) {
  void inventoryItems;
  const origin = deepLinkOrigin || (typeof window !== "undefined" ? window.location.origin : "");
  const lists = defaultSelectLists(selectLists);

  const [storageArea, setStorageArea] = useState<string>(lists.storageAreas[0] ?? "Pantry");
  const [locationDetail, setLocationDetail] = useState<string>("");
  const [pantryWall, setPantryWall] = useState<string>(lists.pantryWalls[0] ?? "Wall 1");
  const [pantryShelf, setPantryShelf] = useState<string>(lists.pantryShelves[0] ?? "Shelf 1");
  const [labelTitle, setLabelTitle] = useState<string>("");
  const [qrTarget, setQrTarget] = useState<QrPreviewTarget | null>(null);

  const common = useMemo(() => {
    const pantry = (wall: string, shelf: string) => ({
      title: `Pantry · ${wall} · ${shelf}`,
      location: { storageArea: "Pantry", pantryWall: wall, pantryShelf: shelf },
    });
    return [
      { title: "Kitchen Fridge", location: { storageArea: "Kitchen Fridge" } },
      { title: "Kitchen Freezer", location: { storageArea: "Kitchen Freezer" } },
      { title: "Kitchen Cabinets", location: { storageArea: "Kitchen Cabinets" } },
      pantry("Wall 1", "Shelf 1"),
      pantry("Wall 1", "Shelf 2"),
      pantry("Wall 1", "Shelf 3"),
      pantry("Wall 1", "Shelf 4"),
      pantry("Wall 1", "Shelf 5"),
      { title: "Laundry Room Fridge", location: { storageArea: "Laundry Room Fridge" } },
      { title: "Laundry Room Freezer", location: { storageArea: "Laundry Room Freezer" } },
      { title: "Family Room Freezer", location: { storageArea: "Family Room Freezer" } },
    ] as const;
  }, []);

  function generateLocation() {
    const loc: InventoryQrLocationFilters = {
      storageArea,
      ...(storageArea === "Pantry" ? { pantryWall, pantryShelf } : {}),
      ...(storageArea !== "Pantry" && locationDetail.trim()
        ? { locationDetail: locationDetail.trim() }
        : {}),
    };
    setQrTarget({ kind: "location", location: loc, title: labelTitle.trim() || undefined });
  }

  return (
    <WorkspacePanel className={PANTRY_SMARTHR_PANEL} title="QR Labels" eyebrow="Print and stick labels">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
              Generate location label
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Storage area
                </span>
                <Select value={storageArea} onChange={(e) => setStorageArea(e.target.value)}>
                  {lists.storageAreas.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Label title (optional)
                </span>
                <Input
                  value={labelTitle}
                  onChange={(e) => setLabelTitle(e.target.value)}
                  placeholder="Example: Pantry Wall 1 Shelf 2"
                />
              </label>
              {storageArea === "Pantry" ? (
                <>
                  <label className="space-y-1">
                    <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      Pantry wall
                    </span>
                    <Select value={pantryWall} onChange={(e) => setPantryWall(e.target.value)}>
                      {lists.pantryWalls.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      Pantry shelf
                    </span>
                    <Select value={pantryShelf} onChange={(e) => setPantryShelf(e.target.value)}>
                      {lists.pantryShelves.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  </label>
                </>
              ) : (
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Location detail (optional)
                  </span>
                  <Input
                    value={locationDetail}
                    onChange={(e) => setLocationDetail(e.target.value)}
                    placeholder="Example: Door · Top shelf · Bin"
                  />
                </label>
              )}
            </div>
            <div className="mt-4">
              <Button onClick={generateLocation} type="button" variant="primary">
                <QrCode className="h-4 w-4" />
                Generate QR label
              </Button>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              QR labels open inventory views in this app. Cross-device inventory requires cloud sync.
              Do not encode private notes or household details in QR codes.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
              Common labels
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {common.map((c) => (
                <button
                  key={c.title}
                  className="min-h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-semibold text-slate-900 hover:bg-slate-100"
                  onClick={() =>
                    setQrTarget({ kind: "location", location: c.location, title: c.title })
                  }
                  type="button"
                >
                  {c.title}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
              Item labels
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Open an inventory card and use <span className="font-semibold">QR label</span> to
              generate a label for that specific item.
            </p>
          </div>
        </div>
      </div>

      {qrTarget && origin ? (
        <Suspense fallback={null}>
          <InventoryQrLabelDrawerLazy
            origin={origin}
            target={qrTarget}
            onClose={() => setQrTarget(null)}
          />
        </Suspense>
      ) : null}
    </WorkspacePanel>
  );
}

export type PantryKioskRow = {
  id: string;
  productName: string;
  category: string;
  quantity: number;
  unit: string;
  store: string;
  storageLocation: string;
  expirationDate: string;
  imageUrl: string | null;
  status: string;
  notes: string;
};

export type PantryKioskPendingChange = {
  id: string;
  productName: string;
  delta: number;
  unit: string;
};

export function PantryKioskShell({
  header,
  categories,
  main,
  detail,
  summary,
}: {
  header?: ReactNode;
  categories?: ReactNode;
  main: ReactNode;
  detail?: ReactNode;
  summary: ReactNode;
}) {
  return (
    <div className="wd-pantry-kiosk">
      {header ? <div className="wd-pantry-kiosk__header">{header}</div> : null}
      <div className="wd-pantry-kiosk__body wd-pantry-kiosk__body--no-sidebar">
        <div className="wd-pantry-kiosk__center">
          {categories ? <div className="wd-pantry-kiosk__categories">{categories}</div> : null}
          <div className="wd-pantry-kiosk__list">{main}</div>
        </div>
        <aside className="wd-pantry-kiosk__summary" aria-label="Inventory summary">
          {summary}
        </aside>
      </div>
      {detail}
    </div>
  );
}

export function PantryKioskCategoryGrid({
  activeCategory,
  onSelectCategory,
}: {
  activeCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}) {
  const allTheme = getGroceryCategoryTheme("");
  const AllIcon = Grid2X2;

  return (
    <nav className="wd-pantry-category-grid" aria-label="Pantry categories">
      <button
        type="button"
        className={
          activeCategory === null
            ? "wd-pantry-category-button wd-pantry-category-button--active"
            : "wd-pantry-category-button"
        }
        style={
          {
            "--wd-pantry-cat-accent": allTheme.accent,
            "--wd-pantry-cat-soft": allTheme.soft,
          } as CSSProperties
        }
        onClick={() => onSelectCategory(null)}
        aria-current={activeCategory === null ? "true" : undefined}
      >
        <span className="wd-pantry-category-button__icon" aria-hidden>
          <AllIcon size={22} strokeWidth={2.1} />
        </span>
        <span className="wd-pantry-category-button__name">All Categories</span>
      </button>
      {PANTRY_VISIBLE_CATEGORY_ORDER.map((category) => {
        const theme = getGroceryCategoryTheme(category);
        const Icon = theme.icon;
        const isActive = activeCategory === category;

        return (
          <button
            key={category}
            type="button"
            className={
              isActive
                ? "wd-pantry-category-button wd-pantry-category-button--active"
                : "wd-pantry-category-button"
            }
            style={
              {
                "--wd-pantry-cat-accent": theme.accent,
                "--wd-pantry-cat-soft": theme.soft,
              } as CSSProperties
            }
            data-category={category}
            onClick={() => onSelectCategory(category)}
            aria-current={isActive ? "true" : undefined}
          >
            <span className="wd-pantry-category-button__icon" aria-hidden>
              <Icon size={22} strokeWidth={2.1} />
            </span>
            <span className="wd-pantry-category-button__name">{category}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function PantryKioskDetailDrawer({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <>
      <button
        type="button"
        className="wd-pantry-category-drawer__scrim"
        onClick={onClose}
        aria-label="Close item detail"
      />
      <aside className="wd-pantry-category-drawer" role="dialog" aria-modal="true" aria-label="Item detail">
        {children}
      </aside>
    </>
  );
}

export function PantryKioskItemRows({
  items,
  selectedId,
  onSelect,
  formatDate,
}: {
  items: PantryKioskRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  formatDate: (iso: string) => string;
}) {
  if (items.length === 0) {
    return (
      <div className="wd-pantry-kiosk__empty" role="status">
        <p className="wd-pantry-kiosk__empty-title">No items in this category</p>
        <p className="wd-pantry-kiosk__empty-hint">Try another shelf or clear your search.</p>
      </div>
    );
  }

  return (
    <ul className="wd-pantry-kiosk__rows wd-pantry-category-items">
      {items.map((item) => {
        const letter = item.productName.trim().charAt(0).toUpperCase() || "?";
        return (
          <li key={item.id}>
            <button
              type="button"
              className={
                selectedId === item.id
                  ? "wd-pantry-kiosk__row wd-pantry-kiosk__row--active wd-pantry-category-item"
                  : "wd-pantry-kiosk__row wd-pantry-category-item"
              }
              onClick={() => onSelect(item.id)}
            >
              <span className="wd-pantry-kiosk__row-media" aria-hidden>
                {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <span>{letter}</span>}
              </span>
              <span className="wd-pantry-kiosk__row-copy">
                <strong>{item.productName}</strong>
                <span>
                  {item.quantity} {item.unit} · {item.storageLocation.trim() || item.category}
                </span>
                <span>
                  {formatDate(item.expirationDate)} · {item.status}
                </span>
              </span>
              <ChevronRight aria-hidden className="wd-pantry-kiosk__row-arrow" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function PantryKioskDetailCard({
  item,
  displayQuantity,
  formatDate,
  onAddStock,
  onUseItem,
  onAddToShopping,
  onClose,
  shoppingAdded,
}: {
  item: PantryKioskRow;
  displayQuantity: number;
  formatDate: (iso: string) => string;
  onAddStock: () => void;
  onUseItem: () => void;
  onAddToShopping: () => void;
  onClose: () => void;
  shoppingAdded: boolean;
}) {
  const letter = item.productName.trim().charAt(0).toUpperCase() || "?";

  return (
    <article className="wd-pantry-kiosk-detail">
      <div className="wd-pantry-kiosk-detail__head">
        <h2>Item detail</h2>
        <button type="button" className="wd-pantry-kiosk-detail__close" onClick={onClose} aria-label="Close item detail">
          <X aria-hidden className="wd-pantry-kiosk-detail__close-icon" />
        </button>
      </div>
      <div className="wd-pantry-kiosk-detail__hero">
        <div className="wd-pantry-kiosk-detail__image" aria-hidden>
          {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <span>{letter}</span>}
        </div>
        <div className="wd-pantry-kiosk-detail__intro">
          <p className="wd-pantry-kiosk-detail__eyebrow">{item.category}</p>
          <h3>{item.productName}</h3>
          <p className="wd-pantry-kiosk-detail__status">{item.status}</p>
        </div>
      </div>
      <dl className="wd-pantry-kiosk-detail__grid">
        <div>
          <dt>Quantity</dt>
          <dd>
            {displayQuantity} {item.unit}
          </dd>
        </div>
        <div>
          <dt>Storage</dt>
          <dd>{item.storageLocation.trim() || "—"}</dd>
        </div>
        <div>
          <dt>Expiry</dt>
          <dd>{formatDate(item.expirationDate)}</dd>
        </div>
        <div>
          <dt>Store</dt>
          <dd>{item.store.trim() || "—"}</dd>
        </div>
      </dl>
      <div className="wd-pantry-kiosk-detail__notes">
        <p className="wd-pantry-kiosk-detail__notes-label">Notes</p>
        <p>{item.notes.trim() || "—"}</p>
      </div>
      <div className="wd-pantry-kiosk-detail__actions">
        <button type="button" className="wd-pantry-kiosk__btn wd-pantry-kiosk__btn--teal" onClick={onAddStock}>
          Add Stock
        </button>
        <button type="button" className="wd-pantry-kiosk__btn wd-pantry-kiosk__btn--ghost" onClick={onUseItem}>
          Use Item
        </button>
        <button
          type="button"
          className="wd-pantry-kiosk__btn wd-pantry-kiosk__btn--orange"
          onClick={onAddToShopping}
          disabled={shoppingAdded}
        >
          {shoppingAdded ? "On shopping list" : "Add to Shopping"}
        </button>
      </div>
    </article>
  );
}

export function PantryKioskSummaryCard({
  pendingChanges,
  lowStockItems,
  expiringItems,
  formatDate,
  onSave,
  saveDisabled,
  pendingDeltas,
  products,
  onPendingCleared,
}: {
  pendingChanges: PantryKioskPendingChange[];
  lowStockItems: PantryKioskRow[];
  expiringItems: PantryKioskRow[];
  formatDate: (iso: string) => string;
  onSave?: () => void;
  saveDisabled: boolean;
  pendingDeltas?: Record<string, number>;
  products?: readonly HouseholdProduct[];
  onPendingCleared?: () => void;
}) {
  const { entries, commitPantryPendingDeltas, undoLastInventoryActivity, canUndo } =
    useInventoryActivityHistory();

  const handleSave = () => {
    if (pendingDeltas && products && onPendingCleared) {
      commitPantryPendingDeltas(pendingDeltas, products);
      onPendingCleared();
      return;
    }
    onSave?.();
  };

  const formatActivityTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return "—";
    }
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const activityLabel = (action: GroceryInventoryActivityEntry["action"]) => {
    if (action === "add_stock") {
      return "Add stock";
    }
    if (action === "use_item") {
      return "Use item";
    }
    return "Add to shopping";
  };

  const formatQuantityChange = (entry: GroceryInventoryActivityEntry) => {
    if (entry.action === "add_to_shopping") {
      return `${entry.quantityChange} ${entry.unit}`;
    }
    const prefix = entry.quantityChange > 0 ? "+" : "";
    return `${prefix}${entry.quantityChange} ${entry.unit}`;
  };

  return (
    <div className="wd-pantry-kiosk-summary">
      <h2 className="wd-pantry-kiosk-summary__title">Inventory Summary</h2>
      <section className="wd-pantry-kiosk-summary__section">
        <h3>Selected changes</h3>
        {pendingChanges.length === 0 ? (
          <p className="wd-pantry-kiosk-summary__empty">No quantity changes yet.</p>
        ) : (
          <ul>
            {pendingChanges.map((change) => (
              <li key={change.id}>
                <strong>{change.productName}</strong>
                <span>
                  {change.delta > 0 ? "+" : ""}
                  {change.delta} {change.unit}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="wd-pantry-kiosk-summary__section wd-pantry-kiosk-summary__section--activity">
        <h3>Recent activity</h3>
        {entries.length === 0 ? (
          <p className="wd-pantry-kiosk-summary__empty">Saved inventory actions will appear here.</p>
        ) : (
          <ul className="wd-pantry-kiosk-activity">
            {entries.slice(0, 8).map((entry) => (
              <li
                key={entry.id}
                className={
                  entry.undone
                    ? "wd-pantry-kiosk-activity__item wd-pantry-kiosk-activity__item--undone"
                    : "wd-pantry-kiosk-activity__item"
                }
              >
                <div className="wd-pantry-kiosk-activity__copy">
                  <strong>{entry.productName}</strong>
                  <span>
                    {entry.undone ? "Undone · " : ""}
                    {activityLabel(entry.action)} · {formatQuantityChange(entry)}
                  </span>
                </div>
                <time className="wd-pantry-kiosk-activity__time" dateTime={entry.timestamp}>
                  {formatActivityTime(entry.timestamp)}
                </time>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className="wd-pantry-kiosk__btn wd-pantry-kiosk__btn--ghost wd-pantry-kiosk__btn--undo"
          onClick={undoLastInventoryActivity}
          disabled={!canUndo}
        >
          Undo last change
        </button>
      </section>
      <section className="wd-pantry-kiosk-summary__section">
        <h3>Low stock</h3>
        {lowStockItems.length === 0 ? (
          <p className="wd-pantry-kiosk-summary__empty">Nothing low right now.</p>
        ) : (
          <ul>
            {lowStockItems.slice(0, 6).map((item) => (
              <li key={item.id}>
                <strong>{item.productName}</strong>
                <span>
                  {item.quantity} {item.unit}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="wd-pantry-kiosk-summary__section">
        <h3>Expiring soon</h3>
        {expiringItems.length === 0 ? (
          <p className="wd-pantry-kiosk-summary__empty">No upcoming expirations.</p>
        ) : (
          <ul>
            {expiringItems.slice(0, 6).map((item) => (
              <li key={item.id}>
                <strong>{item.productName}</strong>
                <span>{formatDate(item.expirationDate)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <button
        type="button"
        className="wd-pantry-kiosk__btn wd-pantry-kiosk__btn--save"
        onClick={handleSave}
        disabled={saveDisabled}
      >
        Save
      </button>
    </div>
  );
}
