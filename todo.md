## Fix

- [x] if command-palette is in dialog, don't clear the input when pressing escape until the dialog close transition is finished
- [x] overlay base component become composible instead of a single component
- [x] overlay trigger should get rid of the extra div, use `as` to override trigger element
  - [x] dialog
  - [x] popover
  - [x] tooltip
  - [x] dropdown-menu
  - [x] context-menu
  - [x] popup
  - [x] sheet
  - [x] cleanup button-group arbitrary class detector
- [x] compare components that upstream base-ui / kobalte has one-by-one using subagents, sync cross-platform adaption / edge case / keyboard navigation / accessibility / focus management and other missing logic
- [ ] inspect all components' class compare to shadcn/ui one-by-one using subagents, to get a better understanding of the spacing, sizing, and transition design system, and then apply it to our components
  - [ ] classes and styles should become stateful
- [ ] docs/ should become a production level docs site with a proper design system, navigation, search, landing page and other features, just like https://ui.shadcn.com/ or https://ui.nuxt.com. make [introduction](docs/pages/introduction.mdx) more useful.

# V1

## Components

- [ ] Solid 2
- [ ] NavigationMenu
- [ ] Calendar https://ant.design/components/calendar.md
- [ ] DatePicker https://ant.design/components/date-picker.md
- [ ] Table: tanstack solid table
