# TODO: Form Components (19)

## Execution Policy

- Keep all `Skip for now` entries unchanged in this file.
- Complete non-skip pending items in phased order instead of parallel ad-hoc work.
- Treat `slider` as blocked by `tooltip` from overlay scope.
- Do not mark a component as done until it has logic, styles, tests, and exports.

- [x] checkbox | nuxt:Checkbox.vue | coss:checkbox.tsx | rock:src/checkbox/ | tests+exports
- [x] checkbox-group | nuxt:CheckboxGroup.vue | coss:checkbox-group.tsx | rock:src/checkbox-group/ | tests+exports
- [ ] (Skip for now) color-picker | nuxt:ColorPicker.vue | coss:select.tsx + popover.tsx | rock:src/color-picker/ | tests+exports
- [ ] file-upload | nuxt:FileUpload.vue | coss:input.tsx | rock:src/file-upload/ | tests+exports
- [x] form | nuxt:Form.vue | coss:form.tsx | rock:src/form/ | tests+exports
- [x] form-field | nuxt:FormField.vue | coss:field.tsx | rock:src/form-field/ | tests+exports
- [x] input | nuxt:Input.vue | coss:input.tsx | rock:src/input/ | tests+exports
- [ ] (Skip for now) input-date | nuxt:InputDate.vue | coss:input.tsx + popover.tsx | rock:src/input-date/ | tests+exports
- [ ] input-menu | nuxt:InputMenu.vue | coss:combobox.tsx | rock:src/input-menu/ | tests+exports
- [x] input-number | nuxt:InputNumber.vue | coss:number-field.tsx | rock:src/input-number/ | tests+exports
- [ ] (Skip for now) input-tags | nuxt:InputTags.vue | coss:combobox.tsx | rock:src/input-tags/ | tests+exports
- [ ] (Skip for now) input-time | nuxt:InputTime.vue | coss:input.tsx | rock:src/input-time/ | tests+exports
- [ ] (Skip for now) pin-input | nuxt:PinInput.vue | coss:input.tsx | rock:src/pin-input/ | tests+exports
- [x] radio-group | nuxt:RadioGroup.vue | coss:radio-group.tsx | rock:src/radio-group/ | tests+exports
- [ ] select | nuxt:Select.vue | coss:select.tsx | rock:src/select/ | tests+exports
- [ ] (Skip for now) select-menu | nuxt:SelectMenu.vue | coss:combobox.tsx | rock:src/select-menu/ | tests+exports
- [ ] slider | nuxt:Slider.vue | coss:slider.tsx | rock:src/slider/ | tests+exports
- [x] switch | nuxt:Switch.vue | coss:switch.tsx | rock:src/switch/ | tests+exports
- [x] textarea | nuxt:Textarea.vue | coss:textarea.tsx | rock:src/textarea/ | tests+exports

## Phases

### P0 - Cross-category prerequisite

- `tooltip` (from `plans/todo-overlay.md`) must be completed first.
- Scope: `src/tooltip/` implementation, tests, and export.
- Dependency reason: `slider` tooltip behavior depends on a stable tooltip component API.
- Exit criteria: `tooltip` tests pass and `src/index.ts` export is available.

### P1 - Select baseline (unblocked)

- Components: `select` only (`select-menu` moved to `Skip for now`).
- Scope: single and multiple selection, groups, item slots, form event flow, icon hooks.
- Value contract basis: align with `nuxt-ui/src/runtime/components/Select.vue` (`valueKey='value'`, `labelKey='label'`, `descriptionKey='description'` defaults).
- Hard dependency: `avatar` and `chip` must both be completed first (logic + styles + tests + exports).
- Dependency status: satisfied (`avatar` + `chip` complete).
- Deliverables after unblock:
  - `src/select/` complete folder set
  - exports in local `index.ts` and root `src/index.ts`
  - dedicated tests for controlled and uncontrolled usage
- Exit criteria after unblock:
  - keyboard navigation and ARIA assertions pass
  - `change/input/blur/focus` integration with form field context verified
- Unblock execution order:
  - complete `avatar`
  - complete `chip`
  - complete `select` in one pass (logic + styles + tests + exports)

### P2 - Advanced input interactions

- Components: `input-menu`, `file-upload`
- Scope:
  - `input-menu`: filtering, create item, clear, multiple tags mode
  - `file-upload`: single and multiple files, dropzone flow, remove file, preview behavior
- Dependency: build on P1 selection and input interaction patterns.
- Deliverables:
  - `src/input-menu/` and `src/file-upload/` complete folder sets
  - exports in local `index.ts` files and root `src/index.ts`
  - test coverage for async-like user flows and edge cases
- Exit criteria:
  - item creation/removal and search reset behavior verified
  - file reset and input clearing behavior verified

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

## Public API Additions (Non-skip Pending Set)

- `Select` and related `SelectProps` (and variant props when cva is used).
- `InputMenu` and related `InputMenuProps` (and variant props when cva is used).
- `FileUpload` and related `FileUploadProps` (and variant props when cva is used).
- `Slider` and related `SliderProps` (and variant props when cva is used).

## Definition Of Done (Per Component)

- `src/<component>/<component>.tsx` implemented.
- `src/<component>/<component>.class.ts` implemented with cva/Uno style mapping.
- `src/<component>/<component>.test.tsx` implemented.
- `src/<component>/index.ts` export added.
- Root export added in `src/index.ts`.
- Uses `icon-*` aliases for default icons (no provider-specific hardcoded icon classes).

## Required Test Scenarios

- Baseline render and accessibility attributes.
- Controlled and uncontrolled model behavior.
- Keyboard behavior for interactive parts.
- Form integration events (`change`, `input`, `blur`, `focus`).
- Slot rendering for leading/trailing/item customization.
- Component-specific edge cases:
  - `select`: grouped data and multiple selection.
  - `input-menu`: create-item, clear, remove-tag, filtering.
  - `file-upload`: reset, remove, preview, single vs multiple.
  - `slider`: single vs range and tooltip-enabled mode.

## Tracking

- [x] P0 complete (`tooltip` prerequisite)
- [x] P1 scope updated (`select-menu` moved to `Skip for now`)
- [x] P1 dependency resolved (`avatar` + `chip` complete, `select` unblocked)
- [ ] P1 complete (`select`)
- [ ] P2 complete (`input-menu`, `file-upload`)
- [ ] P3 complete (`slider`)
