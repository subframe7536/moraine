export const INPUT_VARIANT_CLASSES = {
  outline: 'b-(1 input) bg-transparent',
  subtle: 'b-(1 input) bg-input/30',
  ghost: 'hover:bg-muted/50 focus-within:bg-muted/50',
  none: 'focus-within:ring-0',
} as const

export const SURFACE_HIGHLIGHT_VARIANT = {
  true: 'surface-highlight',
} as const

export const SURFACE_INVALID_VARIANT = {
  true: 'effect-invalid',
} as const

export const TEXT_SIZE_VARIANT = {
  xs: 'text-xs',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-sm',
  xl: 'text-base',
} as const
