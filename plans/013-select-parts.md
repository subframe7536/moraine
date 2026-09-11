# Plan 013: Make Select composition-first with optional collection data

> Executor: read this file plus `plans/README.md` and plan 012 before implementation. This plan replaces the previous mandatory-root-options structural path.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: [003-host-render.md](003-host-render.md), [012-select-internals.md](012-select-internals.md)
- **Category**: dx
- **State**: TODO

## Why this matters

Select should expose one shadcn-style composition model while keeping Moraine styling and behavior. `options` becomes optional complete-collection metadata, not a mandatory duplicate of the rendered item tree.

Expose the smallest useful anatomy: `Trigger`, `Value`, `Content`, `List`, `Item`, `Empty` and `Search` where search is enabled. Add Group/GroupLabel or lower-level Portal/Positioner only when a demonstrated customization requires them.

Do not add `Select.Items` merely to hide an application `<For>` loop. Do not maintain a second "complete default widget" implementation selected by whether children exists.

## Target anatomy

Static composition without root options:

```tsx
<Select defaultValue="design">
  <Select.Trigger>
    <Select.Value placeholder="Choose a team" />
  </Select.Trigger>
  <Select.Content>
    <Select.List>
      <Select.Item value="design">Design</Select.Item>
      <Select.Item value="engineering">Engineering</Select.Item>
    </Select.List>
    <Select.Empty>No teams available</Select.Empty>
  </Select.Content>
</Select>
```

Dynamic composition from application data:

```tsx
<Select options={teams} value={team()} onChange={setTeam}>
  <Select.Trigger>
    <Select.Value placeholder="Choose a team" />
  </Select.Trigger>
  <Select.Content>
    <Select.Search placeholder="Search teams..." />
    <Select.List>
      <For each={teams}>
        {(team) => (
          <Select.Item value={team.value} disabled={team.disabled}>
            {team.label}
          </Select.Item>
        )}
      </For>
    </Select.List>
    <Select.Empty>No teams available</Select.Empty>
  </Select.Content>
</Select>
```

`options` may power complete-dataset search, virtualization and selected-label lookup, but it must not replace the explicit structure.

## Public contract

### Root

- owns value/open/query/highlight/form behavior through plan 012;
- `options` is optional complete-collection metadata;
- readonly option arrays should be accepted where practical;
- root generic inference must survive attaching static parts;
- no hidden default structure is selected by omitted children.

### Trigger

- is the interactive opener and supports plan-003 host composition;
- Trigger children define trigger structure; no duplicate internal trigger tree;
- disabled/readOnly/form semantics remain root behavior, not local copies.

### Value

- renders the selected display value or explicit children/render output;
- when `options` supplies label metadata, Value may resolve a label before Content mounts;
- when no label metadata exists, use a documented deterministic fallback (for example raw value or explicit Value children) rather than mounting Content invisibly;
- placeholder behavior remains explicit.

### Content

- is the primary styled popup surface and owns the stable portal/positioning assembly internally unless lower-level parts are required by real customizations;
- arbitrary heading/search/list/empty structure is allowed inside Content;
- Content does not own a second selection/query state.

### Search

- is the one visible search input for built-in search behavior;
- there is no hidden competing Search control;
- with complete `options`, built-in filtering may cover unmounted entries;
- without complete metadata, search/typeahead operates only on explicitly registered searchable metadata and must document that boundary;
- IME behavior, query reset and keyboard focus movement must remain correct.

### List / Item

- Item `value` is required in declarative mode;
- Item may declare disabled/search text/display metadata without requiring root `options`;
- mounted registration informs behavior but is not the selected-value authority;
- ordinary dynamic rendering uses application `<For>`;
- do not infer a parent generic from a static child Item through unsupported TypeScript magic. Keep Item value types useful and document the boundary.

### Empty

- one visible empty-state path only;
- if legacy `emptyRender` remains for compatibility, define precedence against explicit `Select.Empty` and never render both;
- prefer explicit part composition for the new API.

