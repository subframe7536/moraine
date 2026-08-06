# Tooltip Base UI Parity Plan

Status: Ready for hand-off — the pinned upstream audit is not complete; existing fixes and tests are baseline evidence only.

## Goal

Align Tooltip's hover/focus timing, global skip-delay coordination, keyboard/pointer/touch behavior, accessible description, controlled state, positioning, portal, dismissal, nested overlay, SSR, and platform boundaries.

## Local Surface

- Implementation and classes: src/overlays/tooltip/tooltip.tsx and tooltip.class.ts.
- Public export: src/overlays/tooltip/index.ts.
- Focused tests: src/overlays/tooltip/tooltip.test.tsx.
- Component family: trigger render prop, text/KbdGroup content, PopperRoot/Trigger/Content, open/close timers, module-level active tooltip and skip-delay coordination, placement-derived side, and instant-motion state.
- Shared infrastructure: src/overlays/base/popper.tsx, overlay-stack.ts, trigger.ts, and controllable/event/presence hooks.

## Upstream References

- Base UI 3011fba8f: base-ui/packages/react/src/tooltip/, especially provider, root, trigger, popup, portal, positioner, viewport, constants, detached-trigger tests, and platform specs.
- Kobalte 2e8ce473: kobalte/packages/core/src/tooltip/ plus popper/ and dismissable-layer/ for Solid ownership, timing, focus, and positioning.
- Preserve Moraine's built-in global coordination rather than copying the Base UI Provider API.

## Audit and Implementation

1. Map controlled open, disabled state, focus/hover ownership, open/close timers, active tooltip, skip-delay window, instant motion, placement, portal lifetime, and cleanup.
2. Compare focus/blur, hover enter/leave, Escape, Tab navigation, trigger activation without opening on click, next-tooltip immediate open, and close/restoration behavior in nested overlays.
3. Verify role=tooltip, aria-describedby attachment/removal and ID stability, custom/no trigger, disabled/empty content, keyboard hints, and caller attribute precedence.
4. Audit mouse hover corridors, touch/pen suppression or synthesis, pointer cancellation, interactive-content behavior, prevented events, rapid trigger switching, and callback count/order.
5. Cover controlled rejection, defaultOpen/forceMount, disable while pending/open, trigger removal, unmount with timers, zero/negative delays under the local contract, multiple roots, nested/sibling overlays, and placement changes.
6. Verify portal/positioning boundaries, flip/shift/available height, outside/Escape dismissal ownership, overlay stack interaction, and that Tooltip never adds modal scroll lock or focus trap.
7. Audit hover capability, coarse pointers, iOS/Android, Safari focus, VoiceOver/TalkBack, reduced motion, and background-tab timer behavior; simulate reliable guards and mark the rest unverified-platform.
8. Any conditional JSX, text/kbds, or trigger renderer change requires single-evaluation plus renderToString-to-hydrate focus/hover/timer coverage; ensure module-level coordination does not leak across owners/tests.

## Public API

- Preserve TooltipProps/TooltipT, timing props, controlled props, disabled/placement/forceMount, text/kbds, trigger renderer, slots, and defaults.
- Do not add Base UI Provider/compound APIs, event details, polymorphism, or styling.

## Test Plan

- Add focused regressions for every confirmed timing, keyboard/focus, ARIA, pointer/touch, controlled, nested, portal, positioning, dismissal, SSR, platform, or cleanup gap.
- Run: bun run test src/overlays/tooltip/tooltip.test.tsx
- Run: bun run test src/overlays/base/popper.test.tsx
- Run Popover and other Popper consumers for shared changes, then bun run typecheck.

## Completion Criteria

- Focus/hover timing and global coordination are deterministic with no leaked timers, stale active tooltip, portal, or overlay state.
- ARIA description and positioning remain correct through controlled, disabled, nested, and hydration boundaries.
- parity-matrix.md records pinned evidence and local tests or explicit platform limitations for every result.

## Dependencies and Handoff

- Requires shared controllable/event/presence hooks and Popper foundation; Modal/overlay stack and Menu must be classified before nested-overlay acceptance.
- Shared Popper/dismissal defects go to foundation owners; this plan owns Tooltip-specific timing and global coordination.
- Existing skip-delay tests are baseline evidence only, not a completed pinned upstream audit.
