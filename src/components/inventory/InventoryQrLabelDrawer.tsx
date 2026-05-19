import { Copy, Download, Printer } from "lucide-react";
import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import type { PantryItem } from "../../data/familyData";
import { Button } from "../ui/Button";
import {
  buildInventoryItemUrl,
  buildInventoryLocationUrl,
  getInventoryQrLabelText,
  type InventoryQrLocationFilters,
} from "../../services/qrInventory";
import { getInventoryLocationLabel } from "../../pages/inventory/inventoryUtils";

export type QrPreviewTarget =
  | { kind: "item"; item: PantryItem }
  | { kind: "location"; location: InventoryQrLocationFilters; title?: string };

function formatQrDestination(target: QrPreviewTarget) {
  if (target.kind === "item") {
    return `Item: ${target.item.name} · ${getInventoryLocationLabel(target.item)}`;
  }
  return `Location: ${getInventoryQrLabelText({ location: target.location })}`;
}

function buildQrUrl(origin: string, target: QrPreviewTarget) {
  if (target.kind === "item") {
    return buildInventoryItemUrl(origin, target.item.id);
  }
  return buildInventoryLocationUrl(origin, target.location);
}

export type InventoryQrLabelDrawerProps = {
  origin: string;
  target: QrPreviewTarget;
  onClose: () => void;
};

/** QR label modal — lives in its own chunk with `qrcode.react`. */
export function InventoryQrLabelDrawer({
  origin,
  target,
  onClose,
}: InventoryQrLabelDrawerProps) {
  const url = buildQrUrl(origin, target);
  const title = getInventoryQrLabelText({
    title: target.kind === "location" ? target.title : undefined,
    location: target.kind === "location" ? target.location : undefined,
    item: target.kind === "item" ? target.item : undefined,
  });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  function downloadPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `familysite-inventory-qr-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
    a.click();
  }

  function printLabel() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 print:hidden">
      <button
        aria-label="Close QR label"
        className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[2px]"
        onClick={onClose}
        type="button"
      />
      <div className="fixed inset-0 z-50 flex items-end justify-center p-3 lg:items-center">
        <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4 sm:p-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                QR label
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
              <p className="mt-1 text-sm text-slate-600">{formatQrDestination(target)}</p>
            </div>
            <button
              className="min-h-11 min-w-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>

          <div className="bg-slate-50/40 p-4 sm:p-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="shrink-0">
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <QRCodeCanvas
                      value={url}
                      size={164}
                      includeMargin
                      bgColor="#ffffff"
                      fgColor="#000000"
                      ref={(node) => {
                        canvasRef.current = node;
                      }}
                    />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                    FamilySite Inventory
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{title}</p>
                  <p className="mt-1 text-sm text-slate-700">{formatQrDestination(target)}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    QR labels open inventory views in this app. Cross-device inventory requires cloud
                    sync.
                  </p>
                  <p className="mt-3 break-all rounded-md border border-slate-200 bg-slate-50 p-2 font-mono text-[0.72rem] text-slate-700">
                    {url}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-[0.7rem] uppercase tracking-[0.18em] text-slate-500">
                Generated {new Date().toLocaleDateString()}
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button onClick={() => void copy()} type="button" variant="secondary">
                <Copy className="h-4 w-4" />
                {copied ? "Copied" : "Copy link"}
              </Button>
              <Button onClick={downloadPng} type="button" variant="secondary">
                <Download className="h-4 w-4" />
                Download PNG
              </Button>
              <Button onClick={printLabel} type="button" variant="primary">
                <Printer className="h-4 w-4" />
                Print label
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
