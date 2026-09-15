import { INPUT_VARIANT } from '../../shared/recipe-common.class.ts'
import { slotRecipe } from '../../shared/style/recipe.ts'

import type { ComboboxT } from './combobox.types.ts'
import type { MultiSelectT } from './multi-select.types.ts'
import type { SelectT } from './select.types.ts'
import type { TagsInputT } from './tags-input.types.ts'

const FIELD_CONTROL_CLASS =
  'text-foreground outline-none rounded-md flex gap-1.5 w-full transition-[colors,box-shadow] items-center focus-within:(outline-none border-ring ring-3 ring-ring/50) focus-within:data-invalid:(border-destructive ring-destructive/20) data-invalid:(border-destructive ring-3 ring-destructive/20) data-disabled:(opacity-64 pointer-events-none) dark:focus-within:data-invalid:(border-destructive/50 ring-destructive/40) dark:data-invalid:(border-destructive/50 ring-destructive/40)'

const FIELD_INPUT_CLASS =
  'outline-none bg-transparent flex-1 w-full disabled:(opacity-64 pointer-events-none) read-only:cursor-pointer'

const PRIMARY_TRIGGER_CLASS =
  'outline-none bg-transparent flex flex-1 gap-1.5 min-w-0 cursor-pointer items-center text-start disabled:pointer-events-none'

const SECONDARY_TRIGGER_CLASS =
  'text-muted-foreground opacity-80 outline-none rounded-md inline-flex shrink-0 cursor-pointer items-center justify-center transition-colors hover:(bg-muted-hover text-foreground opacity-100) active:bg-muted-active disabled:pointer-events-none data-loading:cursor-wait'

export const SELECT_LEADING_ICON_CLASS = 'text-muted-foreground shrink-0'
export const SELECT_CLEAR_ACTION_CLASS =
  'text-muted-foreground opacity-80 border border-transparent rounded-md inline-flex shrink-0 cursor-pointer select-none items-center justify-center disabled:pointer-events-none transition-colors hover:(bg-muted-hover text-foreground opacity-100) active:bg-muted-active'

const COMMON_CONTROL_SLOTS = {
  control: FIELD_CONTROL_CLASS,
  leading: SELECT_LEADING_ICON_CLASS,
  clear: SELECT_CLEAR_ACTION_CLASS,
  itemLeading: 'shrink-0',
  itemLabel: 'flex-1 min-w-0 truncate',
  itemDescription: 'text-xs text-muted-foreground block',
  itemTrailing: 'text-sm flex shrink-0 size-4 pointer-events-none items-center justify-center',
} as const

const FIELD_VARIANTS = {
  outline: { control: INPUT_VARIANT.outline },
  subtle: { control: INPUT_VARIANT.subtle },
  ghost: { control: INPUT_VARIANT.ghost },
  none: { control: INPUT_VARIANT.none },
} as const

const FIELD_SIZES = {
  sm: { control: 'text-xs pe-1.5 ps-2', input: 'text-xs', value: 'text-xs' },
  md: { control: 'text-sm pe-2 ps-2.5', input: 'text-sm', value: 'text-sm' },
  lg: { control: 'text-base pe-2.5 ps-3', input: 'text-base', value: 'text-base' },
} as const

export const selectRecipe = /* @__PURE__ */ slotRecipe<SelectT.Slot, SelectT.Variant>({
  base: {
    ...COMMON_CONTROL_SLOTS,
    trigger: PRIMARY_TRIGGER_CLASS,
    value: 'flex-1 min-w-0 truncate py-1.5 data-placeholder:text-muted-foreground',
  },
  defaults: { variant: 'outline', size: 'md' },
  variants: { variant: FIELD_VARIANTS, size: FIELD_SIZES },
} as const)

export const comboboxRecipe = /* @__PURE__ */ slotRecipe<ComboboxT.Slot, ComboboxT.Variant>({
  base: {
    ...COMMON_CONTROL_SLOTS,
    input: `${FIELD_INPUT_CLASS} text-start min-w-0 truncate py-1.5`,
    trigger: SECONDARY_TRIGGER_CLASS,
  },
  defaults: { variant: 'outline', size: 'md' },
  variants: { variant: FIELD_VARIANTS, size: FIELD_SIZES },
} as const)

const TAG_SLOTS = {
  tagsContainer: 'py-1 bg-transparent flex flex-1 flex-wrap gap-1 max-w-full select-none',
  tag: 'text-foreground leading-tight px-1.5 pe-0 border-0 rounded-sm bg-muted inline-flex gap-1 max-w-50% w-fit whitespace-nowrap items-center justify-center',
  tagLabel: 'min-w-0 truncate',
  tagRemove:
    'p-0.5 appearance-none flex shrink-0 items-center justify-center -ms-1 cursor-pointer transition-opacity opacity-50 hover:opacity-100 disabled:(pointer-events-none opacity-50)',
} as const

const TAG_SIZES = {
  sm: { ...FIELD_SIZES.sm, tagsContainer: 'text-xs', tag: 'text-xs' },
  md: { ...FIELD_SIZES.md, tagsContainer: 'text-sm', tag: 'text-sm' },
  lg: { ...FIELD_SIZES.lg, tagsContainer: 'text-base', tag: 'text-base' },
} as const

export const tagsInputRecipe = /* @__PURE__ */ slotRecipe<TagsInputT.Slot, TagsInputT.Variant>({
  base: {
    control: `${FIELD_CONTROL_CLASS} data-tags:ps-1`,
    leading: SELECT_LEADING_ICON_CLASS,
    input: `${FIELD_INPUT_CLASS} min-w-12 py-0.5`,
    clear: SELECT_CLEAR_ACTION_CLASS,
    ...TAG_SLOTS,
  },
  defaults: { variant: 'outline', size: 'md' },
  variants: { variant: FIELD_VARIANTS, size: TAG_SIZES },
} as const)

export const multiSelectRecipe = /* @__PURE__ */ slotRecipe<
  MultiSelectT.Slot,
  MultiSelectT.Variant
>({
  base: {
    ...COMMON_CONTROL_SLOTS,
    control: `${FIELD_CONTROL_CLASS} data-tags:ps-1`,
    input: `${FIELD_INPUT_CLASS} min-w-12 py-0.5`,
    trigger: SECONDARY_TRIGGER_CLASS,
    ...TAG_SLOTS,
    tagOverflow: 'text-muted-foreground px-1 flex items-center',
  },
  defaults: { variant: 'outline', size: 'md' },
  variants: {
    variant: FIELD_VARIANTS,
    size: {
      sm: { ...TAG_SIZES.sm, tagOverflow: 'text-xs' },
      md: { ...TAG_SIZES.md, tagOverflow: 'text-sm' },
      lg: { ...TAG_SIZES.lg, tagOverflow: 'text-base' },
    },
  },
} as const)
