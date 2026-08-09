# Switch Base UI Parity Plan

## Status

- Audit complete; implementation not started. Audited from the working tree rooted at `3c02b36` on 2026-08-09.
- Reference revisions are fixed at Base UI 3011fba8f and Kobalte 2e8ce473.

## Goal

Audit and port missing Switch keyboard, pointer, ARIA, native form, controlled-state, reset, loading, platform, and SSR behavior while preserving Moraine's high-level switch API and custom true/false values.

## Local Surface

- Source: src/forms/switch/switch.tsx
- Styles: src/forms/switch/switch.class.ts
- Tests: src/forms/switch/switch.test.tsx
- Shared dependencies: src/shared/hidden-input.tsx, src/shared/use-controllable-value.ts, src/shared/use-event-listener.ts, and src/forms/form-field/form-field-context.ts
- Public component and type surface: Switch, SwitchProps, and SwitchT members Slot, Variant, Classes, Styles, Item, Base, and Props.
- Behavior in scope includes checked/defaultChecked, trueValue/falseValue, loading, hidden native checkbox submission, label/description, readOnly/disabled, pointer focus behavior, callbacks, and reset.

## Upstream References

- Base UI 3011fba8f direct counterpart: base-ui/packages/react/src/switch, especially root, thumb, state attribute mapping, and enum-sync/tests.
- Kobalte 2e8ce473 direct Solid counterpart: kobalte/packages/core/src/switch, especially root/control/input/thumb/label/description/error-message and switch.test.tsx.
- Compare base-ui/packages/react/src/checkbox and kobalte/packages/core/src/checkbox only for shared native checkbox/form mechanics.
- Historical Moraine commits are evidence only.

## Audit and Implementation

1. Create a gap ledger distinguishing switch-specific interaction from shared checkbox/hidden-input behavior.
2. Audit keyboard/focus: Space and Enter policy from upstream, native versus role=switch activation, focus target, focus-visible, label activation, disabled/readOnly/loading focusability, and prevented handlers.
3. Audit ARIA/semantics: role=switch, aria-checked, required/disabled/readonly/invalid, label/description/error IDs, track/thumb state attributes, hidden native input visibility, and icon announcement.
4. Audit pointer/touch/click: primary-button behavior, track/root/label hit targets, pointer-down focus preservation, nested interactive content, duplicate native/synthetic activation, consumer cancellation, and touch click ordering.
5. Audit controlled state: checked/default precedence, custom true/false values, external updates, controlled rollback, no-op handling, callback count/order, FormField value ownership, and loading transitions.
6. Audit native form behavior: checked-only name/value serialization, disabled omission, readOnly submission, required validity, reset to defaultChecked, controlled reset behavior, FormData, and browser autofill.
7. Audit loading as a local contract: whether it disables activation and native submission/validity, focus and ARIA implications, visual icon state, and transitions while pressed or focused. Record intentional differences from upstream if no direct equivalent exists.
8. Audit SSR/hydration: deterministic checked/loading DOM, stable IDs, no client-only initial toggle, hidden input and track order, and server-safe reset/event listener setup.
9. Port shared mechanics once where Checkbox also benefits. Conditional indicator/icon JSX changes require getter-backed single evaluation and renderToString-to-hydrate interaction tests.

## Public API

- Preserve Switch, SwitchProps, SwitchT namespace members, custom value mapping, loading/icon props, callbacks, variants, and slots.
- Do not copy upstream compound APIs, primitive decomposition, styling, spacing, or animations.
- Public changes require current-contract correctness evidence and an intentional-divergence note.

## Test Plan

- Focused: bun run test src/forms/switch/switch.test.tsx
- Shared native control: bun run test src/forms/checkbox/checkbox.test.tsx
- Form integration: bun run test src/forms/form-field/form-field.test.tsx src/forms/form/form.test.tsx
- Shared-state changes: run focused tests for src/shared/use-controllable-value.ts and hidden input when present.
- Final touched slice: bun run typecheck
- Add keyboard policy, label/pointer cancellation, custom controlled values, loading transitions, callback order, native FormData/required/reset/autofill, ARIA linkage, JSX evaluation, and hydration.

## Completion Criteria

- Switch-specific and shared checkbox mechanics are separately evidence-classified.
- Keyboard, pointer, controlled/loading, native form, ARIA, reset, and SSR behavior has regression coverage.
- Switch, Checkbox, FormField, and typecheck pass.
- No duplicated hidden-input or controllable-value workaround remains.

## Dependencies/Handoff

- Coordinate shared helper changes with Checkbox and CheckboxGroup owners; establish one checked-state/reset contract.
- FormField owns shared IDs/errors while Switch owns role and activation semantics.
- Handoff must include loading semantics, keyboard/activation policy, custom value/form mapping, shared helper impact, test results, and platform caveats.

## Verified Missing Features

1. **Formisch change-mode validation is skipped.** Switch calls `field.emit('change')` and `field.emit('input')` without events, and the current shared adapter ignores both calls. This is the FormField defect above; Switch needs a consumer regression, not a local workaround. Priority P0 shared blocker.
2. **Caller cancellation and full native key sequencing are unverified.** The focused suite dispatches keydown only; it does not prove Space/Enter keydown-keyup-click ordering, root-handler ordering, or exact controlled callback behavior. Base UI covers complete keyboard sequences and modifiers. Priority P1 coverage, medium; owner: Switch tests.
3. **Label, description, and icon branches read raw props for conditions and lack hydration coverage.** Priority P1, medium SSR risk; owner: Switch.

## Detailed Execution Plan

1. Land FormField's event-less custom-control notification contract, then add Switch validation-mode smoke tests; do not call Formisch internals locally.
2. Add full native key-sequence tests for Space and Enter, modifier propagation, root event order, loading/readOnly/disabled states, and exact controlled `onChange` counts. Change implementation only if these tests expose a mismatch.
3. Extend existing reset coverage to reactive defaults, controlled state, repeated reset, native FormData/validity, and FormField synchronization.
4. Cache every inspected JSX prop and add render-to-string/hydrate tests for checked/loading state and all conditional content.
5. Update the matrix; run Switch, FormField, Form, SSR, and typecheck suites.

## STOP Conditions

- Required inheritance and label IDs are FormField work.
- Do not adopt Base UI compound parts or alter visual track/thumb behavior.
