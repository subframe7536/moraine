import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils'

export const popoverContentVariants = cva(
  'text-sm text-popover-foreground p-2.5 outline-none b-(1 foreground/20) rounded-lg bg-popover flex flex-col gap-2.5 max-w-90 w-fit shadow-md origin-$kb-popper-content-transform-origin duration-150 relative z-50 data-closed:animate-surface-out',
  {
    defaultVariants: {
      side: 'bottom',
    },
    variants: {
      side: {
        top: 'mb-$kb-popper-content-overflow-padding data-expanded:animate-popover-in-from-bottom',
        right: 'ml-$kb-popper-content-overflow-padding data-expanded:animate-popover-in-from-left',
        bottom: 'mt-$kb-popper-content-overflow-padding data-expanded:animate-popover-in-from-top',
        left: 'mr-$kb-popper-content-overflow-padding data-expanded:animate-popover-in-from-right',
      },
    },
  },
)

export type PopoverContentVariantProps = VariantProps<typeof popoverContentVariants>
