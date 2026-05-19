import { useCallback, useMemo, useState } from "react";
import {
  LAYOUT_CATEGORY_LABELS,
  LAYOUT_CHOICES,
  LAYOUT_FILTER_OPTIONS,
  TEMPLATE_WORKBENCH_BACKEND_VIEW_ID,
  getLayoutChoiceLabels,
  resolveLayoutChoiceAction,
  type LayoutChoice,
  type LayoutChoiceCategory,
} from "../lib/layoutChoicesContent";

type FilterId = "all" | LayoutChoiceCategory;

export type LayoutChoicesPageProps = {
  onSelectBackendView?: (viewId: string) => void;
};

function matchesSearch(choice: LayoutChoice, q: string): boolean {
  if (!q.trim()) {
    return true;
  }
  const s = q.trim().toLowerCase();
  const hay = [
    choice.name,
    choice.path,
    choice.purpose,
    choice.whenToUse,
    ...choice.features,
    ...choice.mainSections,
    ...choice.relatedFiles,
    LAYOUT_CATEGORY_LABELS[choice.category],
    ...getLayoutChoiceLabels(choice),
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(s);
}

export default function LayoutChoicesPage({ onSelectBackendView }: LayoutChoicesPageProps) {
  const [filter, setFilter] = useState<FilterId>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [routePrepared, setRoutePrepared] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return LAYOUT_CHOICES.filter((c) => {
      if (filter !== "all" && c.category !== filter) {
        return false;
      }
      return matchesSearch(c, search);
    });
  }, [filter, search]);

  const selected = useMemo(
    () => LAYOUT_CHOICES.find((c) => c.id === selectedId) ?? null,
    [selectedId],
  );

  const openTemplateWorkbench = useCallback(() => {
    if (onSelectBackendView) {
      onSelectBackendView(TEMPLATE_WORKBENCH_BACKEND_VIEW_ID);
      return;
    }
    setSelectedId(null);
    setRoutePrepared(null);
  }, [onSelectBackendView]);

  const runLayoutChoiceAction = useCallback(
    (choice: LayoutChoice) => {
      setSelectedId(choice.id);
      setRoutePrepared(null);
      const action = resolveLayoutChoiceAction(choice);

      if (action.kind === "backend-view") {
        onSelectBackendView?.(action.viewId);
        return;
      }

      if (action.kind === "template-workbench") {
        onSelectBackendView?.(TEMPLATE_WORKBENCH_BACKEND_VIEW_ID);
        return;
      }

      if (action.kind === "my-build-route") {
        window.history.pushState(null, "", action.route);
        setRoutePrepared(action.route);
      }
    },
    [onSelectBackendView],
  );

  return (
    <div className="wd-layout-choices">
      <header className="wd-layout-choices__hero">
        <p className="wd-layout-choices__eyebrow">491WD · Page and layout catalog</p>
        <h1 className="wd-layout-choices__title">Layout Choices</h1>
        <p className="wd-layout-choices__lede">
          This page catalogs app shells, routes, builder surfaces, previews, and export paths. For actual visual
          template HTML previews, open Template Workbench.
        </p>
      </header>

      <section className="wd-layout-choices-callout" aria-labelledby="wd-layout-choices-callout-title">
        <div className="wd-layout-choices-callout__copy">
          <h2 id="wd-layout-choices-callout-title" className="wd-layout-choices-callout__title">
            Need visual templates?
          </h2>
          <p className="wd-layout-choices-callout__body">
            Use Template Workbench to preview Sneat/Pantry HTML pages, cards, tables, alerts, buttons, and layout
            examples.
          </p>
        </div>
        <button type="button" className="wd-layout-choices-callout__btn" onClick={openTemplateWorkbench}>
          {onSelectBackendView ? "Open Template Workbench" : "Use sidebar → Build Tools → Template Workbench"}
        </button>
      </section>

      <div className="wd-layout-choices__toolbar">
        <label className="wd-layout-choices__search">
          <span className="wd-visually-hidden">Search layouts</span>
          <input
            type="search"
            placeholder="Search by name, path, feature, or route…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
        </label>
        <div className="wd-layout-choices__filters" role="tablist" aria-label="Layout categories">
          {LAYOUT_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={filter === opt.id}
              className={
                filter === opt.id
                  ? "wd-layout-choices-filter wd-layout-choices-filter--active"
                  : "wd-layout-choices-filter"
              }
              onClick={() => setFilter(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="wd-layout-choices__layout">
        <div className="wd-layout-choices__grid-wrap">
          {filtered.length === 0 ? (
            <p className="wd-layout-choices__empty">No layouts match your filters.</p>
          ) : (
            <ul className="wd-layout-choices__grid">
              {filtered.map((choice) => {
                const action = resolveLayoutChoiceAction(choice);
                const labels = getLayoutChoiceLabels(choice);

                return (
                  <li key={choice.id}>
                    <article
                      className={
                        selectedId === choice.id
                          ? "wd-layout-choices-card wd-layout-choices-card--selected"
                          : "wd-layout-choices-card"
                      }
                    >
                      <button
                        type="button"
                        className="wd-layout-choices-card__select"
                        onClick={() => {
                          setSelectedId(choice.id);
                          setRoutePrepared(null);
                        }}
                      >
                        <span
                          className="wd-layout-choices-card__stripe"
                          data-category={choice.category}
                          aria-hidden
                        />
                        <div className="wd-layout-choices-card__body">
                          <p className="wd-layout-choices-card__category">
                            {LAYOUT_CATEGORY_LABELS[choice.category]}
                          </p>
                          <h2 className="wd-layout-choices-card__name">{choice.name}</h2>
                          <p className="wd-layout-choices-card__path">{choice.path}</p>
                          <p className="wd-layout-choices-card__desc">{choice.purpose}</p>
                          <ul className="wd-layout-choices-card__features">
                            {choice.features.slice(0, 4).map((f) => (
                              <li key={f}>{f}</li>
                            ))}
                          </ul>
                          <p className="wd-layout-choices-card__hint">
                            <span className="wd-layout-choices-card__hint-label">How to open</span>
                            {choice.howToView}
                          </p>
                        </div>
                      </button>
                      <div className="wd-layout-choices-card__footer">
                        <ul className="wd-layout-choices-card__labels" aria-label="Catalog labels">
                          {labels.map((label) => (
                            <li key={label}>{label}</li>
                          ))}
                        </ul>
                        <button
                          type="button"
                          className="wd-layout-choices-card__use"
                          onClick={() => runLayoutChoiceAction(choice)}
                        >
                          {action.buttonLabel}
                        </button>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className="wd-layout-choices-detail" aria-live="polite">
          {selected ? (
            <>
              <p className="wd-layout-choices-detail__eyebrow">Selected layout</p>
              <h2 className="wd-layout-choices-detail__title">{selected.name}</h2>
              <p className="wd-layout-choices-detail__meta">
                {LAYOUT_CATEGORY_LABELS[selected.category]}
                {selected.visibleInApp ? " · Reachable in running app" : " · Not mounted by default"}
              </p>
              <ul className="wd-layout-choices-detail__labels" aria-label="Catalog labels">
                {getLayoutChoiceLabels(selected).map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
              <button
                type="button"
                className="wd-layout-choices-detail__primary"
                onClick={() => runLayoutChoiceAction(selected)}
              >
                {resolveLayoutChoiceAction(selected).buttonLabel}
              </button>
              {routePrepared ? (
                <p className="wd-layout-choices-detail__route-note" role="status">
                  Route prepared at <code>{routePrepared}</code>. Switch to the My Build tab to open it in the
                  household app.
                </p>
              ) : null}
              <dl className="wd-layout-choices-detail__dl">
                <div>
                  <dt>Path</dt>
                  <dd>{selected.path}</dd>
                </div>
                <div>
                  <dt>Purpose</dt>
                  <dd>{selected.purpose}</dd>
                </div>
                <div>
                  <dt>When to use</dt>
                  <dd>{selected.whenToUse}</dd>
                </div>
                <div>
                  <dt>Main sections</dt>
                  <dd>
                    <ul>
                      {selected.mainSections.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
                <div>
                  <dt>How to open</dt>
                  <dd>{selected.howToView}</dd>
                </div>
                <div>
                  <dt>Next action</dt>
                  <dd>{selected.nextAction}</dd>
                </div>
              </dl>
              {selected.relatedFiles.length > 0 ? (
                <div className="wd-layout-choices-detail__related">
                  <h3>Related files</h3>
                  <ul>
                    {selected.relatedFiles.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : (
            <div className="wd-layout-choices-detail__placeholder">
              <p className="wd-layout-choices-detail__eyebrow">Details</p>
              <p className="wd-layout-choices-detail__placeholder-copy">
                Select a catalog card to see paths, related files, and the next step. For Sneat/Pantry HTML previews,
                use Template Workbench instead of this catalog.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
