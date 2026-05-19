import { useMemo, useState } from "react";
import {
  GALLERY_REFERENCE_PAGES,
  REFERENCE_PAGE_FILTER_OPTIONS,
  matchesReferenceSearch,
  type ReferencePageFilterId,
  type ReferencePageItem,
} from "../lib/referencePagesContent";

export default function ReferencePagesPage() {
  const [filter, setFilter] = useState<ReferencePageFilterId>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return GALLERY_REFERENCE_PAGES.filter((p) => {
      if (filter !== "all" && p.category !== filter) {
        return false;
      }
      return matchesReferenceSearch(p, search);
    });
  }, [filter, search]);

  const selected = useMemo(
    () => GALLERY_REFERENCE_PAGES.find((p) => p.id === selectedId) ?? null,
    [selectedId],
  );

  return (
    <div className="wd-ref-pages">
      <header className="wd-ref-pages__hero">
        <p className="wd-ref-pages__eyebrow">491WD · Visual references</p>
        <h1 className="wd-ref-pages__title">Reference pages</h1>
        <p className="wd-ref-pages__lede">
          Browse HTML demos and image assets copied from the repository into <code>public/reference-pages/</code>.
          Original files under <code>references/</code> are unchanged; this gallery uses served copies for thumbnails
          and preview.
        </p>
      </header>

      <div className="wd-ref-pages__toolbar">
        <label className="wd-ref-pages__search">
          <span className="wd-visually-hidden">Search references</span>
          <input
            type="search"
            placeholder="Search by name, path, category, or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
        </label>
        <div className="wd-ref-pages__filters" role="tablist" aria-label="Reference categories">
          {REFERENCE_PAGE_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={filter === opt.id}
              className={
                filter === opt.id ? "wd-ref-pages-filter wd-ref-pages-filter--active" : "wd-ref-pages-filter"
              }
              onClick={() => setFilter(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="wd-ref-pages__layout">
        <div className="wd-ref-pages__grid-wrap">
          {filtered.length === 0 ? (
            <p className="wd-ref-pages__empty">No references match your filters.</p>
          ) : (
            <ul className="wd-ref-pages__grid">
              {filtered.map((item) => (
                <li key={item.id}>
                  <ReferenceCard
                    item={item}
                    selected={selectedId === item.id}
                    onSelect={() => setSelectedId(item.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="wd-ref-pages-detail" aria-live="polite">
          {selected ? (
            <ReferenceDetail item={selected} />
          ) : (
            <div className="wd-ref-pages-detail__placeholder">
              <p className="wd-ref-pages-detail__eyebrow">Details</p>
              <p className="wd-ref-pages-detail__placeholder-copy">
                Select a card to see the file path, description, and preview or open the demo in a new tab.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function ReferenceCard({
  item,
  selected,
  onSelect,
}: {
  item: ReferencePageItem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={selected ? "wd-ref-pages-card wd-ref-pages-card--selected" : "wd-ref-pages-card"}
      onClick={onSelect}
    >
      <div className="wd-ref-pages-card__thumb-wrap">
        {item.kind === "image" && item.thumbnailUrl ? (
          <img className="wd-ref-pages-card__thumb" src={item.thumbnailUrl} alt="" loading="lazy" />
        ) : (
          <div className="wd-ref-pages-card__thumb wd-ref-pages-card__thumb--html" aria-hidden>
            <span className="wd-ref-pages-card__html-label">HTML</span>
          </div>
        )}
      </div>
      <div className="wd-ref-pages-card__body">
        <p className="wd-ref-pages-card__category">{item.category}</p>
        <h2 className="wd-ref-pages-card__name">{item.name}</h2>
        <p className="wd-ref-pages-card__path">{item.publicPath}</p>
        <p className="wd-ref-pages-card__desc">{item.whatItShows}</p>
      </div>
    </button>
  );
}

function ReferenceDetail({ item }: { item: ReferencePageItem }) {
  const demoHref = item.kind === "html" && item.canOpenInBrowser ? item.publicUrl : null;

  return (
    <>
      <p className="wd-ref-pages-detail__eyebrow">Selected reference</p>
      <h2 className="wd-ref-pages-detail__title">{item.name}</h2>
      <p className="wd-ref-pages-detail__meta">
        {item.category} · {item.fileType}
        {item.canOpenInBrowser ? " · Opens in browser" : " · Preview only"}
      </p>

      <div className="wd-ref-pages-detail__preview">
        {item.kind === "image" && item.thumbnailUrl ? (
          <img className="wd-ref-pages-detail__img" src={item.thumbnailUrl} alt={item.name} loading="lazy" />
        ) : item.kind === "html" ? (
          <iframe className="wd-ref-pages-detail__iframe" title={item.name} src={item.publicUrl} />
        ) : null}
      </div>

      <dl className="wd-ref-pages-detail__dl">
        <div>
          <dt>Source (repo)</dt>
          <dd>
            <code className="wd-ref-pages-detail__code">{item.originalPath}</code>
          </dd>
        </div>
        <div>
          <dt>Served path</dt>
          <dd>
            <code className="wd-ref-pages-detail__code">{item.publicPath}</code>
          </dd>
        </div>
        <div>
          <dt>URL</dt>
          <dd>
            <code className="wd-ref-pages-detail__code">{item.publicUrl}</code>
          </dd>
        </div>
        <div>
          <dt>Description</dt>
          <dd>{item.whatItShows}</dd>
        </div>
      </dl>

      {demoHref ? (
        <p className="wd-ref-pages-detail__actions">
          <a className="wd-ref-pages-detail__demo-link" href={demoHref} target="_blank" rel="noreferrer">
            Open demo page
          </a>
        </p>
      ) : null}
    </>
  );
}
