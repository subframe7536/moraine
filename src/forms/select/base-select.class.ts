import { slotRecipe } from '../../shared/style/recipe'

import type { BaseSelectT } from './base-select.types'
import { SELECT_BASE_CLASSES, SELECT_CONTENT_CLASS } from './select.class'

export const BASE_SELECT_CLASSES = {
  root: 'inline-flex h-fit w-full relative',
  control: '',
  input: '',
  clear: '',
  trigger: '',
  leading: '',
  content: SELECT_CONTENT_CLASS,
  listbox: SELECT_BASE_CLASSES.listbox,
  item: SELECT_BASE_CLASSES.item,
  group: SELECT_BASE_CLASSES.group,
  label: SELECT_BASE_CLASSES.label,
  separator: SELECT_BASE_CLASSES.separator,
  empty: SELECT_BASE_CLASSES.empty,
  itemLeading: SELECT_BASE_CLASSES.itemLeading,
  itemLabel: SELECT_BASE_CLASSES.itemLabel,
  itemDescription: SELECT_BASE_CLASSES.itemDescription,
  itemTrailing: SELECT_BASE_CLASSES.itemTrailing,
} as const

const BASE_SELECT_SIZE_VARIANTS = {
  sm: {
    item: 'text-xs min-h-7',
  },
  md: {
    item: 'text-sm min-h-8',
  },
  lg: {
    item: 'text-base min-h-9',
  },
} as const

export const baseSelectRecipe = /* @__PURE__ */ slotRecipe<BaseSelectT.Slot, BaseSelectT.Variant>({
  base: BASE_SELECT_CLASSES,
  defaults: {
    size: 'md',
  },
  variants: {
    size: BASE_SELECT_SIZE_VARIANTS,
  },
} as const)
