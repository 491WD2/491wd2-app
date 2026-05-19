import type { CanvasComponent } from "./uiBuilderLayout";
import { uiComponents } from "./uiBuilderLayout";

function itemLiteral(item: CanvasComponent): string {
  const lines: string[] = [
    "  {",
    `    instanceId: ${JSON.stringify(item.instanceId)},`,
    `    definitionId: ${JSON.stringify(item.definitionId)},`,
    `    title: ${JSON.stringify(item.title)},`,
    `    body: ${JSON.stringify(item.body)},`,
    `    accent: ${JSON.stringify(item.accent)},`,
    `    size: ${JSON.stringify(item.size)},`,
  ];
  if (item.settings && Object.keys(item.settings).length > 0) {
    lines.push(`    settings: ${JSON.stringify(item.settings)},`);
  }
  lines.push("  }");
  return lines.join("\n");
}

function buildComponentLabelsMap(): string {
  const entries = uiComponents.map(
    (c) => `  ${JSON.stringify(c.id)}: ${JSON.stringify(c.name)}`,
  );
  return [
    "const COMPONENT_LABELS: Record<string, string> = {",
    entries.join(",\n"),
    "};",
    "",
    "function labelFor(definitionId: string): string {",
    "  return COMPONENT_LABELS[definitionId] ?? definitionId;",
    "}",
  ].join("\n");
}

