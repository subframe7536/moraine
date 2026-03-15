import { cva } from '../../shared/utils'

export const iconButtonVariants = cva(
  'inline-flex cursor-pointer cursor-pointer select-none whitespace-nowrap items-center justify-center bg-clip-padding data-loading:effect-loading',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: 'rounded-xs size-3.5',
        sm: 'rounded-sm size-4',
        md: 'rounded-md size-4.5',
        lg: 'rounded-lg size-5',
        xl: 'rounded-xl size-5.5',
      },
    },
  },
)
