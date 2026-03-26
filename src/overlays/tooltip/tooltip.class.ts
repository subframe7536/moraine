import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils'

export const tooltipContentVariants = cva(
  'text-xs px-2 py-1 outline-none rounded-md flex max-w-xs w-fit origin-$kb-tooltip-content-transform-origin items-baseline z-50',
  {
    variants: {
      side: {
        left: 'mr-$kb-popper-content-overflow-padding data-closed:animate-tooltip-out-to-right data-expanded:animate-tooltip-in-from-right',
        right:
          'ml-$kb-popper-content-overflow-padding data-closed:animate-tooltip-out-to-left data-expanded:animate-tooltip-in-from-left',
        top: 'mb-$kb-popper-content-overflow-padding data-closed:animate-tooltip-out-to-bottom data-expanded:animate-tooltip-in-from-bottom',
        bottom:
          'mt-$kb-popper-content-overflow-padding data-closed:animate-tooltip-out-to-top data-expanded:animate-tooltip-in-from-top',
      },
      invert: {
        true: 'text-background bg-foreground',
        false: 'text-foreground bg-background surface-outline shadow-sm',
      },
    },
    defaultVariants: {
      side: 'top',
    },
  },
)

export type TooltipVariantProps = VariantProps<typeof tooltipContentVariants>
