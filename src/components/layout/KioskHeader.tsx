import { Menu, Plus, ScanLine, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useKioskShell } from "./KioskShellContext";

export type KioskHeaderMember = {
  id: string;
  label: string;
};

export type KioskHeaderProps = {
  onOpenMenu?: () => void;
  members?: KioskHeaderMember[];
  activeMemberId?: string | null;
  onMemberChange?: (memberId: string) => void;
  /** Fallback when no context actions registered */
  defaultSearchPlaceholder?: string;
  onScanFallback?: () => void;
  onAddFallback?: () => void;
};

export function KioskHeader({
  onOpenMenu,
  members = [],
  activeMemberId,
  onMemberChange,
  defaultSearchPlaceholder = "Search household…",
  onScanFallback,
  onAddFallback,
}: KioskHeaderProps) {
  const shell = useKioskShell();
  const actions = shell?.actions ?? {};
  const [clock, setClock] = useState(() => new Date());
  const [localSearch, setLocalSearch] = useState(actions.searchValue ?? "");

  useEffect(() => {
    const id = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setLocalSearch(actions.searchValue ?? "");
  }, [actions.searchValue]);

  const clockTime = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(clock);
  const clockDate = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(clock);

  const showSearch = Boolean(actions.onSearchChange);
  const showScan = actions.showScan !== false && (actions.onScan || onScanFallback);
  const showAdd = actions.showAdd !== false && (actions.onAdd || onAddFallback);

  return (
    <header className="fh-kiosk-header">
      {onOpenMenu ? (
        <button
          type="button"
          className="fh-kiosk-header__menu"
          aria-label="Open menu"
          onClick={onOpenMenu}
        >
          <Menu className="h-6 w-6" aria-hidden />
        </button>
      ) : null}

      {showSearch ? (
        <label className="fh-kiosk-header__search">
          <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
          <input
            type="search"
            value={localSearch}
            placeholder={actions.searchPlaceholder ?? defaultSearchPlaceholder}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              actions.onSearchChange?.(e.target.value);
            }}
            aria-label="Search"
          />
        </label>
      ) : (
        <div className="flex-1" />
      )}

      <div className="fh-kiosk-header__actions">
        {showScan ? (
          <button
            type="button"
            className="fh-kiosk-header__btn fh-kiosk-header__btn--scan"
            onClick={() => (actions.onScan ?? onScanFallback)?.()}
          >
            <ScanLine className="h-5 w-5" aria-hidden />
            <span className="hidden sm:inline">Scan</span>
          </button>
        ) : null}
        {showAdd ? (
          <button
            type="button"
            className="fh-kiosk-header__btn fh-kiosk-header__btn--add"
            onClick={() => (actions.onAdd ?? onAddFallback)?.()}
          >
            <Plus className="h-5 w-5" aria-hidden />
            <span className="hidden sm:inline">{actions.addLabel ?? "Add"}</span>
          </button>
        ) : null}

        <div className="fh-kiosk-header__clock" aria-live="polite">
          <div className="fh-kiosk-header__clock-time">{clockTime}</div>
          <div className="fh-kiosk-header__clock-date">{clockDate}</div>
        </div>

        {members.length > 0 && onMemberChange ? (
          <select
            className="fh-kiosk-header__member"
            value={activeMemberId ?? ""}
            onChange={(e) => onMemberChange(e.target.value)}
            aria-label="Active family member"
          >
            <option value="">All members</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        ) : null}
      </div>
    </header>
  );
}
