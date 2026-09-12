# Plan 007: Validate `as` polymorphism through Button without changing behavior

> Executor: read this file plus `plans/README.md` and plan 003. This is a consumer-validation plan for the shared polymorphic-host protocol.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: [003-host-render.md](003-host-render.md)
- **Category**: dx
- **State**: TODO

## Why this matters

Integrate the shared `as` polymorphism protocol into Button while preserving native submit/type behavior, disabled/loading protection, `loadingAuto`, leading/trailing presentation, content and existing theme overrides. Public JSX renderer callbacks migrate to explicit content according to the index.

Button remains a leaf. ButtonGroup stays standalone.

The purpose is to prove that one Kobalte-style `as` API can cover both intrinsic target changes and custom/Moraine component composition while `children` remains the actual Button content.

There is no public host-level `render` prop.

## Target anatomy

```tsx
<Button type="submit">Save</Button>

<Button as="a" href="/projects">
  Projects
</Button>

<Button as={CustomButtonShell} emphasis="quiet" data-app-button="save">
  Save
</Button>
```

Also validate Button as the selected host of another behavior part through plan 003's contract:

```tsx
<Dialog.Trigger as={Button} variant="outline">
  Edit
</Dialog.Trigger>
```

The selected component receives the behavior/ARIA/event/ref props that Dialog.Trigger requires, while the text/JSX between the tags remains Trigger content and therefore Button content.

## Contract

- `as` is Button's only host replacement mechanism.
- `as` accepts valid intrinsic targets and custom Solid components.
- `children` remains Button content; host replacement never requires a callback that returns a whole element.
- Target-component-specific props should remain available when `as={CustomComponent}`.
- Button-only props such as loading/variant controls are consumed by Button rather than leaked blindly to native DOM hosts.
- Button internal disabled/loading protections must survive user/custom-component handlers.
- User cancellation semantics follow plan 003; mandatory disabled/loading invariants are not cancellable.
- Ref and `currentTarget` types must remain useful for intrinsic hosts and must not claim unsupported precision for arbitrary custom targets.
- Do not add Button namespace parts or fold ButtonGroup into Button.
- Keep Provider/theme, `classes/styles` and part-local overrides unchanged.
- Remove public JSX renderer callbacks rather than retaining a competing content assembly path.

## Prototype regression that must land with this plan

The [prototype](pr37-prototype-findings.md) reproduced an unintended form submit: Button consumed `type` but did not forward it to a custom component rendering `<button {...props} />`. Its minimal fix forwarded custom-host `type` and native `disabled`, defaulting a custom button host without `href` to `type="button"`.

Add a real form regression before migration: omitted type does not submit, explicit `type="submit"` submits exactly once, and disabled/loading custom buttons remain inert. Preserve explicit target props and custom-link semantics; do not force button-only attributes onto links or replace disabled activation guards with native `disabled` alone. Test event/ref/ARIA forwarding together with the native attributes.

Retain plan 003's concrete default-host type contract. A positive `Dialog.Trigger as={Button}` call is insufficient: invalid nested `variant` and invalid target props must fail against emitted declarations. Coordinate the actual Dialog integration test with plan 011.

## Acceptance tests

Cover:

- native button default/type=submit behavior;
- `as="a"` or other supported intrinsic host inference and target-specific props;
- a custom component target with its own prop such as `emphasis`;
- children forwarded as actual target content;
- disabled and loading protection through a custom `as` target;
- `loadingAuto` sync/Promise behavior;
- user handler + internal handler ordering/cancellation;
- custom component that forwards event/ref/ARIA props to its DOM host;
- nested Moraine composition such as `Dialog.Trigger as={Button}`;
- negative type test for the removed host-level `render` prop;
- invalid intrinsic/target props rejected by declarations;
- default, replacement and empty themes;
- SSR/hydration does not duplicate the interactive element.

## Scope

- `src/elements/button`
- Button docs/API metadata/type tests
- direct consumers required to validate or migrate the `as` protocol

Do not refactor unrelated Button consumers or rename ButtonGroup.

## Verification

```sh
nub run test src/elements/button
nub run typecheck
nub run test:types
nub run docs:build
nub run test
nub run qa
git diff --check
```

## Done criteria

- [ ] Button validates intrinsic and custom-component `as` polymorphism.
- [ ] Host-level `render` is not part of Button's public API.
- [ ] Children remains the actual rendered content.
- [ ] Custom hosts preserve default button type, explicit single submit, disabled/loading protection and link behavior.
- [ ] Existing behavior and styling semantics remain intact.
- [ ] No new namespace structure was added to Button.
- [ ] Docs include one real custom-component `as` example.
- [ ] Type, SSR and full regression gates pass.
