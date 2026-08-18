import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils.ts'

export const inputNumberRootVariants = cva(
  'rounded-md inline-flex w-full transition-[colors,box-shadow] items-stretch overflow-hidden focus-within:effect-fv-border data-invalid:effect-invalid data-disabled:effect-dis focus-within:data-invalid:effect-invalid',
  {
    defaultVariants: {
      size: 'md',
      variant: 'outline',
    },
    variants: {
      size: {
        xs: 'text-xs leading-4 h-6',
        sm: 'text-xs leading-4 h-7',
        md: 'text-sm leading-5 h-8',
        lg: 'text-sm leading-5 h-9',
        xl: 'text-base leading-6 h-10',
      },
      variant: {
        outline: 'text-foreground border border-input bg-background shadow-xs',
        subtle: 'text-foreground border border-input bg-input/30 shadow-xs',
        ghost:
          'text-foreground bg-transparent data-disabled:bg-transparent focus-within:bg-muted-hover hover:bg-muted-hover dark:data-disabled:bg-transparent',
        none: 'text-foreground bg-transparent focus-within:ring-0',
      },
    },
  },
)

export const inputNumberBaseVariants = cva(
  'style-placeholder text-foreground style-input-number outline-none border-0 rounded-none bg-transparent flex-1 min-w-0 ring-0 shadow-none disabled:bg-transparent aria-invalid:ring-0 focus-visible:ring-0',
  {
    defaultVariants: {
      size: 'md',
      align: 'center',
    },
    variants: {
      size: {
        xs: 'text-xs leading-4 px-2',
        sm: 'text-xs leading-4 px-2.5',
        md: 'text-sm leading-5 px-2.5',
        lg: 'text-sm leading-5 px-3',
        xl: 'text-base leading-6 px-3',
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
      horizontal: 'self-center',
      vertical: 'px-0 flex-1 min-h-0 w-full scale-80',
    },
    size: {
      xs: 'text-xs',
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-sm',
      xl: 'text-base',
    },
  },
  compoundVariants: [
    {
      control: 'increment',
      orientation: 'horizontal',
      class: 'me-1',
    },
    {
      control: 'decrement',
      orientation: 'horizontal',
      class: 'ms-1',
    },
    {
      orientation: 'horizontal',
      size: 'xs',
      class: 'size-6',
    },
    {
      orientation: 'horizontal',
      size: 'sm',
      class: 'size-7',
    },
    {
      orientation: 'horizontal',
      size: 'md',
      class: 'size-8',
    },
    {
      orientation: 'horizontal',
      size: 'lg',
      class: 'size-9',
    },
    {
      orientation: 'horizontal',
      size: 'xl',
      class: 'size-10',
    },
  ],
})

export const inputNumberControlIconVariants = cva('shrink-0', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'size-4',
      sm: 'size-4',
      md: 'size-5',
      lg: 'size-5',
      xl: 'size-6',
    },
  },
})

export const inputNumberControlColumnVariants = cva('pe-1 flex shrink-0 flex-col h-full', {
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
})

export type InputNumberVariantProps = VariantProps<typeof inputNumberRootVariants>
