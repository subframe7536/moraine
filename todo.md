# Current

- [x] slider value should infer from value property and become generic
- [ ] remove button's icon-* size variants, create a <IconButtonInner> component with size variants for internal use without loading logic, expose <IconButton> with loading logic (using <IconButtonInner> inside)

# V1

- [ ] NavigationMenu
- [ ] Calendar https://ant.design/components/calendar.md
- [ ] DatePicker https://ant.design/components/date-picker.md
- [ ] Table: tanstack solid table
- [ ] llm.txt

# Maybe Future

- [ ] inline/fork external libs
  - [ ] When the pointer moves from that parent item toward the submenu, the submenu closes too early before the pointer can reach it, because a different sibling menu item becomes highlighted/triggered during the pointer movement.
  - [ ] Collapsible component 's content height has not transition
  - [ ] When slider thumb overlapped, should allow to slide to any direction
  - [ ] No keyboard loop option in tab

## Inline Kobalte Components

- [ ] `@kobalte/core/accordion`
- [ ] `@kobalte/core/button`
- [ ] `@kobalte/core/collapsible`
- [ ] `@kobalte/core/progress`
- [ ] `@kobalte/core/separator`
- [ ] `@kobalte/core/checkbox`
- [ ] `@kobalte/core/file-field`
- [ ] `@kobalte/core/number-field`
- [ ] `@kobalte/core/radio-group`
- [ ] `@kobalte/core/combobox`
- [ ] `@kobalte/core/slider`
- [ ] `@kobalte/core/switch`
- [ ] `@kobalte/core/dialog`
- [ ] `@kobalte/core/tabs`
- [ ] `@kobalte/core/dropdown-menu`
- [ ] `@kobalte/core/popover`
- [ ] `@kobalte/core/popper` (`usePopperContext`)
- [ ] `@kobalte/core/tooltip`
- [ ] `@kobalte/utils` (`clamp`, `createMediaQuery`)
