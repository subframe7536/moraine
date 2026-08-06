# Checkbox Base UI Parity Plan

## Status

- Ready for audit and implementation.
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
