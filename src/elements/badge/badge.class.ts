import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils.ts'

export const badgeVariants = cva(
  'leading-normal font-medium border inline-flex shrink-0 gap-1.5 max-w-full select-none whitespace-nowrap items-center',
  {
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
    variants: {
      variant: {
        default: 'text-accent-foreground border-transparent bg-accent',
        outline: 'text-foreground border-border bg-background',
        solid: 'text-primary-foreground border-transparent bg-primary shadow-xs',
      },
      size: {
        sm: 'text-xs px-1 rounded-xs h-5.5',
        md: 'text-sm px-1.5 rounded-sm h-6',
        lg: 'text-sm px-2 rounded-md h-6.5',
      },
    },
  },
)

export type BadgeVariantProps = VariantProps<typeof badgeVariants>
