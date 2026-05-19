import type { CanvasComponent } from "./uiBuilderLayout";
import { uiComponents } from "./uiBuilderLayout";

function itemLiteral(item: CanvasComponent): string {
  return [
    "  {",
    `    instanceId: ${JSON.stringify(item.instanceId)},`,
    `    definitionId: ${JSON.stringify(item.definitionId)},`,
    `    title: ${JSON.stringify(item.title)},`,
    `    body: ${JSON.stringify(item.body)},`,
    `    accent: ${JSON.stringify(item.accent)},`,
    `    size: ${JSON.stringify(item.size)},`,
    "  }",
  ].join("\n");
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
const STANDALONE_RENDER_EXPORTED_PREVIEW: string = "function renderExportedPreview(type: string, item: ExportedCanvasItem): ReactElement {\n  switch (type) {\n    case \"alerts\":\n      return (\n        <div className=\"wd-preview-alert\">\n          <strong>{item.title}</strong>\n          <p>{item.body}</p>\n        </div>\n      );\n\n    case \"accordion\":\n      return (\n        <div className=\"wd-preview-accordion\">\n          <details open>\n            <summary>{item.title}</summary>\n            <p>{item.body}</p>\n          </details>\n          <details>\n            <summary>More Details</summary>\n            <p>Additional collapsible content.</p>\n          </details>\n        </div>\n      );\n\n    case \"avatar\":\n      return (\n        <div className=\"wd-preview-avatar\">\n          <div className=\"wd-avatar-stack\">\n            <span>SO</span>\n            <span>AM</span>\n            <span>JD</span>\n          </div>\n          <div>\n            <h3>{item.title}</h3>\n            <p>{item.body}</p>\n          </div>\n        </div>\n      );\n\n    case \"badges\":\n      return (\n        <div>\n          <h3>{item.title}</h3>\n          <div className=\"wd-badge-row\">\n            <span>Active</span>\n            <span>Pending</span>\n            <span>Complete</span>\n          </div>\n        </div>\n      );\n\n    case \"breadcrumb\":\n      return (\n        <div className=\"wd-breadcrumb\">\n          <span>Dashboard</span>\n          <span>UI</span>\n          <strong>{item.title}</strong>\n        </div>\n      );\n\n    case \"buttons\":\n      return (\n        <div>\n          <h3>{item.title}</h3>\n          <div className=\"wd-button-row\">\n            <button>Primary</button>\n            <button>Secondary</button>\n            <button>Outline</button>\n          </div>\n        </div>\n      );\n\n    case \"button-group\":\n      return (\n        <div>\n          <h3>{item.title}</h3>\n          <div className=\"wd-button-group\">\n            <button>Day</button>\n            <button>Week</button>\n            <button>Month</button>\n          </div>\n        </div>\n      );\n\n    case \"card\":\n      return (\n        <div className=\"wd-preview-dashboard-card\">\n          <div>\n            <p>Total Components</p>\n            <h3>{item.title}</h3>\n          </div>\n          <strong>+24%</strong>\n          <p>{item.body}</p>\n        </div>\n      );\n\n    case \"carousel\":\n      return (\n        <div className=\"wd-preview-carousel\">\n          <div>\n            <span>01</span>\n            <h3>{item.title}</h3>\n            <p>{item.body}</p>\n          </div>\n        </div>\n      );\n\n    case \"collapse\":\n      return (\n        <details className=\"wd-preview-collapse\" open>\n          <summary>{item.title}</summary>\n          <p>{item.body}</p>\n        </details>\n      );\n\n    case \"dropdowns\":\n      return (\n        <div className=\"wd-preview-dropdown\">\n          <button>{item.title} \u25be</button>\n          <div>\n            <span>Edit</span>\n            <span>Duplicate</span>\n            <span>Archive</span>\n          </div>\n        </div>\n      );\n\n    case \"ratio\":\n      return (\n        <div className=\"wd-ratio-box\">\n          <span>{item.title}</span>\n        </div>\n      );\n\n    case \"grid\":\n      return (\n        <div>\n          <h3>{item.title}</h3>\n          <div className=\"wd-grid-demo\">\n            <span>Col</span>\n            <span>Col</span>\n            <span>Col</span>\n            <span>Col</span>\n          </div>\n        </div>\n      );\n\n    case \"images\":\n      return (\n        <div className=\"wd-image-demo\">\n          <div />\n          <div>\n            <h3>{item.title}</h3>\n            <p>{item.body}</p>\n          </div>\n        </div>\n      );\n\n    case \"links\":\n      return (\n        <div>\n          <h3>{item.title}</h3>\n          <div className=\"wd-link-row\">\n            <a>View Details</a>\n            <a>Open Report</a>\n            <a>Learn More</a>\n          </div>\n        </div>\n      );\n\n    case \"list-groups\":\n      return (\n        <ul className=\"wd-list-group\">\n          <li>{item.title}</li>\n          <li>{item.body}</li>\n          <li>Recent update completed</li>\n        </ul>\n      );\n\n    case \"modals\":\n      return (\n        <div className=\"wd-modal-demo\">\n          <div>\n            <h3>{item.title}</h3>\n            <p>{item.body}</p>\n            <button>Confirm</button>\n          </div>\n        </div>\n      );\n\n    case \"offcanvas\":\n      return (\n        <div className=\"wd-offcanvas-demo\">\n          <aside>\n            <h3>{item.title}</h3>\n            <p>{item.body}</p>\n          </aside>\n          <div />\n        </div>\n      );\n\n    case \"pagination\":\n      return (\n        <div>\n          <h3>{item.title}</h3>\n          <div className=\"wd-pagination\">\n            <button>\u2039</button>\n            <button>1</button>\n            <button>2</button>\n            <button>3</button>\n            <button>\u203a</button>\n          </div>\n        </div>\n      );\n\n    case \"placeholders\":\n      return (\n        <div className=\"wd-placeholder-demo\">\n          <span />\n          <span />\n          <span />\n        </div>\n      );\n\n    case \"popovers\":\n      return (\n        <div className=\"wd-popover-demo\">\n          <button>{item.title}</button>\n          <div>{item.body}</div>\n        </div>\n      );\n\n    case \"progress\":\n      return (\n        <div>\n          <h3>{item.title}</h3>\n          <div className=\"wd-progress\">\n            <span />\n          </div>\n          <p>{item.body}</p>\n        </div>\n      );\n\n    case \"spinner\":\n      return (\n        <div className=\"wd-spinner-demo\">\n          <span />\n          <div>\n            <h3>{item.title}</h3>\n            <p>{item.body}</p>\n          </div>\n        </div>\n      );\n\n    case \"tabs\":\n      return (\n        <div>\n          <div className=\"wd-tabs\">\n            <button>Overview</button>\n            <button>Details</button>\n            <button>Activity</button>\n          </div>\n          <p>{item.body}</p>\n        </div>\n      );\n\n    case \"toasts\":\n      return (\n        <div className=\"wd-toast-demo\">\n          <strong>{item.title}</strong>\n          <p>{item.body}</p>\n        </div>\n      );\n\n    case \"tooltips\":\n      return (\n        <div className=\"wd-tooltip-demo\">\n          <button>{item.title}</button>\n          <span>{item.body}</span>\n        </div>\n      );\n\n    case \"typography\":\n      return (\n        <div className=\"wd-type-demo\">\n          <h2>{item.title}</h2>\n          <p>{item.body}</p>\n          <small>Caption text / label text</small>\n        </div>\n      );\n\n    case \"dragula\":\n      return (\n        <div className=\"wd-dragula-demo\">\n          <div>\n            <strong>Todo</strong>\n            <span>{item.title}</span>\n          </div>\n          <div>\n            <strong>Doing</strong>\n            <span>{item.body}</span>\n          </div>\n        </div>\n      );\n\n    case \"clipboard\":\n      return (\n        <div className=\"wd-clipboard-demo\">\n          <input readOnly value={item.body} />\n          <button>Copy</button>\n        </div>\n      );\n\n    case \"sweet-alerts\":\n      return (\n        <div className=\"wd-sweet-alert-demo\">\n          <div>!</div>\n          <h3>{item.title}</h3>\n          <p>{item.body}</p>\n          <button>Okay</button>\n        </div>\n      );\n\n    case \"lightbox\":\n      return (\n        <div>\n          <h3>{item.title}</h3>\n          <div className=\"wd-lightbox-grid\">\n            <span />\n            <span />\n            <span />\n          </div>\n        </div>\n      );\n\n    case \"scrollbar\":\n      return (\n        <div className=\"wd-scrollbar-demo\">\n          <h3>{item.title}</h3>\n          <p>{item.body}</p>\n          <p>Scrollable item one</p>\n          <p>Scrollable item two</p>\n          <p>Scrollable item three</p>\n          <p>Scrollable item four</p>\n        </div>\n      );\n\n    default:\n      return (\n        <div>\n          <h3>{item.title}</h3>\n          <p>{item.body}</p>\n        </div>\n      );\n  }\n}\n";

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
    "",
    "export type ExportedCanvasItem = {",
    "  instanceId: string;",
    "  definitionId: string;",
    "  title: string;",
    "  body: string;",
    "  accent: string;",
    "  size: \"compact\" | \"normal\" | \"wide\";",
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

