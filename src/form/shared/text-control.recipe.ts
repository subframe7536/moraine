export const TEXT_CONTROL_GROUPED = {
  false: {
    root: 'focus:border-ring focus:ring-3 focus:ring-ring/50 data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40 focus:data-invalid:border-destructive focus:data-invalid:ring-3 focus:data-invalid:ring-destructive/20 dark:focus:data-invalid:border-destructive/50 dark:focus:data-invalid:ring-destructive/40',
  },
  true: {
    root: 'peer flex-1 w-0 rounded-none border-0 bg-transparent shadow-none dark:bg-transparent group-hover/input-group:text-accent-foreground group-focus-within/input-group:text-accent-foreground',
  },
} as const

export const TEXT_CONTROL_VARIANT = {
  outline: { root: 'border border-input bg-transparent shadow-xs dark:bg-input/30' },
  subtle: { root: 'border border-input bg-input/30 shadow-xs' },
  ghost: {
    root: 'hover:(bg-accent-hover text-accent-foreground) focus-within:(bg-accent-hover text-accent-foreground)',
  },
  none: { root: 'focus:ring-0' },
} as const
