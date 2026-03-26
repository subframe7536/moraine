import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils'

export const sheetContentVariants = cva(
  'text-sm outline-none bg-background flex flex-col gap-4 max-h-full min-h-0 min-w-0 w-full shadow-lg transition duration-200 ease-in-out fixed z-50 bg-clip-padding',
  {
    defaultVariants: {
      side: 'right',
      inset: false,
    },
    variants: {
      side: {
        top: 'border-b border-border h-auto inset-x-0 top-0 data-closed:animate-sheet-out-to-top data-expanded:animate-sheet-in-from-top',
        right:
          'border-l border-border h-full w-3/4 inset-y-0 right-0 sm:max-w-sm data-closed:animate-sheet-out-to-right data-expanded:animate-sheet-in-from-right',
        bottom:
          'border-t border-border h-auto inset-x-0 bottom-0 data-closed:animate-sheet-out-to-bottom data-expanded:animate-sheet-in-from-bottom',
        left: 'border-r border-border h-full w-3/4 inset-y-0 left-0 sm:max-w-sm data-closed:animate-sheet-out-to-left data-expanded:animate-sheet-in-from-left',
      },
      inset: {
        true: 'sm:(m-4 b-1 b-border rounded-2xl)',
        false: 'rounded-none',
      },
    },
  },
)

export type SheetVariantProps = VariantProps<typeof sheetContentVariants>
