import { useCallback, useRef, useState, type CSSProperties, type Dispatch, type DragEvent, type SetStateAction } from "react";
import {
  CANVAS_ITEM_DRAG_TYPE,
  insertCanvasItemAt,
  makeInstance,
  PALETTE_DRAG_TYPE,
  reorderCanvasItems,
  renderPreview,
  uiComponents,
  type CanvasComponent,
} from "../lib/uiBuilderLayout";

type DropHint = { targetId: string; position: "before" | "after" };

export type PageDropZoneProps = {
  sections: CanvasComponent[];
  onSectionsChange: Dispatch<SetStateAction<CanvasComponent[]>>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

export default function PageDropZone({ sections, onSectionsChange, selectedId, onSelect }: PageDropZoneProps) {
  const [dropHint, setDropHint] = useState<DropHint | null>(null);
  const lastDropHintRef = useRef<DropHint | null>(null);

  const clearDropHint = useCallback(() => {
    lastDropHintRef.current = null;
    setDropHint(null);
  }, []);

  const updateCardDropHint = useCallback((event: DragEvent, targetId: string) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const position = event.clientY < rect.top + rect.height / 2 ? "before" : "after";
    lastDropHintRef.current = { targetId, position };
    setDropHint({ targetId, position });
    const types = Array.from(event.dataTransfer.types);
    const fromCanvas = types.includes(CANVAS_ITEM_DRAG_TYPE);
    event.dataTransfer.dropEffect = fromCanvas ? "move" : "copy";
  }, []);

  const addComponent = useCallback(
    (definitionId: string) => {
      const definition = uiComponents.find((c) => c.id === definitionId);
      if (!definition) {
        return;
      }
      const instance = makeInstance(definition);
      onSectionsChange((prev) => [...prev, instance]);
      onSelect(instance.instanceId);
    },
    [onSectionsChange, onSelect],
  );

  const addPaletteItemNear = useCallback(
    (definitionId: string, targetId: string, position: "before" | "after") => {
      const definition = uiComponents.find((c) => c.id === definitionId);
      if (!definition) {
        return;
      }
      const instance = makeInstance(definition);
      onSectionsChange((prev) => insertCanvasItemAt(prev, instance, targetId, position));
      onSelect(instance.instanceId);
    },
    [onSectionsChange, onSelect],
  );

  const handleSurfaceDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      clearDropHint();
      const paletteId = event.dataTransfer.getData(PALETTE_DRAG_TYPE);
      const canvasId = event.dataTransfer.getData(CANVAS_ITEM_DRAG_TYPE);
      if (paletteId) {
        addComponent(paletteId);
        return;
      }
      if (canvasId) {
        onSectionsChange((prev) => {
          const item = prev.find((i) => i.instanceId === canvasId);
          if (!item) {
            return prev;
          }
          return [...prev.filter((i) => i.instanceId !== canvasId), item];
        });
        onSelect(canvasId);
      }
    },
    [addComponent, clearDropHint, onSectionsChange, onSelect],
  );

  const handleGridGutterDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) {
        return;
      }
      handleSurfaceDrop(event);
    },
    [handleSurfaceDrop],
  );

  const handleCardDrop = useCallback(
    (event: DragEvent, targetId: string) => {
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
        onSectionsChange((prev) => reorderCanvasItems(prev, canvasId, targetId, position));
        onSelect(canvasId);
      }
    },
    [addPaletteItemNear, clearDropHint, onSectionsChange, onSelect],
  );

  const handleCardDragOver = useCallback(
    (event: DragEvent, targetId: string) => {
      event.preventDefault();
      event.stopPropagation();
      updateCardDropHint(event, targetId);
    },
    [updateCardDropHint],
  );

  const handleDragHandleStart = useCallback((event: DragEvent, instanceId: string) => {
    event.stopPropagation();
    event.dataTransfer.setData(CANVAS_ITEM_DRAG_TYPE, instanceId);
    event.dataTransfer.effectAllowed = "move";
  }, []);

  return (
    <section
      className="wd-pc-drop"
      onDragOver={(event) => {
        event.preventDefault();
        const types = Array.from(event.dataTransfer.types);
        event.dataTransfer.dropEffect = types.includes(CANVAS_ITEM_DRAG_TYPE) ? "move" : "copy";
      }}
      onDrop={handleSurfaceDrop}
    >
      <div className="wd-pc-drop__head">
        <h2 className="wd-pc-drop__title">Page layout</h2>
        <p className="wd-pc-drop__hint">
          Drag components from the palette into this zone. Drag ⋮⋮ on a card to reorder. Drop on empty area to append.
        </p>
        <span className="wd-pc-drop__count">{sections.length} sections</span>
      </div>

      {sections.length === 0 ? (
        <div className="wd-pc-drop__empty">
          <h3>Drop components here</h3>
          <p>Drag any item from the left palette onto this panel to add it to the target page.</p>
        </div>
      ) : (
        <div
          className="wd-pc-drop__grid"
          onDragOver={(event) => {
            event.preventDefault();
            const types = Array.from(event.dataTransfer.types);
            event.dataTransfer.dropEffect = types.includes(CANVAS_ITEM_DRAG_TYPE) ? "move" : "copy";
          }}
          onDrop={handleGridGutterDrop}
        >
          {sections.map((item) => {
            const definition = uiComponents.find((c) => c.id === item.definitionId);
            if (!definition) {
              return null;
            }
            const dropBefore = dropHint?.targetId === item.instanceId && dropHint.position === "before";
            const dropAfter = dropHint?.targetId === item.instanceId && dropHint.position === "after";

            return (
              <article
                key={item.instanceId}
                className={`wd-pc-card wd-size-${item.size} ${selectedId === item.instanceId ? "wd-pc-card--selected" : ""} ${dropBefore ? "wd-drop-before" : ""} ${dropAfter ? "wd-drop-after" : ""}`}
                style={{ "--wd-accent": item.accent } as CSSProperties}
                onClick={() => onSelect(item.instanceId)}
                onDragOver={(e) => handleCardDragOver(e, item.instanceId)}
                onDrop={(e) => handleCardDrop(e, item.instanceId)}
              >
                <div className="wd-pc-card__toolbar">
                  <span
                    className="wd-pc-card__handle"
                    title="Drag to reorder"
                    draggable
                    onDragStart={(e) => handleDragHandleStart(e, item.instanceId)}
                    onDragEnd={clearDropHint}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Drag to reorder section"
                  >
                    ⋮⋮
                  </span>
                  <span className="wd-pc-card__label">{definition.name}</span>
                  <button type="button" className="wd-pc-card__edit" onClick={(e) => {
                    e.stopPropagation();
                    onSelect(item.instanceId);
                  }}>
                    Edit
                  </button>
                </div>
                <div className="wd-pc-card__body">{renderPreview(definition.id, item)}</div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
