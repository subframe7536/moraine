import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils.ts'

export const DIALOG_OVERLAY_CLASS =
  'bg-black/10 duration-150 inset-0 fixed z-50 backdrop-blur-xs data-closed:animate-overlay-out data-expanded:animate-overlay-in'

export const dialogContentVariants = cva(
  'outline-none w-full z-50 data-closed:animate-popup-out data-expanded:animate-popup-in',
  {
    defaultVariants: {
      layout: 'default',
    },
    variants: {
      layout: {
        default:
          'grid max-h-[calc(100%-2rem)] max-w-[calc(100%-2rem)] left-1/2 top-1/2 fixed sm:max-w-lg -translate-x-1/2 -translate-y-1/2',
        scrollable:
          'p-4 grid size-full pointer-events-none inset-0 place-items-center fixed overflow-y-auto sm:py-8',
        fullscreen: 'flex flex-col size-full max-w-none inset-0 fixed',
      },
    },
  },
)

export const dialogCardVariants = cva(
  'text-foreground surface-overlay bg-background max-h-full w-full overflow-hidden',
  {
    defaultVariants: {
      layout: 'default',
    },
    variants: {
      layout: {
        default: 'rounded-xl',
        scrollable: 'rounded-xl max-w-[calc(100%-2rem)] pointer-events-auto sm:max-w-lg',
        fullscreen: 'border-0 rounded-none h-full ring-0',
      },
    },
  },
)

export type DialogCardVariantProps = VariantProps<typeof dialogCardVariants>
