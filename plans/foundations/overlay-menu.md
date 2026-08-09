# Menu Overlay Foundation Base UI Parity Plan

Status: Complete

## Goal

Align the shared menu engine with current keyboard, typeahead, pointer/touch, submenu, selection, dismissal, focus, and ARIA behavior required by DropdownMenu and ContextMenu without leaking menu semantics into Select.

## Local Surface

- Core: src/overlays/base/menu/menu.tsx
- Helpers/types/classes: src/overlays/base/menu/menu.utils.ts, types.ts, and menu.class.ts
- Tests: src/overlays/base/menu/menu.utils.test.tsx plus DropdownMenu and ContextMenu suites.
- Shared consumers: DropdownMenu, ContextMenu, and selected positioning/dismissal helpers in BaseSelect.

## Upstream References

- Base UI 3011fba8f: base-ui/packages/react/src/menu/ and context-menu/.
- Kobalte 2e8ce473: kobalte/packages/core/src/menu/, dropdown-menu/, and context-menu/.

## Audit and Implementation

1. Map root/submenu open state, active item, focus owner, pointer grace area, selection, and dismissal transitions.
2. Compare Arrow/Home/End navigation, RTL submenu keys, Enter/Space activation, Escape hierarchy, Tab behavior, disabled skipping, and typeahead normalization/timeout.
3. Audit mouse versus touch/pen highlighting, click ordering, long press, contextmenu, hover intent, safe polygon, and pointer cancellation.
4. Verify menu/menuitem roles, checkbox/radio states, group/label/separator semantics, aria-expanded/controls/haspopup, and disabled behavior.
5. Cover nested portals, outside pointer/focus, sibling menu competition, close/select callback ordering, controlled state, empty/all-disabled menus, and item removal.
6. Keep only generic positioning/dismissal utilities shared with Select; do not force listbox semantics through menu state.
7. Reuse existing local architecture and public component families rather than copying headless Base UI primitives.

## Public API

- Preserve current menu exports and wrapper component APIs.
- Do not port Base UI render/event-detail APIs or styling.

## Test Plan

- Add direct helper/state tests where behavior is shared, then consumer tests for every observable gap.
- Run: bun run test src/overlays/base/menu/menu.utils.test.tsx
- Run: bun run test src/overlays/dropdown-menu/dropdown-menu.test.tsx src/overlays/context-menu/context-menu.test.tsx
- Run Select and MultiSelect suites for shared helper regressions, then bun run typecheck.

## Completion Criteria

- Keyboard-only and pointer/touch flows cover boundaries, nested menus, cancellation, and disabled items.
- Focus and dismissal are deterministic across nested and competing overlays.
- No menu-specific behavior is accidentally imposed on listbox consumers.

## Dependencies and Handoff

- Requires selectable navigation, Modal/overlay stack behavior, Popper positioning, and transition presence to be frozen.
- Complete before DropdownMenu, ContextMenu, Select, and MultiSelect plans.
- Shared menu files have a single implementation owner.
