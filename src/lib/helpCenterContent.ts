export type HelpCategory = "referential" | "procedural" | "conceptual" | "workflows";

export type HelpBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "h4"; text: string };

export type HelpArticle = {
  id: string;
  title: string;
  blocks: HelpBlock[];
};

export type HelpChapter = {
  id: string;
  letter: string;
  title: string;
  category: HelpCategory;
  articles: HelpArticle[];
};

export const HELP_CATEGORY_LABELS: Record<HelpCategory, string> = {
  referential: "Referential",
  procedural: "Procedural",
  conceptual: "Conceptual",
  workflows: "Workflow tutorials",
};

export const HELP_CHAPTERS: HelpChapter[] = [
  {
    id: "release-notes",
    letter: "A",
    title: "Release Notes",
    category: "referential",
    articles: [
      {
        id: "release-current",
        title: "Current version summary",
        blocks: [
          {
            type: "p",
            text: "491WD Build integrates a live household app (My Build), a drag-and-drop UI Builder with local persistence, Saved UI Preview, Apply to My Build, JSON import/export, standalone React export, component-specific settings, and this Help Center (static docs + search). Optional hover tips in the UI Builder explain controls when help mode is enabled.",
          },
          {
            type: "ul",
            items: [
              "Persistent localStorage layouts — builder canvas (491wd-ui-builder-layout) and optional applied layout (491wd-applied-ui-layout).",
              "My Build — primary app surface (CurrentBuild).",
              "UI Builder — compose canvas layouts with inspector and catalog.",
              "Saved UI Preview — read-only view of the layout stored in localStorage.",
              "Apply to My Build — copies the builder canvas into the applied layout slot.",
              "Import / Download / Copy JSON — share and backup layout data.",
              "Export React Code — generates standalone ExportedUiLayout.tsx source.",
              "Component settings — per-component fields beyond title/body/accent/size.",
              "Help Center — static in-app documentation, search, and category filters.",
              "Help mode — optional hover/focus tips in UI Builder (491wd-help-mode-enabled).",
            ],
          },
        ],
      },
      {
        id: "release-recent",
        title: "Recent improvements",
        blocks: [
          {
            type: "ul",
            items: [
              "Persistent UI Builder — canvas autosaved to localStorage key 491wd-ui-builder-layout.",
              "Saved UI Preview — same saved JSON, read-only grid.",
              "Apply to My Build — writes 491wd-applied-ui-layout.",
              "Import / Download / Copy JSON — round-trip layout files.",
              "Export React Code — TSX from generateExportedUiLayoutTsx.",
              "Component-specific settings — optional settings on each canvas row.",
              "Help Center — referential, procedural, conceptual docs and workflows (no network required).",
              "Hover help mode — UI Builder tips toggled from the sidebar; stored as 491wd-help-mode-enabled.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "patch-notes",
    letter: "B",
    title: "Patch Notes",
    category: "referential",
    articles: [
      {
        id: "patch-timeline",
        title: "Chronological patch highlights",
        blocks: [
          {
            type: "p",
            text: "Major milestones were added incrementally. After each major stage, npm run build was kept passing.",
          },
          {
            type: "ul",
            items: [
              "UI Builder + persistence — starter canvas, localStorage save, canvas drag/drop.",
              "checkpoints/export-react-code-standalone-20260511-212729 — standalone ExportedUiLayout.tsx export pipeline.",
              "checkpoints/component-specific-settings-20260512-085415 — CanvasComponent.settings, inspector fields, export + validation.",
              "Help Center + hover help — static docs (this page) and 491wd-help-mode-enabled for UI Builder tooltips.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "user-guides",
    letter: "C",
    title: "User Guides",
    category: "referential",
    articles: [
      {
        id: "ug-my-build",
        title: "My Build",
        blocks: [
          {
            type: "p",
            text: "Location: top switcher → My Build. Shows the main CurrentBuild experience plus Applied UI Section when a layout is applied.",
          },
        ],
      },
      {
        id: "ug-ui-builder",
        title: "UI Builder",
        blocks: [
          {
            type: "p",
            text: "Location: top switcher → UI Builder. Left: search, category tabs (All, Base UI, Advanced UI, Variants), component palette. Center: canvas. Right: inspector. Top bar: import/export, apply, reset, export React.",
          },
          {
            type: "p",
            text: "Style variants: each catalog component can store settings.variant (and other settings) chosen from the Variant / style dropdown in Component Settings. Variants change wd-* preview chrome on the canvas, in Saved UI Preview, in Applied UI under My Build, in downloaded/imported JSON, and in the standalone Export React Code output. Older JSON without variant picks the first preset for that component.",
          },
          {
            type: "p",
            text: "Variant browser: pick a component, choose a variant, then use Add variant example to append another row with that preset. The Variants palette tab lists only definitions that support style presets.",
          },
        ],
      },
      {
        id: "ug-saved-preview",
        title: "Saved UI Preview",
        blocks: [
          {
            type: "p",
            text: "Location: top switcher → Saved UI Preview. Loads the saved builder JSON from localStorage and renders cards read-only using renderPreview.",
          },
        ],
      },
      {
        id: "ug-apply",
        title: "Apply to My Build",
        blocks: [
          {
            type: "p",
            text: "Location: UI Builder top bar. Confirms then copies the current canvas JSON into 491wd-applied-ui-layout. My Build shows AppliedUiSection until cleared.",
          },
        ],
      },
      {
        id: "ug-clear-applied",
        title: "Clear Applied Layout",
        blocks: [
          {
            type: "p",
            text: "Location: UI Builder top bar. Removes applied layout from localStorage only; does not erase the builder canvas.",
          },
        ],
      },
      {
        id: "ug-import",
        title: "Import Layout",
        blocks: [
          {
            type: "p",
            text: "Location: UI Builder → Import Layout. Choose a JSON file. validateCanvasPayload must pass or you will see an error status message.",
          },
        ],
      },
      {
        id: "ug-download-json",
        title: "Download Layout JSON",
        blocks: [
          {
            type: "p",
            text: "Location: UI Builder → Download Layout. Saves the current canvas as 491wd-ui-layout.json (pretty-printed).",
          },
        ],
      },
      {
        id: "ug-copy-json",
        title: "Copy JSON",
        blocks: [
          {
            type: "p",
            text: "Location: UI Builder → Copy JSON. Copies the canvas array to the clipboard for sharing or backup.",
          },
        ],
      },
      {
        id: "ug-export-react",
        title: "Export React Code",
        blocks: [
          {
            type: "p",
            text: "Location: UI Builder → Export React Code. Opens a modal with generated TSX. Use Copy Code or Download .tsx. Import ui-builder.css or copy wd-* styles in your target app.",
          },
        ],
      },
      {
        id: "ug-reset",
        title: "Reset Layout",
        blocks: [
          {
            type: "p",
            text: "Location: UI Builder → Reset Layout. Clears LAYOUT_STORAGE_KEY and reloads starterCanvas after confirmation.",
          },
        ],
      },
      {
        id: "ug-component-settings",
        title: "Component Settings",
        blocks: [
          {
            type: "p",
            text: "Location: Inspector → Component Settings (when the selected definition has extra fields). Includes Variant / style selects plus text, number, checkbox, and multiline lists (one item per line). Merges into item.settings and autosaves with the canvas.",
          },
        ],
      },
      {
        id: "ug-dnd",
        title: "Drag reorder canvas cards",
        blocks: [
          {
            type: "p",
            text: "Drag the ⋮⋮ handle on a card. Drop on another card (before/after) or the gutter to move or append. Palette items use a separate drag type for copy.",
          },
        ],
      },
      {
        id: "ug-add-components",
        title: "Add components from sidebar",
        blocks: [
          {
            type: "p",
            text: "Click a palette button to append, or drag a palette button onto the canvas or between cards.",
          },
        ],
      },
      {
        id: "ug-search",
        title: "Search components",
        blocks: [
          {
            type: "p",
            text: "Filter palette rows by name and description substring (case-insensitive).",
          },
        ],
      },
      {
        id: "ug-category-filters",
        title: "Category filters",
        blocks: [
          {
            type: "p",
            text: "All, Base UI, Advanced UI, and Variants tabs limit which catalog definitions appear in the palette. Variants shows components that expose a style preset list.",
          },
        ],
      },
      {
        id: "ug-help-mode",
        title: "Help mode toggle",
        blocks: [
          {
            type: "p",
            text: "Lower left of the UI Builder sidebar: Help button toggles hover/focus tooltips. Persisted as 491wd-help-mode-enabled (true/false string).",
          },
        ],
      },
      {
        id: "ug-help-center-ui",
        title: "Help Center search and filters",
        blocks: [
          {
            type: "p",
            text: "Use the search field to match titles and body text. Category chips filter chapters by Referential / Procedural / Conceptual / Workflows. Sidebar jumps to an article; main panel shows full content.",
          },
        ],
      },
    ],
  },
  {
    id: "admin-guides",
    letter: "D",
    title: "Admin Guides",
    category: "referential",
    articles: [
      {
        id: "admin-storage-keys",
        title: "localStorage keys",
        blocks: [
          {
            type: "ul",
            items: [
              "491wd-ui-builder-layout — JSON array of CanvasComponent rows for the builder.",
              "491wd-applied-ui-layout — JSON array applied to My Build.",
            ],
          },
          {
            type: "p",
            text: "Optional UI preference: 491wd-help-mode-enabled (\"true\" / \"false\") stores whether UI Builder hover tips are on. Documented under User Guides → Help mode toggle.",
          },
        ],
      },
      {
        id: "admin-locations",
        title: "Source locations",
        blocks: [
          {
            type: "ul",
            items: [
              "Component catalog — src/lib/uiBuilderLayout.tsx (uiComponents).",
              "Starter canvas — starterCanvas in the same file.",
              "Settings defaults & inspector schema — DEFAULT_COMPONENT_SETTINGS, INSPECTOR_SETTINGS_FIELDS in uiBuilderLayout.tsx.",
              "Export generator — src/lib/generateExportedUiLayoutTsx.ts.",
              "Preview renderer — renderPreview in uiBuilderLayout.tsx; CanvasPreviewGrid wraps usage.",
              "CSS / theme for builder & previews — src/ui-builder.css (wd-* classes).",
              "Checkpoints — checkpoints/ folders (snapshots of key files).",
            ],
          },
        ],
      },
      {
        id: "admin-commands",
        title: "Build and dev commands",
        blocks: [
          {
            type: "ul",
            items: [
              "npm run build — TypeScript project build + Vite production bundle.",
              "npm run dev — Vite dev server (default port 5173).",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "api-docs",
    letter: "E",
    title: "API Documentation (internal)",
    category: "referential",
    articles: [
      {
        id: "api-types",
        title: "Types",
        blocks: [
          {
            type: "ul",
            items: [
              "CanvasComponent — instanceId, definitionId, title, body, accent, size, optional settings.",
              "CanvasSettings — Record<string, string | number | boolean | string[]>.",
            ],
          },
        ],
      },
      {
        id: "api-catalog",
        title: "Catalog & instances",
        blocks: [
          {
            type: "ul",
            items: [
              "uiComponents — UiComponentDefinition[] (id, name, category, defaults, accent).",
              "starterCanvas — initial CanvasComponent[] when no saved layout.",
              "makeInstance(definition) — builds a new row with default settings merged.",
              "validateCanvasPayload(data) — type guard for import/persistence.",
            ],
          },
        ],
      },
      {
        id: "api-io-render",
        title: "Storage, render, export",
        blocks: [
          {
            type: "ul",
            items: [
              "loadCanvasFromStorage / loadCanvasFromStorageKey — read JSON + validate.",
              "loadAppliedCanvasFromStorage — same for applied key.",
              "renderPreview(definitionId, item) — React preview element for a row.",
              "generateExportedUiLayoutTsx(canvas) — string TSX including EXPORTED_ITEMS and renderExportedPreview.",
            ],
          },
        ],
      },
      {
        id: "api-components",
        title: "React components",
        blocks: [
          {
            type: "ul",
            items: [
              "CanvasPreviewGrid — maps items to renderPreview in a read-only grid.",
              "AppliedUiSection — loads applied layout and shows CanvasPreviewGrid on My Build.",
              "UiLayoutRenderer — Saved UI Preview page using loadCanvasFromStorage.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "installation",
    letter: "F",
    title: "Installation Guides",
    category: "procedural",
    articles: [
      {
        id: "install-steps",
        title: "Setup from scratch",
        blocks: [
          {
            type: "ul",
            items: [
              "cd /Users/stellaroskens/491WD2",
              "npm install",
              "npm run dev",
              "Open http://localhost:5173/ in your browser.",
              "npm run build — verify production build before shipping changes.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "integration",
    letter: "G",
    title: "Integration Guides",
    articles: [
      {
        id: "int-apply",
        title: "Apply a UI Builder layout to My Build",
        blocks: [
          {
            type: "p",
            text: "Finish editing in UI Builder, use Saved UI Preview if you want a sanity check, then Apply to My Build. Switch to My Build to see AppliedUiSection.",
          },
        ],
      },
      {
        id: "int-export",
        title: "Export React code",
        blocks: [
          {
            type: "p",
            text: "Export React Code → copy or download. Paste into src/components/ExportedUiLayout.tsx (or your path). Default export is a page-like component you can route to or embed.",
          },
        ],
      },
      {
        id: "int-css",
        title: "Styles for exported TSX",
        blocks: [
          {
            type: "p",
            text: "Import src/ui-builder.css where you render ExportedUiLayout, or copy only the wd-* rules you need into your app stylesheet.",
          },
        ],
      },
      {
        id: "int-clear",
        title: "Clear an applied layout",
        blocks: [
          {
            type: "p",
            text: "Use Clear Applied Layout in the UI Builder top bar, or remove 491wd-applied-ui-layout manually in devtools.",
          },
        ],
      },
      {
        id: "int-checkpoint",
        title: "Restore from a checkpoint",
        blocks: [
          {
            type: "p",
            text: "Copy files from checkpoints/<name>/src/... back into src/ matching paths. Run npm run build to confirm.",
          },
        ],
      },
    ],
    category: "procedural",
  },
  {
    id: "support-fixes",
    letter: "H",
    title: "Support / Fix Instructions",
    category: "procedural",
    articles: [
      {
        id: "fix-port",
        title: "Port 5173 already in use",
        blocks: [
          {
            type: "p",
            text: "Stop the other Vite process, or run dev with a different port (e.g. vite --port 5174 if your scripts allow flags).",
          },
        ],
      },
      {
        id: "fix-blank",
        title: "Blank screen",
        blocks: [
          {
            type: "ul",
            items: [
              "Open the browser console for runtime errors.",
              "Confirm npm run dev is running and the URL matches the dev server.",
              "Hard refresh (cache) after dependency upgrades.",
            ],
          },
        ],
      },
      {
        id: "fix-save",
        title: "Layout not saving",
        blocks: [
          {
            type: "p",
            text: "Private browsing or blocked storage can prevent localStorage writes. Check quota and exceptions. Ensure validateCanvasPayload would accept your rows after edits.",
          },
        ],
      },
      {
        id: "fix-import",
        title: "Imported JSON rejected",
        blocks: [
          {
            type: "p",
            text: "Each row needs valid definitionId from uiComponents, required string fields, size in compact|normal|wide, and settings values must be string, number, boolean, or string[] only.",
          },
        ],
      },
      {
        id: "fix-applied",
        title: "Applied layout not showing",
        blocks: [
          {
            type: "p",
            text: "Confirm 491wd-applied-ui-layout exists, JSON parses, and validateCanvasPayload passes. You must be on My Build to see AppliedUiSection.",
          },
        ],
      },
      {
        id: "fix-tsx-style",
        title: "Exported TSX has no styling",
        blocks: [
          {
            type: "p",
            text: "Import ui-builder.css (or copy wd-* rules) in the app that mounts ExportedUiLayout.",
          },
        ],
      },
      {
        id: "fix-build",
        title: "Build fails",
        blocks: [
          {
            type: "p",
            text: "Run npm run build and read tsc errors first. Keep renderPreview and the standalone string in generateExportedUiLayoutTsx aligned when changing previews.",
          },
        ],
      },
      {
        id: "fix-refresh",
        title: "Browser not refreshing",
        blocks: [
          {
            type: "p",
            text: "Vite HMR can occasionally stick; stop and restart npm run dev. Clear service worker cache if you use the PWA build.",
          },
        ],
      },
      {
        id: "fix-ls-reset",
        title: "localStorage reset",
        blocks: [
          {
            type: "p",
            text: "Application → Storage → Local Storage → clear keys starting with 491wd-. You will lose builder, applied, and help mode preference until set again.",
          },
        ],
      },
    ],
  },
  {
    id: "planning",
    letter: "I",
    title: "Planning Guides",
    category: "conceptual",
    articles: [
      {
        id: "plan-layout",
        title: "Plan a UI layout before building",
        blocks: [
          {
            type: "p",
            text: "List the sections you need (metrics, actions, alerts). Map each to catalog ids. Decide which rows need component settings vs title/body only.",
          },
        ],
      },
      {
        id: "plan-base-advanced",
        title: "Base UI vs Advanced UI",
        blocks: [
          {
            type: "p",
            text: "Base UI covers common primitives (buttons, cards, tabs). Advanced UI covers specialized patterns (dragula, clipboard, lightbox). Choose based on fidelity you need in preview.",
          },
        ],
      },
      {
        id: "plan-apply-vs-preview",
        title: "Saved UI Preview vs Apply",
        blocks: [
          {
            type: "p",
            text: "Preview is non-destructive and read-only. Apply injects the same JSON into My Build. Use preview to validate ordering and settings; apply when stakeholders agree.",
          },
        ],
      },
      {
        id: "plan-export",
        title: "When to export TSX instead of applying locally",
        blocks: [
          {
            type: "p",
            text: "Export when you want a versioned React artifact in another repo, Storybook, or design handoff. Apply when you want immediate feedback inside this app only.",
          },
        ],
      },
    ],
  },
  {
    id: "best-practices",
    letter: "J",
    title: "Best Practices",
    category: "conceptual",
    articles: [
      {
        id: "bp-list",
        title: "Recommended habits",
        blocks: [
          {
            type: "ul",
            items: [
              "Save checkpoints before major refactors.",
              "Use Reset Layout only when you intend to discard the saved builder canvas.",
              "Version exported TSX in git with meaningful commit messages.",
              "Keep component settings minimal and meaningful for consumers.",
              "Preview in Saved UI Preview before applying to My Build.",
              "Run npm run build after substantive changes.",
              "Avoid editing CurrentBuild.tsx unless the product requires it — prefer builder + applied section for experiments.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "strategy",
    letter: "K",
    title: "Strategic Framework Documents",
    category: "conceptual",
    articles: [
      {
        id: "str-builder-preview-apply",
        title: "Builder → preview → apply",
        blocks: [
          {
            type: "p",
            text: "Author in UI Builder (mutable) → validate via Saved UI Preview (read-only same data) → promote via Apply to My Build (downstream surface) → optionally export TSX for external reuse.",
          },
        ],
      },
      {
        id: "str-prototype-production",
        title: "Prototype to production",
        blocks: [
          {
            type: "p",
            text: "Treat the canvas as a rapid prototype. Treat exported TSX as a candidate production artifact after design review and styling integration.",
          },
        ],
      },
      {
        id: "str-docs",
        title: "Documentation framework",
        blocks: [
          {
            type: "ul",
            items: [
              "Referential — what exists (release notes, guides, admin, API summaries).",
              "Procedural — how to install, integrate, fix issues.",
              "Conceptual — planning and strategy.",
              "Workflow tutorials — multi-step sequences combining features.",
            ],
          },
        ],
      },
      {
        id: "str-governance",
        title: "Component governance",
        blocks: [
          {
            type: "ul",
            items: [
              "Catalog — uiComponents definitions.",
              "Settings — defaults + inspector schema + validation.",
              "Rendering — renderPreview parity with export.",
              "Export — generateExportedUiLayoutTsx stays in sync.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "workflows",
    letter: "L",
    title: "Workflow Tutorials",
    category: "workflows",
    articles: [
      {
        id: "wf-dashboard-apply",
        title: "1. Build a dashboard section and apply it",
        blocks: [
          {
            type: "p",
            text: "Add Card, Progress, and Buttons from the palette. Edit titles, bodies, and Component Settings as needed. Autosave updates localStorage. Open Saved UI Preview to verify. Return to UI Builder → Apply to My Build. Switch to My Build and confirm AppliedUiSection.",
          },
        ],
      },
      {
        id: "wf-export-component",
        title: "2. Export a reusable React component",
        blocks: [
          {
            type: "p",
            text: "Build the layout, open Export React Code, copy or download. Add ExportedUiLayout.tsx under src/components. Import ui-builder.css (or extract wd-* styles). Import the component where you need the static preview.",
          },
        ],
      },
      {
        id: "wf-recover",
        title: "3. Recover from a mistake",
        blocks: [
          {
            type: "ul",
            items: [
              "Reset Layout — restores starter canvas and clears builder storage key.",
              "Clear Applied Layout — removes applied section only.",
              "Restore files from checkpoints/... then npm run build.",
            ],
          },
        ],
      },
      {
        id: "wf-prototype-to-section",
        title: "4. Move from prototype to applied app section",
        blocks: [
          {
            type: "p",
            text: "Iterate in UI Builder, use Saved UI Preview while tuning settings, then Apply to My Build once the section matches what you want under the live app shell.",
          },
        ],
      },
    ],
  },
];

function articleSearchText(ch: HelpChapter, art: HelpArticle): string {
  const blockText = art.blocks
    .map((b) => {
      if (b.type === "p") return b.text;
      if (b.type === "ul") return b.items.join(" ");
      if (b.type === "h4") return b.text;
      return "";
    })
    .join(" ");
  return `${ch.letter} ${ch.title} ${art.title} ${blockText}`.toLowerCase();
}

export function searchHelpChapters(query: string, category: HelpCategory | "all"): HelpChapter[] {
  const q = query.trim().toLowerCase();
  return HELP_CHAPTERS.filter((ch) => category === "all" || ch.category === category).map((ch) => ({
    ...ch,
    articles: ch.articles.filter((art) => {
      if (!q) return true;
      return articleSearchText(ch, art).includes(q);
    }),
  })).filter((ch) => ch.articles.length > 0);
}

export function flattenArticlesForToc(
  chapters: HelpChapter[],
): { chapter: HelpChapter; article: HelpArticle }[] {
  return chapters.flatMap((chapter) => chapter.articles.map((article) => ({ chapter, article })));
}
