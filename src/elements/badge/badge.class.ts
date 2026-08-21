import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils.ts'

export const badgeVariants = cva(
  'leading-normal font-medium border border-transparent inline-flex shrink-0 max-w-full select-none whitespace-nowrap items-center',
  {
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
    variants: {
      variant: {
        default: 'text-secondary-foreground bg-secondary',
        outline: 'text-foreground border-border bg-background',
        solid: 'text-primary-foreground bg-primary shadow-xs',
      },
      size: {
        sm: 'text-xs px-2 rounded-md h-4.5',
        md: 'text-xs px-2 rounded-md h-5',
        lg: 'text-xs px-2 rounded-md h-5.5',
      },
    },
  },
)

export type BadgeVariantProps = VariantProps<typeof badgeVariants>
