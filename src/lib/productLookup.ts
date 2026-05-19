/**
 * Browser-safe product lookup facade. Currently backed by Open Food Facts (no API keys).
 * Designed so a future proxy/backend can swap in without changing pantry UI.
 */

export type ProductLookupResult = import("../services/openFoodFacts").NormalizedProductLookup;

export {
  isLikelyBarcode,
  lookupOpenFoodFactsProduct as lookupProductByBarcode,
  normalizeBarcode,
  type NormalizedProductLookup,
  type ProductLookupStatus,
} from "../services/openFoodFacts";
