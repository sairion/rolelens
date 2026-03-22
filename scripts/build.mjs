import { mkdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { build } from "esbuild";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");

async function ensureDir(dirPath) {
  await mkdir(dirPath, { recursive: true });
}

async function copyIfExists(from, to) {
  if (!existsSync(from)) {
    return;
  }

  await ensureDir(path.dirname(to));
  await copyFile(from, to);
}

async function copyRequiredFile(from, to) {
  if (!existsSync(from)) {
    throw new Error(`Required build asset is missing: ${from}`);
  }

  await ensureDir(path.dirname(to));
  await copyFile(from, to);
}

async function bundleIfExists(entryPoint, outfile) {
  if (!existsSync(entryPoint)) {
    return;
  }

  await build({
    bundle: true,
    entryPoints: [entryPoint],
    format: "iife",
    outfile,
    platform: "browser",
    target: "chrome114"
  });
}

await ensureDir(distDir);

const iconFileNames = [
  "icon-16.png",
  "icon-32.png",
  "icon-48.png",
  "icon-128.png"
];

await Promise.all([
  copyRequiredFile(path.join(rootDir, "src/manifest.json"), path.join(distDir, "manifest.json")),
  copyIfExists(path.join(rootDir, "src/options/index.html"), path.join(distDir, "options.html")),
  copyIfExists(path.join(rootDir, "src/options/styles.css"), path.join(distDir, "options.css")),
  bundleIfExists(path.join(rootDir, "src/options/index.ts"), path.join(distDir, "options.js")),
  bundleIfExists(path.join(rootDir, "src/content/index.ts"), path.join(distDir, "content.js")),
  ...iconFileNames.map((fileName) =>
    copyRequiredFile(
      path.join(rootDir, "src/icons", fileName),
      path.join(distDir, "icons", fileName)
    )
  )
]);
