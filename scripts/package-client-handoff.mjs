#!/usr/bin/env node
/**
 * Assembles client handoff package: production dist + documentation.
 * Usage: node scripts/package-client-handoff.mjs [--skip-build]
 */
import {
  cpSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const handoffRoot = join(root, "handoff");
const docsSource = join(root, "docs", "handoff");
const distSource = join(root, "dist");

const skipBuild = process.argv.includes("--skip-build");

function log(msg) {
  console.log(`[handoff] ${msg}`);
}

function copyDir(src, dest) {
  cpSync(src, dest, { recursive: true });
}

function runBuild() {
  log("Running production build…");
  const r = spawnSync("npm", ["run", "build"], { cwd: root, stdio: "inherit" });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

function assertDist() {
  const index = join(distSource, "index.html");
  if (!existsSync(index)) {
    console.error("[handoff] dist/index.html missing. Run npm run build first.");
    process.exit(1);
  }
}

function assertDocs() {
  if (!existsSync(join(docsSource, "README.md"))) {
    console.error("[handoff] docs/handoff/README.md missing.");
    process.exit(1);
  }
}

function writeManifest() {
  const docFiles = readdirSync(join(handoffRoot, "docs")).filter((f) => f.endsWith(".md"));
  const distFiles = countFiles(join(handoffRoot, "dist"));
  const manifest = {
    package: "FamilySite491-chore-kiosk-handoff",
    generatedAt: new Date().toISOString(),
    distFileCount: distFiles,
    documentation: docFiles.sort(),
    quickStart: [
      "cd handoff/dist && npx --yes serve -l 4173",
      "Open http://localhost:4173/chores",
    ],
  };
  writeFileSync(join(handoffRoot, "MANIFEST.json"), JSON.stringify(manifest, null, 2) + "\n");
}

function countFiles(dir) {
  if (!existsSync(dir)) return 0;
  let n = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) n += countFiles(p);
    else n += 1;
  }
  return n;
}

function main() {
  if (!skipBuild) runBuild();
  assertDist();
  assertDocs();

  log("Preparing handoff/ …");
  if (existsSync(handoffRoot)) {
    rmSync(handoffRoot, { recursive: true, force: true });
  }
  mkdirSync(handoffRoot, { recursive: true });

  copyDir(distSource, join(handoffRoot, "dist"));
  copyDir(docsSource, join(handoffRoot, "docs"));

  copyFileSync(join(docsSource, "README.md"), join(handoffRoot, "README.md"));

  const screenshotsSrc = join(docsSource, "screenshots");
  if (existsSync(screenshotsSrc)) {
    copyDir(screenshotsSrc, join(handoffRoot, "screenshots"));
  } else {
    mkdirSync(join(handoffRoot, "screenshots"), { recursive: true });
    writeFileSync(
      join(handoffRoot, "screenshots", "README.md"),
      "# Add screenshots per docs/PAGES_AND_SCREENSHOTS.md\n",
    );
  }

  writeManifest();
  log(`Done → ${handoffRoot}`);
  log(`  dist/  (${countFiles(join(handoffRoot, "dist"))} files)`);
  log(`  docs/  (${readdirSync(join(handoffRoot, "docs")).length} items)`);
}

main();
