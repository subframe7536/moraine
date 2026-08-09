# FormField Base UI Parity Plan

## Status

- Audit complete; implementation not started. Audited from the working tree rooted at `3c02b36` on 2026-08-09.
- Reference revisions are fixed at Base UI 3011fba8f and Kobalte 2e8ce473.

## Goal

Make FormField's label, description, help, error, control registration, Formisch binding, validation, and SSR behavior predictable across every Moraine form control while retaining the current high-level wrapper API.

## Local Surface

- Primary source: src/forms/form-field/form-field.tsx
- Shared control adapter: src/forms/form-field/form-field-context.ts
- Options/types: src/forms/form-field/form-options.ts
- Styles: src/forms/form-field/form-field.class.ts
- Tests: src/forms/form-field/form-field.test.tsx
- Form integration: src/forms/form/form.tsx and src/forms/form/form-context.ts
- Public component and type surface: FormField, FormFieldProps, FormFieldT members Name, RenderContext, Slot, Variant, Classes, Styles, Item, Base, and Props; form-options interfaces are also exported.

## Upstream References

- Base UI 3011fba8f direct field references: base-ui/packages/react/src/field and base-ui/packages/react/src/fieldset; consult root, label, description, error, control, validity, item, legend, and their tests.
- Base UI form integration: base-ui/packages/react/src/form.
- Kobalte 2e8ce473 direct Solid field reference: kobalte/packages/core/src/form-control, especially create-form-control.tsx, create-form-control-field.tsx, label/description/error-message, context, and tests.
- Historical Moraine commits may explain registration decisions but are evidence only.

## Audit and Implementation

1. Create a control-consumer matrix and an upstream-cited gap ledger. Classify behavior for Input, Textarea, Checkbox, CheckboxGroup, RadioGroup, Switch, Slider, InputNumber, FileUpload, Select, and MultiSelect.
2. Audit control registration: mount/unmount cleanup, last bound control selection, formFieldBind=false, multiple controls in one field, conditional controls, ID changes, reordered controls, nested providers, and label target fallback.
3. Audit ARIA composition: stable control/label/description/help/error IDs, token de-duplication, aria-describedby ordering, aria-errormessage/aria-invalid policy, required/disabled/readonly inheritance, group labelling, and no stale IDs when branches disappear.
4. Audit validation and Formisch integration: field path normalization including numeric segments, initial-value precedence, error false/manual/Formisch precedence, touched/dirty/focus/input/change events, disabled fields, field unmount, and reactive path changes.
5. Audit JSX/render behavior: children render context, getter-backed label/description/hint/help/error values, exact single evaluation, empty strings/booleans/JSX, help-to-error switching, and errors that appear after hydration.
6. Audit native behavior through consumers: label click reaches the actual control, required validity is owned by the native proxy/control, repeated names serialize correctly, reset restores defaults, and field wrappers do not create invalid nested label/fieldset markup.
7. Audit SSR/hydration: deterministic useId output, identical registered-control order, no branch instantiation merely to inspect JSX, stable provider ownership, and renderToString-to-hydrate interaction.
8. Port fixes into form-field-context or FormField only when the invariant is genuinely shared. Keep component-specific serialization and keyboard rules in the consumer.
9. Any conditional JSX change must pass getter-backed single-evaluation tests and hydration tests covering label target, described-by IDs, and help/error branch order.

## Public API

- Preserve FormField, FormFieldProps, FormFieldT, form option interfaces, render context, and slot names by default.
- Do not copy Base UI/Kobalte compound APIs, primitive decomposition, polymorphism beyond the existing as prop, validation API, styling, or animations.
- A public change requires evidence that all current controls cannot express correct behavior otherwise; document migration and intentional differences.

## Test Plan

- Focused: bun run test src/forms/form-field/form-field.test.tsx
- Form boundary: bun run test src/forms/form/form.test.tsx
- Consumer matrix: bun run test src/forms/input/input.test.tsx src/forms/textarea/textarea.test.tsx src/forms/checkbox/checkbox.test.tsx src/forms/radio-group/radio-group.test.tsx
- Overlay/select consumers after context changes: bun run test src/forms/select/select.test.tsx src/forms/select/multi-select.test.tsx
- Final touched slice: bun run typecheck
- Add registration reorder/unmount tests, multiple-control tests, ARIA token tests, error precedence, nested paths, native label activation, reset/serialization smoke tests, JSX single evaluation, and hydration.

