# V1

## Fix

- [x] Auto scroll to the active item in the select component
- [x] InputNumber long press behavior should provide a option to toggle, enabled by default.
- [x] In docs, API Reference 's Attributes section header should become a select in mobile view.
- [x] Expose hooks in [utils](./src/utils) as `/utils` endpoint and add documentation for them.
- [x] Convert `<namespace>.Slot` from string to object with jsdoc to better document their meaning and available attributes.
- [x] Reuse [resolveRenderProp](./src/shared/render-props.ts) in all components that support render props.
- [x] sidebarframe
  - [x] "HeaderFooterSlots" become "Header and Footer Slots", update missing footer in example, make sidebar scrollable
  - [x] update "Slot Structure", remove layout slot
  - [x] fix variants
    - [x] all variants examples' main area should be larger than sidebar area
    - [x] floating's sidebar and inset's main 's bottom is overlapped
- [x] Add fake progress animation for documentation pages switching
- [ ] Sync border & ring styles across all components from zaidan/shadcn for consistency, polish transition / animation based on https://transitions.dev

## Components

- [ ] Solid 2
- [ ] NavigationMenu
- [ ] Calendar https://ant.design/components/calendar.md
- [ ] DatePicker https://ant.design/components/date-picker.md
- [ ] Table: tanstack solid table

## Documentation

- [ ] Add documentation pages for config-driven usage, accessibility guarantees, keyboard behavior, form integration, and controlled/uncontrolled patterns.
- [ ] Add `llm.txt`.
