import type { VariantProps } from 'cls-variant'

import { INPUT_VARIANT_CLASSES } from '../../shared/cva-common.class'
import { cva } from '../../shared/utils'

export const inputNumberRootVariants = cva(
  'rounded-md inline-flex w-full transition-[color,box-shadow] items-stretch overflow-hidden focus-within:effect-fv-border data-invalid:effect-invalid data-disabled:effect-dis data-highlight:surface-highlight focus-within:data-invalid:effect-invalid',
  {
    defaultVariants: {
      size: 'md',
      variant: 'outline',
    },
    variants: {
      size: {
        xs: 'h-7',
        sm: 'h-8',
        md: 'h-9',
        lg: 'h-10',
        xl: 'h-11',
      },
      variant: INPUT_VARIANT_CLASSES,
    },
  },
)

export const inputNumberBaseVariants = cva(
  'style-placeholder text-foreground style-input-number outline-none bg-transparent flex-1 min-w-0 disabled:bg-transparent',
  {
    defaultVariants: {
      size: 'md',
      align: 'center',
    },
    variants: {
      size: {
        xs: 'text-xs px-2',
        sm: 'text-xs px-2.5',
        md: 'text-sm px-2.5',
        lg: 'text-sm px-3',
        xl: 'text-base px-3',
      },
      align: {
        center: 'text-center',
        start: 'text-start',
      },
    },
  },
)

export type InputNumberOrientation = 'horizontal' | 'vertical'

export function resolveInputNumberAlign(
  orientation: InputNumberOrientation,
  decrement: boolean,
): 'center' | 'start' {
  return orientation === 'horizontal' && !decrement ? 'start' : 'center'
}

export const inputNumberControlButtonVariants = cva('border-input', {
  defaultVariants: {
    control: 'increment',
    divided: false,
    orientation: 'horizontal',
  },
  variants: {
    control: {
      increment: '',
      decrement: '',
    },
    divided: {
      true: 'border-t',
    },
    orientation: {
      horizontal: 'border-0 rounded-none shrink-0 h-full shadow-none',
      vertical: 'px-0 border-0 rounded-none flex-1 h-full min-h-0 w-full shadow-none',
    },
  },
  compoundVariants: [
    {
      control: 'increment',
      orientation: 'horizontal',
      class: 'border-s',
    },
    {
      control: 'decrement',
      orientation: 'horizontal',
      class: 'border-e',
    },
  ],
})

export const inputNumberControlColumnVariants = cva(
  'border-s border-input flex shrink-0 flex-col h-full',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: 'w-7',
        sm: 'w-8',
        md: 'w-9',
        lg: 'w-10',
        xl: 'w-11',
      },
    },
  },
)

export type InputNumberVariantProps = VariantProps<typeof inputNumberRootVariants> &
  VariantProps<typeof inputNumberBaseVariants> &
  VariantProps<typeof inputNumberControlButtonVariants> & {
    highlight?: boolean
  }
