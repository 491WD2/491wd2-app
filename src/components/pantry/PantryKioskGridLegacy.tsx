import { useCallback, useEffect, useMemo, useState, type DragEvent } from "react";
import { ChevronRight, ScanLine } from "lucide-react";
import { KioskCard } from "../cards/KioskCard";
import { KioskCardGrid } from "../cards/KioskCardGrid";
import { getGroceryCategoryTheme } from "../../lib/groceryCategoryTheme";
import {
  trackCardDragDrop,
  trackCardDragStart,
  trackCardReorder,
  trackCardScan,
} from "../../lib/kioskCardAnalytics";
import { resolvePantryItemStatus, pantryStatusLabel } from "../../lib/pantryItemStatus";
import type { PantryKioskRow } from "../../pages/inventory/InventoryViews";
import type { PantryGridItem, PantrySortKey } from "../../types/cards";
import { trackInteraction } from "../../lib/kioskAnalytics";

const ANALYTICS_SURFACE = "pantry:grid";

const CATEGORY_EMOJI: Record<string, string> = {
  Produce: "🥬",
  Dairy: "🥛",
  Meat: "🥩",
  Frozen: "🧊",
  Beverages: "🥤",
  Snacks: "🍿",
  Bakery: "🥖",
  "Dry goods": "🌾",
  General: "📦",
};

export const SAMPLE_PANTRY_ITEMS: PantryGridItem[] = [
  {
    id: "sample-milk",
    name: "Whole milk",
    category: "Dairy",
    quantity: 1,
    unit: "gal",
    expiryDate: "2026-05-18",
    status: "In Stock",
    storageLocation: "Fridge",
    store: "Costco",
    notes: "",
    imageUrl: null,
  },
  {
    id: "sample-spinach",
    name: "Baby spinach",
    category: "Produce",
    quantity: 1,
    unit: "bag",
    expiryDate: "2026-05-14",
    status: "Expiring Soon",
    storageLocation: "Fridge",
    store: "Trader Joe's",
    notes: "Use in salads",
    imageUrl: null,
  },
];

function sortRows(items: PantryKioskRow[], sortBy: PantrySortKey, dir: "asc" | "desc") {
  const mult = dir === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    if (sortBy === "name") {
      return mult * a.productName.localeCompare(b.productName);
    }
    if (sortBy === "quantity") {
      return mult * (a.quantity - b.quantity);
    }
    return mult * a.expirationDate.localeCompare(b.expirationDate);
  });
}

export type PantryKioskGridProps = {
  items: PantryKioskRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  formatDate: (iso: string) => string;
  layout?: "list" | "grid";
  onReorder?: (orderedIds: string[]) => void;
  onScanRequest?: () => void;
  sortBy?: PantrySortKey;
  sortDirection?: "asc" | "desc";
  categoryFilter?: string | null;
  emptyTitle?: string;
  emptyHint?: string;
};

