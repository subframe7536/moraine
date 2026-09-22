## Fix

- [x] cleanup useControllableValue, accessor should not returns undefined, so also remove all useless createMemo around it
- [x] cleanup ElementFor and onXXX types, or maybe unify
- [x] correct document page's focus loop and refresh scroll retention (during dev)
  - [x] also audit all components focus loop
- [x] cleanup all manually controlled/uncontrolled signals with `useControllableValue` acrossing all components
- [x] autocomplete=off on multiselect/combobox
- [x] fix from root: in input-group docs' dropdown example, click trigger and click outside, the input group's focus ring should never active
- [x] expose slider & resizable hook
- [ ] builtin icon names auto completion support for `IconT.Name`
  - [ ] in toaster docs, use custom icon in provider
- [ ] docs polish
- [ ] slot indicator in playground, like https://www.chakra-ui.com/docs/components/pin-input#explorer

# V1

## Components

- [ ] Solid 2
- [ ] NavigationMenu
- [ ] Calendar https://ant.design/components/calendar.md
- [ ] DatePicker https://ant.design/components/date-picker.md
- [ ] Table: tanstack solid table
