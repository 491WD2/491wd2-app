import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TEMPLATE_WORKBENCH_ALL_TAGS,
  TEMPLATE_WORKBENCH_CATALOG,
  TEMPLATE_WORKBENCH_CATEGORY_ORDER,
  itemMatchesTags,
  matchesWorkbenchSearch,
  type TemplateWorkbenchCategory,
  type TemplateWorkbenchItem,
} from "../lib/templateWorkbenchContent";
import {
  TEMPLATE_WORKBENCH_USE_CASES,
  hasUseCaseAssignments,
  loadCandidatesMap,
  loadMarkedIds,
  loadNotesMap,
  loadSelectedTemplateId,
  saveCandidatesMap,
  saveMarkedIds,
  saveNotesMap,
  saveSelectedTemplateId,
  type TemplateWorkbenchCandidatesMap,
  type TemplateWorkbenchUseCaseKey,
} from "../lib/templateWorkbenchStorage";

/** Sandboxed embed: no scripts/modals; same-origin keeps relative CSS/asset URLs working. */
const TEMPLATE_WORKBENCH_IFRAME_SANDBOX = "allow-same-origin";

function useWorkbenchPersistence() {
  const [notesMap, setNotesMap] = useState<Record<string, string>>(() => loadNotesMap());
  const [candidatesMap, setCandidatesMap] = useState<TemplateWorkbenchCandidatesMap>(() => loadCandidatesMap());
  const [markedIds, setMarkedIds] = useState<string[]>(() => loadMarkedIds());

  const persistNotes = useCallback((next: Record<string, string>) => {
    setNotesMap(next);
    saveNotesMap(next);
  }, []);

  const persistCandidates = useCallback((next: TemplateWorkbenchCandidatesMap) => {
    setCandidatesMap(next);
    saveCandidatesMap(next);
  }, []);

  const persistMarked = useCallback((next: string[]) => {
    setMarkedIds(next);
    saveMarkedIds(next);
  }, []);

  return { notesMap, persistNotes, candidatesMap, persistCandidates, markedIds, persistMarked };
}

type IframeProbeMap = Record<string, boolean | undefined>;

const IFRAME_PROBE_CONCURRENCY = 6;

function useIframeHeadProbeForCatalog(): IframeProbeMap {
  const [map, setMap] = useState<IframeProbeMap>({});

  useEffect(() => {
    const targets = TEMPLATE_WORKBENCH_CATALOG.filter((i) => i.previewMode !== "react-only" && i.iframeSrc);
    let cancelled = false;
    const queue = [...targets];

    async function worker() {
      while (!cancelled && queue.length > 0) {
        const item = queue.shift();
        if (!item?.iframeSrc) {
          continue;
        }
        let ok = false;
        try {
          const res = await fetch(item.iframeSrc, { method: "HEAD" });
          ok = res.ok;
        } catch {
          ok = false;
        }
        if (!cancelled) {
          setMap((prev) => ({ ...prev, [item.id]: ok }));
        }
      }
    }

    const n = Math.min(IFRAME_PROBE_CONCURRENCY, Math.max(1, targets.length));
    void Promise.all(Array.from({ length: n }, () => worker()));
    return () => {
      cancelled = true;
    };
  }, []);

  return map;
}

function useNearViewportOnce(margin = "80px") {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) {
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { root: null, rootMargin: margin, threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible, margin]);

  return [ref, visible] as const;
}

type CardPreviewKind = "react" | "missing-path" | "pending" | "ok" | "missing";

function cardPreviewKind(item: TemplateWorkbenchItem, probe: IframeProbeMap): CardPreviewKind {
  if (item.previewMode === "react-only") {
    return "react";
  }
  if (!item.iframeSrc) {
    return "missing-path";
  }
  const v = probe[item.id];
  if (v === undefined) {
    return "pending";
  }
  return v ? "ok" : "missing";
}

