# ContextMenu Base UI Parity Plan

Status: Ready for hand-off — the pinned upstream audit is not complete; existing fixes and tests are baseline evidence only.

## Goal

Align ContextMenu's native right-click, keyboard shortcut, touch/pen long-press, virtual anchoring, menu navigation, nested submenu, focus, dismissal, portal, and controlled-state behavior without duplicating the shared menu engine.

## Local Surface

- Implementation: src/overlays/context-menu/context-menu.tsx.
- Public export: src/overlays/context-menu/index.ts.
- Focused tests: src/overlays/context-menu/context-menu.test.tsx.
- Component family: trigger wrapper/render prop, contextmenu and pointer listeners, long-press state, anchor point, controlled open state, OverlayMenu items/groups/checkbox/radio/submenus, and portal content.
- Shared infrastructure: src/overlays/base/menu/, popper.tsx, overlay-stack.ts, trigger.ts, and src/shared/use-event-listener.ts.

## Upstream References

- Base UI 3011fba8f: base-ui/packages/react/src/context-menu/ root/trigger source and tests, plus menu/ for content, items, submenus, focus, and dismissal.
- Kobalte 2e8ce473: kobalte/packages/core/src/context-menu/ and menu/, especially context-menu-root.tsx, context-menu-trigger.tsx/tests, menu-content-base.tsx, and submenu/item source.
- Base UI source/tests define behavior; Kobalte guides Solid listener ownership and cleanup.

## Audit and Implementation

1. Map open/anchor/focus strategy, suppressed native events, long-press timer/start point, controlled callbacks, active item, submenu stack, and close transitions.
2. Compare native contextmenu, ContextMenu key, Shift+F10, Arrow/Home/End/typeahead, Enter/Space, RTL submenu keys, Escape hierarchy, disabled skipping, and focus restoration.
3. Verify trigger/menu/item roles and aria-haspopup/expanded/controls, checkbox/radio/group semantics, generated IDs, data states, disabled behavior, and caller ARIA overrides.
4. Audit mouse buttons, repeated right-click, touch/pen hold delay, move tolerance, pointerup/cancel/lost capture, prevented native events, synthetic contextmenu suppression, selection clearing, and callback order.
5. Cover controlled rejection, defaultOpen without coordinates, disabled changes during a hold, empty/all-disabled menus, item removal, nested submenus, sibling/ancestor overlays, and deepest-first dismissal.
6. Verify virtual-anchor positioning, portal ownership, modal layer/scroll lock, outside focus/pointer, right-click inside content, overlay stack, exit presence, and focus restoration only from the top layer.
7. Audit macOS/non-macOS, iOS/Android long-press, pen, browser-generated contextmenu, and screen-reader shortcut guards; simulate reliable branches in jsdom and mark the rest unverified-platform.
8. Any conditional JSX/trigger renderer change requires getter single-evaluation plus renderToString-to-hydrate shortcut and long-press coverage.

## Public API

- Preserve ContextMenuProps, item/render contracts, trigger renderer, controlled props, placement, slots, and defaults.
- Do not port Base UI render/event-detail APIs, polymorphism, or styling.

## Test Plan

- Add one focused regression per confirmed trigger, keyboard, focus, ARIA, pointer/touch, controlled, nested, portal, dismissal, SSR, or boundary gap.
- Run: bun run test src/overlays/context-menu/context-menu.test.tsx
- Run: bun run test src/overlays/base/menu/menu.utils.test.tsx src/overlays/base/popper.test.tsx src/shared/use-event-listener.test.ts
- Run DropdownMenu consumer regressions for shared menu changes, then bun run typecheck.

## Completion Criteria

- Right-click, keyboard, and long-press paths converge on one deterministic open/focus/dismiss state machine.
- Nested menus and overlays dismiss deepest-first without leaked timers, locks, portals, or focus restoration.
- parity-matrix.md classifies every pinned upstream gap with local tests or a precise platform limitation.

## Dependencies and Handoff

- Requires shared hooks, Modal/overlay stack, Popper, and Menu foundation plans to be frozen in that order.
- Shared menu/popper/listener defects go to their single owners; this plan changes only ContextMenu-specific orchestration and tests.
- Existing long-press and submenu fixes are not proof of a complete audit at the pinned revisions.
