# Badge Base UI Parity Plan

## Status

Complete.

## Goal

Harden Badge semantics and its optional trailing action, especially when used as a removable MultiSelect tag, while retaining Moraine's compact comprehensive component.

## Local Surface

- Source: `src/elements/badge/badge.tsx`; public surface: `Badge`, `BadgeProps`, and `BadgeT` including the currently declared `TrailingButtonProps` type.
- Variants: `src/elements/badge/badge.class.ts`.
- Focused tests: `src/elements/badge/badge.test.tsx`.
- Internal action/icon foundations: `src/elements/icon/icon-button-inner.tsx` and `src/elements/icon/icon.tsx`.
- Primary consumer: `src/forms/select/multi-select.tsx` with `src/forms/select/multi-select.test.tsx`.

## Upstream References

- Base UI pin `3011fba8f`: no direct Badge counterpart. Use `base-ui/packages/react/src/button/` only for the optional trailing button's activation/disabled evidence.
- Kobalte pin `2e8ce473`: `kobalte/packages/core/src/badge/`, especially accessible naming tests; Kobalte has no equivalent removable trailing action.
- MultiSelect composition must also be checked against its own select parity plan; do not treat Badge as a selectable primitive.

## Audit and Implementation

1. **Keyboard and focus:** verify the trailing native button is reachable and activates once with Enter/Space, has a usable accessible name, and does not create a tab stop when no action exists. Confirm tag removal leaves focus at the MultiSelect input/trigger according to the consumer contract.
2. **ARIA and disabled semantics:** verify neutral badge text naming, decorative `aria-hidden`, root caller overrides, hidden icon semantics, and the removable control's label. Badge has no disabled state; any consumer-disabled behavior belongs to the consumer and must suppress the action predictably.
3. **Pointer and touch:** audit the root `pointerdown` prevention/propagation stop, consumer handler ordering, default-prevented behavior, one removal per touch/click, and whether selection/focus is preserved inside MultiSelect without blocking unrelated standalone interactions.
4. **Controlled and nested composition:** exercise reactive children/icons/action handlers, Badge inside a labeled control, repeated tags, removal during controlled MultiSelect updates, and nested interactive-content validity. Avoid duplicate callback delivery between root and trailing button.
5. **SSR and platform behavior:** verify deterministic optional slot rendering, no browser-only logic, hydration of a badge that gains/loses the action, and mobile pointer-to-click behavior. Label unverified real-device cases explicitly.
6. **Empty and boundary states:** cover empty/falsy children, icon-only badges, trailing icon without handler, handler without an icon if the type permits it, consumer-prevented pointer events, rapid removal, and unmount during the event sequence.
7. Write a failing standalone or MultiSelect regression before each minimal local fix and record upstream/local evidence per parity category.

## Public API

Preserve `BadgeProps`, current slot names, variants, and `onTrailingClick`. Do not add Kobalte `textValue`, copy Base UI Button props, expose new styling, or redesign the tag-removal API. If the unused public `TrailingButtonProps` declaration proves misleading, document it as an intentional divergence rather than removing it in this pass.

## Test Plan

- Focused: `bun run test src/elements/badge/badge.test.tsx`.
- Consumer: `bun run test src/forms/select/multi-select.test.tsx src/elements/badge/badge.test.tsx`.
- Icon foundation when touched: `bun run test src/elements/icon/icon.test.tsx src/elements/badge/badge.test.tsx`.
- Validate types: `bun run typecheck`.
- If optional label/action JSX changes, add getter-backed single-evaluation tests and a `renderToString -> hydrate -> remove tag` gate.

## Completion Criteria

- Standalone and MultiSelect semantics, focus, event order, and empty/action boundaries have current evidence and dispositions.
- Each fix has a focused regression and all listed relevant checks pass.
- Badge remains a comprehensive display component; no reference API or visual styling is ported.

## Dependencies and Handoff

Coordinate with the `icon`, `button`, and Select/MultiSelect plans before editing shared action foundations or consumer focus logic. The matrix owner must add the missing composed Badge behavior evidence; historical tests cannot close the audit automatically.
