import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = path.resolve(__dirname, "../..");
const distDir = path.join(rootDir, "dist");

describe("production build output", () => {
  it("emits and wires the content and options bundles", () => {
    rmSync(distDir, { force: true, recursive: true });

    execFileSync("pnpm", ["build"], {
      cwd: rootDir,
      stdio: "inherit"
    });

    expect(existsSync(path.join(distDir, "content.js"))).toBe(true);
    expect(existsSync(path.join(distDir, "options.js"))).toBe(true);

    const optionsHtml = readFileSync(path.join(distDir, "options.html"), "utf8");
    expect(optionsHtml).toContain('./options.js');
  });
});
