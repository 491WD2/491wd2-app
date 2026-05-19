import { useEffect, useMemo, useRef, useState } from "react";
import "./ui-builder.css";
import {
  APPLIED_LAYOUT_STORAGE_KEY,
  CANVAS_ITEM_DRAG_TYPE,
  LAYOUT_STORAGE_KEY,
  PALETTE_DRAG_TYPE,
  insertCanvasItemAt,
  loadCanvasFromStorage,
  makeInstance,
  renderPreview,
  reorderCanvasItems,
  starterCanvas,
  uiComponents,
  validateCanvasPayload,
  type CanvasComponent,
  type UiCategory,
} from "./lib/uiBuilderLayout";

function UiBuilderPage() {
  const [activeCategory, setActiveCategory] = useState<UiCategory | "All">("All");
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
  const [copied, setCopied] = useState(false);
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

  const filteredComponents = useMemo(() => {
    return uiComponents.filter((item) => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
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

  const duplicateSelected = () => {
    if (!selected) return;
    const copy = {
      ...selected,
      instanceId: `${selected.definitionId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: `${selected.title} Copy`
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

  return (
    <main className="wd-app-shell">
      <aside className="wd-sidebar">
        <div className="wd-brand">
          <div className="wd-brand-mark">49</div>
          <div>
            <strong>491WD</strong>
            <span>UI Builder</span>
          </div>
        </div>

        <div className="wd-search-wrap">
          <input
            className="wd-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search UI..."
          />
        </div>

        <div className="wd-category-tabs">
          {(["All", "Base UI", "Advanced UI"] as const).map((category) => (
            <button
              key={category}
              className={activeCategory === category ? "wd-category-active" : ""}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="wd-component-list">
          {filteredComponents.map((component) => (
            <button
              key={component.id}
              className="wd-component-button"
              draggable
              onDragStart={(event) => handlePaletteDragStart(event, component.id)}
              onClick={() => addComponent(component.id)}
            >
              <span>{component.name}</span>
              <small>{component.category}</small>
            </button>
          ))}
        </div>
      </aside>

      <section className="wd-main-panel">
        <header className="wd-topbar">
          <div>
            <p className="wd-eyebrow">Editable Design Workspace</p>
            <h1>Move and edit Base UI + Advanced UI components</h1>
          </div>

          <div className="wd-topbar-actions">
            {layoutStatus ? (
              <span
                className={`wd-layout-status ${
                  layoutStatus === "Invalid layout file" ||
                  layoutStatus.startsWith("Could not")
                    ? "wd-layout-status-error"
                    : ""
                }`}
                role="status"
              >
                {layoutStatus}
              </span>
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
            <button type="button" className="wd-btn wd-btn-outline" onClick={handleImportLayoutClick}>
              Import Layout
            </button>
            <button type="button" className="wd-btn wd-btn-ghost" onClick={copyLayoutJson}>
              {copied ? "Copied" : "Copy JSON"}
            </button>
            <button type="button" className="wd-btn wd-btn-outline" onClick={downloadLayoutJson}>
              Download Layout
            </button>
            <button type="button" className="wd-btn wd-btn-primary" onClick={handleApplyToMyBuild}>
              Apply to My Build
            </button>
            <button type="button" className="wd-btn wd-btn-outline" onClick={handleClearAppliedLayout}>
              Clear Applied Layout
            </button>
            <button type="button" className="wd-btn wd-btn-outline" onClick={handleResetLayout}>
              Reset Layout
            </button>
            <button type="button" className="wd-btn wd-btn-danger" onClick={() => setCanvas([])}>
              Clear Canvas
            </button>
          </div>
        </header>

        <div className="wd-workspace">
          <section
            className="wd-canvas"
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
                  Click a component to edit it. Drag from the left menu to add more. Drag the handle on a
                  card to reorder.
                </p>
              </div>
              <span>{canvas.length} components</span>
            </div>

            {canvas.length === 0 ? (
              <div className="wd-empty-canvas">
                <h3>Your canvas is empty</h3>
                <p>Click or drag any component from the left sidebar to start building.</p>
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
                    <article
                      key={item.instanceId}
                      className={`wd-canvas-card wd-size-${item.size} ${
                        selectedId === item.instanceId ? "wd-selected-card" : ""
                      } ${dropBefore ? "wd-drop-before" : ""} ${dropAfter ? "wd-drop-after" : ""}`}
                      style={{ "--wd-accent": item.accent } as React.CSSProperties}
                      onClick={() => setSelectedId(item.instanceId)}
                      onDragOver={(event) => handleCanvasCardDragOver(event, item.instanceId)}
                      onDrop={(event) => handleCanvasCardDrop(event, item.instanceId)}
                    >
                      <div className="wd-card-toolbar">
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
                        <span className="wd-card-toolbar-title">{definition.name}</span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedId(item.instanceId);
                          }}
                        >
                          Edit
                        </button>
                      </div>

                      {renderPreview(definition.id, item)}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="wd-editor">
            <div className="wd-editor-card">
              <div className="wd-editor-heading">
                <p className="wd-eyebrow">Inspector</p>
                <h2>Edit Selected</h2>
              </div>

              {selected ? (
                <>
                  <label className="wd-field">
                    Component Title
                    <input
                      value={selected.title}
                      onChange={(event) => updateSelected({ title: event.target.value })}
                    />
                  </label>

                  <label className="wd-field">
                    Component Text
                    <textarea
                      value={selected.body}
                      onChange={(event) => updateSelected({ body: event.target.value })}
                    />
                  </label>

                  <label className="wd-field">
                    Accent Color
                    <input
                      type="color"
                      value={selected.accent}
                      onChange={(event) => updateSelected({ accent: event.target.value })}
                    />
                  </label>

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

                  <div className="wd-editor-actions">
                    <button className="wd-btn wd-btn-outline" onClick={() => moveSelected("up")}>
                      Move Up
                    </button>
                    <button className="wd-btn wd-btn-outline" onClick={() => moveSelected("down")}>
                      Move Down
                    </button>
                    <button className="wd-btn wd-btn-ghost" onClick={duplicateSelected}>
                      Duplicate
                    </button>
                    <button className="wd-btn wd-btn-danger" onClick={deleteSelected}>
                      Delete
                    </button>
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
  );
}

export default UiBuilderPage;