/** Legacy kiosk row grid — demo / fallback only (`HubCardsExample`). */
export function PantryKioskGrid({
  items,
  selectedId,
  onSelect,
  formatDate,
  layout = "grid",
  onReorder,
  onScanRequest,
  sortBy = "name",
  sortDirection = "asc",
  categoryFilter = null,
  emptyTitle = "No items in this category",
  emptyHint = "Try another shelf, scan a barcode, or clear filters.",
}: PantryKioskGridProps) {
  const [order, setOrder] = useState<string[]>(() => items.map((i) => i.id));
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => {
    const ids = items.map((i) => i.id);
    setOrder((prev) => {
      const kept = prev.filter((id) => ids.includes(id));
      const added = ids.filter((id) => !kept.includes(id));
      return [...kept, ...added];
    });
  }, [items]);

  const filteredSorted = useMemo(() => {
    let rows = items;
    if (categoryFilter) {
      rows = rows.filter((i) => i.category === categoryFilter);
    }
    return sortRows(rows, sortBy, sortDirection);
  }, [items, categoryFilter, sortBy, sortDirection]);

  const orderedItems = useCallback(() => {
    const map = new Map(filteredSorted.map((i) => [i.id, i]));
    const fromOrder = order.map((id) => map.get(id)).filter(Boolean) as PantryKioskRow[];
    const missing = filteredSorted.filter((i) => !order.includes(i.id));
    return [...fromOrder, ...missing];
  }, [filteredSorted, order]);

  const displayItems = orderedItems();

  const handleDragStart = (id: string) => (e: DragEvent) => {
    setDragId(id);
    e.dataTransfer.setData("text/plain", id);
    trackCardDragStart(ANALYTICS_SURFACE, id);
  };

  const handleDrop = (targetId: string) => (e: DragEvent) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain");
    if (!sourceId || sourceId === targetId) {
      setDragId(null);
      return;
    }
    const ids = displayItems.map((i) => i.id);
    const from = ids.indexOf(sourceId);
    const to = ids.indexOf(targetId);
    if (from >= 0 && to >= 0) {
      const next = [...ids];
      next.splice(from, 1);
      next.splice(to, 0, sourceId);
      setOrder(next);
      onReorder?.(next);
      trackCardReorder(ANALYTICS_SURFACE, from, to);
      trackCardDragDrop(ANALYTICS_SURFACE, sourceId, targetId);
    }
    setDragId(null);
  };

  if (displayItems.length === 0) {
    return (
      <div
        className="rounded-[24px] border-2 border-dashed border-slate-200 bg-white p-10 text-center shadow-sm"
        role="status"
      >
        <p className="text-lg font-bold text-slate-800">{emptyTitle}</p>
        <p className="mt-2 text-base text-slate-500">{emptyHint}</p>
        {onScanRequest ? (
          <button
            type="button"
            className="fh-kiosk-btn fh-kiosk-btn--primary mt-6"
            onClick={() => {
              trackCardScan(ANALYTICS_SURFACE);
              onScanRequest();
            }}
          >
            <ScanLine className="h-5 w-5" aria-hidden />
            Scan barcode
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <KioskCardGrid columns={layout === "grid" ? 3 : 1} aria-label="Pantry items">
      {displayItems.map((item) => {
        const theme = getGroceryCategoryTheme(item.category);
        const itemStatus = resolvePantryItemStatus({
          expiryDate: item.expirationDate,
          quantity: item.quantity,
          status: item.status,
        });
        return (
          <li
            key={item.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop(item.id)}
          >
            <KioskCard
              category="pantry"
              itemStatus={itemStatus}
              title={item.productName}
              subtitle={`${item.quantity} ${item.unit} · ${item.storageLocation.trim() || item.category}`}
              meta={`${formatDate(item.expirationDate)} · ${pantryStatusLabel(itemStatus)}`}
              emoji={CATEGORY_EMOJI[item.category] ?? "🏷️"}
              imageUrl={item.imageUrl}
              badge={
                <span className="fh-kiosk-card__badge" style={{ color: theme.accent }}>
                  {item.category}
                </span>
              }
              selected={selectedId === item.id}
              interactive
              draggable={Boolean(onReorder)}
              isDragging={dragId === item.id}
              onDragStart={handleDragStart(item.id)}
              onDragEnd={() => setDragId(null)}
              onClick={() => {
                trackInteraction(ANALYTICS_SURFACE, "card_edit", { cardId: item.id });
                onSelect(item.id);
              }}
              analyticsSurface={ANALYTICS_SURFACE}
              expandable
              expandContent={
                <p>
                  {item.notes.trim() || "No notes."} Store: {item.store.trim() || "—"}
                </p>
              }
              actions={[
                {
                  id: "details",
                  label: "Details",
                  icon: <ChevronRight className="h-4 w-4" aria-hidden />,
                  variant: "primary",
                  onClick: () => onSelect(item.id),
                },
                ...(onScanRequest
                  ? [
                      {
                        id: "scan",
                        label: "Scan",
                        icon: <ScanLine className="h-4 w-4" aria-hidden />,
                        onClick: () => {
                          trackCardScan(ANALYTICS_SURFACE);
                          onScanRequest();
                        },
                      },
                    ]
                  : []),
              ]}
              actionsReveal="always"
            />
          </li>
        );
      })}
    </KioskCardGrid>
  );
}

