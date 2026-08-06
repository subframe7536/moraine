# Separator Base UI Parity Plan

## Status

Planned. Current semantics and variant tests require a fresh comparison with the pinned Base UI and Kobalte native-element decisions.

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
