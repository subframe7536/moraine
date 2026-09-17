import { defineTheme } from 'moraine/theme'

export const allThemeKeys = defineTheme({
  accordion: { base: {} },
  avatar: { base: {} },
  avatarGroup: { base: {} },
  badge: { base: {} },
  buttonGroup: { base: {} },
  button: { base: {} },
  card: { base: {} },
  collapsible: { base: {} },
  icon: { base: {} },
  kbd: { base: {} },
  kbdGroup: { base: {} },
  progress: { base: {} },
  resizable: { base: {} },
  separator: { base: {} },
  baseSelect: { base: {} },
  checkbox: { base: {} },
  checkboxGroup: { base: {} },
  combobox: { base: {} },
  field: { base: {} },
  fileUpload: { base: {} },
  form: { base: {} },
  input: { base: {} },
  inputGroup: { base: {} },
  inputNumber: { base: {} },
  multiSelect: { base: {} },
  radioGroup: { base: {} },
  select: { base: {} },
  slider: { base: {} },
  switch: { base: {} },
  textarea: { base: {} },
  breadcrumb: { base: {} },
  commandPalette: { base: {} },
  pagination: { base: {} },
  sidebarFrame: { base: {} },
  stepper: { base: {} },
  tabs: { base: {} },
  contextMenu: { base: {} },
  dialog: { base: {} },
  dropdownMenu: { base: {} },
  modal: { base: {} },
  popover: { base: {} },
  sheet: { base: {} },
  tooltip: { base: {} },
})

defineTheme({ button: { defaultVariants: { size: null, variant: null } } })
defineTheme({ button: { variants: { size: { sm: { root: 'h-8' } } } } })
defineTheme({
  button: { compoundVariants: [{ variants: { size: 'sm', variant: 'ghost' }, root: 'gap-1' }] },
})
defineTheme({
  button: {
    replace: true,
    base: { root: '', loading: '', leading: '', label: '', trailing: '' },
  },
})

// @ts-expect-error Unknown component names are rejected.
defineTheme({ unknownComponent: {} })
// @ts-expect-error Unknown slots are rejected.
defineTheme({ button: { base: { missing: 'p-2' } } })
// @ts-expect-error Unknown variant values are rejected.
defineTheme({ button: { defaultVariants: { size: 'huge' } } })
// @ts-expect-error Unknown variant selectors are rejected.
defineTheme({ button: { variants: { size: { huge: { root: 'p-2' } } } } })
defineTheme({
  // @ts-expect-error Compound variant slots are constrained.
  button: { compoundVariants: [{ variants: { size: 'sm' }, missing: 'p-2' }] },
})
// @ts-expect-error Replacement themes require all recipe base slots.
defineTheme({ button: { replace: true, base: { root: '' } } })
