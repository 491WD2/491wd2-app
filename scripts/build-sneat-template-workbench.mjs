/**
 * Copies Sneat Laravel template build output + static assets into public/template-workbench/sneat/
 * and generates standalone HTML pages from Blade @section('content') (+ optional vendor/page scripts).
 *
 * Run from repo root: node scripts/build-sneat-template-workbench.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SNEAT = path.join(ROOT, "references/sneat-bootstrap-html-laravel-admin-template-free-main");
const OUT = path.join(ROOT, "public/template-workbench/sneat");
const BUILD_SRC = path.join(SNEAT, "public/build");
const ASSETS_SRC = path.join(SNEAT, "public/assets");
const VIEWS = path.join(SNEAT, "resources/views/content");
const MACRO_PATH = path.join(SNEAT, "resources/views/_partials/macros.blade.php");

let _macroCache;
function inlineMacros() {
  if (!_macroCache) {
    let m = fs.readFileSync(MACRO_PATH, "utf8");
    m = m.replace(/@php[\s\S]*?@endphp\s*/m, "");
    m = m.replace(/\{\{\s*\$width\s*\}\}/g, "25");
    _macroCache = m.trim();
  }
  return _macroCache;
}

const manifest = JSON.parse(fs.readFileSync(path.join(BUILD_SRC, "manifest.json"), "utf8"));

function mfile(key) {
  const e = manifest[key];
  if (!e?.file) {
    throw new Error(`Missing manifest entry: ${key}`);
  }
  return `/template-workbench/sneat/build/${e.file}`;
}

