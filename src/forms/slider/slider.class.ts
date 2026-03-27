import type { VariantProps } from 'cls-variant'

import { CHECKABLE_BASE_SIZE_VARIANT } from '../../shared/cva-common.class'
import { cva } from '../../shared/utils'

export const sliderRootVariants = cva(
  'flex select-none relative touch-none data-disabled:effect-dis',
  {
    defaultVariants: {
      size: 'md',
      orientation: 'horizontal',
    },
    variants: {
      size: {
        xs: 'gap-2',
        sm: 'gap-2',
        md: 'gap-2.5',
        lg: 'gap-3',
        xl: 'gap-3.5',
      },
      orientation: {
        horizontal: 'w-full items-center',
        vertical: 'flex-col h-full min-h-44 items-center',
      },
    },
  },
)

export const sliderTrackVariants = cva(
  'grow select-none relative before:(rounded-full bg-input content-empty absolute)',
  {
    defaultVariants: {
      size: 'md',
      orientation: 'horizontal',
    },
    variants: {
      size: {
        xs: 'var-slider-3',
        sm: 'var-slider-4',
        md: 'var-slider-4',
        lg: 'var-slider-5',
        xl: 'var-slider-6',
      },
      orientation: {
        horizontal: 'h-$s-size w-full before:(inset-x-0.5 inset-y-0)',
        vertical: 'h-full w-$s-size before:(inset-x-0 inset-y-0.5)',
      },
    },
  },
)

export const sliderRangeVariants = cva('rounded-full bg-primary select-none absolute', {
  defaultVariants: {
    orientation: 'horizontal',
  },
  variants: {
    orientation: {
      horizontal: 'ms-0.5 h-full',
      vertical: 'mb-0.5 w-full',
    },
  },
})

export const sliderThumbVariants = cva(
  'outline-none rounded-full bg-white shrink-0 block cursor-pointer select-none surface-outline shadow-xs/5 transition-[box-shadow,transform] relative focus-visible:effect-fv hover:effect-fv data-dragging:scale-120 not-dark:bg-clip-padding',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: CHECKABLE_BASE_SIZE_VARIANT,
    },
  },
)

export type SliderVariantProps = VariantProps<typeof sliderRootVariants>
