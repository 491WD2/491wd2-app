import { useCallback, useEffect, useMemo, useState } from "react";

export const KIOSK_RELEASE_CHECKLIST_STORAGE_KEY = "491wd-kiosk-release-checklist";

export type KioskReleaseChecklistStatus = "unset" | "pass" | "needs-fix";

export type KioskReleaseChecklistRow = {
  id: string;
  label: string;
  status: KioskReleaseChecklistStatus;
  notes: string;
};

export type KioskReleaseChecklistSection = {
  id: string;
  title: string;
  rows: KioskReleaseChecklistRow[];
};

export const KIOSK_RELEASE_CHECKLIST_DEFAULT: KioskReleaseChecklistSection[] = [
  {
    id: "sidebar",
    title: "Sidebar navigation",
    rows: [
      {
        id: "sidebar-primary-links",
        label: "Home, Shopping, Pantry, Inventory, Product Library, and Scan Product open the correct page",
        status: "unset",
        notes: "",
      },
      {
        id: "sidebar-collapse",
        label: "Sidebar collapse/expand keeps layout usable and persists after reload",
        status: "unset",
        notes: "",
      },
      {
        id: "sidebar-history",
        label: "Browser back and forward restore the expected page and sidebar selection",
        status: "unset",
        notes: "",
      },
    ],
  },
  {
    id: "home",
    title: "Home",
    rows: [
      {
        id: "home-loads",
        label: "Home dashboard loads without console errors",
        status: "unset",
        notes: "",
      },
      {
        id: "home-cards",
        label: "Quick action cards navigate to the intended modules",
        status: "unset",
        notes: "",
      },
    ],
  },
  {
    id: "shopping",
    title: "Shopping",
    rows: [
      {
        id: "shopping-layout",
        label: "Category grid fits four across on Surface Pro landscape",
        status: "unset",
        notes: "",
      },
      {
        id: "shopping-drawer",
        label: "Product row opens inline add drawer; Add to Shopping List updates the cart",
        status: "unset",
        notes: "",
      },
      {
        id: "shopping-most-used",
        label: "Most Used, search, and right shopping list panel work without overlap",
        status: "unset",
        notes: "",
      },
    ],
  },
  {
    id: "pantry",
    title: "Pantry",
    rows: [
      {
        id: "pantry-categories",
        label: "Category grid filters the pantry item list",
        status: "unset",
        notes: "",
      },
      {
        id: "pantry-drawer",
        label: "Item drawer supports add stock, use item, and add to shopping",
        status: "unset",
        notes: "",
      },
    ],
  },
  {
    id: "inventory",
    title: "Inventory",
    rows: [
      {
        id: "inventory-kiosk",
        label: "Inventory kiosk categories, product list, and detail drawer work",
        status: "unset",
        notes: "",
      },
      {
        id: "inventory-save",
        label: "Save commits staged quantity changes",
        status: "unset",
        notes: "",
      },
      {
        id: "inventory-activity",
        label: "Recent activity and Undo last change work for add stock / use item",
        status: "unset",
        notes: "",
      },
    ],
  },
  {
    id: "product-library",
    title: "Product Library",
    rows: [
      {
        id: "library-filters",
        label: "Search, category, store, and status filters behave correctly",
        status: "unset",
        notes: "",
      },
      {
        id: "library-actions",
        label: "Scan Product, New Product, and card actions (edit, shopping, pantry, OFF) work",
        status: "unset",
        notes: "",
      },
      {
        id: "library-duplicates",
        label: "Duplicate review: Review, Merge confirm, and Keep separate work",
        status: "unset",
        notes: "",
      },
    ],
  },
  {
    id: "scan-product",
    title: "Scan Product",
    rows: [
      {
        id: "scan-shopping",
        label: "Scan Product from Shopping opens the scan panel and lookup works",
        status: "unset",
        notes: "",
      },
      {
        id: "scan-inventory",
        label: "Scan Product from Inventory / Pantry opens the scan panel",
        status: "unset",
        notes: "",
      },
      {
        id: "scan-manual",
        label: "Manual barcode entry creates or opens a product draft",
        status: "unset",
        notes: "",
      },
    ],
  },
  {
    id: "product-detail",
    title: "Product Detail",
    rows: [
      {
        id: "detail-edit-save",
        label: "Edit and save product changes persist in the library",
        status: "unset",
        notes: "",
      },
      {
        id: "detail-shopping-pantry",
        label: "Add to Shopping and Add to Pantry work from Product Detail",
        status: "unset",
        notes: "",
      },
      {
        id: "detail-off",
        label: "Update from OpenFoodFacts enriches barcode products when available",
        status: "unset",
        notes: "",
      },
    ],
  },
  {
    id: "surface-pro",
    title: "Surface Pro layout",
    rows: [
      {
        id: "surface-overflow",
        label: "No horizontal overflow at 1368px landscape on Shopping, Inventory, and Product Library",
        status: "unset",
        notes: "",
      },
      {
        id: "surface-panels",
        label: "Sticky summary panels and grids fit the viewport without clipped controls",
        status: "unset",
        notes: "",
      },
    ],
  },
  {
    id: "persistence",
    title: "localStorage persistence",
    rows: [
      {
        id: "persist-cart",
        label: "Shopping cart items survive page reload",
        status: "unset",
        notes: "",
      },
      {
        id: "persist-inventory-activity",
        label: "Inventory activity history survives page reload",
        status: "unset",
        notes: "",
      },
      {
        id: "persist-sidebar",
        label: "Sidebar collapsed state and checklist state survive reload",
        status: "unset",
        notes: "",
      },
    ],
  },
];

