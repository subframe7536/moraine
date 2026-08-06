# Input Base UI Parity Plan

## Status

- Ready for audit and implementation after shared FormField rules are published.
- Reference revisions are fixed at Base UI 3011fba8f and Kobalte 2e8ce473.

## Goal

Align Input's native text-entry, event, controlled value, modifier, accessibility, form, pointer, browser, and SSR behavior with pinned prior art while preserving Moraine's wrapper, icon/loading slots, and FormField integration.

## Local Surface

- Source: src/forms/input/input.tsx
- Styles: src/forms/input/input.class.ts
- Tests: src/forms/input/input.test.tsx
- Value processing: src/shared/input-modifiers.ts
- Field integration: src/forms/form-field/form-field-context.ts
- Public component and type surface: Input, InputProps, and InputT members Value, Slot, Variant, Classes, Styles, Item, Base, and Props.
- Behavior in scope includes native input types/attributes, value/defaultValue, trim/lazy/number modifiers, onInput/onValueChange/onChange ordering, autofocus delay, wrapper pointer focus, icons/loading, and FormField value/events.

## Upstream References

- Base UI 3011fba8f direct counterpart: base-ui/packages/react/src/input, especially Input.tsx, Input.test.tsx, Input.spec.tsx, and InputDataAttributes.ts.
- Base UI field behavior: base-ui/packages/react/src/field.
- Kobalte 2e8ce473 direct Solid text-field reference: kobalte/packages/core/src/text-field, especially text-field-root.tsx, text-field-input.tsx, context, and text-field.test.tsx.
- Historical Moraine commits are supporting evidence only.

## Audit and Implementation

1. Build an upstream-cited gap ledger covering native DOM, field integration, and Moraine-only modifier/wrapper behavior.
2. Audit native text entry: input/change event timing, IME composition, paste, programmatic value changes, empty values, number-like strings, browser normalization by input type, maxLength, autocomplete, and form reset.
3. Audit controlled state and modifiers: value/defaultValue precedence, FormField initial value, controlled DOM rollback, trim synchronization, lazy commit timing, number conversion, empty-value policy, reactive modifier changes, and exact callback count/order.
4. Audit form and validation: name/value FormData output, disabled omission, readOnly submission, required/type validity, reset to defaults, invalid/described-by attributes, and Formisch input/change/focus/blur emissions.
5. Audit ARIA/native semantics: avoid redundant roles, preserve label click targeting, propagate required/disabled/readonly/invalid, compose description/error IDs, and ensure decorative loading/icons are not announced as duplicate names.
6. Audit keyboard/focus/pointer behavior: native keyboard editing remains untouched, wrapper primary-pointer focus, selection/caret preservation, nested interactive children, prevented pointer handlers, autofocus timing/cleanup, and disabled/readOnly focus rules.
7. Audit SSR/browser behavior: stable value/defaultValue markup, no mount-time focus on the server, hydration without value clobbering, password/file input restrictions, mobile input type quirks, and autofill. Mark browser-only paths unverified-platform when jsdom cannot prove them.
8. Port the smallest changes through native behavior and existing modifier helpers. Do not create a parallel input state machine for cases the browser already owns.
9. If icon/loading/children conditional JSX changes, add getter-backed single-evaluation and renderToString-to-hydrate tests for slot order and initial input value.

## Public API

- Preserve Input, InputProps, InputT.Value, modifier contract, callback payloads, native attribute props, and slots.
- Do not copy Base UI/Kobalte APIs, primitive decomposition, styling, spacing, or animations.
- Any public change must be minimal and justified by a behavior impossible to fix through current native props/helpers.

## Test Plan

- Focused: bun run test src/forms/input/input.test.tsx
- Modifier helper tests: run the focused test file for src/shared/input-modifiers.ts when present.
- Field/form integration: bun run test src/forms/form-field/form-field.test.tsx src/forms/form/form.test.tsx
- Similar text control: bun run test src/forms/textarea/textarea.test.tsx
- Final touched slice: bun run typecheck
- Add IME/input/change ordering, controlled rollback, reset/FormData/validity, wrapper pointer focus, nested interactive child, autofocus cleanup, ARIA linkage, SSR/hydration, and relevant input-type cases.

## Completion Criteria

- Native, modifier, field, platform, and SSR behavior is fully classified.
- Every ported gap has a regression test and browser-only uncertainty is explicit.
- Input, Textarea, FormField, Form, and typecheck pass.
- Native browser behavior remains the primary implementation mechanism.

## Dependencies/Handoff

- Depends on stable FormField value/event and ARIA-composition invariants.
- Coordinate input-modifier changes with Textarea; both must share one conversion and callback contract.
- Handoff must include event ordering, controlled precedence, native validation/reset results, platform caveats, and test output.
