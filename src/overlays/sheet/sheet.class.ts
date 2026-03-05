import { cva } from 'cls-variant/cva'

export const sheetContentVariants = cva(
  'fixed z-50 flex w-full max-h-full min-h-0 min-w-0 flex-col gap-4 bg-background bg-clip-padding text-sm shadow-lg outline-none data-expanded:(animate-in fade-in-0) data-closed:(animate-out fade-out-0) transition duration-200 ease-in-out',
  {
    defaultVariants: {
      side: 'right',
      inset: false,
    },
    variants: {
      side: {
        top: 'inset-x-0 top-0 h-auto border-b border-border data-closed:slide-out-to-top-10 data-expanded:slide-in-from-top-10',
        right:
          'inset-y-0 right-0 h-full w-3/4 border-l border-border sm:max-w-sm data-closed:slide-out-to-right-10 data-expanded:slide-in-from-right-10',
        bottom:
          'inset-x-0 bottom-0 h-auto border-t border-border data-closed:slide-out-to-bottom-10 data-expanded:slide-in-from-bottom-10',
        left: 'inset-y-0 left-0 h-full w-3/4 border-r border-border sm:max-w-sm data-closed:slide-out-to-left-10 data-expanded:slide-in-from-left-10',
      },
      inset: {
        true: 'sm:(m-4 rounded-2xl border) sm:border-border',
        false: 'rounded-none',
      },
    },
  },
)
