# CommandPalette Base UI / Kobalte Parity Plan

## Status

Implementation complete on 2026-08-12 against Base UI `3011fba8f` and Kobalte `2e8ce473`.

## Goal

Audit CommandPalette's observable search/listbox behavior against mature menu,
listbox, and search patterns while preserving Moraine's command-data API.

## Local Surface

- Implementation: `src/navigation/command-palette/command-palette.tsx`.
- Focused tests: `src/navigation/command-palette/command-palette.test.tsx`.
- Shared dependencies: selectable collection navigation, list virtualization,
  controllable state, and overlay composition when hosted in a dialog.

## Upstream References

- Base UI `menu`: pointer selection, keyboard navigation, cancellation, disabled
  items, and typeahead/listbox interaction patterns.
- Kobalte `listbox` and `search`: Solid collection ownership, active descendant,
  selection, dynamic data, and reactive filtering patterns.
- These are behavior references only; neither upstream exposes Moraine's exact
  CommandPalette component or public API.

## Audit and Implementation

1. Verify Arrow/Home/End/Enter keyboard behavior, disabled skipping, active
   descendant ownership, and focus remaining on the search input.
2. Verify mouse pointer-down preserves input focus while touch and pen retain
   native tap/click synthesis; canceled consumer handlers must remain canceled.
3. Verify roles, labels, `aria-activedescendant`, option state, virtual set
   position metadata, empty/loading states, and stable IDs.
4. Verify controlled query/active state, exact callback counts, dynamic
   insertion/removal/reordering, filtered groups, and duplicate or missing keys.
5. Verify virtualized rendering and scroll-to-active behavior using deterministic
   geometry; real layout and assistive-technology ordering remain platform proof.
6. Verify SSR output and hydration order without broadening the public surface or
   evaluating JSX content more than once.

## Public API and Non-goals

- Preserve Moraine's item/group/render/virtualization API and styling contract.
- Do not port Base UI compound APIs, Kobalte collection APIs, upstream DOM shape,
  styles, spacing, animation, or unrelated overlay behavior.
- This plan does not add parity obligations for `sidebar-frame`, `stepper`, or
  any other component without its own audit plan.

## Test Plan

- Add regressions for mouse, touch, pen, canceled pointer events, and single
  activation, plus any confirmed keyboard/ARIA/dynamic/SSR gaps.
- Run `bun run test src/navigation/command-palette/command-palette.test.tsx` and
  affected shared navigation suites, then repository-wide validation.

## Completion Criteria

- Every audited behavior is classified in `parity-matrix.md` with pinned upstream
  evidence and local regression evidence.
- Compatible gaps are fixed without API or visual scope creep.
- Browser/device-only claims remain `unverified-platform`; they are not inferred
  from jsdom.
