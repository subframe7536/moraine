import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const overlayMenuItemVariants = cva(
  'relative grid cursor-default select-none grid-cols-[auto_1fr_auto] items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-none data-disabled:effect-dis data-highlighted:(bg-accent text-accent-foreground)',
  {
    defaultVariants: {
      color: 'default',
      size: 'md',
    },
    variants: {
      color: {
        default: 'text-foreground',
        destructive: 'text-destructive data-highlighted:(bg-destructive/10 text-destructive)',
      },
      size: {
        sm: 'min-h-7 text-xs',
        md: 'min-h-8 text-sm sm:min-h-7',
        lg: 'min-h-9 text-sm',
      },
    },
  },
)

export type OverlayMenuItemVariantProps = VariantProps<typeof overlayMenuItemVariants>

export const overlayMenuContentVariants = cva(
  'z-50 origin-$kb-popper-content-transform-origin bg-popover text-popover-foreground outline-none data-expanded:(animate-in fade-in-0 zoom-in-95) data-closed:(animate-out fade-out-0 zoom-out-95) duration-150',
  {
    defaultVariants: {
      side: 'right',
      sub: false,
    },
    variants: {
      side: {
        top: 'mb-$kb-popper-content-overflow-padding data-expanded:slide-in-from-b-2',
        right: 'ml-$kb-popper-content-overflow-padding data-expanded:slide-in-from-l-2',
        bottom: 'mt-$kb-popper-content-overflow-padding data-expanded:slide-in-from-t-2',
        left: 'mr-$kb-popper-content-overflow-padding data-expanded:slide-in-from-r-2',
      },
      sub: {
        true: 'min-w-32 rounded-lg border p-1 shadow-lg',
        false: 'flex flex-col min-w-36 rounded-lg p-1 shadow-md ring-1 ring-foreground/10',
      },
    },
  },
)
