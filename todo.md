## Fix

- [x] cleanup useless `mergeProps` across all components
- [x] convert sidebar-frame and resizable into namespaced component, get rid of `frameRender` in sidebar-frame
- [x] add indicator type in `<component>T` to indicate if the component is a single or a composite/namespaced component
- [x] cleanup `data-[*`
- [x] remove `SlotName` in namespace, add missing jsdoc on slot keys; `slotRecipe` 's type param usage should be `slotRecipe<ComponentT.Slot, ComponentT.Variant>()`
- [x] `cn` config should be customizable in MoraineProvider
- [x] reorganize [overlay base](src/overlays/base) props; use namespaces only for public component types
- [ ] metric adjust across all sizes
- [ ] production barrel import optimize, reconsider exports
- [ ] cleanup ssr adaption

### Refactor

- [ ] file-upload style refactor to https://diceui.com/docs/components/base/file-upload
- [ ] slider & stepper recipe structure refactor
- [ ] correct/verify button group separator
- [ ] badge variants config / padding refresh, maybe similar to button?
- [ ] kbd-group 's `*Render` should be renamed and reconsider default value
- [ ] sidebar-frame styling is broken, more useful usage and example
- [ ] src/forms/form/form-field.tsx 's `local.form` should be reconsidered
- [ ] itemRender in pagination
- [ ] the way to define destructive item in menu

# V1

## Components

- [ ] Solid 2
- [ ] NavigationMenu
- [ ] Calendar https://ant.design/components/calendar.md
- [ ] DatePicker https://ant.design/components/date-picker.md
- [ ] Table: tanstack solid table
