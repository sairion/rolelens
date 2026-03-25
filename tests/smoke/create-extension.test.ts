import { execFileSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

const rootDir = path.resolve(__dirname, "../..");
const packageJsonPath = path.join(rootDir, "package.json");
const manifestPath = path.join(rootDir, "src", "manifest.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
  name: string;
  version: string;
};
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
  version: string;
};

const tempDirs: string[] = [];

function createTempDir(prefix: string) {
  const dirPath = mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dirPath);
  return dirPath;
}

function createChromeStub() {
  const tempDir = createTempDir("rolelens-chrome-stub-");
  const scriptPath = path.join(tempDir, "chrome-stub.mjs");

  writeFileSync(
    scriptPath,
    `#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import path from "node:path";

const extensionArg = process.argv.find((arg) => arg.startsWith("--pack-extension="));
if (!extensionArg) {
  process.exit(1);
}

const extensionDir = extensionArg.slice("--pack-extension=".length);
writeFileSync(path.join(path.dirname(extensionDir), path.basename(extensionDir) + ".crx"), "stub crx");
`,
    "utf8"
  );
  chmodSync(scriptPath, 0o755);

  return scriptPath;
}

describe("create-extension command", () => {
  afterEach(() => {
    tempDirs.splice(0).forEach((dirPath) => {
      rmSync(dirPath, { force: true, recursive: true });
    });
  });

  it("creates uploadable zip and crx artifacts", () => {
    const releaseDir = createTempDir("rolelens-release-");
    const keyPath = path.join(releaseDir, `${packageJson.name}-${manifest.version}.pem`);
    const chromeStubPath = createChromeStub();

    copyFileSync(
      path.join(rootDir, "release", `${packageJson.name}-${manifest.version}.pem`),
      keyPath
    );

    execFileSync("pnpm", ["create-extension"], {
      cwd: rootDir,
      env: {
        ...process.env,
        ROLELENS_CHROME_BIN: chromeStubPath,
        ROLELENS_EXTENSION_KEY: keyPath,
        ROLELENS_RELEASE_DIR: releaseDir
      },
      stdio: "inherit"
    });

    const artifactBaseName = `${packageJson.name}-${manifest.version}`;
    expect(existsSync(path.join(releaseDir, `${artifactBaseName}-chrome-web-store.zip`))).toBe(true);
    expect(existsSync(path.join(releaseDir, `${artifactBaseName}.crx`))).toBe(true);
  });
});
