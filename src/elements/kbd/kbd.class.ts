import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils'

export const kbdItemVariants = cva(
  'leading-none font-medium font-mono rounded inline-flex select-none uppercase items-center justify-center',
  {
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
    variants: {
      size: {
        xs: 'text-2 px-1 h-3',
        sm: 'text-2.5 px-1 h-4',
        md: 'text-3 px-1.5 h-4.5',
        lg: 'text-xs px-1.5 h-5',
        xl: 'text-sm px-2 h-5.5',
      },
      variant: {
        default: 'text-foreground bg-muted/70 surface-outline-inset',
        outline: 'text-muted-foreground b-b-(2 border) surface-outline',
        invert: 'text-muted bg-muted-foreground',
      },
    },
  },
)

export type KbdVariantProps = VariantProps<typeof kbdItemVariants>
