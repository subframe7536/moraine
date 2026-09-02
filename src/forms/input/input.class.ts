import type { VariantProps } from 'cls-variant'

import { INPUT_VARIANT } from '../../shared/cva-common.class'
import { cva } from '../../shared/utils'

export const inputRootVariants = cva(
  'inline-flex w-full cursor-text transition-[colors,box-shadow] items-center overflow-hidden focus-within:effect-fv-border data-invalid:effect-invalid data-disabled:effect-dis focus-within:data-invalid:effect-invalid',
  {
    defaultVariants: {
      size: 'md',
      variant: 'outline',
    },
    variants: {
      size: {
        sm: 'text-xs rounded-sm h-7',
        md: 'text-sm rounded-md h-8',
        lg: 'text-base rounded-lg h-9',
      },
      variant: INPUT_VARIANT,
    },
  },
)

export const inputInputVariants = cva(
  'style-placeholder text-foreground outline-none flex-1 h-full min-w-0 disabled:effect-dis',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      type: {
        file: 'text-muted-foreground file:(font-medium me-1.5 outline-none)',
      },
      size: {
        sm: 'leading-4 px-1.5 py-1',
        md: 'leading-5 px-2 py-1.5',
        lg: 'leading-6 px-2.5 py-2',
      },
    },
  },
)

export const inputLeadingVariants = cva('flex shrink-0 items-center', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: 'ps-2 gap-1',
      md: 'ps-2.5 gap-1.5',
      lg: 'ps-3 gap-2',
    },
  },
})

export const inputTrailingVariants = cva('flex shrink-0 items-center', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: 'pe-2 gap-1',
      md: 'pe-2.5 gap-1.5',
      lg: 'pe-3 gap-2',
    },
  },
})

export type InputVariantProps = VariantProps<typeof inputRootVariants>
