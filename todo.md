## Fix

- [x] polish switch component's indicator position in different sizes
- [x] add new divider slot for slider to indicate step visually, enable via prop `divider?: boolean`.
  - [x] introduce a new variant `bold`, which will make the track thicker than thumb.
  - [x] use dot style in default variant, and use line style in bold variant.
  - [x] change default direction of vertial orientation to bottom -> top
- [x] refactor switch component's dom structure, make it more semantic and accessible, and remove unnecessary wrapper elements, dont show focus ring when clicked.
- [x] unify slot names, only contains inner element slots, the outest slot should be component itself, and add class / style props to component props, so no longer needed to setup classes / styles object for simple root component
- [x] cleanup unncessary `splitProps` and `mergeProps` usage in all components.
- [x] rename sperator component 's `container` slot to `content`.
- [x] add missing `inputAriaAttrs` in `Switch` component
- [ ] keep tooltip panel open when hovered another trigger with a timeout, to have better user experience when switching between triggers.
- [ ] only add data attributes on essential elements in `checkbox`, unwrap `dataAttr` memo
- [ ] simplify `avatar` / `checkbox` / `radio-group` 's classes, remove unnecessary wrapper elements, and make it more semantic and accessible.
- [ ] unify and correct class/style priority: top level `class` / `style` (root only) > `classes` / `styles` > component builtin classes / styles
- [ ] extract logic from slider component to a separate hook, and all export component level hooks (should located at same dir 's `/hook` dir ) custom implementations.
- [ ] refactor form / form-field to formisch, replace existing form context logic if possible
- [ ] add docs for icon-button component.
- [ ] split `avatar` component into `avatar` and `avatar-group`, and add new `avatar-group` component to group avatars together, and support different sizes and variants.
- [ ] split `kbd` component into `kbd` and `kbd-group`, and add new `kbd-group` component to group kbd elements together, and support different sizes and variants, customizable divider.
- [ ] find a way to add jsdoc for Variant 's props
- [ ] unify custom render function prop with prefix `render`, target should be `renderXXXX`
- [ ] reference from https://ink-ui.com , add primary/secondary/background/\*-{active,hover,focus} color tokens, avoid using alpha channel in color tokens
- [ ] button group component, which can be used to group buttons together, and support different sizes and variants.

# V1

## Components

- [ ] Solid 2
- [ ] NavigationMenu
- [ ] Calendar https://ant.design/components/calendar.md
- [ ] DatePicker https://ant.design/components/date-picker.md
- [ ] Table: tanstack solid table

## Documentation

- [ ] Add `llm.txt`.
