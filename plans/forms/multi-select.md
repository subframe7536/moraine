# MultiSelect Base UI Parity Plan

## Status

- Ready for audit; implementation depends on the shared BaseSelect and Menu behavior baseline.
- Reference revisions are fixed at Base UI 3011fba8f and Kobalte 2e8ce473.

## Goal

Audit and close MultiSelect parity gaps for multiple selection, combobox/listbox keyboard behavior, tags and creation, native repeated-value serialization, required validation, overlay lifecycle, controlled state, virtualization, platform quirks, and SSR while keeping the component independently deliverable from Select.

## Local Surface

- Public source: src/forms/select/multi-select.tsx
- Shared engine: src/forms/select/base-select.tsx and src/forms/select/shared
- Shared styles: src/forms/select/select.class.ts
- Tests: src/forms/select/multi-select.test.tsx
- Overlay dependency: src/overlays/base/menu/menu.tsx and its shared menu/overlay dependencies
- Public component and type surface: MultiSelect, MultiSelectProps, and MultiSelectT members Value, OptionRenderState, VirtualEntry, VirtualRenderProps, ControlSlot, OptionSlot, render-prop types, Slot, Variant, Classes, Styles, Item, Base, and Props.
- Behavior in scope includes array selection, tags/removal/clear, maxCount/maxTagCount, token separators, allowCreate, search/groups, virtual rendering, menu lifecycle, repeated same-name native values, and FormField integration.

## Upstream References

- Base UI 3011fba8f direct multiple-selection behavior: base-ui/packages/react/src/select, especially select/root multiple mode, hidden-input serialization, item/list/trigger/value behavior, and root tests for multiple form submission, dirty state, and autofill.
- Use base-ui/packages/react/src/combobox only for editable multiple-combobox behavior that Select does not cover.
- Kobalte 2e8ce473 direct Solid multiple-selection reference: kobalte/packages/core/src/select, especially select-base/root/listbox/hidden-select and select.test.tsx.
- Neither upstream's visual tag/creation API is automatically normative for Moraine. Historical Moraine commits are evidence only.

## Audit and Implementation

1. Audit BaseSelect and Menu first. Keep a gap ledger split into shared engine, multiple-selection policy, tags/creation policy, native form, overlay, and intentional differences.
2. Audit keyboard/focus: open/navigation keys, Enter/Space/Tab selection policy, Escape, Backspace/Delete tag removal only at the correct caret state, focus after tag remove/clear, token separators, disabled/maxed options, RTL, empty lists, and virtual scroll.
3. Audit ARIA: combobox/listbox relationships, multiselectable, active descendant, selected/disabled option states, accessible names for tags/remove/clear/overflow, required/invalid/described-by, group labels, and stable IDs.
4. Audit pointer/touch: control/trigger toggle, tag remove and clear without reopening, option touch selection versus scrolling, prevented events, outside dismissal, nested interactive content, and focus-visible ownership.
5. Audit multiple controlled state: array value/defaultValue, ordering, duplicates, numeric/string identity, option removal/reorder, created tags, maxCount transitions, no-op toggles, controlled rollback, and exact callback/onClear/FormField emission order.
6. Audit creation/tokenization: trimming and empty tokens, duplicate existing/created values, multiple separators, trailing remainder, paste/IME, maxCount, disabled matches, custom labels/values, and allowCreate=false.
7. Audit native form/validation: repeated same-name entries in selection order, numeric values, created tags, disabled omission, required validity based on selected count, reset, autofill limitations in multiple mode, form ownership, and hidden native controls.
8. Audit overlay, groups, filtering, virtualization, exit presence, highlight retention, onSearch/onScrollBottom, custom option/tag/empty renderers, JSX labels, and closed-content non-instantiation.
9. Port shared fixes once into BaseSelect/Menu and multiple-only rules into MultiSelect. Conditional JSX changes require getter-backed single evaluation, inactive branch non-instantiation, and renderToString-to-hydrate-to-open/tag-remove coverage.

## Public API

- Preserve MultiSelect, MultiSelectProps, MultiSelectT namespace types, array value contract, tag/creation options, render props, virtualization hooks, callbacks, and slots.
- Do not copy Base UI/Kobalte compound APIs, styling, spacing, animations, or alternate tag models.
- Public changes require a demonstrated correctness need; otherwise classify unavailable upstream features as intentional differences.

## Test Plan

- Focused: bun run test src/forms/select/multi-select.test.tsx
- Shared sibling: bun run test src/forms/select/select.test.tsx
- Menu engine: run the focused test files under src/overlays/base/menu
- Shared navigation: bun run test src/shared/use-selectable-collection-navigation.test.ts
- Form integration: bun run test src/forms/form-field/form-field.test.tsx src/forms/form/form.test.tsx
- Final touched slice: bun run typecheck
- Add keyboard/tag/caret/RTL/touch cases, controlled array/order/duplicates, token paste/IME/limits, repeated FormData/reset/required/autofill, overlay exit/reopen, virtual/grouped options, ARIA names/IDs, JSX evaluation, and hydration.

## Completion Criteria

- Shared engine and multiple-only behavior are separately classified with exact evidence.
- Repeated serialization, required validity, tags/creation, keyboard, overlay, controlled state, and SSR gaps have tests or documented differences.
- MultiSelect, Select, Menu, FormField, shared navigation, and typecheck pass.
- MultiSelect can be handed off and accepted independently once the declared shared prerequisites are complete.

## Dependencies/Handoff

- Hard prerequisites: BaseSelect and overlays/base/menu parity. Do not duplicate fixes locally to avoid waiting for them.
- Select shares those prerequisites but is a separate scalar-selection deliverable; its completion is not otherwise required.
- Handoff must include shared versus multiple-only gaps, selection identity/order rules, token/tag state flow, native form behavior, test results, and unverified real-browser behavior.
