import { useEffect, useRef } from "react";
// Vendor zip also at vendor/progressbar.js-master; runtime uses npm package.
import ProgressBar from "progressbar.js";

type Props = {
  /** 0–1 */
  value: number;
  label: string;
  color?: string;
  trailColor?: string;
  className?: string;
};

/**
 * Animated SVG circle from progressbar.js
 */
export function ProgressBarCircle({
  value,
  label,
  color = "#3b6ef5",
  trailColor = "rgba(59, 110, 245, 0.12)",
  className,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<{
    animate: (v: number, opts?: object) => void;
    destroy: () => void;
    set: (v: number) => void;
  } | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    host.innerHTML = "";
    // Avoid from/to color tween — rgba trail colors break progressbar.js interpolator (toFixed on undefined).
    const bar = new ProgressBar.Circle(host, {
      color,
      trailColor,
      strokeWidth: 8,
      trailWidth: 8,
      easing: "easeInOut",
      duration: 1200,
      text: {
        autoStyleContainer: false,
      },
      step(_state: unknown, circle: { path: SVGPathElement; setText: (t: string) => void; value: () => number }) {
        const pct = Math.round(circle.value() * 100);
        circle.setText(`${pct}%`);
      },
    }) as typeof barRef.current;

    barRef.current = bar;
    bar?.animate(Math.min(1, Math.max(0, value)));

    return () => {
      bar?.destroy();
      barRef.current = null;
    };
    // Recreate when colors change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color, trailColor]);

  useEffect(() => {
    barRef.current?.animate(Math.min(1, Math.max(0, value)));
  }, [value]);

  return (
    <div className={className}>
      <div ref={hostRef} className="aux-pb-circle" />
      <p className="aux-pb-label">{label}</p>
    </div>
  );
}

type LineProps = {
  value: number;
  label?: string;
  color?: string;
  trailColor?: string;
};

export function ProgressBarLine({
  value,
  label,
  color = "#12b76a",
  trailColor = "rgba(18, 183, 106, 0.15)",
}: LineProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<{
    animate: (v: number) => void;
    destroy: () => void;
  } | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.innerHTML = "";
    const bar = new ProgressBar.Line(host, {
      strokeWidth: 4,
      easing: "easeInOut",
      duration: 1000,
      color,
      trailColor,
      trailWidth: 4,
      svgStyle: { width: "100%", height: "100%" },
      text: {
        style: {
          color: "#101828",
          position: "absolute",
          right: "0",
          top: "-22px",
          padding: 0,
          margin: 0,
          transform: null,
          fontWeight: 700,
          fontSize: "0.8rem",
        },
        autoStyleContainer: false,
      },
      step(
        _state: unknown,
        line: { setText: (t: string) => void; value: () => number },
      ) {
        line.setText(`${Math.round(line.value() * 100)}%`);
      },
    }) as typeof barRef.current;

    barRef.current = bar;
    bar?.animate(Math.min(1, Math.max(0, value)));

    return () => {
      bar?.destroy();
      barRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color, trailColor]);

  useEffect(() => {
    barRef.current?.animate(Math.min(1, Math.max(0, value)));
  }, [value]);

  return (
    <div className="aux-pb-line-wrap">
      {label ? <p className="aux-pb-label aux-pb-label--left">{label}</p> : null}
      <div ref={hostRef} className="aux-pb-line" />
    </div>
  );
}
