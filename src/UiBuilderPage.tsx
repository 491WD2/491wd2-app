import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { HelpHint } from "./components/HelpHint";
import "./ui-builder.css";
import { generateExportedUiLayoutTsx } from "./lib/generateExportedUiLayoutTsx";
import { useHelpMode } from "./lib/HelpModeContext";
import {
  APPLIED_LAYOUT_STORAGE_KEY,
  CANVAS_ITEM_DRAG_TYPE,
  LAYOUT_STORAGE_KEY,
  PALETTE_DRAG_TYPE,
  coerceInspectorSelectValue,
  insertCanvasItemAt,
  loadCanvasFromStorage,
  makeInstance,
  renderPalettePreview,
  renderPreview,
  reorderCanvasItems,
  starterCanvas,
  uiComponents,
  validateCanvasPayload,
  getInspectorFieldsFor,
  getDefaultSettingsFor,
  type CanvasComponent,
  type CanvasSettings,
  type CanvasSettingsValue,
  type UiCategory,
} from "./lib/uiBuilderLayout";
import { hasVariantSupport } from "./lib/componentVariantOptions";

type PaletteFilter = "All" | UiCategory | "Variants";

export type UiBuilderPalettePreset = {
  category: UiCategory;
  definitionId: string;
};

type UiBuilderPageProps = {
  /** When set (e.g. from Backend Console catalog), narrows the palette without touching saved canvas layout. */
  palettePreset?: UiBuilderPalettePreset | null;
  /**
   * When true (Backend Console), the component palette is not a full-height left sidebar — it lives in a
   * collapsible panel above the canvas so only the Backend Console nav remains as the outer sidebar.
   */
  embedded?: boolean;
};

