# Button Base UI Parity Plan

## Status

Planned. The local suite already covers many polymorphic cases, but every behavior must be rechecked against Base UI `3011fba8f` and Kobalte `2e8ce473`.

## Goal

Align native and non-native Button activation, focusability, disabled/loading behavior, async handling, and cross-platform event semantics without changing Moraine's public styling or comprehensive API.

## Local Surface

- Source: `src/elements/button/button.tsx`; public surface: generic `Button`, `ButtonProps`, and `ButtonT`.
- Variants and group inheritance: `src/elements/button/button.class.ts` and `src/elements/button/button-group-context.ts`.
- Loading behavior: `src/shared/use-loading-auto.ts`.
- Focused tests: `src/elements/button/button.test.tsx`.
- Representative consumers: `src/forms/input-number/input-number.tsx`, `src/navigation/pagination/pagination.tsx`, `src/navigation/breadcrumb/breadcrumb.tsx`, and overlay/form trigger tests.

## Upstream References

- Base UI pin `3011fba8f`: `base-ui/packages/react/src/button/`, especially custom-link/custom-element keyboard activation, modifier propagation, disabled versus `nativeButton` behavior, and focus retention tests.
- Kobalte pin `2e8ce473`: `kobalte/packages/core/src/button/`, especially `is-button.ts`, role/type/tabindex rules, and disabled data/ARIA tests.
- Compare source and tests, then implement in Solid event semantics; do not copy Base UI's render/nativeButton API.

## Audit and Implementation

1. **Keyboard and focus:** verify native button behavior; Enter and Space timing for `div`, anchor without `href`, custom components, and router links; modifier keys; no page scroll on Space; real click dispatch; consumer `preventDefault`; focus before/after disabled or loading transitions; and tab order for native/non-native roots.
2. **ARIA and disabled semantics:** verify `type`, `role`, `tabIndex`, native `disabled`, non-native `aria-disabled`, `data-disabled`, `aria-busy`, and loading exposure for button/input/anchor/custom roots. Decide focusable-disabled behavior from Moraine's contract and record any upstream divergence explicitly.
3. **Pointer and touch:** compare click, pointerdown/up/cancel/leave, context-menu, event propagation, and synthetic click blocking. User handlers must run in the documented order and must not produce duplicate async activation from touch or keyboard.
4. **Controlled and nested composition:** audit reactive `as`, href, group defaults/overrides, loading/loadingAuto, sync/async/throwing/rejecting handlers, rapid repeat activation, unmount while pending, and Button used in forms, groups, and overlay triggers. Loading must settle without stale promises overwriting controlled state.
5. **SSR and platform behavior:** verify polymorphic tag and attributes are deterministic at hydration; component/JSX children are evaluated once; browser native activation differences and router links are classified; real-browser-only focus/click cases are `unverified-platform` unless directly proven.
6. **Empty, error, and boundary states:** cover falsy children, icon-only accessible naming, no href versus empty href, unsupported `type`, disabled+loading, handler `preventDefault`, thrown/rejected promises, and root changes while loading.
7. Add failing tests before the smallest behavioral port. Record exact upstream source/test evidence and a disposition for every audited branch.

## Public API

Preserve generic `ButtonProps`, `as`, loading props, render children, slots, group inheritance, and current variants. Do not copy Base UI `render`/`nativeButton`, Kobalte polymorphic internals, or any styles. A behaviorally necessary API change requires a separate migration decision.

## Test Plan

- Focused: `bun run test src/elements/button/button.test.tsx`.
- Group composition: `bun run test src/elements/button/button-group.test.tsx src/elements/button/button.test.tsx`.
- Representative consumers: `bun run test src/forms/input-number/input-number.test.tsx src/navigation/pagination/pagination.test.tsx src/navigation/breadcrumb/breadcrumb.test.tsx`.
- Loading helper when touched: `bun run test src/elements/button/button.test.tsx`; add a dedicated shared helper test if logic moves into `use-loading-auto.ts`.
- Validate types: `bun run typecheck`.
- If conditional child/icon JSX changes, enforce getter-backed single evaluation plus a `renderToString -> hydrate -> keyboard/pointer activate` gate.

## Completion Criteria

- Native, anchor, custom, router, disabled, loading, async, focus, and event-order paths have current-pin dispositions.
- Each confirmed gap is regression-tested and focused consumer/type checks pass.
- Platform uncertainty is explicit and no styling/API-shape port is included.

## Dependencies and Handoff

Coordinate ownership with `button-group`, `badge` trailing controls, `use-loading-auto`, and consumers before touching shared behavior. Button is a high-fan-out dependency: land its focused change and consumer smoke tests before downstream plans rely on it.
