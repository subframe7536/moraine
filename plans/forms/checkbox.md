# Checkbox Base UI Parity Plan

## Status

- Audit complete; implementation not started. Audited from the working tree rooted at `3c02b36` on 2026-08-09.
- Reference revisions are fixed at Base UI 3011fba8f and Kobalte 2e8ce473.

## Goal

Audit Checkbox against mature upstream behavior and port only missing interaction, accessibility, form, controlled-state, platform, and SSR behavior. Preserve Moraine's comprehensive component API, rendering conventions, and styling.

## Local Surface

- Source: src/forms/checkbox/checkbox.tsx
- Styles: src/forms/checkbox/checkbox.class.ts
- Tests: src/forms/checkbox/checkbox.test.tsx
- Shared behavior: src/shared/hidden-input.tsx, src/shared/use-controllable-value.ts, src/shared/use-event-listener.ts, src/forms/form-field/form-field-context.ts
- Public component and type surface: Checkbox, CheckboxProps, and CheckboxT members Slot, Variant, Classes, Styles, Item, Base, and Props.
- Behavior in scope includes custom trueValue/falseValue mapping, checked/defaultChecked/indeterminate, readOnly, card-root activation, hidden native checkbox submission, reset, and FormField binding.

## Upstream References

- Base UI 3011fba8f: base-ui/packages/react/src/checkbox, especially root and indicator source/tests plus enumSync.test.ts.
- Kobalte 2e8ce473: kobalte/packages/core/src/checkbox, especially checkbox-root.tsx, checkbox-control.tsx, checkbox-input.tsx, and checkbox.test.tsx.
- Use upstream source and tests as normative behavior evidence. Historical Moraine commits may explain intent but are evidence only, never the parity target.

## Audit and Implementation

1. Record a gap ledger with one of verified, ported, intentional-divergence, or unverified-platform for every behavior below, citing the exact upstream source or test.
2. Compare keyboard and focus behavior: Space activation, Enter behavior, focus-visible ownership, label/control focus transfer, card-root clicks, prevented events, and disabled/readOnly focusability.
3. Compare ARIA and semantics: role=checkbox, aria-checked including mixed, required/disabled/readonly/invalid propagation, label and description IDs, indicator state attributes, and hidden input accessibility.
4. Compare pointer/touch/click ordering: duplicate activation from labels or nested controls, primary-button filtering, pointer-down focus preservation, card versus list hit targets, and consumer handler cancellation.
5. Compare controlled state: controlled and uncontrolled transitions, indeterminate normalization, custom true/false values, callback count/order, external updates, form-bound values, and Object.is-equivalent no-op updates.
6. Verify native form behavior: name/value inclusion only while checked, disabled omission, required validity, FormData values, form reset to defaultChecked, indeterminate reset, and FormField input/change emissions.
7. Check empty labels, description-only content, missing name, disabled/readOnly/loading-adjacent composition, nested FormField, and browser/platform quirks identified by upstream tests.
8. Port the smallest behaviorally equivalent changes into existing helpers and component structure. Add a failing regression test before each change; do not copy upstream component decomposition.
9. If conditional JSX is changed, apply the SSR gate: evaluate JSX props once, do not instantiate inactive branches, and verify renderToString-to-hydrate DOM/order stability before interaction.

## Public API

- Keep Checkbox, CheckboxProps, CheckboxT namespace members, prop names, callback payloads, and slot names stable by default.
- Do not copy Base UI or Kobalte API shape, polymorphism, primitive decomposition, styling, spacing, or animations.
- Add or change a public prop only if behavior cannot be made correct through the current API; document that decision as an intentional divergence before implementation.

## Test Plan

- Focused: bun run test src/forms/checkbox/checkbox.test.tsx
- Form-field integration: bun run test src/forms/form-field/form-field.test.tsx
- Dependent group: bun run test src/forms/checkbox-group/checkbox-group.test.tsx
- Shared-state changes: run the focused tests for src/shared/use-controllable-value.ts and src/shared/hidden-input.tsx when corresponding test files exist, then bun run typecheck.
- Add explicit tests for native serialization/validity/reset, exact callback count/order, keyboard boundaries, pointer cancellation, controlled updates, ARIA links, and any ported platform branch.

## Completion Criteria

- Every audited behavior is classified with upstream evidence.
- Every ported gap has a focused regression test; intentional differences have a local-contract rationale.
- Checkbox, CheckboxGroup, FormField, and typecheck pass.
- No styling/API parity work is mixed into the behavior patch.

## Dependencies/Handoff

- Audit shared controllable-value and hidden-input semantics before changing Checkbox-specific work; coordinate shared fixes with Switch and RadioGroup owners.
- CheckboxGroup directly consumes Checkbox, so finish or explicitly publish remaining Checkbox gaps before the group plan is closed.
- Handoff must include the gap ledger, touched invariants, test commands/results, intentional differences, and any unverified real-browser behavior.

## Verified Missing Features

1. **Enter can activate a checkbox and Space changes on the wrong native phase.** Space is manually toggled and cancelled on `keydown`, while Enter is not cancelled and a native button synthesizes a click. Base UI asserts Space activation and no Enter activation; the current jsdom test dispatches only keydown and cannot expose the full sequence. Priority P0, small, high interaction impact; owner: Checkbox.
2. **Card clicks ignore nested interactive descendants.** The card root toggles for any click outside the checkbox control, so links and secondary buttons inside the card can change the checkbox. Priority P0, small; owner: Checkbox.
3. **Reset and callback semantics are under-specified.** Current reset reads the live `defaultChecked`; there is no test for default prop changes, controlled rejection, native validity, or exact callback count. Priority P1, medium; owner: Checkbox with Form reset dependency.
4. **Conditional label, description, and indicator JSX has no hydration gate.** Priority P1 coverage, medium; owner: Checkbox.

## Detailed Execution Plan

1. Add browser-sequence tests that dispatch keydown/keyup/click for Space and Enter, assert one Space toggle on the chosen activation phase, no Enter toggle, and exact callback order.
2. Preserve the native button but make keyboard handling match checkbox semantics: suppress Enter's native click and ensure Space has one transition without an extra synthesized click.
3. Add an interactive-descendant predicate to card activation using the existing Textarea ownership pattern; cover link, button, input, disabled target, and direct card clicks.
4. Add controlled/uncontrolled reset, native required validity, FormData, and callback-order tests. Reuse the Form reset decision rather than adding an independent store reset path.
5. Cache inspected JSX props and add SSR/hydration coverage for checked, indeterminate, label/description, and indicator branches.
6. Update `parity-matrix.md`; run Checkbox, CheckboxGroup, FormField, Form, SSR, and typecheck suites.

## STOP Conditions

- Required inheritance and group labelling belong to FormField; do not compensate locally.
- Do not replace the native form proxy or add Base UI's event-detail API.
