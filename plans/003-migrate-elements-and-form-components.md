# Plan 003: Migrate elements and form components to the new style system

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. Update the plan status row when complete.
>
> **Drift check (run first)**: `git diff --stat 7a0c7768..HEAD -- src/elements src/forms src/shared/cva-common.class.ts src/shared/style src/shared/provider`
> Compare all listed legacy `cva` modules and public namespace shapes below
> before proceeding. Stop if a component was moved or its slot API changed.

## Status

- **Priority**: P1
- **Effort**: XL
- **Risk**: HIGH
- **Depends on**: `plans/001-object-only-style-runtime.md`, `plans/002-reactive-global-style-configuration.md`
- **Category**: migration
- **Planned at**: commit `7a0c7768`, 2026-09-03

## Why this matters

Elements and form controls are the largest source of current `cva` calls,
UnoCSS-only syntax, shortcut tokens, and manually duplicated slot variants.
Migrating them to multi-slot `recipe`, explicit standard utilities, object-only
styles, CSS variables, and the provider contract makes the public behavior
consistent while preserving interaction and accessibility semantics.

## Current state

- The scoped class modules are: `src/elements/{avatar,badge,button,
  button/button-group,kbd,progress,resizable,separator}/*.class.ts` and
  `src/forms/{checkbox,checkbox-group,file-upload,form/form-field,input,
  input-number,radio-group,select,slider,switch,textarea}/*.class.ts`.
  `accordion`, `card`, `collapsible`, and `form/form.class.ts` are static-only
  modules and must stay constants unless a real variant is introduced.
- `src/forms/file-upload/file-upload.class.ts` has many independent `cva`
  functions sharing `size`; turn this into one multi-slot recipe.
- `src/forms/slider/slider.class.ts`, `src/elements/progress/progress.class.ts`,
  and `src/navigation/stepper/stepper.class.ts` use `var-*` geometry tokens.
  Slider/progress belong here; use `defineStyleVars` at the root.
- `src/elements/button/button.tsx:249-257` currently merges only instance
  root styles/classes and applies `ButtonGroupContext` to variants. It is the
  reference for applying provider-before-context-before-instance precedence.
- `src/shared/cva-common.class.ts` provides reusable maps such as
  `TEXT_SIZE_VARIANT`; it was normalized in plan 001 and may be retained as
  named standard class maps if still useful.
- `PRD.md:646-690` is the mandatory resolution order. State values such as
  loading, disabled, active, invalid, and dragging remain DOM state/data/aria
  attributes or explicit preset classes; they do not become provider defaults.

Repository conventions: class files use named `*_CLASS` constants for static
classes; relative imports require `.ts`/`.tsx`; do not destructure Solid props;
use `Show`/`For`/`Switch`; changed JSX components must follow the
`build-ssr-safe-component` protocol so JSX-valued props evaluate once in SSR
and hydration.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Elements/form tests | `nub run test src/elements src/forms` | exit 0 |
| Shared runtime/provider tests | `nub run test src/shared/style src/shared/provider` | exit 0 |
| Typecheck | `nub run typecheck` | exit 0 |
| Type fixtures | `nub run test:types` | exit 0 |
| Final quality gate | `nub run qa` | exit 0 |

## Scope

**In scope**:

- Every `.tsx`, `.class.ts`, and test directly under `src/elements/` and
  `src/forms/`, including `forms/select/base-select.tsx`, `multi-select.tsx`,
  form contexts, hooks when their style types flow through them, and relevant
  shared common-class constants.
- Component-specific provider adoption for these keys: accordion, avatar,
  avatarGroup, badge, button, buttonGroup, card, checkbox, checkboxGroup,
  collapsible, fileUpload, form, formField, icon, input, inputNumber, kbd,
  kbdGroup, list, multiSelect, progress, radioGroup, resizable, select,
  separator, slider, switch, textarea.
- Related type fixtures and tests.

**Out of scope**:

- Navigation/overlays (plan 004), engines/package/docs (plan 005), and final
  global deletion audit (plan 006).
- Changing public behavior, slot names, keyboard behavior, or accessibility
  contracts merely to simplify styling.

## Git workflow

- Branch: `codex/003-migrate-elements-and-form-components`.
- Commit by coherent family (for example button+button-group, then selection
  controls), without changing files outside scope. Do not push unless asked.

## Steps

### Step 1: Make a scoped token-and-variant inventory before edits

For each scoped `.class.ts`, classify it as static-only, atomic variant, or
multi-slot variant. Record every legacy `cva`, `VariantProps`, `effect-*`,
semantic animation shortcut, parenthesized variant group, `$` variable utility,
and `var-(slider|progress)-*` occurrence. Read each corresponding `.tsx` and
test before changing it, so existing slot class assertions and DOM behavior are
preserved.

