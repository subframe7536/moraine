# Separator Base UI Parity Plan

## Status

Audit complete; implementation not started. Audited from the working tree rooted at `3c02b36` on 2026-08-09.

## Goal

Align Separator role/orientation/decorative semantics, optional content structure, attribute precedence, reactivity, and SSR while preserving Moraine's styled comprehensive component.

## Local Surface

- Source: `src/elements/separator/separator.tsx`; public surface: `Separator`, `SeparatorProps`, and `SeparatorT`.
- Variants: `src/elements/separator/separator.class.ts`.
- Focused tests: `src/elements/separator/separator.test.tsx`.

## Upstream References

- Base UI pin `3011fba8f`: `base-ui/packages/react/src/separator/`, especially `Separator.tsx`, data attributes, and role test.
- Kobalte pin `2e8ce473`: `kobalte/packages/core/src/separator/`, especially native `hr` versus non-`hr` role behavior and orientation tests.
- Moraine always renders a comprehensive `div` with optional content; compare semantics without copying polymorphism or upstream styling.

## Audit and Implementation

1. **Keyboard and focus:** Separator and its border/content wrappers must remain non-focusable and add no keyboard behavior; interactive children are a boundary case and should retain their own focus only if the current API intentionally permits them.
2. **ARIA and disabled semantics:** verify role, horizontal implicit/explicit orientation, vertical `aria-orientation`, decorative `aria-hidden`, caller attribute precedence, data orientation, and whether labeled content affects naming. Do not invent disabled state.
3. **Pointer and touch:** remain passive with no internal event cancellation; border segments must not become hit targets.
4. **Controlled and nested composition:** audit reactive orientation/decorative/content, nesting in labeled regions, repeated separators, and slot override propagation while preserving child identity.
5. **SSR and platform behavior:** root role/orientation, border count, optional content, and attributes must match through hydration; native `hr` differences are recorded as intentional because the public root is fixed.
6. **Empty and boundary states:** cover no children, falsy/zero/empty-string content, vertical separator with content, decorative plus labeling attributes, caller role/orientation overrides, and reactive content/orientation changes.
7. Add a failing regression before the smallest semantic fix and classify direct upstream matches and deliberate root differences explicitly.

## Public API

Preserve `SeparatorProps`, fixed `div` root, decorative/orientation/content props, slots, sizes, and line types. Do not add polymorphism, switch to `hr`, copy styles, or change spacing in this pass.

## Test Plan

- Focused: `bun run test src/elements/separator/separator.test.tsx`.
- Validate types: `bun run typecheck`.
- Optional-content JSX changes require getter-backed single evaluation and `renderToString -> hydrate -> reactive content/orientation update` coverage.

## Completion Criteria

- Role, orientation, decorative mode, content, overrides, boundaries, and hydration have current-pin dispositions.
- Each fix has a regression and focused/type checks pass.
- Fixed-root/API and visual differences are documented rather than ported.

## Dependencies and Handoff

Separator is isolated; coordinate only if shared attribute-merging behavior changes. Preserve the direct Base UI/Kobalte mapping and record the fixed-`div` difference in the canonical matrix evidence.

## Verified Missing Features

1. **Horizontal orientation is not exposed.** `Separator` only writes `aria-orientation` for `vertical`; Base UI's fixed `div[role=separator]` writes it for both orientations and asserts both values in `Separator.test.tsx`. Priority P1, small, low risk; owner: Separator.
2. **Numeric zero content is dropped.** `resolvedChildren` is passed to a truthy `<Show>`, so `0` is treated as absence even though it is valid JSX. Priority P1, small, medium SSR risk; owner: Separator.
3. **Reactive and hydration behavior is unprotected.** The focused suite has no orientation update, getter evaluation, or render-to-string/hydrate case. Priority P1 coverage gate, small; owner: Separator.

Decorative mode and Moraine's fixed `div` root are intentional local contracts. Kobalte's native `hr` default is evidence, not a requested API migration.

## Detailed Execution Plan

1. Add failing tests in `src/elements/separator/separator.test.tsx` for horizontal and vertical `aria-orientation`, reactive orientation changes, `children={0}`, caller attribute precedence, and exact getter reads.
2. Add `src/elements/separator/separator.ssr.fixture.tsx`; assert server markup equals hydrated structure and that the first interaction does not reorder reads.
3. In `src/elements/separator/separator.tsx`, always emit the normalized orientation and replace truthiness with an explicit JSX-presence predicate while retaining the existing cached accessor.
4. Record each audited dimension in `parity-matrix.md`, then run the focused suite, the SSR fixture test, `bun run typecheck`, and `git diff --check`.

## STOP Conditions

- Do not change decorative semantics, root polymorphism, classes, or layout.
- If the presence rule differs from the shared JSX-presence convention established by completed element plans, stop and route it to that convention instead of inventing a Separator-only rule.
