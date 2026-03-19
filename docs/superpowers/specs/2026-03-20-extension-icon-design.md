# Wanted Blacklist Extension Icon Design

**Goal:** Add a simple monochrome Chrome extension icon set that communicates company sorting and hide/show controls at toolbar sizes.

## Context

The extension currently has no icon assets configured in the manifest. The product language in the options page favors clean shapes, rounded corners, and restrained contrast rather than illustrative branding. The icon should therefore stay monochrome, outline-based, and legible at very small sizes.

## Design Summary

The icon will use a compact "container plus status controls" composition:

- A tray-like outline forms the base shape.
- A stronger horizontal rim line defines the opening of the tray.
- Three status symbols sit close to the rim rather than floating far away:
  - `+` on the upper-left
  - `-` at the upper center
  - `x` on the upper-right

This is the approved "integrated" direction: the symbols remain visible as separate marks, but the total silhouette stays tight enough to read at toolbar sizes.

## Visual Language

- Monochrome only
- Outline-first construction
- Rounded line caps and joins
- Mildly softened geometry rather than sharp corners
- No shadows, fills, gradients, or decorative detail

The icon should feel utility-first and systematic, not mascot-like.

## Size Strategy

One SVG source will define the canonical drawing, and the PNG exports will be direct rasterizations of that same geometry for Chrome icon slots. There will be no size-specific redraw variants in this task.

### 16px

- Prioritize the tray silhouette and rim line.
- Keep the three symbols close to the tray opening.
- Use simplified spacing so the overall mark reads as one icon instead of four detached parts.

### 32px and 48px

- Preserve the same structure.
- Preserve the exact same geometry as the SVG source.
- Keep stroke weight visually consistent by exporting from the shared source rather than redrawing per size.

### 128px

- Preserve the same geometry.
- No extra ornamentation; larger size is for clarity, not added detail.

## Integration Constraint

The "integrated" direction is not optional decoration. The three symbols must read as attached to the tray opening rather than floating independently above it.

- The symbols sit inside the tray's upper visual envelope.
- The vertical gap between the rim line and each symbol must stay within roughly one stroke width in the source drawing.
- The total silhouette should read as a single compact mark before the viewer notices the three individual controls.
- The symbols remain individually recognizable, but the icon must fail toward "compact tray with status marks" rather than "tray plus three separate badges."

## File Structure

Create and update the following paths:

- Create `src/icons/icon.svg` as the editable source asset.
- Create `src/icons/icon-16.png`
- Create `src/icons/icon-32.png`
- Create `src/icons/icon-48.png`
- Create `src/icons/icon-128.png`
- Modify `src/manifest.json` to declare extension icons and action icons.
- Modify `scripts/build.mjs` to copy icon assets into `dist/`.

## Manifest Mapping

`src/manifest.json` should declare:

- `icons` with explicit mappings for `16`, `32`, `48`, and `128`
- `action.default_icon` with explicit mappings for `16`, `32`, and `48`

All manifest paths should point to `icons/<filename>` inside the packaged extension.

## Behavior And Data Flow

There is no runtime logic change. The work is limited to packaging and manifest metadata:

1. Source icon files live under `src/icons/`.
2. Build copies them into `dist/icons/`.
3. Manifest points Chrome to those packaged assets.

## Error Handling

- The icon files referenced by the manifest are required inputs, not optional extras.
- Build should fail fast if any required icon asset is missing.
- Asset copying should follow the existing build structure, but the icon copy path must not silently skip missing files.
- No fallback generation is needed in the build script.

## Testing And Verification

- Run `pnpm build` and confirm icon assets appear in `dist/icons/`.
- Inspect the built `dist/manifest.json` and confirm the icon declarations are present.
- Sanity-check the exported PNG dimensions from the generated files on disk.

## Non-Goals

- No multicolor branding system
- No animated icon states
- No badge text or dynamic icon switching
- No redesign of the options page or overlay controls
