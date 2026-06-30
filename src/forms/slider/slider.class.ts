import type { VariantProps } from 'cls-variant'

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
      { size: 'xs', variant: 'bold', class: 'var-slider-5 before:rounded-md' },
      { size: 'sm', variant: 'bold', class: 'var-slider-6 before:rounded-md' },
      { size: 'md', variant: 'bold', class: 'var-slider-7 before:rounded-md' },
      { size: 'lg', variant: 'bold', class: 'var-slider-8 before:rounded-md' },
      { size: 'xl', variant: 'bold', class: 'var-slider-9 before:rounded-md' },
    ],
  },
)

export const sliderRangeVariants = cva('bg-primary select-none absolute', {
  defaultVariants: {
    orientation: 'horizontal',
    variant: 'default',
  },
  variants: {
    orientation: {
      horizontal: 'ms-0.5 h-full',
      vertical: 'mb-0.5 w-full',
    },
    variant: {
      default: 'rounded-full',
      bold: 'rounded-md',
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
  'outline-none rounded-full shrink-0 block cursor-pointer select-none transition-[box-shadow,transform] absolute touch-none focus-visible:effect-fv not-dark:bg-clip-padding',
  {
    defaultVariants: {
      orientation: 'horizontal',
      inverted: false,
      size: 'md',
      variant: 'default',
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
      size: {
        xs: '',
        sm: '',
        md: '',
        lg: '',
        xl: '',
      },
      variant: {
        default:
          'surface-border bg-background shadow-xs/5 dark:bg-foreground data-dragging:(scale-120 z-10)',
        bold: 'border border-primary-foreground bg-primary-foreground shadow-xs/10 data-dragging:z-10',
      },
    },
    compoundVariants: [
      { size: 'xs', variant: 'default', class: 'size-3' },
      { size: 'sm', variant: 'default', class: 'size-3.5' },
      { size: 'md', variant: 'default', class: 'size-4' },
      { size: 'lg', variant: 'default', class: 'size-4.5' },
      { size: 'xl', variant: 'default', class: 'size-5' },
      { size: 'xs', variant: 'bold', class: 'h-3 w-1' },
      { size: 'sm', variant: 'bold', class: 'h-3.5 w-1' },
      { size: 'md', variant: 'bold', class: 'h-4 w-1.5' },
      { size: 'lg', variant: 'bold', class: 'h-4.5 w-1.5' },
      { size: 'xl', variant: 'bold', class: 'h-5 w-2' },
      {
        orientation: 'horizontal',
        inverted: false,
        variant: 'default',
        class: '-translate-x-1/2',
      },
      {
        orientation: 'horizontal',
        inverted: true,
        variant: 'default',
        class: 'translate-x-1/2',
      },
      {
        orientation: 'vertical',
        inverted: false,
        variant: 'default',
        class: '-translate-y-1/2',
      },
      {
        orientation: 'vertical',
        inverted: true,
        variant: 'default',
        class: 'translate-y-1/2',
      },
      {
        orientation: 'horizontal',
        inverted: false,
        variant: 'bold',
        class: 'top-1/2 -translate-x-1/2 -translate-y-1/2',
      },
      {
        orientation: 'horizontal',
        inverted: true,
        variant: 'bold',
        class: 'top-1/2 translate-x-1/2 -translate-y-1/2',
      },
      {
        orientation: 'vertical',
        inverted: false,
        variant: 'bold',
        class: 'left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90',
      },
      {
        orientation: 'vertical',
        inverted: true,
        variant: 'bold',
        class: 'left-1/2 -translate-x-1/2 translate-y-1/2 rotate-90',
      },
    ],
  },
)

export type SliderVariantProps = VariantProps<typeof sliderRootVariants>
