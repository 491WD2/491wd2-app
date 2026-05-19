import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ProductDetailPanel } from "../components/product/ProductDetailPanel";
import {
  applyOpenFoodFactsToHouseholdProduct,
  createHouseholdProductFromLookup,
} from "../lib/groceryProductUtils";
import { HOUSEHOLD_PRODUCT_LIBRARY } from "../lib/groceryLibraryData";
import {
  isLikelyBarcode,
  lookupProductByBarcode,
  normalizeBarcode,
} from "../lib/productLookup";
import type { HouseholdProduct } from "../types/grocery";

type HouseholdProductContextValue = {
  products: HouseholdProduct[];
  activeShoppingProducts: HouseholdProduct[];
  pantryProducts: HouseholdProduct[];
  getProductById: (id: string) => HouseholdProduct | undefined;
  updateProduct: (id: string, patch: Partial<HouseholdProduct>) => void;
  openProductDetail: (id: string) => void;
  openProductFromBarcode: (barcodeInput: string) => Promise<string | null>;
  addToShoppingList: (id: string) => void;
  addToPantryList: (id: string) => void;
  lookupMessage: string | null;
  lookupBusy: boolean;
};

const HouseholdProductContext = createContext<HouseholdProductContextValue | null>(null);

export function HouseholdProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<HouseholdProduct[]>(() =>
    HOUSEHOLD_PRODUCT_LIBRARY.map((product) => ({ ...product })),
  );
  const [detailProductId, setDetailProductId] = useState<string | null>(null);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);

  const getProductById = useCallback(
    (id: string) => products.find((product) => product.id === id),
    [products],
  );

  const updateProduct = useCallback((id: string, patch: Partial<HouseholdProduct>) => {
    setProducts((current) =>
      current.map((product) => (product.id === id ? { ...product, ...patch } : product)),
    );
  }, []);

  const openProductDetail = useCallback((id: string) => {
    setLookupMessage(null);
    setDetailProductId(id);
  }, []);

  const addToShoppingList = useCallback((id: string) => {
    updateProduct(id, { need: true });
  }, [updateProduct]);

  const addToPantryList = useCallback((id: string) => {
    updateProduct(id, { need: false });
  }, [updateProduct]);

  const openProductFromBarcode = useCallback(
    async (barcodeInput: string) => {
      const barcode = normalizeBarcode(barcodeInput);
      if (!isLikelyBarcode(barcode)) {
        setLookupMessage("Enter a valid 8-14 digit UPC/EAN barcode.");
        return null;
      }

      setLookupBusy(true);
      setLookupMessage("Searching Open Food Facts…");

      try {
        const lookup = await lookupProductByBarcode(barcode);
        if (lookup.status !== "found") {
          setLookupMessage("No public record for this barcode.");
          return null;
        }

        let nextId: string | null = null;
        setProducts((current) => {
          const existing = current.find((product) => product.barcode === barcode);
          if (existing) {
            nextId = existing.id;
            return current.map((product) =>
              product.id === existing.id
                ? applyOpenFoodFactsToHouseholdProduct(product, lookup)
                : product,
            );
          }

          const created = createHouseholdProductFromLookup(lookup);
          nextId = created.id;
          return [...current, created];
        });

        if (nextId) {
          setDetailProductId(nextId);
          setLookupMessage(null);
        }
        return nextId;
      } catch (error) {
        setLookupMessage(
          error instanceof Error ? error.message : "OpenFoodFacts lookup failed. Try again later.",
        );
        return null;
      } finally {
        setLookupBusy(false);
      }
    },
    [],
  );

  const activeShoppingProducts = useMemo(
    () => products.filter((product) => product.need),
    [products],
  );

  const pantryProducts = useMemo(
    () => products.filter((product) => !product.need),
    [products],
  );

  const detailProduct = detailProductId ? getProductById(detailProductId) : undefined;

  const value = useMemo(
    () => ({
      products,
      activeShoppingProducts,
      pantryProducts,
      getProductById,
      updateProduct,
      openProductDetail,
      openProductFromBarcode,
      addToShoppingList,
      addToPantryList,
      lookupMessage,
      lookupBusy,
    }),
    [
      products,
      activeShoppingProducts,
      pantryProducts,
      getProductById,
      updateProduct,
      openProductDetail,
      openProductFromBarcode,
      addToShoppingList,
      addToPantryList,
      lookupMessage,
      lookupBusy,
    ],
  );

  return (
    <HouseholdProductContext.Provider value={value}>
      {children}
      {detailProduct ? (
        <ProductDetailPanel
          product={detailProduct}
          lookupBusy={lookupBusy}
          lookupMessage={lookupMessage}
          onClose={() => {
            setDetailProductId(null);
            setLookupMessage(null);
          }}
          onAddToShopping={() => addToShoppingList(detailProduct.id)}
          onAddToPantry={() => addToPantryList(detailProduct.id)}
          onUpdateFromOpenFoodFacts={async () => {
            if (!detailProduct.barcode?.trim()) {
              setLookupMessage("Add a barcode before updating from Open Food Facts.");
              return;
            }
            await openProductFromBarcode(detailProduct.barcode);
          }}
        />
      ) : null}
    </HouseholdProductContext.Provider>
  );
}

export function useHouseholdProducts() {
  const context = useContext(HouseholdProductContext);
  if (!context) {
    throw new Error("useHouseholdProducts must be used within HouseholdProductProvider");
  }
  return context;
}
