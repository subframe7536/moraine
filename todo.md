## Fix

- [x] unify form spacing: title, description, hint, label, control, help, error, and field gap
- [x] add `presetWind3` support back to `presetMoraine`
- [x] add collapsible in design options.
- [x] add preview in `### Root styling`
- [x] codetabs 's button should not have active scale
- [x] cleanup useless `mergeProps` across all components
- [x] convert sidebar-frame and resizable into namespaced component, get rid of `frameRender` in sidebar-frame
- [x] add indicator type in `<component>T` to indicate if the component is a single or a composite/namespaced component
- [x] cleanup `data-[*`
- [ ] optimize `stepperRecipe` css variables
- [ ] `cn` config should be customizable in MoraineProvider
- [ ] metric adjust across all sizes
- [ ] production barrel import optimize

### UI Regression

- [ ] textarea inline padding too large, not balanced
- [ ] slider bold variant 's thumb indicator is missing
- [ ] file-upload style refactor to https://diceui.com/docs/components/base/file-upload
- [ ] correct/verify button group separator
- [ ] badge subtle variant style 's border color is too contrast with background color
- [ ] transition on collapsible is broken
- [ ] separator should be thinner
- [ ] process indicator percision control?
- [ ] list Playground & Usage should removed
- [ ] resizable divider is not follows the mouse: when move out and back, the divider will directly move instead of waiting mouse move on the divider
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
