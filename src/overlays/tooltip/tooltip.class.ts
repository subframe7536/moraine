import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils'

export const tooltipContentVariants = cva(
  'text-xs px-2 py-1 outline-none rounded-md flex max-w-xs w-fit origin-$mo-popper-content-transform-origin items-baseline z-50 data-closed:animate-tooltip-out data-expanded:animate-tooltip-in',
  {
    variants: {
      side: {
        left: 'mr-$mo-popper-content-overflow-padding animate-tooltip-side-left',
        right: 'ml-$mo-popper-content-overflow-padding animate-tooltip-side-right',
        top: 'mb-$mo-popper-content-overflow-padding animate-tooltip-side-top',
        bottom: 'mt-$mo-popper-content-overflow-padding animate-tooltip-side-bottom',
      },
      invert: {
        true: 'text-background bg-foreground',
        false: 'text-foreground surface-overlay bg-background shadow-sm',
      },
    },
    defaultVariants: {
      side: 'top',
    },
  },
)

export type TooltipVariantProps = VariantProps<typeof tooltipContentVariants>
