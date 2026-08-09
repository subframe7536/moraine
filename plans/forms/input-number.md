# InputNumber Base UI Parity Plan

## Status

- Audit complete; implementation not started. Audited from the working tree rooted at `3c02b36` on 2026-08-09.
- Reference revisions are fixed at Base UI 3011fba8f and Kobalte 2e8ce473.

## Goal

Align InputNumber's spinbutton editing, locale parsing/formatting, stepping, hold-repeat, wheel, form, ARIA, controlled-state, platform, and SSR behavior without replacing Moraine's high-level number input API.

## Local Surface

- Source: src/forms/input-number/input-number.tsx
- Styles: src/forms/input-number/input-number.class.ts
- Tests: src/forms/input-number/input-number.test.tsx
- Shared dependencies: src/shared/use-controllable-value.ts and src/forms/form-field/form-field-context.ts
- Public component and type surface: InputNumber, InputNumberProps, and InputNumberT members Slot, Variant, Classes, Styles, Item, Base, and Props.
- Behavior in scope includes value/defaultValue/rawValue precedence, locale parsing, partial input, min/max/step/largeStep, keyboard/wheel, increment/decrement buttons, touch/mouse/pen hold repeat, callbacks, native serialization, and reset.

## Upstream References

- Base UI 3011fba8f direct counterpart: base-ui/packages/react/src/number-field, including root, input, increment, decrement, group, scrub-area, utils, and tests in those directories.
- Kobalte 2e8ce473 direct counterpart: kobalte/packages/core/src/number-field, especially root/input/triggers/hidden input and number-field.test.tsx.
- Kobalte spinbutton behavior: kobalte/packages/core/src/spin-button, especially spin-button-root.tsx and spin-button.test.tsx.
- Historical Moraine commits are evidence only.

## Audit and Implementation

1. Create a gap ledger separating editable text state, committed numeric state, form value, and controlled props; cite upstream source/tests for every classification.
2. Audit parsing/formatting: locale decimal/group/minus characters, whitespace, empty and partial tokens, pasted text, scientific notation policy, NaN/infinity, negative zero, precision drift, step snapping, formatting on blur, and locale changes while focused.
3. Audit controlled state: rawValue precedence over value, default snapshot, external updates during editing, controlled rollback, min/max prop changes, no-op updates, callback payload/count/order, and FormField value ownership.
4. Audit keyboard: ArrowUp/Down, PageUp/Down, Home/End, modifier keys if upstream supports them, prevented default, readOnly/disabled, boundaries, partial text commit, and focus retention.
5. Audit pointer/touch/pen: one click versus hold repeat, delay/interval/throttle, pointer capture/cancel/leave/lost capture, synthetic click suppression, context menu, document selection restoration, multiple simultaneous pointers, unmount cleanup, and consumer handler cancellation.
6. Audit wheel behavior: focused-only activation, delta direction, passive/cancelable events, disabled/readOnly, trackpad deltas, boundary no-op, and default wheel-off policy.
7. Audit native form/ARIA: text input serialization, disabled omission, readOnly submission, required validity, reset, role=spinbutton, aria-valuemin/max/now/text, labels/descriptions/errors, and disabled stepper naming.
8. Audit SSR/hydration: deterministic locale output, no document/timers on server, identical control order by orientation, no pre-hydration input clobber, and cleanup of timers/selection styles.
9. Port small equivalent behaviors into existing helpers/state. If conditional control JSX changes, add single-evaluation and renderToString-to-hydrate tests for both orientations and hidden controls.

## Public API

- Preserve InputNumber, InputNumberProps, value/rawValue callback contracts, locale and repeat options, and slots by default.
- Do not copy Base UI/Kobalte compound primitives, scrub-area API, styling, or animations.
- Record unsupported upstream features as intentional differences unless required for correctness under the current API.

## Test Plan

- Focused: bun run test src/forms/input-number/input-number.test.tsx
- Shared controlled-state tests: run the focused test file for src/shared/use-controllable-value.ts when present.
- Field/form integration: bun run test src/forms/form-field/form-field.test.tsx src/forms/form/form.test.tsx
- Related stepping semantics: bun run test src/forms/slider/slider.test.tsx
- Final touched slice: bun run typecheck
- Add locale edge cases, controlled external updates during partial entry, exact callbacks, all keyboard boundaries, pointer cancellation/lost capture/unmount, wheel guards, native reset/FormData/validity, ARIA value text, and hydration.

## Completion Criteria

- Text, numeric, form, and controlled-state layers have explicit invariants and evidence.
- Keyboard, pointer repeat, wheel, locale, native form, ARIA, and SSR gaps are tested or documented.
- InputNumber, FormField, Slider smoke tests, and typecheck pass.
- Timers, pointer state, and document selection styles cannot leak after interruption or unmount.

## Dependencies/Handoff

- Coordinate useControllableValue and FormField changes with Checkbox/Switch/Slider owners.
- Do not modify shared pointer infrastructure without checking Button consumers of the stepper controls.
- Handoff must describe value precedence, parse/commit policy, repeat state machine, form representation, test results, and unverified real-device behavior.

## Verified Missing Features

1. **Uncontrolled SSR starts with an empty display.** `inputText` initializes to `''` and is populated by an effect, which does not run during server rendering. Priority P0, medium, high hydration risk; owner: InputNumber.
2. **Binary floating-point noise is exposed.** Stepping uses direct JavaScript addition/subtraction; Base UI explicitly tests decimal cleanup. Priority P0, medium; owner: InputNumber.
3. **Stepping ignores parseable dirty text.** Keyboard and steppers use committed numeric state instead of the current input text, unlike Base UI's dirty-input cases. Priority P0, medium; owner: InputNumber.
4. **Boundary no-ops still emit changes.** `commitValue` calls field/onChange even when clamping produces the current value. Priority P1, small; owner: InputNumber.
5. **Spinbutton relationships are incomplete.** Formatted `aria-valuetext` and stepper `aria-controls` are absent; Kobalte/Base UI expose these relationships. Priority P1, small; owner: InputNumber.
6. **Wheel gating is inverted for disabled or unfocused states.** The current conjunction can fall through, prevent default, and step when wheel handling should be inactive. Priority P0, small; owner: InputNumber.
7. **Native reset does not restore numeric/display state.** Priority P1, medium; owner: InputNumber plus Form.

## Detailed Execution Plan

1. Add failing SSR/hydration tests for default/controlled values, locale formatting, negative values, and first key/blur interaction.
2. Add table-driven decimal-step tests, including 0.1 increments, exponent-sized steps, min/max clamping, and no-op callback counts. Normalize to the maximum relevant decimal precision without rounding unrelated existing digits.
3. Define one parse/commit path used by blur, Enter, Arrow keys, wheel, and steppers; it must consume a parseable dirty display before stepping and preserve invalid partial text until commit.
4. Fix wheel eligibility to require enabled wheel handling, focus, and an enabled writable field before cancellation. Add boundary and modifier tests.
5. Add formatted `aria-valuetext`, stable `aria-controls`, reset/FormData/FormField synchronization, and caller-event ordering tests.
6. Update the matrix; run InputNumber, FormField, Form, SSR, typecheck, and diff checks.

## STOP Conditions

- Decide and document behavior for inverted bounds or non-finite `step` before implementing those cases; do not silently invent an API rule.
- Keep actual iOS keyboard presentation as `unverified-platform`; source guards may be unit-tested, but jsdom is not device proof.
