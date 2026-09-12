# Plan 034: Improve Resizable host customization without renaming parts

> Executor: read this entire file and `plans/README.md` before implementation. Update this plan's row in `plans/README.md` when finished. Creating this plan did not authorize implementation.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: [002-browser-regressions.md](002-browser-regressions.md), [003-host-render.md](003-host-render.md)
- **Category**: dx
- **Planned at**: commit `7d9633ca405c2bcf256481298486c7daee3e1456`, 2026-09-11
- **State**: DEFERRED — candidate; activate only when this family is selected

## Why this matters

Keep Panel/Handle, existing disable naming, resize/collapse action and the existing Handle content/state callback where still useful. Add plan 003 `as` polymorphism only where a demonstrated custom Handle host needs it. Preserve root-owned measurements, constraints, keyboard/pointer behavior and nested panel ownership; do not expose internal `crossTarget` or add wrapper parts.

Host replacement and content rendering are separate concerns:

- `as` selects the Handle element/custom component;
- `children` remains Handle content;
- if the existing children state callback is retained, it is a **content render-prop**, not a host factory;
- there is no host-level `render` prop.

## Anatomy

```tsx
<Resizable>
  <Resizable.Panel defaultSize="35%">Navigation</Resizable.Panel>
  <Resizable.Handle action="resize" as={CustomResizeHandle}>
    {(state) => <span>{state.active ? 'Resizing' : 'Resize panels'}</span>}
  </Resizable.Handle>
  <Resizable.Panel>Editor</Resizable.Panel>
</Resizable>
```

`CustomResizeHandle` must forward the Handle's required role/ARIA/data/event/ref props to one suitable DOM host. Moraine must not add a wrapper or inspect its returned JSX.

## Public contract

- Root remains the single measurement/constraint authority.
- Panel/Handle keep their canonical names.
- `Handle as={...}` may select a valid intrinsic or custom Solid component.
- Handle `children` is rendered as content inside the selected host. The optional state callback, if preserved, only computes that content.
- Required separator/resize semantics, keyboard handlers, pointer capture and refs survive custom hosts.
- Custom target-specific props remain type-checkable where the selected component type exposes them.
- Do not introduce host-level `render`.
- Keep existing Moraine styling slots, theme replacement and local overrides.

## Current state

Inspect `src/elements/resizable`, colocated type/tests/SSR fixtures and direct SidebarFrame consumers before implementation. Preserve existing resize/collapse behavior and content callback semantics unless this plan explicitly migrates them.

## Scope

- `src/elements/resizable`
- `docs/pages/(general)/resizable`
- declaration/type-test fixtures
- `src/shared/provider/theme-layout.test.tsx`
- existing direct SidebarFrame/Resizable docs consumers
- real browser tests

Do not redesign all layout primitives or expose internal measurement targets.

## Steps

### 1. Reconcile baseline and actual customization need

Confirm which Handle host customization is required and whether intrinsic/custom-component `as` is sufficient. Do not add polymorphism to Panel merely for symmetry.

### 2. Add acceptance cases

Test:

- default Handle host;
- intrinsic/custom `as` Handle;
- custom target props;
- Handle children/content callback rendered inside selected host;
- negative type test for host-level `render`;
- required role/ARIA/state/event/ref forwarding;
- keyboard resize/collapse;
- pointer capture/cleanup;
- min/max and nested geometry;
- disabled state;
- lifecycle callback ordering;
- SSR/hydration;
- theme replacement/emptyTheme/local overrides.

### 3. Implement only the stated contract

Reuse existing root measurements and behavior. `as` must not introduce a second handle DOM node, wrapper or separate interaction state.

### 4. Complete docs/types/migration evidence

Update any existing `render` host examples to `as`. Make the distinction between host selection (`as`) and stateful content children explicit in API docs.

## Verification

```sh
nub run test src/elements/resizable
nub run test:browser
nub run typecheck
nub run test:types
nub run docs:build
nub run test
nub run qa
git diff --check
```

## Done criteria

- [ ] Handle host customization uses `as`, not host-level `render`.
- [ ] Existing stateful children remain content-only if retained.
- [ ] Root measurements/constraints remain authoritative.
- [ ] Keyboard/pointer/ref/ARIA behavior survives custom targets.
- [ ] Browser/type/SSR/full regression gates pass.

## STOP conditions

Stop if custom Handle support requires JSX inspection, a compensating wrapper, duplicate interactive nodes, type erasure, or another host-level rendering callback.