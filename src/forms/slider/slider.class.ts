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
  'grow select-none relative before:(bg-input content-empty absolute)',
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
        horizontal: 'h-$s-size w-full',
        vertical: 'h-full w-$s-size',
      },
    },
    compoundVariants: [
      {
        orientation: 'horizontal',
        variant: 'default',
        class: 'before:(inset-x-0.5 inset-y-0 rounded-full)',
      },
      {
        orientation: 'vertical',
        variant: 'default',
        class: 'before:(inset-x-0 inset-y-0.5 rounded-full)',
      },
      {
        orientation: 'horizontal',
        variant: 'bold',
        class: 'before:(inset-0 rounded)',
      },
      {
        orientation: 'vertical',
        variant: 'bold',
        class: 'before:(inset-0 rounded)',
      },
      { size: 'xs', variant: 'default', class: 'var-slider-3' },
      { size: 'sm', variant: 'default', class: 'var-slider-4' },
      { size: 'md', variant: 'default', class: 'var-slider-4' },
      { size: 'lg', variant: 'default', class: 'var-slider-5' },
      { size: 'xl', variant: 'default', class: 'var-slider-6' },
      { size: 'xs', variant: 'bold', class: 'var-slider-12' },
      { size: 'sm', variant: 'bold', class: 'var-slider-14' },
      { size: 'md', variant: 'bold', class: 'var-slider-16' },
      { size: 'lg', variant: 'bold', class: 'var-slider-18' },
      { size: 'xl', variant: 'bold', class: 'var-slider-20' },
    ],
  },
)

export const sliderRangeVariants = cva('bg-primary select-none absolute z-10', {
  defaultVariants: {
    orientation: 'horizontal',
    variant: 'default',
  },
  variants: {
    orientation: {
      horizontal: 'h-full',
      vertical: 'w-full',
    },
    variant: {
      default: 'rounded-full',
      bold: '',
    },
  },
  compoundVariants: [
    {
      orientation: 'horizontal',
      variant: 'default',
      class: 'ms-0.5',
    },
    {
      orientation: 'vertical',
      variant: 'default',
      class: 'mb-0.5',
    },
    {
      orientation: 'horizontal',
      variant: 'bold',
      class: 'rounded-l',
    },
    {
      orientation: 'vertical',
      variant: 'bold',
      class: 'rounded-b',
    },
  ],
})

export const sliderDividerVariants = cva('bg-background pointer-events-none absolute z-0', {
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
      default: '',
      bold: '',
    },
  },
  compoundVariants: [
    {
      orientation: 'horizontal',
      class: 'h-1/2 w-px',
    },
    {
      orientation: 'vertical',
      class: 'h-px w-1/2',
    },
  ],
})

export const sliderThumbVariants = cva(
  'rounded-full shrink-0 block select-none transition-[box-shadow,transform] absolute z-20 touch-none not-dark:bg-clip-padding',
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
          'outline-none surface-border bg-background cursor-pointer shadow-xs/5 focus-visible:effect-fv dark:bg-foreground data-dragging:(scale-120 z-10)',
        bold: 'outline-(3 primary solid) rounded-sm bg-primary-foreground focus-visible:outline-primary-foreground data-dragging:z-10',
      },
    },
    compoundVariants: [
      { size: 'xs', variant: 'default', class: 'size-3' },
      { size: 'sm', variant: 'default', class: 'size-3.5' },
      { size: 'md', variant: 'default', class: 'size-4' },
      { size: 'lg', variant: 'default', class: 'size-4.5' },
      { size: 'xl', variant: 'default', class: 'size-5' },
      { size: 'xs', variant: 'bold', class: 'h-1.5 w-0.75' },
      { size: 'sm', variant: 'bold', class: 'h-2 w-1' },
      { size: 'md', variant: 'bold', class: 'h-2.5 w-1' },
      { size: 'lg', variant: 'bold', class: 'h-3 w-1.25' },
      { size: 'xl', variant: 'bold', class: 'h-3.5 w-1.5' },
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
