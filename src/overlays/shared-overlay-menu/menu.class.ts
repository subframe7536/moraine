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
  'text-popover-foreground p-1 outline-none rounded-lg bg-popover flex flex-col min-w-32 surface-overlay shadow-lg origin-$kb-popper-content-transform-origin z-50',
  {
    defaultVariants: {
      side: 'right',
    },
    variants: {
      side: {
        top: 'mb-$kb-popper-content-overflow-padding data-closed:animate-menu-out-to-bottom data-expanded:animate-menu-in-from-bottom',
        right:
          'ml-$kb-popper-content-overflow-padding data-closed:animate-menu-out-to-left data-expanded:animate-menu-in-from-left',
        bottom:
          'mt-$kb-popper-content-overflow-padding data-closed:animate-menu-out-to-top data-expanded:animate-menu-in-from-top',
        left: 'mr-$kb-popper-content-overflow-padding data-closed:animate-menu-out-to-right data-expanded:animate-menu-in-from-right',
      },
    },
  },
)
