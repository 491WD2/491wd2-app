import { useMemo } from "react";
import { loadCanvasFromStorage, type CanvasComponent } from "../lib/uiBuilderLayout";
import { CanvasPreviewGrid } from "./CanvasPreviewGrid";

export default function UiLayoutRenderer() {
  const canvas = useMemo((): CanvasComponent[] | null => loadCanvasFromStorage(), []);

  if (!canvas || canvas.length === 0) {
    return (
      <main className="wd-ui-preview-root">
        <div className="wd-ui-preview-empty">
          <div className="wd-ui-preview-empty-card">
            <p className="wd-ui-preview-eyebrow">Saved UI</p>
            <h1>No layout to preview</h1>
            <p className="wd-ui-preview-empty-copy">
              No saved UI layout yet. Open UI Builder to create one.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="wd-ui-preview-root">
      <header className="wd-ui-preview-hero">
        <p className="wd-ui-preview-eyebrow">Saved layout</p>
        <h1>Saved UI preview</h1>
        <p className="wd-ui-preview-lede">
          Read-only view of your canvas from UI Builder ({canvas.length} component
          {canvas.length === 1 ? "" : "s"}).
        </p>
      </header>

      <CanvasPreviewGrid items={canvas} />
    </main>
  );
}
