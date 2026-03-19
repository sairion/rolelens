# Wanted Blacklist Extension Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chrome extension for `wanted.co.kr` that hides or annotates job cards by exact company name, supports in-page `+ / - / x` hover controls, and provides an options page for editing saved company statuses and the default unspecified status.

**Architecture:** Use a small TypeScript Chrome Extension MV3 project with a shared settings module, an options page UI, and a content script that scans Wanted job cards, resolves effective status, and attaches hover controls. Bundle the TypeScript entry points into plain browser-consumable files and cover shared logic plus DOM behavior with Vitest and jsdom.

**Tech Stack:** `pnpm`, TypeScript, esbuild, Vitest, jsdom, Chrome Extension Manifest V3

---

## Chunk 1: Project Scaffold And Tooling

### Task 1: Create project metadata and build/test configuration

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `scripts/build.mjs`
- Create: `.gitignore`

- [ ] **Step 1: Create minimal test-runner scaffolding**

Add the smallest possible `package.json`, `tsconfig.json`, and `vitest.config.ts` needed to run Vitest with `pnpm`. This is tooling bootstrap only, not production implementation.

- [ ] **Step 2: Install dependencies**

Run: `pnpm install`
Expected: dependencies and lockfile installed successfully.

- [ ] **Step 3: Write the failing scaffold test**

Create `tests/smoke/project-structure.test.ts` with a minimal test that imports the future shared settings module and expects the default unspecified status to be `"+"`.

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm vitest run tests/smoke/project-structure.test.ts`
Expected: FAIL because `src/shared/settings.ts` does not exist yet.

- [ ] **Step 5: Write minimal remaining project scaffolding**

Extend `package.json` with `build`, `test`, and `test:watch`; add a simple esbuild script that bundles future content/options entry points into `dist/` when they exist and skips missing entry points without failing.

- [ ] **Step 6: Add the minimal shared settings module**

Create `src/shared/settings.ts` exporting the settings types and a `DEFAULT_SETTINGS` constant with `defaultUnspecifiedStatus: "+"`.

- [ ] **Step 7: Run test to verify it passes**

Run: `pnpm vitest run tests/smoke/project-structure.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

Run:
```bash
git add .gitignore package.json pnpm-lock.yaml scripts/build.mjs src/shared/settings.ts tests/smoke/project-structure.test.ts tsconfig.json vitest.config.ts
git commit -m "chore: scaffold wanted blacklist extension"
```

### Task 2: Add static extension shell

**Files:**
- Create: `src/manifest.json`
- Create: `src/options/index.html`
- Create: `src/options/styles.css`

- [ ] **Step 1: Write the failing build test**

Create `tests/smoke/build-artifacts.test.ts` that expects the build output to include `dist/manifest.json` and `dist/options.html` after the build script runs.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/smoke/build-artifacts.test.ts`
Expected: FAIL because the static files and build copy logic do not exist yet.

- [ ] **Step 3: Write minimal static shell**

Create the manifest scoped to `https://www.wanted.co.kr/*`, define the options page as `options.html`, and add the basic options HTML/CSS shell.

- [ ] **Step 4: Extend the build script**

Copy `src/manifest.json` to `dist/manifest.json`, copy `src/options/index.html` to `dist/options.html`, and copy `src/options/styles.css` to `dist/options.css` during `pnpm build`.

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run tests/smoke/build-artifacts.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

Run:
```bash
git add scripts/build.mjs src/manifest.json src/options/index.html src/options/styles.css tests/smoke/build-artifacts.test.ts
git commit -m "chore: add extension shell"
```

## Chunk 2: Shared Settings And Options Page

### Task 3: Implement shared settings persistence

**Files:**
- Modify: `src/shared/settings.ts`
- Create: `src/shared/storage.ts`
- Create: `tests/shared/storage.test.ts`

- [ ] **Step 1: Write the failing test**

Write tests for:
- loading defaults when storage is empty
- falling back to in-memory defaults when storage read throws
- saving an exact company status
- deleting a company entry
- updating the default unspecified status
- rejecting `"x"` as a default unspecified status

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/shared/storage.test.ts`
Expected: FAIL because `storage.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**

Implement a small storage adapter around `chrome.storage.local` with a pluggable storage backend for tests.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/shared/storage.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Run:
```bash
git add src/shared/settings.ts src/shared/storage.ts tests/shared/storage.test.ts
git commit -m "feat: add shared settings storage"
```

### Task 4: Build the options page editor

**Files:**
- Create: `src/options/index.ts`
- Modify: `src/options/index.html`
- Modify: `src/options/styles.css`
- Test: `tests/options/index.test.ts`

