# Style Refactor Review Findings

Review target: `style-refactor` after Plan 006 acceptance and the subsequent cleanup commits.

## P1 — AvatarGroup root classes leak into child avatars

### Problem

`AvatarGroup` passes the complete `local.classes` object into each internal `AvatarFace` while also resolving the group item class separately.

When `AvatarFace` is rendered with `rootSlot="item"`, the direct root `class` is excluded from the nested avatar root, but `instance.classes.root` is still consumed by the resolver.

As a result, a configuration such as:

```tsx
<AvatarGroup
  classes={{
    root: 'group-root',
    item: 'group-item',
  }}
/>
```

can apply `group-root` to every child avatar in addition to the group container. `classes.root` should belong only to the `AvatarGroup` root.

### Relevant files

- `src/elements/avatar/avatar-group.tsx`
- `src/elements/avatar/avatar.tsx`

### Recommended fix

When `AvatarFace` is used with `rootSlot="item"`, exclude `classes.root` from the nested instance root while preserving the other avatar slots such as `image`, `fallback`, and `indicator`.

Add a regression test that verifies:

- the group wrapper receives `classes.root`;
- each child avatar receives `classes.item`;
- child avatars do not receive the group `classes.root` value.

## P2 — Button loading slot bypasses the shared style resolver

### Problem

The button recipe declares a `loading` slot, but the loading spinner does not consume `resolved.slotClass('loading')` or `resolved.slotStyle('loading')`.

Instead, its class is currently assembled directly from the default spinner class and `local.classes?.loading` before being inserted into the `leading` or `trailing` slot.

This means instance-level `classes.loading` can work through the local read, while provider/group configuration and `styles.loading` do not participate in the unified style precedence chain. The recipe-level `loading.base` entry is also not being consumed through the resolver as intended.

### Relevant files

- `src/elements/button/button.class.ts`
- `src/elements/button/button.tsx`

### Recommended fix

Have the spinner consume:

```ts
resolved.slotClass('loading')()
resolved.slotStyle('loading')()
```

Keep `leading` and `trailing` responsible only for placement/composition.

Add coverage for at least provider-level `classes.loading` and `styles.loading`, including precedence against instance overrides.

## P2 — Overlay trigger styling is not expressible through provider slot types

### Problem

Several overlay components style their top-level trigger through the root resolver, so runtime resolution can read `provider.classes.root` / `provider.styles.root`. Their public slot unions, however, do not expose a `root` slot.

This makes the corresponding provider configuration impossible to express type-safely even though the runtime resolver supports it.

Affected components include at least:

- Dialog
- Sheet
- Popover
- Tooltip
- DropdownMenu
- ContextMenu

### Recommended fix

Use one consistent public model across these components.

The lowest-risk change for this refactor is to add `root` to the affected slot types so the type surface matches the existing resolver semantics. A later API redesign could rename this surface to `trigger`, but mixing that rename into the current migration would create unnecessary churn.

Add type coverage proving that provider `classes.root` / `styles.root` configuration is accepted for the affected components and runtime coverage for at least one representative overlay.