function parseViteArgs(inner) {
  const s = inner.trim();
  if (s.startsWith("[")) {
    try {
      return JSON.parse(s.replace(/'/g, '"'));
    } catch {
      return [];
    }
  }
  const single = s.match(/^['"]([^'"]+)['"]$/);
  return single ? [single[1]] : [];
}

function viteToLinkOrScript(inner, as) {
  const keys = parseViteArgs(inner);
  const tags = [];
  for (const k of keys) {
    const entry = manifest[k];
    if (!entry?.file) continue;
    const href = `/template-workbench/sneat/build/${entry.file}`;
    if (as === "css" || href.endsWith(".css")) {
      tags.push(`<link rel="stylesheet" href="${href}" />`);
    } else {
      tags.push(`<script src="${href}" defer></script>`);
    }
  }
  return tags.join("\n    ");
}

function extractSectionRaw(src, sectionName) {
  const re = new RegExp(`@section\\('${sectionName}'\\)([\\s\\S]*?)@endsection`, "m");
  const m = src.match(re);
  return m ? m[1].trim() : "";
}

function expandViteInBladeFragment(fragment) {
  let out = fragment;
  out = out.replace(/@vite\s*\(\s*(\[[^\]]+\]|'[^']+'|"[^"]+")\s*\)/g, (_, inner) => {
    try {
      return viteToLinkOrScript(inner, "auto");
    } catch {
      return `<!-- vite skip: ${inner} -->`;
    }
  });
  return out;
}

function rewriteAssetUrls(html) {
  return html.replace(/\{\{\s*asset\s*\(\s*['"]assets\/([^'"]+)['"]\s*\)\s*\}\}/g, "/template-workbench/sneat/assets/$1");
}

function rmcp(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function cpr(src, dest) {
  fs.cpSync(src, dest, { recursive: true });
}

/** Blade files (under resources/views/content) -> output html basename */
const BLADE_MAP = [
  ["user-interface/ui-alerts.blade.php", "ui-alerts.html"],
  ["user-interface/ui-buttons.blade.php", "ui-buttons.html"],
  ["user-interface/ui-list-groups.blade.php", "ui-list-groups.html"],
  ["user-interface/ui-badges.blade.php", "ui-badges.html"],
  ["user-interface/ui-modals.blade.php", "ui-modals.html"],
  ["user-interface/ui-dropdowns.blade.php", "ui-dropdowns.html"],
  ["user-interface/ui-progress.blade.php", "ui-progress.html"],
  ["user-interface/ui-tabs-pills.blade.php", "ui-tabs.html"],
  ["user-interface/ui-toasts.blade.php", "ui-toasts.html"],
  ["user-interface/ui-tooltips-popovers.blade.php", "ui-tooltips.html"],
  ["user-interface/ui-accordion.blade.php", "ui-accordion.html"],
  ["user-interface/ui-carousel.blade.php", "ui-carousel.html"],
  ["user-interface/ui-collapse.blade.php", "ui-collapse.html"],
  ["user-interface/ui-footer.blade.php", "ui-footer.html"],
  ["user-interface/ui-navbar.blade.php", "ui-navbar.html"],
  ["user-interface/ui-offcanvas.blade.php", "ui-offcanvas.html"],
  ["user-interface/ui-pagination-breadcrumbs.blade.php", "ui-pagination-breadcrumbs.html"],
  ["user-interface/ui-spinners.blade.php", "ui-spinners.html"],
  ["user-interface/ui-typography.blade.php", "ui-typography.html"],
  ["tables/tables-basic.blade.php", "tables-basic.html"],
  ["cards/cards-basic.blade.php", "cards-basic.html"],
  ["dashboard/dashboards-analytics.blade.php", "dashboard-analytics.html"],
  ["form-elements/forms-basic-inputs.blade.php", "forms-basic-inputs.html"],
  ["form-elements/forms-input-groups.blade.php", "forms-input-groups.html"],
  ["form-layout/form-layouts-horizontal.blade.php", "form-layout-horizontal.html"],
  ["form-layout/form-layouts-vertical.blade.php", "form-layout-vertical.html"],
  ["icons/icons-boxicons.blade.php", "icons-boxicons.html"],
  ["extended-ui/extended-ui-perfect-scrollbar.blade.php", "extended-ui-perfect-scrollbar.html"],
  ["extended-ui/extended-ui-text-divider.blade.php", "extended-ui-text-divider.html"],
  ["layouts-example/layouts-blank.blade.php", "layout-blank.html"],
  ["layouts-example/layouts-container.blade.php", "layout-container.html"],
  ["layouts-example/layouts-fluid.blade.php", "layout-fluid.html"],
  ["layouts-example/layouts-without-menu.blade.php", "layout-without-menu.html"],
  ["layouts-example/layouts-without-navbar.blade.php", "layout-without-navbar.html"],
  ["pages/pages-account-settings-account.blade.php", "pages-account-settings-account.html"],
  ["pages/pages-account-settings-connections.blade.php", "pages-account-settings-connections.html"],
  ["pages/pages-account-settings-notifications.blade.php", "pages-account-settings-notifications.html"],
  ["pages/pages-misc-error.blade.php", "pages-misc-error.html"],
  ["pages/pages-misc-under-maintenance.blade.php", "pages-misc-under-maintenance.html"],
  ["authentications/auth-login-basic.blade.php", "auth-login-basic.html"],
  ["authentications/auth-register-basic.blade.php", "auth-register-basic.html"],
  ["authentications/auth-forgot-password-basic.blade.php", "auth-forgot-password-basic.html"],
];

function defaultHeadCss() {
  return [
    `<link rel="preconnect" href="https://fonts.googleapis.com" />`,
    `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />`,
    `<link href="https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet" />`,
    `<link rel="stylesheet" href="${mfile("resources/assets/vendor/fonts/iconify/iconify.css")}" />`,
    `<link rel="stylesheet" href="${mfile("resources/assets/vendor/scss/core.scss")}" />`,
    `<link rel="stylesheet" href="${mfile("resources/assets/css/demo.css")}" />`,
    `<link rel="stylesheet" href="${mfile("resources/assets/vendor/libs/perfect-scrollbar/perfect-scrollbar.scss")}" />`,
  ].join("\n    ");
}

function defaultHeadJs() {
  return [
    `<script src="${mfile("resources/assets/vendor/js/helpers.js")}"></script>`,
    `<script src="${mfile("resources/assets/js/config.js")}"></script>`,
  ].join("\n    ");
}

function defaultBodyScripts(extraVendor = "", extraPage = "") {
  const core = [
    `<script src="${mfile("resources/assets/vendor/libs/jquery/jquery.js")}"></script>`,
    `<script src="${mfile("resources/assets/vendor/libs/popper/popper.js")}"></script>`,
    `<script src="${mfile("resources/assets/vendor/js/bootstrap.js")}"></script>`,
    `<script src="${mfile("resources/assets/vendor/libs/perfect-scrollbar/perfect-scrollbar.js")}"></script>`,
    `<script src="${mfile("resources/assets/vendor/js/menu.js")}"></script>`,
    extraVendor,
    `<script src="${mfile("resources/assets/js/main.js")}"></script>`,
    extraPage,
    `<script src="${mfile("resources/js/app.js")}"></script>`,
  ]
    .filter(Boolean)
    .join("\n    ");
  return core;
}

function buildPage(bladePath, title, outName) {
  const full = path.join(VIEWS, bladePath);
  let src = fs.readFileSync(full, "utf8");
  const titleMatch = src.match(/@section\s*\(\s*['"]title['"]\s*,\s*['"]([^'"]+)['"]\s*\)/);
  const pageTitle = title || (titleMatch ? titleMatch[1] : outName.replace(".html", ""));

  let vendorStyle = extractSectionRaw(src, "vendor-style");
  const pageStyle = extractSectionRaw(src, "page-style");
  if (pageStyle) {
    vendorStyle = [vendorStyle, pageStyle].filter(Boolean).join("\n");
  }
  let vendorScript = extractSectionRaw(src, "vendor-script");
  let pageScript = extractSectionRaw(src, "page-script");
  let content = extractSectionRaw(src, "content");
  if (!content) {
    throw new Error(`No @section('content') in ${bladePath}`);
  }
  vendorStyle = expandViteInBladeFragment(vendorStyle);
  vendorScript = expandViteInBladeFragment(vendorScript);
  pageScript = expandViteInBladeFragment(pageScript);
  content = rewriteAssetUrls(expandViteInBladeFragment(content));
  content = content.replace(/@include\(['"]_partials\.macros['"]\)/g, inlineMacros());
  /** Remove remaining blade echoes / php one-liners */
  content = content.replace(/\{\{[^}]+\}\}/g, "");
  content = content.replace(/@csrf/g, "");
  content = content.replace(/@lang\([^)]*\)/g, "");

  const html = `<!DOCTYPE html>
<html lang="en" class="layout-menu-fixed layout-compact" data-assets-path="/template-workbench/sneat/assets/" dir="ltr" data-bs-theme="light">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${pageTitle} | Sneat (491WD workbench)</title>
  <link rel="icon" type="image/x-icon" href="/template-workbench/sneat/assets/img/favicon/favicon.ico" />
    ${defaultHeadCss()}
    ${vendorStyle}
    ${defaultHeadJs()}
</head>
<body>
  <div class="layout-wrapper layout-without-menu light-style">
    <div class="layout-page">
      <div class="content-wrapper">
        <div class="container-xxl flex-grow-1 container-p-y">
${content}
        </div>
        <div class="content-backdrop fade"></div>
      </div>
    </div>
  </div>
    ${defaultBodyScripts(vendorScript, pageScript)}
</body>
</html>`;

  const outPath = path.join(OUT, "html", outName);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, "utf8");
  console.log("wrote", path.relative(ROOT, outPath));
}

/** Must match `src/lib/templateWorkbenchTypes.ts` → TEMPLATE_WORKBENCH_CATEGORY_ORDER */
const VALID_CATEGORIES = new Set([
  "Dashboards",
  "CRM Module Pages",
  "Application Pages",
  "People / Employee Pages",
  "Pantry Candidate Layouts",
  "Base UI",
  "Advanced UI",
  "Forms",
  "Tables",
  "Layout Systems",
  "Card Layouts",
  "Sidebar / Navigation",
  "Other",
]);

const DEFAULT_SNEAT_NOTE =
  "Generated by `node scripts/build-sneat-template-workbench.mjs` from Sneat Blade views; CSS/JS from `public/template-workbench/sneat/build/` (Vite manifest) and static assets under `sneat/assets/`.";

function inferCategory(rel) {
  if (rel.startsWith("tables/")) return "Tables";
  if (rel.startsWith("cards/")) return "Card Layouts";
  if (rel.startsWith("dashboard/")) return "Dashboards";
  if (rel.startsWith("form-elements/") || rel.startsWith("form-layout/")) return "Forms";
  if (rel.startsWith("layouts-example/")) return "Layout Systems";
  if (rel.startsWith("pages/pages-account")) return "CRM Module Pages";
  if (rel.startsWith("pages/")) return "Application Pages";
  if (rel.startsWith("authentications/")) return "Application Pages";
  if (rel.startsWith("icons/")) return "Base UI";
  if (rel.startsWith("extended-ui/")) return "Advanced UI";
  if (rel.startsWith("user-interface/")) return "Base UI";
  return "Other";
}

function inferSubcategory(rel, outName) {
  const stem = outName.replace(".html", "");
  if (rel.includes("user-interface/")) {
    return prettifyTitle(stem.replace(/^ui-/, ""));
  }
  if (rel.startsWith("authentications/")) return "Authentication";
  if (rel.startsWith("layouts-example/")) return prettifyTitle(stem.replace(/^layout-/, "Layout "));
  if (rel.startsWith("pages/")) {
    if (stem.includes("account-settings")) {
      return prettifyTitle(stem.replace(/^pages-account-settings-/, ""));
    }
    return prettifyTitle(stem.replace(/^pages-/, ""));
  }
  if (rel.startsWith("extended-ui/")) return prettifyTitle(stem.replace(/^extended-ui-/, ""));
  return prettifyTitle(stem);
}

function prettifyTitle(stem) {
  const s = stem.replace(/^ui-/, "").replace(/-/g, " ");
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function defaultRelated(rel, outName) {
  const stem = outName.replace(".html", "");
  const byStem = {
    "ui-alerts": ["alerts"],
    "ui-buttons": ["buttons"],
    "ui-list-groups": ["list-groups"],
    "ui-badges": ["badges"],
    "ui-modals": ["modals"],
    "ui-dropdowns": ["dropdowns"],
    "ui-progress": ["progress"],
    "ui-tabs": ["tabs"],
    "ui-toasts": ["toasts"],
    "ui-tooltips": ["tooltips", "popovers"],
    "ui-accordion": ["accordion"],
    "ui-carousel": ["carousel"],
    "ui-collapse": ["collapse"],
    "ui-footer": ["typography"],
    "ui-navbar": ["breadcrumb"],
    "ui-offcanvas": ["offcanvas"],
    "ui-pagination-breadcrumbs": ["pagination", "breadcrumb"],
    "ui-spinners": ["spinner"],
    "ui-typography": ["typography"],
    "tables-basic": ["table"],
    "cards-basic": ["card"],
    "dashboard-analytics": ["card", "grid"],
    "forms-basic-inputs": ["form-field", "inputs"],
    "forms-input-groups": ["form-field", "inputs"],
    "form-layout-horizontal": ["form-field"],
    "form-layout-vertical": ["form-field"],
    "icons-boxicons": ["buttons"],
    "extended-ui-perfect-scrollbar": ["card"],
    "extended-ui-text-divider": ["typography"],
    "layout-blank": ["grid"],
    "layout-container": ["grid"],
    "layout-fluid": ["grid"],
    "layout-without-menu": ["grid"],
    "layout-without-navbar": ["grid"],
    "pages-account-settings-account": ["form-field", "card"],
    "pages-account-settings-connections": ["form-field", "card"],
    "pages-account-settings-notifications": ["form-field", "card"],
    "pages-misc-error": ["alerts", "buttons"],
    "pages-misc-under-maintenance": ["alerts", "buttons"],
    "auth-login-basic": ["buttons", "form-field", "inputs"],
    "auth-register-basic": ["buttons", "form-field", "inputs"],
    "auth-forgot-password-basic": ["buttons", "form-field", "inputs"],
  };
  if (byStem[stem]) {
    return byStem[stem];
  }
  if (rel.startsWith("tables/")) return ["table"];
  if (rel.startsWith("cards/")) return ["card"];
  return ["typography"];
}

function defaultTags(rel, outName) {
  const tags = new Set(["Sneat"]);
  const lower = outName.toLowerCase();
  if (lower.includes("alert")) {
    tags.add("Alerts");
    tags.add("Alert Variant Source");
  }
  if (lower.includes("button") && !lower.includes("auth")) tags.add("Buttons");
  if (lower.includes("list-group")) tags.add("List Groups");
  if (lower.includes("tables")) {
    tags.add("Tables");
    tags.add("Employees");
    tags.add("Contacts");
  }
  if (lower.includes("cards")) {
    tags.add("Cards");
    tags.add("Notes");
  }
  if (lower.includes("dashboard")) tags.add("Dashboard");
  if (lower.includes("layout-")) tags.add("Layouts");
  if (lower.includes("pages-account")) tags.add("CRM");
  if (lower.includes("auth-")) tags.add("Authentication");
  if (rel.startsWith("extended-ui/")) tags.add("Advanced UI");
  if (lower.includes("clipboard") || lower.includes("dragula")) tags.add("Advanced UI");
  return [...tags];
}

/** Optional per-file overrides (deep-merge fields) */
const SNEAT_META_OVERRIDES = {
  "tables-basic.html": {
    category: "Tables",
    subcategory: "Bootstrap tables",
    description:
      "Sneat basic tables page: bordered and responsive table patterns suitable as a visual stand-in for employee or contact directories.",
    bestFor: "Row density, headers, badges in cells, and action columns before rebuilding in React.",
    tags: ["Employees", "Contacts", "Pantry List Candidate", "CRM"],
    notes:
      "The free Sneat pack does not ship separate employees.html / contacts.html; use this page (plus Pantry index) for list chrome.",
  },
  "cards-basic.html": {
    category: "Card Layouts",
    subcategory: "Card grids",
    description: "Basic card arrangements, headers, and list groups inside cards.",
    bestFor: "Notes-style tiles, KPI cards, and dashboard modules.",
    tags: ["Notes", "Cards", "Dashboard"],
  },
  "dashboard-analytics.html": {
    category: "Dashboards",
    subcategory: "Analytics dashboard",
    description: "Full Sneat analytics dashboard: charts placeholders, stat cards, and mixed widgets.",
    bestFor: "Home / overview density comparable to packaged admin dashboards.",
    tags: ["Dashboard", "CRM"],
  },
  "pages-account-settings-notifications.html": {
    tags: ["Notes", "CRM"],
    description: "Account notifications preferences: toggles and grouped settings blocks.",
    bestFor: "Settings-style forms and switch lists (closest built-in page to a notes/preferences surface).",
  },
  "extended-ui-perfect-scrollbar.html": {
    tags: ["Advanced UI", "Scrollbar"],
    notes: `${DEFAULT_SNEAT_NOTE} For drag-and-drop boards (dragula) and clipboard.js demos, this free pack has no matching Blade pages — use UI Builder variants or vendor extra HTML under public/template-workbench/html/.`,
  },
  "extended-ui-text-divider.html": {
    tags: ["Advanced UI"],
  },
};

function buildWorkbenchCatalogEntry(rel, outName) {
  const stem = outName.replace(".html", "");
  const id = `sneat-${stem}`;
  const ov = SNEAT_META_OVERRIDES[outName] ?? {};
  const category = ov.category ?? inferCategory(rel);
  if (!VALID_CATEGORIES.has(category)) {
    throw new Error(`Invalid category "${category}" for ${outName}`);
  }
  const subcategory = ov.subcategory ?? inferSubcategory(rel, outName);
  const title = ov.title ?? `Sneat — ${prettifyTitle(stem)}`;
  const description =
    ov.description ??
    `Standalone preview of Sneat’s Blade content for \`${rel}\`, with template scripts and styles wired from the Vite build.`;
  const bestFor =
    ov.bestFor ??
    "Matching Bootstrap / Sneat spacing, colors, and component markup when translating screens into the UI Builder.";
  const relatedBuilderComponents = ov.relatedBuilderComponents ?? defaultRelated(rel, outName);
  const tagList = [...new Set([...(ov.tags ?? []), ...defaultTags(rel, outName)])].sort((a, b) =>
    a.localeCompare(b),
  );
  const notes = ov.notes ?? DEFAULT_SNEAT_NOTE;
  return {
    id,
    title,
    category,
    subcategory,
    originalPath: `references/sneat-bootstrap-html-laravel-admin-template-free-main/resources/views/content/${rel}`,
    publicPath: `public/template-workbench/sneat/html/${outName}`,
    iframeSrc: `/template-workbench/sneat/html/${outName}`,
    thumbnailSrc: null,
    previewMode: "static-iframe",
    assetsLoadCorrectly: true,
    showInWorkbench: true,
    description,
    bestFor,
    relatedBuilderComponents,
    tags: tagList,
    notes,
  };
}

function main() {
  if (!fs.existsSync(SNEAT)) {
    console.error("Missing Sneat folder:", SNEAT);
    process.exit(1);
  }
  if (!fs.existsSync(BUILD_SRC)) {
    console.error("Run npm run build inside Sneat template first:", SNEAT);
    process.exit(1);
  }
  rmcp(OUT);
  fs.mkdirSync(path.join(OUT, "html"), { recursive: true });
  cpr(BUILD_SRC, path.join(OUT, "build"));
  cpr(ASSETS_SRC, path.join(OUT, "assets"));

  for (const [rel, outName] of BLADE_MAP) {
    buildPage(rel, null, outName);
  }

  const workbenchItems = BLADE_MAP.map(([rel, outName]) => buildWorkbenchCatalogEntry(rel, outName));
  const catalogPublic = workbenchItems.map((item) => ({
    id: item.id,
    outName: item.publicPath.replace(/^public\/template-workbench\/sneat\/html\//, ""),
    iframeSrc: item.iframeSrc,
    sourceBlade: item.originalPath.replace(/^references\/sneat-bootstrap-html-laravel-admin-template-free-main\//, ""),
  }));
  fs.writeFileSync(path.join(OUT, "catalog.generated.json"), JSON.stringify(catalogPublic, null, 2), "utf8");
  console.log("catalog", path.relative(ROOT, path.join(OUT, "catalog.generated.json")));

  const catalogTsPath = path.join(ROOT, "src/lib/sneatWorkbenchCatalog.json");
  fs.mkdirSync(path.dirname(catalogTsPath), { recursive: true });
  fs.writeFileSync(catalogTsPath, JSON.stringify(workbenchItems, null, 2), "utf8");
  console.log("workbench catalog", path.relative(ROOT, catalogTsPath));
}

main();
