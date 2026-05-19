import { useEffect, useState, lazy, Suspense } from "react";
import { Camera, Search, XCircle } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Field";
import {
  isLikelyBarcode,
  lookupProductByBarcode,
  normalizeBarcode,
  type ProductLookupStatus,
  type NormalizedProductLookup,
} from "../../lib/productLookup";

const BarcodeScannerPanelLazy = lazy(() =>
  import("../scanner/BarcodeScannerPanel").then((m) => ({ default: m.BarcodeScannerPanel })),
);

export function ProductLookupPanel({
  initialBarcode = "",
  applyLabel = "Apply Product Info",
  variant = "dark",
  onApply,
}: {
  initialBarcode?: string;
  applyLabel?: string;
  variant?: "dark" | "light";
  onApply: (product: NormalizedProductLookup) => void;
}) {
  const [barcode, setBarcode] = useState(initialBarcode);
  const [lookupState, setLookupState] = useState<ProductLookupStatus>("idle");
  const [product, setProduct] = useState<NormalizedProductLookup | undefined>();
  const [message, setMessage] = useState("Ready to search.");
  const [lastLookupAt, setLastLookupAt] = useState(0);
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    setBarcode(initialBarcode ?? "");
  }, [initialBarcode]);

  async function lookupBarcodeFromInput(options?: { bypassThrottle?: boolean }) {
    await lookupBarcodeWithCode(barcode, options);
  }

  async function lookupBarcodeWithCode(
    rawCode: string,
    options?: { bypassThrottle?: boolean },
  ) {
    const normalizedBarcode = normalizeBarcode(rawCode);

    if (!isLikelyBarcode(normalizedBarcode)) {
      setLookupState("error");
      setMessage("Enter a valid 8–14 digit UPC/EAN barcode.");
      return;
    }

    const now = Date.now();
    if (!options?.bypassThrottle && now - lastLookupAt < 2500) {
      setLookupState("error");
      setMessage("Please wait a moment before another search.");
      return;
    }

    setLastLookupAt(now);
    setBarcode(normalizedBarcode);
    setLookupState("loading");
    setMessage(
      options?.bypassThrottle
        ? "Barcode captured. Searching Open Food Facts…"
        : "Searching Open Food Facts…",
    );
    setProduct(undefined);

    try {
      const result = await lookupProductByBarcode(normalizedBarcode);
      setProduct(result);

      if (result.status === "found") {
        setLookupState("found");
        setMessage("Product found. Click Apply Product Info to update this item.");
        return;
      }

      setLookupState("not_found");
      setMessage("No public record for this barcode.");
    } catch (err) {
      setLookupState("error");
      setMessage(
        err instanceof Error
          ? err.message
          : "Lookup failed. Check your connection and try again.",
      );
    }
  }

  const dark = variant === "dark";

  return (
    <div
      className={
        dark
          ? "space-y-3 rounded-lg border border-white/10 bg-[#0a1018] p-4 shadow-inner shadow-black/40"
          : "motion-panel space-y-3 rounded-[8px] border border-[#ededed] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.06)]"
      }
    >
      <div className="flex flex-col gap-1">
        <p
          className={
            dark
              ? "text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-500"
              : "text-xs uppercase tracking-[0.16em] text-slate-500"
          }
        >
          Barcode / product lookup
        </p>
        <p className={dark ? "text-xs text-slate-500" : "text-xs text-slate-500"}>
          Only the barcode is sent to Open Food Facts — not household names or private notes.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <label className="min-w-0 flex-1 space-y-1.5">
          <span className={dark ? "text-xs font-medium text-slate-400" : "text-xs font-medium text-slate-600"}>
            Barcode (UPC / EAN)
          </span>
          <Input
            aria-label="Barcode UPC or EAN"
            placeholder="Digits only"
            inputMode="numeric"
            autoComplete="off"
            className={
              dark
                ? "border-white/12 bg-[#060a0f] text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/40 focus:ring-cyan-500/25"
                : "rounded-[8px] border border-[#ededed] bg-white text-[#1f1f1f] shadow-[0_1px_1px_rgba(0,0,0,0.06)] placeholder:text-[#8e8e8e] focus:border-[#FE9F43]/55 focus:ring-[#FE9F43]/25"
            }
            value={barcode}
            onChange={(event) => setBarcode(event.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-2 md:pb-0.5">
          <Button
            type="button"
            aria-label="Scan barcode with camera"
            title="Scan barcode with camera"
            className={dark ? "min-h-10 gap-2 border-white/12 bg-white/[0.06] text-slate-100 hover:bg-white/10" : "min-h-10 gap-2"}
            variant="secondary"
            onClick={() => setScannerOpen(true)}
          >
            <Camera className="h-4 w-4 shrink-0" aria-hidden />
            Scan
          </Button>
          <Button
            type="button"
            disabled={lookupState === "loading"}
            className={
              dark
                ? "min-h-10 gap-2"
                : "min-h-10 gap-2 bg-gradient-to-r from-[#FF6F28] to-[#FF5325] font-semibold text-white shadow-[0_6px_15px_rgba(242,101,34,0.22)] hover:brightness-[1.03]"
            }
            variant="primary"
            onClick={() => void lookupBarcodeFromInput()}
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden />
            {lookupState === "loading" ? "Searching…" : "Search Product"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className={dark ? "font-medium text-slate-300" : "font-medium text-slate-800"}>
          Status:
        </span>
        <span
          className={
            lookupState === "error"
              ? dark
                ? "text-rose-300"
                : "text-rose-700"
              : lookupState === "not_found"
                ? dark
                  ? "text-amber-200"
                  : "text-amber-800"
                : lookupState === "found"
                  ? dark
                    ? "text-emerald-300"
                    : "text-emerald-800"
                  : dark
                    ? "text-slate-400"
                    : "text-slate-600"
          }
        >
          {message}
        </span>
      </div>

      {lookupState === "not_found" ? (
        <div
          className={
            dark
              ? "rounded-md border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-amber-50"
              : "rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"
          }
          role="status"
        >
          No product was found for this barcode. You can still enter details manually.
        </div>
      ) : null}

      {lookupState === "error" ? (
        <div
          className={
            dark
              ? "flex gap-2 rounded-md border border-rose-500/30 bg-rose-950/40 p-3 text-sm text-rose-100"
              : "rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900"
          }
          role="alert"
        >
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{message}</span>
        </div>
      ) : null}

      {product && product.status === "found" ? (
        <div
          className={
            dark
              ? "flex flex-col gap-3 rounded-md border border-white/10 bg-[#111922] p-3 sm:flex-row"
              : "motion-card flex gap-3 rounded-[8px] border border-[#ededed] bg-[#f8f9fa] p-3"
          }
        >
          <div
            className={
              dark
                ? "flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded border border-white/10 bg-black/50 sm:h-auto sm:w-28"
                : "flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-[#ededed] bg-white sm:h-auto sm:w-28"
            }
          >
            {product.imageUrl ? (
              <img
                alt=""
                className="max-h-full max-w-full object-contain"
                src={product.imageUrl}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <span className="px-2 text-center text-xs leading-snug text-slate-400">
                No product image found. Upload a photo or paste an image URL.
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className={dark ? "font-semibold text-slate-50" : "font-semibold text-slate-900"}>
                {product.name || "Unnamed product"}
              </p>
              <span
                className={
                  dark
                    ? "rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-cyan-200"
                    : "rounded border border-[#F26522]/35 bg-orange-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-orange-950"
                }
              >
                Open Food Facts
              </span>
            </div>
            <p className={`mt-1 text-sm ${dark ? "text-slate-400" : "text-slate-600"}`}>
              {(product.brand || "—") +
                " · " +
                (product.packageQuantity || product.quantity || "—") +
                " · " +
                (product.category || "—")}
            </p>
            <p className={`mt-1 font-mono text-xs ${dark ? "text-slate-500" : "text-slate-500"}`}>
              {product.barcode}
            </p>
            {product.description ? (
              <p
                className={`mt-2 line-clamp-4 text-xs leading-relaxed ${dark ? "text-slate-400" : "text-slate-600"}`}
              >
                {product.description}
              </p>
            ) : null}
            <Button
              className={
                dark
                  ? "mt-3 min-h-10 w-full sm:w-auto"
                  : "mt-3 min-h-10 w-full bg-gradient-to-r from-[#FF6F28] to-[#FF5325] font-semibold text-white shadow-[0_6px_15px_rgba(242,101,34,0.22)] hover:brightness-[1.03] sm:w-auto"
              }
              onClick={() => onApply(product)}
              variant="primary"
            >
              {applyLabel}
            </Button>
          </div>
        </div>
      ) : null}

      {scannerOpen ? (
        <Suspense
          fallback={
            <div
              className={
                dark
                  ? "rounded-md border border-white/10 bg-black/40 px-3 py-4 text-center text-sm text-slate-400"
                  : "rounded-lg border border-slate-200 px-3 py-4 text-center text-sm text-slate-500"
              }
            >
              Opening scanner…
            </div>
          }
        >
          <BarcodeScannerPanelLazy
            open={scannerOpen}
            onClose={() => setScannerOpen(false)}
            onDetected={(code) => {
              setScannerOpen(false);
              void lookupBarcodeWithCode(code, { bypassThrottle: true });
            }}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