## Completion Criteria

- Every public form control has a classified FormField integration row.
- Registration, ARIA linkage, Formisch event/value flow, validation, and SSR behavior are tested.
- FormField, Form, representative native/group/select consumers, and typecheck pass.
- Component-specific behavior has not leaked into the shared field context.

## Dependencies/Handoff

- This is a shared prerequisite for all form component parity work; publish its invariant decisions before consumers independently compensate for gaps.
- Coordinate any useId, render-prop, or context-provider change with shared infrastructure owners.
- Handoff must include the consumer matrix, registration/ID invariants, Formisch event contract, test results, intentional divergences, and any control still requiring follow-up.

## Verified Missing Features

1. **Required state is visual-only.** `FormFieldContextOptions` has no required accessor and `useFormField` does not inherit it, although documented usage places `required` on `FormField`. Base Field and Kobalte FormControl propagate required state. Priority P0, medium, high fan-out; owner: FormField foundation.
2. **`aria-describedby` can reference nodes that are not mounted.** `useFormField.ariaAttrs` includes error for `error={true}`, hint without a label, and help while a rendered error replaces help. Priority P0, medium, high accessibility impact; owner: FormField foundation.
3. **Group controls are not labelled by the FormField label.** Bind-false controls never become `resolvedLabelTargetId`; the label has no reusable ID and context exposes no `aria-labelledby`. This affects CheckboxGroup, RadioGroup, Select, MultiSelect, and Slider. Priority P0, medium, high fan-out; owner: FormField foundation.
4. **A name supplied after mount never creates a Formisch field.** `useField` is called only when the untracked initial path exists. Formisch accepts a reactive config once the hook exists, but Solid hooks cannot be conditionally created later. Priority P1, medium, high lifecycle risk; owner: FormField.
5. **Custom controls cannot notify Formisch's change validation path.** `useFormField.emit` returns when no native event is supplied, but Checkbox, Switch, RadioGroup, Slider, and Select-family controls call `emit('change')`/`emit('input')` without one. `setFormValue` reaches Formisch's input policy only, so change-triggered validation is skipped. Priority P0, medium, high fan-out; owner: FormField foundation.
6. **Children and message JSX lack the complete SSR gate.** `merged.children` is rendered directly; truthy `<Show>` checks omit numeric zero and there is no hydration fixture for registration order. Priority P1, medium; owner: FormField.

## Detailed Execution Plan

1. Add a consumer matrix test that mounts every public control under `FormField required`, separates labelable from group controls, and proves local control props override inherited state only where documented.
2. Introduce shared accessors for `required`, `labelId`, and the exact mounted message IDs. Make `ariaAttrs()` return deduplicated, DOM-order tokens and never reference absent nodes; keep native `label[for]` only for a registered labelable control.
3. Add group labelling smoke tests for CheckboxGroup, RadioGroup, Select/MultiSelect, and Slider. Consumers should use shared `ariaAttrs()`; do not create component-specific label IDs.
4. Define event-less custom-control notification methods that invoke Formisch's input/change policies exactly once without manufacturing DOM events. Add validation-mode tests across Checkbox, Switch, RadioGroup, Slider, and Select.
5. Decide reactive-path ownership before code: either require a path at mount and document/test that invariant, or create an always-present adapter supported by Formisch. Add path change, unmount, reorder, and nested-provider tests for the chosen rule.
6. Cache every JSX prop once per owner, use explicit presence predicates, and add render-to-string/hydrate coverage that compares control registration, label target, and help/error branch order.
7. Update the matrix first for the shared invariant, then implement consumer adoption in dependency order and run all suites in this plan plus `bun run typecheck`.

## STOP Conditions

- Stop consumer work if a required, label, message-ID, or registration defect is still shared; fix and freeze this plan first.
- Do not call `useField` conditionally from a reactive effect. If Formisch cannot support late path creation safely, record the mount-time path rule as an intentional divergence with installed-source evidence.
