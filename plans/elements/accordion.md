# Accordion Base UI Parity Plan

## Status

Complete.

## Goal

Bring Moraine's data-driven `Accordion` to behavioral parity for disclosure state, keyboard navigation, focus, accessibility, transitions, and edge cases while retaining its comprehensive SolidJS API.

## Local Surface

- Source: `src/elements/accordion/accordion.tsx`; public surface: `Accordion`, `AccordionProps`, and `AccordionT` (`Item`, slots, variants, classes, styles).
- Focused tests: `src/elements/accordion/accordion.test.tsx`.
- Shared behavior: `src/shared/use-controllable-value.ts`, `src/shared/use-disclosure-state.ts`, `src/shared/use-transition-presence.ts`, and `src/shared/utils.ts` (`useId`).
- Direct composed dependency: `src/elements/icon/icon.tsx`.

## Upstream References

- Base UI pin `3011fba8f`: `base-ui/packages/react/src/accordion/`, especially `root/`, `item/`, `trigger/`, and `panel/` source and tests.
- Kobalte pin `2e8ce473`: `kobalte/packages/core/src/accordion/`, including `accordion-root.tsx`, item/trigger/content modules, and `accordion.test.tsx`.
- Use Base UI for current browser and transition edge-case evidence and Kobalte for Solid ownership/reactivity patterns. Do not copy either primitive API into Moraine.

## Audit and Implementation

1. **Keyboard and focus:** verify Enter/Space activation, ArrowUp/ArrowDown/Home/End movement, disabled-item skipping, natural Tab order, and `loopFocus` boundaries. Confirm focus remains on a valid trigger after reactive item removal, reorder, disablement, and nested accordions.
2. **ARIA and disabled semantics:** verify heading/trigger/panel roles, stable unique `id`, `aria-expanded`, `aria-controls`, and `aria-labelledby` relationships through mount/unmount and exit transitions. Compare root-disabled and item-disabled behavior and state attributes with upstream evidence.
3. **Pointer and touch:** verify one state change per press/click, respect consumer `preventDefault`, and ensure disabled triggers cannot activate through synthetic click, pointer, or touch-derived click paths.
4. **Controlled and nested state:** exercise single/multiple, controlled/uncontrolled, `collapsible`, controlled values absent from `items`, duplicate or generated values, reactive item changes, and nested accordions. Callbacks must be deduplicated and ordered without mutating controlled UI state.
5. **SSR and platform behavior:** audit deterministic ids, initial open markup, transition measurement without `document` access during SSR, interrupted close/reopen, zero-height content, reduced motion, and browser transition events. Mark device/browser behavior not demonstrable in jsdom as `unverified-platform`.
6. **Empty and boundary states:** cover no items, all items disabled, no enabled focus target, empty content, last-open non-collapsible item, switching equal-height panels, and content removed during a transition.
7. Rank confirmed gaps by user impact and regression risk, add a failing regression first, then port the smallest equivalent logic. Record every reviewed behavior as `verified`, `ported`, `intentional-divergence`, or `unverified-platform` with exact upstream source/test evidence.

## Public API

Keep `AccordionProps`, `AccordionT.Item`, callback shapes, item-array rendering, slots, and defaults stable. Do not import Base UI/Kobalte compound-part APIs or any styling, spacing, animation design, or polymorphism. Any unavoidable public change requires a separate plan amendment and migration note.

## Test Plan

- Focused: `bun run test src/elements/accordion/accordion.test.tsx`.
- Shared regressions when touched: `bun run test src/shared/use-transition-presence.test.tsx` plus the focused accordion test; add focused tests for shared disclosure/controllable helpers if those files gain coverage.
- Validate types: `bun run typecheck`.
- If conditional JSX changes, add getter-backed single-evaluation tests and a `renderToString -> hydrate -> interact` gate proving identical server/client order and that closed content is not instantiated unexpectedly.

## Completion Criteria

- Every parity dimension above has current-pin evidence and a recorded disposition; history alone does not close an item.
- Each ported gap has an explicit DOM/ARIA/focus/value/callback regression test, and all focused/type checks pass.
- No styling or upstream API-shape work is included, and remaining platform-only uncertainty is explicitly labeled.

## Dependencies and Handoff

Complete or coordinate the shared controllable-value, disclosure, presence, and id audits before changing shared code. Do not let concurrent component tasks edit those shared modules. Update the canonical parity matrix for this target after the audit; only the matrix owner may mark the parent `todo.md` item complete after every target is classified.
