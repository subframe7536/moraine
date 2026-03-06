# Current

- [x] textarea add header and footer slot to match zaidan's InputGroup on textarea Addon (block-start) / Addon (block-end) style
- [x] add Image, inline kobalte's image to reduce context and jsx props pass
- [x] add Avatar based on Image, support group.
- [x] checkbox group table clickable area should expand, border overlapped should handle
- [x] card style port from zaidan/ example and update demo
- [x] checkout slot name semantically with nuxt-ui, unify classes.root
- [x] add footer slot in command palette
- [x] extract overlay part from dialog into new `Popup` component (no padding, pure container), and dialog should become popup + card
- [x] bug: scrollable is broken in popup
- [x] bug: in overlay components demo, only `tab` twice can focus next trigger
- [x] prefer to use rest props to simplify splitProps groups
- [x] reuse common cva, extract common classes into unocss shortcuts
- [x] refactor form state with `createStore`
- [x] add `Accordion`
- [x] cleanup form system and test standard schema with `valibot`
- [x] remove context bridge in select/file-upload, migrate custom render usage from function to jsx for fine grain update, reuse parent components's props first
- [x] bug: uncontrolled switch in demo does not work
- [x] bug: input number horizen does not work
- [x] bug: slider controlled demo does not trigger hover ring, all button hover should become pointer cursor
- [x] bug: after select menu selected, only `tab` twice can focus next trigger
- [x] bug: focus ring should be override when form item is invalid
- [x] bug: input should compatible to IME
- [x] bug: form field standard schema demo, email input cannot cleanup when press backspace, text `a` - press backspace -> `undefined`
- [x] tooltip variant
- [x] optimize context menu trigger timing, or implement context by dropdown menu
- [x] adjust dropmenu / context menu show up transition
- [x] polish and cleanup select control / input / input number variants
- [ ] simplify variants
- [ ] bug: select menu open and click trigger does not close the menu

# Future

- [ ] invalid state should become `data-*` driven css instead of a variant in cva
- [ ] refactor: overlay components should consider children as content, and provider optional trigger prop
- [ ] custom true/false value in form elements
- [ ] polish theme, like ring color etc.
- [ ] transform to tailwind class syntax, optional unocss transform to simplify
- [ ] inline and drop kobalte
  - [ ] bug: When the pointer moves from that parent item toward the submenu, the submenu closes too early before the pointer can reach it, because a different sibling menu item becomes highlighted/triggered during the pointer movement.
  - [ ] animated collapsible component
- [ ] refine demo into doc?