const TemplateWorkbenchListCard = memo(function TemplateWorkbenchListCard({
  item,
  selected,
  probe,
  onSelect,
  showPantry,
  candidateRow,
}: {
  item: TemplateWorkbenchItem;
  selected: boolean;
  probe: IframeProbeMap;
  onSelect: (id: string) => void;
  showPantry: boolean;
  candidateRow?: Partial<Record<TemplateWorkbenchUseCaseKey, boolean>>;
}) {
  const [mediaWrapRef, mediaVisible] = useNearViewportOnce();
  const kind = cardPreviewKind(item, probe);

  const statusLabel =
    kind === "react"
      ? "React-only"
      : kind === "pending"
        ? "Checking preview…"
        : kind === "ok"
          ? "Preview ready"
          : "Missing preview";

  const statusMod = kind === "react" ? "react" : kind === "pending" ? "pending" : kind === "ok" ? "ready" : "missing";

  const thumb = item.thumbnailSrc?.trim();
  const showMiniIframe = kind === "ok" && mediaVisible && item.iframeSrc && !thumb;

  const chosenAny = candidateRow ? Object.values(candidateRow).some(Boolean) : false;
  const chosenPantry = Boolean(candidateRow?.pantry);

  const aria = `${item.title}. ${statusLabel}. ${item.category}.`;

  return (
    <li>
      <button
        type="button"
        className={selected ? "wd-tw-browser-card wd-tw-browser-card--selected" : "wd-tw-browser-card"}
        aria-label={aria}
        aria-current={selected ? "true" : undefined}
        onClick={() => onSelect(item.id)}
      >
        <div ref={mediaWrapRef} className="wd-tw-browser-card__media">
          <span
            className={`wd-tw-browser-card__format wd-tw-browser-card__format--${kind === "react" ? "react" : "html"}`}
          >
            {kind === "react" ? "React" : "HTML"}
          </span>
          {thumb ? (
            <img className="wd-tw-browser-card__thumb" src={thumb} alt="" loading="lazy" decoding="async" />
          ) : kind === "react" ? (
            <div className="wd-tw-browser-card__media-placeholder wd-tw-browser-card__media-placeholder--react" aria-hidden>
              <span className="wd-tw-browser-card__media-title">{item.title}</span>
              <code className="wd-tw-browser-card__media-code">{item.publicPath}</code>
              <span className="wd-tw-browser-card__media-hint">Source preview — open in editor</span>
            </div>
          ) : kind === "missing" || kind === "missing-path" ? (
            <div className="wd-tw-browser-card__media-placeholder wd-tw-browser-card__media-placeholder--warn" aria-hidden>
              <span className="wd-tw-browser-card__media-kicker">Missing preview</span>
              <span className="wd-tw-browser-card__media-title">{item.title}</span>
              <span className="wd-tw-browser-card__media-path">{item.publicPath}</span>
              <span className="wd-tw-browser-card__media-cta">Select for full message</span>
            </div>
          ) : kind === "pending" ? (
            <div className="wd-tw-browser-card__media-placeholder wd-tw-browser-card__media-placeholder--pending" aria-hidden>
              <span className="wd-tw-browser-card__media-hint">Checking preview file…</span>
            </div>
          ) : showMiniIframe ? (
            <div className="wd-tw-browser-card__mini" aria-hidden>
              <iframe
                className="wd-tw-browser-card__mini-iframe"
                src={item.iframeSrc!}
                title=""
                loading="lazy"
                tabIndex={-1}
                sandbox={TEMPLATE_WORKBENCH_IFRAME_SANDBOX}
              />
            </div>
          ) : (
            <div className="wd-tw-browser-card__media-placeholder wd-tw-browser-card__media-placeholder--idle" aria-hidden>
              <span className="wd-tw-browser-card__media-hint">Scroll near card to load live thumb</span>
            </div>
          )}
        </div>

        <div className="wd-tw-browser-card__body">
          {chosenAny ? (
            <div className="wd-tw-browser-card__badges" aria-label="Style source">
              <span className="wd-tw-browser-card__badge wd-tw-browser-card__badge--chosen">Chosen</span>
              {chosenPantry ? (
                <span className="wd-tw-browser-card__badge wd-tw-browser-card__badge--pantry-src">Pantry source</span>
              ) : null}
            </div>
          ) : null}
          <span className={`wd-tw-browser-card__status wd-tw-browser-card__status--${statusMod}`}>{statusLabel}</span>
          <span className="wd-tw-browser-card__title">{item.title}</span>
          <span className="wd-tw-browser-card__cat">{item.category}</span>
          {showPantry ? <span className="wd-tw-browser-card__pantry">Pantry</span> : null}
          {item.tags.length > 0 ? (
            <span className="wd-tw-browser-card__taghint" title={item.tags.join(", ")}>
              {item.tags.slice(0, 2).join(" · ")}
              {item.tags.length > 2 ? ` +${item.tags.length - 2}` : ""}
            </span>
          ) : null}
        </div>
      </button>
    </li>
  );
});

