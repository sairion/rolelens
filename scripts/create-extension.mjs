import { execFile } from "node:child_process";
import { access, cp, mkdir, readFile, rename, rm } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const defaultRootDir = path.resolve(scriptDir, "..");

const chromeCandidates = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
  "google-chrome",
  "google-chrome-stable",
  "chromium",
  "chromium-browser"
];

async function pathExists(targetPath) {
  try {
    await access(targetPath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function ensureReadableFile(filePath, label) {
  try {
    await access(filePath, constants.R_OK);
  } catch {
    throw new Error(`${label} not found or not readable: ${filePath}`);
  }
}

async function ensureExecutable(filePath, label) {
  try {
    await access(filePath, constants.X_OK);
  } catch {
    throw new Error(`${label} is not executable: ${filePath}`);
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function commandExists(command) {
  try {
    await execFileAsync("which", [command]);
    return true;
  } catch {
    return false;
  }
}

export async function readReleaseMetadata({
  packageJsonPath = path.join(defaultRootDir, "package.json"),
  manifestPath = path.join(defaultRootDir, "src", "manifest.json")
} = {}) {
  const packageJson = await readJson(packageJsonPath);
  const manifest = await readJson(manifestPath);

  if (!packageJson.name || !packageJson.version) {
    throw new Error(`package.json must include name and version: ${packageJsonPath}`);
  }

  if (!manifest.version) {
    throw new Error(`manifest.json must include version: ${manifestPath}`);
  }

  if (packageJson.version !== manifest.version) {
    throw new Error(
      `Version mismatch between package.json (${packageJson.version}) and manifest.json (${manifest.version})`
    );
  }

  return {
    name: packageJson.name,
    version: packageJson.version
  };
}

async function resolveChromeBinary(explicitPath) {
  if (explicitPath) {
    await ensureExecutable(explicitPath, "Chrome binary");
    return explicitPath;
  }

  for (const candidate of chromeCandidates) {
    if (candidate.includes(path.sep)) {
      if (await pathExists(candidate)) {
        await ensureExecutable(candidate, "Chrome binary");
        return candidate;
      }
      continue;
    }

    if (await commandExists(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    "Unable to find a Chrome binary. Set ROLELENS_CHROME_BIN to a valid executable path."
  );
}

async function createZipArchive({ distDir, zipPath }) {
  await execFileAsync("zip", ["-rq", zipPath, "."], {
    cwd: distDir
  });
}

async function createCrxArchive({
  chromeBinaryPath,
  distDir,
  pemPath,
  releaseDir,
  artifactBaseName
}) {
  const stageDir = path.join(releaseDir, `${artifactBaseName}-crx-source`);
  const stageCrxPath = `${stageDir}.crx`;
  const stagePemPath = `${stageDir}.pem`;
  const finalCrxPath = path.join(releaseDir, `${artifactBaseName}.crx`);

  await rm(stageDir, { force: true, recursive: true });
  await rm(stageCrxPath, { force: true, recursive: true });
  await rm(stagePemPath, { force: true, recursive: true });
  await cp(distDir, stageDir, { recursive: true });

  try {
    await execFileAsync(
      chromeBinaryPath,
      [`--pack-extension=${stageDir}`, `--pack-extension-key=${pemPath}`],
      { cwd: releaseDir }
    );
    await rename(stageCrxPath, finalCrxPath);
  } finally {
    await rm(stageDir, { force: true, recursive: true });
    await rm(stageCrxPath, { force: true, recursive: true });
    await rm(stagePemPath, { force: true, recursive: true });
  }
}

export async function createExtension({
  rootDir = defaultRootDir,
  releaseDir = process.env.ROLELENS_RELEASE_DIR
    ? path.resolve(process.env.ROLELENS_RELEASE_DIR)
    : path.join(defaultRootDir, "release"),
  chromeBinaryPath = process.env.ROLELENS_CHROME_BIN,
  pemPath,
  distDir = path.join(defaultRootDir, "dist")
} = {}) {
  const { name, version } = await readReleaseMetadata({
    packageJsonPath: path.join(rootDir, "package.json"),
    manifestPath: path.join(rootDir, "src", "manifest.json")
  });
  const artifactBaseName = `${name}-${version}`;
  const resolvedPemPath =
    pemPath ??
    process.env.ROLELENS_EXTENSION_KEY ??
    path.join(releaseDir, `${artifactBaseName}.pem`);
  const resolvedChromeBinaryPath = await resolveChromeBinary(chromeBinaryPath);
  const zipPath = path.join(releaseDir, `${artifactBaseName}-chrome-web-store.zip`);
  const crxPath = path.join(releaseDir, `${artifactBaseName}.crx`);

  await ensureReadableFile(resolvedPemPath, "Extension key");
  await mkdir(releaseDir, { recursive: true });

  await execFileAsync("pnpm", ["build"], {
    cwd: rootDir,
    env: process.env
  });
  await ensureReadableFile(distDir, "Built extension directory");

  await rm(zipPath, { force: true });
  await rm(crxPath, { force: true });

  await createZipArchive({ distDir, zipPath });
  await createCrxArchive({
    chromeBinaryPath: resolvedChromeBinaryPath,
    distDir,
    pemPath: resolvedPemPath,
    releaseDir,
    artifactBaseName
  });

  return {
    zipPath,
    crxPath,
    pemPath: resolvedPemPath
  };
}

const invokedAsScript =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedAsScript) {
  createExtension()
    .then(({ zipPath, crxPath }) => {
      process.stdout.write(`Created ${zipPath}\nCreated ${crxPath}\n`);
    })
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    });
}
