# Plan 011: Make Dialog.Content the primary styled composition surface

> Executor: read this file plus `plans/README.md` before implementation. This plan replaces the previous Panel-versus-raw-Content dual-path design.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: [002-browser-regressions.md](002-browser-regressions.md), [003-host-render.md](003-host-render.md), [005-overlay-lifecycle.md](005-overlay-lifecycle.md), [006-floating-bindings.md](006-floating-bindings.md)
- **Category**: dx
- **State**: TODO

## Why this matters

Dialog should have one documented composition model instead of a convenience Panel path plus a separate raw Content path.

Expose `Trigger`, `Content`, `Header`, `Title`, `Description`, `Body`, `Footer`, `Close` and only the additional technical parts that demonstrate real customization needs. `Dialog.Content` is the primary styled dialog surface and accepts arbitrary children structure.

Stable plumbing such as portal ownership, focus trap, dismissal lifecycle and presence should remain internal by default. Expose `Portal` / `Overlay` only if existing customization requirements cannot be expressed through Content/root props and style slots without them.

Share one private dialog behavior implementation with Modal/Sheet facades; styled surfaces must not own a duplicate behavior kernel.

## Target anatomy

```tsx
<Dialog>
  <Dialog.Trigger
    render={(domProps) => (
      <Button {...domProps} variant="outline">Edit project</Button>
    )}
  />

  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Edit project</Dialog.Title>
      <Dialog.Description>Update project details.</Dialog.Description>
    </Dialog.Header>

    <Input aria-label="Project name" />

    <Dialog.Footer>
      <Dialog.Close>Done</Dialog.Close>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog>
```

The content tree is user-owned. Do not reintroduce title/description/body/footer convenience props that secretly assemble a second structure path.

## Public contract

### Root

- owns open/controlled state, dismissal/focus lifecycle and shared behavior;
- does not own visual-layout props that belong to Content;
- one root owns at most one active dialog surface.

### Trigger / Close

- use the shared plan-003 host-render protocol;
- real composition with Button/custom hosts must be tested;
- preserve refs, user handlers and disabled semantics.

### Content

- is the documented styled surface;
- owns surface-level visual options such as fullscreen/scrollable where still required;
- children are arbitrary structure;
- creates/uses the correct visual Provider scope once;
- supports accessible labelling through Title/Description and explicit aria-label/aria-labelledby where appropriate;
- must not depend on Header/Body/Footer being present.

### Header / Body / Footer

- are optional layout helpers with Moraine styling;
- do not register business-state "presence" merely to alter layout; prefer CSS/layout behavior where possible.

### Title / Description

- provide accessible semantics and IDs when rendered;
- conditional/missing parts must not leave dangling aria-labelledby / aria-describedby references on first server HTML or after hydration.

### Portal / Overlay

Before exposing them, prove an actual customization need. If public:

- they remain attached parts of Dialog rather than a new public primitives package;
- Overlay outside Content resolves its own nearest visual Provider styles;
- custom portal/overlay composition cannot create a second focus/dismiss authority.

## Styling

- Keep existing Dialog theme slots where semantic targets remain.
- `Dialog.Content` and layout parts receive default Moraine styling in manual composition.
- `classes/styles` on the appropriate public owner and part-local `class/style` remain supported.
- `emptyTheme` must keep behavior geometry, focusability and dismissal hit areas valid.
- If old `content` slot meant the assembled panel, document any slot remapping caused by this refactor.

## Migration

The old assembled Content API migrates to explicit children under `Dialog.Content`.

Do not create a long-lived `Dialog.Panel` alias solely to preserve the previous plan. If compatibility with already-released public props is required, keep a temporary deprecated facade only when real external consumers exist and record its removal path.

Docs must include a before/after migration for any old `title`, `description`, `header`, `body`, `footer`, `close` convenience props whose semantics change.

## Acceptance tests

Cover:

- Trigger -> Content -> Close basic composition;
- Trigger rendered through Button/custom component;
- keyboard open/close, escape, outside dismissal, focus restore and focus containment;
- controlled/uncontrolled open state;
- reopen during exit/presence transition;
- Title/Description present, absent, conditional and custom IDs in first server HTML;
- explicit accessible name without Title;
- Header/Body/Footer optional layout;
- nested visual Providers and local style overrides;
- fullscreen/scrollable behavior if retained;
- only one active surface per root;
- Modal direct consumers continue using the same private behavior kernel.

## Scope

- `src/overlays/dialog`
- shared overlay base only as required by lifecycle/positioning prerequisites
- Dialog docs/API/type tests
- direct Dialog consumers and Modal compatibility tests
- real browser tests

Do not redesign every overlay family in this plan.

## Verification

```sh
nub run test src/overlays/dialog src/overlays/modal
nub run test:browser
nub run typecheck
nub run test:types
nub run docs:build
nub run test
nub run qa
git diff --check
```

## Done criteria

- [ ] Dialog has one primary public Content anatomy.
- [ ] Content accepts arbitrary structure without a competing hidden assembly path.
- [ ] Host composition works with Button/custom triggers.
- [ ] Accessibility IDs are correct in initial SSR and after conditional changes.
- [ ] Styling override semantics remain Moraine-owned and composable.
- [ ] Dialog/Modal share one behavior implementation.
- [ ] Browser, declaration, SSR and full regression gates pass.

## STOP conditions

Stop if Content and a convenience surface require separate open/focus/dismiss state, if accessibility can only be repaired after client mount, if custom hosts require type erasure, or if public Portal/Overlay parts are being added without a demonstrated customization need.