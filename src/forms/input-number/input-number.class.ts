import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils.ts'
import { inputRootVariants } from '../input/input.class.ts'

export const inputNumberRootVariants = inputRootVariants

export const inputNumberBaseVariants = cva(
  'style-placeholder text-foreground style-input-number outline-none border-0 rounded-none bg-transparent flex-1 min-w-0 ring-0 shadow-none disabled:bg-transparent aria-invalid:ring-0 focus-visible:ring-0',
  {
    defaultVariants: {
      size: 'md',
      align: 'center',
    },
    variants: {
      size: {
        sm: 'text-xs leading-4 px-2.5',
        md: 'text-sm leading-5 px-2.5',
        lg: 'text-sm leading-5 px-3',
      },
      align: {
        center: 'text-center',
        start: 'text-start',
      },
    },
  },
)

const INPUT_NUMBER_CONTROL_BUTTON_CLASS =
  'text-primary font-medium outline-none border-0 rounded-md bg-transparent inline-flex shrink-0 cursor-pointer select-none whitespace-nowrap transition-colors items-center justify-center focus-visible:effect-fv disabled:(text-primary cursor-not-allowed opacity-75) hover:text-primary/75 active:text-primary/75 data-active:text-primary/75'

export type InputNumberOrientation = 'horizontal' | 'vertical'

export function resolveInputNumberAlign(
  orientation: InputNumberOrientation,
  decrement: boolean,
): 'center' | 'start' {
  return orientation === 'horizontal' && !decrement ? 'start' : 'center'
}

export const inputNumberControlButtonVariants = cva(INPUT_NUMBER_CONTROL_BUTTON_CLASS, {
  defaultVariants: {
    control: 'increment',
    orientation: 'horizontal',
    size: 'md',
  },
  variants: {
    control: {
      increment: '',
      decrement: '',
    },
    orientation: {
      horizontal: 'self-stretch rounded-none',
      vertical: 'px-0 flex-1 min-h-0 w-full scale-80 rounded-none',
    },
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-sm',
    },
  },
  compoundVariants: [
    {
      control: 'increment',
      orientation: 'horizontal',
      class: 'rounded-e-none',
    },
    {
      control: 'decrement',
      orientation: 'horizontal',
      class: 'rounded-s-none',
    },
    {
      orientation: 'horizontal',
      size: 'sm',
      class: 'w-7',
    },
    {
      orientation: 'horizontal',
      size: 'md',
      class: 'w-8',
    },
    {
      orientation: 'horizontal',
      size: 'lg',
      class: 'w-9',
    },
  ],
})

export const inputNumberControlIconVariants = cva('shrink-0', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: 'size-4',
      md: 'size-5',
      lg: 'size-5',
    },
  },
})

export const inputNumberControlColumnVariants = cva('pe-1 flex shrink-0 flex-col h-full', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: 'w-8',
      md: 'w-9',
      lg: 'w-10',
    },
  },
})

export type InputNumberVariantProps = VariantProps<typeof inputNumberRootVariants>
