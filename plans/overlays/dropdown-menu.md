# DropdownMenu Base UI Parity Plan

Status: Ready for hand-off — the pinned upstream audit is not complete; existing fixes and tests are baseline evidence only.

## Goal

Align DropdownMenu's trigger, keyboard/pointer navigation, item selection, submenus, focus, ARIA, controlled state, positioning, portal, modal dismissal, and transition behavior while keeping menu logic in the shared engine.

## Local Surface

- Implementation: src/overlays/dropdown-menu/dropdown-menu.tsx.
- Public export: src/overlays/dropdown-menu/index.ts.
- Focused tests: src/overlays/dropdown-menu/dropdown-menu.test.tsx.
- Component family: trigger render prop, controlled open/focus strategy, OverlayMenu items/groups/checkbox/radio/submenus, positioned portal content, overlay layer, and transition presence.
- Shared infrastructure: src/overlays/base/menu/, popper.tsx, modal/overlay stack, trigger.ts, and useControllableValue.

## Upstream References

- Base UI 3011fba8f: base-ui/packages/react/src/menu/, especially root, trigger, popup, item, checkbox/radio, submenu trigger/root, portal, positioner, and their tests.
- Kobalte 2e8ce473: kobalte/packages/core/src/dropdown-menu/ and menu/, especially root/content/trigger, menu-content-base, item, submenu, and portal source.
- Use upstream source/tests for behavior; preserve Moraine item arrays and render contracts.

## Audit and Implementation

1. Map controlled open, trigger focus strategy, active item, selection, checkbox/radio state, submenu chain, pointer grace, overlay layer, exit presence, and callback ordering.
2. Compare ArrowDown/Up trigger opening, Enter/Space, Home/End, typeahead, RTL submenu arrows, Escape deepest-first, Tab behavior, disabled skipping, focus-on-open, and trigger restoration.
3. Verify trigger aria-haspopup/expanded/controls, menu/menuitem roles, checkbox/radio/group/label/separator states, generated IDs, data states, disabled semantics, and forwarded item/content props.
4. Audit click, hover, touch/pen, pointer grace/safe polygon, event prevention, focus-on-press, selection close rules, destructive items, and duplicate pointer/focus dismissal.
5. Cover controlled rejection, disabled trigger changes, empty/all-disabled items, item removal, rapid toggles, nested/sibling menus, submenu portal ownership, and competing overlays.
6. Verify placement/flip boundaries, nested portals, modal overlay and scroll lock, outside pointer/focus, descendant-overlay containment, transition lifetime, and top-layer focus restoration.
7. Audit VoiceOver/TalkBack, iOS/Android touch, Safari focus, RTL, and browser pointer quirks from pinned tests; simulate reliable branches and mark remaining proof unverified-platform.
8. Any conditional JSX, itemRender, or trigger renderer change requires single-evaluation plus renderToString-to-hydrate keyboard/submenu coverage.

## Public API

- Preserve DropdownMenuProps, item/render contracts, controlled props, placement, slots, trigger renderer, and defaults.
- Do not port Base UI render/event-detail APIs, compound primitives, polymorphism, or styling.

## Test Plan

- Add focused regressions for each confirmed trigger, keyboard, focus, ARIA, pointer/touch, controlled, nested, portal, dismissal, SSR, platform, or boundary gap.
- Run: bun run test src/overlays/dropdown-menu/dropdown-menu.test.tsx
- Run: bun run test src/overlays/base/menu/menu.utils.test.tsx src/overlays/base/popper.test.tsx src/overlays/base/modal.test.tsx
- Run ContextMenu and Select/MultiSelect consumers for shared changes, then bun run typecheck.

## Completion Criteria

- Trigger, items, submenus, portals, focus, and dismissal form one deterministic state machine across input methods.
- Menu-specific behavior stays out of Select/listbox consumers and shared foundations retain single ownership.
- parity-matrix.md contains pinned evidence and local tests for every classified result.

## Dependencies and Handoff

- Requires shared state/lifecycle hooks, Modal/overlay stack, Popper, then Menu foundation plans in that order.
- Shared foundation defects are handed off; this plan owns only DropdownMenu orchestration and consumer regressions.
- Existing menu parity coverage is baseline only, not a completed audit of the pinned revisions.
