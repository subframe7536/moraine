import type { VariantProps } from 'cls-variant'

import { FLEX_ORIENTATION_VARIANT } from '../../shared/cva-common.class.ts'
import { cva } from '../../shared/utils.ts'

export const resizableRootVariants = cva('flex h-full min-h-0 min-w-0 w-full', {
  defaultVariants: {
    orientation: 'horizontal',
  },
  variants: {
    orientation: FLEX_ORIENTATION_VARIANT,
  },
})

export const resizableHandleVariants = cva(
  'bg-border flex shrink-0 items-center justify-center relative overflow-visible focus-visible:effect-fv aria-disabled:cursor-default data-cross:cursor-move after:(content-empty absolute)',
  {
    defaultVariants: {
      orientation: 'horizontal',
    },
    variants: {
      orientation: {
        horizontal: 'w-px cursor-ew-resize after:(w-1.5 inset-y-0 left-1/2 -translate-x-1/2)',
        vertical: 'h-px w-full cursor-ns-resize after:(h-1.5 inset-x-0 top-1/2 -translate-y-1/2)',
      },
    },
  },
)

export const resizableCrossTargetVariants = cva(
  'border-0 bg-transparent h-2 w-2 cursor-move pointer-events-auto absolute z-1',
  {
    defaultVariants: {
      orientation: 'horizontal',
      target: 'start',
    },
    variants: {
      orientation: {
        horizontal: 'left-1/2 -translate-x-1/2',
        vertical: 'top-1/2 -translate-y-1/2',
      },
      target: {
        start: '',
        end: '',
      },
    },
    compoundVariants: [
      {
        orientation: 'horizontal',
        target: 'start',
        class: 'top-0',
      },
      {
        orientation: 'horizontal',
        target: 'end',
        class: 'bottom-0',
      },
      {
        orientation: 'vertical',
        target: 'start',
        class: 'left-0',
      },
      {
        orientation: 'vertical',
        target: 'end',
        class: 'right-0',
      },
    ],
  },
)

export type ResizableVariantProps = VariantProps<typeof resizableRootVariants>
