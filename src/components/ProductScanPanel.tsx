import { Camera, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { isLikelyBarcode, normalizeBarcode } from "../lib/openFoodFactsClient";

type ProductScanPanelProps = {
  title?: string;
  lookupBusy: boolean;
  lookupMessage: string | null;
  onClose: () => void;
  onLookup: (barcode: string) => void | Promise<void>;
  onManualEntry: (barcode: string) => void;
};

type CameraPhase = "idle" | "starting" | "active" | "found" | "unsupported" | "permission_denied";

export function ProductScanPanel({
  title = "Scan product",
  lookupBusy,
  lookupMessage,
  onClose,
  onLookup,
  onManualEntry,
}: ProductScanPanelProps) {
  const titleId = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const openRef = useRef(true);
  const emitOnceRef = useRef(false);

  const [barcode, setBarcode] = useState("");
  const [scanNotice, setScanNotice] = useState<string | null>(null);
  const [cameraMessage, setCameraMessage] = useState<string | null>(null);
  const [phase, setPhase] = useState<CameraPhase>("idle");
  const [hasStream, setHasStream] = useState(false);

  const stopStream = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setHasStream(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const emitBarcode = useCallback(
    (raw: string) => {
      if (emitOnceRef.current || !openRef.current) {
        return;
      }
      const code = normalizeBarcode(raw);
      if (!isLikelyBarcode(code)) {
        return;
      }
      emitOnceRef.current = true;
      setBarcode(code);
      setPhase("found");
      stopStream();
      void onLookup(code);
    },
    [onLookup, stopStream],
  );

  useEffect(() => {
    openRef.current = true;
    emitOnceRef.current = false;
    setCameraMessage(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setPhase("unsupported");
      setCameraMessage("Camera barcode scanning is not available on this device. Enter the barcode manually.");
      return;
    }

    if (typeof window === "undefined" || !("BarcodeDetector" in window)) {
      setPhase("unsupported");
      setCameraMessage("Live camera scanning needs a browser with BarcodeDetector support. Enter the barcode manually.");
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
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
        if (cancelled || !openRef.current) {
          stream.getTracks().forEach((track) => track.stop());
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
      } catch (error: unknown) {
        const name = (error as { name?: string }).name;
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setPhase("permission_denied");
          setCameraMessage(
            "Camera permission was blocked. Enter the barcode manually or allow camera access in your browser.",
          );
        } else {
          setPhase("unsupported");
          setCameraMessage("Camera barcode scanning is not available. Enter the barcode manually.");
        }
      }
    })();

    return () => {
      cancelled = true;
      openRef.current = false;
      stopStream();
    };
  }, [stopStream]);

  useEffect(() => {
    if (!hasStream || phase !== "active") {
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

    const video = videoRef.current;
    if (!BarcodeDetectorCls || !video) {
      return;
    }

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
          if (raw) {
            emitBarcode(raw);
            return;
          }
        }
      } catch {
        /* continue scanning */
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
  }, [emitBarcode, hasStream, phase]);

  function handleClose() {
    openRef.current = false;
    stopStream();
    onClose();
  }

  function submitManualLookup() {
    const normalized = normalizeBarcode(barcode);
    if (!isLikelyBarcode(normalized)) {
      setScanNotice("Enter a valid 8-14 digit barcode.");
      return;
    }
    void onLookup(normalized);
  }

  return (
    <div className="wd-product-scan__backdrop" role="presentation" onClick={handleClose}>
      <div
        className="wd-product-scan"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="wd-product-scan__head">
          <h2 id={titleId} className="wd-product-scan__title">
            {title}
          </h2>
          <button type="button" className="wd-product-scan__close" aria-label="Close scan panel" onClick={handleClose}>
            <X aria-hidden className="wd-product-scan__close-icon" />
          </button>
        </div>

        <div className="wd-product-scan__body">
          <div className="wd-product-scan__camera-shell">
            <video
              ref={videoRef}
              className="wd-product-scan__video"
              autoPlay
              muted
              playsInline
              aria-label="Camera preview for barcode scanning"
            />
            <div className="wd-product-scan__camera-frame" aria-hidden />
            {phase === "starting" ? (
              <p className="wd-product-scan__camera-status">Starting camera…</p>
            ) : null}
            {phase === "active" ? (
              <p className="wd-product-scan__camera-status">Point the barcode at the camera</p>
            ) : null}
            {phase === "found" ? (
              <p className="wd-product-scan__camera-status">Barcode captured. Looking up product…</p>
            ) : null}
            {phase === "unsupported" || phase === "permission_denied" ? (
              <div className="wd-product-scan__camera-fallback">
                <Camera aria-hidden className="wd-product-scan__camera-icon" />
                <span>Manual entry available below</span>
              </div>
            ) : null}
          </div>

          <label className="wd-product-scan__field">
            <span>Enter barcode manually</span>
            <input
              className="wd-product-scan__input"
              value={barcode}
              onChange={(event) => setBarcode(event.target.value)}
              placeholder="Barcode number"
              inputMode="numeric"
              autoComplete="off"
            />
          </label>

          {scanNotice || cameraMessage || lookupMessage ? (
            <p className="wd-product-scan__message" role="status">
              {scanNotice || cameraMessage || lookupMessage}
            </p>
          ) : null}

          <div className="wd-product-scan__actions">
            <button
              type="button"
              className="wd-product-scan__btn wd-product-scan__btn--secondary"
              onClick={() => onManualEntry(barcode)}
              disabled={!barcode.trim()}
            >
              Enter manually
            </button>
            <button
              type="button"
              className="wd-product-scan__btn wd-product-scan__btn--primary"
              onClick={() => void submitManualLookup()}
              disabled={!barcode.trim() || lookupBusy}
            >
              {lookupBusy ? "Looking up…" : "Look up product"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
