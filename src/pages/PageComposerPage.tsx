import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import PageDropZone from "../components/PageDropZone";
import {
  coerceInspectorSelectValue,
  getDefaultSettingsFor,
  getInspectorFieldsFor,
  makeInstance,
  PALETTE_DRAG_TYPE,
  uiComponents,
  type CanvasComponent,
  type CanvasSettings,
  type CanvasSettingsValue,
  type UiComponentDefinition,
} from "../lib/uiBuilderLayout";
import {
  loadPageComposerLayout,
  PAGE_COMPOSER_PAGE_IDS,
  resetPageComposerLayout,
  savePageComposerLayout,
  type PageComposerPageId,
} from "../lib/pageComposerStorage";

export default function PageComposerPage() {
  const [pageId, setPageId] = useState<PageComposerPageId>("pantry");
  const [sections, setSections] = useState<CanvasComponent[]>(() => loadPageComposerLayout("pantry"));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const [paletteSearch, setPaletteSearch] = useState("");

  selectedIdRef.current = selectedId;

  useEffect(() => {
    setSections(loadPageComposerLayout(pageId));
    setSelectedId(null);
  }, [pageId]);

  useEffect(() => {
    savePageComposerLayout(pageId, sections);
  }, [pageId, sections]);

  const selected = useMemo(
    () => (selectedId ? sections.find((s) => s.instanceId === selectedId) ?? null : null),
    [sections, selectedId],
  );

  const inspectorDefs = useMemo(
    () => (selected ? getInspectorFieldsFor(selected.definitionId) : []),
    [selected],
  );

  const inspectorDefaults = useMemo(
    () => (selected ? getDefaultSettingsFor(selected.definitionId) : ({} as CanvasSettings)),
    [selected],
  );

  const filteredPalette = useMemo(() => {
    const q = paletteSearch.trim().toLowerCase();
    return uiComponents.filter((c) => `${c.name} ${c.description}`.toLowerCase().includes(q));
  }, [paletteSearch]);

  const updateSelected = useCallback(
    (updates: Partial<CanvasComponent>) => {
      if (!selected) {
        return;
      }
      setSections((items) =>
        items.map((item) => (item.instanceId === selected.instanceId ? { ...item, ...updates } : item)),
      );
    },
    [selected],
  );

  const patchSelectedSetting = useCallback((key: string, value: CanvasSettingsValue) => {
    const id = selectedIdRef.current;
    if (!id) {
      return;
    }
    setSections((items) =>
      items.map((item) =>
        item.instanceId === id ? { ...item, settings: { ...(item.settings ?? {}), [key]: value } } : item,
      ),
    );
  }, []);

  const handlePaletteDragStart = (event: DragEvent<HTMLButtonElement>, definitionId: string) => {
    event.dataTransfer.setData(PALETTE_DRAG_TYPE, definitionId);
    event.dataTransfer.effectAllowed = "copy";
  };

  const appendFromPaletteClick = (definition: UiComponentDefinition) => {
    const instance = makeInstance(definition);
    setSections((prev) => [...prev, instance]);
    setSelectedId(instance.instanceId);
  };

  const handleReset = () => {
    if (
      !window.confirm(
        `Reset the Page Composer layout for "${pageId}"? This removes composed sections from localStorage for this page.`,
      )
    ) {
      return;
    }
    resetPageComposerLayout(pageId);
    setSections([]);
    setSelectedId(null);
  };

  const deleteSelected = () => {
    if (!selected) {
      return;
    }
    const next = sections.filter((i) => i.instanceId !== selected.instanceId);
    setSections(next);
    setSelectedId(next[0]?.instanceId ?? null);
  };

  return (
    <div className="wd-pc">
      <header className="wd-pc__top">
        <div className="wd-pc__top-main">
          <h1 className="wd-pc__title">Page Composer</h1>
          <p className="wd-pc__lede">
            Drag UI Builder components into the target page zone. Layouts persist per page in localStorage (separate from
            the UI Builder canvas).
          </p>
        </div>
        <div className="wd-pc__top-controls">
          <label className="wd-pc__field">
            <span>Target page</span>
            <select
              className="wd-pc__select"
              value={pageId}
              onChange={(e) => setPageId(e.target.value as PageComposerPageId)}
            >
              {PAGE_COMPOSER_PAGE_IDS.map((id) => (
                <option key={id} value={id}>
                  {id === "pantry" ? "Pantry" : id}
                </option>
              ))}
            </select>
          </label>
          <p className="wd-pc__persist" role="status">
            Saved to this browser · <code className="wd-tw-code">491wd-page-composer-layouts</code>
          </p>
          <button type="button" className="wd-btn wd-btn-outline" onClick={handleReset}>
            Reset Page Layout
          </button>
        </div>
      </header>

      <div className="wd-pc__workspace">
        <aside className="wd-pc__palette" aria-label="Component palette">
          <h2 className="wd-pc__palette-title">Components</h2>
          <input
            type="search"
            className="wd-pc__palette-search"
            placeholder="Search components…"
            value={paletteSearch}
            onChange={(e) => setPaletteSearch(e.target.value)}
            autoComplete="off"
          />
          <ul className="wd-pc__palette-list">
            {filteredPalette.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="wd-pc__palette-btn"
                  draggable
                  onDragStart={(e) => handlePaletteDragStart(e, c.id)}
                  onClick={() => appendFromPaletteClick(c)}
                >
                  <span className="wd-pc__palette-name">{c.name}</span>
                  <span className="wd-pc__palette-meta">{c.category}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="wd-pc__main">
          <PageDropZone sections={sections} onSectionsChange={setSections} selectedId={selectedId} onSelect={setSelectedId} />
        </div>

        <aside className="wd-pc__inspector" aria-label="Section inspector">
          <div className="wd-pc__inspector-card">
            <p className="wd-pc__inspector-eyebrow">Inspector</p>
            <h2 className="wd-pc__inspector-title">Selected section</h2>
            {!selected ? (
              <p className="wd-pc__inspector-empty">Select a card in the layout to edit title, body, accent, size, and settings.</p>
            ) : (
              <>
                <label className="wd-field">
                  Title
                  <input value={selected.title} onChange={(e) => updateSelected({ title: e.target.value })} />
                </label>
                <label className="wd-field">
                  Body
                  <textarea value={selected.body} onChange={(e) => updateSelected({ body: e.target.value })} rows={3} />
                </label>
                <label className="wd-field">
                  Accent
                  <input type="color" value={selected.accent} onChange={(e) => updateSelected({ accent: e.target.value })} />
                </label>
                <label className="wd-field">
                  Size
                  <select
                    value={selected.size}
                    onChange={(e) => updateSelected({ size: e.target.value as CanvasComponent["size"] })}
                  >
                    <option value="compact">Compact</option>
                    <option value="normal">Normal</option>
                    <option value="wide">Wide</option>
                  </select>
                </label>

                {inspectorDefs.length > 0 ? (
                  <div className="wd-pc__inspector-settings">
                    <p className="wd-pc__inspector-eyebrow">Component settings</p>
                    {inspectorDefs.map((def) => {
                      const raw = selected.settings?.[def.key] ?? inspectorDefaults[def.key];
                      if (def.type === "select" && def.options?.length) {
                        const val = coerceInspectorSelectValue(
                          selected.definitionId,
                          def.key,
                          raw,
                          inspectorDefaults[def.key],
                          def.options,
                        );
                        return (
                          <label key={def.key} className="wd-field">
                            {def.label}
                            <select
                              className="wd-pc__inspector-select"
                              value={val}
                              onChange={(e) => patchSelectedSetting(def.key, e.target.value)}
                            >
                              {def.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </label>
                        );
                      }
                      if (def.type === "string") {
                        return (
                          <label key={def.key} className="wd-field">
                            {def.label}
                            <input
                              value={typeof raw === "string" ? raw : ""}
                              onChange={(e) => patchSelectedSetting(def.key, e.target.value)}
                            />
                          </label>
                        );
                      }
                      if (def.type === "number") {
                        const n =
                          typeof raw === "number"
                            ? raw
                            : typeof raw === "string" && raw.trim() !== ""
                              ? Number(raw)
                              : typeof inspectorDefaults[def.key] === "number"
                                ? (inspectorDefaults[def.key] as number)
                                : 0;
                        return (
                          <label key={def.key} className="wd-field">
                            {def.label}
                            <input
                              type="number"
                              value={Number.isFinite(n) ? n : 0}
                              onChange={(e) => {
                                const next = Number(e.target.value);
                                patchSelectedSetting(def.key, Number.isFinite(next) ? next : 0);
                              }}
                            />
                          </label>
                        );
                      }
                      if (def.type === "boolean") {
                        const fallbackBool =
                          typeof inspectorDefaults[def.key] === "boolean" ? (inspectorDefaults[def.key] as boolean) : false;
                        const checked = typeof raw === "boolean" ? raw : fallbackBool;
                        return (
                          <label key={def.key} className="wd-field">
                            <span className="wd-field-check-row">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => patchSelectedSetting(def.key, e.target.checked)}
                              />
                              {def.label}
                            </span>
                          </label>
                        );
                      }
                      const lines = Array.isArray(raw)
                        ? raw.join("\n")
                        : Array.isArray(inspectorDefaults[def.key])
                          ? (inspectorDefaults[def.key] as string[]).join("\n")
                          : "";
                      return (
                        <label key={def.key} className="wd-field">
                          {def.label}
                          <textarea
                            rows={3}
                            value={lines}
                            onChange={(e) =>
                              patchSelectedSetting(
                                def.key,
                                e.target.value
                                  .split("\n")
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              )
                            }
                          />
                        </label>
                      );
                    })}
                  </div>
                ) : null}

                <button type="button" className="wd-btn wd-btn-danger wd-pc__delete" onClick={deleteSelected}>
                  Remove section
                </button>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
