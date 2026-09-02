import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils'

export const tooltipContentVariants = cva(
  'text-xs px-1.5 py-0.5 outline-none rounded-md flex gap-1 max-w-xs w-fit origin-$mo-popper-content-transform-origin items-center z-floating data-closed:animate-tooltip-out data-expanded:animate-tooltip-in motion-reduce:animate-none',
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
      invert: false,
    },
  },
)

export type TooltipVariantProps = VariantProps<typeof tooltipContentVariants>
