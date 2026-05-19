import { useMemo } from "react";
import { loadAppliedCanvasFromStorage } from "../lib/uiBuilderLayout";
import { CanvasPreviewGrid } from "./CanvasPreviewGrid";

export default function AppliedUiSection() {
  const canvas = useMemo(() => loadAppliedCanvasFromStorage(), []);

  if (!canvas || canvas.length === 0) {
    return null;
  }

  return (
    <section className="wd-applied-ui-section" aria-label="Applied UI layout from UI Builder">
      <div className="wd-applied-ui-inner">
        <header className="wd-applied-ui-heading">
          <p className="wd-applied-ui-eyebrow">From UI Builder</p>
          <h2 className="wd-applied-ui-title">Applied layout</h2>
          <p className="wd-applied-ui-sub">
            Read-only view of the layout you promoted to My Build ({canvas.length} component
            {canvas.length === 1 ? "" : "s"}).
          </p>
        </header>
        <CanvasPreviewGrid items={canvas} className="wd-applied-ui-grid" />
      </div>
    </section>
  );
}
