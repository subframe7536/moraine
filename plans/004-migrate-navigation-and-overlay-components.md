# Plan 004: Migrate navigation and overlay components to the new style system

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. Update the plan status row when complete.
>
> **Drift check (run first)**: `git diff --stat 7a0c7768..HEAD -- src/navigation src/overlays src/shared/style src/shared/provider`
> Compare current slot and trigger/content ownership with this plan before
> editing. Stop rather than guessing if an overlay export was restructured.

## Status

- **Priority**: P1
- **Effort**: XL
- **Risk**: HIGH
- **Depends on**: `plans/001-object-only-style-runtime.md`, `plans/002-reactive-global-style-configuration.md`, `plans/003-migrate-elements-and-form-components.md`
- **Category**: migration
- **Planned at**: commit `7a0c7768`, 2026-09-03

## Why this matters

Navigation and overlay components contain the rest of the old styling model,
including state-driven animation shortcuts and the most sensitive trigger /
floating-content slot boundaries. Because navigation and overlays directly render
base elements (Button, Icon, List, Resizable, KbdGroup), executing this plan after
Plan 003 ensures all element dependencies and test fixtures are fully migrated and
stable. This plan moves those classes to standard Tailwind v4 syntax and applies
the same provider hierarchy without regressing dismissal, positioning, keyboard
navigation, accessibility, or SSR behavior.

## Current state

- Scoped class modules are `src/navigation/{breadcrumb,command-palette,
  pagination,sidebar-frame,stepper,tabs}/*.class.ts` and
  `src/overlays/{base/menu,dialog,modal,popover,sheet,tooltip}/*.class.ts`.
  `pagination`, `command-palette`, `dialog`, and `modal` class modules are
  currently static-only; keep them constants unless they acquire real variants.
- `src/navigation/stepper/stepper.class.ts` uses many disconnected `cva`
  functions, `var-stepper-*` utilities, and `$st` dimensions; make it a
  multi-slot recipe with root `defineStyleVars` geometry.
- `src/overlays/base/menu/menu.class.ts` is shared by dropdown/context menus;
  changes must preserve their owner mapping and no internal primitive gets a
  standalone provider key.
- `src/unocss/theme.ts:100-175,540-585` currently generates semantic
  animation shortcuts. Plans 001/005 replace them with explicit source
  constants and retain only engine-level `animate-mo-enter/exit` support.
- `PRD.md:570-580` assigns `ModalTrigger` and `ModalTriggerRenderer` to
  `modal`; select/menu internals to their root owners; sidebar render strategy
  components to `sidebarFrame`. `PRD.md:646-690` is the binding class/style
  precedence rule.

Overlay root `class`/`style` often target the trigger while content is a named
slot. Preserve that public meaning as documented in `docs/pages/styling.mdx`;
provider root and provider `classes.root` must therefore feed the trigger,
while content gets its named slot chain.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Navigation/overlay tests | `nub run test src/navigation src/overlays` | exit 0 |
| Provider/runtime tests | `nub run test src/shared/style src/shared/provider` | exit 0 |
| Typecheck | `nub run typecheck` | exit 0 |
| Type fixtures | `nub run test:types` | exit 0 |
| Final quality gate | `nub run qa` | exit 0 |

## Scope

**In scope**:

- Every `.tsx`, `.class.ts`, and test directly under `src/navigation/` and
  `src/overlays/`, including overlay base primitives when their classes/style
  types flow to public components.
- Provider adoption for breadcrumb, commandPalette, contextMenu, dialog,
  dropdownMenu, modal, pagination, popover, sheet, sidebarFrame, stepper,
  tabs, tooltip.
- Relevant type fixtures and shared provider tests.

**Out of scope**:

- Elements/forms (plan 003), build engine/package/docs migration (plan 005),
  and final repository audit (plan 006).
- Modifying docs-only UnoCSS syntax or `docs/unocss.config.ts`.

## Git workflow

- Branch: `codex/004-migrate-navigation-and-overlay-components`.
- Make coherent commits by subsystem. Do not push or open a PR unless asked.

## Steps

### Step 1: Inventory legacy syntax and public slot ownership

Before editing, enumerate every `cva`, cls-variant `VariantProps`, shortcut,
variant group, `$` utility, and `var-stepper-*` use in scope. For each overlay,
write down whether its top-level root is the trigger and which named slots are
floating content/overlay/arrow. Read associated interaction tests to retain
their exact ARIA attributes, portal ownership, escape/outside dismissal, and
focus behavior.

