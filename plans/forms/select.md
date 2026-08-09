# Select Base UI Parity Plan

## Status

- Audit complete; implementation not started. Audited from the working tree rooted at `3c02b36` on 2026-08-09; shared BaseSelect work is owned here.
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

## Verified Missing Features

1. **Non-search Select has no typeahead.** `BaseSelect.handleKeyDown` handles navigation and selection keys only, while Base UI and Kobalte Select support printable-key typeahead with repeated-character cycling. Priority P0, medium; owner: BaseSelect through this plan.
2. **Closed-key behavior is incomplete.** Space does not open a closed Select, while Home/End mutate hidden highlight without opening. Base UI/Kobalte open from Space/Enter/Arrow and scope boundary movement to an open listbox. Priority P0, small; owner: BaseSelect.
3. **Groups are not accessibly labelled.** Non-virtual `role=group` has no `aria-labelledby`; virtual labels are `role=presentation` with no association. Upstream group/label parts link these IDs. Priority P0, medium; owner: BaseSelect.
4. **Value and DOM identity collide.** Normalization stringifies values, conflating `1` and `'1'`; duplicate keys produce duplicate option IDs and ambiguous `aria-activedescendant`. Priority P0, large, high compatibility risk; owner: BaseSelect.
5. **The hidden native select is output-only.** It has no change/reset listener, so native reset and autofill do not update Select or FormField. Priority P0, medium; owner: BaseSelect plus Form.
6. **Option pointerdown prevents touch scrolling.** It prevents default for mouse, touch, and pen and selects on click without a movement threshold; Base UI/Kobalte distinguish touch scrolling from intentional selection. Priority P1, medium, real-engine validation required; owner: BaseSelect.
7. **Queued focus/scroll work is not owner-guarded.** Selection and highlight use raw `queueMicrotask`, so close/unmount or a newer highlight can leave stale focus/scroll actions. Priority P1, small; owner: BaseSelect.
8. **Unmatched controlled values and JSX branches are not defined.** Native options omit unmatched values, and `emptyRender`/`optionRender` branches can read getters more than once without hydration coverage. Priority P1, medium; owner: Select/BaseSelect.

## Detailed Execution Plan

1. Add BaseSelect-owned keyboard tests in `select.test.tsx`: Space/Enter/Arrow open policy, closed Home/End, printable typeahead, repeated characters, timeout, disabled items, search-mode separation, RTL, and exact callback counts.
2. Add stable group-label IDs and collision-free option instance IDs. Write duplicate key/value and numeric/string identity tests before choosing the internal identity representation; preserve the public scalar value contract.
3. Compose native `change` and `reset` back into Select/FormField. Cover required validity, FormData, disabled omission, numeric values, unmatched controlled values, autofill-style changes, and controlled rejection.
4. Split mouse pointerdown focus preservation from touch/pen selection. Simulate reliable cancellation in jsdom and leave actual scroll-versus-tap proof `unverified-platform`.
5. Guard queued focus/scroll work with owner cleanup and current-state checks; test rapid select-close-unmount and highlight replacement.
6. Cache `children`, `optionRender`, `emptyRender`, labels, and icons at their owning scope. Add render-to-string/hydrate-to-open coverage with exact getter reads and no closed-content instantiation.
7. Adopt FormField's shared group labelling/required state, update the matrix, and run Select, MultiSelect, Menu, navigation, FormField, Form, SSR, and typecheck suites.

## STOP Conditions

- Do not change shared Menu/Popper behavior from this plan; route any remaining defect to the completed foundation and add only a Select smoke test.
- If preserving distinct numeric/string values requires a public equality/key contract, stop and document the breaking pre-alpha decision before implementation.
