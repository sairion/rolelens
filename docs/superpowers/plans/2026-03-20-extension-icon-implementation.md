# Extension Icon Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a monochrome outlined extension icon set, package it in build output, and wire it into the Chrome extension manifest.

**Architecture:** A single source SVG defines the icon geometry, PNG exports provide the Chrome-required raster assets, and the existing build script copies those assets into `dist/icons/`. The manifest references the packaged files for both extension metadata and toolbar action icons.

**Tech Stack:** TypeScript, Vitest, Node.js build script, SVG and PNG static assets

---

## Chunk 1: Icon Packaging

### Task 1: Lock the required packaging behavior with tests

**Files:**
- Modify: `tests/smoke/build-artifacts.test.ts`
- Test: `tests/smoke/build-artifacts.test.ts`

- [ ] **Step 1: Write the failing test**

Extend the existing build smoke test so it asserts:
- `dist/icons/icon-16.png`
- `dist/icons/icon-32.png`
- `dist/icons/icon-48.png`
- `dist/icons/icon-128.png`
- `manifest.icons` maps `16`, `32`, `48`, and `128`
- `manifest.action.default_icon` maps `16`, `32`, and `48`

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/smoke/build-artifacts.test.ts`
Expected: FAIL because the icon files and manifest icon mappings do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create `src/icons/icon.svg`, export the PNG assets, update `src/manifest.json`, and update `scripts/build.mjs` to copy `src/icons/*` into `dist/icons/` without silently skipping missing required files.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/smoke/build-artifacts.test.ts`
Expected: PASS

- [ ] **Step 5: Run the full verification set**

Run: `pnpm test`
Run: `pnpm build`
Expected: all tests pass and the production build completes with icon assets in `dist/icons/`.
