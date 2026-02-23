import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const paginationControlVariants = cva(
  'inline-flex items-center justify-center disabled:(cursor-not-allowed opacity-60)',
  {
    variants: {
      variant: {
        default: '',
        secondary: '',
        outline: '',
        ghost: '',
        link: '',
        destructive: '',
      },
      size: {
        xs: '',
        sm: '',
        md: '',
        lg: '',
        xl: '',
        icon: '',
        'icon-xs': '',
        'icon-sm': '',
        'icon-lg': '',
        'icon-xl': '',
      },
      color: {
        primary: '',
        neutral: 'text-foreground',
        secondary: 'text-secondary',
        error: 'text-destructive',
      },
      activeVariant: {
        default: '',
        secondary: '',
        outline: '',
        ghost: '',
        link: '',
        destructive: '',
      },
      activeColor: {
        primary: '',
        neutral: 'data-[current]:(text-foreground)',
        secondary: 'data-[current]:(text-secondary)',
        error: 'data-[current]:(text-destructive)',
      },
    },
    defaultVariants: {
      variant: 'outline',
      size: 'icon-sm',
      color: 'neutral',
      activeVariant: 'default',
      activeColor: 'primary',
    },
  },
)

export type PaginationVariantProps = VariantProps<typeof paginationControlVariants>
