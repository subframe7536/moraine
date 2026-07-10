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
        default: 'text-foreground bg-muted/80 ring ring-border ring-inset',
        outline: 'text-muted-foreground border border-b-2 border-border',
        invert: 'text-muted bg-muted-foreground',
      },
    },
  },
)

export const kbdGroupVariants = cva('inline-flex items-center', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'text-2 gap-1',
      sm: 'text-2.5 gap-1',
      md: 'text-3 gap-1',
      lg: 'text-xs gap-1.5',
      xl: 'text-sm gap-1.5',
    },
  },
})

export type KbdVariantProps = VariantProps<typeof kbdItemVariants>
export type KbdGroupVariantProps = VariantProps<typeof kbdItemVariants> &
  VariantProps<typeof kbdGroupVariants>
