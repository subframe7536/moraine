import {
  DARK_DATA_INVALID_CLASS,
  DARK_EDITABLE_FOCUS_WITHIN_INVALID_CLASS,
  DATA_DISABLED_CLASS,
  DATA_INVALID_CLASS,
  DISABLED_CLASS,
  EDITABLE_FOCUS_WITHIN_CLASS,
  EDITABLE_FOCUS_WITHIN_INVALID_CLASS,
} from '../../../theme/recipe-common.class'
export const FIELD_CONTROL_CLASS = `relative text-foreground outline-none rounded-md flex gap-1.5 w-full transition-[colors,box-shadow] items-center ${EDITABLE_FOCUS_WITHIN_CLASS} ${EDITABLE_FOCUS_WITHIN_INVALID_CLASS} ${DATA_INVALID_CLASS} ${DATA_DISABLED_CLASS} ${DARK_EDITABLE_FOCUS_WITHIN_INVALID_CLASS} ${DARK_DATA_INVALID_CLASS}`

export const FIELD_INPUT_CLASS = `outline-none bg-transparent flex-1 w-full ${DISABLED_CLASS} read-only:cursor-pointer`

export const SELECT_LOADING_ICON_CLASS = 'data-loading:animate-spin'

export const PRIMARY_TRIGGER_CLASS =
  'static outline-none bg-transparent flex flex-1 gap-1.5 min-w-0 cursor-pointer items-center text-start disabled:pointer-events-none'

const SELECT_FIELD_ACTION_CLASS =
  'text-muted-foreground p-0.5 rounded-xs inline-flex shrink-0 cursor-pointer items-center justify-center transition-colors hover:(bg-accent-hover text-accent-foreground) active:bg-accent-active disabled:pointer-events-none'

export const SECONDARY_TRIGGER_CLASS = `${SELECT_FIELD_ACTION_CLASS} static outline-none data-loading:cursor-wait`

export const SELECT_LEADING_ICON_CLASS = 'text-muted-foreground shrink-0'
export const SELECT_CLEAR_ACTION_CLASS = `${SELECT_FIELD_ACTION_CLASS} select-none`

export const TAG_FIELD_CONTROL_CLASS = `${FIELD_CONTROL_CLASS} data-tags:ps-1`
export const TAG_FIELD_INPUT_CLASS = `${FIELD_INPUT_CLASS} min-w-12 py-0.5 data-duplicate:text-destructive`
