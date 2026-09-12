# Plan 025: Expose CommandPalette layout without renderer props

> Executor: activate this DEFERRED plan only when CommandPalette is selected. Read `plans/README.md`, plan 012 and plan 035 first.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: MED
- **Depends on**: [012-select-internals.md](012-select-internals.md), [003-host-render.md](003-host-render.md), [035-list.md](035-list.md)
- **Category**: dx
- **State**: DEFERRED — candidate; activate only when this family is selected

## Why this matters

Expose `Input`, `List`, `Item`, `ItemLeading`, `ItemLabel`, `ItemDescription`, `ItemTrailing`, `Group`, `GroupLabel`, `Empty`, `Footer`, `Close`. Remove public `leadingRender`, `trailingRender`, `itemRender`, `emptyRender`, `footerRender` and `virtualRender`.

Root may keep complete `groups` metadata for built-in search/virtualization, but metadata does not render JSX. Visible rows are namespace components.

## Target anatomy

```tsx
<CommandPalette groups={groups} onClose={() => setPaletteOpen(false)}>
  <CommandPalette.Input aria-label="Search commands" />
  <CommandPalette.List>
    <For each={visibleGroups()}>
      {(group) => (
        <CommandPalette.Group>
          <CommandPalette.GroupLabel>{group.label}</CommandPalette.GroupLabel>
          <For each={group.items}>
            {(item) => (
              <CommandPalette.Item value={item.value} onSelect={item.onSelect}>
                <CommandPalette.ItemLeading>{/* app content */}</CommandPalette.ItemLeading>
                <CommandPalette.ItemLabel>{item.label}</CommandPalette.ItemLabel>
                <CommandPalette.ItemDescription>{item.description}</CommandPalette.ItemDescription>
                <CommandPalette.ItemTrailing>{/* shortcut */}</CommandPalette.ItemTrailing>
              </CommandPalette.Item>
            )}
          </For>
        </CommandPalette.Group>
      )}
    </For>
  </CommandPalette.List>
  <CommandPalette.Empty>No commands found</CommandPalette.Empty>
  <CommandPalette.Footer><CommandPalette.Close>Close</CommandPalette.Close></CommandPalette.Footer>
</CommandPalette>
```

The implementation may expose reactive filtered/virtual state to attached parts through context; it must not require a JSX renderer prop. Do not add `CommandPalette.Items` merely to hide `<For>`.

## Contract

- Root owns search/query/filter/highlight behavior and complete metadata where needed.
- Item parts render visible command structure and register/consume behavior state.
- Leading/trailing customization belongs to ItemLeading/ItemTrailing.
- Empty/Footer are explicit parts.
- Remove all public `*Render` props and renderer-only public types.
- Renderer-free virtualization follows plan 035: visible entry data/geometry is separate from JSX rendering.
- Keep imperative `scrollToItem` only if needed as behavior integration, not rendering.
- Keep the component embeddable; do not create a Dialog.

## Acceptance tests

Cover search/ranking, IME, disabled/group rows, item selection/close, explicit leading/trailing/description content, Empty/Footer, renderer-free virtualization, SSR, data changes, controlled query, themes, and negative declaration tests for every removed `*Render` prop.

## Round-three prototype evidence and required follow-up

[Round-three experiment record](pr37-prototype-round3-findings.md), 2026-09-12. This is bounded prototype evidence; the production status above is unchanged.

**Observed:** A bounded flat-metadata candidate exposes Input/List/Item and layout parts with filtering, disabled skipping, IME guard, selection and mounted active-descendant targets.

**Production acceptance:** Flat items in the experiment do not replace the planned groups contract. Preserve production ranking/custom filtering, grouped and async data, controlled query and renderer-free virtualization. Complete these against existing behavior before treating the collection engine as proven.

Port the relevant experiment regressions before migration. The shared test totals are not a per-family coverage claim; default behavior, public types, docs and the untested boundaries still require this plan's gates.

## Verification

```sh
nub run test src/navigation/command-palette
nub run test:browser
nub run typecheck
nub run test:types
nub run docs:build
nub run test
nub run qa
git diff --check
```

## Done criteria

- [ ] Visible CommandPalette structure is namespace-rendered.
- [ ] No public CommandPalette `*Render` prop remains.
- [ ] Search/virtualization behavior does not own JSX rendering.
- [ ] No `CommandPalette.Items` convenience assembler exists.
- [ ] Full regression/type/docs gates pass.

## STOP conditions

Stop if filtering/virtualization requires a callback to create JSX, if Item registration becomes a competing selection authority, or if removed renderer props return under aliases.
