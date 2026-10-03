export const REQUIRED_MARK_VARIANT = {
  true: "after:(text-destructive ms-0.5 content-['*'])",
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
  top: 'mb-(--mo-popper-content-overflow-padding) enter-translate-y-1 exit-translate-y-1',
  right: 'ml-(--mo-popper-content-overflow-padding) -enter-translate-x-1 -exit-translate-x-1',
  bottom: 'mt-(--mo-popper-content-overflow-padding) -enter-translate-y-1 -exit-translate-y-1',
  left: 'mr-(--mo-popper-content-overflow-padding) enter-translate-x-1 exit-translate-x-1',
} as const

export const INPUT_VARIANT = {
  outline: 'border border-input bg-control shadow-input',
  subtle: 'border border-input bg-muted shadow-input',
  ghost:
    'hover:(bg-accent-hover text-accent-foreground) focus-within:(bg-accent-hover text-accent-foreground)',
  none: 'focus-within:ring-0',
} as const

export const TEXT_SIZE_VARIANT = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
} as const

// Keep selector-specific groups literal so CSS engines can discover every utility.
export const FOCUS_CLASS = 'focus:(border-ring ring-3 ring-ring/50)'
export const FOCUS_VISIBLE_CLASS = 'focus-visible:(outline-none border-ring ring-3 ring-ring/50)'
export const FOCUS_VISIBLE_RING_CLASS = 'focus-visible:(outline-none ring-3 ring-ring/50)'
export const FOCUS_VISIBLE_BORDER_CLASS =
  'focus-visible:(outline-none border border-ring ring-3 ring-ring/50)'
export const FOCUS_WITHIN_CLASS = 'focus-within:(outline-none border-ring ring-3 ring-ring/50)'
export const PEER_FOCUS_CLASS = 'peer-focus:(border-ring ring-3 ring-ring/50)'
export const PEER_FOCUS_VISIBLE_CLASS =
  'peer-focus-visible:(outline-none border-ring ring-3 ring-ring/50)'
export const EDITABLE_FOCUS_WITHIN_CLASS =
  'data-editable:focus-within:(outline-none border-ring ring-3 ring-ring/50)'

export const DATA_INVALID_CLASS = 'data-invalid:(border-destructive ring-3 ring-destructive/20)'
export const DARK_DATA_INVALID_CLASS =
  'dark:data-invalid:(border-destructive/50 ring-destructive/40)'
export const FOCUS_INVALID_CLASS =
  'focus:data-invalid:(border-destructive ring-3 ring-destructive/20) dark:focus:data-invalid:(border-destructive/50 ring-destructive/40)'
export const FOCUS_WITHIN_INVALID_CLASS =
  'focus-within:data-invalid:(border-destructive ring-3 ring-destructive/20) dark:focus-within:data-invalid:(border-destructive/50 ring-destructive/40)'
export const PEER_INVALID_CLASS =
  'peer-aria-invalid:border-destructive peer-aria-invalid:ring-3 peer-aria-invalid:ring-destructive/20 dark:peer-aria-invalid:border-destructive/50 dark:peer-aria-invalid:ring-destructive/40'
export const EDITABLE_FOCUS_WITHIN_INVALID_CLASS =
  'data-editable:focus-within:data-invalid:(border-destructive ring-destructive/20)'
export const DARK_EDITABLE_FOCUS_WITHIN_INVALID_CLASS =
  'dark:data-editable:focus-within:data-invalid:(border-destructive/50 ring-destructive/40)'

export const DISABLED_CLASS = 'disabled:(opacity-64 pointer-events-none)'
export const DATA_DISABLED_CLASS = 'data-disabled:(opacity-64 pointer-events-none)'
export const ARIA_DISABLED_CLASS = 'aria-disabled:(opacity-64 pointer-events-none)'

export const SELECT_TRIGGER_FOCUS_CLASS =
  "focus-visible:after:(border border-ring rounded-md pointer-events-none content-[''] ring-3 ring-ring/50 inset-0 absolute z-10) focus-visible:data-invalid:after:(border-destructive ring-destructive/20) dark:focus-visible:data-invalid:after:(border-destructive/50 ring-destructive/40)"

export const OVERLAY_CLOSE_BUTTON_CLASS =
  'rounded-md inline-flex size-8 items-center justify-center active:(text-accent-foreground bg-accent-active) hover:(text-accent-foreground bg-accent-hover) focus-visible:(outline-none ring-2 ring-ring) disabled:(opacity-50 pointer-events-none)'
