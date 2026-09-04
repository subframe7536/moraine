import { INPUT_VARIANT } from '../../shared/recipe-common.class.ts'
import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const inputNumberRecipe = recipe({
  slots: ['root', 'input', 'increment', 'decrement'],
  base: {
    root: 'inline-flex w-full cursor-text transition-[colors,box-shadow] items-center overflow-hidden focus-within:outline-none focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40 data-disabled:opacity-64 data-disabled:pointer-events-none focus-within:data-invalid:border-destructive focus-within:data-invalid:ring-3 focus-within:data-invalid:ring-destructive/20 dark:focus-within:data-invalid:border-destructive/50 dark:focus-within:data-invalid:ring-destructive/40',
    input:
      'placeholder:text-muted-foreground text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none outline-none border-0 rounded-none bg-transparent flex-1 min-w-0 ring-0 shadow-none disabled:bg-transparent aria-invalid:ring-0 focus-visible:ring-0',
    increment:
      'text-primary font-medium outline-none border-0 rounded-md bg-transparent inline-flex shrink-0 cursor-pointer select-none whitespace-nowrap transition-colors items-center justify-center focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-64 disabled:pointer-events-none hover:text-primary/75 active:text-primary/75 data-active:text-primary/75',
    decrement:
      'text-primary font-medium outline-none border-0 rounded-md bg-transparent inline-flex shrink-0 cursor-pointer select-none whitespace-nowrap transition-colors items-center justify-center focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-64 disabled:pointer-events-none hover:text-primary/75 active:text-primary/75 data-active:text-primary/75',
  },
  defaultVariants: {
    size: 'md',
    variant: 'outline',
    align: 'center',
    orientation: 'horizontal',
  },
  variants: {
    size: {
      sm: {
        root: 'text-xs rounded-sm h-7',
        input: 'text-xs leading-4 px-2.5',
        increment: 'text-xs',
        decrement: 'text-xs',
      },
      md: {
        root: 'text-sm rounded-md h-8',
        input: 'text-sm leading-5 px-2.5',
        increment: 'text-sm',
        decrement: 'text-sm',
      },
      lg: {
        root: 'text-base rounded-lg h-9',
        input: 'text-sm leading-5 px-3',
        increment: 'text-base',
        decrement: 'text-base',
      },
    },
    variant: {
      outline: { root: INPUT_VARIANT.outline },
      subtle: { root: INPUT_VARIANT.subtle },
      ghost: { root: INPUT_VARIANT.ghost },
      none: { root: INPUT_VARIANT.none },
    },
    align: {
      center: { input: 'text-center' },
      start: { input: 'text-start' },
    },
    orientation: {
      horizontal: {
        increment: 'rounded-none self-stretch rounded-e-none',
        decrement: 'rounded-none self-stretch rounded-s-none',
      },
      vertical: {
        increment: 'px-0 rounded-none flex-1 min-h-0 w-full scale-80',
        decrement: 'px-0 rounded-none flex-1 min-h-0 w-full scale-80',
      },
    },
  },
  compoundVariants: [
    {
      variants: { orientation: 'horizontal', size: 'sm' },
      class: { increment: 'w-7', decrement: 'w-7' },
    },
    {
      variants: { orientation: 'horizontal', size: 'md' },
      class: { increment: 'w-8', decrement: 'w-8' },
    },
    {
      variants: { orientation: 'horizontal', size: 'lg' },
      class: { increment: 'w-9', decrement: 'w-9' },
    },
  ],
})

export type InputNumberOrientation = 'horizontal' | 'vertical'

export function resolveInputNumberAlign(
  orientation: InputNumberOrientation,
  decrement: boolean,
): 'center' | 'start' {
  return orientation === 'horizontal' && !decrement ? 'start' : 'center'
}

export const inputNumberControlColumnVariants = recipe({
  base: 'pe-1 flex shrink-0 flex-col h-full',
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

export type InputNumberVariantProps = VariantProps<typeof inputNumberRecipe>
