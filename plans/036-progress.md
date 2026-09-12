# Plan 036: Replace Progress render props with namespace parts

> Executor: activate this DEFERRED plan only when the Progress family is selected. Read `plans/README.md` first.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: [003-host-render.md](003-host-render.md)
- **Category**: dx
- **State**: DEFERRED — candidate; activate only when this family is selected

## Why this matters

Progress currently exposes `statusRender` and `stepRender`. Remove these callback-based rendering APIs and express structure with styled namespace parts.

Expose `Progress.Track`, `Progress.Indicator`, `Progress.Status`, `Progress.Steps` and `Progress.Step`. Root owns progress state and derived percentages; parts consume that state. Consumers render step labels directly through `Progress.Step` rather than passing a renderer to the root.

## Target anatomy

Determinate progress:

```tsx
<Progress value={64} max={100}>
  <Progress.Status>64%</Progress.Status>
  <Progress.Track>
    <Progress.Indicator />
  </Progress.Track>
</Progress>
```

Named steps:

```tsx
<Progress value={activeStep()} max={steps.length - 1}>
  <Progress.Steps>
    <For each={steps}>
      {(step, index) => (
        <Progress.Step index={index()}>{step}</Progress.Step>
      )}
    </For>
  </Progress.Steps>
</Progress>
```

## Public contract

- Root owns `value`, numeric range, orientation and derived state.
- `Progress.Status` exposes progress state through context/data attributes and renders its children directly.
- `Progress.Step` receives a stable `index` and derives active/first/last/other state from the root.
- Remove `statusRender`, `stepRender`, `StatusRenderProps` and `StepRenderProps` public APIs.
- Keep `getValueLabel` only if it is needed for accessibility text; it is a value formatter, not a JSX renderer.
- If the existing overloaded `max: number | string[]` becomes unnecessary once steps are explicit, migrate to a numeric `max` and ordinary application step data rather than retaining an array solely for rendering.
- Do not add an automatic `Progress.Items` / `StepsRender` replacement.
- Preserve Moraine default styling, slots and local overrides through the new parts.

## Acceptance tests

Cover:

- determinate and indeterminate root state;
- explicit Status/Track/Indicator composition;
- explicit Steps/Step with dynamic `<For>` data;
- step state after insert/remove/reorder;
- orientation and animation;
- accessibility labels/value attributes;
- default/replacement/empty themes;
- negative declaration tests for `statusRender` and `stepRender`;
- SSR/hydration identity.

## Scope

- `src/elements/progress`
- Progress docs/API/type tests
- direct Progress callers required for migration

## Round-three prototype evidence and required follow-up

[Round-three experiment record](pr37-prototype-round3-findings.md), 2026-09-12. This is bounded prototype evidence; the production status above is unchanged.

**Observed:** Track/Indicator/Status/Steps/Step shares the retained numeric state derivation. Determinate, zero-range, indeterminate and reordered index-driven steps pass without rebuilding Status children.

**Production acceptance:** Numeric max is the tested candidate; migrate overloaded array max consumers explicitly. Validate orientation, reduced motion and visual animation, accessible value text and all slot overrides. Step index must follow application order rather than stay captured after reorder.

Port the relevant experiment regressions before migration. The shared test totals are not a per-family coverage claim; default behavior, public types, docs and the untested boundaries still require this plan's gates.

## Verification

```sh
nub run test src/elements/progress
nub run typecheck
nub run test:types
nub run docs:build
nub run test
nub run qa
git diff --check
```

## Done criteria

- [ ] Status and step content are rendered through namespace components.
- [ ] Public `statusRender` / `stepRender` APIs are removed.
- [ ] Root remains the single progress-state authority.
- [ ] Dynamic steps use `<For>` and `Progress.Step`.
- [ ] Full regression/type/docs gates pass.

## STOP conditions

Stop if parts need to duplicate progress state, if step state can only be derived by scanning children, or if a renderer callback is reintroduced under another name.
