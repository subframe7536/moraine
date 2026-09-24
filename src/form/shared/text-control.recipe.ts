export const TEXT_CONTROL_GROUPED = {
  false: {
    root: 'focus:border-ring focus:ring-3 focus:ring-ring/50 data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40 focus:data-invalid:border-destructive focus:data-invalid:ring-3 focus:data-invalid:ring-destructive/20 dark:focus:data-invalid:border-destructive/50 dark:focus:data-invalid:ring-destructive/40',
  },
  true: {
    root: 'peer flex-1 w-0 rounded-none border-0 bg-transparent shadow-none dark:bg-transparent',
  },
} as const

export const TEXT_CONTROL_VARIANT = {
  outline: { root: 'border border-input bg-transparent shadow-xs dark:bg-input/30' },
  subtle: { root: 'border border-input bg-input/30 shadow-xs' },
  ghost: { root: 'hover:bg-muted-hover focus-within:bg-muted-hover' },
  none: { root: 'focus:ring-0' },
} as const
