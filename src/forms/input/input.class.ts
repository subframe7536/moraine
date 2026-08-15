import type { VariantProps } from 'cls-variant'

import { INPUT_VARIANT } from '../../shared/cva-common.class.ts'
import { cva } from '../../shared/utils.ts'

export const inputRootVariants = cva(
  'rounded-md inline-flex w-full transition-[color,box-shadow] items-center overflow-hidden focus-within:effect-fv-border data-invalid:effect-invalid data-disabled:effect-dis focus-within:data-invalid:effect-invalid',
  {
    defaultVariants: {
      size: 'md',
      variant: 'outline',
    },
    variants: {
      size: {
        xs: 'text-xs leading-6 h-6',
        sm: 'text-sm leading-8 h-8',
        md: 'text-sm leading-9 h-9',
        lg: 'text-sm leading-10 h-10',
        xl: 'text-base leading-11 h-11',
      },
      variant: INPUT_VARIANT,
    },
  },
)

export const inputInputVariants = cva(
  'style-placeholder text-foreground outline-none bg-transparent flex-1 h-full min-w-0 disabled:effect-dis',
  {
    defaultVariants: {
      size: 'md',
      hasLeading: false,
      hasTrailing: false,
    },
    variants: {
      type: {
        file: 'text-muted-foreground file:(font-medium me-1.5 outline-none)',
      },
      size: {
        xs: 'py-1 var-input-1',
        sm: 'py-1 var-input-1.5',
        md: 'py-1 var-input-1.5',
        lg: 'py-1.5 var-input-2',
        xl: 'py-1.5 var-input-2',
      },
      hasLeading: { true: 'ps-$i-sm', false: 'ps-$i-lg' },
      hasTrailing: { true: 'pe-$i-sm', false: 'pe-$i-lg' },
    },
  },
)
export const inputLeadingVariants = cva('text-muted-foreground flex shrink-0 items-center', {
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

export const inputTrailingVariants = cva('text-muted-foreground flex shrink-0 items-center', {
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