function UiBuilderPage({ palettePreset = null, embedded = false }: UiBuilderPageProps) {
  const { enabled: helpModeEnabled, toggle: toggleHelpMode } = useHelpMode();
  const [activeCategory, setActiveCategory] = useState<PaletteFilter>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [canvas, setCanvas] = useState<CanvasComponent[]>(() => {
    const loaded = loadCanvasFromStorage();
    return loaded !== null ? loaded : starterCanvas;
  });
  const [selectedId, setSelectedId] = useState(() => {
    const loaded = loadCanvasFromStorage();
    const initial = loaded !== null ? loaded : starterCanvas;
    return initial[0]?.instanceId ?? "";
  });

  useLayoutEffect(() => {
    if (palettePreset) {
      setActiveCategory(palettePreset.category);
      const def = uiComponents.find((c) => c.id === palettePreset.definitionId);
      setSearchTerm(def?.name ?? palettePreset.definitionId);
      return;
    }
    setActiveCategory("All");
    setSearchTerm("");
  }, [palettePreset]);

  const [palettePanelOpen, setPalettePanelOpen] = useState(true);

  useEffect(() => {
    if (!embedded || typeof window === "undefined") {
      return;
    }
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setPalettePanelOpen(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [embedded]);

  const [copied, setCopied] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportSource, setExportSource] = useState("");
  const [layoutStatus, setLayoutStatus] = useState<string | null>(null);
  const [dropHint, setDropHint] = useState<{ targetId: string; position: "before" | "after" } | null>(
    null,
  );
  const lastDropHintRef = useRef<{ targetId: string; position: "before" | "after" } | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const skipSaveStatusRef = useRef(true);
  const layoutStatusClearRef = useRef<number | null>(null);
  const pendingUserMessageRef = useRef(false);

  const armExplicitLayoutMessage = (message: string, pendingMs: number) => {
    if (layoutStatusClearRef.current) {
      window.clearTimeout(layoutStatusClearRef.current);
      layoutStatusClearRef.current = null;
    }
    pendingUserMessageRef.current = true;
    setLayoutStatus(message);
    window.setTimeout(() => {
      pendingUserMessageRef.current = false;
      setLayoutStatus(null);
    }, pendingMs);
  };

  const clearLayoutStatusLater = (ms: number) => {
    if (layoutStatusClearRef.current) window.clearTimeout(layoutStatusClearRef.current);
    layoutStatusClearRef.current = window.setTimeout(() => {
      layoutStatusClearRef.current = null;
      setLayoutStatus(null);
    }, ms);
  };

  useEffect(() => {
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(canvas));
    } catch {
      /* ignore */
    }

    if (skipSaveStatusRef.current) {
      skipSaveStatusRef.current = false;
      return;
    }
    if (pendingUserMessageRef.current) return;

    const show = window.setTimeout(() => {
      if (pendingUserMessageRef.current) return;
      setLayoutStatus("Saved");
      clearLayoutStatusLater(2000);
    }, 500);

    return () => window.clearTimeout(show);
  }, [canvas]);

  useEffect(() => {
    if (canvas.length === 0) {
      if (selectedId !== "") setSelectedId("");
      return;
    }
    if (!canvas.some((c) => c.instanceId === selectedId)) {
      setSelectedId(canvas[0].instanceId);
    }
  }, [canvas, selectedId]);

  useEffect(
    () => () => {
      if (layoutStatusClearRef.current) window.clearTimeout(layoutStatusClearRef.current);
    },
    [],
  );

  const selected = canvas.find((item) => item.instanceId === selectedId) || canvas[0];

  const inspectorSettingDefs = selected ? getInspectorFieldsFor(selected.definitionId) : undefined;
  const inspectorDefaults = useMemo(
    () => (selected ? getDefaultSettingsFor(selected.definitionId) : {}),
    [selected?.definitionId],
  );

  const filteredComponents = useMemo(() => {
    return uiComponents.filter((item) => {
      const matchesCategory =
        activeCategory === "All" ||
        (activeCategory === "Variants" ? hasVariantSupport(item.id) : item.category === activeCategory);
      const matchesSearch = `${item.name} ${item.description}`.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchTerm]);

  const updateSelected = (updates: Partial<CanvasComponent>) => {
    if (!selected) return;
    setCanvas((items) =>
      items.map((item) => (item.instanceId === selected.instanceId ? { ...item, ...updates } : item))
    );
  };

  const patchSelectedSetting = (key: string, value: CanvasSettingsValue) => {
    if (!selected) return;
    setCanvas((items) =>
      items.map((item) =>
        item.instanceId === selected.instanceId
          ? { ...item, settings: { ...(item.settings ?? {}), [key]: value } }
          : item,
      ),
    );
  };

  const addComponent = (definitionId: string) => {
    const definition = uiComponents.find((item) => item.id === definitionId);
    if (!definition) return;
    const instance = makeInstance(definition);
    setCanvas((items) => [...items, instance]);
    setSelectedId(instance.instanceId);
  };

  const addPaletteItemNear = (definitionId: string, targetId: string, position: "before" | "after") => {
    const definition = uiComponents.find((item) => item.id === definitionId);
    if (!definition) return;
    const instance = makeInstance(definition);
    setCanvas((items) => insertCanvasItemAt(items, instance, targetId, position));
    setSelectedId(instance.instanceId);
  };

  const addVariantExample = () => {
    if (!selected) return;
    const definition = uiComponents.find((item) => item.id === selected.definitionId);
    if (!definition) return;
    const instance = makeInstance(definition);
    const v = selected.settings?.variant;
    if (typeof v === "string") {
      instance.settings = { ...(instance.settings ?? {}), variant: v };
    }
    instance.title = `${definition.defaultTitle} (${typeof v === "string" ? v : "variant"})`;
    setCanvas((items) => [...items, instance]);
    setSelectedId(instance.instanceId);
  };

  const duplicateSelected = () => {
    if (!selected) return;
    const clonedSettings: CanvasSettings | undefined = selected.settings
      ? (Object.fromEntries(
          Object.entries(selected.settings).map(([k, v]) => [
            k,
            Array.isArray(v) ? [...v] : v,
          ]),
        ) as CanvasSettings)
      : undefined;
    const copy = {
      ...selected,
      instanceId: `${selected.definitionId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: `${selected.title} Copy`,
      settings: clonedSettings,
    };
    setCanvas((items) => [...items, copy]);
    setSelectedId(copy.instanceId);
  };

  const deleteSelected = () => {
    if (!selected) return;
    const remaining = canvas.filter((item) => item.instanceId !== selected.instanceId);
    setCanvas(remaining);
    setSelectedId(remaining[0]?.instanceId || "");
  };

  const moveSelected = (direction: "up" | "down") => {
    if (!selected) return;
    const currentIndex = canvas.findIndex((item) => item.instanceId === selected.instanceId);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= canvas.length) return;

    const nextCanvas = [...canvas];
    const [movedItem] = nextCanvas.splice(currentIndex, 1);
    nextCanvas.splice(targetIndex, 0, movedItem);
    setCanvas(nextCanvas);
  };

  const handlePaletteDragStart = (event: React.DragEvent<HTMLButtonElement>, definitionId: string) => {
    event.dataTransfer.setData(PALETTE_DRAG_TYPE, definitionId);
    event.dataTransfer.effectAllowed = "copy";
  };

  const clearDropHint = () => {
    lastDropHintRef.current = null;
    setDropHint(null);
  };

  const updateCardDropHint = (event: React.DragEvent, targetId: string) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const position = event.clientY < rect.top + rect.height / 2 ? "before" : "after";
    lastDropHintRef.current = { targetId, position };
    setDropHint({ targetId, position });
    const types = Array.from(event.dataTransfer.types);
    const fromCanvas = types.includes(CANVAS_ITEM_DRAG_TYPE);
    event.dataTransfer.dropEffect = fromCanvas ? "move" : "copy";
  };

  const handleCanvasSurfaceDrop = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    clearDropHint();
    const paletteId = event.dataTransfer.getData(PALETTE_DRAG_TYPE);
    const canvasId = event.dataTransfer.getData(CANVAS_ITEM_DRAG_TYPE);
    if (paletteId) {
      addComponent(paletteId);
      return;
    }
    if (canvasId) {
      setCanvas((items) => {
        const item = items.find((i) => i.instanceId === canvasId);
        if (!item) return items;
        const rest = items.filter((i) => i.instanceId !== canvasId);
        return [...rest, item];
      });
      setSelectedId(canvasId);
    }
  };

  const handleCanvasGridGutterDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    handleCanvasSurfaceDrop(event);
  };

  const handleCanvasCardDrop = (event: React.DragEvent, targetId: string) => {
    event.preventDefault();
    event.stopPropagation();
    const paletteId = event.dataTransfer.getData(PALETTE_DRAG_TYPE);
    const canvasId = event.dataTransfer.getData(CANVAS_ITEM_DRAG_TYPE);
    const hint = lastDropHintRef.current;
    const position = hint?.targetId === targetId ? hint.position : "after";
    clearDropHint();

    if (paletteId) {
      addPaletteItemNear(paletteId, targetId, position);
      return;
    }
    if (canvasId) {
      setCanvas((items) => reorderCanvasItems(items, canvasId, targetId, position));
      setSelectedId(canvasId);
    }
  };

  const handleCanvasCardDragOver = (event: React.DragEvent, targetId: string) => {
    event.preventDefault();
    event.stopPropagation();
    updateCardDropHint(event, targetId);
  };

  const handleCanvasDragHandleStart = (event: React.DragEvent, instanceId: string) => {
    event.stopPropagation();
    event.dataTransfer.setData(CANVAS_ITEM_DRAG_TYPE, instanceId);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleResetLayout = () => {
    if (
      !window.confirm(
        "Reset the layout to the default starter canvas? This clears saved layout data from this browser.",
      )
    ) {
      return;
    }
    try {
      localStorage.removeItem(LAYOUT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    armExplicitLayoutMessage("Layout reset", 3200);
    setCanvas([...starterCanvas]);
    setSelectedId(starterCanvas[0].instanceId);
  };

  const handleImportLayoutClick = () => {
    importInputRef.current?.click();
  };

  const handleApplyToMyBuild = () => {
    if (
      !window.confirm(
        "Apply the current canvas to My Build? It will appear as a read-only section below your main app until you clear it.",
      )
    ) {
      return;
    }
    try {
      localStorage.setItem(APPLIED_LAYOUT_STORAGE_KEY, JSON.stringify(canvas));
      armExplicitLayoutMessage("Applied to My Build", 3200);
    } catch {
      armExplicitLayoutMessage("Could not apply layout", 4000);
    }
  };

  const handleClearAppliedLayout = () => {
    if (!window.confirm("Remove the applied layout from My Build? This does not change your UI Builder canvas.")) {
      return;
    }
    try {
      localStorage.removeItem(APPLIED_LAYOUT_STORAGE_KEY);
      armExplicitLayoutMessage("Applied layout cleared", 3200);
    } catch {
      armExplicitLayoutMessage("Could not clear applied layout", 4000);
    }
  };

  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data: unknown = JSON.parse(String(reader.result));
        if (validateCanvasPayload(data)) {
          armExplicitLayoutMessage("Layout imported", 3200);
          setCanvas(data);
          setSelectedId(data[0]?.instanceId ?? "");
        } else {
          armExplicitLayoutMessage("Invalid layout file", 5000);
        }
      } catch {
        armExplicitLayoutMessage("Invalid layout file", 5000);
      }
    };
    reader.onerror = () => {
      armExplicitLayoutMessage("Invalid layout file", 5000);
    };
    reader.readAsText(file);
  };

  const copyLayoutJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(canvas, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const downloadLayoutJson = () => {
    const file = new Blob([JSON.stringify(canvas, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "491wd-ui-layout.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenExportReact = () => {
    if (canvas.length === 0) {
      armExplicitLayoutMessage("Nothing to export", 2800);
      return;
    }
    setExportSource(generateExportedUiLayoutTsx(canvas));
    setExportModalOpen(true);
  };

  const handleCopyExportedReact = async () => {
    try {
      await navigator.clipboard.writeText(exportSource);
      armExplicitLayoutMessage("React code copied", 2600);
    } catch {
      armExplicitLayoutMessage("Could not copy to clipboard", 3500);
    }
  };

  const handleDownloadExportedTsx = () => {
    const file = new Blob([exportSource], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ExportedUiLayout.tsx";
    link.click();
    URL.revokeObjectURL(url);
  };

  const helpToggleFooter = (
    <div className={embedded ? "wd-embedded-palette__help" : "wd-sidebar-footer"}>
      <button
        type="button"
        className={helpModeEnabled ? "wd-help-toggle wd-help-toggle--active" : "wd-help-toggle"}
        onClick={toggleHelpMode}
        aria-pressed={helpModeEnabled}
        aria-label={helpModeEnabled ? "Turn off help tips" : "Turn on help tips"}
        title="Toggle hover and focus tips for builder controls (saved in localStorage)"
      >
        ?
      </button>
      <span
        className={helpModeEnabled ? "wd-help-toggle__caption" : "wd-help-toggle__caption wd-help-toggle__caption--off"}
        aria-live="polite"
      >
        {helpModeEnabled ? "Help tips on" : "Help tips off"}
      </span>
    </div>
  );

  const renderPaletteCore = (appearance: "sidebar" | "embedded") => {
    const emb = appearance === "embedded";
    return (
      <>
        <HelpHint
          title="Search components"
          description="Filters the palette by component name and description. Case-insensitive substring match."
        >
          <div className="wd-search-wrap">
            <input
              className={emb ? "wd-search wd-search--embedded-palette" : "wd-search"}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search UI..."
              aria-label="Search components in palette"
            />
          </div>
        </HelpHint>

        <HelpHint
          title="Category tabs"
          description="Show All, Base UI, Advanced UI, or Variants (components with style presets). Search still applies."
        >
          <div className={emb ? "wd-category-tabs wd-category-tabs--embedded-palette" : "wd-category-tabs"}>
            {(["All", "Base UI", "Advanced UI", "Variants"] as const).map((category) => (
              <button
                key={category}
                type="button"
                className={activeCategory === category ? "wd-category-active" : ""}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </HelpHint>

        <HelpHint
          title="Component palette"
          description="Click a row to append that component to the canvas. Drag a row onto the canvas or onto another card to insert or reorder copies."
        >
          <div className={emb ? "wd-component-list wd-component-list--embedded-palette" : "wd-component-list"}>
            {filteredComponents.map((component) => (
              <button
                key={component.id}
                type="button"
                className={
                  emb
                    ? "wd-component-button wd-component-button--embedded-palette wd-component-button--with-preview"
                    : "wd-component-button wd-component-button--with-preview"
                }
                draggable
                onDragStart={(event) => handlePaletteDragStart(event, component.id)}
                onClick={() => addComponent(component.id)}
              >
                <span className="wd-palette-card-preview" aria-hidden="true">
                  {renderPalettePreview(component)}
                </span>
                <span className="wd-palette-card-copy">
                  <span className="wd-palette-card-title">{component.name}</span>
                  <small className="wd-palette-card-meta">{component.category}</small>
                  {emb ? <span className="wd-palette-card-desc">{component.description}</span> : null}
                </span>
              </button>
            ))}
          </div>
        </HelpHint>
        {emb ? helpToggleFooter : null}
      </>
    );
  };

  return (
    <>
    <main
      className={
        embedded ? "wd-app-shell wd-app-shell--embedded wd-ui-builder--embedded" : "wd-app-shell"
      }
    >
      {!embedded ? (
        <aside className="wd-sidebar">
          <div className="wd-sidebar-body">
            <div className="wd-brand">
              <div className="wd-brand-mark">49</div>
              <div>
                <strong>491WD</strong>
                <span>UI Builder</span>
              </div>
            </div>
            {renderPaletteCore("sidebar")}
          </div>
          {helpToggleFooter}
        </aside>
      ) : null}

      <section className={embedded ? "wd-main-panel wd-main-panel--embedded" : "wd-main-panel"}>
        <header className={embedded ? "wd-topbar wd-topbar--embedded" : "wd-topbar"}>
          <div className="wd-topbar__intro">
            {embedded ? (
              <>
                <p className="wd-eyebrow">UI Builder</p>
                <h1>Canvas & inspector</h1>
                <p className="wd-topbar__subtitle">
                  Import, export, and apply layouts — same tools as standalone, compact console layout.
                </p>
              </>
            ) : (
              <>
                <p className="wd-eyebrow">Editable Design Workspace</p>
                <h1>Move and edit Base UI + Advanced UI components</h1>
              </>
            )}
          </div>

          <div className={embedded ? "wd-topbar-actions wd-topbar-actions--embedded-toolbar" : "wd-topbar-actions"}>
            {layoutStatus ? (
              <HelpHint
                layout="inline"
                title="Saved status messages"
                description="Shows confirmation or errors for import, apply, reset, export, clipboard actions, and autosave (“Saved”)."
              >
                <span
                  className={`wd-layout-status ${
                    layoutStatus === "Invalid layout file" || layoutStatus.startsWith("Could not")
                      ? "wd-layout-status-error"
                      : ""
                  }`}
                  role="status"
                >
                  {layoutStatus}
                </span>
              </HelpHint>
            ) : null}
            <input
              ref={importInputRef}
              type="file"
              accept=".json,application/json"
              className="wd-layout-import-input"
              aria-hidden
              tabIndex={-1}
              onChange={handleImportFileChange}
            />
            <HelpHint
              layout="inline"
              title="Import Layout"
              description="Load a JSON file of canvas rows. Must pass validateCanvasPayload (valid ids, fields, optional settings)."
            >
              <button type="button" className="wd-btn wd-btn-outline" onClick={handleImportLayoutClick}>
                Import Layout
              </button>
            </HelpHint>
            <HelpHint
              layout="inline"
              title="Copy JSON"
              description="Copies the current canvas JSON to the clipboard (pretty-printed)."
            >
              <button type="button" className="wd-btn wd-btn-ghost" onClick={copyLayoutJson}>
                {copied ? "Copied" : "Copy JSON"}
              </button>
            </HelpHint>
            <HelpHint
              layout="inline"
              title="Download Layout"
              description="Downloads 491wd-ui-layout.json containing the current canvas."
            >
              <button type="button" className="wd-btn wd-btn-outline" onClick={downloadLayoutJson}>
                Download Layout
              </button>
            </HelpHint>
            <HelpHint
              layout="inline"
              title="Export React Code"
              description="Opens a modal with standalone ExportedUiLayout.tsx source including settings and render logic."
            >
              <button type="button" className="wd-btn wd-btn-outline" onClick={handleOpenExportReact}>
                Export React Code
              </button>
            </HelpHint>
            <HelpHint
              layout="inline"
              title="Apply to My Build"
              description="Writes the current canvas to localStorage key 491wd-applied-ui-layout so My Build shows AppliedUiSection."
            >
              <button type="button" className="wd-btn wd-btn-primary" onClick={handleApplyToMyBuild}>
                Apply to My Build
              </button>
            </HelpHint>
            <HelpHint
              layout="inline"
              title="Clear Applied Layout"
              description="Removes the applied layout from My Build only. Does not change the UI Builder canvas."
            >
              <button type="button" className="wd-btn wd-btn-outline" onClick={handleClearAppliedLayout}>
                Clear Applied Layout
              </button>
            </HelpHint>
            <HelpHint
              layout="inline"
              title="Reset Layout"
              description="Clears saved builder storage and restores starterCanvas after confirmation."
            >
              <button type="button" className="wd-btn wd-btn-outline" onClick={handleResetLayout}>
                Reset Layout
              </button>
            </HelpHint>
            <HelpHint
              layout="inline"
              title="Clear Canvas"
              description="Removes all rows from the canvas in memory (does not clear localStorage until the next autosave cycle writes an empty array)."
            >
              <button type="button" className="wd-btn wd-btn-danger" onClick={() => setCanvas([])}>
                Clear Canvas
              </button>
            </HelpHint>
          </div>
        </header>

        {embedded ? (
          <div className={`wd-embedded-palette ${palettePanelOpen ? "wd-embedded-palette--open" : ""}`}>
            <button
              type="button"
              className="wd-embedded-palette__toggle"
              aria-expanded={palettePanelOpen}
              aria-controls="wd-embedded-palette-body"
              id="wd-embedded-palette-toggle"
              onClick={() => setPalettePanelOpen((v) => !v)}
            >
              <span className="wd-embedded-palette__toggle-main">
                <span className="wd-embedded-palette__toggle-label">Component palette</span>
                <span className="wd-embedded-palette__toggle-count">{filteredComponents.length} match</span>
              </span>
              <span className="wd-embedded-palette__toggle-icon" aria-hidden>
                {palettePanelOpen ? "▾" : "▸"}
              </span>
            </button>
            <div
              className="wd-embedded-palette__body wd-component-palette"
              id="wd-embedded-palette-body"
              role="region"
              aria-labelledby="wd-embedded-palette-toggle"
            >
              {renderPaletteCore("embedded")}
            </div>
          </div>
        ) : null}

        <div className={embedded ? "wd-workspace wd-workspace--embedded" : "wd-workspace"}>
          <HelpHint
            title="Design canvas"
            description="Drop palette items here or between cards. Drag cards by the handle to reorder. Empty state accepts drops anywhere in the grid area."
          >
            <section
              className={embedded ? "wd-canvas wd-canvas--embedded" : "wd-canvas"}
              onDragOver={(event) => {
                event.preventDefault();
                const types = Array.from(event.dataTransfer.types);
                event.dataTransfer.dropEffect = types.includes(CANVAS_ITEM_DRAG_TYPE) ? "move" : "copy";
              }}
              onDrop={handleCanvasSurfaceDrop}
            >
              <div className="wd-canvas-header">
                <div>
                  <h2>Design Canvas</h2>
                  <p>
                    {embedded
                      ? "Click a component to edit it. Open the palette above to search, filter, or drag components onto the canvas. Drag the handle on a card to reorder."
                      : "Click a component to edit it. Drag from the left menu to add more. Drag the handle on a card to reorder."}
                  </p>
                </div>
                <span>{canvas.length} components</span>
              </div>

              {canvas.length === 0 ? (
                <div className="wd-empty-canvas">
                  <h3>Your canvas is empty</h3>
                  <p>
                    {embedded
                      ? "Open the Component palette above, then click or drag a component into the canvas."
                      : "Click or drag any component from the left sidebar to start building."}
                  </p>
                </div>
              ) : (
                <div
                  className="wd-canvas-grid"
                  onDragOver={(event) => {
                    event.preventDefault();
                    const types = Array.from(event.dataTransfer.types);
                    event.dataTransfer.dropEffect = types.includes(CANVAS_ITEM_DRAG_TYPE) ? "move" : "copy";
                  }}
                  onDrop={handleCanvasGridGutterDrop}
                >
                  {canvas.map((item) => {
                    const definition = uiComponents.find((component) => component.id === item.definitionId);
                    if (!definition) return null;

                    const dropBefore =
                      dropHint?.targetId === item.instanceId && dropHint.position === "before";
                    const dropAfter = dropHint?.targetId === item.instanceId && dropHint.position === "after";

                    return (
                      <HelpHint
                        key={item.instanceId}
                        title="Canvas card"
                        description="Click the card to select and edit in the inspector. Drag ⋮⋮ to reorder. Drop palette items on the top or bottom half of a card to insert before or after."
                      >
                        <article
                          className={`wd-canvas-card wd-size-${item.size} ${
                            selectedId === item.instanceId ? "wd-selected-card" : ""
                          } ${dropBefore ? "wd-drop-before" : ""} ${dropAfter ? "wd-drop-after" : ""}`}
                          style={{ "--wd-accent": item.accent } as React.CSSProperties}
                          onClick={() => setSelectedId(item.instanceId)}
                          onDragOver={(event) => handleCanvasCardDragOver(event, item.instanceId)}
                          onDrop={(event) => handleCanvasCardDrop(event, item.instanceId)}
                        >
                          <div className="wd-card-toolbar">
                            <HelpHint
                              title="Reorder handle"
                              description="Drag to move this card before or after another card, or onto the canvas gutter to send it to the end."
                            >
                              <span
                                className="wd-canvas-drag-handle"
                                title="Drag to reorder"
                                draggable
                                onDragStart={(event) => handleCanvasDragHandleStart(event, item.instanceId)}
                                onDragEnd={() => clearDropHint()}
                                onClick={(event) => event.stopPropagation()}
                                aria-label="Drag to reorder on canvas"
                              >
                                ⋮⋮
                              </span>
                            </HelpHint>
                            <span className="wd-card-toolbar-title">{definition.name}</span>
                            <HelpHint title="Edit" description="Selects this card and opens its fields in the inspector.">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedId(item.instanceId);
                                }}
                              >
                                Edit
                              </button>
                            </HelpHint>
                          </div>

                          {renderPreview(definition.id, item)}
                        </article>
                      </HelpHint>
                    );
                  })}
                </div>
              )}
            </section>
          </HelpHint>

          <aside className={embedded ? "wd-editor wd-editor--embedded" : "wd-editor"}>
            <div className={embedded ? "wd-editor-card wd-editor-card--embedded" : "wd-editor-card"}>
              <HelpHint
                title="Inspector — Edit selected"
                description="Edits apply to the highlighted canvas card and autosave with the layout JSON."
              >
                <div className="wd-editor-heading">
                  <p className="wd-eyebrow">Inspector</p>
                  <h2>Edit Selected</h2>
                </div>
              </HelpHint>

              {selected ? (
                <>
                  <HelpHint
                    title="Component title"
                    description="Short heading shown in previews and export. Stored on the selected canvas row."
                  >
                    <label className="wd-field">
                      Component Title
                      <input
                        value={selected.title}
                        onChange={(event) => updateSelected({ title: event.target.value })}
                      />
                    </label>
                  </HelpHint>

                  <HelpHint
                    title="Component text"
                    description="Body copy or secondary text for previews. Maps to the row body field."
                  >
                    <label className="wd-field">
                      Component Text
                      <textarea
                        value={selected.body}
                        onChange={(event) => updateSelected({ body: event.target.value })}
                      />
                    </label>
                  </HelpHint>

                  <HelpHint
                    title="Accent color"
                    description="Drives CSS variable --wd-accent on the card for preview chrome and many wd-* accents."
                  >
                    <label className="wd-field">
                      Accent Color
                      <input
                        type="color"
                        value={selected.accent}
                        onChange={(event) => updateSelected({ accent: event.target.value })}
                      />
                    </label>
                  </HelpHint>

                  <HelpHint
                    title="Size"
                    description="compact, normal, or wide grid span for this card in builder and preview grids."
                  >
                    <label className="wd-field">
                      Size
                      <select
                        value={selected.size}
                        onChange={(event) => updateSelected({ size: event.target.value as CanvasComponent["size"] })}
                      >
                        <option value="compact">Compact</option>
                        <option value="normal">Normal</option>
                        <option value="wide">Wide</option>
                      </select>
                    </label>
                  </HelpHint>

                  {inspectorSettingDefs && inspectorSettingDefs.length > 0 ? (
                    <HelpHint
                      title="Component Settings"
                      description="Variant/style presets and per-type fields from getInspectorFieldsFor. Values live in item.settings and flow to Saved UI Preview, Applied layout, JSON import/export, and React export."
                    >
                      <div className="wd-inspector-settings">
                        <p className="wd-eyebrow">Component Settings</p>
                        {inspectorSettingDefs.map((def) => {
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
                              <HelpHint
                                key={def.key}
                                title={`Select: ${def.label}`}
                                description="Stored as a string in settings.variant (or another key). Drives preview CSS modifiers and the exported standalone render."
                              >
                                <label className="wd-field">
                                  {def.label}
                                  <select
                                    value={val}
                                    onChange={(event) => patchSelectedSetting(def.key, event.target.value)}
                                  >
                                    {def.options.map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              </HelpHint>
                            );
                          }
                          if (def.type === "string") {
                            return (
                              <HelpHint
                                key={def.key}
                                title={`Text setting: ${def.label}`}
                                description="Stored as a string in settings. Used by renderPreview with sensible fallbacks to title/body when unset."
                              >
                                <label className="wd-field">
                                  {def.label}
                                  <input
                                    value={typeof raw === "string" ? raw : ""}
                                    onChange={(event) => patchSelectedSetting(def.key, event.target.value)}
                                  />
                                </label>
                              </HelpHint>
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
                              <HelpHint
                                key={def.key}
                                title={`Number setting: ${def.label}`}
                                description="Stored as a number in settings (for example percent, columns, heading level)."
                              >
                                <label className="wd-field">
                                  {def.label}
                                  <input
                                    type="number"
                                    value={Number.isFinite(n) ? n : 0}
                                    onChange={(event) => {
                                      const next = Number(event.target.value);
                                      patchSelectedSetting(def.key, Number.isFinite(next) ? next : 0);
                                    }}
                                  />
                                </label>
                              </HelpHint>
                            );
                          }
                          if (def.type === "boolean") {
                            const fallbackBool =
                              typeof inspectorDefaults[def.key] === "boolean"
                                ? (inspectorDefaults[def.key] as boolean)
                                : false;
                            const checked = typeof raw === "boolean" ? raw : fallbackBool;
                            return (
                              <HelpHint
                                key={def.key}
                                title={`Toggle: ${def.label}`}
                                description="Stored as boolean in settings for on/off behaviors in previews."
                              >
                                <label className="wd-field">
                                  <span className="wd-field-check-row">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(event) => patchSelectedSetting(def.key, event.target.checked)}
                                    />
                                    {def.label}
                                  </span>
                                </label>
                              </HelpHint>
                            );
                          }
                          const lines = Array.isArray(raw)
                            ? raw.join("\n")
                            : Array.isArray(inspectorDefaults[def.key])
                              ? (inspectorDefaults[def.key] as string[]).join("\n")
                              : "";
                          return (
                            <HelpHint
                              key={def.key}
                              title={`List setting: ${def.label}`}
                              description="One non-empty line becomes one string in a string[] in settings. Empty lines are skipped."
                            >
                              <label className="wd-field">
                                {def.label}
                                <textarea
                                  value={lines}
                                  onChange={(event) => {
                                    const next = event.target.value
                                      .split("\n")
                                      .map((line) => line.trim())
                                      .filter((line) => line.length > 0);
                                    patchSelectedSetting(def.key, next);
                                  }}
                                />
                              </label>
                            </HelpHint>
                          );
                        })}
                      </div>
                    </HelpHint>
                  ) : null}

                  <div className="wd-editor-actions">
                    {hasVariantSupport(selected.definitionId) ? (
                      <HelpHint
                        layout="inline"
                        title="Add variant example"
                        description="Appends a new canvas row for this component type using the current Variant / style from settings (plus default labels)."
                      >
                        <button type="button" className="wd-btn wd-btn-outline" onClick={addVariantExample}>
                          Add variant example
                        </button>
                      </HelpHint>
                    ) : null}
                    <HelpHint layout="inline" title="Move Up" description="Moves the selected card earlier in the canvas order.">
                      <button type="button" className="wd-btn wd-btn-outline" onClick={() => moveSelected("up")}>
                        Move Up
                      </button>
                    </HelpHint>
                    <HelpHint layout="inline" title="Move Down" description="Moves the selected card later in the canvas order.">
                      <button type="button" className="wd-btn wd-btn-outline" onClick={() => moveSelected("down")}>
                        Move Down
                      </button>
                    </HelpHint>
                    <HelpHint
                      layout="inline"
                      title="Duplicate"
                      description="Clones the row with a new instanceId and “ Copy” suffix on the title; settings arrays are shallow-copied."
                    >
                      <button type="button" className="wd-btn wd-btn-ghost" onClick={duplicateSelected}>
                        Duplicate
                      </button>
                    </HelpHint>
                    <HelpHint layout="inline" title="Delete" description="Removes the selected row from the canvas after click (no extra confirm).">
                      <button type="button" className="wd-btn wd-btn-danger" onClick={deleteSelected}>
                        Delete
                      </button>
                    </HelpHint>
                  </div>
                </>
              ) : (
                <p className="wd-muted">Select a component to edit it.</p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>

    {exportModalOpen ? (
      <div
        className="wd-export-modal-backdrop"
        role="presentation"
        onClick={() => setExportModalOpen(false)}
      >
        <div
          className="wd-export-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wd-export-react-title"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="wd-export-modal__header">
            <div>
              <p className="wd-export-modal__eyebrow">UI Builder</p>
              <h2 id="wd-export-react-title">Export React code</h2>
              <p className="wd-export-modal__lede">
                Standalone component <code>ExportedUiLayout</code> with your current canvas data. Adjust the
                import path if you save the file somewhere other than <code>src/components/</code>.
              </p>
            </div>
          </div>

          <div className="wd-export-modal__code-wrap">
            <pre className="wd-export-modal__pre">
              <code>{exportSource}</code>
            </pre>
          </div>

          <div className="wd-export-modal__footer">
            <HelpHint layout="inline" title="Copy Code" description="Copies the full generated TSX string to the clipboard.">
              <button type="button" className="wd-btn wd-btn-primary" onClick={handleCopyExportedReact}>
                Copy Code
              </button>
            </HelpHint>
            <HelpHint layout="inline" title="Download .tsx" description="Saves ExportedUiLayout.tsx to your downloads folder.">
              <button type="button" className="wd-btn wd-btn-outline" onClick={handleDownloadExportedTsx}>
                Download .tsx
              </button>
            </HelpHint>
            <HelpHint layout="inline" title="Close export" description="Dismisses the modal without changing the canvas.">
              <button type="button" className="wd-btn wd-btn-ghost" onClick={() => setExportModalOpen(false)}>
                Close
              </button>
            </HelpHint>
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
}

export default UiBuilderPage;
