export const INPUT_VARIANT = {
  outline: 'border border-input bg-transparent shadow-xs dark:bg-input/30',
  subtle: 'border border-input bg-input/30 shadow-xs',
  ghost: 'hover:bg-muted-hover focus-within:bg-muted-hover',
  none: 'focus-within:ring-0',
} as const

export const TEXT_SIZE_VARIANT = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
} as const

export const REQUIRED_MARK_VARIANT = {
  true: "after:text-destructive after:ms-0.5 after:content-['*']",
} as const

export const FLEX_ORIENTATION_VARIANT = {
  horizontal: 'flex-row',
  vertical: 'flex-col',
} as const

export const CHECKABLE_CONTAINER_SIZE_VARIANT = {
  sm: 'h-4',
  md: 'h-5',
  lg: 'h-6',
} as const

export const CHECKABLE_BASE_SIZE_VARIANT = {
  sm: 'size-3.5',
  md: 'size-4',
  lg: 'size-4.5',
} as const

export const CHECKABLE_INDICATOR_VARIANT = {
  start: 'flex-row',
  end: 'flex-row-reverse',
} as const

export const CHECKABLE_WRAPPER_ALIGN_VARIANT = {
  start: 'ms-2',
  end: 'me-2',
  hidden: '',
} as const

export const TABLE_EDGE_ORIENTATION_VARIANT = {
  horizontal: 'first-of-type:rounded-s-lg last-of-type:rounded-e-lg [&:not(:first-of-type)]:-ms-px',
  vertical: 'first-of-type:rounded-t-lg last-of-type:rounded-b-lg [&:not(:first-of-type)]:-mt-px',
} as const

export const CARD_PADDING_SIZE_VARIANT = {
  sm: 'p-3',
  md: 'p-3.5',
  lg: 'p-4',
} as const

export const OVERLAY_POSITIONER_CLASS = 'left-0 top-0 absolute'

export const POPPER_CONTENT_SIDE_VARIANT = {
  top: 'mb-[var(--mo-popper-content-overflow-padding)] enter-translate-y-1 exit-translate-y-1',
  right: 'ml-[var(--mo-popper-content-overflow-padding)] -enter-translate-x-1 -exit-translate-x-1',
  bottom: 'mt-[var(--mo-popper-content-overflow-padding)] -enter-translate-y-1 -exit-translate-y-1',
  left: 'mr-[var(--mo-popper-content-overflow-padding)] enter-translate-x-1 exit-translate-x-1',
} as const
