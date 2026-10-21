#!/usr/bin/env node
/**
 * Copy notify-docs-hub-extension.yml into listed org repos under a hive root.
 *
 * Usage:
 *   node scripts/install-notify-docs-hub-extension.mjs
 *   HIVE_ROOT=Z:/code/github.com/antora-supplemental node scripts/install-notify-docs-hub-extension.mjs --check
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const templatesRoot = join(here, "..");
const source = join(
  templatesRoot,
  ".github/workflows/notify-docs-hub-extension.yml",
);
const manifestPath = join(templatesRoot, "notify-extension-repos.json");
const checkOnly = process.argv.includes("--check");

function resolveHiveRoot() {
  const candidates = [
    process.env.HIVE_ROOT,
    join(templatesRoot, ".."),
    process.env.CODE_ROOT &&
      join(process.env.CODE_ROOT, "github.com", "antora-supplemental"),
    process.env.CODE_ROOT,
  ].filter(Boolean);
  for (const root of candidates) {
    if (existsSync(join(root, "valentus-theme"))) return root;
  }
  return join(templatesRoot, "..");
}

const hiveRoot = resolveHiveRoot();

const { repos } = JSON.parse(readFileSync(manifestPath, "utf8"));
let copied = 0;
let missing = 0;
let skipped = 0;

for (const repo of repos) {
  const destDir = join(hiveRoot, repo, ".github", "workflows");
  const dest = join(destDir, "notify-docs-hub-extension.yml");
  const repoRoot = join(hiveRoot, repo);

  if (!existsSync(repoRoot)) {
    console.warn(`skip (not cloned): ${repo}`);
    missing++;
    continue;
  }

  if (!existsSync(source)) {
    console.error(`missing template: ${source}`);
    process.exit(1);
  }

  const current = existsSync(dest) ? readFileSync(dest, "utf8") : "";
  const next = readFileSync(source, "utf8");
  if (current === next) {
    skipped++;
    continue;
  }

  if (checkOnly) {
    console.log(`would update: ${repo}`);
    copied++;
    continue;
  }

  mkdirSync(destDir, { recursive: true });
  copyFileSync(source, dest);
  console.log(`installed: ${repo}`);
  copied++;
}

console.log(
  JSON.stringify({ copied, skipped, missing, checkOnly }, null, 2),
);

if (checkOnly && copied > 0) process.exit(2);
