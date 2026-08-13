# Plan 004: Align form controls and form composition

> **Executor instructions**: Follow this plan step by step. Run every verification
> command and confirm the expected result before moving on. If a STOP condition occurs,
> stop and report; do not improvise. Update this plan's row in `plans/README.md` when
> finished unless a reviewer owns the index.
>
> **Drift check (run first)**:
> `git diff --stat 620037aad7b5..HEAD -- src/forms src/elements/button src/elements/badge src/elements/icon src/shared/cva-common.class.ts style-parity-matrix.md`.
> Plans 001–003 are expected to change the matrix and element dependencies. Re-read
> their final classes before applying any form spacing; if a form source changed for a
> reason other than Plan 002's shared types, stop and reconcile it first.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: Plans 001–003
- **Category**: tech-debt
- **Planned at**: commit `620037aad7b5`, 2026-08-13

## Why this matters

Forms combine almost every visual rule in the system: control height, label rhythm,
focus/invalid treatment, dense item spacing, and popup selection states. Current
components use related but inconsistent scales, and Select/MultiSelect distribute the
same surface across public wrappers and BaseSelect. Aligning the domain as one unit
keeps a field row coherent and prevents stateful callbacks from diverging between
single controls, groups, and collection options.

## Current state

- `src/forms/input/input.class.ts`, `textarea.class.ts`, and
  `input-number.class.ts` style a wrapper with focus/invalid state, while Vega's raw
  Input/Textarea rules style the native control. Preserve Moraine's wrapper ownership
  and translate the visual effect to that surface.
- Vega's default text control anchor is `h-9`, `rounded-md`, `px-2.5`, `text-sm`, a
  subtle shadow, border, and 3 px focus/invalid ring. The completed matrix defines how
  Moraine's five sizes extend that anchor.
- `src/forms/form/form.tsx` retains its only built-in class inline. Form is structural;
  Zaidan Field is spacing evidence, not permission to turn Form into a card.
- `src/forms/select/base-select.tsx` owns popup, group, option, listbox, and empty-state
  rendering shared by Select and MultiSelect. Public wrappers own control and tag
  slots. Styling or resolving state twice would produce inconsistent precedence.
- `src/forms/select/shared/behavior.tsx` renders several option subslots outside the
  main BaseSelect return and must receive already typed state resolution inputs rather
  than invent its own contract.
- FormField, Checkbox, FileUpload, Select, and other components cache JSX/render props
  and have SSR fixtures. Stateful styling cannot eagerly resolve those trees.

## Commands you will need

| Purpose           | Command                                                                                | Expected on success          |
| ----------------- | -------------------------------------------------------------------------------------- | ---------------------------- |
| Focused component | `bun run test <form-test-file>`                                                        | selected suite passes        |
| Select cluster    | `bun run test src/forms/select/select.test.tsx src/forms/select/multi-select.test.tsx` | both pass                    |
| Domain            | `bun run test src/forms`                                                               | every form suite passes      |
| Types             | `bun run typecheck`                                                                    | exit 0                       |
| Public types      | `bun run test:types`                                                                   | build and both fixtures pass |

## Suggested executor toolkit

- Use `parity-port` to translate Zaidan Field, InputGroup, Combobox, and Select evidence
  without copying their compound-component API.
- Use `solid-js-1.x-best-practices-and-api` for reactive state construction.
- Apply `build-ssr-safe-component` to every conditional label, description, error,
  option, tag, preview, and icon branch touched by override resolution.

## Scope

**In scope:**

- `src/forms/checkbox/**`
- `src/forms/checkbox-group/**`
- `src/forms/file-upload/**`
- `src/forms/form/{form.tsx,form.class.ts,form.test.tsx,form.ssr.fixture.tsx}`
- `src/forms/form-field/**`
- `src/forms/input/**`
- `src/forms/input-number/**`
- `src/forms/radio-group/**`
- `src/forms/select/**`, including `base-select.tsx`, public Select/MultiSelect,
  `select.class.ts`, and shared render helpers.
- `src/forms/slider/slider.tsx`, `slider.class.ts`, `slider.test.tsx`, its SSR fixture,
  and `src/forms/slider/hook/use-slider.ts` only where slot-style resolution is already
  delegated there.
- `src/forms/switch/**`
- `src/forms/textarea/**`
- `test/types/default/index.tsx`, `test/types/autocomplete/index.tsx`
- form and BaseSelect rows in `style-parity-matrix.md`
- Plan 004 status in `plans/README.md`

**Out of scope:**

- Form behavior, validation rules, parsing, selection, virtualization, keyboard/focus
  mechanics, generated data attributes, or public variants.
- Changes to Button, Badge, or Icon classes completed in Plan 003. Compose their final
  scale instead of overriding it locally.
- Overlay menu styles; Select's listbox surface is in scope, DropdownMenu/ContextMenu
  are Plan 006.
