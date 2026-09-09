## Fix

- [x] unify form spacing: title, description, hint, label, control, help, error, and field gap
- [x] add `presetWind3` support back to `presetMoraine`
- [x] add collapsible in design options.
- [x] add preview in `### Root styling`
- [x] codetabs 's button should not have active scale
- [x] cleanup useless `mergeProps` across all components
- [x] convert sidebar-frame and resizable into namespaced component, get rid of `frameRender` in sidebar-frame
- [x] add indicator type in `<component>T` to indicate if the component is a single or a composite/namespaced component
- [x] cleanup `data-[*`
- [x] remove `SlotName` in namespace, add missing jsdoc on slot keys; `slotRecipe` 's type param usage should be `slotRecipe<ComponentT.Slot, ComponentT.Variant>()`
- [ ] `cn` config should be customizable in MoraineProvider
- [ ] metric adjust across all sizes
- [ ] production barrel import optimize

### UI Regression

- [x] textarea inline padding too large, not balanced
- [x] process indicator percision control?
- [x] separator should be thinner
- [x] solid-toaster have a option to prevent duplicate toast, add it in example
- [x] transition on collapsible is broken
- [x] list Playground & Usage should removed
- [x] resizable divider is not follows the mouse: when move out and back, the divider will directly move instead of waiting mouse move on the divider
- [x] refresh breadcrumb/pagination usage and examples doc
- [x] command-palette gaps between groups is too large
- [x] popover hover mode when hover and click instantly, the floating pannel will show and dismiss quickly
- [x] tooltip trigger when click/active, the content should dismiss; content should instantly dismiss the old one and show the new one when some tooltip opened and move onto other one,
- [x] dialog `### Nested overlays` usage preview style broken
- [x] dropdown-menu `### Stateful and nested items` 's checkbox item 's indicator overlaps the text
- [x] add more complex, real-world example in dropdown-menu & context-menu

### Refactor

- [ ] file-upload style refactor to https://diceui.com/docs/components/base/file-upload
- [ ] slider & stepper recipe structure refactor
- [ ] correct/verify button group separator
- [ ] badge variants config refresh, maybe similar to button?
- [ ] kbd-group 's `*Render` should be renamed and reconsider default value
- [ ] reorganize [overlay base](src/components/overlay/base) props, move to namespace component specific props
  - [ ] tooltip should become a single component, remove trigger and content; refactor implemention
- [ ] sidebar-frame styling is broken, more useful usage and example
- [ ] src/forms/form/form-field.tsx 's `local.form` should be reconsidered

# V1

## Components

- [ ] Solid 2
- [ ] NavigationMenu
- [ ] Calendar https://ant.design/components/calendar.md
- [ ] DatePicker https://ant.design/components/date-picker.md
- [ ] Table: tanstack solid table
