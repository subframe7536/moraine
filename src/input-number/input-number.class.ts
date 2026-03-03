import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

import { SURFACE_HIGHLIGHT_VARIANT, SURFACE_VARIANT_CLASSES } from '../shared/cva-common.class'

export const inputNumberBaseVariants = cva(
  'w-full rounded-md border border-input bg-transparent text-foreground outline-none transition-[color,box-shadow] dark:bg-input/30 placeholder:text-muted-foreground focus-visible:effect-fv-border aria-invalid:effect-invalid disabled:effect-dis',
  {
    defaultVariants: {
      size: 'md',
      variant: 'outline',
      orientation: 'horizontal',
    },
    variants: {
      size: {
        xs: 'h-7 px-2 text-xs',
        sm: 'h-8 px-2.5 text-xs',
        md: 'h-9 px-2.5 text-sm',
        lg: 'h-10 px-3 text-sm',
        xl: 'h-11 px-3 text-base',
      },
      variant: SURFACE_VARIANT_CLASSES,
      orientation: {
        horizontal: 'text-center',
        vertical: 'text-center pe-9',
      },
      highlight: SURFACE_HIGHLIGHT_VARIANT,
    },
  },
)

export const inputNumberIncrementPaddingVariants = cva('pe-9', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'pe-7',
      sm: 'pe-8',
      md: 'pe-9',
      lg: 'pe-10',
      xl: 'pe-11',
    },
  },
})

export const inputNumberDecrementPaddingVariants = cva('ps-9', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'ps-7',
      sm: 'ps-8',
      md: 'ps-9',
      lg: 'ps-10',
      xl: 'ps-11',
    },
  },
})

export const inputNumberIncrementVariants = cva('absolute flex items-center', {
  defaultVariants: {
    orientation: 'horizontal',
    disabled: false,
  },
  variants: {
    orientation: {
      horizontal: 'inset-y-0 end-0 pe-1',
      vertical: 'top-0 end-0 pe-1',
    },
    disabled: {
      true: 'effect-dis',
    },
  },
})

export const inputNumberDecrementVariants = cva('absolute flex items-center', {
  defaultVariants: {
    orientation: 'horizontal',
    disabled: false,
  },
  variants: {
    orientation: {
      horizontal: 'inset-y-0 start-0 ps-1',
      vertical: 'bottom-0 end-0 pe-1',
    },
    disabled: {
      true: 'effect-dis',
    },
  },
})

export type InputNumberVariantProps = VariantProps<typeof inputNumberBaseVariants> &
  VariantProps<typeof inputNumberIncrementVariants> &
  VariantProps<typeof inputNumberDecrementVariants>
