import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils'

export const badgeVariants = cva(
  'leading-normal font-500 inline-flex shrink-0 max-w-full select-none whitespace-nowrap items-center',
  {
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
    variants: {
      variant: {
        default: 'text-accent-foreground bg-accent/50',
        outline: 'text-foreground bg-background surface-outline-inset',
        solid: 'text-primary-foreground bg-primary shadow-xs',
      },
      size: {
        xs: 'text-2.4 px-1 rounded-xs h-3.5',
        sm: 'text-2.8 px-1.2 rounded-sm h-4',
        md: 'text-3.2 px-1.4 rounded-md h-4.5',
        lg: 'text-3.6 px-1.6 rounded-md h-5',
        xl: 'text-4 px-1.8 rounded-lg h-5.5',
      },
    },
  },
)

export type BadgeVariantProps = VariantProps<typeof badgeVariants>
