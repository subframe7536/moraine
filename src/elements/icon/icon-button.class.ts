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
        sm: 'rounded-md size-8',
        md: 'rounded-md',
        lg: 'rounded-md size-10',
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
      sm: 'size-4',
      md: 'size-4',
      lg: 'size-4',
    },
  },
})

export type IconButtonVariantProps = VariantProps<typeof iconButtonVariants>
