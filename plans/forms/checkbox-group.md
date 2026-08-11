# CheckboxGroup Base UI Parity Plan

## Status

- Implementation complete on 2026-08-11. Audited from the working tree rooted at `3c02b36` on 2026-08-09 and re-verified before implementation.
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

## Final Classification

1. **Group selection and native serialization — ported.** Selection remains value-based and immutable, while repeated same-name inputs serialize in rendered item order. Duplicate and empty values intentionally select every matching item, matching the public `string[]` value contract.
2. **DOM identity — ported.** Item control IDs are generated by each `<For>` owner instead of the business value. Duplicate values therefore retain unique label targets, and stable object items retain their IDs through reorder.
3. **Required validity — intentional divergence.** Fixed Base UI has no group-level `required` contract; applying native `required` to every item would mean “all items.” Moraine preserves its documented “at least one enabled item” contract with `aria-required` on the fieldset and one dynamic native validity owner.
4. **Controlled/uncontrolled state and reset — ported.** Uncontrolled reset restores an initial `defaultValue` snapshot, controlled reset preserves the current external value, no reset callback fires, and external controlled changes synchronize FormField input.
5. **ARIA, disabled, readOnly, keyboard, and pointer behavior — verified.** Fieldset/legend relationships and FormField ARIA propagation remain intact. Items continue to consume Checkbox's native Space path, Enter suppression, disabled/readOnly guards, and card/list/table hit-target behavior without duplicate group logic.
6. **JSX and hydration — ported.** Group collection and legend getters are cached, group icons resolve only for their active state, item JSX remains owned by its item, and duplicate-value SSR hydration preserves root identity, unique IDs, checked state, and DOM order.
7. **Compound primitives and visual APIs — intentional divergence.** Base UI's compound React API and styling structure are not copied; Moraine retains its data-driven items, fieldset root, variants, slots, classes, and styles.
8. **Native keyboard/touch synthesis, validation UI, and assistive-technology output — unverified platform.** jsdom covers explicit event sequences, constraint state, FormData, and hydration ownership but cannot prove browser-generated compatibility clicks, native validation bubbles, or screen-reader announcements.

## Implementation Result

- One enabled checkbox owns native `required` only while no enabled item is selected; stale controlled values do not incorrectly satisfy validity.
- Item owner IDs are independent of value and survive stable-object reorder, including duplicate and empty primitive values.
- Controlled values synchronize into FormField, and form reset distinguishes initial uncontrolled defaults from current controlled state.
- The completed Checkbox activation/card fixes are reused unchanged.
- Getter-backed and isolated `renderToString -> hydrate` regressions cover collection, legend, icon, ID, checked-state, and slot-order invariants.

## Validation

- `bun run test src/forms/checkbox-group/checkbox-group.test.tsx`
- `bun run test src/forms/checkbox/checkbox.test.tsx src/forms/form/form.test.tsx src/forms/form-field/form-field.test.tsx`
- `bun run typecheck`
- Targeted oxfmt and oxlint for the CheckboxGroup source, tests, and SSR fixture

## STOP Conditions

- Confirm the declared at-least-one required contract before implementation; if product intent is “all required,” record that as an intentional divergence instead.
- Do not duplicate Checkbox or FormField fixes in the group.
