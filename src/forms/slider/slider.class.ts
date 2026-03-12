import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const sliderRootVariants = cva(
  'relative flex touch-none select-none data-highlight:(rounded-md surface-highlight) data-disabled:effect-dis',
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
        vertical: 'h-full min-h-44 flex-col items-center',
      },
    },
  },
)

export const sliderTrackVariants = cva(
  'relative grow select-none before:(absolute rounded-full bg-input content-empty) data-highlight:surface-highlight',
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
        horizontal: 'w-full h-$s-size before:(inset-x-0.5 inset-y-0)',
        vertical: 'h-full w-$s-size before:(inset-x-0 inset-y-0.5)',
      },
    },
  },
)

export const sliderRangeVariants = cva(
  'absolute select-none rounded-full bg-primary data-highlight:(ring-1 ring-inset ring-background/40)',
  {
    defaultVariants: {
      orientation: 'horizontal',
    },
    variants: {
      orientation: {
        horizontal: 'h-full ms-0.5',
        vertical: 'w-full mb-0.5',
      },
    },
  },
)

export const sliderThumbVariants = cva(
  'relative block shrink-0 cursor-pointer select-none rounded-full surface-outline bg-white not-dark:bg-clip-padding shadow-xs/5 outline-none transition-[box-shadow,transform] data-dragging:scale-120 hover:effect-fv focus-visible:effect-fv data-highlight:surface-highlight',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: 'size-3',
        sm: 'size-3.5',
        md: 'size-4',
        lg: 'size-4.5',
        xl: 'size-5',
      },
    },
  },
)

export type SliderVariantProps = VariantProps<typeof sliderRootVariants> &
  VariantProps<typeof sliderTrackVariants> &
  VariantProps<typeof sliderRangeVariants> &
  VariantProps<typeof sliderThumbVariants> & {
    highlight?: boolean
  }
