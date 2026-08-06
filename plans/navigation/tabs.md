# Tabs Base UI Parity Plan

Status: Ready for hand-off — the pinned upstream audit is not complete; existing fixes and tests are baseline evidence only.

## Goal

Align Tabs with current keyboard, roving-focus, activation, controlled state, ARIA, dynamic collection, indicator, SSR, and platform behavior while retaining Moraine's item-array API.

## Local Surface

- Implementation and classes: src/navigation/tabs/tabs.tsx and tabs.class.ts.
- Public export: src/navigation/tabs/index.ts.
- Focused tests: src/navigation/tabs/tabs.test.tsx.
- Component family: root, tablist, tab triggers, selected indicator, optional leading/trailing content, tabpanels, useControllableValue, and useSelectableCollectionNavigation.

## Upstream References

- Base UI 3011fba8f: base-ui/packages/react/src/tabs/, especially root, list, tab, panel, indicator source/tests, enumSync.test.tsx, and indicator prehydration assets.
- Kobalte 2e8ce473: kobalte/packages/core/src/tabs/, especially tabs-root.tsx, tabs-list.tsx, tabs-trigger.tsx, tabs-content.tsx, tabs-keyboard-delegate.ts, and tabs.test.tsx.
- Base UI defines target behavior; Kobalte guides Solid ownership, reactive collection, and hydration translation.

## Audit and Implementation

1. Map requested/selected/highlighted values, trigger refs, activation mode, indicator measurement, controlled callbacks, invalid values, and dynamic item changes.
2. Compare horizontal/vertical and RTL arrow maps, Home/End, automatic/manual activation, Enter/Space, loop boundaries, disabled skipping, Tab order, and focus recovery after item removal.
3. Verify tablist/tab/tabpanel roles, aria-orientation, aria-selected, controls/labelledby IDs, disabled state, roving tabindex, hidden/presence behavior, and root state attributes.
4. Audit mouse/touch activation, focus-on-press ordering, prevented events, controlled callback count/order, disabled root/items, and rapid value changes.
5. Cover empty/all-disabled lists, duplicate/generated values, invalid controlled/default values, insertion/removal/reorder, nested Tabs, and orientation/direction changes.
6. Confirm Tabs owns no overlay, portal, or dismissal behavior and composes inside nested overlays without intercepting Escape or leaking focus.
7. Audit indicator measurement across initial render, fonts/layout changes, resize, RTL, hidden containers, and reduced platform capability; do not port styling or Base UI's prehydration API.
8. Verify deterministic IDs, selected panel, and JSX evaluation across SSR/hydration. Any conditional JSX/slot change requires single-evaluation and renderToString-to-hydrate keyboard/indicator coverage.

## Public API

- Preserve TabsProps, TabsT item/slot types, item-array model, controlled props, orientation, activationMode, keyboardLoop, variants, and defaults.
- Do not port Base UI compound/render/event APIs, prehydration script API, polymorphism, or styling.

## Test Plan

- Add focused regressions for every keyboard, focus, ARIA, controlled/dynamic, pointer, indicator, SSR, and boundary gap.
- Run: bun run test src/navigation/tabs/tabs.test.tsx
- Run useControllableValue and selectable-navigation suites plus Stepper smoke tests when shared behavior changes, then bun run typecheck.

## Completion Criteria

- Keyboard-only and pointer flows produce coherent selected/focused tabs across orientation, RTL, disabled, dynamic, and boundary cases.
- ARIA relationships, panel presence, indicator state, and hydration order are deterministic.
- parity-matrix.md records pinned source/test evidence and the local outcome of every gap.

## Dependencies and Handoff

- Requires useControllableValue and useSelectableCollectionNavigation foundations; coordinate shared tab semantics with Stepper without coupling their workflow rules.
- Respect the global order shared hooks, Modal, Popper, Menu, then consumers; report foundation gaps rather than editing them concurrently.
- Historical parity fixes do not establish completion against Base UI 3011fba8f or Kobalte 2e8ce473.
