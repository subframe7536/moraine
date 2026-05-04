# Inline Kobalte Components

Kobalte is an unstyled headless component library for SolidJS used extensively throughout Moraine.
Inlining each Kobalte package gives full control over behavior and accessibility, allows fixing
known upstream bugs, and eliminates dead code from unused Kobalte internals. Also, it can make it easior to migrate to solid 2. Once all packages are
replaced, `@kobalte/core` and `@kobalte/utils` can be dropped from dependencies entirely.

## Existing Bugs

- **Collapsible / Accordion**: content height has no CSS transition on open/close (`$kb-collapsible-content-height` CSS variable does change, but the element height itself doesn't animate)
- **DropdownMenu / ContextMenu**: when the pointer moves from a parent menu item toward a submenu, the submenu closes too early before the pointer reaches it, because a sibling menu item becomes highlighted during pointer movement
- **Slider**: when two thumbs overlap, it is impossible to slide in any direction
- **Tabs / Stepper**: no keyboard loop option (pressing arrow at the last tab does not wrap back to the first)

## Components and Guide

To inline a Kobalte package:

1. Copy the relevant source from `node_modules/@kobalte/core/src/<component>/` into a new `src/shared/primitives/<component>/` directory (or alongside the consuming component)
2. Replace the `@kobalte/core/<component>` import(s) with the local path
3. Fix any known bugs listed in "Existing Bugs" for the affected component
4. Ensure all accessibility attributes (ARIA roles, keyboard navigation, focus management) are preserved
5. Once all usages of a package are replaced, remove it from `package.json`
6. migrate all tests of relative components
7. make copied components non headless and fuse it into target components, eliminate createContext usage without breaking anything if possible, refactor and organize component structure better fitting a standalone lib with resuable components and useful hooks

### Simple

No external state machine, context, or positioning logic needed — replaceable with small self-contained SolidJS primitives.

- [ ] **`@kobalte/utils`** → inline `clamp` as a one-liner math helper; replace `createMediaQuery` with a tiny SolidJS signal/effect wrapper over `window.matchMedia`
  - Used in: `src/elements/resizable/hook/panel.ts`, `src/elements/resizable/hook/resize.ts` (`clamp`); `src/navigation/sidebar-frame/sidebar-frame.tsx` (`createMediaQuery`)
- [ ] **`@kobalte/core/button`** → replace with a polymorphic `<button>` element handling `aria-disabled`; remove dependency on `@kobalte/core/polymorphic`
  - Affects: `Button` (`src/elements/button/button.tsx`), `IconButton` (`src/elements/icon/icon-button.tsx`)
- [ ] **`@kobalte/core/separator`** → replace with `<div role="separator">` (or `<hr>`) and the correct `aria-orientation` attribute
  - Affects: `Separator` (`src/elements/separator/separator.tsx`)

### Complex

Multiple subcomponents with shared context and keyboard navigation, but no floating/portal positioning required.

- [ ] **`@kobalte/core/switch`** → inline `Switch.Root`, `Switch.Input`, `Switch.Control`, `Switch.Thumb`, `Switch.Label`
  - Affects: `Switch` (`src/forms/switch/switch.tsx`)
- [ ] **`@kobalte/core/checkbox`** → inline `Checkbox.Root`, `Checkbox.Input`, `Checkbox.Control`, `Checkbox.Indicator`, `Checkbox.Label`
  - Affects: `Checkbox` (`src/forms/checkbox/checkbox.tsx`)
- [ ] **`@kobalte/core/radio-group`** → inline `RadioGroup.Root`, `RadioGroup.Item`, `RadioGroup.ItemInput`, `RadioGroup.ItemControl`, `RadioGroup.ItemIndicator`, `RadioGroup.ItemLabel`
  - Affects: `RadioGroup` (`src/forms/radio-group/radio-group.tsx`)
- [ ] **`@kobalte/core/file-field`** → inline `FileField.Root`, `FileField.Input`, `FileField.Label`, `FileField.Trigger`, `FileField.ItemList`, `FileField.Item`, `FileField.ItemName`, `FileField.ItemSize`, `FileField.ItemDeleteTrigger`
  - Affects: `FileUpload` (`src/forms/file-upload/file-upload.tsx`)
- [ ] **`@kobalte/core/number-field`** → inline `NumberField.Root`, `NumberField.Input`, `NumberField.IncrementTrigger`, `NumberField.DecrementTrigger`, `NumberField.Label`
  - Affects: `InputNumber` (`src/forms/input-number/input-number.tsx`)
- [ ] **`@kobalte/core/progress`** → inline `Progress.Root`, `Progress.Track`, `Progress.Fill`, `useProgressContext`
  - Affects: `Progress` (`src/elements/progress/progress.tsx`)
- [ ] **`@kobalte/core/collapsible`** → inline `Collapsible.Root`, `Collapsible.Trigger`, `Collapsible.Content`, `useCollapsibleContext`; **fix**: add CSS height transition on content open/close
  - Affects: `Collapsible` (`src/elements/collapsible/collapsible.tsx`), `Accordion` (`src/elements/accordion/accordion.tsx`)
- [ ] **`@kobalte/core/accordion`** → inline `Accordion.Root`, `Accordion.Item`, `Accordion.Header`, `Accordion.Trigger`, `Accordion.Content`; depends on `collapsible` being inlined first
  - Affects: `Accordion` (`src/elements/accordion/accordion.tsx`)
- [ ] **`@kobalte/core/tabs`** → inline `Tabs.Root`, `Tabs.List`, `Tabs.Trigger`, `Tabs.Indicator`, `Tabs.Content`; **fix**: add keyboard loop option so arrow navigation wraps at boundaries
  - Affects: `Tabs` (`src/navigation/tabs/tabs.tsx`), `Stepper` (`src/navigation/stepper/stepper.tsx`)

### Comprehensive

Floating/positioned overlays with portals, focus traps, and complex pointer/keyboard interaction chains.

- [ ] **`@kobalte/core/slider`** → inline `Slider.Root`, `Slider.Track`, `Slider.Fill`, `Slider.Thumb`, `Slider.Input`, `useSliderContext`; **fix**: allow sliding in any direction when thumbs overlap
  - Affects: `Slider` (`src/forms/slider/slider.tsx`)
- [ ] **`@kobalte/core/dialog`** → inline `Dialog.Root`, `Dialog.Trigger`, `Dialog.Portal`, `Dialog.Overlay`, `Dialog.Content`, `Dialog.Title`, `Dialog.Description`, `Dialog.CloseButton`; includes focus trap and scroll lock
  - Affects: `Dialog` (`src/overlays/dialog/dialog.tsx`), `Sheet` (`src/overlays/sheet/sheet.tsx`), `Popup` (`src/overlays/popup/popup.tsx`)
- [ ] **`@kobalte/core/popper`** → inline `usePopperContext` and the popper anchor/placement primitive; **prerequisite** for `popover` and `tooltip`
  - Affects: `Popover` (`src/overlays/popover/popover.tsx`), `Tooltip` (`src/overlays/tooltip/tooltip.tsx`)
- [ ] **`@kobalte/core/popover`** → inline `Popover.Root`, `Popover.Trigger`, `Popover.Portal`, `Popover.Content`, `Popover.Arrow`; depends on `popper` being inlined first
  - Affects: `Popover` (`src/overlays/popover/popover.tsx`)
- [ ] **`@kobalte/core/tooltip`** → inline `Tooltip.Root`, `Tooltip.Trigger`, `Tooltip.Portal`, `Tooltip.Content`, `Tooltip.Arrow`; depends on `popper` being inlined first
  - Affects: `Tooltip` (`src/overlays/tooltip/tooltip.tsx`)
- [ ] **`@kobalte/core/dropdown-menu`** → inline all exports (`Root`, `Trigger`, `Content`, `Item`, `CheckboxItem`, `Group`, `GroupLabel`, `Sub`, `SubTrigger`, `SubContent`, `Separator`, `ItemIndicator`, `Portal`); **fix**: prevent submenu from closing prematurely during pointer movement toward submenu
  - Affects: `DropdownMenu` (`src/overlays/dropdown-menu/dropdown-menu.tsx`), `ContextMenu` (`src/overlays/context-menu/context-menu.tsx`), `OverlayMenuBaseContent` (`src/overlays/shared-overlay-menu/menu.tsx`)
- [ ] **`@kobalte/core/combobox`** → inline `Combobox`, `useComboboxContext`, `ComboboxContextValue`, `ComboboxRootProps`, `ComboboxSingleSelectionOptions`; most complex — requires virtualized scroll, multi-selection, and filtering support
  - Affects: `Select` (`src/forms/select/select.tsx`), `MultiSelect` (`src/forms/select/multi-select.tsx`), `CommandPalette` (`src/navigation/command-palette/command-palette.tsx`), `src/forms/select/shared/`

# Current

- [ ] remove button's icon-* size variants, create a <IconButtonInner> component with size variants for internal use without loading logic, expose <IconButton> with loading logic (using <IconButtonInner> inside)
- [ ] refactor to solid 2

# V1

- [ ] NavigationMenu
- [ ] Calendar https://ant.design/components/calendar.md
- [ ] DatePicker https://ant.design/components/date-picker.md
- [ ] Table: tanstack solid table
- [ ] llm.txt
