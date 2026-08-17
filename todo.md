## Fix

- [x] if command-palette is in dialog, don't clear the input when pressing escape until the dialog close transition is finished
- [x] overlay base component become composible instead of a single component
- [x] overlay trigger should get rid of the extra div, use `as` to override trigger element
  - [x] dialog
  - [x] popover
  - [x] tooltip
  - [x] dropdown-menu
  - [x] context-menu
  - [x] sheet
  - [x] cleanup button-group arbitrary class detector
- [x] audit the explicitly scoped components with mature Base UI / Kobalte counterparts one-by-one, syncing compatible cross-platform, edge-case, keyboard, accessibility, and focus behavior; components without a plan are excluded rather than claimed as parity-complete
- [x] inspect all components' class compare to shadcn/ui one-by-one, to get a better understanding of the spacing, sizing, and transition design system, and then apply it to our components
  - [x] breadcrumb should use `<a>` directly, only highlight text and icon color when hover / active, and use `aria-current` to indicate the current page
  - [x] correct context-menu's menu enter/exit transition: from top-left to bottom-right by default instead of left to right. customizable, and orientation aware.
  - [x] correct dropdown-menu 's menu enter/exit transition: orientation aware
  - [x] remove all menu (select/multi-select/dropdown-menu/context-menu/etc.) selected color, only have hover color and should be lighter than current (like current command-palette's hover color)
  - [x] command-palette design refresh
    - [x] docs/ example refresh, only "Real-World Example" should wrap with dialog, the rest should be inline
- [x] unify select/multi-select layout: inline padding on control (drop padding on leading/trailing icons), trailing trigger icon should not have hover bg color (unify `clear` action in both select and multi-select), and use `aria-current` to indicate the current selected item in the list
- [ ] add Collapsible.Trigger and Collapsible.Content
- [ ] docs/ should become a production level docs site with a proper design system, navigation, search, landing page and other features, just like https://ui.shadcn.com/ or https://ui.nuxt.com. make [introduction](docs/pages/introduction.mdx) more useful.

# V1

## Components

- [ ] Solid 2
- [ ] NavigationMenu
- [ ] Calendar https://ant.design/components/calendar.md
- [ ] DatePicker https://ant.design/components/date-picker.md
- [ ] Table: tanstack solid table