const USE_CASE_LABEL = new Map<TemplateWorkbenchUseCaseKey, string>(
  TEMPLATE_WORKBENCH_USE_CASES.map((u) => [u.key, u.label]),
);
const USE_CASE_ORDER = TEMPLATE_WORKBENCH_USE_CASES.map((u) => u.key);

function useCaseLabelsSentence(keys: TemplateWorkbenchUseCaseKey[]): string {
  const sorted = [...keys].sort((a, b) => USE_CASE_ORDER.indexOf(a) - USE_CASE_ORDER.indexOf(b));
  return sorted.map((k) => USE_CASE_LABEL.get(k) ?? k).join(", ");
}

function buildBuilderPrompt(item: TemplateWorkbenchItem, keys: TemplateWorkbenchUseCaseKey[]): string {
  const useCasesBlock =
    keys.length > 0
      ? useCaseLabelsSentence(keys)
      : "(assign use cases in “Choose this source”, then Save as chosen source)";
  return [
    `Use ${item.title} at ${item.publicPath} as the source style for ${useCasesBlock}.`,
    "Inspect the static iframe/template HTML and convert the relevant visual pattern into editable React components for the 491WD build.",
    "Preserve font scale, card shape, spacing, badges, buttons, table/list structure, and color accents.",
    "Do not modify My Build directly until asked. Build the component/page in the internal builder area first.",
  ].join("\n");
}

function isPantryRecommended(
  item: TemplateWorkbenchItem,
  candidates: TemplateWorkbenchCandidatesMap,
): boolean {
  if (candidates[item.id]?.pantry) {
    return true;
  }
  if (item.category.toLowerCase().includes("pantry")) {
    return true;
  }
  return item.tags.some((t) => /pantry/i.test(t));
}

/** When no saved selection, prefer pantry-useful templates in catalog order. */
function findDefaultPantryUsefulId(catalog: TemplateWorkbenchItem[]): string | null {
  const rules: ((i: TemplateWorkbenchItem) => boolean)[] = [
    (i) => i.tags.some((t) => /notes/i.test(t)),
    (i) => i.tags.some((t) => /tables?/i.test(t)) || i.relatedBuilderComponents.includes("table"),
    (i) => i.tags.some((t) => /cards?/i.test(t)) || i.relatedBuilderComponents.includes("card"),
    (i) =>
      i.tags.some((t) => /forms?/i.test(t)) ||
      i.relatedBuilderComponents.some((c) => /form|input/i.test(c)),
    (i) => i.tags.some((t) => /alert/i.test(t)) || i.relatedBuilderComponents.includes("alerts"),
    (i) => i.tags.some((t) => /button/i.test(t)) || i.relatedBuilderComponents.includes("buttons"),
    (i) => i.tags.some((t) => /pantry/i.test(t)) || i.category.toLowerCase().includes("pantry"),
  ];
  for (const pred of rules) {
    const hit = catalog.find(pred);
    if (hit) {
      return hit.id;
    }
  }
  return catalog[0]?.id ?? null;
}

