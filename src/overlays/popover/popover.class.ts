import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils'

export const popoverContentVariants = cva(
  'text-sm text-popover-foreground p-2.5 outline-none b-(1 foreground/20) rounded-lg bg-popover flex flex-col gap-2.5 max-w-90 w-fit shadow-md origin-$kb-popper-content-transform-origin duration-150 relative z-50 data-closed:(animate-out fade-out-0 zoom-out-95) data-expanded:(animate-in fade-in-0 zoom-in-95)',
  {
    defaultVariants: {
      side: 'bottom',
    },
    variants: {
      side: {
        top: 'mb-$kb-popper-content-overflow-padding data-expanded:slide-in-from-bottom-2',
        right: 'ml-$kb-popper-content-overflow-padding data-expanded:slide-in-from-left-2',
        bottom: 'mt-$kb-popper-content-overflow-padding data-expanded:slide-in-from-top-2',
        left: 'mr-$kb-popper-content-overflow-padding data-expanded:slide-in-from-right-2',
      },
    },
  },
)

export type PopoverContentVariantProps = VariantProps<typeof popoverContentVariants>
