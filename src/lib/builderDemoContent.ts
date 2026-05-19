/**
 * Static copy for Backend Console → Demo Lab (instructional only).
 */

export type BuilderDemoFlowStep = {
  step: number;
  title: string;
  body: string;
};

export type BuilderDemoPantryRow = {
  source: string;
  use: string;
  detail: string;
};

export type BuilderDemoToolCard = {
  title: string;
  body: string;
};

export const BUILDER_DEMO_FLOW_STEPS: BuilderDemoFlowStep[] = [
  {
    step: 1,
    title: "Browse Template Workbench",
    body: "Open live template previews, skim reference pages, and note which visual families match the household surface you want (tables density, card chrome, alerts, forms).",
  },
  {
    step: 2,
    title: "Choose a source style",
    body: "In Template Workbench, save picks into “My Picks” / chosen sources so your UI Builder and Page Composer work share one style direction instead of mixing unrelated themes.",
  },
  {
    step: 3,
    title: "Build a section in UI Builder",
    body: "Compose cards on the canvas, tune variants in the inspector, then export or apply the layout to browser storage so Saved UI Preview and downstream tools can read it.",
  },
  {
    step: 4,
    title: "Place the section in Page Composer",
    body: "Map the saved builder section onto a target page key (for example Pantry). Page Composer writes to localStorage (`491wd-page-composer-layouts`) — no server round-trip.",
  },
  {
    step: 5,
    title: "Preview / Apply",
    body: "Use Saved UI Preview to validate the builder JSON, then switch to My Build to see the public/current household surface. Pantry reads composed sections where `CustomPantrySections` is wired.",
  },
];

export const BUILDER_DEMO_PANTRY_PLAN: BuilderDemoPantryRow[] = [
  {
    source: "Tables",
    use: "Pantry list",
    detail: "Dense rows, sticky header, inline actions — mirror inventory tables from your chosen template source.",
  },
  {
    source: "Cards",
    use: "Pantry item cards",
    detail: "Hero product tiles, metadata chips, and overflow menus lifted from the Cards reference page.",
  },
  {
    source: "Alerts",
    use: "Expiration warnings",
    detail: "Banner + inline alert variants for soon-to-expire items; keep copy short and actionable.",
  },
  {
    source: "Buttons",
    use: "Pantry actions",
    detail: "Primary/secondary/destructive patterns for consume, move, and donate flows.",
  },
  {
    source: "Forms",
    use: "Add / edit item",
    detail: "Field spacing, validation hints, and save/cancel placement consistent with your Forms source.",
  },
];

export const BUILDER_DEMO_TOOL_CARDS: BuilderDemoToolCard[] = [
  {
    title: "Template Workbench",
    body: "Browse visual source pages and capture style notes. This is the mood board — not the final React tree.",
  },
  {
    title: "UI Builder",
    body: "Assemble reusable sections from the component palette, export JSON, and apply layouts stored in this browser.",
  },
  {
    title: "Page Composer",
    body: "Attach the sections you like to real page IDs (for example Pantry) so My Build knows where to render them.",
  },
  {
    title: "Saved UI Preview",
    body: "Read-only mirror of the layout saved under `491wd-ui-builder-layout` — perfect for a quick sanity check.",
  },
  {
    title: "My Build",
    body: "The public-facing household workspace (`CurrentBuild`) showing what members experience after you apply changes.",
  },
  {
    title: "Backend Console",
    body: "This internal shell groups builders, previews, planning notes, and documentation without touching production APIs.",
  },
];

export const BUILDER_DEMO_CHECKLIST: string[] = [
  "Choose one template source in Template Workbench and stick to it for the session.",
  "Save it as your chosen source / My Picks so other tools inherit the same references.",
  "Copy the style plan bullets into your notes (or Builder Tasks) before leaving Workbench.",
  "Add at least one UI Builder card and rename it so exports stay readable.",
  "Change a variant or accent color and confirm Saved UI Preview reflects the update.",
  "Place the section onto a target page inside Page Composer (for example Pantry).",
  "Preview the result under My Build → Pantry (composed sections hydrate from localStorage).",
];

/** Interactive practice tabs (Demo Lab). */
export type BuilderDemoInteractiveTabId = "template-source" | "ui-section" | "page-composer" | "preview-apply";

export type BuilderDemoInteractiveTab = {
  id: BuilderDemoInteractiveTabId;
  label: string;
  intro: string;
  nextSteps: string[];
};

export const BUILDER_DEMO_INTERACTIVE_TABS: BuilderDemoInteractiveTab[] = [
  {
    id: "template-source",
    label: "Template Source",
    intro:
      "Template Workbench is where you pick visual references. Click a row below to see how that source type maps onto a Pantry surface before you commit to real components.",
    nextSteps: [
      "Open Template Workbench from Build Tools and load the iframe previews you care about.",
      "Save My Picks so Tables, Cards, Alerts, Buttons, and Forms references stay aligned.",
      "Copy the Pantry Build Prompt when you are ready to brief an implementation pass.",
    ],
  },
  {
    id: "ui-section",
    label: "UI Section",
    intro:
      "UI Builder turns a pattern into a reusable section: canvas cards, inspector fields, variants, and export/apply to local storage.",
    nextSteps: [
      "Add a component from the palette, then rename the card on the canvas.",
      "Tune title, body, accent, size, and variant in the inspector until Saved UI Preview matches intent.",
      "Copy the UI Section Prompt to capture constraints for the next coding session.",
    ],
  },
  {
    id: "page-composer",
    label: "Page Composer",
    intro:
      "Page Composer binds saved UI Builder sections to a page id (for example Pantry). Layouts persist per page in this browser only.",
    nextSteps: [
      "Pick the target page, drag or add the section you exported from UI Builder.",
      "Save the composed layout and confirm the storage key in the composer header.",
      "Copy the Page Composer Prompt if you need a checklist while wiring persistence.",
    ],
  },
  {
    id: "preview-apply",
    label: "Preview / Apply",
    intro:
      "Saved UI Preview validates builder JSON; My Build shows the household surface. Pantry composed blocks hydrate from Page Composer storage where wired.",
    nextSteps: [
      "Open Saved UI Preview after every apply to catch layout mistakes early.",
      "Switch to My Build and open Pantry to see composed sections next to core inventory UI.",
      "Iterate: adjust UI Builder, re-apply, refresh composer-backed areas as needed.",
    ],
  },
];

export const BUILDER_DEMO_COPY_PANTRY_PROMPT = `Use the chosen Template Workbench sources as visual references. Build Pantry as a frontend-only React page with table view, card view, filters, summary cards, status badges, and admin dashboard styling. Preserve chosen template spacing, card shape, typography, badges, and orange/red accents. Use wd-* CSS classes. Run npm run build.`;

export const BUILDER_DEMO_COPY_UI_SECTION_PROMPT = `Use the selected template source as the visual reference. Convert the relevant pattern into an editable UI Builder section with title, body, accent, size, variant/style, and component-specific settings. Preserve visual spacing, badges, buttons, card shape, and typography. Run npm run build.`;

export const BUILDER_DEMO_COPY_PAGE_COMPOSER_PROMPT = `Place the selected UI Builder section onto the target page using Page Composer. Keep the layout editable, persist it by page, and preserve existing My Build behavior. Run npm run build.`;
