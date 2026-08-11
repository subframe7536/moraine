# Tabs Base UI Parity Plan

## Status

Implementation complete on 2026-08-11 against Base UI `3011fba8f` and Kobalte `2e8ce473`.

Duplicate public values remain accepted. Selection resolves to the first enabled occurrence, while every occurrence receives a distinct internal identity for refs and ARIA relationships; activating a later duplicate therefore leaves the canonical occurrence selected.

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

## Verified Missing Features

1. **An empty-string tab value cannot be selected or measured.** Both `selectedValue` and `computeIndicatorStyle` use truthiness checks even though normalization accepts `''`. Priority P0, small; owner: Tabs.
2. **Duplicate values collide.** Trigger/content IDs and `triggerRefs` are value-derived, so duplicates create invalid ARIA relationships and ambiguous focus/selection. Priority P0, medium; owner: Tabs.
3. **Trigger refs are never removed.** Dynamic removal/reorder can leave stale elements in the map; later focus and indicator work may target detached nodes. Base UI explicitly registers and unregisters observed tabs. Priority P0, medium; owner: Tabs.
4. **`ResizeObserver` is assumed to exist.** Base UI guards unavailable observers; Moraine constructs one unconditionally in the reactive effect. Priority P1, small; owner: Tabs.
5. **Dynamic selection/focus recovery and hydration are untested.** Removing or disabling the selected/highlighted tab, external controlled changes while focus is inside/outside, and SSR ID/panel order lack coverage. Priority P0, medium; owner: Tabs.

Base UI's keepMounted/prehydration APIs and focusable-disabled-tab policy are intentional divergences; Moraine follows its current Kobalte-like disabled skipping and selected-only panels.

## Detailed Execution Plan

1. Add empty-string and duplicate-value tests before changing identity. Define whether duplicate public values are rejected or assigned unique instance IDs while selection remains value-based.
2. Register trigger refs with owner cleanup and make indicator/focus reads verify `isConnected` plus current collection membership.
3. Guard `ResizeObserver`; still compute on mount, selection, orientation, and item changes. Test the unavailable-observer branch and observer disconnect/rebind behavior.
4. Add dynamic remove/disable/reorder and controlled-update tests with focus inside/outside the tablist. Preserve manual activation and exact callback counts.
5. Add render-to-string/hydrate coverage for horizontal/vertical, selected panel, JSX label/icon/content reads, and first keyboard activation.
6. Update the matrix; run Tabs, selectable-navigation, controllable-value, SSR, typecheck, and diff checks.

## STOP Conditions

- Resolve duplicate-value policy before implementation; do not silently select an arbitrary duplicate.
- Do not port keepMounted, prehydration script, or visual indicator design in this sweep.