## Legacy renderer precedence

Existing `optionRender`, `labelRender`, `emptyRender`, `virtualRender` and `scrollToItem` behavior must either be preserved with a single documented precedence or intentionally migrated/deprecated.

Required rule: explicit structural parts must not accidentally double-render legacy renderer output.

Before implementation, record a table for:

- explicit Item children vs `optionRender`;
- Value children vs `labelRender` / option metadata;
- explicit Empty vs `emptyRender`;
- virtualized row renderer vs explicit Item composition.

If a renderer has no coherent role in the composition-first API, deprecate it with a migration path rather than maintaining two competing rendering systems forever.

## Search / virtualization boundary

Complete-dataset search and virtualization inherently need logical entries that may not be mounted. Therefore:

- permit/require `options` for those capabilities when necessary;
- do not derive virtual/search data by traversing child JSX or mounted DOM;
- manual structure may still add headings/toolbars around List without reimplementing search, keyboard navigation, clear behavior or form synchronization.

A key acceptance case is: **add one heading to Content while retaining all existing Select functionality**.

## Styling

- Reuse existing Select theme slots and `createComponentStyles`.
- Every public part receives normal Moraine styling when composed manually.
- Root `classes/styles` and part-local `class/style` preserve documented precedence.
- Content internal portal/positioning mechanics must survive `emptyTheme`.
- Custom structure must not require copying Moraine's default class list.

## SSR boundary

- A selected label required in first server HTML needs complete metadata or explicit Value content.
- Do not open/mount hidden popup content during SSR solely to resolve a label.
- Trigger/Value ARIA references must be valid on first HTML and remain stable through hydration.
- Declarative Item registration after mount must not rewrite a controlled value.

## Acceptance tests

Cover:

- static Select with no `options`;
- dynamic `<For>` rendering;
- readonly `options` and root generic inference;
- selected Value before Content has mounted, both with and without metadata;
- search with complete options and search in registered-only mode;
- IME and keyboard navigation;
- explicit heading added inside Content without rebuilding infrastructure;
- form submit/reset/required/readOnly/disabled;
- controlled value rejection and serialization;
- unknown/duplicate Item values with actionable diagnostics;
- renderer/part precedence with no duplicate content;
- virtualization with complete logical data;
- SSR/hydration and nested overlays;
- theme replacement, emptyTheme and local overrides;
- host-composed Trigger.

MultiSelect's existing behavior must continue passing while shared internals change.

## Scope

- `src/forms/select`
- Select docs/API/type tests
- relevant Form consumers
- overlay base only for required integration
- browser tests

Do not redesign MultiSelect public anatomy in this unit; plan 026 follows this contract.

## Migration

Remove the requirement that every structural Select duplicate its options in the root. Existing data-driven callers may keep `options`, especially for search/virtualization/label metadata.

Docs should teach:

1. static composed Select without options;
2. dynamic data with `<For>`;
3. searchable data with `options` metadata;
4. localized structural customization;
5. selected-label/SSR boundary.

## Verification

```sh
nub run test src/forms/select
nub run test:browser
nub run typecheck
nub run test:types
nub run docs:build
nub run test
nub run qa
git diff --check
```

## Done criteria

- [ ] Select works composition-first without mandatory `options`.
- [ ] Optional `options` metadata uses the same behavior authority.
- [ ] Search, selected labels and virtualization have explicit complete-data boundaries.
- [ ] No `Select.Items` convenience assembler was introduced.
- [ ] Explicit parts and legacy renderers have one documented precedence with no double rendering.
- [ ] Existing styling overrides work in composed structure.
- [ ] Form, browser, SSR, declaration and full regression gates pass.

## STOP conditions

Stop if implementation requires scanning/evaluating JSX as data, if mounted items become the selected/form value authority, if selected labels require hidden popup mounting, if custom structure loses built-in search/form behavior, or if legacy renderers and explicit parts cannot be given an unambiguous precedence.