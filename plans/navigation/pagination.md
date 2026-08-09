# Pagination Base UI Parity Plan

Status: Audit complete; implementation not started. Audited from the working tree rooted at `3c02b36` on 2026-08-09.

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

## Verified Missing Features

1. **Non-finite numeric props escape normalization.** `Infinity` total can produce an infinite page count and an `Infinity` page item; infinite sibling counts can request impractically large ranges. Priority P0, small; owner: Pagination.
2. **Reactive page-domain transitions are not specified.** `resolvedPage` clamps for rendering but the uncontrolled requested page is retained when page count shrinks, so expanding the count later can jump back to the stale page. Kobalte retains a clamped view similarly, so Moraine must explicitly choose and test this behavior. Priority P1 decision, small; owner: Pagination.
3. **Link/button focus and hydration are unprotected.** Boundary controls can switch between anchor and button as page/total changes, but no test covers focus preservation, caller-cancelled clicks, exact `to` calls, or SSR/hydration. Priority P1, medium; owner: Pagination plus Button smoke coverage.

Kobalte's `count`, fixed-items, and compound component props are intentional API divergences.

## Detailed Execution Plan

1. Add a numeric normalization table for `NaN`, infinities, negatives, fractions, zero, and very large finite values across total, itemsPerPage, siblingCount, page, and defaultPage. Require finite bounded output and no array-allocation exception.
2. Decide stale-request behavior on page-count shrink before code. Test shrink/expand in controlled and uncontrolled modes, callback counts, and whether normalization emits or remains a derived view.
3. Add link/button transition tests with focused prev/current/next controls, prevented clicks, current-page no-op, `to` invocation count, `rel`, and disabled boundaries.
4. Add SSR/hydration tests for single-page, ellipsis, link mode, and a reactive first navigation; assert stable list structure and live-region text.
5. Update `parity-matrix.md`; run Pagination, Button, SSR, typecheck, and diff checks.

## STOP Conditions

- Do not add arrow-key/roving focus or Kobalte range APIs without upstream and Moraine-contract evidence.
- If a maximum renderable page count is needed for hostile inputs, stop and document the limit rather than hiding it in styles.
