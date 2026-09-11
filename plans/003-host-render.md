# Plan 003: Extract one host-render and DOM-props merge protocol

> Executor: read this entire file and `plans/README.md` before implementation. This plan defines the shared host-composition contract used by later component plans.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: HIGH
- **Depends on**: [001-baseline.md](001-baseline.md)
- **Category**: tech-debt / dx
- **State**: TODO

## Why this matters

Moraine needs one internal protocol for composing behavior props, user props, refs and custom hosts without duplicating subtle event/ref logic in every component.

Extract the existing Popper prop merger into a private `mergeElementProps` implementation and add a small `renderElement` helper. Keep content rendering (`renderComponentOrElement`) separate from host rendering.

The protocol must support **real component composition**, not only swapping one native tag for another.

## Public-facing contract enabled by this plan

- `as` is the simple host/component replacement path when useful inference can be retained.
- `render` is function-only and is the explicit composition path.
- `as` and `render` are mutually exclusive.
- A render callback receives the complete host/behavior props that must be forwarded into one interactive subtree.
- Do not accept preconstructed JSX as the host renderer; it cannot reliably receive lazy props/refs.
- Do not promise impossible inference from the JSX returned by `render`. Different native host typing must come from an explicit type-bearing API rather than assertions.

Example acceptance shape:

```tsx
<Dialog.Trigger
  render={(domProps) => (
    <Button {...domProps} variant="outline">
      Edit project
    </Button>
  )}
/>
```

The exact Dialog integration lands later; this plan must make this style of composition technically safe.

## Merge semantics

Preserve and test:

- lazy getters / reactive property reads;
- Solid tuple event handlers;
- user-first cancellable actions where cancellation is part of the public behavior;
- non-cancellable internal invariants for disabled/lifecycle safety;
- function ref composition and cleanup;
- `class`, `classList`, `style` and ordinary DOM props;
- `currentTarget` / ref types without `any` or blanket generic erasure;
- one render invocation and one resulting interactive subtree;
- changing DOM props without recreating behavior state unnecessarily.

Document prop/handler precedence in the implementation tests. Consumers must not need to guess spread order to keep behavior intact.

## Scope

- `src/shared/render-element.tsx` (create if absent)
- `src/shared/merge-element-props.ts` (create if absent)
- focused tests for both helpers
- `src/overlays/base/popper.tsx` as the first existing merger consumer
- declaration tests
- the smallest AGENTS/docs naming note required for the `render` prop

Do not retrofit every component in this plan.

## Steps

### 1. Capture current merger behavior

Record existing Popper merger semantics and direct callers. Add regression tests before extraction.

### 2. Add observable composition tests

Cover:

- user cancellation versus mandatory internal invariants;
- tuple handlers;
- non-event function props remain ordinary props;
- lazy/reactive prop getters;
- user and internal refs both receive replacement/unmount transitions;
- class/classList/style precedence;
- one renderer invocation per reactive update contract;
- `as/render` exclusivity in declaration tests;
- function-only `render` negative tests;
- a custom component renderer that adds its own event/ref while forwarding supplied props;
- nested Moraine-component composition through the same protocol.

### 3. Extract the private protocol

Keep implementation small. Do not add a public merge utility, metadata registry, slot factory or generalized primitive package.

### 4. Migrate Popper and record constraints

Move the existing Popper merger consumer to the shared helper and verify no positioning/focus regression.

## Verification

```sh
nub run test src/shared src/overlays/base
nub run typecheck
nub run test:types
nub run test
nub run qa
git diff --check
```

## Done criteria

- [ ] One private element-prop merger and one host renderer exist.
- [ ] Existing Popper behavior is preserved.
- [ ] Real custom-component composition is covered, not only native-tag replacement.
- [ ] `as/render` type boundaries are explicit and tested.
- [ ] Event/ref/lazy-prop semantics have focused regression tests.
- [ ] No public generic registry/factory was introduced.

## STOP conditions

Stop if correct composition requires rendering/scanning JSX twice, if refs or event targets must be erased to `any`, if two interactive DOM roots must be produced for one host, or if the only way to support the API is to depend on undocumented JSX-return-type inference.