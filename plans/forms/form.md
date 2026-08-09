# Form Base UI Parity Plan

## Status

- Audit complete; implementation not started. Audited from the working tree rooted at `3c02b36` on 2026-08-09.
- Reference revisions are fixed at Base UI 3011fba8f and Kobalte 2e8ce473.

## Goal

Audit Moraine's Formisch-backed Form boundary for native submission, validation, reset, event, accessibility, controlled store, and SSR correctness while preserving Formisch as the state/validation engine.

## Local Surface

- Source: src/forms/form/form.tsx
- Context: src/forms/form/form-context.ts
- Tests: src/forms/form/form.test.tsx
- Downstream integration: src/forms/form-field/form-field.tsx and src/forms/form-field/form-field-context.ts
- Public component and type surface: Form, FormProps, FormT members Slot, Variant, Classes, Styles, Item, Base, and Props; src/forms/form/index.ts also re-exports createForm and selected Formisch types.
- Behavior in scope includes FormProvider lifetime, of store forwarding, native form props, validated onSubmit, submitting state, error propagation, nested field paths, and control initial values.

## Upstream References

- Base UI 3011fba8f direct behavioral reference: base-ui/packages/react/src/form, especially Form.tsx, Form.test.tsx, and Form.spec.tsx.
- Kobalte 2e8ce473 has no form store/submission component counterpart. Use kobalte/packages/core/src/form-control only for Solid field association patterns, not for Formisch lifecycle or submit policy.
- Formisch source/types at the installed repository version remain the authority for the local store contract. Historical Moraine commits are evidence only.

## Audit and Implementation

1. Build a gap ledger that separates Base UI native-form behavior, Formisch-defined behavior, local adapter behavior, and intentional differences.
2. Audit submission: submitter preservation, preventDefault rules, invalid forms, synchronous/async handlers, repeated submission, isSubmitting transitions, thrown/rejected handlers, callback arguments/order, and native event forwarding.
3. Audit native validation and serialization across Moraine controls: disabled omission, required controls, repeated names, scalar/array/file values, readOnly submission, browser invalid events, and FormData order.
4. Audit reset: native form.reset, Formisch store reset, component default values, dirty/touched/error state, callbacks, and controlled controls that cannot be reset locally.
5. Audit FormProvider/context lifetime: nested forms, controls outside FormField, fields mounted/unmounted or reordered, nested numeric paths, initial value precedence, and no cross-form context leakage.
6. Audit ARIA/error behavior at the boundary: preserve native form semantics, do not add redundant roles, ensure invalid fields link to messages, and ensure submitting state does not silently disable submission unless the local contract says so.
7. Audit SSR/hydration: the same form element, provider/store ownership, stable IDs and initial errors, no client-only initial mutation before hydration, and safe async state after unmount.
8. Port only adapter-level fixes. Do not reimplement Formisch validation/store behavior in Moraine; raise an upstream limitation or intentional divergence where the adapter cannot safely change it.
9. If conditional JSX/provider behavior changes, add single-evaluation and renderToString-to-hydrate coverage before interactive submission.

## Public API

- Preserve Form, FormProps, FormT, createForm and the existing Formisch type re-exports.
- Keep the current validated onSubmit payload and native prop forwarding unless a proven correctness defect requires a breaking pre-alpha fix.
- Do not copy Base UI APIs, Kobalte composition, styling, or validation architecture.

## Test Plan

- Focused: bun run test src/forms/form/form.test.tsx
- Field integration: bun run test src/forms/form-field/form-field.test.tsx
- Representative native controls: bun run test src/forms/input/input.test.tsx src/forms/checkbox/checkbox.test.tsx src/forms/select/select.test.tsx src/forms/select/multi-select.test.tsx
- Final touched slice: bun run typecheck
- Add cases for valid/invalid submit, submitter/event order, async rejection cleanup, reset, repeated names, native FormData, nested paths, provider isolation, and SSR/hydration.

## Completion Criteria

- Base UI, Formisch, and local adapter responsibilities are explicitly classified.
- Submission, reset, validation, serialization, context, and SSR gaps have tests or documented intentional differences.
- Form, FormField, representative controls, and typecheck pass.
- No duplicate validation engine or upstream API layer is introduced.

## Dependencies/Handoff

- Complete the FormField context audit alongside this plan when shared registration, error, or initial-value behavior changes.
- Coordinate control-specific native serialization fixes with their component plans instead of embedding them in Form.
- Handoff must list Formisch-version assumptions, adapter-only changes, representative consumer results, error/async policy, and remaining browser validation.

## Verified Missing Features

1. **Native reset does not reset the Formisch store.** The installed `@formisch/solid@1.0.0-rc.0` `Form` only wires submit; its exported `reset` mutates store state separately. Moraine forwards `onReset` without coordinating the store, so DOM values and Formisch input/dirty/touched/errors can diverge. Priority P0, medium, medium risk; owner: Form adapter.
2. **Submit lifecycle is barely characterized locally.** Formisch's `handleSubmit` prevents default, validates with `shouldFocus: true`, catches handler errors into form errors, and clears `isSubmitting` in `finally`, while Moraine tests only the happy path and initial errors. Priority P1 coverage, medium; owner: Form adapter tests, with no engine rewrite.
3. **Provider isolation and hydration are untested.** Nested forms, remounted stores, and render-to-string/hydrate have no regression coverage, so a context or conditional-provider change could leak field ownership. Priority P1 coverage, small; owner: Form.

Base UI's field-registration API and native-validation architecture are intentional divergences because Moraine's public contract is Formisch-backed and Formisch sets `novalidate`.

## Detailed Execution Plan

1. Add adapter tests for invalid submit suppression and first-error focus, sync and async submission, rejected handlers, duplicate submissions, native submitter preservation, and exact `data-submitting` transitions. Assert the installed Formisch behavior rather than duplicating it.
2. Add a failing native `form.reset()` test covering Input plus one collection control; require the store input, dirty/touched/errors, rendered control, and caller `onReset` order to converge exactly once.
3. Wire reset in `src/forms/form/form.tsx` by composing the caller handler and Formisch's exported `reset(local.of)` only when the native reset was not prevented. Keep the change in the adapter.
4. Add nested-provider/remount and SSR/hydration tests. Use stable store instances on server and client and verify the first submit reaches only its owning form.
5. Update `parity-matrix.md`; run the Form, FormField, Input, Checkbox, Select, and MultiSelect suites listed above, then `bun run typecheck` and `git diff --check`.

## STOP Conditions

- Do not recreate Formisch validation, error capture, focus ordering, or submitting state.
- If `reset()` cannot be composed without changing the documented caller `onReset` contract, stop and document the required API decision before implementation.
