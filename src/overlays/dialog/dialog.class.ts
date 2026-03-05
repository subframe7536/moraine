import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const dialogCardVariants = cva(
  'w-full max-h-full overflow-hidden border bg-background text-foreground shadow-none ring-1 ring-foreground/10',
  {
    defaultVariants: {
      layout: 'default',
    },
    variants: {
      layout: {
        default: 'rounded-xl',
        scrollable: 'rounded-xl',
        fullscreen: 'h-full rounded-none border-0 ring-0',
      },
    },
  },
)

export type DialogCardVariantProps = VariantProps<typeof dialogCardVariants>
