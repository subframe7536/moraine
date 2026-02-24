import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const popoverContentVariants = cva(
  'z-50 relative w-fit max-w-90 origin-$kb-popper-content-transform-origin bg-popover text-popover-foreground flex flex-col gap-2.5 rounded-lg p-2.5 text-sm shadow-md border border-foreground/10 outline-none data-expanded:(animate-in fade-in-0 zoom-in-95) data-closed:(animate-out fade-out-0 zoom-out-95) duration-100',
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
