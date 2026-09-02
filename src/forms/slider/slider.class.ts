import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils'

export const sliderRootVariants = cva(
  'group flex select-none items-center relative touch-none data-disabled:effect-dis',
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

export const sliderTrackVariants = cva(
  'bg-input select-none translate-z-0 relative overflow-hidden',
  {
    defaultVariants: {
      size: 'md',
      orientation: 'horizontal',
      variant: 'default',
    },
    variants: {
      size: {
        sm: '',
        md: '',
        lg: '',
      },
      variant: {
        default: 'rounded-full',
        bold: 'cursor-pointer',
      },
      orientation: {
        horizontal: 'h-$s-size w-full',
        vertical: 'h-full w-$s-size',
      },
    },
    compoundVariants: [
      { size: 'sm', variant: 'default', class: 'var-slider-4' },
      { size: 'md', variant: 'default', class: 'var-slider-5' },
      { size: 'lg', variant: 'default', class: 'var-slider-6' },
      { size: 'sm', variant: 'bold', class: 'var-slider-bold-20-14-3 rounded-xs' },
      { size: 'md', variant: 'bold', class: 'var-slider-bold-24-16-4 rounded-sm' },
      { size: 'lg', variant: 'bold', class: 'var-slider-bold-28-18-5 rounded-md' },
    ],
  },
)

export const sliderRangeVariants = cva('bg-primary select-none absolute z-raised', {
  defaultVariants: {
    orientation: 'horizontal',
    variant: 'default',
    inverted: false,
    multiple: false,
  },
  variants: {
    orientation: {
      horizontal: 'h-full',
      vertical: 'w-full',
    },
    variant: {
      default: 'rounded-full',
      bold: 'rounded-[inherit] transition-[width,height,left,right,top,bottom] after:(rounded-full bg-primary-foreground/90 opacity-0 content-empty transition-opacity absolute group-focus-within:opacity-100 group-hover:opacity-100) data-dragging:transition-none',
    },
    inverted: {
      true: '',
      false: '',
    },
    multiple: {
      true: '',
      false: '',
    },
  },
  compoundVariants: [
    {
      orientation: 'horizontal',
      inverted: false,
      variant: 'bold',
      class: 'after:(h-$s-len w-$s-offset top-1/2 -translate-y-1/2 left-$s-pos)',
    },
    {
      orientation: 'horizontal',
      inverted: true,
      variant: 'bold',
      class: 'after:(h-$s-len w-$s-offset top-1/2 -translate-y-1/2 right-$s-pos)',
    },
    {
      orientation: 'vertical',
      inverted: false,
      variant: 'bold',
      class: 'after:(w-$s-len h-$s-offset left-1/2 -translate-x-1/2 bottom-$s-pos)',
    },
    {
      orientation: 'vertical',
      inverted: true,
      variant: 'bold',
      class: 'after:(w-$s-len h-$s-offset left-1/2 -translate-x-1/2 top-$s-pos)',
    },
    {
      orientation: 'horizontal',
      inverted: false,
      variant: 'bold',
      multiple: true,
      class:
        'before:(rounded-full bg-primary-foreground/90 opacity-0 content-empty transition-opacity absolute group-focus-within:opacity-100 group-hover:opacity-100 h-$s-len w-$s-offset top-1/2 -translate-y-1/2 left-$s-offset)',
    },
    {
      orientation: 'horizontal',
      inverted: true,
      variant: 'bold',
      multiple: true,
      class:
        'before:(rounded-full bg-primary-foreground/90 opacity-0 content-empty transition-opacity absolute group-focus-within:opacity-100 group-hover:opacity-100 h-$s-len w-$s-offset top-1/2 -translate-y-1/2 right-$s-offset)',
    },
    {
      orientation: 'vertical',
      inverted: false,
      variant: 'bold',
      multiple: true,
      class:
        'before:(rounded-full bg-primary-foreground/90 opacity-0 content-empty transition-opacity absolute group-focus-within:opacity-100 group-hover:opacity-100 w-$s-len h-$s-offset left-1/2 -translate-x-1/2 bottom-$s-offset)',
    },
    {
      orientation: 'vertical',
      inverted: true,
      variant: 'bold',
      multiple: true,
      class:
        'before:(rounded-full bg-primary-foreground/90 opacity-0 content-empty transition-opacity absolute group-focus-within:opacity-100 group-hover:opacity-100 w-$s-len h-$s-offset left-1/2 -translate-x-1/2 top-$s-offset)',
    },
  ],
})

export const sliderDividerVariants = cva('pointer-events-none absolute', {
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
      default: 'bg-background',
      bold: 'bg-muted-foreground/30',
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
      class: 'h-1/3 w-px',
    },
    {
      orientation: 'vertical',
      variant: 'bold',
      class: 'h-px w-1/3',
    },
  ],
})

export const sliderThumbVariants = cva('shrink-0 block select-none absolute z-control touch-none', {
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
      sm: '',
      md: '',
      lg: '',
    },
    variant: {
      default:
        'outline-none border border-border rounded-full bg-background cursor-pointer shadow-xs/5 transition-[box-shadow,transform] focus-visible:effect-fv hover:effect-fv dark:bg-foreground data-dragging:scale-120 not-dark:bg-clip-padding',
      bold: 'outline-none opacity-0 cursor-grab data-dragging:cursor-grabbing',
    },
  },
  compoundVariants: [
    { size: 'sm', variant: 'default', class: 'size-3' },
    { size: 'md', variant: 'default', class: 'size-3.5' },
    { size: 'lg', variant: 'default', class: 'size-4' },
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
    // Bold directional hit targets
    {
      orientation: 'horizontal',
      inverted: false,
      variant: 'bold',
      class: 'h-full top-0 -translate-x-1/2 w-$s-size',
    },
    {
      orientation: 'horizontal',
      inverted: true,
      variant: 'bold',
      class: 'h-full top-0 translate-x-1/2 w-$s-size',
    },
    {
      orientation: 'vertical',
      inverted: false,
      variant: 'bold',
      class: 'w-full left-0 translate-y-1/2 h-$s-size',
    },
    {
      orientation: 'vertical',
      inverted: true,
      variant: 'bold',
      class: 'w-full left-0 -translate-y-1/2 h-$s-size',
    },
  ],
})

export type SliderVariantProps = VariantProps<typeof sliderThumbVariants>
