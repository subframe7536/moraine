# Plan 031: Expose Breadcrumb parts without renderer props

> Executor: activate this DEFERRED plan only when Breadcrumb is selected. Read `plans/README.md` first.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: [003-host-render.md](003-host-render.md)
- **Category**: dx
- **State**: DEFERRED — candidate; activate only when this family is selected

## Why this matters

Expose `List`, `Item`, `Link`, `Page`, `Separator` and `Ellipsis`. Remove `itemRender` and renderer-only context types. Manual links need neither root items nor value registration. Dynamic breadcrumbs use application `<For>` and explicit namespace parts.

## Target anatomy

```tsx
<Breadcrumb>
  <Breadcrumb.List>
    <For each={items}>
      {(item, index) => (
        <>
          <Breadcrumb.Item>
            {item.href ? (
              <Breadcrumb.Link href={item.href}>{item.label}</Breadcrumb.Link>
            ) : (
              <Breadcrumb.Page>{item.label}</Breadcrumb.Page>
            )}
          </Breadcrumb.Item>
          <Show when={index() < items.length - 1}>
            <Breadcrumb.Separator />
          </Show>
        </>
      )}
    </For>
  </Breadcrumb.List>
</Breadcrumb>
```

A convenience `items` prop may remain only for the canonical default assembly if it has real value, but it cannot be paired with `itemRender`. Custom structure uses parts directly.

## Contract

- Remove public `itemRender` and `ItemRenderProps`.
- `Link` owns navigable semantics and preserves `to ?? href` migration behavior where applicable.
- `Page` represents the current non-navigating page.
- `Separator`/`Ellipsis` are explicit structural parts.
- Dynamic/custom breadcrumbs use `<For>`; do not add `Breadcrumb.Items` merely to hide iteration.
- Router/custom link hosts use `as`, with children as link content.
- Preserve native target/rel/events/ref, accessibility and styling.

## Acceptance tests

Cover manual and dynamic `<For>` structure, optional default items convenience, href/to priority, target/rel/current/disabled semantics, custom routing host forwarding, separators/ellipsis, SSR accessible navigation, themes, and negative declaration tests for `itemRender`/renderer-only types.

## Round-three prototype evidence and required follow-up

[Round-three experiment record](pr37-prototype-round3-findings.md), 2026-09-12. This is bounded prototype evidence; the production status above is unchanged.

**Observed:** Explicit List/Item/Link/Separator supports router-host props and current-page semantics without root item data. First-server markup and hydration identity pass.

**Production acceptance:** Retain native navigation and avoid intercepting modified anchor clicks. Complete custom-host ref/currentTarget types, separator accessibility and default/manual style parity.

Port the relevant experiment regressions before migration. The shared test totals are not a per-family coverage claim; default behavior, public types, docs and the untested boundaries still require this plan's gates.

## Verification

```sh
nub run test src/navigation/breadcrumb
nub run typecheck
nub run test:types
nub run docs:build
nub run test
nub run qa
git diff --check
```

## Done criteria

- [ ] Breadcrumb customization uses namespace parts.
- [ ] `itemRender` and its public renderer context are removed.
- [ ] Dynamic structure uses `<For>` rather than an Items assembler.
- [ ] Router host customization uses `as`.
- [ ] Full regression/type/docs gates pass.

## STOP conditions

Stop if custom rendering requires a callback prop, JSX scanning, or duplicate navigation state.
