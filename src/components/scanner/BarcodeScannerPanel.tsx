import { BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { Keyboard, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Field";
import { DS_INPUT } from "../../lib/designSystem";
import { isLikelyBarcode, normalizeBarcode } from "../../services/openFoodFacts";
import { cn } from "../../lib/utils";

type BarcodeScannerPanelProps = {
  open: boolean;
  onClose: () => void;
  /** Called once when a barcode string is accepted (from scan or manual entry). */
  onDetected: (barcode: string) => void;
};

type ScannerPhase =
  | "idle"
  | "starting"
  | "active"
  | "found"
  | "unsupported"
  | "permission_denied";

export function BarcodeScannerPanel({ open, onClose, onDetected }: BarcodeScannerPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const openRef = useRef(open);
  const zxingControlsRef = useRef<IScannerControls | null>(null);
  const emitOnceRef = useRef(false);

  const [manual, setManual] = useState("");
  const [cameraMessage, setCameraMessage] = useState<string | null>(null);
  const [phase, setPhase] = useState<ScannerPhase>("idle");
  const [hasStream, setHasStream] = useState(false);

  const stopStream = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    try {
      zxingControlsRef.current?.stop();
    } catch {
      /* ignore */
    }
    zxingControlsRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setHasStream(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) {
      emitOnceRef.current = false;
      stopStream();
      setManual("");
      setCameraMessage(null);
      setPhase("idle");
      return;
    }

    emitOnceRef.current = false;
    setCameraMessage(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setPhase("unsupported");
      setCameraMessage(
        "Camera barcode scanning is not available. Type the barcode manually.",
      );
      return;
    }

    setPhase("starting");

    let cancelled = false;

    void (async () => {
      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } },
            audio: false,
          });
        } catch {
          /* Surfaces / some tablets: no “environment” camera — fall back to any available camera. */
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
        if (cancelled || !openRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => undefined);
        }
        setHasStream(true);
        setPhase("active");
      } catch (e: unknown) {
        const err = e as { name?: string };
        if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
          setPhase("permission_denied");
          setCameraMessage(
            "Camera permission was blocked. Type the barcode manually or allow camera access in your browser.",
          );
        } else {
          setPhase("unsupported");
          setCameraMessage(
            "Camera barcode scanning is not available. Type the barcode manually.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open, stopStream]);

  function emitBarcode(raw: string) {
    if (emitOnceRef.current || !openRef.current) {
      return;
    }
    const code = normalizeBarcode(raw);
    if (!isLikelyBarcode(code)) {
      return;
    }
    emitOnceRef.current = true;
    setPhase("found");
    stopStream();
    onDetected(code);
  }

  /** Native BarcodeDetector loop — runs until barcode found or panel closes. */
  useEffect(() => {
    if (!open || !hasStream || phase !== "active") {
      return;
    }
    if (typeof window === "undefined" || !("BarcodeDetector" in window)) {
      return;
    }

    const BarcodeDetectorCls = (
      window as unknown as {
        BarcodeDetector?: new (opts?: { formats?: string[] }) => {
          detect: (image: ImageBitmap) => Promise<Array<{ rawValue?: string }>>;
        };
      }
    ).BarcodeDetector;

    if (!BarcodeDetectorCls || !videoRef.current || !streamRef.current) {
      return;
    }

    const video = videoRef.current;
    const detector = new BarcodeDetectorCls({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "qr_code"],
    });

    let cancelled = false;

    const tick = async () => {
      if (cancelled || !openRef.current || emitOnceRef.current) {
        return;
      }
      try {
        if (video.readyState >= 2) {
          const bitmap = await createImageBitmap(video);
          const codes = await detector.detect(bitmap);
          bitmap.close?.();
          const raw = codes[0]?.rawValue?.trim();
          if (raw && isLikelyBarcode(normalizeBarcode(raw))) {
            emitBarcode(raw);
            return;
          }
        }
      } catch {
        /* frame failed — continue */
      }
      rafRef.current = requestAnimationFrame(() => {
        void tick();
      });
    };

    void tick();

    return () => {
      cancelled = true;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, [open, hasStream, phase]);

  /** ZXing continuous decode when BarcodeDetector is missing. */
  useEffect(() => {
    if (!open || !hasStream || phase !== "active") {
      return;
    }
    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      return;
    }

    const video = videoRef.current;
    if (!video) {
      return;
    }

    let cancelled = false;
    const reader = new BrowserMultiFormatReader();

    void reader
      .decodeFromVideoElement(video, (result, _err, controls) => {
        if (cancelled || !openRef.current || emitOnceRef.current) {
          return;
        }
        if (result) {
          const text = result.getText()?.trim();
          if (text && isLikelyBarcode(normalizeBarcode(text))) {
            try {
              controls.stop();
            } catch {
              /* ignore */
            }
            emitBarcode(text);
          }
        }
      })
      .then((controls) => {
        if (!cancelled) {
          zxingControlsRef.current = controls;
        }
      })
      .catch(() => {
        if (!cancelled && openRef.current) {
          setCameraMessage(
            "Could not start the barcode reader. Type the barcode manually.",
          );
        }
      });

    return () => {
      cancelled = true;
      try {
        zxingControlsRef.current?.stop();
      } catch {
        /* ignore */
      }
      zxingControlsRef.current = null;
    };
  }, [open, hasStream, phase]);

  function submitManual() {
    const n = normalizeBarcode(manual);
    if (!isLikelyBarcode(n)) {
      setCameraMessage("Enter a valid 8–14 digit barcode.");
      return;
    }
    emitBarcode(n);
  }

  function handleClose() {
    stopStream();
    onClose();
  }

  if (!open) {
    return null;
  }

  const statusBanner = (() => {
    if (phase === "starting") {
      return "Starting camera…";
    }
    if (phase === "found") {
      return "Barcode found. Searching product…";
    }
    if (phase === "active" && hasStream) {
      return "Point the camera at the barcode.";
    }
    if (phase === "unsupported") {
      return "Camera barcode scanning is not available. Type the barcode manually.";
    }
    if (phase === "permission_denied") {
      return "Camera permission was blocked. Type the barcode manually or allow camera access in your browser.";
    }
    return "";
  })();

  const showVideoOverlay =
    phase === "starting" || (phase === "active" && !hasStream);

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto overscroll-contain bg-[#1f1f1f]/35 p-3 backdrop-blur-[3px] sm:p-4">
      <div
        className={cn(
          "my-auto flex w-full max-w-[min(100%,28rem)] flex-col gap-3 rounded-[12px] border border-[#ededed] bg-white p-4 shadow-[0_12px_40px_rgba(36,37,38,0.14)]",
          "max-h-[min(100dvh-1.5rem,820px)] min-h-0 overflow-y-auto",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="barcode-scanner-title"
      >
        {statusBanner ? (
          <p className="rounded-[8px] border border-[#FF6F28]/22 bg-[#fff8f4] px-3 py-2.5 text-center text-[13px] font-medium leading-snug text-[#1f1f1f]">
            {statusBanner}
          </p>
        ) : null}

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p id="barcode-scanner-title" className="text-[16px] font-semibold text-[#1f1f1f]">
              Scan barcode
            </p>
            <p className="mt-0.5 text-[12px] font-normal leading-snug text-[#637381]">
              Camera runs only while this panel is open. Close when finished.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="min-h-11 shrink-0 border-[#ededed] px-3 font-semibold text-[#1f1f1f]"
            aria-label="Close scanner"
            title="Close scanner"
            onClick={handleClose}
          >
            <X className="h-5 w-5" aria-hidden />
            Close
          </Button>
        </div>

        <div
          className={cn(
            "relative mx-auto w-full max-h-[min(48dvh,420px)] overflow-hidden rounded-[8px] border border-[#ededed] bg-black",
            "aspect-[4/3] max-w-full shadow-inner shadow-black/40",
          )}
        >
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            playsInline
            muted
            autoPlay
          />
          {showVideoOverlay ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4 text-center text-[13px] text-[#f7f7f7]">
              {phase === "starting" ? "Starting camera…" : "Connecting preview…"}
            </div>
          ) : null}
        </div>

        {cameraMessage && phase !== "active" ? (
          <p className="rounded-[8px] border border-[#FF6F28]/25 bg-[#fff8f4] px-3 py-2 text-[13px] leading-snug text-[#575757]">
            {cameraMessage}
          </p>
        ) : null}

        <div className="rounded-[8px] border border-[#ededed] bg-[#fafafa] p-3">
          <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#8e8e8e]">
            <Keyboard className="h-4 w-4 shrink-0 text-[#F26522]" aria-hidden />
            Manual barcode
          </p>
          <label className="block space-y-1.5 text-[14px] font-medium text-[#1f1f1f]">
            <span className="text-[#637381]">Type digits if the camera is unavailable</span>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                aria-label="Manual barcode entry"
                className={cn(DS_INPUT)}
                inputMode="numeric"
                placeholder="8–14 digits"
                autoComplete="off"
                value={manual}
                onChange={(e) => setManual(e.target.value)}
              />
              <Button
                type="button"
                variant="primary"
                className="min-h-11 shrink-0 px-6 text-[15px] font-semibold"
                onClick={submitManual}
              >
                Use barcode
              </Button>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
