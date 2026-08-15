import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils.ts'

export const iconButtonVariants = cva(
  'border border-transparent inline-flex shrink-0 cursor-pointer select-none items-center justify-center',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: 'rounded-md size-6',
        sm: 'rounded-md size-8',
        md: 'rounded-md',
        lg: 'rounded-md size-10',
        xl: 'rounded-md size-11',
      },
    },
  },
)

export const iconVariants = cva('data-loading:effect-loading', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'size-3',
      sm: 'size-4',
      md: 'size-4',
      lg: 'size-4',
      xl: 'size-4.5',
    },
  },
})

export type IconButtonVariantProps = VariantProps<typeof iconButtonVariants>
