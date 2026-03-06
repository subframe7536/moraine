import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

import { INPUT_VARIANT_CLASSES, SURFACE_HIGHLIGHT_VARIANT } from '../../shared/cva-common.class'

export const inputNumberRootVariants = cva(
  'inline-flex w-full items-stretch overflow-hidden rounded-md transition-[color,box-shadow] focus-within:effect-fv-border data-invalid:effect-invalid focus-within:data-invalid:effect-invalid',
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
      highlight: SURFACE_HIGHLIGHT_VARIANT,
      disabled: {
        true: 'effect-dis',
      },
    },
  },
)

export const inputNumberBaseVariants = cva(
  'min-w-0 flex-1 bg-transparent text-foreground outline-none style-placeholder [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none disabled:bg-transparent',
  {
    defaultVariants: {
      size: 'md',
      align: 'center',
    },
    variants: {
      size: {
        xs: 'px-2 text-xs',
        sm: 'px-2.5 text-xs',
        md: 'px-2.5 text-sm',
        lg: 'px-3 text-sm',
        xl: 'px-3 text-base',
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
      horizontal: 'h-full shrink-0 rounded-none border-0 shadow-none',
      vertical: 'min-h-0 h-full w-full flex-1 rounded-none border-0 shadow-none px-0',
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
  'flex h-full shrink-0 flex-col border-s border-input',
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
  VariantProps<typeof inputNumberControlButtonVariants>
