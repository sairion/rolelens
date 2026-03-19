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

    const manifest = JSON.parse(
      readFileSync(path.join(distDir, "manifest.json"), "utf8")
    ) as {
      host_permissions: string[];
      content_scripts: Array<{ matches: string[] }>;
    };

    expect(manifest.host_permissions).toEqual([
      "https://www.wanted.co.kr/wdlist/*"
    ]);
    expect(manifest.content_scripts[0]?.matches).toEqual([
      "https://www.wanted.co.kr/wdlist/*"
    ]);
  });
});
