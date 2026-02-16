# TODO: Form Components (16)

## Execution Policy

- Complete non-skip pending items in phased order instead of parallel ad-hoc work.
- Treat `slider` as blocked by `tooltip` from overlay scope.
- Do not mark a component as done until it has logic, styles, tests, and exports.
- This file is the single source of truth for unified select architecture.

- [x] checkbox | nuxt:Checkbox.vue | coss:checkbox.tsx | rock:src/checkbox/ | tests+exports
- [x] checkbox-group | nuxt:CheckboxGroup.vue | coss:checkbox-group.tsx | rock:src/checkbox-group/ | tests+exports
- [ ] (Skip for now) color-picker | nuxt:ColorPicker.vue | coss:select.tsx + popover.tsx | rock:src/color-picker/ | tests+exports
- [ ] file-upload | nuxt:FileUpload.vue | coss:input.tsx | rock:src/file-upload/ | tests+exports
- [x] form | nuxt:Form.vue | coss:form.tsx | rock:src/form/ | tests+exports
- [x] form-field | nuxt:FormField.vue | coss:field.tsx | rock:src/form-field/ | tests+exports
- [x] input | nuxt:Input.vue | coss:input.tsx | rock:src/input/ | tests+exports
- [ ] (Skip for now) input-date | nuxt:InputDate.vue | coss:input.tsx + popover.tsx | rock:src/input-date/ | tests+exports
- [x] input-number | nuxt:InputNumber.vue | coss:number-field.tsx | rock:src/input-number/ | tests+exports
- [ ] (Skip for now) input-time | nuxt:InputTime.vue | coss:input.tsx | rock:src/input-time/ | tests+exports
- [ ] (Skip for now) pin-input | nuxt:PinInput.vue | coss:input.tsx | rock:src/pin-input/ | tests+exports
- [x] radio-group | nuxt:RadioGroup.vue | coss:radio-group.tsx | rock:src/radio-group/ | tests+exports
- [x] select | nuxt:Select.vue + SelectMenu.vue + InputTags.vue | coss:combobox.tsx + select.tsx | rock:src/select/ | tests+exports | covers former input-menu/select-menu/input-tags
- [ ] slider | nuxt:Slider.vue | coss:slider.tsx | rock:src/slider/ | tests+exports
- [x] switch | nuxt:Switch.vue | coss:switch.tsx | rock:src/switch/ | tests+exports
- [x] textarea | nuxt:Textarea.vue | coss:textarea.tsx | rock:src/textarea/ | tests+exports

## Phases

### P0 - Cross-category prerequisite

- `tooltip` (from `plans/todo-overlay.md`) must be completed first.
- Scope: `src/tooltip/` implementation, tests, and export.
- Dependency reason: `slider` tooltip behavior depends on a stable tooltip component API.
- Exit criteria: `tooltip` tests pass and `src/index.ts` export is available.

### P1 - Unified Select (single/multiple/tags)

- Component: `select` only.
- Scope:
  - `mode` tri-state: `single`, `multiple`, `tags`
  - searchable dropdown
  - clear behavior
  - option groups
  - custom render hooks
  - form `change/input/blur/focus` integration
  - api reference: `https://ant.design/components/select.md`
- Architecture rule:
  - merge old `input-menu`, `select-menu`, and `input-tags` capabilities into `select`
  - no standalone `src/input-menu/`, `src/select-menu/`, `src/input-tags/`
- Style contract:
  - reference docs: `coss/apps/ui/content/docs/components/combobox.mdx`
    - examples source code: `coss/apps/ui/registry/default/particles/p-combobox-*.tsx`
  - reference source: `coss/packages/ui/src/components/combobox.tsx`
  - secondary source: `coss/packages/ui/src/components/select.tsx`
- Slot-level style baseline:
  - trigger/input shell follows Coss combobox input container states (border/ring/focus/invalid/disabled)
  - popup follows Coss combobox popup shell (rounded border, popover background, transform-origin context)
  - option row follows Coss two-column layout (`indicator + label`)
  - chips/tags follow Coss combobox chips and chip-remove interaction
  - clear/trigger icon placement follows Coss right-side controls
- Variant baseline:
  - size: `sm/default/lg`
  - states: `disabled`, `focus-visible/focus-within`, `aria-invalid`, `highlighted`, `selected`, `empty`
