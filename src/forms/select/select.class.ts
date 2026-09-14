import { INPUT_VARIANT } from '../../shared/recipe-common.class.ts'
import { slotRecipe } from '../../shared/style/recipe.ts'

import type { MultiSelectT } from './multi-select.types.ts'
import type { SelectT } from './select.types.ts'

const SELECT_CONTROL_CLASS =
  'text-foreground outline-none rounded-md flex gap-1.5 w-full transition-[colors,box-shadow] items-center data-invalid:(border-destructive ring-3 ring-destructive/20) data-disabled:(opacity-64 pointer-events-none) dark:data-invalid:(border-destructive/50 ring-destructive/40)'

const SELECT_INPUT_CLASS =
  'outline-none bg-transparent flex-1 w-full disabled:(opacity-64 pointer-events-none) read-only:cursor-pointer'

export const SELECT_TRIGGER_ICON_CLASS =
  'data-loading:animate-spin text-muted-foreground outline-none opacity-80 shrink-0 pointer-events-none'
export const SELECT_LEADING_ICON_CLASS = 'text-muted-foreground shrink-0'

export const SELECT_CLEAR_ACTION_CLASS =
  'text-muted-foreground opacity-80 disabled:pointer-events-none data-loading:cursor-wait transition-colors hover:(bg-muted-hover text-foreground opacity-100) active:bg-muted-active'

const SELECT_CONTROL_CLASSES = {
  root: 'inline-flex h-fit w-full relative',
  control: SELECT_CONTROL_CLASS,
  leading: SELECT_LEADING_ICON_CLASS,
  clear: `${SELECT_CLEAR_ACTION_CLASS} border border-transparent rounded-md inline-flex shrink-0 cursor-pointer select-none items-center justify-center`,
  itemLeading: 'shrink-0',
  itemLabel: 'flex-1 min-w-0 truncate',
  itemDescription: 'text-xs text-muted-foreground block',
  itemTrailing: 'text-sm flex shrink-0 size-4 pointer-events-none items-center justify-center',
} as const

const SELECT_DEFAULTS = {
  variant: 'outline',
  size: 'md',
  search: false,
} as const

const SELECT_VARIANTS = {
  variant: {
    outline: { control: INPUT_VARIANT.outline },
    subtle: { control: INPUT_VARIANT.subtle },
    ghost: { control: INPUT_VARIANT.ghost },
    none: { control: INPUT_VARIANT.none },
  },
  search: {
    true: {
      control:
        'cursor-text focus-within:(outline-none border-ring ring-3 ring-ring/50) focus-within:data-invalid:(border-destructive ring-destructive/20) dark:focus-within:data-invalid:(border-destructive/50 ring-destructive/40)',
    },
    false: {
      control:
        'cursor-pointer focus-visible:(outline-none border-ring ring-3 ring-ring/50) focus-visible:data-invalid:(border-destructive ring-destructive/20) dark:focus-visible:data-invalid:(border-destructive/50 ring-destructive/40)',
    },
  },
} as const

const SELECT_SIZE_VARIANTS = {
  sm: {
    control: 'text-xs pe-1.5 ps-2',
    input: 'text-xs',
  },
  md: {
    control: 'text-sm pe-2 ps-2.5',
    input: 'text-sm',
  },
  lg: {
    control: 'text-base pe-2.5 ps-3',
    input: 'text-base',
  },
} as const

export const selectRecipe = /* @__PURE__ */ slotRecipe<SelectT.Slot, SelectT.Variant>({
  base: {
    ...SELECT_CONTROL_CLASSES,
    control: SELECT_CONTROL_CLASS,
    input: `${SELECT_INPUT_CLASS} text-start min-w-0 truncate py-1.5 data-placeholder:text-muted-foreground`,
    trigger: SELECT_TRIGGER_ICON_CLASS,
  },
  defaults: SELECT_DEFAULTS,
  variants: {
    ...SELECT_VARIANTS,
    size: SELECT_SIZE_VARIANTS,
  },
} as const)

export const multiSelectRecipe = /* @__PURE__ */ slotRecipe<
  MultiSelectT.Slot,
  MultiSelectT.Variant
>({
  base: {
    ...SELECT_CONTROL_CLASSES,
    control: `${SELECT_CONTROL_CLASS} data-tags:ps-1`,
    input: `${SELECT_INPUT_CLASS} min-w-12 py-0.5`,
    trigger:
      'text-muted-foreground opacity-80 outline-none shrink-0 cursor-pointer disabled:pointer-events-none data-loading:cursor-wait',
    tagsContainer: 'py-1 bg-transparent flex flex-1 flex-wrap gap-1 max-w-full select-none',
    tag: 'text-foreground leading-tight leading-tight px-1.5 pe-0 border-0 rounded-sm bg-muted inline-flex gap-1 max-w-50% w-fit whitespace-nowrap items-center justify-center',
    tagLabel: 'min-w-0 truncate',
    tagRemove:
      'p-0.5 appearance-none flex shrink-0 items-center justify-center -ms-1 cursor-pointer transition-opacity opacity-50 hover:opacity-100 disabled:(pointer-events-none opacity-50)',
    tagOverflow: 'text-muted-foreground px-1 flex items-center',
  },
  defaults: SELECT_DEFAULTS,
  variants: {
    ...SELECT_VARIANTS,
    size: {
      sm: {
        ...SELECT_SIZE_VARIANTS.sm,
        tagsContainer: 'text-xs',
        tag: 'text-xs',
        tagOverflow: 'text-xs',
      },
      md: {
        ...SELECT_SIZE_VARIANTS.md,
        tagsContainer: 'text-sm',
        tag: 'text-sm',
        tagOverflow: 'text-sm',
      },
      lg: {
        ...SELECT_SIZE_VARIANTS.lg,
        tagsContainer: 'text-base',
        tag: 'text-base',
        tagOverflow: 'text-base',
      },
    },
  },
} as const)
