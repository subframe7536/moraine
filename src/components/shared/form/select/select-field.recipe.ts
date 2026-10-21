import {
  DARK_DATA_INVALID_CLASS,
  DARK_EDITABLE_FOCUS_WITHIN_INVALID_CLASS,
  DATA_DISABLED_CLASS,
  DATA_INVALID_CLASS,
  DISABLED_CLASS,
  EDITABLE_FOCUS_WITHIN_CLASS,
  EDITABLE_FOCUS_WITHIN_INVALID_CLASS,
  groupAccentClass,
  HIGHLIGHTED_MUTED_TEXT_CLASS,
  INPUT_VARIANT,
  TEXT_SIZE_VARIANT,
  SELECT_TRIGGER_FOCUS_CLASS,
} from '../../../../theme/recipe-common.recipe'
import { createDataAttributes } from '../../../../theme/style-contract'
import type { DataAttributeContract } from '../../../../theme/style-contract'

import type { SelectItemStyleSlot } from './style-types'

export const FIELD_CONTROL_CLASS = `text-foreground outline-none rounded-md flex gap-1.5 w-full transition-[color,background-color,border-color,box-shadow] items-center relative ${EDITABLE_FOCUS_WITHIN_CLASS}  ${EDITABLE_FOCUS_WITHIN_INVALID_CLASS}  ${DATA_INVALID_CLASS}  ${DATA_DISABLED_CLASS}  ${DARK_EDITABLE_FOCUS_WITHIN_INVALID_CLASS}  ${DARK_DATA_INVALID_CLASS}`

export const FIELD_INPUT_CLASS = `outline-none bg-transparent flex-1 w-full ${DISABLED_CLASS} read-only:cursor-pointer`

export const SELECT_LOADING_ICON_CLASS = 'data-loading:animate-spin'

export const PRIMARY_TRIGGER_CLASS =
  'text-start outline-none bg-transparent flex flex-1 gap-1.5 min-w-0 cursor-pointer items-center static disabled:pointer-events-none'

const SELECT_FIELD_ACTION_CLASS =
  'text-muted-foreground p-0.5 rounded-xs inline-flex shrink-0 cursor-pointer transition-colors items-center justify-center hover:(text-accent-foreground bg-accent-hover) active:bg-accent-active disabled:pointer-events-none'

export const SECONDARY_TRIGGER_CLASS = `${SELECT_FIELD_ACTION_CLASS} outline-none static data-loading:cursor-wait`

export const SELECT_LEADING_ICON_CLASS = 'text-muted-foreground shrink-0'
export const SELECT_CLEAR_ACTION_CLASS = `${SELECT_FIELD_ACTION_CLASS} select-none`

export const TAG_FIELD_CONTROL_CLASS = `${FIELD_CONTROL_CLASS} data-tags:ps-1`
export const TAG_FIELD_INPUT_CLASS = `${FIELD_INPUT_CLASS} py-0.5 min-w-12 data-duplicate:text-danger-ink`

export const selectItemDataAttributes = {
  itemDescription: /* @__PURE__ */ createDataAttributes('highlighted'),
} satisfies DataAttributeContract<keyof SelectItemStyleSlot>

export const SELECT_FAMILY_SLOTS = {
  control: FIELD_CONTROL_CLASS,
  content: '',
  listbox: '',
  item: '',
  group: '',
  groupLabel: '',
  separator: '',
  leading: SELECT_LEADING_ICON_CLASS,
  clear: SELECT_CLEAR_ACTION_CLASS,
  itemLeading: 'shrink-0',
  itemWrapper: 'flex-1 min-w-0 truncate',
  itemLabel: '',
  itemDescription: `text-xs ${HIGHLIGHTED_MUTED_TEXT_CLASS} block`,
  itemIndicator: 'text-sm flex shrink-0 size-4 pointer-events-none items-center justify-center',
} as const

export const FIELD_VARIANTS = {
  outline: { control: INPUT_VARIANT.outline },
  subtle: { control: INPUT_VARIANT.subtle },
  ghost: {
    control: `${INPUT_VARIANT.ghost} group/select-control`,
    leading: groupAccentClass('select-control'),
    clear: groupAccentClass('select-control'),
    trigger: groupAccentClass('select-control'),
    input: groupAccentClass('select-control', 'placeholder:text-accent-foreground'),
  },
  none: { control: INPUT_VARIANT.none },
} as const

export const SELECT_TRIGGER_FIELD_VARIANTS = {
  outline: { ...FIELD_VARIANTS.outline, trigger: SELECT_TRIGGER_FOCUS_CLASS },
  subtle: { ...FIELD_VARIANTS.subtle, trigger: SELECT_TRIGGER_FOCUS_CLASS },
  ghost: {
    ...FIELD_VARIANTS.ghost,
    trigger: `${SELECT_TRIGGER_FOCUS_CLASS} ${FIELD_VARIANTS.ghost.trigger}`,
  },
  none: FIELD_VARIANTS.none,
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

export const TAG_SLOTS = {
  tagsContainer: 'py-1 bg-transparent flex flex-1 flex-wrap gap-1 max-w-full select-none',
  tag: 'text-foreground leading-tight px-1.5 pe-0 border-0 rounded-sm bg-muted inline-flex gap-1 max-w-[50%] w-fit whitespace-nowrap items-center justify-center',
  tagLabel: 'min-w-0 truncate',
  tagRemove:
    'text-muted-foreground p-0.5 appearance-none rounded-xs flex shrink-0 items-center justify-center -ms-1 cursor-pointer transition-colors hover:(bg-accent-hover text-accent-foreground) active:bg-accent-active disabled:(pointer-events-none opacity-50)',
} as const

export const TAG_SIZES = {
  sm: {
    ...FIELD_SIZES.sm,
    tagsContainer: TEXT_SIZE_VARIANT.sm,
    tag: TEXT_SIZE_VARIANT.sm,
    tagOverflow: TEXT_SIZE_VARIANT.sm,
  },
  md: {
    ...FIELD_SIZES.md,
    tagsContainer: TEXT_SIZE_VARIANT.md,
    tag: TEXT_SIZE_VARIANT.md,
    tagOverflow: TEXT_SIZE_VARIANT.md,
  },
  lg: {
    ...FIELD_SIZES.lg,
    tagsContainer: TEXT_SIZE_VARIANT.lg,
    tag: TEXT_SIZE_VARIANT.lg,
    tagOverflow: TEXT_SIZE_VARIANT.lg,
  },
} as const
