# CheckboxGroup Base UI Parity Plan

## Status

- Audit complete; implementation not started. Audited from the working tree rooted at `3c02b36` on 2026-08-09.
- Reference revisions are fixed at Base UI 3011fba8f and Kobalte 2e8ce473.

## Goal

Bring CheckboxGroup collection behavior to Base UI parity while retaining Moraine's fieldset-based, data-driven component and public types. Cover group selection, native multi-value submission, validation, accessibility, controlled state, and SSR without porting upstream styling or API structure.

## Local Surface

- Source: src/forms/checkbox-group/checkbox-group.tsx
- Styles: src/forms/checkbox-group/checkbox-group.class.ts
- Tests: src/forms/checkbox-group/checkbox-group.test.tsx
- Direct dependency: src/forms/checkbox/checkbox.tsx
- Shared/form dependencies: src/shared/use-event-listener.ts and src/forms/form-field/form-field-context.ts
- Public component and type surface: CheckboxGroup, CheckboxGroupProps, and CheckboxGroupT members Slot, Variant, Classes, Styles, Item, Base, and Props.
- Behavior in scope includes item normalization, repeated same-name checkboxes, controlled value/defaultValue, group/item disabled and readOnly states, fieldset/legend semantics, reset, and table/card/list hit targets.

## Upstream References

- Base UI 3011fba8f direct counterpart: base-ui/packages/react/src/checkbox-group; use CheckboxGroup.tsx, useCheckboxGroupParent.ts, and their tests. Also inspect base-ui/packages/react/src/checkbox for item behavior.
- Kobalte 2e8ce473 has no standalone CheckboxGroup counterpart at kobalte/packages/core/src. Use kobalte/packages/core/src/checkbox for SolidJS checkbox semantics and group composition evidence only.
- Historical Moraine commits are non-normative evidence and must not replace pinned upstream source/tests.

## Audit and Implementation

1. Build an evidence-linked gap ledger and classify each item as verified, ported, intentional-divergence, or unverified-platform.
2. Audit collection state: duplicate values, missing item values, empty items, item reordering, value order, controlled/uncontrolled updates, stale controlled values, defaultValue snapshots, and group reset.
3. Audit native form behavior: repeated same-name entries in item order, unchecked/disabled omission, required validity for zero versus some selections, readOnly submission, FormData ordering, and reset without duplicate callbacks.
4. Audit ARIA/native semantics: fieldset and legend association, invalid/described-by propagation, group/item required and disabled state, per-item label/description IDs, indeterminate items, and absence of conflicting group roles.
5. Audit keyboard/focus behavior inherited from Checkbox: Space activation, tab order, disabled item skipping, label clicks, focus visibility, and whether group-level shortcuts are intentionally absent.
6. Audit pointer/touch behavior for list, card, and table hit targets, nested interactive descendants, prevented handlers, duplicate root/control toggles, and group-disabled/readOnly guards.
7. Audit event ordering and controlled state: one onChange payload per accepted toggle, immutable next arrays, no-op selection handling, FormField value and input/change emissions, and external prop updates.
8. Port only missing behavior through current Checkbox and group state mechanisms. Keep collection rules in one place and avoid duplicating Checkbox activation logic.
9. If conditional item JSX changes, add JSX-prop single-evaluation and renderToString-to-hydrate tests that prove item count, IDs, checked state, and DOM order are stable before interaction.

## Public API

- Preserve CheckboxGroup, CheckboxGroupProps, CheckboxGroupT.Item, the string-or-item input contract, callback payloads, and slots.
- Do not copy Base UI compound primitives, Kobalte composition, styling, layout, or animations.
- Any required public API change must be minimal, documented as an intentional divergence, and validated by type tests.

## Test Plan

- Focused: bun run test src/forms/checkbox-group/checkbox-group.test.tsx
- Item dependency: bun run test src/forms/checkbox/checkbox.test.tsx
- Form consumers: bun run test src/forms/form/form.test.tsx src/forms/form-field/form-field.test.tsx
- After shared behavior changes: bun run typecheck
- Add cases for empty and duplicate values, controlled updates, reset, required validity, repeated FormData entries and ordering, disabled/readOnly combinations, ARIA legend links, pointer cancellation, and callback count/order.

## Completion Criteria

- The full group and inherited Checkbox behavior surface is evidence-classified.
- Native multi-value serialization, reset, and validity match the chosen upstream behavior or have documented local-contract differences.
- Focused, dependency, FormField, and typecheck validation passes.
- No untracked shared invariant or styling/API parity task remains hidden in the implementation.

## Dependencies/Handoff

- Requires a stable Checkbox activation/hidden-input baseline; consume it instead of adding parallel item logic.
- Coordinate changes to FormField, useEventListener, or shared state helpers with their owners before editing.
- Handoff must state item identity/order rules, required-validity behavior, upstream evidence, test results, and remaining real-browser checks.

## Verified Missing Features

1. **Group required currently means every checkbox is required.** The plan's declared group contract is zero-versus-some selection, but `required` is forwarded to each native checkbox, making partial selection invalid. Priority P0, medium; owner: CheckboxGroup.
2. **Duplicate values create duplicate control IDs.** IDs are derived from group ID plus value, so duplicates break label targeting and identity. Priority P0, medium; owner: CheckboxGroup.
3. **Controlled values and reset do not reliably synchronize FormField state.** Reset reads live defaults and external controlled updates bypass field emission. Priority P1, medium; owner: CheckboxGroup plus Form.
4. **Item/legend JSX and generated identity lack hydration coverage.** Priority P1 coverage; owner: CheckboxGroup.
5. **Card interaction inherits Checkbox's nested-interactive bug.** Priority P0 dependency; owner: Checkbox, not CheckboxGroup.

## Detailed Execution Plan

1. Add group-validity tests for zero, one, and all selected values; implement one group-level native validity owner instead of marking every checkbox required.
2. Decouple DOM identity from value and test duplicate values, reorder, removal, label clicks, repeated FormData entries, and exact array ordering.
3. Add controlled/uncontrolled reset, external value, no-op toggle, controlled rejection, and FormField synchronization tests.
4. Consume Checkbox's card fix and FormField's group-label/required invariants; add only group-specific smoke tests here.
5. Cache legend/item JSX as required by the SSR gate and add render-to-string/hydrate coverage with duplicate labels/values.
6. Update the matrix; run CheckboxGroup, Checkbox, FormField, Form, SSR, and typecheck suites.

## STOP Conditions

- Confirm the declared at-least-one required contract before implementation; if product intent is “all required,” record that as an intentional divergence instead.
- Do not duplicate Checkbox or FormField fixes in the group.
