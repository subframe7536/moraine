# RadioGroup Base UI Parity Plan

## Status

- Audit complete; implementation not started. Audited from the working tree rooted at `3c02b36` on 2026-08-09.
- Reference revisions are fixed at Base UI 3011fba8f and Kobalte 2e8ce473.

## Goal

Bring RadioGroup selection, roving focus, keyboard, native form, ARIA, pointer, controlled-state, and SSR behavior to pinned upstream parity while preserving Moraine's data-driven list/card/table API.

## Local Surface

- Source: src/forms/radio-group/radio-group.tsx
- Styles: src/forms/radio-group/radio-group.class.ts
- Tests: src/forms/radio-group/radio-group.test.tsx
- Shared dependencies: src/shared/hidden-input.tsx, src/shared/use-controllable-value.ts, src/shared/use-selectable-collection-navigation.ts, and src/forms/form-field/form-field-context.ts
- Public component and type surface: RadioGroup, RadioGroupProps, and RadioGroupT members Slot, Variant, Classes, Styles, Item, Base, and Props.
- Behavior in scope includes item normalization, single selection, controlled/default value, orientation, roving focus/navigation, native same-name radios, readOnly/disabled, and variant hit targets.

## Upstream References

- Base UI 3011fba8f direct counterpart: base-ui/packages/react/src/radio-group, especially RadioGroup.tsx, context, data attributes, RadioGroup.test.tsx, and RadioGroup.spec.tsx.
- Kobalte 2e8ce473 direct counterpart: kobalte/packages/core/src/radio-group, especially root/item/control/input/label/description/indicator and radio-group.test.tsx.
- Historical Moraine commits are evidence only and cannot override pinned upstream source/tests.

## Audit and Implementation

1. Build a gap ledger for group state, item state, navigation, form behavior, and variants with exact upstream citations.
2. Audit keyboard/focus: initial tab stop when no value or a disabled/stale value exists, Arrow keys by orientation and RTL, wrapping, disabled-item skipping, selection-on-focus, Tab/Shift+Tab, Home/End if supported, focus after item removal, and readOnly behavior.
3. Audit ARIA/native semantics: role=radiogroup, native radio inputs, group orientation/required/disabled/readonly/invalid, item labels/descriptions, checked state, hidden input focusability, and no duplicate/conflicting roles.
4. Audit pointer/click behavior: native label activation, card/table container activation, list-only label activation, nested interactive descendants, disabled items, readOnly, prevented events, and duplicate change from input plus container.
5. Audit controlled state: controlled/default precedence, empty/stale values, external changes, item reorder/removal, duplicate values, no-op selection, callback count/order, and immutable FormField updates.
6. Audit native form behavior: one selected same-name entry, disabled omission, required validity, readOnly submission, reset to default, browser autofill, FormData ordering, and native change/input event interaction.
7. Audit collection/platform behavior: RTL, dynamic orientation/direction, focus-visible, Safari radio navigation differences reflected in upstream code, empty/all-disabled groups, and boundary states.
8. Port shared navigation fixes only when valid for other selectable collections; retain radio-specific ARIA and selection-on-focus in RadioGroup.
9. If item branches or Dynamic output changes, add JSX single-evaluation and renderToString-to-hydrate tests proving stable IDs, item order, checked state, and tab stop.

## Public API

- Preserve RadioGroup, RadioGroupProps, RadioGroupT.Item, value callback, variants, and slots.
- Do not copy compound primitive APIs, polymorphism, upstream styling, or animations.
- Add no group-level keyboard props unless current API cannot express required accessible behavior and the change is documented.

## Test Plan

- Focused: bun run test src/forms/radio-group/radio-group.test.tsx
- Shared navigation: run the focused test for src/shared/use-selectable-collection-navigation.test.ts
- Form integration: bun run test src/forms/form-field/form-field.test.tsx src/forms/form/form.test.tsx
- Related native control: bun run test src/forms/checkbox/checkbox.test.tsx
- Final touched slice: bun run typecheck
- Add empty/all-disabled/stale-value cases, RTL/orientation navigation, dynamic items, controlled updates, native reset/FormData/required validity, label/container cancellation, exact callbacks, ARIA links, and hydration.

## Completion Criteria

- Group, item, navigation, native form, platform, and SSR behaviors are evidence-classified.
- All ported gaps have tests and shared navigation changes pass their own suite.
- RadioGroup, FormField, representative native controls, and typecheck pass.
- Menu/Select navigation behavior is not accidentally changed by radio-specific rules.

## Dependencies/Handoff

- Audit useSelectableCollectionNavigation before changing keyboard behavior; coordinate generic fixes with Select/Menu owners.
- Depends on shared controllable-value, hidden-input, and FormField contracts.
- Handoff must state the roving-tab-stop and selection-on-focus policy, direction/boundary rules, native form results, shared helper impact, and test output.

## Verified Missing Features

1. **Keyboard timing and modifiers differ from radio-group behavior.** The shared navigation adapter selects on Enter and Space `keydown` and also changes selection for Shift+Arrow. Base UI selects Space on keyup, ignores Enter, and preserves Shift+Arrow focus behavior. Priority P0, medium; owner: RadioGroup adapter, not the shared foundation.
2. **Native form reset does not synchronize the signal/Formisch value.** Priority P0, medium; owner: RadioGroup plus Form.
3. **Controlled external values do not update FormField state.** `field.setFormValue` runs only from local changes. Priority P1, medium; owner: RadioGroup.
4. **Duplicate values collide in IDs and the ref map.** Priority P0, medium; owner: RadioGroup.
5. **Per-item descriptions are not referenced by their radio inputs, and group labelling depends on FormField's missing label ID.** Priority P0 accessibility; owner: RadioGroup after FormField.
6. **Item JSX and collection order lack hydration coverage.** Priority P1 coverage; owner: RadioGroup.

## Detailed Execution Plan

1. Add full keydown/keyup tests for Space, Enter, arrows, Home/End, Shift/Alt/Ctrl/Meta, RTL, disabled items, and callback order. Adapt only RadioGroup's consumer policy.
2. Add reset, FormData, required validity, controlled external update, controlled rejection, and FormField store tests.
3. Introduce collision-free DOM identity independent of selected value; test duplicate values, reorder, removal, and ref cleanup without changing the public value contract.
4. Generate per-item description IDs and adopt FormField group `aria-labelledby`/`aria-describedby` accessors.
5. Add SSR/hydration tests for scalar selection, item labels/descriptions, generated IDs, and first keyboard action.
6. Update the matrix; run RadioGroup, navigation foundation, FormField, Form, SSR, and typecheck suites.

## STOP Conditions

- Do not modify `useSelectableCollectionNavigation` for radio-specific Enter/keyup rules.
- If duplicate-value selection semantics cannot remain predictable, stop and document whether duplicates must be rejected by contract.
