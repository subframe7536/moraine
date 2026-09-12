# Plan 026: Align MultiSelect namespace composition with Select

> Executor: activate this DEFERRED plan only when MultiSelect is selected. Read `plans/README.md`, plan 012 and plan 013 first.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: [013-select-parts.md](013-select-parts.md)
- **Category**: dx
- **State**: DEFERRED — candidate; activate only when this family is selected

## Why this matters

MultiSelect reuses Select's renderer-free composition and optional metadata model while keeping one array-valued selection/form authority. Visible structure is expressed only through namespace parts and children; remove `optionRender`, `tagRender`, `labelRender`, `emptyRender` and `virtualRender`.

## Target anatomy

```tsx
<MultiSelect value={teams()} onChange={setTeams} options={teamOptions}>
  <MultiSelect.Tags>
    <For each={teams()}>
      {(value) => (
        <MultiSelect.Tag value={value}>
          <MultiSelect.TagLabel />
          <MultiSelect.TagRemove aria-label={`Remove ${value}`} />
        </MultiSelect.Tag>
      )}
    </For>
  </MultiSelect.Tags>

  <MultiSelect.Trigger>
    <MultiSelect.Value placeholder="Choose teams" />
  </MultiSelect.Trigger>

  <MultiSelect.Content>
    <MultiSelect.Search placeholder="Search teams..." />
    <MultiSelect.List>
      <For each={teamOptions}>
        {(option) => (
          <MultiSelect.Item value={option.value}>
            <MultiSelect.ItemLabel>{option.label}</MultiSelect.ItemLabel>
          </MultiSelect.Item>
        )}
      </For>
    </MultiSelect.List>
    <MultiSelect.Empty>No teams available</MultiSelect.Empty>
  </MultiSelect.Content>
</MultiSelect>
```

Do not add `MultiSelect.Items` merely to wrap `<For>`.

## Contract

- Root array value remains the only selection/form serialization authority.
- `options` is behavior/complete-collection metadata, not a rendering API.
- `Tags`, `Tag`, `TagLabel`, `TagRemove` render selected-value presentation.
- Select's `ItemLeading`, `ItemLabel`, `ItemDescription`, `ItemTrailing`, `Value`, `Empty`, `Search`, `List` and `Content` concepts are reused rather than callback renderers.
- Remove `optionRender`, `tagRender`, `labelRender`, `emptyRender`, `virtualRender` and their public renderer-prop types.
- Tag removal updates root array state without toggling the popup.
- `TagRemove` must not create invalid nested interactive controls.
- Selected labels come from explicit Tag/Value children, complete metadata, or deterministic raw-value fallback.
- Renderer-free virtualization follows plan 013; no MultiSelect-specific JSX renderer fork.
- Host replacement, where valid, uses `as`; children remains content.

## Acceptance tests

Cover declarative items without options, complete metadata search/virtualization, controlled/uncontrolled arrays, form serialization/reset/required/readOnly/disabled, Tag/TagRemove behavior, IME/search, labels before popup mount, duplicate/unknown values, SSR/hydration, themes, and negative declaration tests for all removed `*Render` props.

## Scope

- `src/forms/select` MultiSelect implementation/types/tests
- MultiSelect docs/API metadata
- direct Form consumers
- browser/type tests

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

- [ ] MultiSelect visible structure is namespace-rendered.
- [ ] All public MultiSelect `*Render` props are removed.
- [ ] Array/form state has one authority.
- [ ] Search/virtualization/label lookup boundaries match Select.
- [ ] No `MultiSelect.Items` assembler or duplicated behavior kernel exists.
- [ ] Full regression gates pass.

## STOP conditions

Stop if renderer removal requires a parallel selected-state store, JSX scanning, or virtualization taking ownership of JSX rendering.