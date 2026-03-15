import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils'

export const tooltipContentVariants = cva(
  'text-xs px-2 py-1 outline-none rounded-md flex max-w-xs w-fit origin-$kb-tooltip-content-transform-origin items-baseline z-50 data-[state=delayed-open]:(animate-in fade-in-0 zoom-in-95) data-closed:(animate-out fade-out-0 zoom-out-95) data-expanded:(animate-in fade-in-0 zoom-in-95)',
  {
    variants: {
      side: {
        left: 'mr-$kb-popper-content-overflow-padding data-expanded:slide-in-from-right-1',
        right: 'ml-$kb-popper-content-overflow-padding data-expanded:slide-in-from-left-1',
        top: 'mb-$kb-popper-content-overflow-padding data-expanded:slide-in-from-bottom-1',
        bottom: 'mt-$kb-popper-content-overflow-padding data-expanded:slide-in-from-top-1',
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
