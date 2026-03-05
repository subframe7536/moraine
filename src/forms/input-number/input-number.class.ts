import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

import { SURFACE_HIGHLIGHT_VARIANT, SURFACE_VARIANT_CLASSES } from '../../shared/cva-common.class'

export const inputNumberBaseVariants = cva(
  'w-full rounded-md border border-input bg-transparent text-foreground outline-none transition-[color,box-shadow] dark:bg-input/30 placeholder:text-muted-foreground focus-visible:effect-fv-border aria-invalid:effect-invalid disabled:effect-dis',
  {
    defaultVariants: {
      size: 'md',
      variant: 'outline',
      orientation: 'horizontal',
    },
    variants: {
      size: {
        xs: 'h-7 px-2 text-xs',
        sm: 'h-8 px-2.5 text-xs',
        md: 'h-9 px-2.5 text-sm',
        lg: 'h-10 px-3 text-sm',
        xl: 'h-11 px-3 text-base',
      },
      variant: SURFACE_VARIANT_CLASSES,
      orientation: {
        horizontal: 'text-center',
        vertical: 'text-center',
      },
      highlight: SURFACE_HIGHLIGHT_VARIANT,
    },
  },
)

export const inputNumberPaddingVariants = cva('', {
  defaultVariants: {
    size: 'md',
    orientation: 'horizontal',
    increment: false,
    decrement: false,
  },
  variants: {
    size: {
      xs: '',
      sm: '',
      md: '',
      lg: '',
      xl: '',
    },
    orientation: {
      horizontal: '',
      vertical: '',
    },
    increment: {
      true: '',
      false: '',
    },
    decrement: {
      true: '',
      false: '',
    },
  },
  compoundVariants: [
    { orientation: 'horizontal', increment: true, size: 'xs', class: 'pe-7' },
    { orientation: 'horizontal', increment: true, size: 'sm', class: 'pe-8' },
    { orientation: 'horizontal', increment: true, size: 'md', class: 'pe-9' },
    { orientation: 'horizontal', increment: true, size: 'lg', class: 'pe-10' },
    { orientation: 'horizontal', increment: true, size: 'xl', class: 'pe-11' },
    { orientation: 'horizontal', decrement: true, size: 'xs', class: 'ps-7' },
    { orientation: 'horizontal', decrement: true, size: 'sm', class: 'ps-8' },
    { orientation: 'horizontal', decrement: true, size: 'md', class: 'ps-9' },
    { orientation: 'horizontal', decrement: true, size: 'lg', class: 'ps-10' },
    { orientation: 'horizontal', decrement: true, size: 'xl', class: 'ps-11' },
    { orientation: 'vertical', increment: true, size: 'xs', class: 'pe-7' },
    { orientation: 'vertical', increment: true, size: 'sm', class: 'pe-8' },
    { orientation: 'vertical', increment: true, size: 'md', class: 'pe-9' },
    { orientation: 'vertical', increment: true, size: 'lg', class: 'pe-10' },
    { orientation: 'vertical', increment: true, size: 'xl', class: 'pe-11' },
    { orientation: 'vertical', decrement: true, size: 'xs', class: 'pe-7' },
    { orientation: 'vertical', decrement: true, size: 'sm', class: 'pe-8' },
    { orientation: 'vertical', decrement: true, size: 'md', class: 'pe-9' },
    { orientation: 'vertical', decrement: true, size: 'lg', class: 'pe-10' },
    { orientation: 'vertical', decrement: true, size: 'xl', class: 'pe-11' },
  ],
})

export const inputNumberControlButtonVariants = cva('', {
  defaultVariants: {
    orientation: 'horizontal',
  },
  variants: {
    orientation: {
      horizontal: '',
      vertical: 'h-full min-h-0 w-full rounded-none px-0',
    },
  },
})

export const inputNumberIncrementVariants = cva('absolute flex items-center justify-center', {
  defaultVariants: {
    orientation: 'horizontal',
    disabled: false,
  },
  variants: {
    orientation: {
      horizontal: 'inset-y-0 end-0 pe-1',
      vertical: 'top-0 end-0 h-1/2',
    },
    disabled: {
      true: 'effect-dis',
    },
  },
})

export const inputNumberDecrementVariants = cva('absolute flex items-center justify-center', {
  defaultVariants: {
    orientation: 'horizontal',
    disabled: false,
  },
  variants: {
    orientation: {
      horizontal: 'inset-y-0 start-0 ps-1',
      vertical: 'bottom-0 end-0 h-1/2',
    },
    disabled: {
      true: 'effect-dis',
    },
  },
})

export type InputNumberVariantProps = VariantProps<typeof inputNumberBaseVariants> &
  VariantProps<typeof inputNumberIncrementVariants> &
  VariantProps<typeof inputNumberDecrementVariants>
