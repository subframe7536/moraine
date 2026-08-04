import type { VariantProps } from 'cls-variant'

import { cva } from '../../../shared/utils.ts'

export const overlayMenuItemVariants = cva(
  'text-sm px-1.5 py-1 outline-none rounded-md gap-1.5 grid grid-cols-[auto_1fr_auto] cursor-default select-none items-center relative data-highlighted:(text-accent-foreground bg-accent-hover) data-selected:(text-accent-foreground bg-accent-active) data-disabled:effect-dis',
  {
    defaultVariants: {
      color: 'default',
      size: 'md',
    },
    variants: {
      color: {
        default: 'text-foreground',
        destructive:
          'text-destructive data-highlighted:(text-destructive-foreground bg-destructive-hover) data-selected:(text-destructive-foreground bg-destructive-active)',
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
  'text-popover-foreground p-1 outline-none surface-overlay rounded-lg bg-popover flex flex-col min-w-32 shadow-lg origin-$mo-popper-content-transform-origin z-50 data-closed:animate-menu-out data-expanded:animate-menu-in',
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
    },
  },
)
