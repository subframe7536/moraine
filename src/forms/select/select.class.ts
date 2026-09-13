import { INPUT_VARIANT } from '../../shared/recipe-common.class'
import { slotRecipe } from '../../shared/style/recipe'

import type { MultiSelectT } from './multi-select.types'
import type { SelectT } from './select.types'

export const SELECT_CONTENT_CLASS =
  'text-popover-foreground p-0 outline-none rounded-md bg-popover flex flex-col min-w-36 max-w-(--mo-popper-content-available-width) min-w-(--mo-popper-anchor-width) w-(--mo-popper-anchor-width) origin-(--mo-popper-content-transform-origin) z-floating motion-reduce:animate-none border border-border shadow-md data-closed:(animate-mo-exit exit-opacity-0 exit-scale-95) data-expanded:(animate-mo-enter enter-opacity-0 enter-scale-95) data-[side=bottom]:mt-(--mo-popper-content-overflow-padding) data-[side=bottom]:-enter-translate-y-1 data-[side=bottom]:-exit-translate-y-1 data-[side=top]:mb-(--mo-popper-content-overflow-padding) data-[side=top]:enter-translate-y-1 data-[side=top]:exit-translate-y-1'

const SELECT_CONTROL_CLASS =
  'text-foreground outline-none rounded-md flex gap-1.5 w-full transition-[colors,box-shadow] items-center data-invalid:(border-destructive ring-3 ring-destructive/20) data-disabled:(opacity-64 pointer-events-none) dark:data-invalid:(border-destructive/50 ring-destructive/40)'

const SELECT_INPUT_CLASS =
  'outline-none bg-transparent flex-1 w-full disabled:(opacity-64 pointer-events-none) read-only:cursor-pointer'

export const SELECT_TRIGGER_ICON_CLASS =
  'data-loading:animate-spin text-muted-foreground outline-none opacity-80 shrink-0 pointer-events-none'
export const SELECT_LEADING_ICON_CLASS = 'text-muted-foreground shrink-0'

export const SELECT_CLEAR_ACTION_CLASS =
  'text-muted-foreground opacity-80 disabled:pointer-events-none data-loading:cursor-wait transition-colors hover:(bg-muted-hover text-foreground opacity-100) active:bg-muted-active'

export const SELECT_BASE_CLASSES = {
  root: 'inline-flex h-fit w-full relative',
  content: SELECT_CONTENT_CLASS,
  control: SELECT_CONTROL_CLASS,
  listbox: 'm-0 p-1 outline-none max-h-(--mo-popper-content-available-height) overflow-y-auto',
  item: 'px-2 py-1.5 outline-none rounded-sm flex gap-2 cursor-pointer items-center relative data-highlighted:bg-muted data-disabled:(opacity-64 pointer-events-none)',
  group: '[&:not(:first-child)]:mt-1.5',
  label: 'text-xs text-muted-foreground font-medium px-2 py-1.5 block',
  separator: '-mx-1 my-1 h-px bg-border',
  leading: SELECT_LEADING_ICON_CLASS,
  clear: `${SELECT_CLEAR_ACTION_CLASS} border border-transparent rounded-md inline-flex shrink-0 cursor-pointer select-none items-center justify-center`,
  empty: 'text-sm text-muted-foreground p-2 text-center',
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
    item: 'text-xs min-h-7',
  },
  md: {
    control: 'text-sm pe-2 ps-2.5',
    input: 'text-sm',
    item: 'text-sm min-h-8',
  },
  lg: {
    control: 'text-base pe-2.5 ps-3',
    input: 'text-base',
    item: 'text-base min-h-9',
  },
} as const

export const selectRecipe = /* @__PURE__ */ slotRecipe<SelectT.Slot, SelectT.Variant>({
  base: {
    ...SELECT_BASE_CLASSES,
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
    ...SELECT_BASE_CLASSES,
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
