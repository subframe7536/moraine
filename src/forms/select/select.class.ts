import { INPUT_VARIANT } from '../../shared/recipe-common.class.ts'
import { slotRecipe } from '../../shared/style/recipe.ts'

const SELECT_CONTENT_CLASS =
  'text-popover-foreground p-0 outline-none rounded-md bg-popover flex flex-col min-w-36 max-w-(--mo-popper-content-available-width) min-w-(--mo-popper-anchor-width) w-(--mo-popper-anchor-width) origin-(--mo-popper-content-transform-origin) z-floating motion-reduce:animate-none border border-border shadow-md data-closed:(animate-mo-exit exit-opacity-0 exit-scale-95) data-expanded:(animate-mo-enter enter-opacity-0 enter-scale-95) data-[side=bottom]:mt-(--mo-popper-content-overflow-padding) data-[side=bottom]:-enter-translate-y-1 data-[side=bottom]:-exit-translate-y-1 data-[side=top]:mb-(--mo-popper-content-overflow-padding) data-[side=top]:enter-translate-y-1 data-[side=top]:exit-translate-y-1'

const SELECT_CONTROL_CLASS =
  'text-foreground outline-none rounded-md flex gap-1.5 w-full transition-[colors,box-shadow] items-center data-invalid:(border-destructive ring-3 ring-destructive/20) data-disabled:(opacity-64 pointer-events-none) dark:data-invalid:(border-destructive/50 ring-destructive/40)'

const SELECT_INPUT_CLASS =
  'outline-none bg-transparent flex-1 w-full disabled:(opacity-64 pointer-events-none) read-only:cursor-pointer'

export const SELECT_TRIGGER_ICON_CLASS =
  'data-loading:animate-spin text-muted-foreground outline-none opacity-80 shrink-0 pointer-events-none'
export const SELECT_LEADING_ICON_CLASS = 'text-muted-foreground shrink-0'

export const SELECT_CLEAR_ACTION_CLASS =
  '[&>[data-slot=icon]]:(text-muted-foreground opacity-80) [&>[data-loading]]:animate-spin disabled:pointer-events-none data-loading:cursor-wait transition-colors hover:bg-muted-hover active:bg-muted-active'

const SELECT_BASE_CLASSES = {
  root: 'inline-flex h-fit w-full relative',
  content: SELECT_CONTENT_CLASS,
  listbox: 'm-0 p-1 outline-none max-h-(--mo-popper-content-available-height) overflow-y-auto',
  item: '[&_[data-option-wrapper]]:(flex flex-1 gap-2 min-w-0 items-center) [&_[data-option-icon]]:shrink-0 [&_[data-option-text]]:(flex-1 min-w-0) px-2 py-1.5 outline-none rounded-sm flex gap-2 cursor-pointer items-center justify-between relative data-highlighted:bg-muted data-disabled:(opacity-64 pointer-events-none)',
  group: '[&:not(:first-child)]:mt-1.5',
  label: 'text-xs text-muted-foreground font-medium px-2 py-1.5 block',
  leading: SELECT_LEADING_ICON_CLASS,
  clear: `${SELECT_CLEAR_ACTION_CLASS} border border-transparent rounded-md inline-flex shrink-0 cursor-pointer select-none items-center justify-center`,
  empty: 'text-sm text-muted-foreground p-2 text-center',
  itemLabel: 'truncate',
  itemDescription: 'text-xs text-muted-foreground block',
  itemTrailing:
    'text-sm flex shrink-0 size-4 pointer-events-none items-center end-2 justify-center absolute',
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
    control: 'text-xs',
    input: 'text-xs',
    item: 'text-xs min-h-7',
  },
  md: {
    control: 'text-sm',
    input: 'text-sm',
    item: 'text-sm min-h-8',
  },
  lg: {
    control: 'text-base',
    input: 'text-base',
    item: 'text-base min-h-9',
  },
} as const

export const selectRecipe = /* @__PURE__ */ slotRecipe({
  base: {
    ...SELECT_BASE_CLASSES,
    control: SELECT_CONTROL_CLASS,
    input: `${SELECT_INPUT_CLASS} text-start min-w-0 truncate py-1.5 data-placeholder:text-muted-foreground`,
    trigger: SELECT_TRIGGER_ICON_CLASS,
  },
  defaults: SELECT_DEFAULTS,
  variants: {
    ...SELECT_VARIANTS,
    size: {
      sm: {
        ...SELECT_SIZE_VARIANTS.sm,
        control: `${SELECT_SIZE_VARIANTS.sm.control} pe-1.5 ps-2`,
      },
      md: {
        ...SELECT_SIZE_VARIANTS.md,
        control: `${SELECT_SIZE_VARIANTS.md.control} pe-2 ps-2.5`,
      },
      lg: {
        ...SELECT_SIZE_VARIANTS.lg,
        control: `${SELECT_SIZE_VARIANTS.lg.control} pe-2.5 ps-3`,
      },
    },
  },
} as const)

export const multiSelectRecipe = /* @__PURE__ */ slotRecipe({
  base: {
    ...SELECT_BASE_CLASSES,
    control: `${SELECT_CONTROL_CLASS} px-1.5`,
    input: `${SELECT_INPUT_CLASS} leading-tight px-0.5 py-0.5 min-w-12`,
    trigger:
      'outline-none shrink-0 cursor-pointer disabled:pointer-events-none data-loading:cursor-wait [&>[data-slot=icon]]:(text-muted-foreground opacity-80) [&>[data-loading]]:animate-spin',
    tagsContainer: 'py-1.5 bg-transparent flex flex-1 flex-wrap gap-1 max-w-full select-none',
    tag: '[&>[data-slot=label]]:(min-w-0 truncate) text-foreground leading-tight px-1.5 pe-0 border-0 rounded-sm bg-muted inline-flex gap-1 max-w-50% w-fit whitespace-nowrap items-center justify-center',
    tagRemove:
      'p-0.5 appearance-none flex shrink-0 items-center justify-center -ms-1 cursor-pointer disabled:pointer-events-none [&>[data-slot=icon]]:opacity-50 [&:not(:disabled)>[data-slot=icon]:hover]:opacity-100',
    tagOverflow: 'text-muted-foreground leading-tight px-1 flex items-center',
  },
  defaults: SELECT_DEFAULTS,
  variants: {
    ...SELECT_VARIANTS,
    size: {
      sm: {
        ...SELECT_SIZE_VARIANTS.sm,
        input: `${SELECT_SIZE_VARIANTS.sm.input} leading-tight`,
        tagsContainer: 'text-xs',
        tag: 'text-xs leading-tight',
        tagOverflow: 'text-xs leading-tight',
      },
      md: {
        ...SELECT_SIZE_VARIANTS.md,
        input: `${SELECT_SIZE_VARIANTS.md.input} leading-tight`,
        tagsContainer: 'text-sm',
        tag: 'text-sm leading-tight',
        tagOverflow: 'text-sm leading-tight',
      },
      lg: {
        ...SELECT_SIZE_VARIANTS.lg,
        input: `${SELECT_SIZE_VARIANTS.lg.input} leading-tight`,
        tagsContainer: 'text-base',
        tag: 'text-base leading-tight',
        tagOverflow: 'text-base leading-tight',
      },
    },
  },
} as const)
