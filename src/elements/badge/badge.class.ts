import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils'

export const badgeVariants = cva(
  'leading-normal font-medium border inline-flex shrink-0 max-w-full select-none whitespace-nowrap items-center',
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
        sm: 'text-[10px] px-1 rounded-xs gap-0.5 h-4',
        md: 'text-xs px-1.5 rounded-sm gap-1 h-5',
        lg: 'text-sm px-2 rounded-md gap-1.5 h-6',
      },
    },
  },
)

export type BadgeVariantProps = VariantProps<typeof badgeVariants>
