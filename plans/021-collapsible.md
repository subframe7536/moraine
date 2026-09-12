# Plan 021: Refine existing Collapsible parts without duplicating state

> Executor: read this entire file and `plans/README.md` before implementation. Update this plan's row in `plans/README.md` when finished. Creating this plan did not authorize implementation.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: [003-host-render.md](003-host-render.md)
- **Category**: dx
- **Planned at**: commit `7d9633ca405c2bcf256481298486c7daee3e1456`, 2026-09-11
- **State**: DEFERRED — candidate; activate only when this family is selected

## Why this matters

Keep existing Trigger/Content and controlled `open` / `defaultOpen` / `onOpenChange`. Add only Indicator if a concrete customization needs it; do not copy Accordion collections, Item or Items into a single collapsible. Reuse one presence owner and plan 003's `as` polymorphism on applicable existing parts. Preserve disabled and unmount behavior.

The delivery boundary is this component or shared capability, including its own regressions, public types and necessary consumer/docs migration. A larger public surface is not a success metric; remove any proposed part that has no demonstrated structural or semantic use.

## Anatomy

Keep the existing single-root Trigger/Content anatomy. `children` is Trigger content; `as` replaces the Trigger host when needed.

```tsx
<Collapsible>
  <Collapsible.Trigger as={Button} variant="outline">
    Show project details
  </Collapsible.Trigger>
  <Collapsible.Content>Project details</Collapsible.Content>
</Collapsible>
```

Do not add a host-level `render` callback just to render a custom button or tag.

## Public contract

- Root owns one open-state authority.
- Trigger uses its default interactive host unless `as` selects another valid intrinsic/custom component.
- Trigger children remain actual selected-host content.
- A custom `as` target must receive/forward required ARIA, state, events and ref props from Collapsible.
- Disabled semantics and keyboard activation stay owned by Collapsible behavior.
- Content owns presence only once and keeps `aria-controls` relationships valid.
- Indicator remains deferred unless a concrete API need justifies it.
- Keep existing Moraine theme slots and local style overrides.

## Round-three prototype evidence and required follow-up

[Round-three experiment record](pr37-prototype-round3-findings.md), 2026-09-12. This is bounded prototype evidence; the production status above is unchanged.

**Observed:** A concrete Trigger host wrapping the existing behavior supports nested Button, disabled state and cancelled click; browser Enter/Space activation and content presence pass.

**Production acceptance:** Preserve the existing presence owner and measurement target. Full height transitions, interrupted animation, controlled rejection, custom refs and emptyTheme geometry still need family acceptance.

Port the relevant experiment regressions before migration. The shared test totals are not a per-family coverage claim; default behavior, public types, docs and the untested boundaries still require this plan's gates.

## Current state

Inspect `src/elements/collapsible/collapsible.types.ts`, `collapsible.tsx`, colocated tests and SSR fixtures before implementation. Preserve existing public callbacks and presence behavior unless this plan explicitly changes them.

## Scope

- `src/elements/collapsible`
- `docs/pages/(general)/collapsible`
- declaration/type-test fixtures
- only direct consumers needed for migration/verification

Out of scope: Accordion redesign, new collection infrastructure, a global primitive package, or unrelated component cleanup.

## Steps

### 1. Reconcile baseline

Inspect current Trigger/Content behavior, styles, presence and direct callers. Confirm plan 003 has landed or an equivalent `as` contract exists.

### 2. Add observable acceptance cases

Test:

- default Trigger host;
- `Trigger as={Button}` or another custom component;
- Trigger children arrive as selected-host content;
- required `aria-expanded` / `aria-controls`, state attributes, events and refs survive custom-host composition;
- disabled behavior and keyboard activation occur once;
- controlled rejection;
- conditional content, forceMount/current presence options and exit/reopen;
- actual-content `aria-controls` in SSR;
- negative declaration test for host-level `render`;
- default/empty/replacement themes and local overrides.

### 3. Implement only the stated contract

Reuse existing state/presence behavior. Add `as` integration only where it creates a real host customization; do not add wrappers or duplicate state.

### 4. Complete types/docs/migration evidence

Document the minimum anatomy, one `as={Button}` example and any migration from older host-render examples.

## Verification

```sh
nub run test src/elements/collapsible
nub run typecheck
nub run test:types
nub run docs:build
nub run test
nub run qa
git diff --check
```

## Done criteria

- [ ] Collapsible retains one open/presence authority.
- [ ] Trigger custom-host composition uses `as`, not host-level `render`.
- [ ] Children remains Trigger content.
- [ ] Required accessibility/event/ref behavior survives custom targets.
- [ ] Focused/type/SSR/full regression gates pass.

## STOP conditions

Stop if custom-host support requires JSX-return inspection, a compensating wrapper, `any` ref/event erasure, duplicate presence state, or a second host-level `render` path.
