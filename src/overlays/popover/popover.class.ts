import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils'

export const popoverContentVariants = cva(
  'text-sm text-popover-foreground p-2.5 outline-none surface-overlay rounded-lg bg-popover flex flex-col gap-2.5 max-w-90 w-fit origin-$mo-popper-content-transform-origin duration-150 relative z-50 data-closed:animate-popover-out data-expanded:animate-popover-in',
  {
    defaultVariants: {
      side: 'bottom',
    },
    variants: {
      side: {
        top: 'mb-$mo-popper-content-overflow-padding animate-popover-side-top',
        right: 'ml-$mo-popper-content-overflow-padding animate-popover-side-right',
        bottom: 'mt-$mo-popper-content-overflow-padding animate-popover-side-bottom',
        left: 'mr-$mo-popper-content-overflow-padding animate-popover-side-left',
      },
    },
  },
)

export type PopoverContentVariantProps = VariantProps<typeof popoverContentVariants>
