# DropdownMenu Base UI Parity Plan

Status: Audit complete; implementation not started. Audited from the working tree rooted at `3c02b36` on 2026-08-09.

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

## Verified Missing Features

1. **Disabled trigger semantics are only behavioral.** The renderer receives `data-disabled` but no native `disabled` or `aria-disabled`, so an anchor/span trigger remains focusable and announced as enabled even though handlers refuse to open. Base UI distinguishes native and non-native disabled triggers. Priority P0, medium; owner: shared trigger contract with DropdownMenu smoke test.
2. **Disabling an open menu does not close or report a close attempt.** `commitOpen` checks disabled only for opening and there is no reactive disabled transition. Priority P1, small; owner: DropdownMenu policy.
3. **Dynamic trigger removal/replacement is untested.** Focus restoration and positioning retain an imperative trigger reference; the consumer suite has no removal-during-open or replacement case. Priority P1, medium; owner: DropdownMenu with foundation-backed cleanup.
4. **Trigger renderer hydration is untested.** Getter single evaluation is locally cached, but there is no render-to-string/hydrate keyboard-open proof. Priority P1 coverage, small; owner: DropdownMenu.

## Detailed Execution Plan

1. Extend the shared trigger attributes only as required to expose correct native/non-native disabled semantics; add default button, anchor, span, and caller-override tests here.
2. Decide disabled-while-open behavior from Base UI/Kobalte evidence, then test uncontrolled closure and controlled close attempts exactly once without bypassing Menu teardown.
3. Add trigger removal/replacement tests during open, exit, submenu open, and controlled rejection; assert no detached focus restoration or stale positioning.
4. Add SSR/hydration coverage for closed/open controlled markup, exact trigger-render reads, first ArrowDown open, and Escape restore.
5. Update the matrix; run DropdownMenu, ContextMenu, Menu, Modal, Popper, SSR, typecheck, and diff checks.

## STOP Conditions

- Do not duplicate item/typeahead/submenu/portal fixes already owned by the Menu foundation.
- If native/non-native disabled attributes require changing `OverlayTriggerProps`, freeze the shared trigger contract before editing both menu consumers.