// Synced from uiBuilderLayout `renderPreview` switch (extracted at build of this generator).
const STANDALONE_RENDER_EXPORTED_PREVIEW: string = "function readStringSetting(item: ExportedCanvasItem, key: string, fallback: string): string {\n  const v = item.settings?.[key];\n  return typeof v === \"string\" ? v : fallback;\n}\n\nfunction readStringSettingNonEmpty(item: ExportedCanvasItem, key: string, fallback: string): string {\n  const v = item.settings?.[key];\n  if (typeof v === \"string\" && v.trim() !== \"\") return v;\n  return fallback;\n}\n\nfunction readNumberSetting(item: ExportedCanvasItem, key: string, fallback: number): number {\n  const v = item.settings?.[key];\n  if (typeof v === \"number\" && Number.isFinite(v)) return v;\n  if (typeof v === \"string\" && v.trim() !== \"\") {\n    const n = Number(v);\n    if (!Number.isNaN(n)) return n;\n  }\n  return fallback;\n}\n\nfunction readBooleanSetting(item: ExportedCanvasItem, key: string, fallback: boolean): boolean {\n  const v = item.settings?.[key];\n  return typeof v === \"boolean\" ? v : fallback;\n}\n\nfunction readStringListSetting(item: ExportedCanvasItem, key: string, fallback: string[]): string[] {\n  const v = item.settings?.[key];\n  if (Array.isArray(v) && v.length > 0) return v;\n  return fallback;\n}\n\nfunction renderExportedPreview(type: string, item: ExportedCanvasItem): ReactElement {\n  switch (type) {\n    case \"alerts\": {\n      const variant = readStringSetting(item, \"variant\", \"success\");\n      const allowed = new Set([\"success\", \"warning\", \"danger\", \"info\", \"neutral\"]);\n      const vClass = allowed.has(variant) ? variant : \"success\";\n      const dismissible = readBooleanSetting(item, \"dismissible\", true);\n      return (\n        <div className={`wd-preview-alert wd-preview-alert--${vClass}`}>\n          <strong>{item.title}</strong>\n          <p>{item.body}</p>\n          {dismissible ? (\n            <span className=\"wd-preview-alert-dismiss\" aria-hidden>\n              ×\n            </span>\n          ) : null}\n        </div>\n      );\n    }\n\n    case \"accordion\":\n      return (\n        <div className=\"wd-preview-accordion\">\n          <details open>\n            <summary>{item.title}</summary>\n            <p>{item.body}</p>\n          </details>\n          <details>\n            <summary>More Details</summary>\n            <p>Additional collapsible content.</p>\n          </details>\n        </div>\n      );\n\n    case \"avatar\":\n      return (\n        <div className=\"wd-preview-avatar\">\n          <div className=\"wd-avatar-stack\">\n            <span>SO</span>\n            <span>AM</span>\n            <span>JD</span>\n          </div>\n          <div>\n            <h3>{item.title}</h3>\n            <p>{item.body}</p>\n          </div>\n        </div>\n      );\n\n    case \"badges\": {\n      const labels = readStringListSetting(item, \"labels\", [\"Active\", \"Pending\", \"Complete\"]);\n      return (\n        <div>\n          <h3>{item.title}</h3>\n          <div className=\"wd-badge-row\">\n            {labels.map((label, i) => (\n              <span key={i}>{label}</span>\n            ))}\n          </div>\n        </div>\n      );\n    }\n\n    case \"breadcrumb\":\n      return (\n        <div className=\"wd-breadcrumb\">\n          <span>Dashboard</span>\n          <span>UI</span>\n          <strong>{item.title}</strong>\n        </div>\n      );\n\n    case \"buttons\":\n      return (\n        <div>\n          <h3>{item.title}</h3>\n          <div className=\"wd-button-row\">\n            <button>{readStringSetting(item, \"primaryLabel\", \"Primary\")}</button>\n            <button>{readStringSetting(item, \"secondaryLabel\", \"Secondary\")}</button>\n            <button>{readStringSetting(item, \"outlineLabel\", \"Outline\")}</button>\n          </div>\n        </div>\n      );\n\n    case \"button-group\": {\n      const options = readStringListSetting(item, \"options\", [\"Day\", \"Week\", \"Month\"]);\n      return (\n        <div>\n          <h3>{item.title}</h3>\n          <div className=\"wd-button-group\">\n            {options.map((opt, i) => (\n              <button key={i} type=\"button\">\n                {opt}\n              </button>\n            ))}\n          </div>\n        </div>\n      );\n    }\n\n    case \"card\":\n      return (\n        <div className=\"wd-preview-dashboard-card\">\n          <div>\n            <p>{readStringSetting(item, \"metricLabel\", \"Total Components\")}</p>\n            <h3>{readStringSettingNonEmpty(item, \"metricValue\", item.title)}</h3>\n          </div>\n          <strong>{readStringSetting(item, \"trendLabel\", \"+24%\")}</strong>\n          <p>{item.body}</p>\n        </div>\n      );\n\n    case \"carousel\":\n      return (\n        <div className=\"wd-preview-carousel\">\n          <div>\n            <span>{readStringSetting(item, \"slideNumber\", \"01\")}</span>\n            <h3>{item.title}</h3>\n            <p>{item.body}</p>\n          </div>\n        </div>\n      );\n\n    case \"collapse\":\n      return (\n        <details className=\"wd-preview-collapse\" open>\n          <summary>{item.title}</summary>\n          <p>{item.body}</p>\n        </details>\n      );\n\n    case \"dropdowns\": {\n      const menuItems = readStringListSetting(item, \"menuItems\", [\"Edit\", \"Duplicate\", \"Archive\"]);\n      return (\n        <div className=\"wd-preview-dropdown\">\n          <button type=\"button\">\n            {item.title} ▾\n          </button>\n          <div>\n            {menuItems.map((label, i) => (\n              <span key={i}>{label}</span>\n            ))}\n          </div>\n        </div>\n      );\n    }\n\n    case \"ratio\":\n      return (\n        <div className=\"wd-ratio-box\">\n          <span>{item.title}</span>\n        </div>\n      );\n\n    case \"grid\": {\n      const cols = Math.min(12, Math.max(1, Math.floor(readNumberSetting(item, \"columns\", 4))));\n      return (\n        <div>\n          <h3>{item.title}</h3>\n          <div className=\"wd-grid-demo\">\n            {Array.from({ length: cols }, (_, i) => (\n              <span key={i}>Col</span>\n            ))}\n          </div>\n        </div>\n      );\n    }\n\n    case \"images\": {\n      const imageLabel = readStringSetting(item, \"imageLabel\", \"Preview\");\n      return (\n        <div className=\"wd-image-demo\">\n          <div>\n            <span className=\"wd-image-demo-label\">{imageLabel}</span>\n          </div>\n          <div>\n            <h3>{item.title}</h3>\n            <p>{item.body}</p>\n          </div>\n        </div>\n      );\n    }\n\n    case \"links\": {\n      const linkLabels = readStringListSetting(item, \"labels\", [\"View Details\", \"Open Report\", \"Learn More\"]);\n      return (\n        <div>\n          <h3>{item.title}</h3>\n          <div className=\"wd-link-row\">\n            {linkLabels.map((label, i) => (\n              <a key={i} href=\"#preview\" onClick={(e) => e.preventDefault()}>\n                {label}\n              </a>\n            ))}\n          </div>\n        </div>\n      );\n    }\n\n    case \"list-groups\": {\n      const listItems = readStringListSetting(item, \"items\", [item.title, item.body, \"Recent update completed\"]);\n      return (\n        <ul className=\"wd-list-group\">\n          {listItems.map((text, i) => (\n            <li key={i}>{text}</li>\n          ))}\n        </ul>\n      );\n    }\n\n    case \"modals\":\n      return (\n        <div className=\"wd-modal-demo\">\n          <div>\n            <h3>{item.title}</h3>\n            <p>{item.body}</p>\n            <button type=\"button\">{readStringSetting(item, \"confirmLabel\", \"Confirm\")}</button>\n          </div>\n        </div>\n      );\n\n    case \"offcanvas\":\n      return (\n        <div className=\"wd-offcanvas-demo\">\n          <aside>\n            <h3>{item.title}</h3>\n            <p>{item.body}</p>\n          </aside>\n          <div />\n        </div>\n      );\n\n    case \"pagination\": {\n      const pages = readStringListSetting(item, \"pages\", [\"1\", \"2\", \"3\"]);\n      return (\n        <div>\n          <h3>{item.title}</h3>\n          <div className=\"wd-pagination\">\n            <button type=\"button\">‹</button>\n            {pages.map((p, i) => (\n              <button key={i} type=\"button\">\n                {p}\n              </button>\n            ))}\n            <button type=\"button\">›</button>\n          </div>\n        </div>\n      );\n    }\n\n    case \"placeholders\":\n      return (\n        <div className=\"wd-placeholder-demo\">\n          <span />\n          <span />\n          <span />\n        </div>\n      );\n\n    case \"popovers\":\n      return (\n        <div className=\"wd-popover-demo\">\n          <button>{item.title}</button>\n          <div>{item.body}</div>\n        </div>\n      );\n\n    case \"progress\": {\n      const pct = Math.min(100, Math.max(0, readNumberSetting(item, \"percent\", 72)));\n      return (\n        <div>\n          <h3>{item.title}</h3>\n          <div className=\"wd-progress\">\n            <span style={{ width: `${pct}%` }} />\n          </div>\n          <p>{item.body}</p>\n        </div>\n      );\n    }\n\n    case \"spinner\":\n      return (\n        <div className=\"wd-spinner-demo\">\n          <span />\n          <div>\n            <h3>{item.title}</h3>\n            <p>{item.body}</p>\n          </div>\n        </div>\n      );\n\n    case \"tabs\": {\n      const tabLabels = readStringListSetting(item, \"labels\", [\"Overview\", \"Details\", \"Activity\"]);\n      return (\n        <div>\n          <div className=\"wd-tabs\">\n            {tabLabels.map((label, i) => (\n              <button key={i} type=\"button\">\n                {label}\n              </button>\n            ))}\n          </div>\n          <p>{item.body}</p>\n        </div>\n      );\n    }\n\n    case \"toasts\":\n      return (\n        <div className=\"wd-toast-demo\">\n          <strong>{item.title}</strong>\n          <p>{item.body}</p>\n          <small className=\"wd-toast-time\">{readStringSetting(item, \"timeLabel\", \"Just now\")}</small>\n        </div>\n      );\n\n    case \"tooltips\":\n      return (\n        <div className=\"wd-tooltip-demo\">\n          <button>{item.title}</button>\n          <span>{item.body}</span>\n        </div>\n      );\n\n    case \"typography\": {\n      const level = Math.min(6, Math.max(1, Math.round(readNumberSetting(item, \"headingLevel\", 2))));\n      const headingTags = [\"h1\", \"h2\", \"h3\", \"h4\", \"h5\", \"h6\"] as const;\n      const tag = headingTags[level - 1];\n      return (\n        <div className=\"wd-type-demo\">\n          {createElement(tag, null, item.title)}\n          <p>{item.body}</p>\n          <small>Caption text / label text</small>\n        </div>\n      );\n    }\n\n    case \"dragula\":\n      return (\n        <div className=\"wd-dragula-demo\">\n          <div>\n            <strong>{readStringSetting(item, \"leftTitle\", \"Todo\")}</strong>\n            <span>{item.title}</span>\n          </div>\n          <div>\n            <strong>{readStringSetting(item, \"rightTitle\", \"Doing\")}</strong>\n            <span>{item.body}</span>\n          </div>\n        </div>\n      );\n\n    case \"clipboard\":\n      return (\n        <div className=\"wd-clipboard-demo\">\n          <input readOnly value={readStringSetting(item, \"value\", item.body)} />\n          <button type=\"button\">Copy</button>\n        </div>\n      );\n\n    case \"sweet-alerts\":\n      return (\n        <div className=\"wd-sweet-alert-demo\">\n          <div>!</div>\n          <h3>{item.title}</h3>\n          <p>{item.body}</p>\n          <button>Okay</button>\n        </div>\n      );\n\n    case \"lightbox\": {\n      const imageCount = Math.min(12, Math.max(1, Math.floor(readNumberSetting(item, \"imageCount\", 3))));\n      return (\n        <div>\n          <h3>{item.title}</h3>\n          <div className=\"wd-lightbox-grid\">\n            {Array.from({ length: imageCount }, (_, i) => (\n              <span key={i} />\n            ))}\n          </div>\n        </div>\n      );\n    }\n\n    case \"scrollbar\": {\n      const scrollItems = readStringListSetting(item, \"items\", [\n        \"Scrollable item one\",\n        \"Scrollable item two\",\n        \"Scrollable item three\",\n        \"Scrollable item four\",\n      ]);\n      return (\n        <div className=\"wd-scrollbar-demo\">\n          <h3>{item.title}</h3>\n          <p>{item.body}</p>\n          {scrollItems.map((line, i) => (\n            <p key={i}>{line}</p>\n          ))}\n        </div>\n      );\n    }\n\n    default:\n      return (\n        <div>\n          <h3>{item.title}</h3>\n          <p>{item.body}</p>\n        </div>\n      );\n  }\n}\n";

