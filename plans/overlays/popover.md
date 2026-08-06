# Popover Base UI Parity Plan

Status: Ready for hand-off — the pinned upstream audit is not complete; existing fixes and tests are baseline evidence only.

## Goal

Align Popover's click/hover interaction, anchored positioning, focus and ARIA ownership, controlled state, nested overlay behavior, portal, dismissal, transition presence, SSR, and platform boundaries.

## Local Surface

- Implementation and classes: src/overlays/popover/popover.tsx and popover.class.ts.
- Public export: src/overlays/popover/index.ts.
- Focused tests: src/overlays/popover/popover.test.tsx.
- Component family: PopperRoot/Trigger/Content, click or hover timers, dialog content/body, modal/non-modal mode, placement-derived side, portal, and dismissal callbacks.
- Shared infrastructure: src/overlays/base/popper.tsx, overlay-stack.ts, trigger.ts, utils.ts, and controllable/event/presence hooks.

## Upstream References

- Base UI 3011fba8f: base-ui/packages/react/src/popover/ root, trigger, popup, portal, positioner, viewport, title/description/close/backdrop source and tests.
- Kobalte 2e8ce473: kobalte/packages/core/src/popover/, plus popper/ and dismissable-layer/ for Solid positioning, focus, and outside interaction.
- Port observable behavior only; do not expand Moraine into upstream compound parts.

## Audit and Implementation

1. Map controlled open, click/hover mode, timers, trigger/content hover state, placement, modal focus behavior, top overlay, dismiss attempts, and close callbacks.
2. Compare trigger Enter/Space/click, Escape, Tab/focus movement, autofocus/restoration for modal and non-modal modes, and focus behavior when hover mode is used from the keyboard.
3. Verify trigger aria-haspopup/expanded/controls, content role/aria-modal/label relationships, disabled/custom/no-trigger cases, and caller attribute precedence.
4. Audit mouse hover corridors, touch/pen/click synthesis, pointerdown outside, focus outside, event prevention, timer cancellation, duplicate pointer/focus attempts, and callback ordering.
5. Cover controlled rejection, rapid re-entry, defaultOpen positioning, forceMount, absent content, trigger removal, nested/sibling popovers, descendant overlays, lower-layer exit, and placement changes.
6. Verify portal target/lifetime, flip/shift/available-height boundaries, modal scroll lock, overlay stack, top-only dismissal, and focus restoration after transition exit.
7. Audit hover-capability media, Safari focus, mobile touch, virtual keyboard, Resize/Intersection behavior, and reduced motion; mark real-engine-only proof unverified-platform.
8. Any conditional JSX/content/trigger change requires single-evaluation plus renderToString-to-hydrate click, focus, and dismissal coverage.

## Public API

- Preserve PopoverProps/PopoverT, click/hover modes, timers, controlled props, placement, modal/preventScroll/dismissible behavior, slots, and defaults.
- Do not port Base UI title/description/close/backdrop parts, event details, polymorphism, or styling.

## Test Plan

- Add focused regressions for each confirmed keyboard/focus, ARIA, pointer/touch, controlled, nested, portal, positioning, dismissal, SSR, platform, or boundary gap.
- Run: bun run test src/overlays/popover/popover.test.tsx
- Run: bun run test src/overlays/base/popper.test.tsx src/overlays/base/modal.test.tsx
- Run Tooltip and other Popper consumers for shared changes, then bun run typecheck.

## Completion Criteria

- Click, hover, keyboard, modal/non-modal, nested, and controlled flows converge without timer, focus, portal, or overlay-stack leaks.
- Positioning and hydration are deterministic; untestable platform branches are explicitly classified.
- parity-matrix.md records pinned evidence and local regressions for every outcome.

## Dependencies and Handoff

- Requires shared controllable/event/presence hooks, Modal/overlay stack, and Popper foundations; Menu must be classified before nested menu-in-popover validation.
- Shared positioning/dismissal gaps go to foundation owners; this plan owns Popover-specific mode/timer/content behavior.
- Prior Popover stack fixes do not complete the pinned upstream audit.
