# Plan 037: Replace KbdGroup divider render props with namespace parts

> Executor: activate this DEFERRED plan only when KbdGroup is selected. Read `plans/README.md` first.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: [003-host-render.md](003-host-render.md)
- **Category**: dx
- **State**: DEFERRED — candidate; activate only when this family is selected

## Why this matters

KbdGroup currently exposes `dividerRender` and `sequenceDividerRender`. Replace both with explicit namespace structure. Consumers that need custom separators should render `KbdGroup.Divider` / `KbdGroup.SequenceDivider` directly between `Kbd`/`KbdGroup.Chord` parts.

## Target anatomy

```tsx
<KbdGroup>
  <KbdGroup.Chord>
    <Kbd>Ctrl</Kbd>
    <KbdGroup.Divider>+</KbdGroup.Divider>
    <Kbd>K</Kbd>
  </KbdGroup.Chord>
  <KbdGroup.SequenceDivider>then</KbdGroup.SequenceDivider>
  <KbdGroup.Chord>
    <Kbd>Ctrl</Kbd>
    <KbdGroup.Divider>+</KbdGroup.Divider>
    <Kbd>S</Kbd>
  </KbdGroup.Chord>
</KbdGroup>
```

Application data may use `<For>` to construct the same parts. Do not add another callback renderer or `Items` assembler.

## Public contract

- Expose only meaningful structural parts: `Chord`, `Divider`, `SequenceDivider`; reuse standalone `Kbd` for keys.
- `children` defines actual shortcut structure.
- Remove public `dividerRender`, `sequenceDividerRender` and `DividerRenderProps`.
- Existing `items` / `sequence` convenience data may remain only if they still have a coherent default-assembly role; custom rendering never depends on renderer callbacks.
- Preserve size/variant/theme behavior and semantic inline markup.

## Acceptance tests

Cover default convenience rendering, manual structure, dynamic `<For>`, custom divider children, no duplicate separators, theme overrides, SSR/hydration and negative declaration tests for removed renderer props.

## Verification

```sh
nub run test src/elements/kbd
nub run typecheck
nub run test:types
nub run docs:build
nub run test
nub run qa
git diff --check
```

## Done criteria

- [ ] Divider customization uses namespace parts.
- [ ] Public divider renderer props/types are removed.
- [ ] Kbd remains standalone; KbdGroup does not duplicate key behavior.
- [ ] Full regression/type/docs gates pass.

## STOP conditions

Stop if manual structure requires parsing children to reconstruct shortcut data or if a renderer callback is reintroduced under another name.