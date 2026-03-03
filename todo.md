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
- [ ] refactor form state with `createStore`
- [ ] remove context bridge in select/file-upload, migrate custom render usage from function to jsx for fine grain update, reuse parent components's props first
- [ ] bug: uncontrolled switch in demo does not work
- [ ] bug: input number horizen does not work
- [ ] bug: slider controlled demo does not trigger hover ring, all button hover should become pointer cursor
- [ ] bug: after select menu selected, only `tab` twice can focus next trigger
- [ ] bug: focus ring should be override when form item is invalid
- [ ] add `Accordion`
- [ ] adjust command palette text/padding size
- [ ] adjust dropmenu transition
- [ ] context menu trigger timing

# Future

- [ ] polish and cleanup select control
- [ ] inline and drop kobalte
- [ ] make cn / cva return undefined when no class
- [ ] refine demo into doc?
