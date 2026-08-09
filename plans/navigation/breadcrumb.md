# Breadcrumb Base UI Parity Plan

Status: Audit complete; implementation not started. Audited from the working tree rooted at `3c02b36` on 2026-08-09.

## Goal

Verify that Breadcrumb exposes predictable native navigation, current-page, disabled, renderer, and boundary behavior while preserving Moraine's single comprehensive component API.

## Local Surface

- Implementation and classes: src/navigation/breadcrumb/breadcrumb.tsx and breadcrumb.class.ts.
- Public export: src/navigation/breadcrumb/index.ts.
- Focused tests: src/navigation/breadcrumb/breadcrumb.test.tsx.
- Component family: Breadcrumb root, ordered list, item, Button-backed link, leading icon, label, separator, and itemRender composition.

## Upstream References

- Base UI 3011fba8f: no direct Breadcrumb counterpart; use native link/button behavior and neighboring Base UI link semantics only as supporting evidence.
- Kobalte 2e8ce473: kobalte/packages/core/src/breadcrumbs/, especially breadcrumbs-root.tsx, breadcrumbs-link.tsx, breadcrumbs-separator.tsx, and breadcrumbs.test.tsx.
- Prefer pinned source and tests over docs; absence of a Base UI component is not permission to invent a new primitive.

## Audit and Implementation

1. Compare nav/ol/li structure, accessible naming, separator hiding, current-page selection, link versus non-link output, and disabled semantics.
2. Verify native keyboard order and focus behavior for anchors, Button composition, custom itemRender output, router links, and empty/single-item trails; do not add roving focus.
3. Audit pointer/touch activation, disabled/current item suppression, user onClick ordering, and whether a prevented event remains prevented through Button or custom renderers.
4. Exercise reactive item replacement, multiple explicit active items, missing labels/destinations, wrapping boundaries, and forwarded root ARIA/DOM props.
5. Confirm Breadcrumb has no overlay, portal, nested-overlay, or dismissal state of its own and remains inert when rendered inside an overlay.
6. Verify deterministic SSR markup and hydration for default IDs/labels and render props. If conditional JSX or itemRender handling changes, add getter single-evaluation and renderToString-to-hydrate interaction coverage.
7. Record browser/router behavior that jsdom cannot prove as unverified-platform rather than changing semantics speculatively.

## Public API

- Preserve BreadcrumbProps, BreadcrumbT members, item fields, slots, defaults, and itemRender contract.
- Do not port upstream primitive APIs, polymorphism, styling, spacing, or visual behavior.

## Test Plan

- Add one focused regression per confirmed semantic, event-order, renderer, hydration, or boundary gap.
- Run: bun run test src/navigation/breadcrumb/breadcrumb.test.tsx
- Run Button and router-composition regressions when their behavior is touched, then bun run typecheck.

## Completion Criteria

- Native keyboard/focus, ARIA, pointer/touch, disabled/current, and renderer behavior is classified against pinned evidence.
- Empty, single, custom-rendered, router-rendered, and reactive item cases are covered without introducing overlay state.
- parity-matrix.md records verified, ported, intentional-divergence, or unverified-platform with local tests.

## Dependencies and Handoff

- Complete shared render-prop and relevant shared-hook audits first; the global overlay order remains shared hooks, Modal, Popper, then Menu before overlay consumers.
- No Modal, Popper, or Menu change should be made from this plan. Report any Button or shared renderer defect to its single owner.
- Historical Moraine fixes do not substitute for auditing Base UI 3011fba8f and Kobalte 2e8ce473 now.

## Verified Missing Features

1. **`itemRender` can be evaluated more than once.** It is read to choose the `<Show>` branch and read again by `renderComponentOrElement`; getter-backed renderers can observe different values and reorder SSR reads. Priority P0, small, high SSR risk; owner: Breadcrumb.
2. **Reactive collection/current-page behavior is unprotected.** The suite does not cover item insertion/removal, an active value disappearing, multiple explicit active items, or generated-current fallback changes. Priority P1 coverage, medium; owner: Breadcrumb.
3. **Zero-valued JSX labels have no presence/hydration contract.** Priority P1 coverage, small; owner: Breadcrumb.

Kobalte's compound Root/Link/Separator API and consumer-owned custom-renderer semantics are intentional divergences; Moraine should not inject attributes into an opaque renderer result.

## Detailed Execution Plan

1. Add a getter-backed `itemRender` regression that records each read and renderer call for default, active, disabled, and separator branches.
2. Resolve `itemRender` once at the item owner, then branch/render from the cached value without instantiating the inactive fallback.
3. Add reactive array tests for insert, remove, reorder, empty list, missing active value, multiple active flags, and last-item fallback; assert one `aria-current=page` according to the documented precedence.
4. Define zero/empty/boolean label presence consistently and add render-to-string/hydrate coverage with the first link activation.
5. Update `parity-matrix.md`; run Breadcrumb, Button, SSR, typecheck, and diff checks.

## STOP Conditions

- Do not adopt Kobalte compound primitives or mutate the DOM returned by `itemRender`.
- Routing transitions and browser history remain application-owned; mark only real-engine focus/navigation proof `unverified-platform`.
