# Plan 007: Validate host composition through Button without changing behavior

> Executor: read this file plus `plans/README.md` and plan 003. This is a consumer-validation plan for the shared host-render protocol.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: [003-host-render.md](003-host-render.md)
- **Category**: dx
- **State**: TODO

## Why this matters

Integrate the shared host-render protocol into Button while preserving native submit/type behavior, disabled/loading protection, `loadingAuto`, leading/trailing/content renderers and existing theme overrides.

Button remains a leaf. ButtonGroup stays standalone.

The purpose is not merely to support `<Button render={(p) => <button {...p} />}>`; it is to prove that Moraine can safely compose a Button host with another custom/Moraine component while keeping refs, events and behavior intact.

## Target anatomy

```tsx
<Button type="submit">Save</Button>

<Button
  render={(domProps) => (
    <CustomButtonShell {...domProps} data-app-button="save" />
  )}
>
  Save
</Button>
```

Also validate Button as the host of another behavior part through plan 003's contract, for example the later equivalent of:

```tsx
<Dialog.Trigger
  render={(domProps) => (
    <Button {...domProps} variant="outline">Edit</Button>
  )}
/>
```

## Contract

- Preserve `as` for straightforward polymorphic hosts where current inference is useful.
- `render` is function-only and mutually exclusive with `as`.
- Button internal disabled/loading protections must survive forwarded user/custom-component handlers.
- User cancellation semantics must match plan 003; mandatory disabled/loading invariants are not cancellable.
- Ref and `currentTarget` types must remain useful; no `any` escape hatch.
- Do not add Button namespace parts or fold ButtonGroup into Button.
- Keep Provider/theme, `classes/styles` and part-local overrides unchanged.

## Acceptance tests

Cover:

- native button default/type=submit behavior;
- `as="a"` or other existing supported host inference;
- disabled and loading protection through custom host composition;
- `loadingAuto` sync/Promise behavior;
- user handler + internal handler ordering/cancellation;
- custom component that adds its own event and ref while forwarding supplied props;
- nested Moraine behavior host composition;
- declaration tests for `as/render` exclusivity and event/ref targets;
- default, replacement and empty themes;
- SSR/hydration does not duplicate the interactive element.

## Scope

- `src/elements/button`
- Button docs/API metadata/type tests
- direct consumers required to validate or migrate the render protocol

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

- [ ] Button validates the shared real-composition protocol.
- [ ] Existing behavior and styling semantics remain intact.
- [ ] No new namespace structure was added to Button.
- [ ] Docs include one real custom-component composition example, not only native host replacement.
- [ ] Type, SSR and full regression gates pass.