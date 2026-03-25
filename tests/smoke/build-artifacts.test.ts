import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = path.resolve(__dirname, "../..");
const distDir = path.join(rootDir, "dist");

describe("build artifacts", () => {
  it("emits manifest.json and options.html", () => {
    rmSync(distDir, { force: true, recursive: true });

    execFileSync("pnpm", ["build"], {
      cwd: rootDir,
      stdio: "inherit"
    });

    expect(existsSync(path.join(distDir, "manifest.json"))).toBe(true);
    expect(existsSync(path.join(distDir, "options.html"))).toBe(true);
    expect(existsSync(path.join(distDir, "icons", "icon-16.png"))).toBe(true);
    expect(existsSync(path.join(distDir, "icons", "icon-32.png"))).toBe(true);
    expect(existsSync(path.join(distDir, "icons", "icon-48.png"))).toBe(true);
    expect(existsSync(path.join(distDir, "icons", "icon-128.png"))).toBe(true);

    const manifest = JSON.parse(
      readFileSync(path.join(distDir, "manifest.json"), "utf8")
    ) as {
      action?: {
        default_icon?: Record<string, string>;
      };
      host_permissions?: string[];
      content_scripts: Array<{ matches: string[] }>;
      icons?: Record<string, string>;
    };

    expect(manifest.host_permissions).toBeUndefined();
    expect(manifest.content_scripts[0]?.matches).toEqual([
      "https://www.wanted.co.kr/*"
    ]);
    expect(manifest.icons).toEqual({
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    });
    expect(manifest.action?.default_icon).toEqual({
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png"
    });
  });
});
