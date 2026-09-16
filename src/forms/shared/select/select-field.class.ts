import { INPUT_VARIANT, TEXT_SIZE_VARIANT } from '../../../shared/recipe-common.class.ts'

export const FIELD_CONTROL_CLASS =
  'text-foreground outline-none rounded-md flex gap-1.5 w-full transition-[colors,box-shadow] items-center data-editable:focus-within:(outline-none border-ring ring-3 ring-ring/50) data-editable:focus-within:data-invalid:(border-destructive ring-destructive/20) data-invalid:(border-destructive ring-3 ring-destructive/20) data-disabled:(opacity-64 pointer-events-none) dark:data-editable:focus-within:data-invalid:(border-destructive/50 ring-destructive/40) dark:data-invalid:(border-destructive/50 ring-destructive/40)'

export const FIELD_INPUT_CLASS =
  'outline-none bg-transparent flex-1 w-full disabled:(opacity-64 pointer-events-none) read-only:cursor-pointer'

export const SELECT_LOADING_ICON_CLASS = '[&_[data-loading]]:animate-spin'

export const PRIMARY_TRIGGER_CLASS = `outline-none bg-transparent flex flex-1 gap-1.5 min-w-0 cursor-pointer items-center text-start disabled:pointer-events-none ${SELECT_LOADING_ICON_CLASS}`

const SELECT_FIELD_ACTION_CLASS =
  'text-muted-foreground opacity-80 p-0.5 rounded-xs inline-flex shrink-0 cursor-pointer items-center justify-center transition-colors hover:(bg-muted-hover text-foreground opacity-100) active:bg-muted-active disabled:pointer-events-none'

export const SECONDARY_TRIGGER_CLASS = `${SELECT_FIELD_ACTION_CLASS} outline-none data-loading:cursor-wait ${SELECT_LOADING_ICON_CLASS}`

export const SELECT_LEADING_ICON_CLASS = 'text-muted-foreground shrink-0'
export const SELECT_CLEAR_ACTION_CLASS = `${SELECT_FIELD_ACTION_CLASS} select-none`

export const SELECT_FAMILY_SLOTS = {
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
  sm: {
    control: `${TEXT_SIZE_VARIANT.sm} pe-1.5 ps-2`,
    input: TEXT_SIZE_VARIANT.sm,
    value: TEXT_SIZE_VARIANT.sm,
  },
  md: {
    control: `${TEXT_SIZE_VARIANT.md} pe-2 ps-2.5`,
    input: TEXT_SIZE_VARIANT.md,
    value: TEXT_SIZE_VARIANT.md,
  },
  lg: {
    control: `${TEXT_SIZE_VARIANT.lg} pe-2.5 ps-3`,
    input: TEXT_SIZE_VARIANT.lg,
    value: TEXT_SIZE_VARIANT.lg,
  },
} as const

export const TAG_FIELD_CONTROL_CLASS = `${FIELD_CONTROL_CLASS} data-tags:ps-1`
export const TAG_FIELD_INPUT_CLASS = `${FIELD_INPUT_CLASS} min-w-12 py-0.5`

export const TAG_SLOTS = {
  tagsContainer: 'py-1 bg-transparent flex flex-1 flex-wrap gap-1 max-w-full select-none',
  tag: 'text-foreground leading-tight px-1.5 pe-0 border-0 rounded-sm bg-muted inline-flex gap-1 max-w-50% w-fit whitespace-nowrap items-center justify-center',
  tagLabel: 'min-w-0 truncate',
  tagRemove:
    'p-0.5 appearance-none rounded-xs flex shrink-0 items-center justify-center -ms-1 cursor-pointer transition-opacity opacity-50 hover:opacity-100 disabled:(pointer-events-none opacity-50)',
} as const

export const TAG_SIZES = {
  sm: { ...FIELD_SIZES.sm, tagsContainer: TEXT_SIZE_VARIANT.sm, tag: TEXT_SIZE_VARIANT.sm },
  md: { ...FIELD_SIZES.md, tagsContainer: TEXT_SIZE_VARIANT.md, tag: TEXT_SIZE_VARIANT.md },
  lg: { ...FIELD_SIZES.lg, tagsContainer: TEXT_SIZE_VARIANT.lg, tag: TEXT_SIZE_VARIANT.lg },
} as const
