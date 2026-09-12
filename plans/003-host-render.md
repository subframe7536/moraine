# Plan 003: Extract one polymorphic host and DOM-props merge protocol

> Executor: read this entire file and `plans/README.md` before implementation. This plan defines the shared `as` polymorphism contract used by later component plans. The filename is retained to avoid churn in existing plan links; there is no public host-level `render` API after this revision.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: HIGH
- **Depends on**: [001-baseline.md](001-baseline.md)
- **Category**: tech-debt / dx
- **State**: TODO

## Why this matters

Moraine needs one internal protocol for selecting an intrinsic/custom host and merging behavior props, user props and refs without duplicating subtle event/ref logic in every component.

Extract the existing Popper prop merger into a private `mergeElementProps` implementation and add only the minimum private polymorphic-host helper needed by consumers. Private rendering helpers remain separate from host selection. Selected component migrations remove public JSX renderer callbacks according to the index; this helper extraction does not preserve them as another public composition path.

The public composition model is intentionally single-path:

- `as` selects the element or Solid component to render;
- `children` is the actual content passed to that selected target;
- there is **no host-level `render` prop** that returns the whole element tree.

This matches the Kobalte-style mental model and avoids maintaining two competing host customization mechanisms.

## Public-facing contract enabled by this plan

### `as`

`as` must support:

- the component's default intrinsic element;
- another intrinsic tag where the component semantics permit it;
- a custom Solid component that accepts the forwarded host props.

Representative target API:

```tsx
<Button as="a" href="/projects">Projects</Button>

<Dialog.Trigger as={Button} variant="outline">
  Edit project
</Dialog.Trigger>
```

A custom target can expose its own props and those props should remain type-checkable through the polymorphic component:

```tsx
function AppButton(props: AppButtonProps) {
  return <button {...props} />
}

<Button as={AppButton} emphasis="quiet">
  Save
</Button>
```

The exact Button/Dialog integration lands in later plans; this plan must make those shapes technically safe.

### `children`

- `children` remains the selected host's content channel.
- Replacing the host must not require rebuilding the element in a callback.
- Do not evaluate children merely to discover the selected host or recover props.
- Public JSX renderer callbacks are removed by the owning component migrations; data/behavior callbacks may remain. This plan does not add a callback-based content or host path.

### Prop ownership and forwarding

Split props intentionally:

1. **Moraine-only props** — variants, behavior options, collection metadata and other implementation controls are consumed by Moraine and must not leak to the DOM accidentally.
2. **Required behavior/accessibility props** — roles, state attributes, required ARIA relationships, disabled/tab-index behavior and internal refs/events are merged into the selected host and remain authoritative where correctness requires it.
3. **Consumer/target props** — ordinary DOM props plus target-component-specific props are forwarded to the selected `as` target with useful inference.

Do not solve this by forwarding every unknown object key to native DOM nodes.

## Merge semantics

Preserve and test:

- lazy getters / reactive property reads;
- Solid tuple event handlers;
- user-first cancellable actions where cancellation is part of the public behavior;
- non-cancellable internal invariants for disabled/lifecycle safety;
- function ref composition and cleanup;
- `class`, `classList`, `style`, `id`, `data-*`, `aria-*` and ordinary target props;
- required internal role/ARIA/state props cannot be accidentally removed when doing so would break the primitive;
- `currentTarget` / ref types without `any` or blanket generic erasure;
- exactly one selected host subtree;
- changing DOM/target props without recreating behavior state unnecessarily.

Document prop/handler precedence in focused tests. Consumers must not need to guess spread order to keep behavior intact.

## Custom-component responsibility

A component supplied through `as` must forward the received DOM/ARIA/event/ref props to one appropriate host element.

Moraine must not:

- add a wrapper solely because the custom component failed to forward props;
- inspect the custom component's returned JSX to find a DOM node;
- render the target twice;
- claim a ref/currentTarget type that cannot be known from the target type.

When a custom component cannot accept a required ref or host prop, declaration tests should expose that incompatibility rather than hiding it with casts.

## Prototype type constraints

The [prototype](pr37-prototype-findings.md) initially accepted an invalid Button variant inside `Dialog.Trigger as={Button}` even though direct Button calls were checked. A generic call signature alone did not preserve useful `ComponentProps<typeof Button>` extraction. A generic overload followed by a concrete default-button overload, with `NoInfer` on inherited target props, passed both source and emitted-declaration fixtures. Preserve this observable contract with that pattern or an equivalently checked design; do not mandate an abstraction larger than the consumers need.

Test positive and negative nested compositions against emitted package declarations as well as source: Button variants, intrinsic props, required custom props, native ref/event types, and missing required host refs. Where focus behavior needs a ref, a custom target must accept it; types cannot prove that its implementation actually forwards it, so retain runtime tests. The pilot's private legacy/schema assertions do not establish universal compatibility with arbitrary generic third-party hosts.

The shared `mergeElementProps` extraction is still outstanding. Port observable cancellation, tuple-handler, mandatory disabled-guard and ref ownership cases before consolidating existing mergers.

## Scope

- private shared polymorphic-host utility/helper under `src/shared` as needed;
- `src/shared/merge-element-props.ts` (create if absent);
- focused tests for polymorphism and prop merging;
- `src/overlays/base/popper.tsx` as the first existing merger consumer where applicable;
- declaration tests for intrinsic and custom-component `as` targets.

Do not add an AGENTS naming exception for a host-level `render` prop; that API is explicitly rejected. Do not retrofit every component in this plan.

## Steps

### 1. Capture current merger and polymorphic behavior

Record existing Popper merger semantics and existing `as` typing/implementation helpers. Prefer reusing a sound existing polymorphic mechanism over adding a second helper.

### 2. Add observable type and runtime acceptance cases

Cover:

- intrinsic target changes such as `as="a"` with valid target-specific props;
- invalid intrinsic props are rejected;
- custom component targets accept their own required/optional props;
- children arrive at the selected target as content;
- Moraine-only props do not leak to a native target;
- required behavior/ARIA props survive custom-target composition;
- user cancellation versus mandatory internal invariants;
- tuple handlers;
- non-event function props remain ordinary target props when valid;
- lazy/reactive prop getters;
- user and internal refs both receive replacement/unmount transitions where the target supports refs;
- class/classList/style precedence;
- nested Moraine-component composition such as a future `Dialog.Trigger as={Button}`;
- negative declaration case for the removed host-level `render` prop.

### 3. Extract only the required private protocol

Keep implementation small. Do not add a public merge utility, metadata registry, slot factory, public primitive package or JSX-return inspection layer.

### 4. Migrate Popper merger usage where appropriate

Move the existing Popper merger consumer to the shared prop-merging helper when doing so reduces duplication without forcing unrelated polymorphic APIs onto Popper.

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

- [ ] One private prop-merging/polymorphic-host protocol is sufficient for selected consumers.
- [ ] Public host customization uses `as`; host-level `render` is absent/negative-tested.
- [ ] Intrinsic and custom-component target props are type-checked usefully.
- [ ] `children` remains content and reaches the selected target without JSX scanning.
- [ ] Existing Popper behavior is preserved if migrated.
- [ ] Event/ref/lazy-prop semantics have focused regression tests.
- [ ] No public generic registry/factory was introduced.

## STOP conditions

Stop if correct polymorphism requires scanning/evaluating returned JSX, adding a wrapper around arbitrary custom targets, rendering the target twice, erasing refs/events to `any`, or maintaining a second host-level `render` path to cover cases that should be expressed with `as`.
