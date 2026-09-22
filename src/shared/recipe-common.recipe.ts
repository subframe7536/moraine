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
