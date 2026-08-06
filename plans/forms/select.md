# Select Base UI Parity Plan

## Status

- Ready for audit; implementation depends on the shared BaseSelect and Menu behavior baseline.
- Reference revisions are fixed at Base UI 3011fba8f and Kobalte 2e8ce473.

## Goal

Audit and close single-select parity gaps across combobox/listbox semantics, keyboard navigation, overlay focus/dismissal, search, selection, native form behavior, controlled state, virtualization, platform quirks, and SSR while preserving Moraine's comprehensive Select API.

## Local Surface

- Public source: src/forms/select/select.tsx
- Shared engine: src/forms/select/base-select.tsx and src/forms/select/shared
- Styles: src/forms/select/select.class.ts
- Tests: src/forms/select/select.test.tsx
- Overlay dependency: src/overlays/base/menu/menu.tsx and its shared menu/overlay dependencies
- Public component and type surface: Select, SelectProps, and SelectT members Value, OptionRenderState, VirtualEntry, VirtualRenderProps, ControlSlot, OptionSlot, render-prop types, Slot, Variant, Classes, Styles, Item, Base, and Props.
- Behavior in scope includes single scalar/null selection, searchable/non-searchable control modes, groups/filtering, highlighted state, option rendering, virtualization, native hidden select, menu lifecycle, and FormField integration.

## Upstream References

- Base UI 3011fba8f direct counterpart: base-ui/packages/react/src/select, especially root, trigger, value, popup, list, item, item-indicator/text, group/label, positioner/portal, scroll arrows, store, and their tests.
- Kobalte 2e8ce473 direct Solid counterpart: kobalte/packages/core/src/select, especially select-base/root/trigger/value/content/listbox/hidden-select/context and select.test.tsx.
- Cross-check Base UI combobox only when searchable-control behavior is genuinely combobox-like: base-ui/packages/react/src/combobox.
- Historical Moraine commits are evidence only.

## Audit and Implementation

1. First audit BaseSelect and Menu as prerequisites; create a gap ledger separating engine behavior, single-select policy, overlay behavior, and intentional API differences.
2. Audit keyboard/focus: open keys, initial highlight, Arrow/Home/End/Page keys, typeahead/search, Enter/Space selection, Tab policy, Escape, focus restoration, selected-item focus, RTL, disabled items, empty lists, and virtualized scrolling.
3. Audit ARIA: combobox/listbox ownership, expanded/controls/activedescendant/autocomplete, option selected/disabled/setsize/posinset, group labels, required/invalid/described-by, non-search presentation text, and stable IDs across open cycles.
4. Audit pointer/touch: control/input/trigger activation, toggle versus reopen, option pointer move/click, touch selection timing, scroll-versus-select, outside press, prevented handlers, focus-visible suppression, and nested interactive option content.
5. Audit controlled state: value/defaultValue/null, unmatched values, option list changes, equality/string conversion, input value while open/closed, callback count/order, controlled rollback, and FormField emissions.
6. Audit native form/validation: scalar serialization including numbers, disabled omission, required validity based on selected value rather than search text, reset, autofill, name/form ownership, and hidden native select synchronization.
7. Audit overlay and lifecycle: portal/positioner, collision and width, z-index, scroll lock if any, dismissal, exit presence, highlight retention during exit, reopen, nested overlays, and no closed-content instantiation.
8. Audit filtering/groups/virtualization: JSX labels, stable keys, duplicate values, empty children, disabled groups/options, custom renderers, onSearch/onScrollBottom ordering, virtual ARIA metadata, and flattened indexes.
9. Port shared invariants into BaseSelect/Menu once and single-selection rules into Select. Any conditional JSX change requires prop single-evaluation, closed-menu non-instantiation, and renderToString-to-hydrate-to-open coverage.

## Public API

- Preserve Select, SelectProps, SelectT namespace types, scalar/null value contract, render props, virtualization hooks, slots, and existing searchable behavior.
- Do not copy Base UI/Kobalte compound APIs, polymorphism, styling, spacing, or animations.
- Add no upstream API solely for parity; document features outside the current local contract as intentional differences.

## Test Plan

- Focused: bun run test src/forms/select/select.test.tsx
- Shared sibling: bun run test src/forms/select/multi-select.test.tsx
- Menu engine: run the focused test files under src/overlays/base/menu
- Shared navigation: bun run test src/shared/use-selectable-collection-navigation.test.ts
- Form integration: bun run test src/forms/form-field/form-field.test.tsx src/forms/form/form.test.tsx
- Final touched slice: bun run typecheck
- Add matrix cases for keyboard/RTL/touch, controlled/unmatched values, reset/autofill/required/FormData, overlay dismissal/reopen/exit, grouped and virtual options, ARIA IDs/metadata, JSX single evaluation, and hydration.

## Completion Criteria

- BaseSelect, Menu, single-select, form, virtualization, platform, and SSR rows are classified with evidence.
- Every confirmed gap has a regression test at the narrowest owning layer.
- Select, MultiSelect, Menu, FormField, shared navigation, and typecheck pass.
- No shared engine fix is duplicated in Select.

## Dependencies/Handoff

- Hard prerequisites: shared BaseSelect behavior and overlays/base/menu parity; coordinate ownership before modifying either.
- MultiSelect shares those prerequisites but has an independent plan and must not be treated as acceptance coverage for scalar selection.
- Handoff must include the engine versus Select gap split, keyboard/ARIA state model, native serialization/validity policy, overlay lifecycle results, platform caveats, and all test commands/results.