- Deliverables:
  - `src/select/` full folder set (`.tsx`, `.class.ts`, `.test.tsx`, `index.ts`)
  - root export in `src/index.ts`
  - complete tests for single/multiple/tags and form flows
- Exit criteria:
  - keyboard navigation and ARIA assertions pass
  - form event integration (`change/input/blur/focus`) verified
  - full unified select test matrix passes

### P2 - File upload

- Component: `file-upload`
- Scope:
  - single and multiple files
  - dropzone flow
  - remove file
  - preview behavior
- Deliverables:
  - `src/file-upload/` complete folder set
  - exports in local `index.ts` and root `src/index.ts`
  - test coverage for async-like user flows and edge cases
- Exit criteria:
  - file reset and input clearing behavior verified
  - single vs multiple mode behavior verified

### P3 - Slider completion

- Component: `slider`
- Hard dependency: P0 `tooltip` completed.
- Scope: single-thumb and range values, horizontal and vertical orientation, optional tooltip value display.
- Deliverables:
  - `src/slider/` complete folder set
  - export in local `index.ts` and root `src/index.ts`
  - tests for value commit and accessibility labels
- Exit criteria:
  - change and input event behavior integrates with form context
  - tooltip mode assertions pass when enabled

## Public API / Type Contract (P1 Unified Select)

- `SelectProps` main fields:
  - `mode?: 'multiple' | 'tags'`
  - `options?: SelectOption[]`
  - `fieldNames?: { label?: string; value?: string; options?: string; groupLabel?: string }`
  - `value?`, `defaultValue?`, `onChange?`
  - `open?`, `defaultOpen?`, `onOpenChange?`
  - `showSearch?`, `searchValue?`, `defaultSearchValue?`, `onSearch?`
  - `filterOption?: boolean | ((inputValue, option) => boolean)`
  - `optionFilterProp?: string`
  - `allowClear?`, `onClear?`
  - `tokenSeparators?: string[]`
  - `maxCount?`, `maxTagCount?`
  - `optionRender?`, `tagRender?`, `labelRender?`, `dropdownRender?`
- `SelectOption` fields:
  - `label`, `value`, `disabled`
  - `options` (group children)
  - `description`, `icon`, `avatar`, `chip`
- Breaking API rules:
  - do not support old public keys `items`, `valueKey`, `labelKey`, `descriptionKey`
  - do not support `createItem`; use `mode='tags'` + input strategy instead

## Definition Of Done (Per Component)

- `src/<component>/<component>.tsx` implemented.
- `src/<component>/<component>.class.ts` implemented with cva/Uno style mapping.
- `src/<component>/<component>.test.tsx` implemented.
- `src/<component>/index.ts` export added.
- Root export added in `src/index.ts`.
- Uses `icon-*` aliases for default icons (no provider-specific hardcoded icon classes).

## Required Test Scenarios

- single mode controlled and uncontrolled behavior.
- multiple mode selection and remove behavior.
- tags mode creation via Enter and `tokenSeparators`.
- search + `filterOption` (boolean/function) behavior.
- clear behavior (`allowClear` + `onClear`).
- grouped options and disabled options.
- render hooks (`optionRender`, `tagRender`, `labelRender`, `dropdownRender`).
- keyboard navigation and ARIA behavior.
- form integration events (`change`, `input`, `blur`, `focus`).

## Acceptance Criteria

- `plans/todo-form.md` keeps only unified `select` route without standalone `input-menu`/`input-tags`/`select-menu`.
- P1 definition explicitly includes AntD-like API contract and Coss combobox/select style baseline.
- P1 completion is defined by unified select full test matrix pass.

## Assumptions And Defaults

- This iteration only updates planning file and does not implement runtime code.
- Breaking change is accepted; no backward compatibility layer is provided for old select-like APIs.
- Coss combobox/select examples are the style reference baseline, then adapted to Uno + cva in implementation phase.

## Tracking

- [x] P0 complete (`tooltip` prerequisite)
- [x] P1 dependency resolved (`avatar` + `chip` complete, unified `select` unblocked)
- [x] Architecture merged (`input-menu` + `input-tags` + `select-menu` -> `select`)
- [x] P1 complete (unified `select`)
- [ ] P2 complete (`file-upload`)
- [ ] P3 complete (`slider`)
