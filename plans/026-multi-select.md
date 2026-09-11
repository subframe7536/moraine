# Plan 026: Align MultiSelect composition with Select without weakening array semantics

> Executor: activate this DEFERRED plan only when the MultiSelect family is explicitly selected. Read `plans/README.md`, plan 012 and plan 013 first.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: [013-select-parts.md](013-select-parts.md)
- **Category**: dx
- **State**: DEFERRED — candidate; activate only when this family is selected

## Why this matters

MultiSelect should reuse the validated Select composition and optional-collection model while keeping one array-valued selection/form authority.

`options` is optional complete-collection metadata, not mandatory structure. Declarative `Item` parts can register mounted option metadata when no complete collection is supplied. Search/virtualization over unmounted entries still require explicit complete metadata.

Add MultiSelect-specific selected-value presentation only where it has real structural value: `Value`, `Tag` and `TagRemove`. Do not fork the Select popup/query/navigation behavior.

## Target anatomy

```tsx
<MultiSelect value={teams()} onChange={setTeams} options={teamOptions}>
  <div class="flex flex-wrap gap-1">
    <For each={teams()}>
      {(value) => (
        <MultiSelect.Tag value={value}>
          <MultiSelect.TagLabel />
          <MultiSelect.TagRemove aria-label={`Remove ${value}`} />
        </MultiSelect.Tag>
      )}
    </For>
  </div>

  <MultiSelect.Trigger>
    <MultiSelect.Value placeholder="Choose teams" />
  </MultiSelect.Trigger>

  <MultiSelect.Content>
    <MultiSelect.Search placeholder="Search teams..." />
    <MultiSelect.List>
      <For each={teamOptions}>
        {(option) => (
          <MultiSelect.Item value={option.value}>
            {option.label}
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

- Root value is always array-valued and remains the only selection/form serialization authority.
- Mounted tags and items are presentation/metadata registrations, never complete selected state.
- Optional `options` follows the same complete-data rules as Select for search, virtualization and label lookup.
- Tag removal updates root array state without toggling the popup or breaking IME/focus behavior.
- `TagRemove` must not create invalid nested interactive controls. Its documented placement should avoid nesting a button inside Trigger/button hosts.
- Selected labels may come from complete option metadata, explicit Tag children or a deterministic raw-value fallback.
- Preserve current form reset/required/readOnly/disabled semantics and existing renderer behavior only under the precedence rules established in plan 013.
- Reuse Select popup/query/highlight/navigation internals; do not create a MultiSelect-specific fork.

## Styling

- Reuse Moraine theme/Provider/`classes/styles` behavior.
- Tags, Value, Content, List, Item, Empty and Search receive default Moraine styling when composed manually.
- Local part `class/style` remains the narrowest override.
- `emptyTheme` must preserve interaction geometry and removable-tag semantics.

## Acceptance tests

Cover:

- declarative items without root options;
- complete options with search/virtualization;
- controlled/uncontrolled arrays and form serialization;
- reset/required/readOnly/disabled;
- Tag/TagRemove from selected values;
- removing a tag does not open/toggle popup;
- IME/search behavior;
- labels before popup mount with and without metadata;
- duplicate/unknown values and actionable diagnostics;
- selected item unmount does not silently remove controlled value;
- renderer/explicit-part precedence inherited from Select;
- SSR/hydration and nested overlay behavior;
- theme replacement, emptyTheme and local overrides.

## Scope

- `src/forms/select` MultiSelect public implementation/types/tests
- MultiSelect docs/API metadata
- direct Form consumers
- browser/type tests as needed

Do not change single Select semantics in this plan except for shared fixes proven necessary by the MultiSelect reuse contract.

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

- [ ] MultiSelect uses the same composition/data model as Select.
- [ ] Array/form state has one authority.
- [ ] Tags are presentation, not a parallel selected-state store.
- [ ] `options` is optional except where complete logical data is genuinely required.
- [ ] Search/virtualization/label lookup boundaries match Select.
- [ ] No `MultiSelect.Items` assembler or duplicated behavior kernel was introduced.
- [ ] Full regression gates pass.