function cloneDefaultSections(): KioskReleaseChecklistSection[] {
  return KIOSK_RELEASE_CHECKLIST_DEFAULT.map((section) => ({
    ...section,
    rows: section.rows.map((row) => ({ ...row })),
  }));
}

function isChecklistStatus(value: unknown): value is KioskReleaseChecklistStatus {
  return value === "unset" || value === "pass" || value === "needs-fix";
}

function mergeWithDefaults(saved: KioskReleaseChecklistSection[]): KioskReleaseChecklistSection[] {
  const defaults = cloneDefaultSections();
  const savedBySection = new Map(saved.map((section) => [section.id, section]));

  return defaults.map((section) => {
    const savedSection = savedBySection.get(section.id);
    if (!savedSection) {
      return section;
    }
    const savedRows = new Map(savedSection.rows.map((row) => [row.id, row]));
    return {
      ...section,
      rows: section.rows.map((row) => {
        const savedRow = savedRows.get(row.id);
        if (!savedRow) {
          return row;
        }
        return {
          ...row,
          status: isChecklistStatus(savedRow.status) ? savedRow.status : row.status,
          notes: typeof savedRow.notes === "string" ? savedRow.notes : row.notes,
        };
      }),
    };
  });
}

export function loadKioskReleaseChecklist(): KioskReleaseChecklistSection[] {
  if (typeof window === "undefined") {
    return cloneDefaultSections();
  }

  try {
    const raw = window.localStorage.getItem(KIOSK_RELEASE_CHECKLIST_STORAGE_KEY);
    if (!raw) {
      return cloneDefaultSections();
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return cloneDefaultSections();
    }
    const sections = parsed.filter((entry): entry is KioskReleaseChecklistSection => {
      if (!entry || typeof entry !== "object") {
        return false;
      }
      const record = entry as KioskReleaseChecklistSection;
      return typeof record.id === "string" && typeof record.title === "string" && Array.isArray(record.rows);
    });
    return mergeWithDefaults(sections);
  } catch {
    return cloneDefaultSections();
  }
}

