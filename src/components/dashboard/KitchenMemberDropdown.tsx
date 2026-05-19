import { ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { FamilyMember } from "../../data/familyData";
import { getMemberColor } from "../../lib/memberColors";
import { cn, getMemberFullName } from "../../lib/utils";

type Tone = "dark" | "light";

type Props = {
  members: FamilyMember[];
  value: string;
  onChange: (memberId: string) => void;
  ariaLabel: string;
  tone?: Tone;
  /** Shorter control for dense grids (e.g. Home week row). */
  compact?: boolean;
  className?: string;
};

export function KitchenMemberDropdown({
  members,
  value,
  onChange,
  ariaLabel,
  tone = "dark",
  compact = false,
  className,
}: Props) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const selected = members.find((m) => m.id === value);
  const selectedLabel = selected ? getMemberFullName(selected) : "—";
  const selectedColor = getMemberColor(selected);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({
      top: r.bottom + 6,
      left: r.left,
      width: Math.max(r.width, 140),
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const btnDark =
    "flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-white/[0.12] bg-white/[0.04] px-3 py-2 text-left text-[15px] font-semibold shadow-inner shadow-black/20 outline-none transition duration-150 ease-out hover:border-white/20 focus-visible:border-[#00B7C7]/50 focus-visible:ring-2 focus-visible:ring-[#00B7C7]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070A]";
  const btnDarkCompact =
    "flex min-h-[40px] w-full cursor-pointer items-center justify-between gap-1.5 rounded-[10px] border border-white/[0.12] bg-[#1B2028]/90 px-2 py-1.5 text-left text-[14px] font-semibold outline-none transition duration-150 ease-out hover:border-white/[0.18] focus-visible:border-[#00B7C7]/50 focus-visible:ring-2 focus-visible:ring-[#00B7C7]/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[#05070A]";
  const btnLight =
    "flex min-h-[44px] w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-900 shadow-sm outline-none transition hover:border-slate-300 focus-visible:border-[#FE9F43]/55 focus-visible:ring-2 focus-visible:ring-[#FE9F43]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white";
  const btnLightCompact =
    "flex min-h-[40px] w-full cursor-pointer items-center justify-between gap-1.5 rounded-[10px] border border-slate-200/95 bg-white px-2 py-1.5 text-left text-[13px] font-semibold text-slate-900 outline-none transition hover:border-slate-300 focus-visible:border-[#FE9F43]/55 focus-visible:ring-2 focus-visible:ring-[#FE9F43]/35 focus-visible:ring-offset-1 focus-visible:ring-offset-white";

  const menuShell =
    "max-h-[min(40vh,320px)] overflow-y-auto rounded-xl border py-1 shadow-2xl";
  const menuDark = "border-white/12 bg-[#141a22]";
  const menuLight = "border-slate-200 bg-white";

  const optBase =
    "flex w-full cursor-pointer px-3 py-2.5 text-left text-[15px] font-semibold transition hover:bg-white/[0.06]";
  const optLightHover = "hover:bg-slate-50";

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        className={cn(
          tone === "dark"
            ? compact
              ? btnDarkCompact
              : btnDark
            : compact
              ? btnLightCompact
              : btnLight,
          className,
        )}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="min-w-0 flex-1 truncate" style={{ color: selectedColor }}>
          {selectedLabel}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 opacity-80 transition duration-150 ease-out",
            open && "rotate-180",
            tone === "dark" ? "text-slate-400" : "text-slate-500",
          )}
          aria-hidden
        />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              id={listId}
              role="listbox"
              className={cn(menuShell, tone === "dark" ? menuDark : menuLight)}
              style={{
                position: "fixed",
                top: pos.top,
                left: pos.left,
                width: pos.width,
                zIndex: 200,
              }}
            >
              {members.map((m) => {
                const label = getMemberFullName(m);
                const col = getMemberColor(m);
                const active = m.id === value;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={cn(optBase, tone === "light" && optLightHover)}
                    style={{
                      color: col,
                      backgroundColor: active
                        ? tone === "dark"
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(15,23,42,0.06)"
                        : undefined,
                    }}
                    onClick={() => {
                      onChange(m.id);
                      setOpen(false);
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
