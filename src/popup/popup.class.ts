import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const popupOverlayVariants = cva(
  'fixed inset-0 z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs data-expanded:(animate-in fade-in-0) data-closed:(animate-out fade-out-0) duration-150',
  {
    defaultVariants: {
      scrollable: false,
    },
    variants: {
      scrollable: {
        true: 'grid place-items-center overflow-y-auto p-4 sm:py-8',
        false: 'block',
      },
    },
  },
)

export const popupContentVariants = cva('z-50 w-full outline-none', {
  defaultVariants: {
    layout: 'default',
    transition: true,
  },
  variants: {
    layout: {
      default:
        'fixed left-1/2 top-1/2 grid max-w-[calc(100%-2rem)] max-h-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 sm:max-w-lg',
      scrollable: 'relative grid w-full max-w-[calc(100%-2rem)] sm:max-w-lg',
      fullscreen: 'fixed inset-0 flex h-full max-w-none flex-col',
    },
    transition: {
      true: 'data-expanded:(animate-in fade-in-0 zoom-in-95) data-closed:(animate-out fade-out-0 zoom-out-95) duration-150',
      false: 'transition-none data-expanded:transition-none data-closed:transition-none',
    },
  },
})

export type PopupOverlayVariantProps = VariantProps<typeof popupOverlayVariants>
export type PopupContentVariantProps = VariantProps<typeof popupContentVariants>
