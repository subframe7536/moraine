# Plan 019: Expose ContextMenu parts without renderer props

> Executor: activate this DEFERRED plan only when ContextMenu is selected. Read `plans/README.md` and plan 018 first.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: [018-dropdown-menu.md](018-dropdown-menu.md)
- **Category**: dx
- **State**: DEFERRED — candidate; activate only when this family is selected

## Why this matters

ContextMenu follows DropdownMenu's renderer-free namespace anatomy while retaining right-click coordinates, virtual anchors, long-press/cancellation behavior and context-trigger semantics. Remove public `itemRender`; visible rows are `ContextMenu.Item` and attached visual parts.

## Target anatomy

```tsx
<ContextMenu>
  <ContextMenu.Trigger>Right-click this area</ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Group>
      <ContextMenu.GroupLabel>Project</ContextMenu.GroupLabel>
      <For each={items}>
        {(item) => (
          <ContextMenu.Item onSelect={item.onSelect} disabled={item.disabled}>
            <ContextMenu.ItemLabel>{item.label}</ContextMenu.ItemLabel>
          </ContextMenu.Item>
        )}
      </For>
    </ContextMenu.Group>
    <ContextMenu.Sub>
      <ContextMenu.SubTrigger>Share</ContextMenu.SubTrigger>
      <ContextMenu.SubContent>
        <ContextMenu.Item>Copy link</ContextMenu.Item>
      </ContextMenu.SubContent>
    </ContextMenu.Sub>
  </ContextMenu.Content>
</ContextMenu>
```

Do not add `ContextMenu.Items` merely to hide `<For>`.

## Contract

- Reuse the proven renderer-free menu behavior from plan 018.
- Preserve pointer-coordinate/virtual-anchor and long-press behavior.
- Remove public `itemRender` and renderer-only public types.
- Item visual regions are namespace parts.
- Dynamic items use `<For>`.
- Trigger/custom hosts use `as` where semantically valid.
- Parent/submenu layers never share surface IDs/refs/state authority.

## Acceptance tests

Cover contextmenu coordinates, long-press cancellation, touch/mouse differences, keyboard opening, dynamic namespace items, submenu ownership, dismissal/focus restore, scroll/RTL, virtual positioning, SSR, themes, and negative declaration tests for removed renderer APIs.

## Round-three prototype evidence and required follow-up

[Round-three experiment record](pr37-prototype-round3-findings.md), 2026-09-12. This is bounded prototype evidence; the production status above is unchanged.

**Observed:** Existing coordinate/keyboard trigger logic works with renderer-free menu rows. Chromium verifies the virtual anchor near the pointer and Shift+F10 opening.

**Production acceptance:** Reuse plan 018 item/layer behavior and its Escape fix. Long-press logic was retained but real touch/pen cancellation, scrolling, nested submenus and server-open behavior were not validated.

Port the relevant experiment regressions before migration. The shared test totals are not a per-family coverage claim; default behavior, public types, docs and the untested boundaries still require this plan's gates.

## Verification

```sh
nub run test src/overlays/context-menu
nub run test:browser
nub run typecheck
nub run test:types
nub run docs:build
nub run test
nub run qa
git diff --check
```

## Done criteria

- [ ] ContextMenu visible rows are namespace-rendered.
- [ ] Public `itemRender` is removed.
- [ ] Pointer anchoring/long-press semantics remain intact.
- [ ] No Items assembler exists solely for iteration.
- [ ] Full regression/type/docs gates pass.

## STOP conditions

Stop if renderer removal loses pointer anchoring semantics, requires JSX scanning, or creates shared submenu state.
