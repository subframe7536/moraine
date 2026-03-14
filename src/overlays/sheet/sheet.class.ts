import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const sheetContentVariants = cva(
  'text-sm outline-none bg-background flex flex-col gap-4 max-h-full min-h-0 min-w-0 w-full shadow-lg transition duration-200 ease-in-out fixed z-50 bg-clip-padding data-closed:(animate-out fade-out-0) data-expanded:(animate-in fade-in-0)',
  {
    defaultVariants: {
      side: 'right',
      inset: false,
    },
    variants: {
      side: {
        top: 'border-b border-border h-auto inset-x-0 top-0 data-expanded:slide-in-from-top-10 data-closed:slide-out-to-top-10',
        right:
          'border-l border-border h-full w-3/4 inset-y-0 right-0 sm:max-w-sm data-expanded:slide-in-from-right-10 data-closed:slide-out-to-right-10',
        bottom:
          'border-t border-border h-auto inset-x-0 bottom-0 data-expanded:slide-in-from-bottom-10 data-closed:slide-out-to-bottom-10',
        left: 'border-r border-border h-full w-3/4 inset-y-0 left-0 sm:max-w-sm data-expanded:slide-in-from-left-10 data-closed:slide-out-to-left-10',
      },
      inset: {
        true: 'sm:(m-4 b-1 b-border rounded-2xl)',
        false: 'rounded-none',
      },
    },
  },
)

export type SheetVariantProps = VariantProps<typeof sheetContentVariants>
