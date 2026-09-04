# Plan 002: Add reactive global style configuration

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 7a0c7768..HEAD -- src/shared src/index.ts src/utils.ts src/elements/index.ts src/forms/index.ts src/navigation/index.ts src/overlays/index.ts`
> If package-root exports or namespace shapes differ from the current-state
> inventory below, stop and refresh the inventory before editing.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: `plans/001-object-only-style-runtime.md`
- **Category**: migration
- **Planned at**: commit `7a0c7768`, 2026-09-03

## Why this matters

The library has no global styling/default configuration today: components read
only their props and occasional local composition contexts. The PRD requires a
reactive `MoraineProvider` whose nested configuration deep-merges by component,
slot, and CSS property, while preserving instance opt-out. Centralizing this
logic prevents each component family from inventing a subtly different
inheritance rule during the migration.

## Current state

- There is no `src/shared/provider/` directory.
- `src/shared/types.ts:35-54` makes root `class` and `style` part of
  `BaseProps`; `SlotStyleValue` is already `JSX.CSSProperties`, but composed
  contexts and component-specific `Styles` have not been audited.
- `src/index.ts` exposes all package-root components via four barrel files;
  `src/utils.ts` is the public utilities entry point.
- `src/elements/button/button.tsx:15-17,249-257` reads `ButtonGroupContext`
  and merges its class/default props directly. This is the concrete pattern
  later plans must refactor so provider values sit before composition and
  instance values.
- `PRD.md §3.5.1–§3.5.2` defines the provider types and deep merge behavior.
  `PRD.md §3.5.4` is the normative precedence contract:
  recipe defaults → outer/inner provider defaults → composition context →
  instance for design props; root classes/styles also insert provider general
  values before provider root-slot values; instance root slot precedes top-level
  `class`/`style`.

The required provider ownership inventory is:

| Standalone keys                                                                                                                                                                                                                                                                                                                                                                                           | Owner-inherited public exports                                                                                                                                                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| accordion, avatar, avatarGroup, badge, button, buttonGroup, card, checkbox, checkboxGroup, collapsible, commandPalette, contextMenu, dialog, dropdownMenu, fileUpload, form, formField, icon, input, inputNumber, kbd, kbdGroup, list, modal, multiSelect, pagination, popover, progress, radioGroup, resizable, select, separator, sheet, sidebarFrame, slider, stepper, switch, tabs, textarea, tooltip | `CollapsibleTrigger`/`CollapsibleContent` → collapsible; `ModalTrigger`/`ModalTriggerRenderer` → modal; `AvatarFace` → avatar; `createForm()` bound Form/Field → form/formField; sidebar render strategies → sidebarFrame; non-root select/menu primitives → owning component |

`BaseSelectT` is an internal namespace and must not receive an independent
provider key. The final inventory test must derive candidates from package-root
barrels, rather than hard-coding a list that silently drifts.

## Commands you will need

| Purpose            | Command                                                      | Expected on success             |
| ------------------ | ------------------------------------------------------------ | ------------------------------- |
| Provider tests     | `nub run test src/shared/provider/moraine-provider.test.tsx` | exit 0, all provider tests pass |
| Typecheck          | `nub run typecheck`                                          | exit 0                          |
| Type fixtures      | `nub run test:types`                                         | exit 0                          |
| Final quality gate | `nub run qa`                                                 | exit 0                          |

## Suggested executor toolkit

- When plans 003/004 begin integrating the provider into components, invoke
  `build-ssr-safe-component` for changed JSX components. The provider itself
  must expose an accessor and must not introduce prop double evaluation.

## Scope

**In scope**:

- Create `src/shared/provider/moraine-provider.tsx`, `index.ts`, and
  `moraine-provider.test.tsx`.
- `src/index.ts`, `src/utils.ts`, `src/shared/types.ts`.
- A checked provider-export inventory test/script under `src/shared/provider/`.
- Type fixtures under `src/shared/type-test/` as needed for public provider
  types and object-only style rejection.

**Out of scope**:

- Adding `useMoraineConfig()` calls to individual components; plans 003/004 do
  that after the contract is tested.
- Recipe/class syntax migration, build configuration, docs, and package
  exports beyond `index`/`utils`.
- Altering public component ownership beyond the PRD table.

## Git workflow

- Branch: `codex/002-reactive-global-style-configuration`.
- Use logical conventional commits. Do not push or open a PR unless instructed.

## Steps

### Step 1: Define provider configuration types and ownership inventory

Create `src/shared/provider/moraine-provider.tsx`. Import all package-root
component namespace types as type-only imports and implement
`ComponentDefaultStyle<V, C, S>` and `MoraineConfig` according to the full key
list above and `PRD.md §3.5.1`. Preserve component namespaces as the public
type source; do not introduce duplicate top-level component type exports.

`ComponentDefaultStyle` must expose `variants`, slot `classes` and
object `style`, slot `classes`, and object `styles`. Generic constraints must
accept `never` for components with no variants/slots while retaining root
class/style where their component API supports them.

Write a declarative ownership map alongside a test that extracts package-root
exports from `src/elements/index.ts`, `src/forms/index.ts`,
`src/navigation/index.ts`, and `src/overlays/index.ts` (following nested
barrels when necessary). Assert each public component is assigned exactly once,
either to a standalone key or the explicit owner map. Make a missing or
duplicate export fail the test with its name.

**Verify**: `nub run test src/shared/provider/moraine-provider.test.tsx` →
exit 0 and the inventory test reports no missing/duplicate names.

### Step 2: Implement reactive deep merge and context access

Define `MoraineConfigContext` as an accessor returning `MoraineConfig` with an
empty default. `MoraineProvider` must create a memo that merges `parent()` and
`props.config`; it must render children through the context without snapshotting
reactive configuration.

Implement and export `mergeComponentStyle` and `mergeMoraineConfig`:

- `variants`: shallow merge, child wins per property;
- general `class`: merge parent then child through `cn`;
- `classes`: merge per slot through `cn`, parent then child;
- general `style`: shallow merge object properties, child wins;
- `styles`: shallow-merge every slot object property, child wins (explicitly
  guard against `typeof null === 'object'` so `null` values are not spread as objects);
- missing parent/child values inherit rather than becoming empty override
  objects.

Never accept or parse CSS declaration strings. Do not cache merge results
outside Solid's memo; do not mutate either input object.

Export `MoraineProvider`, `MoraineProviderProps`, `MoraineConfig`,
`ComponentDefaultStyle`, `useMoraineConfig`, and merge helpers from the provider
barrel. Re-export only intended public names from `src/index.ts` and
`src/utils.ts`.

**Verify**: `nub run typecheck` → exit 0 with the provider API declarations
available from both entry points.

### Step 3: Characterize the precedence contract before adoption

In `moraine-provider.test.tsx`, use `@solidjs/testing-library` plus signals to
test the provider in real Solid ownership:

- an outer provider value survives when an inner block leaves that property
  unspecified;
- inner defaults/classes/styles override only their stated properties;
- nested slot styles merge property-by-property;
- class conflicts resolve child-last through `cn`, non-conflicts survive;
- reactive `config` changes update a descendant accessor without remount;
- explicit object-style values are accepted, while string styles fail in the
  type fixtures;
- use a small test consumer to demonstrate the exact class/style chain:
  recipe/default → outer/inner provider general → outer/inner root slot →
  composition → instance slot → instance root;
- assert `resolveComponentStyle` reproduces the precedence table (§3.5.3): for a
  multi-slot recipe, feed a provider/group/instance/stateCls/baseStyle and check the
  emitted root/slot class and style order matches the documented table. This test is
  the guard that keeps the single resolver and the table in sync.

The test consumer may be local to the test file; do not prematurely modify
`Button` or another public component in this plan.

**Verify**: `nub run test src/shared/provider/moraine-provider.test.tsx && nub run test:types`
→ both commands exit 0.

## Test plan

- `moraine-provider.test.tsx`: inheritance, override granularity, class and
  object-style precedence, reactive update, ownership inventory.
- Existing `src/shared/types.test.ts` and the two type fixtures: preserve
  object-style acceptance and add rejected strings for provider values.
- Do not use snapshot-only assertions; inspect resolved classes/styles.

## Done criteria

- [ ] Provider configuration is accessor-based and nested values deep-merge.
- [ ] The inventory test maps every package-root public component exactly once.
- [ ] `nub run test src/shared/provider/moraine-provider.test.tsx`, `nub run typecheck`, and `nub run test:types` exit 0.
- [ ] `rg -n "style:\s*['\"]|styles:\s*['\"]" src/shared/provider src/shared/type-test` finds only explicit `@ts-expect-error` negative tests.
- [ ] No component `.tsx` or `.class.ts` file changed in this plan.
- [ ] `plans/README.md` marks plan 002 DONE.

## STOP conditions

- A package-root export cannot be conclusively assigned under the PRD owner
  table; report the name rather than inventing a provider scope.
- Namespace types create a runtime circular dependency; refactor imports to
  type-only or report the cycle, but do not weaken public types to `any`.
- Reactive config tests require remounting a child to update.
- A component-specific style surface currently permits strings through a type
  path not represented by `SlotStyleValue`; identify its exact file for plans
  003/004 rather than silently widening the provider types.

## Maintenance notes

The provider is a merge primitive, not a styling engine. It must never scan
classes, generate CSS, or own state attributes. Component integrations should
reuse the tested ordering verbatim; reviewers should reject a local merge that
puts a composition context before provider defaults or allows a provider to
override an explicit instance value.
