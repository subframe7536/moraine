## Fix

- [x] breaking change: rollback to remove dialog and trigger in command-palette component, enforce user to use dialog and trigger (give example in docs)
- [ ] implement ./plan.md , get rid of `RuntimeRootProps`, complete todo)), pass type check, keep consistent after command-palette changes complete
  - [ ] badge should remove `slotName` prop and reuse `data-slot`
  - [ ] correctly handle onXXX event listeners at runtime, e.g. button 's onPointerDown should call user's onPointerDown and respect `defaultPrevented`, and not be overridden by internal onPointerDown

# V1

## Components

- [ ] Solid 2
- [ ] NavigationMenu
- [ ] Calendar https://ant.design/components/calendar.md
- [ ] DatePicker https://ant.design/components/date-picker.md
- [ ] Table: tanstack solid table
