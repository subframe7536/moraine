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
- [x] port horizontal layout and optimize form size/padding on form fields (like nuxt-ui)
- [x] refactor: simplify overlay menu transition state (use data-side, data-align, etc.) and classes in `cva` to reduce complexity and improve maintainability [plan](./refactor-overlay-side-state.md)
- [x] refactor form component styles after reviewing `nuxt-ui/`, `zaidan/`, and `kobalte/`, and migrate every affected test and docs example
  - [x] Remove `xs` / `xl` sizes from all form components; keep only `sm` / `md` / `lg`
  - [x] Input: consolidate control heights, typography, padding, icon sizing, shadow, focus, invalid, disabled, file-input, and leading/trailing slot styles against Nuxt Input and Zaidan Input
  - [x] InputNumber: reuse the Input surface, then align horizontal and vertical stepper dimensions, joins, focus ownership, disabled controls, and icon sizing with Nuxt InputNumber
  - [x] Textarea: align typography, padding, minimum height, resize/autoresize behavior, surface states, and header/footer spacing with Nuxt Textarea and Zaidan Textarea
  - [x] Checkbox: align control and indicator sizes, card padding, checked/invalid/focus surfaces, normalize legend/item label line-height, and label/description line-height and control alignment with Nuxt Checkbox and Zaidan Checkbox
  - [x] CheckboxGroup: align legend typography and group gaps, make horizontal/list/card/table layouts preserve logical joins and wrapping, and verify labels and descriptions stay aligned
  - [x] RadioGroup: fix horizontal orientation so items actually lay out and wrap horizontally, normalize legend/item label line-height, and align the control, solid-dot indicator, group gap, card/table padding, checked, invalid, and focus styles with Nuxt RadioGroup
  - [x] Slider: reduce default and bold track/thumb geometry, align horizontal and vertical dimensions and disabled/focus/drag states with Nuxt Slider and Zaidan Slider, and preserve multi-thumb hit targets
  - [x] Switch: align track/thumb sizes and checked translation, normalize label/description line-height and spacing, and match checked, unchecked, disabled, invalid, focus, and transition states with Nuxt Switch and Zaidan Switch
  - [x] FileUpload: consolidate dropzone, trigger, preview, file-row, metadata, and remove-action metrics, then align drag, invalid, disabled, focus, single/multiple, and non-dropzone layouts with Nuxt FileUpload
- [x] replace Card in Dialog component by raw jsx components, sync styles
  - [x] command-palette example should use modal instead of dialog
- [ ] refactor pagination component style
- [ ] named z-index class name
- [ ] simplify separator structure, same to kobalte: remove children, only one element
- [ ] add Collapsible.Trigger and Collapsible.Content
  - [ ] content enter/exit should has opacity transition
- [ ] docs/ should become a production level docs site with a proper design system, navigation, search, landing page and other features, just like https://ui.shadcn.com/ or https://ui.nuxt.com. make [introduction](docs/pages/introduction.mdx) more useful.
  - [ ] fix broken auto scroll to anchor

# V1

## Components

- [ ] Solid 2
- [ ] NavigationMenu
- [ ] Calendar https://ant.design/components/calendar.md
- [ ] DatePicker https://ant.design/components/date-picker.md
- [ ] Table: tanstack solid table
