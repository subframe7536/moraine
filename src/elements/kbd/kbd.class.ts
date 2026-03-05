import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const kbdItemVariants = cva(
  'inline-flex items-center justify-center rounded font-mono font-medium leading-none uppercase select-none',
  {
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
    variants: {
      size: {
        xs: 'h-3 px-1 text-2',
        sm: 'h-4 px-1 text-2.5',
        md: 'h-4.5 px-1.5 text-3',
        lg: 'h-5 px-1.5 text-xs',
        xl: 'h-5.5 px-2 text-sm',
      },
      variant: {
        default: 'bg-muted/70 ring ring-inset ring-border text-foreground',
        outline: 'ring ring-border b-b-(2 border) text-muted-foreground',
        invert: 'bg-muted-foreground text-muted',
      },
    },
  },
)

export type KbdVariantProps = VariantProps<typeof kbdItemVariants>
