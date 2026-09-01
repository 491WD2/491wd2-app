import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:5173/dashboard-preview", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "/opt/cursor/artifacts/dashboard-preview-diagnostic/after-restart-1440.png", fullPage: true });
  const check = await page.evaluate(() => ({
    hasDp: !!document.querySelector(".dashboard-preview"),
    weather: document.body.innerText.includes("Local forecast unavailable"),
    placeholder: document.body.innerText.includes("Preview data will connect"),
    path: location.pathname,
  }));
  console.log(JSON.stringify(check));
  await browser.close();
}
main();
