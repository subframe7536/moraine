import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const inputRootVariants = cva(
  'inline-flex w-full items-center rounded-md border transition-shadow overflow-hidden',
  {
    defaultVariants: {
      color: 'primary',
      size: 'md',
      variant: 'outline',
    },
    variants: {
      color: {
        primary: 'focus-within:(ring-2 ring-inset ring-primary)',
        secondary: 'focus-within:(ring-2 ring-inset ring-secondary)',
        neutral: 'focus-within:(ring-2 ring-inset ring-foreground)',
        error: 'focus-within:(ring-2 ring-inset ring-destructive)',
      },
      size: {
        xs: 'h-7 text-xs',
        sm: 'h-8 text-xs',
        md: 'h-9 text-sm',
        lg: 'h-10 text-sm',
        xl: 'h-11 text-base',
      },
      variant: {
        outline: 'border border-input bg-background',
        soft: 'border-transparent bg-muted/50 hover:bg-muted',
        subtle: 'border border-border bg-muted',
        ghost: 'border-transparent bg-transparent hover:bg-muted',
        none: 'border-transparent bg-transparent',
      },
      highlight: {
        true: 'ring-1 ring-inset ring-border',
      },
      disabled: {
        true: 'cursor-not-allowed opacity-75',
      },
      fieldGroup: {
        horizontal: '',
        vertical: '',
      },
    },
    compoundVariants: [
      { color: 'primary', highlight: 'true', class: 'ring-primary' },
      { color: 'secondary', highlight: 'true', class: 'ring-secondary' },
      { color: 'neutral', highlight: 'true', class: 'ring-foreground' },
      { color: 'error', highlight: 'true', class: 'ring-destructive' },
    ],
  },
)

export const inputBaseVariants = cva(
  'flex-1 min-w-0 h-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed',
  {
    variants: {
      type: {
        file: 'text-muted-foreground file:(me-2 bg-transparent font-medium text-foreground text-sm outline-none)',
      },
    },
  },
)

export const inputSizePadding = {
  xs: { start: 'ps-3', end: 'pe-3' },
  sm: { start: 'ps-3.5', end: 'pe-3.5' },
  md: { start: 'ps-3.5', end: 'pe-3.5' },
  lg: { start: 'ps-4', end: 'pe-4' },
  xl: { start: 'ps-5', end: 'pe-4' },
} as const

export const inputSizeSlotPadding = {
  xs: { start: 'ps-1', end: 'pe-1' },
  sm: { start: 'ps-1.5', end: 'pe-1.5' },
  md: { start: 'ps-2', end: 'pe-2' },
  lg: { start: 'ps-2', end: 'pe-2' },
  xl: { start: 'ps-2', end: 'pe-2' },
} as const

export const inputLeadingVariants = cva('flex items-center shrink-0 text-muted-foreground', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'ps-2 gap-1',
      sm: 'ps-2.5 gap-1.5',
      md: 'ps-2.5 gap-1.5',
      lg: 'ps-3 gap-2',
      xl: 'ps-3 gap-2',
    },
  },
})

export const inputTrailingVariants = cva('flex items-center shrink-0 text-muted-foreground', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'pe-2 gap-1',
      sm: 'pe-2.5 gap-1.5',
      md: 'pe-2.5 gap-1.5',
      lg: 'pe-3 gap-2',
      xl: 'pe-3 gap-2',
    },
  },
})

export const inputLeadingIconVariants = cva('shrink-0', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'text-sm',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-base',
      xl: 'text-lg',
    },
    loading: {
      true: 'animate-spin',
    },
  },
})

export const inputTrailingIconVariants = cva('shrink-0', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'text-sm',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-base',
      xl: 'text-lg',
    },
    loading: {
      true: 'animate-spin',
    },
  },
})

export type InputVariantProps = VariantProps<typeof inputRootVariants> &
  VariantProps<typeof inputBaseVariants> &
  VariantProps<typeof inputLeadingVariants> &
  VariantProps<typeof inputTrailingVariants> &
  VariantProps<typeof inputLeadingIconVariants> &
  VariantProps<typeof inputTrailingIconVariants>
