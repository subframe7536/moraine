# Plan 035: Make List composition-first without renderer props

> Executor: activate this DEFERRED plan only when the List family is selected. Read `plans/README.md` first.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: [003-host-render.md](003-host-render.md)
- **Category**: dx
- **State**: DEFERRED — candidate; activate only when this family is selected

## Why this matters

The current List API is driven by `itemRender` and optional `virtualRender`. That conflicts with the library-wide composition contract: structure should be JSX expressed through namespace components, not callbacks passed to the root.

Make List a small styled collection container with explicit `List.Item`. Application data is rendered with Solid `<For>`. Virtualization provides visible entries/geometry, but the visible rows are still ordinary `List.Item` components.

## Target anatomy

```tsx
<List>
  <For each={items}>
    {(item) => <List.Item>{item.label}</List.Item>}
  </For>
</List>
```

Virtualized application rendering:

```tsx
<List ref={setScrollElement}>
  <For each={virtualItems()}>
    {(virtualItem) => (
      <List.Item
        data-index={virtualItem.index}
        style={{ transform: `translateY(${virtualItem.start}px)` }}
      >
        {items[virtualItem.index].label}
      </List.Item>
    )}
  </For>
</List>
```

The exact virtualizer API remains application-owned unless Moraine has a demonstrated reusable virtualization behavior. Do not reintroduce JSX injection through `virtualRender`.

## Public contract

- `List` is the root container and may keep `as` polymorphism where useful.
- `List.Item` is the row component and owns the existing row slot/default presentation.
- `children` is the list structure/content.
- Remove public `itemRender`, `virtualRender`, `ItemRenderProps`, `VirtualRenderProps` and renderer-only type plumbing.
- Do not add `List.Items` merely to hide `<For>`.
- If shared virtualization helpers are required by Select/CommandPalette, they must expose data/geometry/state, not a callback that returns the row JSX.
- Preserve row refs, `data-index`, native attributes and custom `as` targets without wrappers.

## Acceptance tests

Cover:

- static children;
- application `<For>` rendering;
- keyed insertion/removal/reorder;
- `List.Item` native props/ref and optional `as`;
- virtualized visible rows with externally supplied positioning props;
- SSR/hydration identity;
- negative declaration tests for `itemRender` and `virtualRender`;
- no renderer-only public type exports;
- empty/default/replacement styling behavior.

## Scope

- `src/elements/list`
- List docs/API/type tests
- shared virtualization consumers only where required to migrate away from renderer callbacks

Do not redesign Select or CommandPalette public APIs here; their plans consume the renderer-free List contract.

## Verification

```sh
nub run test src/elements/list
nub run typecheck
nub run test:types
nub run docs:build
nub run test
nub run qa
git diff --check
```

## Done criteria

- [ ] List structure is rendered through `List.Item` and children.
- [ ] Public `itemRender` / `virtualRender` APIs are removed.
- [ ] Dynamic lists use `<For>` rather than a namespace assembler.
- [ ] Virtualization does not own JSX rendering.
- [ ] Full regression/type/docs gates pass.

## STOP conditions

Stop if removing renderer props requires evaluating/scanning children as data, if virtualization can only work by taking over JSX rendering, or if row refs/attributes require a duplicate wrapper.