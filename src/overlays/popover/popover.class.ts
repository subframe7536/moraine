import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils.ts'

export const popoverContentVariants = cva(
  'text-popover-foreground outline-none surface-overlay rounded-md bg-popover flex flex-col gap-4 max-w-90 w-72 origin-$mo-popper-content-transform-origin relative z-floating data-closed:animate-popover-out data-expanded:animate-popover-in motion-reduce:animate-none',
  {
    defaultVariants: {
      side: 'bottom',
    },
    variants: {
      side: {
        top: 'mb-$mo-popper-content-overflow-padding animate-popover-side-top',
        right: 'ml-$mo-popper-content-overflow-padding animate-popover-side-right',
        bottom: 'mt-$mo-popper-content-overflow-padding animate-popover-side-bottom',
        left: 'mr-$mo-popper-content-overflow-padding animate-popover-side-left',
      },
    },
  },
)

export type PopoverContentVariantProps = VariantProps<typeof popoverContentVariants>
