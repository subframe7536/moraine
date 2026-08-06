# Sheet Base UI Parity Plan

Status: Ready for hand-off — the pinned upstream audit is not complete; existing fixes and tests are baseline evidence only.

## Goal

Align Sheet's slide-in modal shell with current focus, naming, controlled state, pointer/touch dismissal, portal, scroll lock, nested overlay, SSR, and mobile platform behavior while preserving its non-gesture API.

## Local Surface

- Implementation and classes: src/overlays/sheet/sheet.tsx and sheet.class.ts.
- Public export: src/overlays/sheet/index.ts.
- Focused tests: src/overlays/sheet/sheet.test.tsx.
- Component family: side/inset panel, title/description/header/actions/body/footer/close shell, ModalRoot/Trigger/Content, overlay, transition presence, and SidebarFrame mobile consumer.
- Shared infrastructure: src/overlays/base/modal.tsx, overlay-stack.ts, trigger.ts, utils.ts, and controllable/event/presence hooks.

## Upstream References

- Base UI 3011fba8f: base-ui/packages/react/src/drawer/, especially root, popup, content, viewport, backdrop, trigger/close, swipe-area, virtual-keyboard provider, and their tests.
- Kobalte 2e8ce473: no direct Sheet; use kobalte/packages/core/src/dialog/, dismissable-layer/, and focus/escape/interact-outside primitives for shared modal behavior.
- Drawer swipe, snap-point, indent, and virtual-keyboard APIs are evidence only and are intentional divergences when they require new public API.

## Audit and Implementation

1. Map controlled open, side/inset/transition, title/description IDs, trigger, focus trap/restore, scroll lock, top overlay, dismiss attempts, and exit callbacks.
2. Compare Enter/Space trigger, Tab trapping, Escape, close control, autofocus/restoration, and focus behavior during side changes or mobile SidebarFrame mode switches.
3. Verify role=dialog, aria-modal, labelledby/describedby, missing heading behavior, close naming, overlay semantics, custom trigger, and disabled/no-trigger controlled use.
4. Audit touch/pen/mouse outside press, backdrop interaction, gesture cancellation at content boundaries, prevented events, scrollbar clicks, and onClosePrevent ordering.
5. Do not add swipe/snap/drag APIs in this sweep. Port only touch/platform fixes compatible with the current API and record the remaining Drawer gesture surface as intentional-divergence.
6. Cover rapid controlled toggles, dismissible=false, overlay=false, transition=false, all sides, inset mode, empty/custom shell regions, nested/sibling overlays, and unmount during exit.
7. Verify portal lifetime, overlay stack, body scroll lock, descendant-overlay containment, top-only dismissal, focus restoration, iOS/Safari scrolling, Android virtual keyboard, and reduced motion; mark real-engine-only proof unverified-platform.
8. Any conditional JSX or shell-region change requires single-evaluation plus renderToString-to-hydrate open/close/focus coverage for a side panel.

## Public API

- Preserve SheetProps/SheetT, side/inset/transition, shell slots, controlled props, dismissible/onClosePrevent, overlay, trigger renderer, and defaults.
- Do not port Drawer swipe/snap/provider/compound APIs or change styling/animation design.

## Test Plan

- Add focused regressions for each confirmed keyboard/focus, ARIA, pointer/touch, controlled, nested, portal, dismissal, SSR, platform, or shell-boundary gap.
- Run: bun run test src/overlays/sheet/sheet.test.tsx
- Run: bun run test src/overlays/base/modal.test.tsx src/navigation/sidebar-frame/sidebar-frame.test.tsx
- Run Dialog and Popup consumers for shared Modal changes, then bun run typecheck.

## Completion Criteria

- Focus, naming, dismissal, portal, scroll lock, and shell behavior are deterministic across sides, nesting, controlled state, and mobile composition.
- Gesture/snap differences are explicitly classified without API expansion, and platform limitations are honest.
- parity-matrix.md contains pinned evidence and local tests for every outcome.

## Dependencies and Handoff

- Requires shared controllable/event/presence hooks and Modal foundation first; Popper and Menu foundations must be classified before nested consumer acceptance.
- Coordinate with SidebarFrame after Sheet is frozen. Shared Modal defects belong to the foundation owner.
- Existing Sheet dismissal tests do not complete the Base UI Drawer/Kobalte audit at the pinned revisions.
