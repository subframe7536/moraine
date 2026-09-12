# Plan 034: Replace Resizable JSX descriptors with actual Panel/Handle parts

> Executor: read this entire file and `plans/README.md` before implementation. Update this plan's row in `plans/README.md` when finished. Creating this plan did not authorize implementation.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: [002-browser-regressions.md](002-browser-regressions.md), [003-host-render.md](003-host-render.md)
- **Category**: dx
- **Planned at**: commit `7d9633ca405c2bcf256481298486c7daee3e1456`, 2026-09-11
- **State**: DEFERRED — candidate; activate only when this family is selected

## Why this matters

Keep Panel/Handle, existing disable naming and resize/collapse actions. Migrate JSX descriptor scanning to actual parts with one explicit constraint/measurement owner. Remove JSX content/state callbacks; state needed by custom content comes from a scoped accessor or state attributes. Add plan 003 `as` polymorphism only where a demonstrated custom Handle host needs it. Preserve root-owned measurements, constraints, keyboard/pointer behavior and nested panel ownership; do not expose internal `crossTarget` or add wrapper parts.

Host replacement and content rendering are separate concerns:

- `as` selects the Handle element/custom component;
- `children` remains Handle content;
- children is ordinary JSX; state accessors return data and never take ownership of rendering;
- there is no host-level `render` prop.

## Anatomy

This is the intended content/host shape, not a completed constraint API. Before implementation, decide how default sizes and constraints reach the root on the first server render without scanning these children. The prototype uses explicit root metadata instead.

```tsx
<Resizable>
  <Resizable.Panel defaultSize="35%">Navigation</Resizable.Panel>
  <Resizable.Handle action="resize" as={CustomResizeHandle}>
    <span>Resize panels</span>
  </Resizable.Handle>
  <Resizable.Panel>Editor</Resizable.Panel>
</Resizable>
```

`CustomResizeHandle` must forward the Handle's required role/ARIA/data/event/ref props to one suitable DOM host. Moraine must not add a wrapper or inspect its returned JSX.

## Public contract

- Root remains the single measurement/constraint authority.
- Panel/Handle keep their canonical names.
- `Handle as={...}` may select a valid intrinsic or custom Solid component.
- Handle `children` is rendered as content inside the selected host. Remove the existing JSX state callback rather than renaming it.
- Required separator/resize semantics, keyboard handlers, pointer capture and refs survive custom hosts.
- Custom target-specific props remain type-checkable where the selected component type exposes them.
- Do not introduce host-level `render`.
- Keep existing Moraine styling slots, theme replacement and local overrides.

## Round-three prototype evidence and required follow-up

[Round-three experiment record](pr37-prototype-round3-findings.md), 2026-09-12. This is bounded prototype evidence; the production status above is unchanged.

**Observed:** Actual Panel/Handle DOM parts with explicit root constraint metadata reuse resolvePanels/resizeFromHandle/useResizableHandle. Wrapped composition, pointer measurement, keyboard resizing and behavior geometry under emptyTheme pass.

**Production acceptance:** The current production Panel returns descriptors and the root scans JSX; adding as alone cannot meet the composition contract. Replace that path without rendering children as data. Prototype panels metadata is a bounded candidate, not a settled required API. Controlled/dynamic sizes, collapse/action callbacks, nested/intersection geometry and pointer cleanup remain gates.

Port the relevant experiment regressions before migration. The shared test totals are not a per-family coverage claim; default behavior, public types, docs and the untested boundaries still require this plan's gates.

## Current state

Inspect `src/elements/resizable`, colocated type/tests/SSR fixtures and direct SidebarFrame consumers before implementation. Preserve existing resize/collapse behavior while explicitly migrating descriptor and JSX callback consumers. Decide the minimal SSR-safe constraint metadata/registration contract before implementation; the prototype's required panels array is not yet the public contract.

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

First replace the current descriptor/JSX scanner with a settled constraint metadata contract and actual rendered parts. Then confirm which Handle host customization requires intrinsic/custom-component `as`. Do not add polymorphism to Panel merely for symmetry.

### 2. Add acceptance cases

Test:

- default Handle host;
- intrinsic/custom `as` Handle;
- custom target props;
- ordinary Handle children rendered inside selected host, with negative JSX callback tests;
- wrapped/conditional/reordered Panel composition without child scanning;
- SSR-safe constraints, duplicate IDs and dynamic panel removal;
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

Update any existing `render` host examples to `as`. Document host selection (`as`), ordinary content children and data-only state access separately. Migrate direct SidebarFrame consumers of descriptor behavior in the same selected family.

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
- [ ] Panel/Handle render actual DOM, without JSX descriptor scanning or JSX callback props.
- [ ] The constraint metadata contract is documented and SSR-safe.
- [ ] Root measurements/constraints remain authoritative.
- [ ] Keyboard/pointer/ref/ARIA behavior survives custom targets.
- [ ] Browser/type/SSR/full regression gates pass.

## STOP conditions

Stop if custom Handle support requires JSX inspection, a compensating wrapper, duplicate interactive nodes, type erasure, or another host-level rendering callback.
