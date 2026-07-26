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
- [x] only add data attributes on essential elements in `checkbox`, unwrap `dataAttr` memo
- [x] simplify `radio-group` 's classes, remove unnecessary wrapper elements, let form-field component to control form title & description, and make it more semantic and accessible.
- [x] keep tooltip panel open and add move transition when hover on another trigger which also has a tooltip, to have better user experience when switching between triggers.
- [x] extract logic from slider component to a separate hook, and export component level hooks (should located at same dir 's `/hook` dir ) custom implementations.
- [x] unify custom render function prop with suffix `Render`, target should be `xxxRender`
- [x] unify and correct class/style priority: top level `class` / `style` (root only) > `classes` / `styles` > component builtin classes / styles
- [x] refactor `command-palette` component:
  - [x] rename `footer?: JSX.Element` to `footerRender?: (ctx: Context) => JSX.Element`, `Context` should be current state
  - [x] rename `empty?: JSX.Element` to `emptyRender?: (ctx: Context) => JSX.Element`, `Context` should be current state
  - [x] add `itemRender?: (ctx: ItemRenderContext) => JSX.Element` prop to customize item render, `ItemRenderContext` should be current state and item data, allow to customize item based on its data(e.g. title, description, group, icon, level etc.) and runtime state (e.g., selected, focused, disabled, searchTerm).
  - [x] remove `itemLabelPrefix` and `itemLabelSuffix`, rename `ItemLableBase` to `ItemLabel`, make `itemDescription` 's position customizable via `descriptionPosition?: 'bottom' | 'trailing'` prop (root or item level)
  - [x] add `disableFilter` to root level prop, which will disable search and show all items, let user to implement their own search logic via reactive `groups` prop
  - [x] drop nest item support
  - [x] flatten icon props
  - [x] breaking change: wrap with modal, forward modal props, add `closeOnSelect` prop to control whether to close modal when item is selected.
  - [x] make position controllable via `position?: { top?: number; left?: number }` prop and add `onPositionChange?: (position: { top: number; left: number }) => void` prop to notify user when position changed. `CommandPalette` component should forward `position` and `onPositionChange` prop to modal.
  - [x] remove `active` prop from item
  - [x] when `descriptionPosition` prop is set to `trailing`, the description should be rendered at the end of item inside `itemLabel` slot and near to it, instead of the end of the whole item, and the description should be truncated if it exceeds the available space.
  - [x] remove `kbds` prop from item, make it customizable via new `item.trailingRender?: (ctx: ItemRenderContext) => JSX.Element` slot, which will be rendered at the end of item, and can be used to render kbd, badge, icon etc. rename `item.icon` to `item.leadingRender?: (ctx: ItemRenderContext) => JSX.Element`, which will be rendered at the start of item, and can be used to render icon, avatar etc.
  - [x] refresh doc, make example more real-world, and add more examples to show how to customize item render via `itemRender` prop, and how to customize item label and description position via `descriptionPosition` prop.
- [x] split `avatar` component into `avatar` and `avatar-group`, and add new `avatar-group` component to group avatars together, and support different sizes and variants.
- [x] split `kbd` component into `kbd` and `kbd-group`, and add new `kbd-group` component to group kbd elements together, and support different sizes and variants
  - [x] kbd-group should also support customizable divider, sequence, alternatives
  - [x] display text and accessible label for each kbd element
  - [x] support both symbol and text to better adapt different platforms and devices
- [x] refactor form / form-field to `formisch`, replace existing form context logic if possible. https://ui.shadcn.com/docs/forms/formisch.md
- [x] fix broken styles of `Radio` component: no border highlight when actived in card and table variant; default indicator is changed from circle to oval.
- [x] extract a public, headless `list` component to render list with virtualization interface support for select/multi-select
  - [x] basic should be a normal list component that can render normal object list (goods list, job descriptions, etc.), preserve interface to make it selectable, for select / command palette / menu.
  - [x] fix virtualization not render any items in select/multi-select
  - [x] remove `virtualized` prop, just follow `virtualRender`
  - [x] inline `@tanstack/virtual-core` as dep, optimize virtualization interface and provide builtin helper to improve dx, implement solidjs adapter manually to fix list ref load timing and dynamic height issues (item spacing are not balanced)
  - [x] make `@tanstack/virtual-core` a peer dependency, and provide a solidjs adapter for it, so that user can use their own version of `@tanstack/virtual-core` if needed.
- [x] unify all `xxRender` 's type: `xxRender?: Component<xxRenderProps>`
- [x] fix textarea footer/header interaction priority
- [ ] add transition for button interaction like shadcn
- [ ] find a way to add jsdoc for Variant 's props
- [ ] reference from https://ink-ui.com , add primary/secondary/background/\*-{active,hover,focus} color tokens, avoid using alpha channel in color tokens. and think of `mix-blend-multiply` for item + badge when hovering, and `mix-blend-difference` for item + badge when selected, to have better contrast and accessibility.
- [ ] button group component, which can be used to group buttons together, and support different sizes and variants.
- [ ] scrollarea component with fade edge support

# V1

## Components

- [ ] Solid 2
- [ ] NavigationMenu
- [ ] Calendar https://ant.design/components/calendar.md
- [ ] DatePicker https://ant.design/components/date-picker.md
- [ ] Table: tanstack solid table
