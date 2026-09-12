# Plan 013: Make Select composition-first with namespace-rendered content

> Executor: read this file plus `plans/README.md` and plan 012 before implementation. This plan follows plan 003's `as`-only host polymorphism and the repository-wide rule that public `*Render` props are removed in favor of namespace components.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: [003-host-render.md](003-host-render.md), [012-select-internals.md](012-select-internals.md)
- **Category**: dx
- **State**: TODO

## Why this matters

Select should expose one composition model while keeping Moraine styling and behavior. `options` is optional complete-collection metadata, not a rendering API. All visible Select structure is rendered by namespace components and their children.

Expose `Trigger`, `Value`, `Content`, `List`, `Item`, `ItemLeading`, `ItemLabel`, `ItemDescription`, `ItemTrailing`, `Empty` and `Search` where search is enabled. Add Group/GroupLabel or lower-level Portal/Positioner only when a demonstrated customization requires them.

Remove public `optionRender`, `labelRender`, `emptyRender` and `virtualRender`. Do not replace them with differently named callback renderers. Do not add `Select.Items` merely to hide an application `<For>` loop.

## Target anatomy

```tsx
<Select defaultValue="design">
  <Select.Trigger>
    <Select.Value placeholder="Choose a team" />
  </Select.Trigger>
  <Select.Content>
    <Select.List>
      <Select.Item value="design">
        <Select.ItemLeading><DesignIcon /></Select.ItemLeading>
        <Select.ItemLabel>Design</Select.ItemLabel>
        <Select.ItemDescription>Product and visual design</Select.ItemDescription>
      </Select.Item>
      <Select.Item value="engineering">
        <Select.ItemLabel>Engineering</Select.ItemLabel>
      </Select.Item>
    </Select.List>
    <Select.Empty>No teams available</Select.Empty>
  </Select.Content>
</Select>
```

Dynamic application data:

```tsx
<Select options={teams} value={team()} onChange={setTeam}>
  <Select.Trigger as={Button} variant="outline">
    <Select.Value placeholder="Choose a team" />
  </Select.Trigger>
  <Select.Content>
    <Select.Search placeholder="Search teams..." />
    <Select.List>
      <For each={teams}>
        {(team) => (
          <Select.Item value={team.value} disabled={team.disabled}>
            <Select.ItemLabel>{team.label}</Select.ItemLabel>
          </Select.Item>
        )}
      </For>
    </Select.List>
    <Select.Empty>No teams available</Select.Empty>
  </Select.Content>
</Select>
```

## Public contract

### Root / metadata

- Root owns value/open/query/highlight/form behavior through plan 012.
- `options` is optional complete-collection metadata for features that need unmounted entries: complete-dataset search, selected-label lookup and virtualization.
- Metadata never renders JSX. It may carry explicit text/search/display metadata, but namespace parts own visible structure.
- No hidden default structure is selected by omitted children.

### Trigger

- Trigger is the interactive opener and uses `as` for valid intrinsic/custom host replacement.
- Trigger children are actual selected-host content.
- Required Select ARIA/state/events/ref survive `as={Button}` / custom hosts.
- No host-level `render` prop.

### Value

- `Select.Value` is the only selected-value presentation part.
- Explicit children win when supplied.
- Otherwise it may resolve display text from complete option metadata; when unavailable use a documented deterministic fallback such as raw value/placeholder.
- Remove `labelRender`; custom selected-value structure belongs inside `Select.Value` children or another explicit namespace part if a demonstrated need exists.

### List / Item

- `Item value` is required in declarative mode.
- `Item` registers semantic metadata but its children/attached parts render the row.
- `ItemLeading`, `ItemLabel`, `ItemDescription`, `ItemTrailing` replace option/label render callbacks and existing visual slots.
- Dynamic application data uses `<For>`.
- No `optionRender` or equivalent callback.

### Empty

- `Select.Empty` is the one empty-state presentation path.
- Remove `emptyRender`; consumers customize by composing children in `Select.Empty`.

### Search / virtualization

- Search is one visible namespace part backed by root query behavior.
- Complete-dataset search/virtualization may require `options` because unmounted entries cannot be inferred from JSX.
- Remove `virtualRender`. Virtualization internals expose visible logical entries/geometry/state to the namespace-rendered list path; they do not accept a JSX renderer callback.
- If the current virtualization architecture cannot preserve explicit `Select.Item` rendering without a render callback, refactor the virtualization boundary rather than retaining `virtualRender`.
- `scrollToItem` may remain only if it is an imperative behavior hook and not JSX rendering; prefer internal/default scrolling when possible.

## Migration map

- `optionRender` → `Select.Item` + `ItemLeading` / `ItemLabel` / `ItemDescription` / `ItemTrailing`.
- `labelRender` → `Select.Value` children and/or `Select.ItemLabel` metadata.
- `emptyRender` → `Select.Empty` children.
- `virtualRender` → renderer-free virtualization behavior + ordinary namespace item rendering.
- host-level `render` → `as`.

Do not keep deprecated renderer props unless a released compatibility requirement is explicitly proven. The target API and declaration tests must reject them.

## Acceptance tests

Cover:

- static Select with no `options`;
- dynamic `<For>` rendering;
- readonly `options` and root generic inference;
- Item visual subparts and arbitrary children;
- selected Value before Content mounts, with/without metadata;
- custom Value children;
- Search with complete options and registered-only mode;
- renderer-free virtualization with complete logical data;
- IME and keyboard navigation;
- form submit/reset/required/readOnly/disabled;
- controlled value rejection and serialization;
- unknown/duplicate Item values with actionable diagnostics;
- SSR/hydration and nested overlays;
- theme replacement, emptyTheme and local overrides;
- `Trigger as={Button}` and custom target props;
- negative declaration tests for `optionRender`, `labelRender`, `emptyRender`, `virtualRender` and host-level `render`.

## Scope

- `src/forms/select`
- Select docs/API/type tests
- relevant Form consumers
- renderer-free shared List/virtualization integration
- overlay base only for required integration
- browser tests

MultiSelect public anatomy follows in plan 026.

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

- [ ] Visible Select content is rendered by namespace parts/children.
- [ ] `optionRender`, `labelRender`, `emptyRender`, `virtualRender` are removed from the public API.
- [ ] Host replacement uses `as` only.
- [ ] Optional `options` metadata feeds behavior, not JSX rendering.
- [ ] Search/virtualization preserve the namespace rendering model.
- [ ] No `Select.Items` convenience assembler is introduced.
- [ ] Form/browser/SSR/declaration/full regression gates pass.

## STOP conditions

Stop if implementation requires scanning/evaluating JSX as data, if mounted items become selected/form value authority, if selected labels require hidden popup mounting, if virtualization can only work by owning JSX rendering, or if removed renderer props are reintroduced under aliases.