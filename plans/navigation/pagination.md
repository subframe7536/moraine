# Pagination Base UI Parity Plan

Status: Ready for hand-off — the pinned upstream audit is not complete; existing fixes and tests are baseline evidence only.

## Goal

Verify Pagination's page math, controlled state, native link/button interaction, announcements, and boundary semantics against the closest Solid reference while retaining the current compact Moraine API.

## Local Surface

- Implementation: src/navigation/pagination/pagination.tsx.
- Public export: src/navigation/pagination/index.ts.
- Focused tests: src/navigation/pagination/pagination.test.tsx.
- Component family: nav root, list/item wrappers, page links/buttons, previous/next controls, ellipsis, Button/Icon composition, and polite live region.

## Upstream References

- Base UI 3011fba8f: no direct Pagination counterpart; use native button/link behavior as supporting evidence only.
- Kobalte 2e8ce473: kobalte/packages/core/src/pagination/, especially pagination-root.tsx, pagination-item.tsx, pagination-previous.tsx, pagination-next.tsx, pagination-ellipsis.tsx, and pagination.test.tsx.
- Use pinned source/tests to decide behavior; do not copy Kobalte's compound API.

## Audit and Implementation

1. Map page count, resolved page, sibling/ellipsis ranges, controlled page, defaultPage, and callback transitions as total/itemsPerPage change.
2. Compare navigation naming, list structure, aria-current, per-target labels, live announcements, disabled anchors/buttons, and ellipsis hiding.
3. Verify native Tab/Enter/Space behavior and focus stability after page updates; do not add roving focus or arrow-key behavior without upstream evidence.
4. Audit pointer/touch activation, prevented events, controlled callback count/order, link versus button output, and disabled/boundary controls.
5. Cover zero/negative/invalid numeric inputs according to the documented local contract, first/last page, a single page, large sibling counts, reactive totals, and empty data.
6. Confirm there is no overlay, portal, nested-overlay, or dismissal state, and that Pagination remains safe inside overlays.
7. Verify deterministic SSR range output and hydration. If conditional page rendering changes, add getter single-evaluation and renderToString-to-hydrate activation coverage.
8. Mark routing or real-browser focus behavior that jsdom cannot establish as unverified-platform.

## Public API

- Preserve PaginationProps, PaginationT slots, page/defaultPage/onPageChange, page math inputs, to callback, labels/icons, and defaults.
- Do not adopt Kobalte compound primitives or change styling/visual layout.

## Test Plan

- Add focused page-math, controlled-state, keyboard, pointer, ARIA/live-region, and reactive-boundary regressions.
- Run: bun run test src/navigation/pagination/pagination.test.tsx
- Run Button regressions if link/button composition changes, then bun run typecheck.

## Completion Criteria

- Page ranges and callbacks are deterministic across controlled, uncontrolled, reactive, and boundary states.
- Link/button keyboard, pointer/touch, focus, disabled, ARIA, and announcement behavior is classified.
- parity-matrix.md records pinned evidence, outcomes, and tests with no unclassified gap.

## Dependencies and Handoff

- Complete shared controllable-state and Button audits first if implementation moves to shared behavior.
- Respect the global foundation order shared hooks, Modal, Popper, Menu, then consumers; this plan must not modify unrelated overlay foundations.
- Historical local fixes are baseline only, not completion against the pinned revisions.