export function saveKioskReleaseChecklist(sections: KioskReleaseChecklistSection[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(KIOSK_RELEASE_CHECKLIST_STORAGE_KEY, JSON.stringify(sections));
}

export function KioskReleaseChecklistPage() {
  const [sections, setSections] = useState<KioskReleaseChecklistSection[]>(() => loadKioskReleaseChecklist());
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  useEffect(() => {
    saveKioskReleaseChecklist(sections);
    setLastSavedAt(new Date().toISOString());
  }, [sections]);

  const summary = useMemo(() => {
    const rows = sections.flatMap((section) => section.rows);
    const pass = rows.filter((row) => row.status === "pass").length;
    const needsFix = rows.filter((row) => row.status === "needs-fix").length;
    const unset = rows.filter((row) => row.status === "unset").length;
    return { total: rows.length, pass, needsFix, unset };
  }, [sections]);

  const setRowStatus = useCallback((sectionId: string, rowId: string, status: KioskReleaseChecklistStatus) => {
    setSections((current) =>
      current.map((section) =>
        section.id !== sectionId
          ? section
          : {
              ...section,
              rows: section.rows.map((row) =>
                row.id === rowId ? { ...row, status: row.status === status ? "unset" : status } : row,
              ),
            },
      ),
    );
  }, []);

  const setRowNotes = useCallback((sectionId: string, rowId: string, notes: string) => {
    setSections((current) =>
      current.map((section) =>
        section.id !== sectionId
          ? section
          : {
              ...section,
              rows: section.rows.map((row) => (row.id === rowId ? { ...row, notes } : row)),
            },
      ),
    );
  }, []);

  function resetChecklist() {
    if (
      !window.confirm(
        "Reset the entire release checklist? All Pass / Needs Fix selections and notes will be cleared.",
      )
    ) {
      return;
    }
    setSections(cloneDefaultSections());
  }

  const savedLabel = lastSavedAt
    ? new Date(lastSavedAt).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="wd-kiosk-release-checklist">
      <header className="wd-kiosk-release-checklist__header">
        <div className="wd-kiosk-release-checklist__header-copy">
          <h1>Release Checklist</h1>
          <p>Surface Pro kiosk sign-off before client use. Mark each item Pass or Needs Fix and add notes.</p>
        </div>
        <dl className="wd-kiosk-release-checklist__summary">
          <div>
            <dt>Pass</dt>
            <dd>{summary.pass}</dd>
          </div>
          <div>
            <dt>Needs fix</dt>
            <dd>{summary.needsFix}</dd>
          </div>
          <div>
            <dt>Remaining</dt>
            <dd>{summary.unset}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>{summary.total}</dd>
          </div>
        </dl>
        <div className="wd-kiosk-release-checklist__header-actions">
          {savedLabel ? (
            <p className="wd-kiosk-release-checklist__saved" role="status">
              Saved {savedLabel}
            </p>
          ) : null}
          <button type="button" className="wd-kiosk-release-checklist__reset" onClick={resetChecklist}>
            Reset checklist
          </button>
        </div>
      </header>

      <div className="wd-kiosk-release-checklist__sections">
        {sections.map((section) => (
          <section key={section.id} className="wd-kiosk-release-checklist__section" aria-labelledby={`wd-release-${section.id}`}>
            <h2 id={`wd-release-${section.id}`} className="wd-kiosk-release-checklist__section-title">
              {section.title}
            </h2>
            <ul className="wd-kiosk-release-checklist__rows">
              {section.rows.map((row) => (
                <li key={row.id} className="wd-kiosk-release-checklist__row">
                  <p className="wd-kiosk-release-checklist__row-label">{row.label}</p>
                  <div className="wd-kiosk-release-checklist__row-controls">
                    <div className="wd-kiosk-release-checklist__status-group" role="group" aria-label={`Status for ${row.label}`}>
                      <button
                        type="button"
                        className={
                          row.status === "pass"
                            ? "wd-kiosk-release-checklist__status wd-kiosk-release-checklist__status--pass wd-kiosk-release-checklist__status--active"
                            : "wd-kiosk-release-checklist__status wd-kiosk-release-checklist__status--pass"
                        }
                        aria-pressed={row.status === "pass"}
                        onClick={() => setRowStatus(section.id, row.id, "pass")}
                      >
                        Pass
                      </button>
                      <button
                        type="button"
                        className={
                          row.status === "needs-fix"
                            ? "wd-kiosk-release-checklist__status wd-kiosk-release-checklist__status--fix wd-kiosk-release-checklist__status--active"
                            : "wd-kiosk-release-checklist__status wd-kiosk-release-checklist__status--fix"
                        }
                        aria-pressed={row.status === "needs-fix"}
                        onClick={() => setRowStatus(section.id, row.id, "needs-fix")}
                      >
                        Needs fix
                      </button>
                    </div>
                    <label className="wd-kiosk-release-checklist__notes">
                      <span>Notes</span>
                      <textarea
                        value={row.notes}
                        onChange={(event) => setRowNotes(section.id, row.id, event.target.value)}
                        placeholder="Optional notes"
                        rows={2}
                      />
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
