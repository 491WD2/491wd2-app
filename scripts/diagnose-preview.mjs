import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";

const OUT = "/opt/cursor/artifacts/dashboard-preview-diagnostic";
mkdirSync(OUT, { recursive: true });

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleMsgs = [];
  page.on("console", (m) => consoleMsgs.push({ type: m.type(), text: m.text() }));

  await page.goto("http://localhost:5173/dashboard-preview", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);

  await page.screenshot({ path: `${OUT}/before-fix-1440.png`, fullPage: true });

  const dom = await page.evaluate(() => {
    const dp = document.querySelector(".dashboard-preview");
    const dpRoot = document.querySelector("[data-testid=dashboard-preview-root]");
    const shell = document.querySelector(".dashboard-preview__frame");
    const status = document.querySelector(".dashboard-preview__status");
    const bento = document.querySelector(".fh-bento");
    const placeholder = document.body.innerText.includes("Preview data will connect");

    const components = {
      DashboardStatusHeader: !!document.querySelector(".dashboard-preview__status"),
      FamilyAccessStrip:
        !!document.querySelector(".dashboard-preview__family-strip") ||
        !!document.querySelector(".dashboard-preview__family-below"),
      QuickAddPanel: !!document.querySelector('[aria-label="Quick add"]'),
      TodaySnapshot: !!document.querySelector('[aria-label="Today snapshot"]'),
      KitchenChoresCard: !!document.querySelector('[aria-label*="Kitchen duty"]'),
      CalendarUpcomingCard: !!document.querySelector('[aria-label*="Calendar and upcoming"]'),
      MessagesNotificationsCard: !!document.querySelector('[aria-label*="Messages and notifications"]'),
      ShoppingCard: !!document.querySelector('[aria-label="Shopping list"]'),
      PantryAlertsCard: !!document.querySelector('[aria-label="Pantry and storage"]'),
    };

    let cssVars = {};
    if (dp) {
      const cs = getComputedStyle(dp);
      cssVars = {
        "--dp-bg": cs.getPropertyValue("--dp-bg").trim(),
        "--dp-card": cs.getPropertyValue("--dp-card").trim(),
        "--dp-blue": cs.getPropertyValue("--dp-blue").trim(),
        "--dp-radius-shell": cs.getPropertyValue("--dp-radius-shell").trim(),
        "--dp-shadow": cs.getPropertyValue("--dp-shadow").trim(),
        "--dp-blur": cs.getPropertyValue("--dp-blur").trim(),
        background: cs.background.substring(0, 120),
      };
    }

    const stylesheets = [...document.styleSheets].map((ss) => {
      try {
        return ss.href || "[inline]";
      } catch {
        return "[blocked]";
      }
    });

    const hasPreviewCssInSheets = stylesheets.some(
      (h) => typeof h === "string" && h.includes("dashboard-preview"),
    );

    const visibleStrings = {
      localForecastUnavailable: document.body.innerText.includes("Local forecast unavailable"),
      localForecastPlaceholder: document.body.innerText.includes("Local forecast placeholder"),
      goodEvening: /Good (morning|afternoon|evening)/i.test(document.body.innerText),
      familySiteTitle: document.body.innerText.includes("FamilySite_491"),
      quickAdd: document.body.innerText.includes("Quick Add"),
      atAGlanceCounts: document.body.innerText.includes("At-a-glance counts"),
      previewDataWillConnect: document.body.innerText.includes("Preview data will connect"),
    };

    const sw = {
      controller: !!navigator.serviceWorker?.controller,
      registrations: 0,
    };

    return {
      url: location.href,
      pathname: location.pathname,
      title: document.title,
      hasDashboardPreview: !!dp,
      hasDashboardPreviewRoot: !!dpRoot,
      hasShell: !!shell,
      hasBento: !!bento,
      hasPlaceholder: placeholder,
      components,
      cssVars,
      stylesheets: stylesheets.filter((s) => s && (s.includes("dashboard") || s.includes("index") || s.includes("vite"))),
      hasPreviewCssInSheets,
      visibleStrings,
      sw,
      bodyTextSample: document.body.innerText.slice(0, 800),
      h1: document.querySelector("h1")?.textContent?.trim() ?? null,
      outerMainClasses: document.querySelector("main")?.className ?? null,
    };
  });

  // Check loaded CSS files via network from Vite
  const networkCss = [];
  page.on("response", (r) => {
    const u = r.url();
    if (u.includes(".css")) networkCss.push(u);
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  const swInfo = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return { supported: false };
    const regs = await navigator.serviceWorker.getRegistrations();
    return {
      supported: true,
      count: regs.length,
      scopes: regs.map((r) => r.scope),
    };
  });

  const report = { dom, consoleMsgs, swInfo };
  writeFileSync(`${OUT}/diagnostic.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