export default function TemplateWorkbenchPage() {
  const { notesMap, persistNotes, candidatesMap, persistCandidates, markedIds, persistMarked } = useWorkbenchPersistence();
  const cardProbe = useIframeHeadProbeForCatalog();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<TemplateWorkbenchCategory | "all">("all");
  const [myPicksOnly, setMyPicksOnly] = useState(false);
  const [pantryRecommendedOnly, setPantryRecommendedOnly] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [chosenSourcesOpen, setChosenSourcesOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const saved = loadSelectedTemplateId();
    if (saved && TEMPLATE_WORKBENCH_CATALOG.some((i) => i.id === saved)) {
      return saved;
    }
    return findDefaultPantryUsefulId(TEMPLATE_WORKBENCH_CATALOG);
  });
  const [builderStatus, setBuilderStatus] = useState<string | null>(null);
  const [iframeHtmlStatus, setIframeHtmlStatus] = useState<"idle" | "ok" | "missing">("idle");
  const [sourceDraft, setSourceDraft] = useState<Partial<Record<TemplateWorkbenchUseCaseKey, boolean>>>({});
  const [sourceActionStatus, setSourceActionStatus] = useState<string | null>(null);
  const sourceStatusClearRef = useRef<number | null>(null);

  const flashSourceStatus = useCallback((message: string, ms = 2400) => {
    if (sourceStatusClearRef.current != null) {
      window.clearTimeout(sourceStatusClearRef.current);
    }
    setSourceActionStatus(message);
    sourceStatusClearRef.current = window.setTimeout(() => {
      setSourceActionStatus(null);
      sourceStatusClearRef.current = null;
    }, ms);
  }, []);

  useEffect(() => {
    return () => {
      if (sourceStatusClearRef.current != null) {
        window.clearTimeout(sourceStatusClearRef.current);
      }
    };
  }, []);

  useEffect(() => {
    saveSelectedTemplateId(selectedId);
  }, [selectedId]);

  const selected = useMemo(
    () => TEMPLATE_WORKBENCH_CATALOG.find((i) => i.id === selectedId) ?? null,
    [selectedId],
  );

  useEffect(() => {
    if (!selectedId) {
      setSourceDraft({});
      return;
    }
    setSourceDraft({ ...(candidatesMap[selectedId] ?? {}) });
  }, [selectedId, candidatesMap]);

  useEffect(() => {
    let cancelled = false;
    const bumpIdle = () => {
      void Promise.resolve().then(() => {
        if (!cancelled) {
          setIframeHtmlStatus("idle");
        }
      });
    };

    if (!selected?.iframeSrc || selected.previewMode === "react-only") {
      bumpIdle();
      return () => {
        cancelled = true;
      };
    }

    bumpIdle();
    const url = selected.iframeSrc;
    void fetch(url, { method: "HEAD" })
      .then((res) => {
        if (!cancelled) {
          setIframeHtmlStatus(res.ok ? "ok" : "missing");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIframeHtmlStatus("missing");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selected?.id, selected?.previewMode, selected?.iframeSrc]);

  const filtered = useMemo(() => {
    return TEMPLATE_WORKBENCH_CATALOG.filter((item) => {
      if (!matchesWorkbenchSearch(item, search)) {
        return false;
      }
      if (myPicksOnly && !hasUseCaseAssignments(item.id, candidatesMap)) {
        return false;
      }
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }
      if (pantryRecommendedOnly && !isPantryRecommended(item, candidatesMap)) {
        return false;
      }
      if (!itemMatchesTags(item, selectedTags)) {
        return false;
      }
      return true;
    });
  }, [search, categoryFilter, myPicksOnly, pantryRecommendedOnly, selectedTags, candidatesMap]);

  useEffect(() => {
    if (!selectedId || filtered.some((i) => i.id === selectedId)) {
      return;
    }
    const nextId = filtered[0]?.id ?? null;
    void Promise.resolve().then(() => {
      setSelectedId(nextId);
    });
  }, [filtered, selectedId]);

  const chosenByUseCase = useMemo(() => {
    return TEMPLATE_WORKBENCH_USE_CASES.map(({ key, label }) => {
      const entries: TemplateWorkbenchItem[] = [];
      for (const item of TEMPLATE_WORKBENCH_CATALOG) {
        if (candidatesMap[item.id]?.[key]) {
          entries.push(item);
        }
      }
      return { key, label, entries };
    });
  }, [candidatesMap]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const onNoteChange = (id: string, value: string) => {
    const next = { ...notesMap, [id]: value };
    if (value.trim() === "") {
      delete next[id];
    }
    persistNotes(next);
  };

  const toggleSourceDraft = (key: TemplateWorkbenchUseCaseKey) => {
    setSourceDraft((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return next;
    });
  };

  const saveChosenSources = () => {
    if (!selectedId) {
      return;
    }
    const keys = Object.entries(sourceDraft)
      .filter(([, v]) => v)
      .map(([k]) => k as TemplateWorkbenchUseCaseKey);
    if (keys.length === 0) {
      flashSourceStatus("Choose at least one use case", 2800);
      return;
    }
    const row: Partial<Record<TemplateWorkbenchUseCaseKey, boolean>> = {};
    for (const k of keys) {
      row[k] = true;
    }
    persistCandidates({ ...candidatesMap, [selectedId]: row });
    flashSourceStatus("Source saved");
  };

  const removeChosenSources = () => {
    if (!selectedId) {
      return;
    }
    const next = { ...candidatesMap };
    delete next[selectedId];
    persistCandidates(next);
    setSourceDraft({});
    flashSourceStatus("Source removed");
  };

  const removeChosenSourceAssignment = (templateId: string, useCaseKey: TemplateWorkbenchUseCaseKey) => {
    const row = { ...(candidatesMap[templateId] ?? {}) };
    delete row[useCaseKey];
    const next = { ...candidatesMap };
    if (Object.keys(row).length === 0) {
      delete next[templateId];
    } else {
      next[templateId] = row;
    }
    persistCandidates(next);
  };

  const toggleMarked = (itemId: string) => {
    if (markedIds.includes(itemId)) {
      persistMarked(markedIds.filter((x) => x !== itemId));
    } else {
      persistMarked([...markedIds, itemId]);
    }
  };

  const copyText = async (text: string, status: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setBuilderStatus(status);
      window.setTimeout(() => setBuilderStatus(null), 2200);
    } catch {
      setBuilderStatus("Clipboard unavailable in this context");
      window.setTimeout(() => setBuilderStatus(null), 3200);
    }
  };

  const copyPagePath = (item: TemplateWorkbenchItem) => {
    void copyText(item.publicPath, "Path copied");
  };

  const createBuilderTask = (item: TemplateWorkbenchItem) => {
    const keys = Object.entries(candidatesMap[item.id] ?? {})
      .filter(([, v]) => v)
      .map(([k]) => k as TemplateWorkbenchUseCaseKey);
    if (keys.length === 0) {
      return;
    }
    const prompt = buildBuilderPrompt(item, keys);
    void copyText(prompt, "Builder task copied");
  };

  const openFullPage = (item: TemplateWorkbenchItem) => {
    if (!item.iframeSrc || item.previewMode === "react-only") {
      return;
    }
    window.open(`${window.location.origin}${item.iframeSrc}`, "_blank", "noopener,noreferrer");
  };

  const selectedUseCases = selected
    ? (Object.entries(candidatesMap[selected.id] ?? {})
        .filter(([, v]) => v)
        .map(([k]) => k as TemplateWorkbenchUseCaseKey) ?? [])
    : [];

  const showPantryLabel = (item: TemplateWorkbenchItem) => isPantryRecommended(item, candidatesMap);

  return (
    <div className="wd-tw wd-tw--browser wd-tw-browser-page">
      <header className="wd-tw-topbar wd-tw-topbar--admin">
        <div className="wd-tw-topbar__head">
          <h1 className="wd-tw-topbar__title">Template Workbench</h1>
          <p className="wd-tw-topbar__subtitle">
            Pick a template, preview full-width, then use <strong>Choose this source</strong> next to the actions to
            assign which build sections should follow this style.
          </p>
        </div>

        <div className="wd-tw-topbar__row">
          <label className="wd-tw-topbar__search">
            <span className="wd-visually-hidden">Search templates</span>
            <input
              type="search"
              className="wd-tw-topbar__search-input"
              placeholder="Search by title, path, tag, or builder component…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
          </label>

          <label className="wd-tw-topbar__field">
            <span className="wd-tw-topbar__field-label">Category</span>
            <select
              className="wd-tw-topbar__select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as TemplateWorkbenchCategory | "all")}
            >
              <option value="all">All categories</option>
              {TEMPLATE_WORKBENCH_CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <div className="wd-tw-topbar__toggles" role="group" aria-label="Quick filters">
            <button
              type="button"
              className={myPicksOnly ? "wd-tw-pill wd-tw-pill--on" : "wd-tw-pill"}
              role="switch"
              aria-checked={myPicksOnly}
              title="Show templates that have at least one saved use-case source"
              onClick={() => setMyPicksOnly((v) => !v)}
            >
              My Picks
            </button>

            <button
              type="button"
              className={pantryRecommendedOnly ? "wd-tw-pill wd-tw-pill--on" : "wd-tw-pill"}
              role="switch"
              aria-checked={pantryRecommendedOnly}
              onClick={() => setPantryRecommendedOnly((v) => !v)}
            >
              <span className="wd-tw-pill__wide">Recommended for Pantry</span>
              <span className="wd-tw-pill__narrow">For Pantry</span>
            </button>
          </div>
        </div>

        <details className="wd-tw-details">
          <summary className="wd-tw-details__summary">More filters</summary>
          <div className="wd-tw-details__body">
            <p className="wd-tw-details__hint">Filter by catalog tags (optional).</p>
            <div className="wd-tw-details__tags" role="group" aria-label="Tag filters">
              {TEMPLATE_WORKBENCH_ALL_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={selectedTags.includes(tag) ? "wd-tw-tagchip wd-tw-tagchip--on" : "wd-tw-tagchip"}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </details>
      </header>

      <details
        className="wd-tw-chosen"
        open={chosenSourcesOpen}
        onToggle={(e) => setChosenSourcesOpen(e.currentTarget.open)}
      >
        <summary className="wd-tw-chosen__summary">
          Chosen Style Sources
          <span className="wd-tw-chosen__summary-hint">Grouped by use case — expand to review or remove</span>
        </summary>
        <div className="wd-tw-chosen__body">
          <div className="wd-tw-chosen-groups">
            {chosenByUseCase.map((group) => (
              <section key={group.key} className="wd-tw-chosen-group" aria-label={`${group.label} sources`}>
                <h4 className="wd-tw-chosen-group__label">{group.label}</h4>
                {group.entries.length === 0 ? (
                  <p className="wd-tw-chosen-group__empty">—</p>
                ) : (
                  <ul className="wd-tw-chosen-group__list">
                    {group.entries.map((item) => (
                      <li key={item.id} className="wd-tw-chosen-source">
                        <div className="wd-tw-chosen-source__main">
                          <span className="wd-tw-chosen-source__title">{item.title}</span>
                          <span className="wd-tw-chosen-source__cat">{item.category}</span>
                          <code className="wd-tw-chosen-source__path wd-tw-code">{item.publicPath}</code>
                        </div>
                        <button
                          type="button"
                          className="wd-tw-chosen-source__remove"
                          onClick={() => removeChosenSourceAssignment(item.id, group.key)}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
      </details>

      {builderStatus ? <p className="wd-tw-flash">{builderStatus}</p> : null}

      <div className="wd-tw-browser">
        <aside className="wd-tw-browser__list" aria-label="Templates">
          {filtered.length === 0 ? (
            <p className="wd-tw-browser__empty">No templates match your filters.</p>
          ) : (
            <ul className="wd-tw-browser__list-ul">
              {filtered.map((item) => (
                <TemplateWorkbenchListCard
                  key={item.id}
                  item={item}
                  selected={selectedId === item.id}
                  probe={cardProbe}
                  onSelect={setSelectedId}
                  showPantry={showPantryLabel(item)}
                  candidateRow={candidatesMap[item.id]}
                />
              ))}
            </ul>
          )}
        </aside>

        <main className="wd-tw-browser__preview">
          {selected ? (
            <div className="wd-tw-preview-stack">
              <div className="wd-tw-browser__preview-head">
                <h2 className="wd-tw-browser__preview-title">{selected.title}</h2>
                <div className="wd-tw-browser__actions">
                  {selected.previewMode !== "react-only" && selected.iframeSrc && iframeHtmlStatus === "ok" ? (
                    <button
                      type="button"
                      className="wd-tw-act wd-tw-act--primary"
                      title="Full page opens the original copied template and may run vendor scripts."
                      onClick={() => openFullPage(selected)}
                    >
                      Open Full Page
                    </button>
                  ) : null}
                  <button type="button" className="wd-tw-act" onClick={() => copyPagePath(selected)}>
                    Copy Page Path
                  </button>
                  <button
                    type="button"
                    className="wd-tw-act wd-tw-act--accent"
                    disabled={selectedUseCases.length === 0}
                    title={
                      selectedUseCases.length === 0
                        ? "Save at least one use case in Choose this source first"
                        : "Copy builder task to clipboard"
                    }
                    onClick={() => createBuilderTask(selected)}
                  >
                    Create Builder Task
                  </button>
                </div>
                {selected.previewMode !== "react-only" && selected.iframeSrc && iframeHtmlStatus === "ok" ? (
                  <p className="wd-tw-browser__fullpage-note" role="note">
                    Full page opens the original copied template and may run vendor scripts.
                  </p>
                ) : null}

                <section
                  className="wd-tw-source-panel wd-tw-source-panel--compact"
                  aria-labelledby="wd-tw-source-panel-title"
                >
                  <h3 id="wd-tw-source-panel-title" className="wd-tw-source-panel__title">
                    Choose this source
                  </h3>
                  <fieldset className="wd-tw-source-panel__fieldset">
                    <legend className="wd-tw-source-panel__legend">Use this style for</legend>
                    <div className="wd-tw-use-grid wd-tw-use-grid--source">
                      {TEMPLATE_WORKBENCH_USE_CASES.map(({ key, label }) => (
                        <label key={key} className="wd-tw-use-grid__item">
                          <input
                            type="checkbox"
                            checked={Boolean(sourceDraft[key])}
                            onChange={() => toggleSourceDraft(key)}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div className="wd-tw-source-panel__actions">
                    <button type="button" className="wd-tw-act wd-tw-act--primary" onClick={saveChosenSources}>
                      Save as chosen source
                    </button>
                    <button type="button" className="wd-tw-act" onClick={removeChosenSources}>
                      Remove from chosen sources
                    </button>
                  </div>
                  {sourceActionStatus ? (
                    <p
                      className={`wd-tw-source-panel__status ${
                        sourceActionStatus === "Choose at least one use case"
                          ? "wd-tw-source-panel__status--warn"
                          : sourceActionStatus === "Source removed"
                            ? "wd-tw-source-panel__status--muted"
                            : "wd-tw-source-panel__status--ok"
                      }`}
                      role="status"
                      aria-live="polite"
                    >
                      {sourceActionStatus}
                    </p>
                  ) : null}
                </section>
              </div>

              <section className="wd-tw-preview-detail" aria-label="Selected template source detail">
                <div className="wd-tw-preview-detail__chosen">
                  <span className="wd-tw-preview-detail__label">Chosen for</span>
                  {selectedUseCases.length > 0 ? (
                    <ul className="wd-tw-preview-detail__chips">
                      {[...selectedUseCases]
                        .sort((a, b) => USE_CASE_ORDER.indexOf(a) - USE_CASE_ORDER.indexOf(b))
                        .map((k) => (
                          <li key={k} className="wd-tw-preview-detail__chip">
                            {USE_CASE_LABEL.get(k) ?? k}
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <span className="wd-tw-preview-detail__empty">
                      None yet — pick use cases in Choose this source above, then save
                    </span>
                  )}
                </div>
                <dl className="wd-tw-preview-detail__dl">
                  <div className="wd-tw-preview-detail__row">
                    <dt>Category</dt>
                    <dd>{selected.category}</dd>
                  </div>
                  <div className="wd-tw-preview-detail__row">
                    <dt>Public path</dt>
                    <dd>
                      <code className="wd-tw-code">{selected.publicPath}</code>
                    </dd>
                  </div>
                  <div className="wd-tw-preview-detail__row">
                    <dt>Best for</dt>
                    <dd>{selected.bestFor}</dd>
                  </div>
                  {selected.notes.trim() !== "" ? (
                    <div className="wd-tw-preview-detail__row wd-tw-preview-detail__row--block">
                      <dt>Catalog notes</dt>
                      <dd>{selected.notes}</dd>
                    </div>
                  ) : null}
                  {(notesMap[selected.id] ?? "").trim() !== "" ? (
                    <div className="wd-tw-preview-detail__row wd-tw-preview-detail__row--block">
                      <dt>Your notes</dt>
                      <dd>{notesMap[selected.id]}</dd>
                    </div>
                  ) : null}
                </dl>
              </section>

              <div className="wd-tw-preview-stack__frame">
                {selected.previewMode !== "react-only" && selected.iframeSrc ? (
                  iframeHtmlStatus === "ok" ? (
                    <div className="wd-tw-browser__frame-wrap wd-tw-browser__frame-wrap--grow wd-tw-browser__frame-wrap--static-preview">
                      <div className="wd-tw-static-preview-strip">
                        <span className="wd-tw-static-preview-strip__badge">Static preview mode</span>
                        <p className="wd-tw-static-preview-strip__hint">
                          Scripts are disabled to prevent template demo popups and API-key alerts.
                        </p>
                      </div>
                      <iframe
                        key={selected.id}
                        className="wd-tw-browser__iframe"
                        title={selected.title}
                        src={selected.iframeSrc}
                        sandbox={TEMPLATE_WORKBENCH_IFRAME_SANDBOX}
                      />
                      <p className="wd-tw-static-preview-foot" role="note">
                        This template may require scripts in full-page mode. Static preview is still available for visual
                        reference.
                      </p>
                    </div>
                  ) : iframeHtmlStatus === "missing" ? (
                    <div className="wd-tw-browser__fallback">
                      <p className="wd-tw-browser__fallback-title">Preview file not found</p>
                      <p className="wd-tw-browser__fallback-copy">
                        Expected file at <code className="wd-tw-code">{selected.publicPath}</code> (served as{" "}
                        <code className="wd-tw-code">{selected.iframeSrc}</code>).
                      </p>
                      <p className="wd-tw-browser__fallback-copy">
                        Open Full Page stays disabled until the preview responds to a network check. Copy the path above
                        into your editor or restore assets under <code className="wd-tw-code">public/template-workbench/</code>.
                      </p>
                      <p className="wd-tw-browser__fallback-copy">{selected.notes}</p>
                      {selected.id.startsWith("sneat-") ? (
                        <p className="wd-tw-browser__fallback-copy">
                          Regenerate: <code className="wd-tw-code">node scripts/build-sneat-template-workbench.mjs</code>
                        </p>
                      ) : (
                        <p className="wd-tw-browser__fallback-copy">
                          Copy assets into <code className="wd-tw-code">public/template-workbench/</code> and refresh.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="wd-tw-browser__fallback">
                      <p className="wd-tw-browser__probing">Checking {selected.iframeSrc}…</p>
                    </div>
                  )
                ) : selected.previewMode === "react-only" ? (
                  <div className="wd-tw-browser__fallback">
                    <p className="wd-tw-browser__fallback-title">React-only reference</p>
                    <p className="wd-tw-browser__fallback-copy">
                      Open in editor: <code className="wd-tw-code">{selected.publicPath}</code>
                    </p>
                  </div>
                ) : (
                  <div className="wd-tw-browser__fallback">
                    <p className="wd-tw-browser__fallback-copy">No preview URL for this entry.</p>
                  </div>
                )}
              </div>

              <section className="wd-tw-planning" aria-label="Template planning">
                <div className="wd-tw-planning__meta">
                  <p className="wd-tw-planning__meta-line">
                    {selected.category} · {selected.subcategory}
                  </p>
                  <p className="wd-tw-planning__desc">{selected.description}</p>
                  <p className="wd-tw-planning__best">
                    <strong>Best for</strong> {selected.bestFor}
                  </p>
                  <div className="wd-tw-planning__mark">
                    <button
                      type="button"
                      className={markedIds.includes(selected.id) ? "wd-tw-act wd-tw-act--on wd-tw-act--sm" : "wd-tw-act wd-tw-act--sm"}
                      onClick={() => toggleMarked(selected.id)}
                    >
                      {markedIds.includes(selected.id) ? "In My Picks" : "Add to My Picks"}
                    </button>
                  </div>
                  <details className="wd-tw-planning__paths">
                    <summary className="wd-tw-planning__paths-sum">Paths &amp; technical</summary>
                    <dl className="wd-tw-about__dl">
                      <div>
                        <dt>Original</dt>
                        <dd>
                          <code className="wd-tw-code">{selected.originalPath}</code>
                        </dd>
                      </div>
                      <div>
                        <dt>Workbench</dt>
                        <dd>
                          <code className="wd-tw-code">{selected.publicPath}</code>
                        </dd>
                      </div>
                      {selected.iframeSrc ? (
                        <div>
                          <dt>Preview URL</dt>
                          <dd>
                            <code className="wd-tw-code">{selected.iframeSrc}</code>
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                    <div className="wd-tw-planning__comps">
                      <span className="wd-tw-planning__comps-label">Builder components</span>
                      <span className="wd-tw-planning__comps-val">{selected.relatedBuilderComponents.join(", ")}</span>
                    </div>
                    <div className="wd-tw-planning__catalog">
                      <span className="wd-tw-planning__catalog-label">Catalog notes</span>
                      <p className="wd-tw-planning__catalog-body">{selected.notes}</p>
                    </div>
                  </details>
                </div>

                <div className="wd-tw-planning__actions">
                  <label className="wd-tw-planning__notes">
                    <span className="wd-tw-planning__notes-label">Notes for this source</span>
                    <textarea
                      rows={2}
                      className="wd-tw-planning__notes-input"
                      placeholder="e.g. Pantry table density…"
                      value={notesMap[selected.id] ?? ""}
                      onChange={(e) => onNoteChange(selected.id, e.target.value)}
                    />
                  </label>

                  {selectedUseCases.length > 0 ? (
                    <p className="wd-tw-planning__prompt wd-tw-planning__prompt--pre">
                      <span className="wd-tw-planning__prompt-label">Builder prompt preview</span>
                      {buildBuilderPrompt(selected, selectedUseCases)}
                    </p>
                  ) : null}
                </div>
              </section>
            </div>
          ) : (
            <p className="wd-tw-browser__placeholder">Select a template from the list.</p>
          )}
        </main>
      </div>
    </div>
  );
}
