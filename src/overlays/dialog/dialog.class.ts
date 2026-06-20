import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils'

export const dialogCardVariants = cva(
  'text-foreground surface-overlay bg-background max-h-full w-full overflow-hidden',
  {
    defaultVariants: {
      layout: 'default',
    },
    variants: {
      layout: {
        default: 'rounded-xl',
        scrollable: 'rounded-xl',
        fullscreen: 'border-0 rounded-none h-full ring-0',
      },
    },
  },
)

export type DialogCardVariantProps = VariantProps<typeof dialogCardVariants>
