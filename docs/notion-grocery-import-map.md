# Notion grocery import map

Phase 1 maps the Notion **Food List Database** export into a shared household product library for later Shopping, Pantry, Inventory, Scan, and Product Detail work. No page UI is wired in this phase.

## Source export

- Archive: `51863b53-b73d-4bc9-8fed-b1a3e53e7342_ExportBlock-e493d8c2-9810-475b-b756-d659c73f7bdc.zip`
- CSV: `Private & Shared/Smart Grocery Organizer/Food List Database 31c97e9c2a3183c4b80581307573736f.csv`
- Rows imported: **232** products

## Notion column mapping

| Notion column | `HouseholdProduct` field | Notes |
| --- | --- | --- |
| Name | `productName` | Display name |
| Amount | `quantity`, `unit` | Parsed when present; otherwise `null` |
| Bar Code | `barcode` | Empty in export; reserved for OpenFoodFacts |
| Category | `category` | 18 Notion labels |
| Checkbox | `purchased` | `Yes` / `No` |
| Created | `createdAt` | UTC ISO timestamp |
| Date Added | `dateAdded` | Optional |
| Expiration Date | `expirationDate` | Optional |
| Need | `need` | `Yes` → active shopping list |
| Notes | `notes` | |
| Price | `price` | |
| Store | `store` | |
| URL | `productUrl` | |

Fields not in the export stay empty for now: `brand`, `imageUrl` (placeholder `null` until lookup or manual image).

## Shared model

- Type: `src/types/grocery.ts` → `HouseholdProduct`
- OpenFoodFacts-ready slice: `OpenFoodFactsProductFields` and `pickOpenFoodFactsFields()`
- Category groups: `src/lib/groceryCategoryMap.ts`
- Seed library: `src/lib/groceryLibraryData.ts`

## Category groups

| Group | Notion categories |
| --- | --- |
| Fresh | Produce, Meats, Seafood, Dairy & Eggs, Bakery, Prepared Foods |
| Pantry | Condiments, Canned & Jarred, Grains Pasta & Dry Goods, Baking Supplies, International & Ethnic Foods, Snacks, Beverages, Alcohol, Protein Bars & Supplements |
| Home | Household & Misc Items, Pet Food |
| Cold | Frozen Foods |

## Stores

`GROCERY_STORES`: Safeway, Costco, Amazon, Walmart, Trader Joes.

## Library exports

| Export | Meaning |
| --- | --- |
| `HOUSEHOLD_PRODUCT_LIBRARY` | Full Notion-derived catalog |
| `ACTIVE_SHOPPING_PRODUCTS` | `need === true` (17 rows in current export) |
| `PANTRY_LIBRARY_PRODUCTS` | `need === false` |
| `GROCERY_STORES` | Household store picker seed list |
| `GROCERY_CATEGORY_GROUPS` | Fresh / Pantry / Home / Cold metadata |

## ID strategy

Stable slug from product name (`milk-oat`, `bread-sourdough`). Duplicate names get a numeric suffix.

## Next phases (not in scope here)

- Replace kiosk catalog and pantry sample data with this library
- Wire scan and OpenFoodFacts apply into product drafts
- Product detail surfaces for image, brand, and barcode
- Persist library changes in household data / Supabase
