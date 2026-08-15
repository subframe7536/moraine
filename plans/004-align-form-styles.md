# Plan 004: Align form controls and form composition

> **Executor instructions**: Follow this plan step by step. Run every verification
> command and confirm the expected result before moving on. If a STOP condition occurs,
> stop and report; do not improvise. Update this plan's row in `plans/README.md` when
> finished unless a reviewer owns the index.
>
> **Drift check (run first)**:
> `git diff --stat 620037aad7b5..HEAD -- src/forms src/elements/button src/elements/badge src/elements/icon src/shared/cva-common.class.ts style-parity-matrix.md`.
> Plans 001 and 003 are expected to change the matrix and element dependencies. Re-read
> their final classes before applying any form spacing; if a form source changed,
> stop and reconcile it first.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: Plans 001 and 003
- **Category**: tech-debt
- **Planned at**: commit `620037aad7b5`, 2026-08-13

## Why this matters

Forms combine almost every visual rule in the system: control height, label rhythm,
focus/invalid treatment, dense item spacing, and popup selection states. Current
components use related but inconsistent scales, and Select/MultiSelect distribute the
same surface across public wrappers and BaseSelect. Aligning the domain as one unit
keeps field rows, controls, groups, and collection options visually coherent.

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
  slots. Applying the same public override in both layers would produce inconsistent
  precedence.
- `src/forms/select/shared/behavior.tsx` renders several option subslots outside the
  main BaseSelect return, so shared styling must still be owned by the final DOM slot.
- FormField, Checkbox, FileUpload, Select, and other components cache JSX/render props
  and have SSR fixtures. Styling changes must preserve those trees and their evaluation
  order.

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
- Apply `build-ssr-safe-component` to every conditional label, description, error,
  option, tag, preview, and icon branch changed while moving classes.

## Selector ownership rule

Zaidan's `has-*`, `group-has-*`, `group-data-*`, and `in-data-*` selectors are evidence
of visual relationships, not a requirement to add relationship markers to Moraine. Form
components have a mostly static tree, so use existing props/accessors and put each class
on the final control, field, option, tag, preview, or action owner. BaseSelect owns its
shared popup and option slots; Select and MultiSelect own their public control and tag
slots. Pass size/variant through existing `cva` or direct slot classes. Keep existing
runtime data/ARIA and pseudo-class selectors, but do not add `data-icon`, `data-size`,
`data-placeholder`, group names, slot renames, visual-only nodes, or styling-only ARIA.

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
  and `src/forms/slider/hook/use-slider.ts` only where slot styles are already
  delegated there.
- `src/forms/switch/**`
- `src/forms/textarea/**`
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
in the matrix. For fixed label, description, error, and control branches, apply classes
from the existing accessors at their final owners rather than using `has-*` or
`group-has-*`. Do not re-read FormField's cached JSX values or render absent messages
solely to style them.

Add class-anchor, invalid/focus/submitting selectors, static-override, and hydration
tests.

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

Keep repeated item/thumb/divider classes at their final DOM owners and avoid applying
the same public override in both a group and its composed control. Use the existing
checked/selected/value accessors and size variants directly; relationship selectors are
reserved for arbitrary caller-owned children, not fixed CheckboxGroup, RadioGroup,
Switch, or Slider branches. Preserve Switch's semantic `data-unchecked` state when it
is exposed; derive dimensions from the existing size value without adding `data-size`.

Add tests for all default anchors, checked/selected/value class changes, group and item
disabled state, thumb/divider geometry, drag/focus selectors, absent
indicators/descriptions, static overrides, and hydration stability.

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
hold-repeat, parsing, and wheel behavior. Keep focus/invalid classes on the existing
root and action styling on the final rendered button slot; distinguish increment,
decrement, and disabled states through existing attributes rather than InputGroup marker
hooks.

Treat FileUpload as a field/dropzone plus Attachment-style file rows. Align dropzone
padding, radius, icon/type hierarchy, drag/invalid/focus states, file-row spacing,
preview/media size, metadata, and remove action to the matrix. Resolve optional preview
and remove branches with the existing accessors and put their classes on the rendered
owners; do not add presence markers. Preserve all validation, native input, drop, and
preview behavior.

Add tests for composed size geometry, orientation and action selectors, dragging/file
state updates, repeated file layout, absent preview/remove branches, and static
override precedence.

**Verify**:

```sh
bun run test src/forms/input-number/input-number.test.tsx src/forms/file-upload/file-upload.test.tsx
bun run typecheck
```

Expected: both suites and types pass.

### Step 4: Align BaseSelect, Select, and MultiSelect as one surface

First update BaseSelect's final render sites, then public Select/MultiSelect controls.
Do not apply the same public slot override in both layers. Translate fixed optional
branches through existing render/accessor decisions and direct final slot classes; do
not add `data-placeholder`, `data-size`, chip/icon markers, or `has-*` hooks.

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
Zaidan `focus`/`data-highlighted` selectors to the attributes Moraine actually renders,
and use direct classes for known group, item, tag, and empty-state branches. Preserve
virtualization and keep virtual and non-virtual rows on the same visual contract.

Add tests for static control/content/group/item/tag slot overrides, open/close motion
classes, selected/highlighted changes, filtering, empty state, grouping,
virtualization, tag removal/overflow, absent conditional slots, and SSR/hydration of
closed and initially open controls.

**Verify**:

```sh
bun run test src/forms/select/select.test.tsx src/forms/select/multi-select.test.tsx
bun run typecheck
```

Expected: both suites and types pass with no selection or hydration regression.

### Step 5: Complete the form matrix and run the domain gate

Run the existing public type fixtures as a regression gate. Update every form and
BaseSelect matrix row with final values, selector translations, test evidence, and
disposition. Review the Implementation plan column for direct slot ownership, allowed
runtime/arbitrary-child relationship selectors, and the absence of parity-only markers
or structural proposals.

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
- Every slot-bearing component covers static overrides and merge precedence.
- Existing SSR fixtures remain the hydration gate for conditional field content,
  controls, tags, previews, and popups.
- Select and MultiSelect test matching virtual and non-virtual item styling.
- Fixed optional slots assert their direct final-owner classes; tests do not require
  `has-*`, `group-has-*`, `in-data-*`, or newly introduced presentational attributes.

## Done criteria

- [ ] Every form row is classified with exact final test evidence.
- [ ] Text, discrete, composite, and popup controls share the matrix scale.
- [ ] BaseSelect owns shared option/popup styling exactly once.
- [ ] Fixed form slots use direct final-owner classes; arbitrary-child relationships
      are the only relationship selectors retained.
- [ ] No `data-icon`, presentational `data-size`/`data-placeholder`, new group name,
      slot rename, visual-only node, or styling-only ARIA attribute was added for parity.
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
- A Zaidan selector appears to require a new marker, group name, slot, wrapper, visual
  node, or ARIA attribute for a fixed Moraine branch; record the visual divergence and
  stop.
- Moving classes eagerly evaluates JSX/render props or shifts SSR/hydration order.
- A verification fails twice after a reasonable correction.

## Maintenance notes

BaseSelect is the critical review point: future Select/MultiSelect styling belongs at
the layer that owns the final DOM slot, and virtual/non-virtual rows must stay visually
identical. Field and control dimensions produced here become the inputs for
CommandPalette and overlay-menu composition in the next plans.
For later changes, keep each fixed form branch owned by one final DOM node and treat
Zaidan relationship selectors as evidence only; semantic state attributes may remain,
but layout/content-presence markers are not part of the contract.
