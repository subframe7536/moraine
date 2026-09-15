import { INPUT_VARIANT } from '../../../shared/recipe-common.class.ts'

export const FIELD_CONTROL_CLASS =
  'text-foreground outline-none rounded-md flex gap-1.5 w-full transition-[colors,box-shadow] items-center focus-within:(outline-none border-ring ring-3 ring-ring/50) focus-within:data-invalid:(border-destructive ring-destructive/20) data-invalid:(border-destructive ring-3 ring-destructive/20) data-disabled:(opacity-64 pointer-events-none) dark:focus-within:data-invalid:(border-destructive/50 ring-destructive/40) dark:data-invalid:(border-destructive/50 ring-destructive/40)'

export const FIELD_INPUT_CLASS =
  'outline-none bg-transparent flex-1 w-full disabled:(opacity-64 pointer-events-none) read-only:cursor-pointer'

export const PRIMARY_TRIGGER_CLASS =
  'outline-none bg-transparent flex flex-1 gap-1.5 min-w-0 cursor-pointer items-center text-start disabled:pointer-events-none'

export const SECONDARY_TRIGGER_CLASS =
  'text-muted-foreground opacity-80 outline-none p-0.5 rounded-xs inline-flex shrink-0 cursor-pointer items-center justify-center transition-colors hover:(bg-muted-hover text-foreground opacity-100) active:bg-muted-active disabled:pointer-events-none data-loading:cursor-wait'

export const SELECT_LEADING_ICON_CLASS = 'text-muted-foreground shrink-0'
export const SELECT_CLEAR_ACTION_CLASS =
  'text-muted-foreground opacity-80 p-0.5 rounded-xs inline-flex shrink-0 cursor-pointer select-none items-center justify-center disabled:pointer-events-none transition-colors hover:(bg-muted-hover text-foreground opacity-100) active:bg-muted-active'

export const COMMON_CONTROL_SLOTS = {
  control: FIELD_CONTROL_CLASS,
  leading: SELECT_LEADING_ICON_CLASS,
  clear: SELECT_CLEAR_ACTION_CLASS,
  itemLeading: 'shrink-0',
  itemLabel: 'flex-1 min-w-0 truncate',
  itemDescription: 'text-xs text-muted-foreground block',
  itemTrailing: 'text-sm flex shrink-0 size-4 pointer-events-none items-center justify-center',
} as const

export const FIELD_VARIANTS = {
  outline: { control: INPUT_VARIANT.outline },
  subtle: { control: INPUT_VARIANT.subtle },
  ghost: { control: INPUT_VARIANT.ghost },
  none: { control: INPUT_VARIANT.none },
} as const

export const FIELD_SIZES = {
  sm: { control: 'text-xs pe-1.5 ps-2', input: 'text-xs', value: 'text-xs' },
  md: { control: 'text-sm pe-2 ps-2.5', input: 'text-sm', value: 'text-sm' },
  lg: { control: 'text-base pe-2.5 ps-3', input: 'text-base', value: 'text-base' },
} as const

export const TAG_SLOTS = {
  tagsContainer: 'py-1 bg-transparent flex flex-1 flex-wrap gap-1 max-w-full select-none',
  tag: 'text-foreground leading-tight px-1.5 pe-0 border-0 rounded-sm bg-muted inline-flex gap-1 max-w-50% w-fit whitespace-nowrap items-center justify-center',
  tagLabel: 'min-w-0 truncate',
  tagRemove:
    'p-0.5 appearance-none rounded-xs flex shrink-0 items-center justify-center -ms-1 cursor-pointer transition-opacity opacity-50 hover:opacity-100 disabled:(pointer-events-none opacity-50)',
} as const

export const TAG_SIZES = {
  sm: { ...FIELD_SIZES.sm, tagsContainer: 'text-xs', tag: 'text-xs' },
  md: { ...FIELD_SIZES.md, tagsContainer: 'text-sm', tag: 'text-sm' },
  lg: { ...FIELD_SIZES.lg, tagsContainer: 'text-base', tag: 'text-base' },
} as const