- Docs pages, generated API JSON, dependencies, lockfiles, or theme infrastructure.
- Adding a public field/control abstraction or merging existing components.

## Git workflow

- Branch: `codex/004-form-style-parity`.
- Commit by batch: field/text controls, discrete controls, composite inputs, then
  Select/MultiSelect.
- Use messages such as `refactor(forms): align field and control styles`.
- Do not push or open a pull request unless instructed.

## Required state contexts

Every slot context must contain resolved variants plus the booleans/values represented
by that slot's rendered `data-*`/ARIA attributes. Use these minimum domain fields:

- All controls: size, variant, disabled, readonly, required, invalid, focused, loading,
  and value/empty state when the component already knows them.
- Checkbox/CheckboxGroup/RadioGroup/Switch: checked/unchecked/indeterminate, item,
  value, index, orientation, indicator position, and group disabled state.
- Form: submitting. FormField: error/invalid, required, disabled, field name, layout,
  size, and presence of each optional content slot.
- Input/Textarea/InputNumber: focused, filled, leading/trailing/header/footer presence;
  InputNumber also exposes orientation, raw/displayed value, increment/decrement kind,
  and per-action disabled state.
- FileUpload: dragging, invalid, disabled, readonly, multiple, dropzone, files,
  file/index, file rejection/preview availability, and remove-action state.
- Slider: orientation, size/variant, disabled/readonly, current values, range, thumb or
  divider index/value, active/dragging state, and min/max.
- Select/MultiSelect: generic source item type, open/searchable/loading/disabled/
  invalid state, input text, selected values, placement, group/option/tag indices,
  selected/highlighted/disabled option state, clear/remove state, and overflow count.

Keep generic information: `CheckboxT.State<TTrue, TFalse>`, `SelectT.State<TItem>`, and
`MultiSelectT.State<TItem>` must flow into their generic `Classes` and `Styles` aliases.
Do not erase item/value types to `unknown` or the base constraint. Do not expose Form
stores, DOM nodes, accessors, setters, or private normalized records in public callback
state; return source items and plain current values.

## Steps

### Step 1: Align Form, FormField, Input, and Textarea

Create `src/forms/form/form.class.ts` and move Form's structural root class there as a
static `*_CLASS`. Keep Form visually neutral. Use the Zaidan Field/Label/Input/Textarea
rows and the matrix to align:

- field/root/wrapper gaps, label type and disabled treatment, description/help/error
  type and color;
- default text-control height, padding, radius, border/shadow, icon size, focus,
  invalid, disabled, readonly, and dark surfaces;
- Textarea header/footer geometry and autoresize behavior without imposing a fixed
  height.

Preserve Moraine's wrapper-based ring behavior and document that selector translation
in the matrix. Wire all slot callbacks in the current reactive JSX expressions. Do not
re-read FormField's cached JSX values or render absent messages solely to style them.

Add class-anchor, state-context, reactive invalid/focus/submitting, absent-slot
laziness, static-override, and hydration tests.

**Verify**:

```sh
bun run test src/forms/form/form.test.tsx src/forms/form-field/form-field.test.tsx src/forms/input/input.test.tsx src/forms/textarea/textarea.test.tsx
bun run typecheck
```

Expected: all suites and types pass.

### Step 2: Align Checkbox, CheckboxGroup, RadioGroup, Switch, and Slider

Use Vega's 16 px checkbox/radio/slider-thumb anchor, 6 px slider track, and default
32-by-18.4 px switch anchor. Extend those anchors through Moraine's existing size
variants as recorded in the matrix. Retain card/list variants, label/description
composition, indeterminate state, multi-thumb behavior, and group orientation.

Use semantic border/ring/shadow utilities consistently. State-specific classes remain
ordinary data/ARIA selectors rather than new `cva` state variants. Keep disabled and
readonly semantics distinct even when their opacity is visually similar.

Resolve repeated item/thumb/divider callbacks per instance with exact source item,
index, and current state. CheckboxGroup must pass parent group state into its composed
Checkbox overrides without evaluating a callback in both layers.

Add tests for all default anchors, reactive checked/selected/value changes, group and
item disabled state, thumb/divider indices, drag/focus state, callbacks for absent
indicators/descriptions, and hydration stability.

**Verify**:

```sh
bun run test src/forms/checkbox/checkbox.test.tsx src/forms/checkbox-group/checkbox-group.test.tsx src/forms/radio-group/radio-group.test.tsx src/forms/switch/switch.test.tsx src/forms/slider/slider.test.tsx
bun run typecheck
```

Expected: all suites and types pass.

### Step 3: Align InputNumber and FileUpload

Treat InputNumber as a Vega InputGroup composed with the final Button/icon-button
scale. Align the root with text-control height/ring/shadow, remove duplicate borders at
the joins, use logical radii for horizontal actions, and retain vertical action layout,
hold-repeat, parsing, and wheel behavior. Resolve action callbacks once at the final
rendered button slot, distinguishing increment from decrement and current disabled
state.

