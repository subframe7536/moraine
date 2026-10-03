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
  'peer-aria-[invalid=true]:border-destructive peer-aria-[invalid=true]:ring-3 peer-aria-[invalid=true]:ring-destructive/20 dark:peer-aria-[invalid=true]:border-destructive/50 dark:peer-aria-[invalid=true]:ring-destructive/40'
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
