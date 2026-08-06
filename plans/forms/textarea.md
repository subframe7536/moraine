# Textarea Base UI Parity Plan

## Status

- Ready for audit and implementation after Input modifier and FormField semantics are stable.
- Reference revisions are fixed at Base UI 3011fba8f and Kobalte 2e8ce473.

## Goal

Harden Textarea's native editing, controlled value, modifiers, autoresize, form, accessibility, pointer/focus, browser, and SSR behavior using the closest pinned prior art while preserving Moraine's header/footer and autoresize API.

## Local Surface

- Source: src/forms/textarea/textarea.tsx
- Styles: src/forms/textarea/textarea.class.ts
- Tests: src/forms/textarea/textarea.test.tsx
- Value processing: src/shared/input-modifiers.ts
- Field integration: src/forms/form-field/form-field-context.ts
- Public component and type surface: Textarea, TextareaProps, and TextareaT members Value, Slot, Variant, Classes, Styles, Item, Base, and Props.
- Behavior in scope includes value/defaultValue, trim/lazy/number modifiers, native input/change, header/footer pointer focus, autofocus, autoResize/rows/maxRows, FormField integration, validation, reset, and hydration.

## Upstream References

- Base UI 3011fba8f has no dedicated Textarea counterpart. Use base-ui/packages/react/src/input for native event/data-state conventions and base-ui/packages/react/src/field for label, validation, and ARIA behavior only.
- Kobalte 2e8ce473 direct Solid reference: kobalte/packages/core/src/text-field, especially text-field-root.tsx, text-field-text-area.tsx, context, and text-field.test.tsx.
- Native HTMLTextAreaElement behavior is authoritative for editing, form serialization, validity, selection, and reset. Historical Moraine commits are evidence only.

## Audit and Implementation

1. Build a gap ledger separating native textarea behavior, shared Input modifier behavior, local autoresize/wrapper behavior, and unverified browser layout behavior.
2. Audit native editing: input/change timing, IME composition, paste, multiline/newline normalization, selection/caret, value/defaultValue, maxLength, spellcheck/autocomplete forwarding, programmatic updates, and reset.
3. Audit controlled state and modifiers: FormField/default precedence, controlled rollback, trim DOM synchronization, lazy commit, number conversion policy for multiline text, empty values, reactive modifier changes, and exact callback count/order.
4. Audit autoresize: initial mount, value/default/controlled updates, user input, font/style/width changes, scrollHeight measurement, box sizing/padding/border, min rows and maxRows, empty/trailing newline, hidden/detached elements, ResizeObserver/font readiness if needed, cleanup, and delay races.
5. Audit keyboard/focus/pointer: preserve all native multiline keys, wrapper/header/footer primary-pointer focus, do not steal focus from nested interactive elements, prevented events, autofocus timing/cleanup, and readOnly/disabled focus rules.
6. Audit native form/validation/ARIA: multiline FormData normalization, disabled omission, readOnly submission, required/maxLength validity, reset, label/described-by/error links, invalid state, and no redundant role.
7. Audit SSR/hydration: textarea children/value serialization differences, stable initial rows and slot order, no layout measurement/server timers, no hydration clobber of user-entered text, deterministic IDs, and delayed resize cleanup.
8. Port editing/modifier fixes through shared input-modifiers when Input must match; keep measurement-specific logic local and reduce branching through one resize calculation path.
9. Conditional header/footer/error-related JSX changes require getter-backed single-evaluation and renderToString-to-hydrate tests for absent/present slots and initial value.

## Public API

- Preserve Textarea, TextareaProps, TextareaT.Value, modifier callbacks, autoresize/header/footer props, native attributes, variants, and slots.
- Do not copy Base UI/Kobalte APIs, compound primitives, styling, spacing, or animations.
- Add no measurement API unless a proven correctness gap cannot be resolved internally; record browser-only limitations explicitly.

## Test Plan

- Focused: bun run test src/forms/textarea/textarea.test.tsx
- Shared text behavior: bun run test src/forms/input/input.test.tsx
- Modifier helper tests: run the focused test file for src/shared/input-modifiers.ts when present.
- Form integration: bun run test src/forms/form-field/form-field.test.tsx src/forms/form/form.test.tsx
- Final touched slice: bun run typecheck
- Add IME/newline/control/reset/FormData cases, modifier callback ordering, autoresize measurement boundaries and cleanup, wrapper pointer focus, nested controls, ARIA links, JSX single evaluation, and hydration. Mark real layout/font/browser checks unverified-platform if only simulated.

## Completion Criteria

- Native editing, modifier, autoresize, form, ARIA, platform, and SSR behavior is evidence-classified.
- Every ported gap has a regression test; layout behavior not provable in jsdom is explicit.
- Textarea, Input, FormField, Form, and typecheck pass.
- Shared modifier behavior is not duplicated and autoresize side effects are fully cleaned up.

## Dependencies/Handoff

- Depends on the shared Input modifier/event contract and FormField ARIA/value rules.
- Coordinate input-modifiers changes with Input; coordinate useId or hydration changes with FormField.
- Handoff must include the autoresize measurement/trigger policy, event ordering, native form/reset results, browser caveats, test results, and unverified-platform items.
