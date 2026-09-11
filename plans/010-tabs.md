# Plan 010: Make Tabs composition-first with optional collection data

> Executor: read this file plus `plans/README.md` before implementation. This plan replaces the previous mandatory-root-items design.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: [002-browser-regressions.md](002-browser-regressions.md), [003-host-render.md](003-host-render.md)
- **Category**: dx
- **State**: TODO

## Why this matters

Tabs should use explicit, shadcn-style composition as the primary public API. `items` becomes optional metadata rather than a required structure source.

Expose `Tabs.List`, `Tabs.Trigger`, `Tabs.Content` and `Tabs.Indicator`. Do not add `Tabs.Items`; normal dynamic rendering should use Solid `<For>`.

Without `items`, declared Trigger/Content parts establish the relevant collection metadata. With `items`, the root may know disabled/order/labels/content for entries that have not mounted yet. Both paths must share one selection/navigation behavior authority.

Preserve activation mode, controlled/uncontrolled value, RTL, keyboard loop, indicator behavior, theme overrides and SSR/hydration guarantees.

## Target anatomy

Static composition:

```tsx
<Tabs defaultValue="overview">
  <Tabs.List>
    <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
    <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
    <Tabs.Indicator />
  </Tabs.List>

  <Tabs.Content value="overview">
    <ProjectOverview />
  </Tabs.Content>
  <Tabs.Content value="activity">
    <ProjectActivity />
  </Tabs.Content>
</Tabs>
```

Dynamic composition:

```tsx
<Tabs defaultValue="overview">
  <Tabs.List>
    <For each={tabs}>
      {(tab) => (
        <Tabs.Trigger value={tab.value} disabled={tab.disabled}>
          {tab.label}
        </Tabs.Trigger>
      )}
    </For>
    <Tabs.Indicator />
  </Tabs.List>

  <For each={tabs}>
    {(tab) => (
      <Tabs.Content value={tab.value}>{tab.content}</Tabs.Content>
    )}
  </For>
</Tabs>
```

Optional complete metadata:

```tsx
<Tabs items={tabs} defaultValue="overview">
  {/* explicit parts may still be rendered from the same data */}
</Tabs>
```

`items` must not silently switch the component into a second hidden widget implementation.

## Public contract

### Root

- `value`, `defaultValue`, `onChange`, `activationMode`, `orientation`, `disabled` and keyboard behavior remain root-owned.
- `items` is optional complete-collection metadata.
- Accept readonly data where practical so `as const` / `satisfies` usage does not require copying arrays.
- Do not derive a complete collection by scanning/evaluating JSX.

### Trigger

- `value` is required in declarative mode.
- label/children and disabled state may be declared directly on the part.
- When root metadata exists, explicit part props win only where the documented precedence allows; define this precedence once and test it.
- Trigger registration must not become a second selection authority.

### Content

- `value` is required in declarative mode.
- children are the panel content; there is no hidden inherited-content mode that depends on whether children is omitted.
- Root metadata may be used by convenience consumers, but Content should not need to materialize root data to render explicit children.

### Indicator

- Uses mounted Trigger geometry only.
- Must tolerate conditional/unmounted triggers and real-browser resizing without stale measurements.

## SSR boundary

Without a complete root collection, the server cannot reliably discover "the first enabled Trigger" from future/conditional JSX without evaluating children as data.

Therefore:

- SSR examples should provide `value` or a valid `defaultValue` when initial selection must be deterministic.
- Do not render/scan child JSX twice to infer the first enabled item.
- First server HTML must contain valid `role=tab`, panel associations and non-dangling IDREFs for the parts actually rendered.
- Hydration must preserve node identity and parentage.

## Styling

- Retain current Tabs recipe/theme slots and `createComponentStyles` behavior.
- Parts receive default Moraine styling when composed manually.
- Root `classes/styles` continue to override named slots; part-local `class/style` is the narrowest override.
- `emptyTheme` removes presentation without breaking semantic/focus/indicator geometry requirements.

## Scope

- `src/navigation/tabs`
- Tabs docs/API/type tests
- shared selectable-collection navigation only where genuinely reusable
- browser tests for keyboard/focus/indicator geometry
- direct docs/consumer migrations

Do not redesign Stepper while sharing navigation utilities.

## Acceptance tests

Cover:

- static parts with no `items`;
- dynamic `<For>` parts with no `items`;
- readonly `items` metadata;
- controlled and uncontrolled values;
- explicit valid defaultValue for SSR;
- disabled first trigger and invalid default diagnostics;
- trigger deletion/reordering/conditional mounting;
- duplicate values and unknown metadata/part mismatches;
- keyboard activation/focus, RTL and looping;
- server ID/ARIA correctness and hydration identity;
- indicator browser geometry;
- theme replacement, emptyTheme and local overrides;
- root generic/signature stability after attaching parts.

## Migration

Remove the previous requirement that manual Tabs must duplicate every trigger/content value in root `items`. Existing data-driven callers may keep `items`, but docs should prefer direct composition for static structure and application `<For>` loops for dynamic structure.

Do not introduce `Tabs.Items` as a migration helper.

## Verification

```sh
nub run test src/navigation/tabs
nub run test:browser
nub run typecheck
nub run test:types
nub run docs:build
nub run test
nub run qa
git diff --check
```

## Done criteria

- [ ] Tabs works composition-first without root `items`.
- [ ] Optional `items` metadata uses the same behavior authority.
- [ ] SSR behavior does not depend on hidden JSX discovery.
- [ ] Dynamic application data is demonstrated with `<For>`, not `Tabs.Items`.
- [ ] Existing styling override semantics are preserved.
- [ ] Browser, declaration, SSR and full regression gates pass.

## STOP conditions

Stop if implementation requires scanning/evaluating child JSX twice, if mounted registrations become the canonical controlled value source, if `items` and declarative parts create competing selection state, or if SSR correctness depends on client-only discovery.