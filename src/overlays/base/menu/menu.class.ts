import type { VariantProps } from 'cls-variant'

import { cva } from '../../../shared/utils'

export const overlayMenuItemVariants = cva(
  'text-sm px-2 py-1.5 outline-none rounded-sm flex gap-2 w-full cursor-default select-none items-center relative data-disabled:(opacity-50 pointer-events-none)',
  {
    defaultVariants: {
      color: 'default',
      size: 'md',
    },
    variants: {
      color: {
        default: 'text-foreground data-highlighted:bg-muted',
        destructive: 'text-destructive data-highlighted:bg-destructive/15',
      },
      size: {
        sm: 'text-xs min-h-7',
        md: 'text-sm min-h-8',
        lg: 'min-h-9',
      },
    },
  },
)

export type OverlayMenuItemVariantProps = VariantProps<typeof overlayMenuItemVariants>

export const overlayMenuContentVariants = cva(
  'text-popover-foreground p-1 outline-none surface-overlay rounded-md bg-popover flex flex-col min-w-36 shadow-md origin-$mo-popper-content-transform-origin z-floating data-closed:animate-menu-out data-expanded:animate-menu-in motion-reduce:animate-none',
  {
    defaultVariants: {
      side: 'bottom',
    },
    variants: {
      side: {
        top: 'mb-$mo-popper-content-overflow-padding animate-menu-side-top',
        right: 'ml-$mo-popper-content-overflow-padding animate-menu-side-right',
        bottom: 'mt-$mo-popper-content-overflow-padding animate-menu-side-bottom',
        left: 'mr-$mo-popper-content-overflow-padding animate-menu-side-left',
      },
    },
  },
)