Treat FileUpload as a field/dropzone plus Attachment-style file rows. Align dropzone
padding, radius, icon/type hierarchy, drag/invalid/focus states, file-row spacing,
preview/media size, metadata, and remove action to the matrix. Preserve all validation,
native input, drop, and preview behavior.

Add tests for composed size geometry, orientation and action contexts, dragging/file
state updates, repeated file indices, preview/remove callback laziness, and static
override precedence.

**Verify**:

```sh
bun run test src/forms/input-number/input-number.test.tsx src/forms/file-upload/file-upload.test.tsx
bun run typecheck
```

Expected: both suites and types pass.

### Step 4: Align BaseSelect, Select, and MultiSelect as one surface

First update BaseSelect's internal state contract and final render sites, then public
Select/MultiSelect controls. Do not apply or resolve the same public slot override in
both layers.

Use Vega Combobox/Select evidence to align:

- default/small control heights, control padding, icons, placeholder, focus/invalid and
  dark surface;
- popup radius, ring/shadow, max-height, transform origin, enter/exit motion, and
  viewport constraints using existing Moraine placement/presence primitives;
- listbox/group padding, labels, separators, option row height/gap/radius,
  highlighted/selected/disabled treatment, indicators, empty state, and scroll buttons;
- MultiSelect tag height/gap/padding/remove action and overflow count using the final
  Badge scale.

Keep listbox focus/highlight behavior and all existing data attributes. Translate
Zaidan `focus`/`data-highlighted` selectors to the attributes Moraine actually renders.
Preserve virtualization: callbacks for virtual rows receive the same source item and
semantic index as non-virtual rows, never the internal virtual entry wrapper.

Add tests for static and stateful control/content/group/item/tag slots, generic type
inference, open/close motion classes, selected/highlighted changes, filtering, empty
state, grouping, virtualization, tag removal/overflow, absent conditional slots, and
SSR/hydration of closed and initially open controls.

**Verify**:

```sh
bun run test src/forms/select/select.test.tsx src/forms/select/multi-select.test.tsx
bun run typecheck
```

Expected: both suites and types pass with no selection or hydration regression.

### Step 5: Lock public types and complete the form matrix

Add type fixtures for CheckboxGroup item state, FormField validation state,
InputNumber action state, Slider thumb state, Select option state, and MultiSelect tag
state. Assert generic values/items remain exact, cross-slot fields fail, static forms
compile, and top-level class/style callbacks fail in strict autocomplete mode.

Update every form and BaseSelect matrix row with final values, selector translations,
test evidence, and disposition.

**Verify**:

```sh
bun run test src/forms
bun run typecheck
bun run test:types
git diff --check
rg -n '\| Forms? \|.*(pending|ready-for-implementation|unclassified)' style-parity-matrix.md
```

Expected: all tests/types pass; diff check is clean; final `rg` exits 1 with no output.

## Test plan

- Every changed component asserts matrix class anchors rather than full class-string
  snapshots.
- Every slot-bearing component covers static/callback overrides, exact state,
  reactivity, absent-slot laziness, and merge precedence.
- Generic collection tests prove source item/value types survive the public state map.
- Existing SSR fixtures remain the hydration gate for conditional field content,
  controls, tags, previews, and popups.
- Select and MultiSelect test both virtual and non-virtual item callback state.

## Done criteria

- [ ] Every form row is classified with exact final test evidence.
- [ ] Text, discrete, composite, and popup controls share the matrix scale.
- [ ] BaseSelect owns shared option/popup style resolution exactly once.
- [ ] Every slot map is stateful and generic types remain precise.
- [ ] All native behavior, form integration, validation, focus, selection,
      virtualization, and SSR behavior remain unchanged.
- [ ] No compensating changes were made to completed element classes.
- [ ] `bun run test src/forms`, `bun run typecheck`, `bun run test:types`, and
      `git diff --check` pass.
- [ ] Plan 004 is marked `DONE` in `plans/README.md`.

## STOP conditions

Stop and report if:

- A matrix row is missing or conflicts with Plan 003's final control scale.
- A public slot is rendered in multiple layers and ownership cannot be made singular
  without changing its API or behavior.
- Styling requires changing validation, focus, keyboard, parsing, selection,
  virtualization, or native form semantics.
- A source item cannot be exposed without leaking a private normalized type; do not
  publish internal records as a shortcut.
- Callback resolution eagerly evaluates JSX/render props or shifts SSR/hydration order.
- A verification fails twice after a reasonable correction.

## Maintenance notes

BaseSelect is the critical review point: future Select/MultiSelect styling belongs at
the layer that owns the final DOM slot, and callback state must stay identical for
virtual and non-virtual rows. Field and control dimensions produced here become the
inputs for CommandPalette and overlay-menu composition in the next plans.
