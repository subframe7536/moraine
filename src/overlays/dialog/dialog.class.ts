import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils.ts'
import { MODAL_CONTENT_CLASS } from '../base/modal.class.ts'

export const dialogContentVariants = cva(MODAL_CONTENT_CLASS, {
  defaultVariants: {
    layout: 'default',
  },
  variants: {
    layout: {
      default:
        'grid max-h-[calc(100%-2rem)] max-w-[calc(100%-2rem)] left-1/2 top-1/2 fixed sm:max-w-md -translate-x-1/2 -translate-y-1/2',
      scrollable:
        'p-4 grid size-full pointer-events-none inset-0 place-items-center fixed overflow-y-auto sm:py-8',
      fullscreen: 'flex flex-col size-full max-w-none inset-0 fixed',
    },
  },
})

export const dialogCardVariants = cva(
  'text-popover-foreground surface-overlay bg-popover max-h-full w-full shadow-md overflow-hidden',
  {
    defaultVariants: {
      layout: 'default',
    },
    variants: {
      layout: {
        default: 'rounded-xl',
        scrollable: 'rounded-xl max-w-[calc(100%-2rem)] pointer-events-auto sm:max-w-md',
        fullscreen: 'border-0 rounded-none h-full ring-0',
      },
    },
  },
)

export type DialogCardVariantProps = VariantProps<typeof dialogCardVariants>
