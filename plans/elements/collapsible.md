# Collapsible Base UI Parity Plan

## Status

Planned. Existing open/controlled/transition tests are substantial but do not replace a current-pin review of Base UI's transition and browser edge cases.

## Goal

Align Collapsible trigger semantics, controlled disclosure state, disabled behavior, panel lifecycle, transition interruption, and SSR hydration while keeping Moraine's render-prop contract.

## Local Surface

- Source: `src/elements/collapsible/collapsible.tsx`; public surface: `Collapsible`, `CollapsibleProps`, and `CollapsibleT`, including `TriggerRenderProps` and `TriggerProps`.
- Focused tests: `src/elements/collapsible/collapsible.test.tsx`.
- Shared behavior: `src/shared/render-prop.ts`, `src/shared/use-controllable-value.ts`, `src/shared/use-disclosure-state.ts`, `src/shared/use-transition-presence.ts`, and `src/shared/utils.ts` (`useId`).

## Upstream References

- Base UI pin `3011fba8f`: `base-ui/packages/react/src/collapsible/`, especially root registration, disabled/cancelable state tests, panel measurement, interrupted transitions/keyframes, zero-size exit, `beforematch`, and `hidden="until-found"` cases.
- Kobalte pin `2e8ce473`: `kobalte/packages/core/src/collapsible/`, especially controlled/uncontrolled trigger behavior and Solid context/state ownership.
- Base UI features absent from the local API are audit evidence, not automatic feature requests.

## Audit and Implementation

1. **Keyboard and focus:** verify native trigger Enter/Space behavior, custom trigger behavior only through spread `triggerProps`, consumer cancellation, disabled activation, and stable focus when content mounts/unmounts or a custom trigger changes.
2. **ARIA and disabled semantics:** verify deterministic root/trigger/content ids, `aria-expanded`, open-only versus persistent `aria-controls` according to the local contract, `aria-labelledby`, native `disabled`, and state data attributes through transition exit/remount.
3. **Pointer and touch:** verify click ordering, one toggle per pointer/touch-derived click, `defaultPrevented`, disabled suppression, and no accidental toggle from interactive descendants of a custom trigger.
4. **Controlled and nested state:** audit controlled/uncontrolled transitions, callback deduplication/order, open/close/toggle render controls, reactive disabled, nested Collapsibles, trigger replacement, and external controlled updates during closing. Controlled requests must not self-mutate.
5. **SSR and platform behavior:** compare initially open/closed markup, hydration ids, height measurement, zero-size content, transitionend/cancel filtering, interrupted close/reopen, initial-animation suppression, reduced motion, and content removal mid-transition. Evaluate `beforematch`/until-found only as a documented divergence unless the existing API can support it without expansion.
6. **Empty, error, and boundary states:** cover empty content, static/falsy/function trigger forms, trigger renderer that fails to spread props, rapid toggles, transition false/true, unmount during animation, and no measurable element.
7. Add failing regressions before the smallest equivalent port; classify every upstream behavior and explicitly retain unsupported platform features as intentional divergence or unverified platform work.

## Public API

Preserve `CollapsibleProps`, required `triggerRender`, flattened render controls, `triggerProps`, transition default, slots, and callbacks. Do not copy Base UI compound parts, event-details cancellation API, `keepMounted`, `hiddenUntilFound`, or styles unless a separate API decision approves them.

## Test Plan

- Focused: `bun run test src/elements/collapsible/collapsible.test.tsx`.
- Shared transition regression: `bun run test src/shared/use-transition-presence.test.tsx src/elements/collapsible/collapsible.test.tsx`.
- Shared render-prop regression when touched: `bun run test src/shared/render-prop.test.tsx src/elements/collapsible/collapsible.test.tsx`.
- Validate types: `bun run typecheck`.
- Any conditional trigger/content JSX change requires getter-backed single-evaluation tests plus `renderToString -> hydrate -> open/close/reopen` coverage proving identical hydration order and no closed-content instantiation when transition is off.

## Completion Criteria

- Trigger, state, ARIA, disabled, nested, transition-interruption, SSR, and platform cases have current-pin dispositions.
- Each ported gap is covered and focused/shared/type checks pass.
- Unsupported upstream APIs and platform behavior are explicit rather than silently omitted.

## Dependencies and Handoff

Coordinate with Accordion and the shared controllable/disclosure/presence audits. A single owner must make any shared-hook change, then both disclosure consumers rerun their suites before downstream work proceeds.
