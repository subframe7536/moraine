import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils.ts'

export const sheetContentVariants = cva(
  'text-sm text-popover-foreground outline-none bg-popover flex flex-col gap-4 max-h-full min-h-0 min-w-0 shadow-lg transition duration-200 ease-in-out fixed z-50 bg-clip-padding data-closed:animate-sheet-out data-expanded:animate-sheet-in motion-reduce:animate-none',
  {
    defaultVariants: {
      side: 'right',
      inset: false,
    },
    variants: {
      side: {
        top: 'border-b border-border h-auto animate-sheet-side-top inset-x-0 top-0',
        right:
          'border-l border-border h-full w-3/4 animate-sheet-side-right inset-y-0 right-0 sm:max-w-sm',
        bottom: 'border-t border-border h-auto animate-sheet-side-bottom inset-x-0 bottom-0',
        left: 'border-r border-border h-full w-3/4 animate-sheet-side-left inset-y-0 left-0 sm:max-w-sm',
      },
      inset: {
        true: 'sm:(m-4 border border-border rounded-2xl)',
        false: 'rounded-none',
      },
    },
  },
)

export type SheetVariantProps = VariantProps<typeof sheetContentVariants>
