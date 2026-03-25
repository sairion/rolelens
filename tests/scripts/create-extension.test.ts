import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { readReleaseMetadata } from "../../scripts/create-extension.mjs";

const tempDirs: string[] = [];

function createTempDir(prefix: string) {
  const dirPath = mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dirPath);
  return dirPath;
}

describe("readReleaseMetadata", () => {
  afterEach(() => {
    tempDirs.splice(0).forEach((dirPath) => {
      rmSync(dirPath, { force: true, recursive: true });
    });
  });

  it("rejects mismatched package and manifest versions", async () => {
    const tempDir = createTempDir("rolelens-release-metadata-");
    const packageJsonPath = path.join(tempDir, "package.json");
    const manifestPath = path.join(tempDir, "manifest.json");

    writeFileSync(
      packageJsonPath,
      JSON.stringify({ name: "rolelens", version: "0.1.0" }),
      "utf8"
    );
    writeFileSync(
      manifestPath,
      JSON.stringify({ version: "0.1.1" }),
      "utf8"
    );

    await expect(
      readReleaseMetadata({ packageJsonPath, manifestPath })
    ).rejects.toThrow(/version/i);
  });
});
