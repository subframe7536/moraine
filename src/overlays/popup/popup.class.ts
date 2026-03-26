import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils'

export const popupOverlayVariants = cva(
  'supports-backdrop-filter:backdrop-blur-xs bg-black/10 duration-150 inset-0 fixed z-50 data-closed:animate-overlay-out data-expanded:animate-overlay-in',
  {
    defaultVariants: {
      scrollable: false,
    },
    variants: {
      scrollable: {
        true: 'p-4 grid place-items-center overflow-y-auto sm:py-8',
        false: 'block',
      },
    },
  },
)

export const popupContentVariants = cva('outline-none w-full z-50', {
  defaultVariants: {
    layout: 'default',
    transition: true,
  },
  variants: {
    layout: {
      default:
        'grid max-h-[calc(100%-2rem)] max-w-[calc(100%-2rem)] left-1/2 top-1/2 fixed sm:max-w-lg -translate-x-1/2 -translate-y-1/2',
      scrollable: 'grid max-w-[calc(100%-2rem)] w-full relative sm:max-w-lg',
      fullscreen: 'flex flex-col h-full max-w-none inset-0 fixed',
    },
    transition: {
      true: 'duration-150 data-closed:animate-surface-out data-expanded:animate-surface-in',
      false: 'transition-none data-closed:transition-none data-expanded:transition-none',
    },
  },
})

export type PopupOverlayVariantProps = VariantProps<typeof popupOverlayVariants>
export type PopupContentVariantProps = VariantProps<typeof popupContentVariants>