**Verify**: `rg -n "from 'cls-variant'|\bcva\(|\beffect-|\bvar-(slider|progress)-|\w+:\(" src/elements src/forms` → output is the migration checklist, with no unreviewed files.

### Step 2: Convert style modules and dynamic metrics

Replace every scoped `cva` resolver and `VariantProps` import with the plan-001
`recipe` and its inferred `VariantProps`. Use atomic recipes only for truly
one-slot components; consolidate shared dimensions/variants into multi-slot
recipes for file upload, checkbox, checkbox-group, radio-group, select,
slider, progress, and button families. Preserve exported component namespace
variant types, but do not retain an exported cva-shaped API.

Use `presets.ts` constants in recipe bases rather than shortcut strings and
translate every source class to flat Tailwind v4 syntax (including `b-t` ->
`border-t` in `separator.class.ts`). Static-only modules must remain `*_CLASS`
constants, not `recipe` calls. Replace slider/progress regex class geometry with
standard arbitrary variable reads in slots and `defineStyleVars` output in their
root style. Merge generated variables before provider/context/instance styles,
preserving property-level last-wins order.

**Verify**: `rg -n "\bcva\(|VariantProps.*cls-variant|\beffect-|\bvar-(slider|progress)-|\w+:\(|\bb-t\b" src/elements src/forms` → no output.

### Step 3: Adopt provider precedence in every scoped public component

For each provider key in scope, read `useMoraineConfig()` reactively and apply
the PRD ordering exactly:

1. recipe default variants, then provider defaults (already outer-to-inner),
   then owning composition context, then explicit instance design prop;
2. recipe slot classes, provider general/root or slot classes, composition
   classes, instance slot class, then instance root `class` for root only;
3. generated styles, provider general/root or slot styles, composition styles,
   instance slot styles, then instance root `style` for root only.

`AvatarFace` inherits `avatar`; `CollapsibleTrigger` and `CollapsibleContent`
inherit `collapsible`; bound `createForm()` Form/Field use `form`/`formField`;
Icon, AvatarGroup, KbdGroup, and Form have standalone keys. Maintain owner
contexts such as `ButtonGroupContext` between provider and instance. Do not
promote loading/disabled/invalid/dragging state to `defaultProps`.

**Verify**: `nub run typecheck` → exit 0 and no public style type accepts a
string.

### Step 4: Update behavior, provider, and SSR tests family by family

Keep and update existing assertions in button, checkbox, input, radio-group,
select/multi-select, slider, switch, textarea, progress, avatar, badge, kbd,
separator, and resizable tests. Replace assertions against old shortcut
literals with the expanded standard token/preset contract (including updating
old UnoCSS parenthesized groups such as `hover:(text-foreground bg-muted-hover)` ->
`hover:text-foreground hover:bg-muted-hover` in `button-group.test.tsx`, `b-t` ->
`border-t` in separator tests, and `not-first-of-type:` -> `[&:not(:first-of-type)]:`
in checkbox-group and radio-group tests). Add provider tests for one atomic
component, one multi-slot component, a group context (`ButtonGroup`), a bound
form field, and an owner-inherited primitive. Include object-style override
tests for root and named slots.

For every changed component receiving JSX-valued props, add or retain
single-evaluation SSR/hydration tests according to `build-ssr-safe-component`.

**Verify**: `nub run test src/elements src/forms src/shared/provider` → exit 0.

## Test plan

- Existing behavioral/a11y tests remain passing for all scoped components.
- New targeted provider precedence tests cover Button/ButtonGroup, FileUpload
  multi-slot classes, Form/Field ownership, Icon/AvatarGroup/KbdGroup keys,
  object-style precedence, and an instance opt-out.
- Slider/progress tests assert computed CSS variables on roots and standard
  child utility classes, not legacy `var-*` tokens.

## Done criteria

- [ ] `nub run test src/elements src/forms src/shared/style src/shared/provider` exits 0.
- [ ] `nub run typecheck` and `nub run test:types` exit 0.
- [ ] The scoped `rg` legacy-token audit in Step 2 has no output.
- [ ] Every scoped package-root component reads its assigned provider scope;
  no one gets an unlisted key.
- [ ] All runtime `style`/`styles` paths in scope accept objects only.
- [ ] `plans/README.md` marks plan 003 DONE.

## STOP conditions

- A replacement changes an existing DOM slot name, keyboard behavior, or ARIA
  assertion; restore behavior and report the styling conflict.
- A class cannot be represented by a standard Tailwind v4 token and needs a
  new engine capability not in the PRD.
- Provider integration requires reading a stale non-accessor config snapshot.
- A changed JSX component cannot satisfy the single-evaluation protocol without
  a broader API redesign.

## Maintenance notes

Review diffs by component family, paying special attention to root precedence:
the instance `class` and object `style` are always strongest. Do not use
recipes for static-only files and do not resurrect regex variable utilities;
new coupled metrics belong in `defineStyleVars` on the owner root.
