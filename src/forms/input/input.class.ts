import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

import { INPUT_VARIANT_CLASSES, SURFACE_HIGHLIGHT_VARIANT } from '../../shared/cva-common.class'

export const inputRootVariants = cva(
  'inline-flex w-full items-center overflow-hidden rounded-md transition-[color,box-shadow] focus-within:effect-fv-border data-invalid:effect-invalid focus-within:data-invalid:effect-invalid',
  {
    defaultVariants: {
      size: 'md',
      variant: 'outline',
    },
    variants: {
      size: {
        xs: 'h-7 text-xs leading-7',
        sm: 'h-8 text-xs leading-8',
        md: 'h-9 text-sm leading-9',
        lg: 'h-10 text-sm leading-10',
        xl: 'h-11 text-base leading-11',
      },
      variant: INPUT_VARIANT_CLASSES,
      highlight: SURFACE_HIGHLIGHT_VARIANT,
      disabled: {
        true: 'effect-dis',
      },
    },
  },
)

export const inputInputVariants = cva(
  'flex-1 min-w-0 h-full bg-transparent text-foreground outline-none  style-placeholder disabled:effect-dis',
  {
    variants: {
      type: {
        file: 'text-muted-foreground file:(me-1.5 font-medium outline-none)',
      },
    },
  },
)

export const inputStartPaddingNoSlotVariants = cva('', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'ps-2',
      sm: 'ps-2.5',
      md: 'ps-2.5',
      lg: 'ps-3',
      xl: 'ps-3',
    },
  },
})

export const inputStartPaddingWithSlotVariants = cva('', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'ps-1',
      sm: 'ps-1.5',
      md: 'ps-1.5',
      lg: 'ps-2',
      xl: 'ps-2',
    },
  },
})

export const inputEndPaddingNoSlotVariants = cva('', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'pe-2',
      sm: 'pe-2.5',
      md: 'pe-2.5',
      lg: 'pe-3',
      xl: 'pe-3',
    },
  },
})

export const inputEndPaddingWithSlotVariants = cva('', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'pe-1',
      sm: 'pe-1.5',
      md: 'pe-1.5',
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

export type InputVariantProps = VariantProps<typeof inputRootVariants>
