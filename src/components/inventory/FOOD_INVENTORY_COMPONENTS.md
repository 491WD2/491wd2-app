# Food inventory dashboard — components

Route: **`/pantry?view=pantry`** (`FoodInventoryDashboard`)

Storage key: `familysite-491:food-inventory-dashboard` (see `useInventory`)

---

## `FoodInventoryDashboard`

**Path:** `src/pages/FoodInventoryDashboard.tsx`

Top-level page: sidebar + three location columns. Owns filter/sort UI state and drag-and-drop target state.

| State | Purpose |
| --- | --- |
| `search`, `sortKey`, `sortDirection` | Passed to `useInventory` |
| `filterPreset`, `categoryFilter` | Expiry/category filters |
| `draggingId`, `dropTarget` | Drag-and-drop highlights |

---

## `useInventory`

**Path:** `src/hooks/useInventory.ts`

| Export | Description |
| --- | --- |
| `FOOD_INVENTORY_STORAGE_KEY` | localStorage key |
| `useInventory(options)` | Load/save items, filter, sort, mutations |
| `NewFoodInventoryItemInput` | Shape for `addItem` |

### `UseInventoryOptions`

| Prop | Type | Default |
| --- | --- | --- |
| `search` | `string` | `""` |
| `sortKey` | `InventorySortKey` | `"expiryDate"` |
| `sortDirection` | `InventorySortDirection` | `"asc"` |
| `filterPreset` | `InventoryFilterPreset` | `"all"` |
| `categoryFilter` | `string \| null` | `null` |

### `UseInventoryResult`

| Field | Description |
| --- | --- |
| `items` | Full list (unfiltered) |
| `itemsByLocation` | Filtered + sorted, grouped by `pantry` / `fridge` / `freezer` |
| `categories` | Distinct category strings |
| `addItem` | Append item |
| `markUsed` | Decrement quantity; remove at 0 |
| `moveItem` | Change `location` |
| `removeItem` | Delete row |
| `resetToSeed` | Restore demo seed data |

---

## `InventoryActions`

**Path:** `src/components/inventory/InventoryActions.tsx`

Sidebar: search, sort, status filters, category chips, add-item form.

### Props (`InventoryActionsProps`)

| Prop | Type |
| --- | --- |
| `search` | `string` |
| `onSearchChange` | `(value: string) => void` |
| `sortKey` | `InventorySortKey` |
| `onSortKeyChange` | `(key: InventorySortKey) => void` |
| `sortDirection` | `InventorySortDirection` |
| `onSortDirectionChange` | `(dir: InventorySortDirection) => void` |
| `filterPreset` | `InventoryFilterPreset` |
| `onFilterPresetChange` | `(preset: InventoryFilterPreset) => void` |
| `categoryFilter` | `string \| null` |
| `onCategoryFilterChange` | `(category: string \| null) => void` |
| `categories` | `string[]` |
| `onAddItem` | `(input: NewFoodInventoryItemInput) => void` |
| `onResetDemo` | `() => void` (optional) |
| `totalCount` | `number` |
| `filteredCount` | `number` |

---

## `InventorySection`

**Path:** `src/components/inventory/InventorySection.tsx`

One color-coded column (pantry beige, fridge blue, freezer purple).

### Props (`InventorySectionProps`)

| Prop | Type |
| --- | --- |
| `location` | `FoodStorageLocation` |
| `items` | `FoodInventoryItem[]` |
| `draggingId` | `string \| null` |
| `isDropTarget` | `boolean` (optional) |
| `onMarkUsed` | `(id: string) => void` |
| `onMove` | `(id, location) => void` |
| `onDragStart` | `(id: string) => void` |
| `onDragEnd` | `() => void` |
| `onDrop` | `(location, itemId) => void` |
| `onDragEnter` | `(location) => void` (optional) |
| `onDragLeave` | `() => void` (optional) |

---

## `InventoryCard`

**Path:** `src/components/inventory/InventoryCard.tsx`

Draggable item card with expiry badge and quick actions.

### Props (`InventoryCardProps`)

| Prop | Type |
| --- | --- |
| `item` | `FoodInventoryItem` |
| `isDragging` | `boolean` (optional) |
| `onMarkUsed` | `(id: string) => void` |
| `onMove` | `(id, location) => void` |
| `onDragStart` | `(id: string) => void` (optional) |
| `onDragEnd` | `() => void` (optional) |

---

## Types

**Path:** `src/types/inventory.ts`

| Type | Description |
| --- | --- |
| `FoodStorageLocation` | `"pantry" \| "fridge" \| "freezer"` |
| `FoodInventoryItem` | Single inventory row |
| `InventorySortKey` | `"name" \| "quantity" \| "expiryDate"` |
| `InventoryExpiryStatus` | `"ok" \| "soon" \| "expired"` |
| `INVENTORY_LOCATION_META` | Per-location colors and labels |

Helpers: `getInventoryExpiryStatus`, `formatInventoryExpiryLabel`, `parseInventoryDate`.

---

## Legacy advanced module

`PantryInventoryModulePage` remains in the repo but is no longer mounted at `?view=pantry`. To restore it, point `PantryPage` advanced surface back to that lazy import or add `?view=pantry-advanced`.