**Verify**: `rg -n "from 'cls-variant'|\bcva\(|\beffect-|animate-(overlay|popup|menu|popover|tooltip|sheet)-|var-stepper-|\w+:\(" src/navigation src/overlays` → output is a complete migration checklist.

### Step 2: Convert class modules to recipe and standard utility syntax

Replace scoped cva resolvers with plan-001 `recipe` and inferred types. Use
one multi-slot recipe where slots share variants, especially tabs, stepper,
sidebar frame, tooltip/popover/sheet, and base menu. Keep static-only modules
as `*_CLASS` constants. Translate all shortcuts through `presets.ts`; flatten
every parenthesized variant group; replace semantic animation shortcut uses
with `animate-mo-enter/exit`, state selectors, and target-specific variable
constants.

For stepper, replace `var-stepper-*` and `$st` class utilities with standard
arbitrary variable consumers and a root `defineStyleVars` resolver. Do not add
new UnoCSS regex rules or rely on source transformers.

**Verify**: `rg -n "\bcva\(|VariantProps.*cls-variant|\beffect-|animate-(overlay|popup|menu|popover|tooltip|sheet)-|var-stepper-|\w+:\(" src/navigation src/overlays` → no output.

### Step 3: Integrate provider values without breaking composition ownership

Use `useMoraineConfig()` in every scoped package-root component and merge
design props/classes/styles in PRD order. The effective design-prop sequence
is recipe defaults → provider chain → local composition context → instance;
root class/style adds provider general then provider root slot before context,
instance root slot, and top-level instance override. Non-root slots do not
receive top-level root `class`/`style`.

Apply ownership exactly: modal trigger primitives use `modal`; context and
dropdown menus use their respective root provider blocks while shared menu
internals receive the owner block; sidebar render strategies use
`sidebarFrame`; no base overlay/menu primitive is publicly configurable on its
own. Preserve `data-*`/`aria-*` state styling as state selectors, never as
provider default variants.

**Verify**: `nub run typecheck` → exit 0 with no string-style widening or
component namespace export regressions.

### Step 4: Update functional, precedence, and SSR tests

Update existing class assertions in tabs, stepper, breadcrumb, dialog,
dropdown-menu, context-menu, popover, sheet, tooltip, modal, and sidebar-frame
tests to explicit standard utility/preset classes. Add provider precedence
coverage for a navigation multi-slot component, a trigger/content overlay,
modal owner-inherited trigger primitive, and a nested provider. Test an object
style applied to trigger root separately from a content slot.

Run the SSR single-evaluation protocol for every changed component with JSX
children/render props; preserve hydration ordering and portal behavior.

**Verify**: `nub run test src/navigation src/overlays src/shared/provider` → exit 0.

## Test plan

- Existing navigation keyboard/ARIA tests and overlay focus/dismissal tests must
  continue to pass.
- New tests prove stepper root metrics, multi-slot provider merging, root versus
  content style precedence, nested providers, and owner inheritance.
- Include state animation checks using `data-*` plus explicit standard
  `animate-mo-enter/exit` utilities, not deleted semantic shortcut names.

## Done criteria

- [ ] `nub run test src/navigation src/overlays src/shared/style src/shared/provider` exits 0.
- [ ] `nub run typecheck` and `nub run test:types` exit 0.
- [ ] The scoped audit command from Step 2 emits no legacy styling tokens.
- [ ] Provider keys and owner inheritance match the PRD inventory exactly.
- [ ] Changed render-prop/children components pass the single-evaluation
  SSR/hydration checks.
- [ ] `plans/README.md` marks plan 004 DONE.

## STOP conditions

- A class-only change alters trigger/content ownership, portal behavior,
  focus restoration, keyboard navigation, or dismissability.
- A shared base menu change requires a new public provider key not in the PRD.
- The required animation can only be achieved through a removed UnoCSS shortcut
  or transformer rather than standard classes plus CSS variables.
- A provider addition evaluates a JSX render prop more than once.

## Maintenance notes

Overlay classes are especially sensitive to the root-slot distinction. Review
the final class/style argument order at every trigger and floating slot, not
only the rendered output. Keep semantic animation behavior visible in source:
the engine should provide animation primitives, while the component owns its
state selector and offset variables.
