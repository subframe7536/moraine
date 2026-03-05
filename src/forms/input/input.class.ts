import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

import { SURFACE_HIGHLIGHT_VARIANT, SURFACE_VARIANT_CLASSES } from '../../shared/cva-common.class'

export const inputRootVariants = cva(
  'inline-flex w-full items-center overflow-hidden rounded-md border border-input bg-transparent transition dark:bg-input/30 focus-within:effect-fv-border data-invalid:effect-invalid',
  {
    defaultVariants: {
      size: 'md',
      variant: 'outline',
    },
    variants: {
      size: {
        xs: 'h-7 text-xs',
        sm: 'h-8 text-xs',
        md: 'h-9 text-sm',
        lg: 'h-10 text-sm',
        xl: 'h-11 text-base',
      },
      variant: SURFACE_VARIANT_CLASSES,
      highlight: SURFACE_HIGHLIGHT_VARIANT,
      disabled: {
        true: 'effect-dis',
      },
    },
  },
)

export const inputBaseVariants = cva(
  'flex-1 min-w-0 h-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground disabled:effect-dis',
  {
    variants: {
      type: {
        file: 'text-muted-foreground file:(me-2 bg-transparent font-medium text-foreground text-sm outline-none)',
      },
    },
  },
)

export const inputStartPaddingNoSlotVariants = cva('ps-3.5', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'ps-3',
      sm: 'ps-3.5',
      md: 'ps-3.5',
      lg: 'ps-4',
      xl: 'ps-5',
    },
  },
})

export const inputStartPaddingWithSlotVariants = cva('ps-2', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'ps-1',
      sm: 'ps-1.5',
      md: 'ps-2',
      lg: 'ps-2',
      xl: 'ps-2',
    },
  },
})

export const inputEndPaddingNoSlotVariants = cva('pe-3.5', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'pe-3',
      sm: 'pe-3.5',
      md: 'pe-3.5',
      lg: 'pe-4',
      xl: 'pe-4',
    },
  },
})

export const inputEndPaddingWithSlotVariants = cva('pe-2', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'pe-1',
      sm: 'pe-1.5',
      md: 'pe-2',
      lg: 'pe-2',
      xl: 'pe-2',
    },
  },
})

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

export type InputVariantProps = VariantProps<typeof inputRootVariants> &
  VariantProps<typeof inputBaseVariants> &
  VariantProps<typeof inputStartPaddingNoSlotVariants> &
  VariantProps<typeof inputStartPaddingWithSlotVariants> &
  VariantProps<typeof inputEndPaddingNoSlotVariants> &
  VariantProps<typeof inputEndPaddingWithSlotVariants> &
  VariantProps<typeof inputLeadingVariants> &
  VariantProps<typeof inputTrailingVariants>
