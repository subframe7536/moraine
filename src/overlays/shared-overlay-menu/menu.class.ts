import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils'

export const overlayMenuItemVariants = cva(
  'text-sm px-1.5 py-1 outline-none rounded-md gap-1.5 grid grid-cols-[auto_1fr_auto] cursor-default select-none items-center relative data-highlighted:(text-accent-foreground bg-accent) data-disabled:effect-dis',
  {
    defaultVariants: {
      color: 'default',
      size: 'md',
    },
    variants: {
      color: {
        default: 'text-foreground',
        destructive: 'text-destructive data-highlighted:(text-destructive bg-destructive/10)',
      },
      size: {
        sm: 'text-xs min-h-7',
        md: 'text-sm min-h-8 sm:min-h-7',
        lg: 'text-sm min-h-9',
      },
    },
  },
)

export type OverlayMenuItemVariantProps = VariantProps<typeof overlayMenuItemVariants>

export const overlayMenuContentVariants = cva(
  'text-popover-foreground p-1 outline-none rounded-lg bg-popover flex flex-col min-w-32 surface-overlay shadow-lg origin-$kb-popper-content-transform-origin z-50 data-closed:(animate-out fade-out-0 zoom-out-90) data-expanded:(animate-in fade-in-0 zoom-in-90)',
  {
    defaultVariants: {
      side: 'right',
    },
    variants: {
      side: {
        top: 'mb-$kb-popper-content-overflow-padding data-expanded:slide-in-from-bottom-2 data-closed:slide-out-to-bottom-2',
        right:
          'ml-$kb-popper-content-overflow-padding data-expanded:slide-in-from-left-2 data-closed:slide-out-to-left-2',
        bottom:
          'mt-$kb-popper-content-overflow-padding data-expanded:slide-in-from-top-2 data-closed:slide-out-to-top-2',
        left: 'mr-$kb-popper-content-overflow-padding data-expanded:slide-in-from-right-2 data-closed:slide-out-to-right-2',
      },
    },
  },
)
