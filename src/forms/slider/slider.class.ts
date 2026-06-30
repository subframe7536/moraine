import type { VariantProps } from 'cls-variant'

import { CHECKABLE_BASE_SIZE_VARIANT } from '../../shared/cva-common.class'
import { cva } from '../../shared/utils'

export const sliderRootVariants = cva(
  'flex select-none relative touch-none data-disabled:effect-dis',
  {
    defaultVariants: {
      size: 'md',
      orientation: 'horizontal',
      variant: 'default',
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
      variant: {
        default: '',
        bold: '',
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
      variant: 'default',
    },
    variants: {
      size: {
        xs: '',
        sm: '',
        md: '',
        lg: '',
        xl: '',
      },
      variant: {
        default: '',
        bold: '',
      },
      orientation: {
        horizontal: 'h-$s-size w-full before:(inset-x-0.5 inset-y-0)',
        vertical: 'h-full w-$s-size before:(inset-x-0 inset-y-0.5)',
      },
    },
    compoundVariants: [
      { size: 'xs', variant: 'default', class: 'var-slider-3' },
      { size: 'sm', variant: 'default', class: 'var-slider-4' },
      { size: 'md', variant: 'default', class: 'var-slider-4' },
      { size: 'lg', variant: 'default', class: 'var-slider-5' },
      { size: 'xl', variant: 'default', class: 'var-slider-6' },
      { size: 'xs', variant: 'bold', class: 'var-slider-5' },
      { size: 'sm', variant: 'bold', class: 'var-slider-6' },
      { size: 'md', variant: 'bold', class: 'var-slider-7' },
      { size: 'lg', variant: 'bold', class: 'var-slider-8' },
      { size: 'xl', variant: 'bold', class: 'var-slider-9' },
    ],
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

export const sliderDividerVariants = cva('bg-background pointer-events-none absolute z-10', {
  defaultVariants: {
    orientation: 'horizontal',
    variant: 'default',
  },
  variants: {
    orientation: {
      horizontal: 'top-1/2 -translate-x-1/2 -translate-y-1/2',
      vertical: 'left-1/2 -translate-x-1/2 -translate-y-1/2',
    },
    variant: {
      default: 'rounded-full size-1',
      bold: '',
    },
  },
  compoundVariants: [
    {
      orientation: 'horizontal',
      variant: 'bold',
      class: 'h-full w-px',
    },
    {
      orientation: 'vertical',
      variant: 'bold',
      class: 'h-px w-full',
    },
  ],
})

export const sliderThumbVariants = cva(
  'outline-none surface-border rounded-full bg-background shrink-0 block cursor-pointer select-none shadow-xs/5 transition-[box-shadow,transform] absolute touch-none focus-visible:effect-fv hover:effect-fv dark:bg-foreground data-dragging:(scale-120 z-10) not-dark:bg-clip-padding',
  {
    defaultVariants: {
      orientation: 'horizontal',
      inverted: false,
      size: 'md',
    },
    variants: {
      orientation: {
        horizontal: '',
        vertical: '',
      },
      inverted: {
        true: '',
        false: '',
      },
      size: CHECKABLE_BASE_SIZE_VARIANT,
    },
    compoundVariants: [
      {
        orientation: 'horizontal',
        inverted: false,
        class: '-translate-x-1/2',
      },
      {
        orientation: 'horizontal',
        inverted: true,
        class: 'translate-x-1/2',
      },
      {
        orientation: 'vertical',
        inverted: false,
        class: '-translate-y-1/2',
      },
      {
        orientation: 'vertical',
        inverted: true,
        class: 'translate-y-1/2',
      },
    ],
  },
)

export type SliderVariantProps = VariantProps<typeof sliderRootVariants>
