import type { CSSProperties } from "react";
import { renderPreview, uiComponents, type CanvasComponent } from "../lib/uiBuilderLayout";

type CanvasPreviewGridProps = {
  items: CanvasComponent[];
  className?: string;
};

export function CanvasPreviewGrid({ items, className = "wd-ui-preview-grid" }: CanvasPreviewGridProps) {
  return (
    <div className={className}>
      {items.map((item) => {
        const definition = uiComponents.find((c) => c.id === item.definitionId);
        if (!definition) return null;

        return (
          <article
            key={item.instanceId}
            className={`wd-ui-preview-card wd-size-${item.size}`}
            style={{ "--wd-accent": item.accent } as CSSProperties}
          >
            <div className="wd-ui-preview-card-meta">
              <span className="wd-ui-preview-pill">{definition.name}</span>
            </div>
            <div className="wd-ui-preview-card-body wd-ui-preview-readonly">
              {renderPreview(definition.id, item)}
            </div>
          </article>
        );
      })}
    </div>
  );
}
