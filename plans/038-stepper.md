# Plan 038: Decide Stepper workflow semantics and migrate the selected anatomy

> Executor: read this file and plans/README.md. This family is DEFERRED. The prototype established a candidate, not approval to replace the production Stepper's semantics or defaults. Record the semantic decision below before implementation, then execute only the selected contract. Never overwrite unrelated user changes.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: [002-browser-regressions.md](002-browser-regressions.md), [010-tabs.md](010-tabs.md); explicit semantic decision
- **Category**: design / dx
- **State**: DEFERRED — workflow candidate; semantics and production migration not selected

## Evidence and decision required

[Round two](pr37-prototype-round2-findings.md) tested a workflow Stepper with complete readonly order metadata, explicit completed identities, namespace parts, Next/Previous, controlled rejection, manual keyboard focus and initial SSR/hydration. The existing implementation in src/navigation/stepper uses tab semantics, infers completion from entries before the current index, defaults clickable to false and keyboard activation to automatic. The pilot used a group of native buttons with aria-current="step", optional labelled regions, clickable navigation and manual activation. These are product changes, not just file extraction.

Before source changes, record:

1. Whether the production component remains tab-like navigation or adopts the workflow candidate; do not ship both behavior kernels under one root by accident.
2. The authoritative completion contract, linear reachability rules, disabled/skipped steps and backward navigation. In the tested workflow, the application supplies completed identities; visiting a step does not validate or complete it.
3. Clickable/activation defaults, required logical metadata versus optional declarative data, and the policy for invalid/removed current steps. Complete order was required by the pilot's linear guards; optional metadata was not tested.
4. Migration of items title/description/content, inferred completion and existing theme slots, with before/after examples and explicit accessibility semantics.

Production implementation stays deferred until the semantic contract is selected.

## Candidate contract if workflow semantics are selected

- One controlled/uncontrolled active value; rejected requests do not move the active step or announce a new current step.
- Application-owned completed identities survive backward navigation and reordering. Form validation stays with the application/Form store; Stepper does not add another field or validation authority.
- Linear Next/trigger navigation is gated by the selected completion policy; Previous preserves completion. Define disabled/skipped-step behavior explicitly rather than relying on current indices.
- Logical order is metadata, never JSX. Visible structure uses explicit List, Item, Trigger, Indicator, Title, Description, Separator and optional Content, with Next/Previous where useful. Do not introduce an Items assembler or renderer callback.
- Native buttons expose current-step semantics; optional regions have actual label targets. If a different semantic model is chosen, rewrite roles and keyboard expectations consistently before implementation.
- Preserve Moraine theme resolution, named slots, local overrides and emptyTheme behavior. Share proven keyboard navigation with Tabs without copying its selection or panel assumptions.
- Public namespace types remain StepperT, with only StepperProps as the matching top-level props alias. Document all changed props and defaults in JSDoc.

## Scope

After the decision and production selection:

- src/navigation/stepper implementation, recipes, namespace types, tests and SSR fixtures;
- existing Stepper docs and generated API metadata, declaration fixtures and direct caller migrations;
- test/browser for Stepper focus, navigation, theme and geometry assertions;
- shared selectable navigation only where both consumers demonstrate a need.

No Form engine, Tabs semantic redesign, overlay work or general workflow framework. Check source drift against the execution HEAD before editing.

## Execution and acceptance

1. Inventory current callers/defaults/slots and record the semantic decision and migration map. Resolve differences from the prototype before coding.
2. Add focused cases for linear guards, explicit completion, backward navigation, controlled rejection, disabled/skipped steps and manual/automatic keyboard behavior as selected. Test SSR current-step/label relationships and hydration node identity.
3. Implement one owner and explicit parts. Extend the pilot's missing cases: dynamic removal/renaming, reordered visual versus logical order, invalid defaults and optional metadata only if selected. Add async Form-validation integration only for a demonstrated consumer, without implicit completion or duplicate validation state.
4. Migrate callers/docs, test source and emitted namespace declarations, verify themes and real browser focus, and record remaining platform gaps.

Run nub run test src/navigation/stepper, nub run test:browser, nub run typecheck, nub run test:types, nub run docs:build, nub run test, nub run qa and git diff --check. The browser script is supplied by plan 002. Inspect fixing-tool mutations and keep changes scoped; record existing failures separately.

## Done criteria

- [ ] Semantic/default/completion decisions and caller migration map are recorded.
- [ ] The selected anatomy has one active-value authority and explicit completion ownership.
- [ ] Required keyboard, controlled-state, dynamic collection, SSR/hydration and theme cases pass.
- [ ] Docs, namespace declarations and direct callers match the selected contract.
- [ ] Verification results and index state reflect production completion, not prototype counts.

## STOP conditions

Stop implementation if the semantic decision is absent, correctness requires scanning child JSX or duplicate value/validation state, required accessibility/browser checks cannot run, or the selected contract requires out-of-scope changes. A passing workflow prototype does not authorize changing the existing tab-like API implicitly.