/**
 * Standalone TSX for `ExportedUiLayout` (React types only; no app imports).
 */
export function generateExportedUiLayoutTsx(canvas: CanvasComponent[]): string {
  const arrayBody = canvas.map((row) => itemLiteral(row)).join(",\n");
  const renderFn = STANDALONE_RENDER_EXPORTED_PREVIEW;
  return [
    "/**",
    " * This file is standalone except for CSS. Import ui-builder.css or copy the needed wd-* styles into your app.",
    " * Generated by 491WD UI Builder.",
    " */",
    "",
    'import type { CSSProperties, ReactElement } from "react";',
    'import { createElement } from "react";',
    "",
    "export type ExportedCanvasItem = {",
    "  instanceId: string;",
    "  definitionId: string;",
    "  title: string;",
    "  body: string;",
    "  accent: string;",
    "  size: \"compact\" | \"normal\" | \"wide\";",
    "  settings?: Record<string, string | number | boolean | string[]>;",
    "};",
    "",
    buildComponentLabelsMap(),
    "",
    "const EXPORTED_ITEMS: ExportedCanvasItem[] = [",
    arrayBody,
    "];",
    "",
    renderFn,
    "",
    "export default function ExportedUiLayout() {",
    "  return (",
    '    <main className="wd-ui-preview-page">',
    '      <header className="wd-ui-preview-hero">',
    '        <p className="wd-ui-preview-eyebrow">491WD export</p>',
    "        <h1>Exported UI layout</h1>",
    '        <p className="wd-ui-preview-lede">',
    "          Static read-only layout {EXPORTED_ITEMS.length} component",
    '          {EXPORTED_ITEMS.length === 1 ? "" : "s"}.',
    "        </p>",
    "      </header>",
    '      <div className="wd-ui-preview-grid">',
    "        {EXPORTED_ITEMS.map((row) => (",
    "          <article",
    "            key={row.instanceId}",
    '            className={"wd-ui-preview-card wd-size-" + row.size}',
    '            style={{ \"--wd-accent\": row.accent } as CSSProperties}',
    "          >",
    '            <div className="wd-card-toolbar wd-ui-preview-card-meta">',
    '              <span className="wd-ui-preview-pill">{labelFor(row.definitionId)}</span>',
    "            </div>",
    '            <div className="wd-ui-preview-card-body wd-ui-preview-readonly">',
    "              {renderExportedPreview(row.definitionId, row)}",
    "            </div>",
    "          </article>",
    "        ))}",
    "      </div>",
    "    </main>",
    "  );",
    "}",
    "",
  ].join("\n");
}

