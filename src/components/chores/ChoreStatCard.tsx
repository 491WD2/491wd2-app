import { memo, useEffect, useRef, type ReactNode } from "react";
import { choreClasses, choreStatClass, type ChoreStatAccent } from "../../lib/choreUi";

export type ChoreStatCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: ChoreStatAccent;
};

/** Metric tile — value bumps with a short pop when the number changes. */
export const ChoreStatCard = memo(function ChoreStatCard({
  label,
  value,
  hint,
  accent = "violet",
}: ChoreStatCardProps) {
  const valueRef = useRef<HTMLParagraphElement>(null);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current === value) {
      return;
    }
    prevValue.current = value;
    const el = valueRef.current;
    if (!el) {
      return;
    }
    el.classList.remove(choreClasses.statValuePop);
    void el.offsetWidth;
    el.classList.add(choreClasses.statValuePop);
    const t = window.setTimeout(() => el.classList.remove(choreClasses.statValuePop), 420);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <article className={choreStatClass(accent)}>
      <p className="wd-chore-hh__stat-label">{label}</p>
      <p ref={valueRef} className="wd-chore-hh__stat-value">
        {value}
      </p>
      {hint ? <p className="wd-chore-hh__stat-hint">{hint}</p> : null}
    </article>
  );
});
