# RoleLens Extension Design

## Summary

Build a Chrome extension that works only on `wanted.co.kr` and lets users control job-card visibility and interest level by exact company name.

The extension supports two management surfaces:

- An in-page hover overlay on each job card with `+`, `-`, and `x` actions
- An options page for bulk editing saved company names and statuses

The extension removes cards when the company status is `x`. Companies without an explicit saved status inherit a configurable default status. The initial default is `+`, and users can change it to `-`.

## Goals

- Let users save exact company-name preferences for job cards on `wanted.co.kr`
- Hide cards immediately when a company is marked `x`
- Show lightweight in-page controls so users can classify companies without leaving the listing page
- Provide an options page for editing the saved list and the default unspecified status
- Restrict all runtime behavior to `wanted.co.kr`

## Non-Goals

- Fuzzy matching, substring matching, or normalized alias matching
- Support for sites other than `wanted.co.kr`
- Ranking, sorting, or reordering job cards
- Syncing data to any external backend

## Constraints

- Use the selector `[data-cy="job-card"]` to identify job cards
- Use the selector `[class^="CompanyNameWithLocationPeriod"]` inside each card to read the company name
- Match company names by exact text equality
- Treat `x` as an immediate hide action and persist it at click time

## User Experience

### In-Page Overlay

When the user hovers a job card, the extension shows a small overlay with three actions:

- `+` for high interest
- `-` for low interest
- `x` for hide

The currently effective state is visually highlighted in the overlay. Clicking any action saves the selected state for that exact company name immediately.

If the user clicks `x`, the current card disappears at once and future cards for the same company are hidden as well.

### Default Status

If a company has no explicit saved status, the extension treats it as the configured default unspecified status.

The initial default is `+`. Users can change the default to `-` in the options page.

### Options Page

The options page allows users to:

- Add a new exact company name and assign its status
- View all saved company names and their current statuses
- Change a saved company status
- Remove a saved company entry
- Change the default unspecified status between `+` and `-`

## Architecture

### Manifest

Use Chrome Extension Manifest V3.

Key parts:

- A content script that runs only on `wanted.co.kr`
- An options page for data editing
- Shared storage access through `chrome.storage`

No background service worker is required for the current scope.

### Modules

#### Content Script

Responsibilities:

- Scan the page for job cards
- Extract company names from each card
- Resolve the effective status for each card
- Hide cards whose status is `x`
- Attach and manage the hover overlay
- React to dynamic page updates through DOM observation

#### Storage Module

Responsibilities:

- Load the persisted preference model
- Save status changes by exact company name
- Save and read the default unspecified status
- Expose a small shared API usable by both the content script and the options page

#### Options Page

Responsibilities:

- Provide an input path for adding a new exact company name with a chosen status
- Render the saved company list
- Let the user edit per-company status
- Let the user remove entries
- Let the user change the default unspecified status

## Data Model

Persist the user state as:

```ts
type CompanyStatus = "+" | "-" | "x";

type ExtensionSettings = {
  companies: Record<string, CompanyStatus>;
  defaultUnspecifiedStatus: "+" | "-";
};
```

Semantics:

- `companies` stores explicit per-company overrides by exact company name
- `defaultUnspecifiedStatus` determines the effective state for companies not present in `companies`
- Initial value of `defaultUnspecifiedStatus` is `+`

## Matching Rules

- Read the visible company name from the job card selector
- Compare company names by exact string equality
- Do not apply fuzzy matching, legal-suffix normalization, or partial matching

Minor trimming of extracted text is acceptable only to handle DOM whitespace, not to broaden matching behavior.

## Runtime Flow

1. The content script loads persisted settings
2. It scans all current `[data-cy="job-card"]` elements
3. For each card, it extracts the company name from `[class^="CompanyNameWithLocationPeriod"]`
4. It computes the effective status:
   - Use explicit saved status when present
   - Otherwise use `defaultUnspecifiedStatus`
5. It applies the state:
   - `x`: hide the card immediately
   - `+` or `-`: leave the card visible
6. It attaches hover controls so the user can change the state in place
7. On overlay action click, it updates storage and re-applies the state immediately
8. A `MutationObserver` watches for newly added cards and processes them the same way

## DOM Behavior

### Card Visibility

Cards marked `x` should be removed from the user’s current view immediately after classification. The simplest acceptable implementation is to hide them with inline style or a dedicated CSS class.

### Overlay Placement

The overlay should be attached within the card bounds and appear only on hover. It should not break clickability or layout of the underlying card.

### State Highlighting

The effective state should be reflected in the overlay, including inherited default state for companies without an explicit saved entry.

## Error Handling

- If a card does not contain the expected company-name element, skip it safely
- If storage read fails, fall back to default settings in memory for the current pass
- If duplicate cards exist for the same company, they share one saved status
- If the DOM re-renders cards, the observer should re-apply rules without requiring manual refresh

## Testing Strategy

### Unit Tests

Test pure logic for:

- Resolving effective status from explicit settings plus default
- Updating the company-status map
- Removing company entries

### DOM Tests

Test DOM behavior for:

- Extracting company names from the expected selectors
- Rendering the hover overlay on processed cards
- Highlighting the current effective state
- Hiding the card immediately when `x` is selected
- Applying the configured default unspecified status
- Re-processing cards added after initial load

## Implementation Notes

- Keep the shared storage API narrow and testable
- Keep the content script focused on DOM integration rather than storage details
- Favor idempotent card processing so repeated scans or mutation callbacks do not duplicate overlays
- Avoid unnecessary architecture such as a background worker until new requirements justify it

## Open Questions Resolved

- Management surface: both in-page hover UI and options page are in scope
- Default unspecified status: initial default is `+`, user-configurable to `-`
- Matching behavior: exact company-name equality only
- Hide behavior: selecting `x` hides the current card immediately and persists the company state
- Overlay behavior: show `+`, `-`, and `x` on card hover and highlight the current state
