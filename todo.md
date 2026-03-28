# Current

- [x] invalid and other boolean state should become `data-*` driven css instead of a variant in `cva`
- [x] unify id
- [x] custom true/false value in form elements, reference from nuxt-ui
- [x] extend avatar size variant like other components
- [x] refactor all transformer with `oxc-parser` / `oxc-walk`, add missing keyframes in `tw3.css` / `tw4.css`
- [x] remove all unocss-specific class syntax and option to simplify by transformer, provide preset
- [x] simplify theme
- [x] unify icon size resolver
- [x] `styles: SlotStyles<SlotNames, JSX.CSSProperties>` (like `classes`)
- [x] props jsdoc
- [x] refine demo into doc?
- [x] select trigger icon position overflow
- [x] add `collapsibleMin` in resizable, width should be max if no default size setup, redesign collapsible behavior
- [x] api-doc also extract `Items`
- [x] remove real path in extracted type
- [x] unify `<IconButton>` and `<Button><Icon>`
- [x] unify docs: preview different variants, options; card / island to shadcn / nuxt-ui like doc ; visually render count
- [x] add toast using `solid-toaster`
- [x] style guide docs
- [x] markdown doc
- [x] multiselect line height when from single to multiple line
- [x] when select is trigger-mode, cursor should not be pointer on control
- [x] infinity scroll select should trigger load-more instantly instead of waiting for scroll end
- [x] optimize switch spacing in different size variants and cursor
- [x] fix component layer hash strategy style incorrect
- [x] remove `props.highlight`
- [x] optmize `surface-outline` and `surface-overlay`, unify text size / line height / spacing / border color , border implement style (directly border or box-shadow)
- [x] GitHub source code link, kobalte link in header
- [x] docs: in per page, add Import section before examples, add title "Examples" for all examples
- [ ] add doc guide: icon, slot-based styling, animation
- [ ] split icon.css

# V1

- [ ] NavigationMenu
- [ ] Calendar https://ant.design/components/calendar.md
- [ ] DatePicker https://ant.design/components/date-picker.md
- [ ] Sidebar, shadcn like
- [ ] Table: tanstack solid table
- [ ] llm.txt

# Maybe Future

- [ ] inline/fork external libs
  - [ ] When the pointer moves from that parent item toward the submenu, the submenu closes too early before the pointer can reach it, because a different sibling menu item becomes highlighted/triggered during the pointer movement.
  - [ ] Collapsible component 's content height has not transition
  - [ ] When slider thumb overlapped, should allow to slide to any direction
  - [ ] No keyboard loop option in tab