- [ ] **Step 1: Write the failing test**

Write jsdom tests that cover:
- rendering saved companies and statuses
- adding a new exact company name
- changing an existing status
- removing an entry
- switching the default unspecified status
- preventing `"x"` from being used as the default unspecified status

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/options/index.test.ts`
Expected: FAIL because the options page script is not implemented.

- [ ] **Step 3: Write minimal implementation**

Implement the options page UI using the shared storage adapter and plain DOM updates.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/options/index.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Run:
```bash
git add src/options/index.html src/options/index.ts src/options/styles.css tests/options/index.test.ts
git commit -m "feat: add options page editor"
```

## Chunk 3: Content Script Filtering And Hover Controls

### Task 5: Implement card scanning and effective-status resolution

**Files:**
- Create: `src/content/index.ts`
- Create: `src/content/companyName.ts`
- Create: `src/content/cardState.ts`
- Test: `tests/content/card-state.test.ts`

- [ ] **Step 1: Write the failing test**

Write tests for:
- extracting company names from `[class^="CompanyNameWithLocationPeriod"]`
- safely skipping cards that do not contain the company-name element
- resolving explicit company status
- falling back to the default unspecified status
- mapping `x` to hidden state
- ensuring `Acme` does not match `Acme Labs`

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/content/card-state.test.ts`
Expected: FAIL because content helpers do not exist.

- [ ] **Step 3: Write minimal implementation**

Implement the pure helpers for company-name extraction and effective-state resolution.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/content/card-state.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Run:
```bash
git add src/content/cardState.ts src/content/companyName.ts src/content/index.ts tests/content/card-state.test.ts
git commit -m "feat: add card status resolution"
```

### Task 6: Implement hover overlay behavior

**Files:**
- Create: `src/content/overlay.ts`
- Modify: `src/content/index.ts`
- Test: `tests/content/overlay.test.ts`

- [ ] **Step 1: Write the failing test**

Write jsdom tests that cover:
- adding a `+ / - / x` overlay that is hidden until card hover state is active
- highlighting the effective state
- persisting the clicked state
- hiding the card immediately when `x` is clicked
- keeping the underlying card link/click target usable outside the overlay buttons
- re-applying the same card without duplicating overlay controls
- propagating a saved status change across two cards with the same exact company name

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/content/overlay.test.ts`
Expected: FAIL because overlay behavior is not implemented.

- [ ] **Step 3: Write minimal implementation**

Implement overlay rendering and state-change handling in the content script.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/content/overlay.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Run:
```bash
git add src/content/index.ts src/content/overlay.ts tests/content/overlay.test.ts
git commit -m "feat: add hover overlay controls"
```

### Task 7: Handle dynamic card updates and build output

**Files:**
- Modify: `src/content/index.ts`
- Modify: `src/manifest.json`
- Test: `tests/content/content-script.test.ts`
- Test: `tests/smoke/build-output.test.ts`

- [ ] **Step 1: Write the failing test**

Write tests for:
- processing cards on initial scan
- processing newly inserted cards through `MutationObserver`
- re-processing an already handled card without duplicating overlays or handlers
- emitting build output for the content script entry
- emitting and wiring the options-page script bundle

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/content/content-script.test.ts tests/smoke/build-output.test.ts`
Expected: FAIL because dynamic processing and final build wiring are incomplete.

- [ ] **Step 3: Write minimal implementation**

Finish the content script bootstrap, observer wiring, and manifest references to built assets.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/content/content-script.test.ts tests/smoke/build-output.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Run:
```bash
git add src/content/index.ts src/manifest.json tests/content/content-script.test.ts tests/smoke/build-output.test.ts
git commit -m "feat: complete wanted blacklist content script"
```

## Chunk 4: Final Verification

### Task 8: Run full verification

**Files:**
- Verify only

- [ ] **Step 1: Run unit and DOM tests**

Run: `pnpm test`
Expected: PASS with all tests green.

- [ ] **Step 2: Run production build**

Run: `pnpm build`
Expected: PASS with a complete `dist/` directory containing manifest, options assets, and bundled scripts.

- [ ] **Step 3: Verify requirements against the spec**

Check `/Users/jaeholee/work/wanted-blacklist/docs/superpowers/specs/2026-03-19-wanted-blacklist-design.md` line by line against the implementation and note any gaps before reporting completion.

- [ ] **Step 4: Commit**

Run:
```bash
git add .
git commit -m "feat: implement wanted blacklist extension"
```
