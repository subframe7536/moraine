import type { VariantProps } from 'cls-variant'

import { cva } from '../../../shared/utils.ts'

export const overlayMenuItemVariants = cva(
  'text-sm text-foreground px-2 py-1.5 outline-none rounded-sm flex gap-2 w-full cursor-default select-none items-center relative data-highlighted:bg-muted data-disabled:(opacity-50 pointer-events-none)',
  {
    defaultVariants: {
      color: 'default',
      size: 'md',
    },
    variants: {
      color: {
        default: 'text-foreground',
        destructive: 'text-destructive data-highlighted:(text-destructive bg-muted)',
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
  'text-popover-foreground p-1 outline-none surface-overlay rounded-md bg-popover flex flex-col min-w-36 shadow-md origin-$mo-popper-content-transform-origin duration-100 z-50 data-closed:animate-menu-out data-expanded:animate-menu-in motion-reduce:animate-none',
  {
    defaultVariants: {
      side: 'right',
    },
    variants: {
      side: {
        top: 'mb-$mo-popper-content-overflow-padding animate-menu-side-top',
        right: 'ml-$mo-popper-content-overflow-padding animate-menu-side-right',
        bottom: 'mt-$mo-popper-content-overflow-padding animate-menu-side-bottom',
        left: 'mr-$mo-popper-content-overflow-padding animate-menu-side-left',
      },
      origin: {
        'top-left': 'animate-menu-origin-top-left',
        'top-center': 'animate-menu-origin-top-center',
        'top-right': 'animate-menu-origin-top-right',
        'center-left': 'animate-menu-origin-center-left',
        center: 'animate-menu-origin-center',
        'center-right': 'animate-menu-origin-center-right',
        'bottom-left': 'animate-menu-origin-bottom-left',
        'bottom-center': 'animate-menu-origin-bottom-center',
        'bottom-right': 'animate-menu-origin-bottom-right',
      },
    },
  },
)
