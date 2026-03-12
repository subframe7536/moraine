# Current

- [x] invalid and other boolean state should become `data-*` driven css instead of a variant in `cva`
- [x] unify id
- [x] custom true/false value in form elements, reference from nuxt-ui
- [x] extend avatar size variant like other components
- [ ] check `props.highlight` actual usage and style effect, optimize `surface-highlight` and `surface-outline` and `surface-overlay`, unify text size / line height / spacing / border color , border implement style (directly border or box-shadow)
- [x] remove all unocss-specific class syntax and option to simplify by transformer, provide preset
- [ ] simplify theme, fix some utility classes not working when `lowLayer: true / 'use-prefix'`
- [ ] refactor all transformer with `oxc-parser` / `oxc-walk`, add missing keyframes in `tw3.css` / `tw4.css`
- [ ] `styles: SlotStyles<SlotNames, JSX.CSSProperties>` (like `classes`)
- [ ] props jsdoc
- [ ] refine demo into doc?

# V1

- [ ] NavigationMenu
- [ ] Calendar https://ant.design/components/calendar.md
- [ ] DatePicker https://ant.design/components/date-picker.md
- [ ] Sidebar, shadcn like
- [ ] New Table: tanstack solid table

# Maybe Future

- [ ] inline/fork external libs
  - [ ] When the pointer moves from that parent item toward the submenu, the submenu closes too early before the pointer can reach it, because a different sibling menu item becomes highlighted/triggered during the pointer movement.
  - [ ] Collapsible component 's content height has not transition
  - [ ] When slider thumb overlapped, should allow to slide to any direction
  - [ ] No keyboard loop option in tab
