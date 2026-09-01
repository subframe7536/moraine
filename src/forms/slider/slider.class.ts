import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils.ts'

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
  },
})

export function resolveSliderRangeBoldClass(
  orientation: 'horizontal' | 'vertical',
  inverted: boolean,
  multiple: boolean,
): string {
  const isH = orientation === 'horizontal'
  const afterPos = isH
    ? inverted
      ? 'after:(h-$s-len w-$s-offset top-1/2 -translate-y-1/2 right-$s-pos)'
      : 'after:(h-$s-len w-$s-offset top-1/2 -translate-y-1/2 left-$s-pos)'
    : inverted
      ? 'after:(w-$s-len h-$s-offset left-1/2 -translate-x-1/2 top-$s-pos)'
      : 'after:(w-$s-len h-$s-offset left-1/2 -translate-x-1/2 bottom-$s-pos)'

  if (!multiple) {
    return afterPos
  }

  const beforePos = isH
    ? inverted
      ? 'before:(rounded-full bg-primary-foreground/90 opacity-0 content-empty transition-opacity absolute group-focus-within:opacity-100 group-hover:opacity-100 h-$s-len w-$s-offset top-1/2 -translate-y-1/2 right-$s-offset)'
      : 'before:(rounded-full bg-primary-foreground/90 opacity-0 content-empty transition-opacity absolute group-focus-within:opacity-100 group-hover:opacity-100 h-$s-len w-$s-offset top-1/2 -translate-y-1/2 left-$s-offset)'
    : inverted
      ? 'before:(rounded-full bg-primary-foreground/90 opacity-0 content-empty transition-opacity absolute group-focus-within:opacity-100 group-hover:opacity-100 w-$s-len h-$s-offset left-1/2 -translate-x-1/2 top-$s-offset)'
      : 'before:(rounded-full bg-primary-foreground/90 opacity-0 content-empty transition-opacity absolute group-focus-within:opacity-100 group-hover:opacity-100 w-$s-len h-$s-offset left-1/2 -translate-x-1/2 bottom-$s-offset)'

  return `${afterPos} ${beforePos}`
}

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
    size: 'md',
    variant: 'default',
  },
  variants: {
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
  ],
})

export function resolveSliderThumbOffsetClass(
  orientation: 'horizontal' | 'vertical',
  inverted: boolean,
  variant: 'default' | 'bold' = 'default',
): string {
  if (variant === 'bold') {
    return orientation === 'horizontal'
      ? inverted
        ? 'h-full top-0 translate-x-1/2 w-$s-size'
        : 'h-full top-0 -translate-x-1/2 w-$s-size'
      : inverted
        ? 'w-full left-0 -translate-y-1/2 h-$s-size'
        : 'w-full left-0 translate-y-1/2 h-$s-size'
  }
  return orientation === 'horizontal'
    ? inverted
      ? 'translate-x-1/2'
      : '-translate-x-1/2'
    : inverted
      ? '-translate-y-1/2'
      : 'translate-y-1/2'
}

export type SliderVariantProps = VariantProps<typeof sliderThumbVariants> & {
  orientation?: 'horizontal' | 'vertical'
  inverted?: boolean
}
