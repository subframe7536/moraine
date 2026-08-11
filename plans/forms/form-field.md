# FormField Base UI Parity Plan

## Status

- Implementation complete on 2026-08-11 from the working tree rooted at `3c02b36`.
- Reference revisions are fixed at Base UI `3011fba8f` and Kobalte `2e8ce473`.
- Focused FormField coverage passes 29/29; Form and all 11 consumer suites pass 348/348.

## Goal

Make FormField's label, description, help, error, control registration, Formisch binding, validation, and SSR behavior predictable across every Moraine form control while retaining the current high-level wrapper API.

## Local Surface

- Primary source: `src/forms/form-field/form-field.tsx`
- Shared control adapter: `src/forms/form-field/form-field-context.ts`
- SSR fixture: `src/forms/form-field/form-field.ssr.fixture.tsx`
- Tests: `src/forms/form-field/form-field.test.tsx`
- Form integration: `src/forms/form/form.tsx` and `src/forms/form/form-context.ts`
- Consumer adoption: Input, Textarea, Checkbox, CheckboxGroup, RadioGroup, Switch, Slider, InputNumber, FileUpload, Select, and MultiSelect.

## Upstream Evidence

- Base UI `field/root/FieldRoot.tsx`, `field/control/FieldControl.tsx`, `field/root/useFieldValidation.ts`, and `fieldset/root/FieldsetRoot.tsx` establish live control registration, required state, label ownership, exact mounted descriptions/errors, and group labelling.
- Base UI field, fieldset, and form tests cover control replacement, registration cleanup, first-invalid focus, empty message IDs, and SSR label registration.
- Kobalte `form-control/create-form-control.tsx` and `create-form-control-field.tsx` establish reactive required state, generated part IDs, cleanup-backed registration, and composed `aria-labelledby`/`aria-describedby`.
- Kobalte intentionally uses `aria-describedby` for errors because `aria-errormessage` support remains incomplete in VoiceOver and NVDA; Moraine keeps that compatible policy.
- Installed Formisch `useField` owns field values, input/change/blur validation policies, element registration, and first-error focus.

## Implemented Invariants

1. Every consumer keeps its own ID. FormField registers `{ id, bind }` accessors, selects the last currently bound control, updates after ID/reorder/unmount changes, and isolates nested providers.
2. Bound controls register their actual element with Formisch, restoring first-invalid focus. Bind-false group/select controls receive the shared label through `aria-labelledby` without creating a fake native `for` target.
3. `required` inherits from FormField unless a consumer explicitly supplies `false`. Native inputs/proxies retain constraint ownership; group components expose their existing group-level ARIA semantics.
4. ARIA references contain only mounted IDs in DOM order: hint, description, then error or help. Error replaces help without stale tokens; boolean errors mark invalid without referencing an absent node; numeric zero remains valid JSX.
5. Event-less custom controls call Formisch's change path exactly once after publishing their value through the input path. No synthetic DOM event is manufactured.
6. A path present at mount remains reactive, including numeric segments. An absent initial path intentionally creates no Formisch field; adding a name later updates native naming but remains unbound.
7. Label, description, hint, help, error, and children are cached in their owning component. Component/render children mount once and remain reactive through the context getter.
8. Children resolve inside FormFieldProvider before the root tree is serialized. The selected-control accessor reads the live registry directly so SSR emits the final label target, and hydration reuses the form, root, label, input, and message order.

## Consumer Matrix

| Consumer      | Binding/label target                                           | Required owner                          | Verified outcome                                             |
| ------------- | -------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------ |
| Input         | Bound native input; `label[for]` plus shared ARIA              | Native input                            | Inherits required; explicit `false` wins                     |
| Textarea      | Bound native textarea                                          | Native textarea                         | Inherits required; explicit `false` wins                     |
| Checkbox      | Bound visible checkbox control; hidden native input serializes | Hidden native checkbox                  | Visible control receives shared ARIA                         |
| CheckboxGroup | Bind-false fieldset                                            | Existing dynamic enabled checkbox owner | Fieldset receives shared label and group required state      |
| RadioGroup    | Bind-false radiogroup                                          | Native radio inputs                     | Radiogroup receives shared label and required state          |
| Switch        | Bound visible switch control; hidden native input serializes   | Hidden native checkbox                  | Visible switch receives shared ARIA                          |
| Slider        | Bound native range input plus labelled visible group           | Native range input(s)                   | Group and thumbs expose inherited state                      |
| InputNumber   | Bound spinbutton input                                         | Native input                            | Inherits required; explicit `false` wins                     |
| FileUpload    | Bound file input plus labelled visible control                 | Native file input                       | Shared label/description reach the visible control and input |
| Select        | Bind-false combobox                                            | Hidden native select                    | Combobox receives shared label and inherited required state  |
| MultiSelect   | Bind-false combobox                                            | Hidden multiple select                  | Combobox receives shared label and inherited required state  |

## Intentional Divergences

- Moraine keeps its single comprehensive FormField wrapper and Formisch store instead of copying Base UI/Kobalte compound APIs or validation state machines.
- FormField does not add disabled or readonly wrapper props in this sweep. Those remain explicit consumer states, avoiding a new public contract while required keeps its already documented wrapper ownership.
- A missing path at mount remains unbound. Solid hooks cannot be created conditionally after mount, and calling `useField` from an effect would violate owner and cleanup rules.
- Errors remain in `aria-describedby`, matching Kobalte's assistive-technology compatibility choice instead of adding `aria-errormessage`.

## Validation

- `bun run test src/forms/form-field/form-field.test.tsx` — 29/29.
- Serial SSR dependencies: Form 10/10, Checkbox 28/28, CheckboxGroup 25/25, FileUpload 33/33.
- Remaining consumers: Input, Textarea, Switch, RadioGroup, InputNumber, Slider, Select, and MultiSelect — 252/252.
- `bun run typecheck` and targeted oxlint pass.
- Production browser hydration and assistive-technology announcements remain `unverified-platform`; the existing docs build is blocked by the unrelated server import of client-only `solid-toaster`.

## Completion Criteria

- Every public form control has a classified FormField integration row.
- Registration, required inheritance, ARIA linkage, Formisch event/value flow, reactive mount-time paths, and SSR hydration are covered.
- Shared invariants stay in FormField/context; serialization and component-specific interaction remain in each consumer.
- No public API was added, and no unclassified parity gap remains for this plan.
