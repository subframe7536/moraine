# Plan 018: Expose DropdownMenu parts without renderer props

> Executor: activate this DEFERRED plan only when DropdownMenu is selected. Read `plans/README.md` first.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: [003-host-render.md](003-host-render.md), [005-overlay-lifecycle.md](005-overlay-lifecycle.md), [006-floating-bindings.md](006-floating-bindings.md)
- **Category**: dx
- **State**: DEFERRED — candidate; activate only when this family is selected

## Why this matters

Expose `Trigger`, `Portal`, `Positioner`, `Content`, `Group`, `GroupLabel`, `Item`, `ItemLeading`, `ItemLabel`, `ItemDescription`, `ItemTrailing`, `Separator`, `Sub`, `SubTrigger`, `SubContent`. Remove public `itemRender` and any renderer-based item assembly.

If root `items` metadata remains for compatibility or complete logical data, it must not be the customization mechanism. Custom/dynamic menu structure uses namespace parts and application `<For>`.

## Target anatomy

```tsx
<DropdownMenu>
  <DropdownMenu.Trigger>Open actions</DropdownMenu.Trigger>
  <DropdownMenu.Content>
    <DropdownMenu.Group>
      <DropdownMenu.GroupLabel>Project</DropdownMenu.GroupLabel>
      <For each={items}>
        {(item) => (
          <DropdownMenu.Item onSelect={item.onSelect} disabled={item.disabled}>
            <DropdownMenu.ItemLeading>{item.icon}</DropdownMenu.ItemLeading>
            <DropdownMenu.ItemLabel>{item.label}</DropdownMenu.ItemLabel>
          </DropdownMenu.Item>
        )}
      </For>
    </DropdownMenu.Group>
    <DropdownMenu.Separator />
    <DropdownMenu.Sub>
      <DropdownMenu.SubTrigger>Share</DropdownMenu.SubTrigger>
      <DropdownMenu.SubContent>
        <DropdownMenu.Item>Copy link</DropdownMenu.Item>
      </DropdownMenu.SubContent>
    </DropdownMenu.Sub>
  </DropdownMenu.Content>
</DropdownMenu>
```

Stable Portal/Positioner plumbing may remain internal if public parts are not required by real customization. Do not add `Items` merely to hide `<For>`.

## Contract

- One menu/submenu behavior authority per logical layer.
- Visible rows are explicit Item namespace components.
- Remove `itemRender` and renderer-only public context types.
- Item visual regions use attached namespace parts, not leading/trailing render callbacks.
- Dynamic data uses `<For>`.
- Trigger/SubTrigger host replacement uses `as`.
- Preserve keyboard/typeahead, disabled state, submenu ownership, dismissal/focus, callbacks and styling.

## Acceptance tests

Cover keyboard navigation/typeahead, disabled items, user cancellation, submenu/Escape/pointer transitions, dynamic `<For>` items, custom item subparts, no double generation, focus restore, SSR, themes, and negative declaration tests for removed renderer APIs.

## Round-three prototype evidence and required follow-up

[Round-three experiment record](pr37-prototype-round3-findings.md), 2026-09-12. This is bounded prototype evidence; the production status above is unchanged.

**Observed:** Explicit rows reuse menu layer state, with independent Sub/SubTrigger/SubContent owners. Browser checks pass cancellation, disabled rows, typeahead and Escape closing only the innermost submenu.

**Production acceptance:** Consume handled key events at the owning layer; global and local Escape handlers must not both dismiss it. Instantiate browser-only layer state inside the mounted surface, not a closed SSR root. Pointer grace, checkable/radio items, Tab and full submenu parity remain gates.

Port the relevant experiment regressions before migration. The shared test totals are not a per-family coverage claim; default behavior, public types, docs and the untested boundaries still require this plan's gates.

## Verification

```sh
nub run test src/overlays/dropdown-menu
nub run test:browser
nub run typecheck
nub run test:types
nub run docs:build
nub run test
nub run qa
git diff --check
```

## Done criteria

- [ ] DropdownMenu rows are namespace-rendered.
- [ ] Public `itemRender` is removed.
- [ ] No Items assembler exists solely for iteration.
- [ ] Submenus retain independent logical ownership.
- [ ] Full regression/type/docs gates pass.

## STOP conditions

Stop if menu behavior requires renderer callbacks, JSX scanning, shared parent/child surface state, or duplicate item generation.
