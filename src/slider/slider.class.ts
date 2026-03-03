import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

import { SURFACE_HIGHLIGHT_VARIANT } from '../shared/cva-common.class'

export const sliderRootVariants = cva('relative flex touch-none select-none', {
  defaultVariants: {
    size: 'md',
    orientation: 'horizontal',
    disabled: false,
    highlight: false,
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
    highlight: {
      true: 'rounded-md surface-highlight',
    },
    disabled: {
      true: 'effect-dis',
    },
  },
})

export const sliderTrackVariants = cva(
  'relative grow select-none before:(absolute rounded-full bg-input content-empty)',
  {
    defaultVariants: {
      size: 'md',
      orientation: 'horizontal',
      highlight: false,
    },
    variants: {
      size: {
        xs: '[--slider-track-size:3px]',
        sm: '[--slider-track-size:4px]',
        md: '[--slider-track-size:4px]',
        lg: '[--slider-track-size:5px]',
        xl: '[--slider-track-size:6px]',
      },
      orientation: {
        horizontal: 'w-full h-$slider-track-size before:(inset-x-0.5 inset-y-0)',
        vertical: 'h-full w-$slider-track-size before:(inset-x-0 inset-y-0.5)',
      },
      highlight: SURFACE_HIGHLIGHT_VARIANT,
    },
  },
)

export const sliderRangeVariants = cva('absolute select-none rounded-full bg-primary', {
  defaultVariants: {
    orientation: 'horizontal',
    highlight: false,
  },
  variants: {
    orientation: {
      horizontal: 'h-full ms-0.5',
      vertical: 'w-full mb-0.5',
    },
    highlight: {
      true: 'ring-1 ring-inset ring-background/40',
    },
  },
})

export const sliderThumbVariants = cva(
  'relative block shrink-0 select-none rounded-full border border-ring bg-white not-dark:bg-clip-padding shadow-xs/5 outline-none transition-[box-shadow,transform] ring-ring/50 data-dragging:(scale-120 shadow-none) data-dragging:ring-3 hover:ring-3 focus-visible:ring-3 dark:border-background',
  {
    defaultVariants: {
      size: 'md',
      highlight: false,
    },
    variants: {
      size: {
        xs: 'size-3',
        sm: 'size-3.5',
        md: 'size-4',
        lg: 'size-4.5',
        xl: 'size-5',
      },
      highlight: SURFACE_HIGHLIGHT_VARIANT,
    },
  },
)

export type SliderVariantProps = VariantProps<typeof sliderRootVariants> &
  VariantProps<typeof sliderTrackVariants> &
  VariantProps<typeof sliderRangeVariants> &
  VariantProps<typeof sliderThumbVariants>
