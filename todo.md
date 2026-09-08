## Fix

- [x] unify form spacing: title, description, hint, label, control, help, error, and field gap
- [x] add `presetWind3` support back to `presetMoraine`
- [x] add collapsible in design options.
- [x] add preview in `### Root styling`
- [x] codetabs 's button should not have active scale
- [x] cleanup useless `mergeProps` across all components
- [x] convert sidebar-frame and resizable into namespaced component, get rid of `frameRender` in sidebar-frame
- [x] add indicator type in `<component>T` to indicate if the component is a single or a composite/namespaced component
- [ ] `cn` config should be customizable in MoraineProvider
- [x] cleanup `data-[*`
- [ ] metric adjust across all sizes
- [ ] production barrel import optimize

### UI Regression

- [ ] select inline padding is 0
- [ ] input composition cancel should clear ghost text
- [ ] textarea inline padding too large
- [ ] slider bold variant 's thumb indicator is missing
- [ ] file-upload style refactor
- [ ] correct/verify button group separator
- [ ] badge subtle variant style fix
- [ ] transition on collapsible is broken
- [ ] separator should be thinner
- [ ] process indicator percision control?
- [ ] list playground should removed
- [ ] resizable divider is not follows the mouse
- [ ] kbd-group 's `*Render` should be renamed and reconsider default value
- [ ] refresh breadcrumb/pagination usage and examples doc
- [ ] command-palette gaps between groups is too large
- [ ] sidebar-frame styling is broken, more useful usage and example
- [ ] popover hover mode when hover and click instantly, the floating pannel will show and dismiss quickly
- [ ] tooltip 's trigger when click/active, the tooltip should dismiss
- [ ] dialog `### Nested overlays` usage preview style broken
- [ ] dropdown-menu `### Stateful and nested items` 's checkbox item 's indicator overlaps the text
- [ ] add more complex, real-world example in dropdown-menu & context-menu
- [ ] solid-toaster have a option to prevent duplicate toast, add it in example

# V1

## Components

- [ ] Solid 2
- [ ] NavigationMenu
- [ ] Calendar https://ant.design/components/calendar.md
- [ ] DatePicker https://ant.design/components/date-picker.md
- [ ] Table: tanstack solid table
