import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils'

export const sliderRootVariants = cva(
  'flex select-none items-center relative touch-none data-disabled:effect-dis',
  {
    defaultVariants: {
      orientation: 'horizontal',
    },
    variants: {
      orientation: {
        horizontal: 'w-full',
        vertical: 'flex-col h-full',
      },
    },
  },
)

export const sliderTrackVariants = cva('bg-input select-none relative', {
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
      default: 'rounded-full',
      bold: 'rounded',
    },
    orientation: {
      horizontal: 'h-$s-size w-full',
      vertical: 'h-full w-$s-size',
    },
  },
  compoundVariants: [
    { size: 'xs', variant: 'default', class: 'var-slider-3' },
    { size: 'sm', variant: 'default', class: 'var-slider-4' },
    { size: 'md', variant: 'default', class: 'var-slider-5' },
    { size: 'lg', variant: 'default', class: 'var-slider-6' },
    { size: 'xl', variant: 'default', class: 'var-slider-7' },
    { size: 'xs', variant: 'bold', class: 'var-slider-14' },
    { size: 'sm', variant: 'bold', class: 'var-slider-16' },
    { size: 'md', variant: 'bold', class: 'var-slider-18' },
    { size: 'lg', variant: 'bold', class: 'var-slider-20' },
    { size: 'xl', variant: 'bold', class: 'var-slider-22' },
  ],
})

export const sliderRangeVariants = cva('bg-primary select-none absolute z-2', {
  defaultVariants: {
    orientation: 'horizontal',
    variant: 'default',
    inverted: false,
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
    inverted: {
      true: '',
      false: '',
    },
  },
  compoundVariants: [
    {
      orientation: 'horizontal',
      variant: 'bold',
      inverted: false,
      class: 'rounded-l',
    },
    {
      orientation: 'vertical',
      variant: 'bold',
      inverted: false,
      class: 'rounded-b',
    },
    {
      orientation: 'horizontal',
      variant: 'bold',
      inverted: true,
      class: 'rounded-r',
    },
    {
      orientation: 'vertical',
      variant: 'bold',
      inverted: true,
      class: 'rounded-t',
    },
  ],
})

export const sliderDividerVariants = cva('bg-background pointer-events-none absolute', {
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
      variant: 'default',
      class: 'h-full w-px',
    },
    {
      orientation: 'vertical',
      variant: 'default',
      class: 'h-px w-full',
    },
    {
      orientation: 'horizontal',
      variant: 'bold',
      class: 'h-1/2 w-px',
    },
    {
      orientation: 'vertical',
      variant: 'bold',
      class: 'h-px w-1/2',
    },
  ],
})

export const sliderThumbVariants = cva(
  'rounded-full shrink-0 block select-none transition-[box-shadow,transform] absolute z-3 touch-none not-dark:bg-clip-padding',
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
          'outline-none surface-border bg-background cursor-pointer shadow-xs/5 focus-visible:effect-fv hover:effect-fv dark:bg-foreground data-dragging:scale-120',
        bold: 'outline-(3 primary solid) rounded-sm bg-primary-foreground focus-visible:bg-border',
      },
    },
    compoundVariants: [
      { size: 'xs', variant: 'default', class: 'size-3' },
      { size: 'sm', variant: 'default', class: 'size-3' },
      { size: 'md', variant: 'default', class: 'size-3.5' },
      { size: 'lg', variant: 'default', class: 'size-3.5' },
      { size: 'xl', variant: 'default', class: 'size-4' },
      { size: 'xs', variant: 'bold', class: 'h-2 w-1' },
      { size: 'sm', variant: 'bold', class: 'h-2.5 w-1' },
      { size: 'md', variant: 'bold', class: 'h-3 w-1' },
      { size: 'lg', variant: 'bold', class: 'h-3.5 w-1' },
      { size: 'xl', variant: 'bold', class: 'h-4 w-1' },
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
        class: 'translate-y-1/2',
      },
      {
        orientation: 'vertical',
        inverted: true,
        variant: 'default',
        class: '-translate-y-1/2',
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
        class: 'left-1/2 -translate-x-1/2 translate-y-1/2 rotate-90',
      },
      {
        orientation: 'vertical',
        inverted: true,
        variant: 'bold',
        class: 'left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90',
      },
    ],
  },
)

export type SliderVariantProps = VariantProps<typeof sliderThumbVariants>
