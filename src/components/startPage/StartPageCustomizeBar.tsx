import { Palette, Plus, SlidersHorizontal } from "lucide-react";

const COMING_LATER = "Layout editing coming later.";

/**
 * Quiet secondary Start Page controls — Wall Display style.
 * Full edit mode / widget picker / theme switcher come later.
 */
export function StartPageCustomizeBar() {
  return (
    <div className="fh-start-page__customize fh-home-customize" aria-label="Start page customization">
      <button
        type="button"
        className="fh-home-customize__btn"
        disabled
        title={COMING_LATER}
        aria-label={`Customize — ${COMING_LATER}`}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
        Customize
      </button>
      <button
        type="button"
        className="fh-home-customize__btn"
        disabled
        title={COMING_LATER}
        aria-label={`Add widget — ${COMING_LATER}`}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
        Add widget
      </button>
      <button
        type="button"
        className="fh-home-customize__btn"
        disabled
        title={COMING_LATER}
        aria-label={`Theme — ${COMING_LATER}`}
      >
        <Palette className="h-3.5 w-3.5" aria-hidden />
        Theme
      </button>
    </div>
  );
}
