import { useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import type { FamilyData, GroceryItem, PantryItem, ShoppingItem } from "../../data/familyData";
import { Button } from "../ui/Button";
import { Input, Select, Textarea } from "../ui/Field";
import { createActivity } from "../../lib/activity";
import { findBatchMatches } from "../../lib/batchInventory";
import type { PantryItemSelectLists } from "../../pages/inventory/InventoryViews";
import {
  createBlankPantryItem,
  getInventoryLocationLabel,
  isColdStorage,
  isKitchenStorage,
} from "../../pages/inventory/inventoryUtils";
import {
  isLikelyBarcode,
  lookupOpenFoodFactsProduct,
  mapOpenFoodFactsToPantryItemRespectingImages,
  mapOpenFoodFactsToShoppingFields,
  normalizeBarcode,
  type NormalizedProductLookup,
} from "../../services/openFoodFacts";
import { getRotationStatus } from "../../services/foodStorageGuidance";
import { cn } from "../../lib/utils";
import { findInventoryCrossCheckMatches } from "../../lib/inventoryCrossCheck";
import { InventoryCrossCheckModal } from "./InventoryCrossCheckModal";
import { selectOptionsWithCurrent } from "../../lib/customization";

const SCAN_INPUT =
  "min-h-10 w-full rounded-[8px] border border-[#ededed] bg-white px-3 py-2 text-[14px] text-[#1f1f1f] shadow-[0_1px_1px_rgba(0,0,0,0.06)] placeholder:text-[#8e8e8e] focus:border-[#FE9F43]/55 focus:outline-none focus:ring-2 focus:ring-[#FE9F43]/25";
const SCAN_TEXTAREA = `${SCAN_INPUT} min-h-[7rem] resize-y py-3 leading-relaxed`;
const SCAN_SELECT = `${SCAN_INPUT} cursor-pointer appearance-none`;
const SCAN_CARD =
  "rounded-[8px] border border-[#ededed] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.06)]";
const SCAN_LOOKUP_NEST = "rounded-[8px] border border-[#ededed] bg-[#f8f9fa] p-3";
const btnPrimaryOrange =
  "bg-gradient-to-r from-[#FF6F28] to-[#FF5325] font-semibold text-white shadow-[0_6px_15px_rgba(242,101,34,0.22)] hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f7f7]";
const btnSecondaryLight =
  "border-[#ededed] bg-white font-semibold text-[#637381] shadow-sm hover:bg-[#f8f9fa] focus-visible:ring-2 focus-visible:ring-[#FE9F43]/25";

/** SmartHR light field styling for Add Item wizard. */
function ScanFieldInput(props: ComponentProps<typeof Input>) {
  return <Input {...props} className={cn(SCAN_INPUT, props.className)} />;
}

function ScanFieldSelect(props: ComponentProps<typeof Select>) {
  return <Select {...props} className={cn(SCAN_SELECT, props.className)} />;
}

function ScanFieldTextarea(props: ComponentProps<typeof Textarea>) {
  return <Textarea {...props} className={cn(SCAN_TEXTAREA, props.className)} />;
}

const SCAN_LABEL_CLASS = "block space-y-2 text-sm font-medium text-[#575757]";

type LookupState = "idle" | "loading" | "done";

export function ScanPutAwayWizard({
  data,
  setData,
  pantrySelectLists,
  onOpenShopping,
  initialBarcode,
  navigateWithinApp,
}: {
  data: FamilyData;
  setData: React.Dispatch<React.SetStateAction<FamilyData>>;
  pantrySelectLists: PantryItemSelectLists;
  onOpenShopping: () => void;
  initialBarcode?: string;
  navigateWithinApp?: (href: string) => void;
}) {
  const [barcodeInput, setBarcodeInput] = useState(initialBarcode ?? "");
  const [lookupStatus, setLookupStatus] = useState<LookupState>("idle");
  const [lookupNote, setLookupNote] = useState<string | null>(null);
  const [lastLookup, setLastLookup] = useState<NormalizedProductLookup | null>(null);

  const [draft, setDraft] = useState<PantryItem>(() => {
    const b = createBlankPantryItem();
    if (initialBarcode) {
      b.barcode = normalizeBarcode(initialBarcode);
    }
    return b;
  });

  const [batchMode, setBatchMode] = useState<"new" | "merge">("new");
  const [mergeTargetId, setMergeTargetId] = useState<string>("");
  const [crossCheckOpen, setCrossCheckOpen] = useState(false);
  const lastAutoLookupSeedRef = useRef<string | null>(null);
  const [lookupThrottleAt, setLookupThrottleAt] = useState(0);

  const matches = useMemo(
    () =>
      findBatchMatches(data.pantry, {
        barcode: draft.barcode,
        name: draft.name,
        productName: draft.productName,
        bestByDate: draft.bestByDate,
        storageArea: draft.storageArea,
      }),
    [data.pantry, draft.barcode, draft.bestByDate, draft.name, draft.productName, draft.storageArea],
  );

  const crossCheckMatches = useMemo(
    () =>
      findInventoryCrossCheckMatches(data.pantry, {
        barcode: draft.barcode,
        name: draft.name,
        productName: draft.productName,
        brand: draft.brand,
      }),
    [data.pantry, draft.barcode, draft.brand, draft.name, draft.productName],
  );

  async function fetchOpenFoodFacts(
    explicitCode?: string,
    options?: { bypassThrottle?: boolean },
  ) {
    const raw = (explicitCode ?? barcodeInput).trim();
    const normalizedBarcode = normalizeBarcode(raw);

    if (!isLikelyBarcode(normalizedBarcode)) {
      setLookupNote("Enter a valid 8–14 digit barcode.");
      return;
    }

    const now = Date.now();
    if (!options?.bypassThrottle && now - lookupThrottleAt < 2500) {
      setLookupNote("Please wait a moment before another search.");
      return;
    }
    if (!options?.bypassThrottle) {
      setLookupThrottleAt(now);
    }

    setLookupNote(null);
    setBarcodeInput(normalizedBarcode);
    setDraft((d) => ({ ...d, barcode: normalizedBarcode }));
    setLookupStatus("loading");
    try {
      const result = await lookupOpenFoodFactsProduct(normalizedBarcode);
      setLastLookup(result);
      setLookupStatus("done");
      if (result.status === "not_found") {
        setLookupNote(
          "No public record for this barcode — enter the label yourself and continue.",
        );
        return;
      }
      setLookupNote(
        "Product found. Click Apply Product Info to fill labels — or edit manually.",
      );
    } catch (e) {
      setLookupStatus("idle");
      setLookupNote(e instanceof Error ? e.message : "Could not fetch product details.");
      setLastLookup(null);
    }
  }

  function applyProductInfoToDraft() {
    if (!lastLookup || lastLookup.status !== "found") {
      return;
    }
    const pkg = lastLookup.packageQuantity?.trim();
    setDraft((d) => {
      const mapped = mapOpenFoodFactsToPantryItemRespectingImages(d, lastLookup);
      const qtyLine = [mapped.quantity, mapped.unit].filter(Boolean).join(" ").trim();
      let productDescription = mapped.productDescription?.trim();
      if (pkg && pkg !== qtyLine && !productDescription?.includes(pkg)) {
        productDescription = [productDescription, pkg].filter(Boolean).join("\n\n");
      }
      return {
        ...d,
        ...mapped,
        name: mapped.name || d.name,
        barcode: lastLookup.barcode,
        category: mapped.category || d.category,
        productDescription: productDescription || mapped.productDescription,
        packageType: pkg || d.packageType,
        itemType: "food",
      };
    });
    setLookupNote("Product details applied. Adjust anything before saving to inventory.");
  }

  useEffect(() => {
    const seed = initialBarcode?.trim();
    if (!seed) {
      return;
    }
    const n = normalizeBarcode(seed);
    if (!isLikelyBarcode(n)) {
      return;
    }
    if (lastAutoLookupSeedRef.current === n) {
      return;
    }
    lastAutoLookupSeedRef.current = n;
    setBarcodeInput(n);
    setDraft((d) => ({ ...d, barcode: n }));
    void fetchOpenFoodFacts(n, { bypassThrottle: true });
  }, [initialBarcode]);

  function applyManualBarcode() {
    const n = normalizeBarcode(barcodeInput);
    setBarcodeInput(n);
    setDraft((d) => ({ ...d, barcode: n }));
  }

  function saveToInventory(bypassCrossCheck = false) {
    if (!bypassCrossCheck && crossCheckMatches.length > 0) {
      setCrossCheckOpen(true);
      return;
    }

    const now = new Date().toISOString();
    const rotationStatus = getRotationStatus(draft);
    const best = draft.bestByDate?.trim() || "";
    const expirySynced = best || draft.expiryDate?.trim() || "";

    if (batchMode === "merge" && mergeTargetId) {
      const target = data.pantry.find((p) => p.id === mergeTargetId);
      if (!target) {
        return;
      }
      const qty = Number.parseFloat(String(draft.quantity)) || 0;
      const prev = Number.parseFloat(String(target.quantity)) || 0;
      const mergedQty = String(prev + qty);
      setData((current) =>
        createActivity(
          {
            ...current,
            pantry: current.pantry.map((p) =>
              p.id === mergeTargetId
                ? {
                    ...p,
                    quantity: mergedQty,
                    lastUpdated: now,
                    rotationStatus,
                    bestByDate: best || p.bestByDate,
                    expiryDate: expirySynced || p.expiryDate,
                  }
                : p,
            ),
          },
          {
            type: "updated",
            entityType: "pantryItem",
            entityId: mergeTargetId,
            entityTitle: target.name,
            message: "Added item to inventory.",
          },
        ),
      );
      setDraft(createBlankPantryItem());
      setBarcodeInput("");
      setLookupNote(null);
      setCrossCheckOpen(false);
      return;
    }

    const item: PantryItem = {
      ...draft,
      id: crypto.randomUUID(),
      rotationStatus,
      bestByDate: best || undefined,
      expiryDate: expirySynced || undefined,
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
          message: "Added item to inventory.",
        },
      ),
    );

    setDraft(createBlankPantryItem());
    setBarcodeInput("");
    setLookupNote(null);
    setBatchMode("new");
    setCrossCheckOpen(false);
  }

  function addToShopping() {
    const product =
      lastLookup ??
      ({
        provider: "openfoodfacts",
        status: "not_found",
        barcode: normalizeBarcode(barcodeInput),
        name: draft.name,
        brand: draft.brand ?? "",
        category: draft.category,
        description: "",
        quantity: draft.quantity,
        unit: draft.unit ?? "",
        packageQuantity: "",
        imageUrl: "",
        lookedUpAt: new Date().toISOString(),
      } satisfies NormalizedProductLookup);

    const mapped = mapOpenFoodFactsToShoppingFields({
      ...product,
      name: draft.name,
      brand: draft.brand ?? "",
      category: draft.category,
      quantity: draft.quantity,
      unit: draft.unit ?? "",
    });

    const shoppingItem: ShoppingItem = {
      id: crypto.randomUUID(),
      name: draft.name,
      quantity: draft.quantity,
      unit: draft.unit,
      category: draft.category,
      storeSection: mapped.storeSection ?? "aisles",
      preferredStore: "",
      neededBy: new Date().toISOString().slice(0, 10),
      purchased: false,
      needsPutAway: false,
      destination: draft.storageArea,
      barcode: draft.barcode,
      brand: draft.brand,
      productImageUrl: draft.productImageUrl,
      source: "manual",
      sourceSystem: draft.sourceSystem,
      lookupMetadata: draft.lookupMetadata,
      destinationDetail: draft.locationDetail,
      notes: draft.notes ?? "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
          message: `Added ${shoppingItem.name} to shopping from scan workflow.`,
        },
      ),
    );
  }

  function addToGroceryLibrary() {
    const grocery: GroceryItem = {
      id: crypto.randomUUID(),
      name: draft.name,
      category: draft.category,
      storeSection: "aisles",
      amountDefault: draft.quantity,
      defaultLocation: draft.storageArea,
      defaultWall: draft.pantryWall,
      defaultShelf: draft.pantryShelf,
      barcode: draft.barcode,
      brand: draft.brand,
      productImageUrl: draft.productImageUrl,
      notes: draft.notes ?? "",
      source: draft.source ?? "manual",
      sourceSystem: draft.sourceSystem,
      lookupMetadata: draft.lookupMetadata,
    };
    setData((current) => ({
      ...current,
      groceryItems: [...current.groceryItems, grocery],
    }));
  }

  const mergeCandidates = [...matches.exactBatch, ...matches.differentBestBy];

  return (
    <div className="space-y-6">
      <div className={SCAN_CARD}>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#F26522]">
          Scan drives the household food loop
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[#575757]">
          Identify → cross-check → add to inventory → then use → low/out → alerts → shopping list.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-[#575757]">
          This screen finishes <span className="font-semibold text-[#1f1f1f]">adding stock from a barcode</span>.
          Optional product lookup only fills labels — it is not the goal of scanning.
        </p>
      </div>

      <section className={SCAN_CARD}>
        <h3 className="text-sm font-semibold text-[#1f1f1f]">1. Identify</h3>
        <p className="mt-1 text-xs text-[#575757]">
          Scan or type the barcode, then optionally pull public product details to speed up labeling. Only the
          barcode is sent to Open Food Facts — never household names or private notes.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <ScanFieldInput
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder="Barcode digits"
            inputMode="numeric"
            aria-label="Barcode digits"
          />
          <Button
            type="button"
            variant="secondary"
            className={btnSecondaryLight}
            onClick={applyManualBarcode}
          >
            Apply to draft
          </Button>
          <Button
            type="button"
            variant="primary"
            className={btnPrimaryOrange}
            disabled={lookupStatus === "loading"}
            onClick={() => void fetchOpenFoodFacts()}
          >
            {lookupStatus === "loading" ? "Searching…" : "Search Product"}
          </Button>
        </div>
        {lookupNote ? (
          <p className="mt-2 text-sm text-[#575757]">{lookupNote}</p>
        ) : null}
        {lastLookup?.status === "found" ? (
          <div className={cn("mt-3", SCAN_LOOKUP_NEST)}>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-[#ededed] bg-white sm:h-auto sm:w-28">
                {lastLookup.imageUrl ? (
                  <img
                    alt=""
                    className="max-h-full max-w-full object-contain"
                    src={lastLookup.imageUrl}
                  />
                ) : (
                  <p className="px-2 text-center text-xs leading-snug text-[#575757]">
                    No product image found. Upload a photo or paste an image URL in inventory after save.
                  </p>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#1f1f1f]">{lastLookup.name || "Unnamed product"}</p>
                <p className="mt-1 text-sm text-[#575757]">
                  {[lastLookup.brand, lastLookup.packageQuantity || lastLookup.quantity, lastLookup.category]
                    .map((s) => (typeof s === "string" ? s.trim() : ""))
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </p>
                <Button
                  type="button"
                  variant="primary"
                  className={cn(btnPrimaryOrange, "mt-3 min-h-11 w-full sm:w-auto")}
                  onClick={applyProductInfoToDraft}
                >
                  Apply Product Info
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className={SCAN_CARD}>
        <h3 className="text-sm font-semibold text-[#1f1f1f]">2. Product details</h3>
        <p className="mt-1 text-xs text-[#575757]">
          When you save, we cross-check against inventory so batches and duplicates stay accurate.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className={SCAN_LABEL_CLASS}>
            Display name
            <ScanFieldInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </label>
          <label className={SCAN_LABEL_CLASS}>
            Brand
            <ScanFieldInput value={draft.brand ?? ""} onChange={(e) => setDraft({ ...draft, brand: e.target.value })} />
          </label>
          <label className={cn(SCAN_LABEL_CLASS, "md:col-span-2")}>
            Type / category
            <ScanFieldSelect
              value={draft.category ?? ""}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            >
              <option value="">—</option>
              {selectOptionsWithCurrent(pantrySelectLists.categories, draft.category ?? "").map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </ScanFieldSelect>
          </label>
          <label className={cn(SCAN_LABEL_CLASS, "md:col-span-2")}>
            Description
            <ScanFieldTextarea
              rows={3}
              value={draft.productDescription ?? ""}
              placeholder="From lookup or your own notes about the product."
              aria-label="Product description"
              onChange={(e) =>
                setDraft({
                  ...draft,
                  productDescription: e.target.value.trim() ? e.target.value : undefined,
                })
              }
            />
          </label>
        </div>
      </section>

      <section className={SCAN_CARD}>
        <h3 className="text-sm font-semibold text-[#1f1f1f]">3. Save to inventory</h3>
        <p className="mt-1 text-xs text-[#575757]">
          Quantity, location, and dates complete the receive step. Use Inventory afterward for consume, low/out,
          and restock.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className={SCAN_LABEL_CLASS}>
            Quantity
            <ScanFieldInput
              value={draft.quantity}
              onChange={(e) => setDraft({ ...draft, quantity: e.target.value })}
            />
          </label>
          <label className={SCAN_LABEL_CLASS}>
            Minimum quantity (restock hint)
            <ScanFieldInput
              value={draft.minQuantity ?? ""}
              onChange={(e) => setDraft({ ...draft, minQuantity: e.target.value })}
            />
          </label>
          <label className={SCAN_LABEL_CLASS}>
            Unit
            <ScanFieldSelect
              value={draft.unit ?? ""}
              onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
            >
              <option value="">—</option>
              {pantrySelectLists.units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </ScanFieldSelect>
          </label>
          <label className={cn(SCAN_LABEL_CLASS, "md:col-span-2")}>
            Storage area
            <ScanFieldSelect
              value={draft.storageArea}
              onChange={(e) => {
                const storageArea = e.target.value as PantryItem["storageArea"];
                setDraft({
                  ...draft,
                  storageArea,
                  location: storageArea,
                });
              }}
            >
              {pantrySelectLists.storageAreas.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </ScanFieldSelect>
          </label>

          {isKitchenStorage(draft.storageArea) ? (
            <label className={cn(SCAN_LABEL_CLASS, "md:col-span-2")}>
              Kitchen location detail
              <ScanFieldSelect
                value={draft.kitchenLocationDetail ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    kitchenLocationDetail: e.target.value,
                    locationDetail: e.target.value,
                  })
                }
              >
                <option value="">—</option>
                {pantrySelectLists.kitchenLocationDetails.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </ScanFieldSelect>
            </label>
          ) : null}

          {draft.storageArea === "Pantry" ? (
            <>
              <label className={SCAN_LABEL_CLASS}>
                Pantry wall
                <ScanFieldSelect
                  value={draft.pantryWall ?? ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      pantryWall: e.target.value as PantryItem["pantryWall"],
                      wall: e.target.value as PantryItem["wall"],
                    })
                  }
                >
                  {pantrySelectLists.pantryWalls.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </ScanFieldSelect>
              </label>
              <label className={SCAN_LABEL_CLASS}>
                Pantry shelf
                <ScanFieldSelect
                  value={draft.pantryShelf ?? ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      pantryShelf: e.target.value as PantryItem["pantryShelf"],
                      shelf: e.target.value as PantryItem["shelf"],
                    })
                  }
                >
                  {pantrySelectLists.pantryShelves.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </ScanFieldSelect>
              </label>
            </>
          ) : null}

          {isColdStorage(draft.storageArea) ? (
            <label className={cn(SCAN_LABEL_CLASS, "md:col-span-2")}>
              Fridge / freezer bin
              <ScanFieldSelect
                value={draft.coldLocationDetail ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    coldLocationDetail: e.target.value,
                    locationDetail: e.target.value,
                  })
                }
              >
                <option value="">—</option>
                {pantrySelectLists.coldLocationDetails.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </ScanFieldSelect>
            </label>
          ) : null}

          <label className={SCAN_LABEL_CLASS}>
            Purchase date
            <ScanFieldInput
              type="date"
              value={draft.purchaseDate ?? ""}
              onChange={(e) => setDraft({ ...draft, purchaseDate: e.target.value })}
            />
          </label>
          <label className={SCAN_LABEL_CLASS}>
            Best-by / quality date
            <ScanFieldInput
              type="date"
              value={draft.bestByDate ?? draft.expiryDate ?? ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  bestByDate: e.target.value,
                  expiryDate: e.target.value,
                })
              }
            />
          </label>
          <label className={cn(SCAN_LABEL_CLASS, "md:col-span-2")}>
            Notes (stay on device)
            <ScanFieldTextarea
              rows={4}
              value={draft.notes ?? ""}
              placeholder="Private notes — stays on this device."
              aria-label="Notes for this item"
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
          </label>
        </div>
      </section>

      {mergeCandidates.length > 0 && crossCheckMatches.length === 0 ? (
        <section className="rounded-[8px] border border-amber-200 bg-amber-50/95 p-4 shadow-[0_1px_1px_rgba(0,0,0,0.06)]">
          <h3 className="text-sm font-semibold text-amber-950">Batch match</h3>
          <p className="mt-1 text-xs text-amber-900">
            Same barcode with a different best-by date should usually be a separate batch for rotation.
          </p>
          <div className="mt-2 space-y-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-[#1f1f1f]">
              <input
                name="scan-batch-mode"
                type="radio"
                className="h-4 w-4 accent-[#F26522]"
                checked={batchMode === "new"}
                onChange={() => setBatchMode("new")}
              />
              Create new inventory row
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-[#1f1f1f]">
              <input
                name="scan-batch-mode"
                type="radio"
                className="h-4 w-4 accent-[#F26522]"
                checked={batchMode === "merge"}
                onChange={() => setBatchMode("merge")}
              />
              Add quantity to existing row
            </label>
            {batchMode === "merge" ? (
              <ScanFieldSelect value={mergeTargetId} onChange={(e) => setMergeTargetId(e.target.value)}>
                <option value="">Select item…</option>
                {mergeCandidates.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {getInventoryLocationLabel(p)} · best{" "}
                    {p.bestByDate || p.expiryDate || "—"}
                  </option>
                ))}
              </ScanFieldSelect>
            ) : null}
          </div>
        </section>
      ) : null}

      <InventoryCrossCheckModal
        matches={crossCheckMatches}
        open={crossCheckOpen}
        onCancel={() => setCrossCheckOpen(false)}
        onAddAnotherBatch={() => {
          setBatchMode("new");
          setMergeTargetId("");
          saveToInventory(true);
        }}
        onIncreaseExisting={(id) => {
          setBatchMode("merge");
          setMergeTargetId(id);
          saveToInventory(true);
        }}
        onUpdateExisting={(id) => {
          navigateWithinApp?.(
            `/pantry?tab=inventory&itemId=${encodeURIComponent(id)}&item=${encodeURIComponent(id)}`,
          );
          setCrossCheckOpen(false);
        }}
        onGoToItem={(id) => {
          navigateWithinApp?.(`/pantry?tab=inventory&itemId=${encodeURIComponent(id)}&item=${encodeURIComponent(id)}`);
          setCrossCheckOpen(false);
        }}
      />

      <p className="text-xs leading-relaxed text-[#575757]">
        Primary action below runs <span className="font-semibold text-[#1f1f1f]">cross-check</span> when needed,
        then <span className="font-semibold text-[#1f1f1f]">save stock on hand</span>. Track usage and shopping from the
        Inventory tab and Home alerts.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          variant="primary"
          className={cn(btnPrimaryOrange, "min-h-12 text-base")}
          onClick={() => saveToInventory()}
        >
          Cross-check & save to inventory
        </Button>
        <Button type="button" variant="secondary" className={btnSecondaryLight} onClick={addToShopping}>
          Add to shopping list
        </Button>
        <Button type="button" variant="secondary" className={btnSecondaryLight} onClick={addToGroceryLibrary}>
          Save to grocery library
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="text-[#575757] hover:bg-[#f8f9fa]"
          onClick={onOpenShopping}
        >
          Open shopping
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="text-[#575757] hover:bg-[#f8f9fa]"
          onClick={() => {
            const blank = createBlankPantryItem();
            if (initialBarcode?.trim()) {
              const n = normalizeBarcode(initialBarcode);
              blank.barcode = n;
              setBarcodeInput(n);
            } else {
              setBarcodeInput("");
            }
            setDraft(blank);
            setLookupNote(null);
            setLastLookup(null);
            setLookupStatus("idle");
            setBatchMode("new");
            setMergeTargetId("");
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
