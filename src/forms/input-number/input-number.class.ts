import { INPUT_VARIANT } from '../../shared/recipe-common.class'
import { slotRecipe } from '../../shared/style/recipe'

import type { InputNumberT } from './input-number.types'

export const inputNumberRecipe = /* @__PURE__ */ slotRecipe<
  InputNumberT.Slot,
  InputNumberT.Variant
>({
  base: {
    root: 'inline-flex w-full cursor-text transition-[colors,box-shadow] items-stretch overflow-hidden focus-within:(outline-none border-ring ring-3 ring-ring/50) data-invalid:(border-destructive ring-3 ring-destructive/20) dark:data-invalid:(border-destructive/50 ring-destructive/40) data-disabled:(opacity-64 pointer-events-none) focus-within:data-invalid:(border-destructive ring-3 ring-destructive/20) dark:focus-within:data-invalid:(border-destructive/50 ring-destructive/40)',
    input:
      'placeholder:text-muted-foreground text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none outline-none border-0 rounded-none bg-transparent flex-1 min-w-0 ring-0 shadow-none disabled:bg-transparent aria-invalid:ring-0 focus-visible:ring-0 text-center data-auto-align:text-start',
    increment:
      'text-primary font-medium outline-none border-0 rounded-md bg-transparent inline-flex shrink-0 cursor-pointer select-none touch-none whitespace-nowrap transition-colors items-center justify-center focus-visible:(outline-none ring-3 ring-ring/50) disabled:(opacity-64 pointer-events-none) hover:text-primary/75 active:text-primary/75 data-active:text-primary/75',
    decrement:
      'text-primary font-medium outline-none border-0 rounded-md bg-transparent inline-flex shrink-0 cursor-pointer select-none touch-none whitespace-nowrap transition-colors items-center justify-center focus-visible:(outline-none ring-3 ring-ring/50) disabled:(opacity-64 pointer-events-none) hover:text-primary/75 active:text-primary/75 data-active:text-primary/75',
    controls: 'pe-1 flex shrink-0 flex-col h-full',
  },
  defaults: {
    size: 'md',
    variant: 'outline',
    orientation: 'horizontal',
  },
  variants: {
    size: {
      sm: {
        root: 'text-xs rounded-sm h-7',
        input: 'text-xs leading-4 px-2.5',
        increment: 'text-xs',
        decrement: 'text-xs',
        controls: 'w-8',
      },
      md: {
        root: 'text-sm rounded-md h-8',
        input: 'text-sm leading-5 px-2.5',
        increment: 'text-sm',
        decrement: 'text-sm',
        controls: 'w-9',
      },
      lg: {
        root: 'text-base rounded-lg h-9',
        input: 'text-sm leading-5 px-3',
        increment: 'text-base',
        decrement: 'text-base',
        controls: 'w-10',
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
      increment: 'w-7',
      decrement: 'w-7',
    },
    {
      variants: { orientation: 'horizontal', size: 'md' },
      increment: 'w-8',
      decrement: 'w-8',
    },
    {
      variants: { orientation: 'horizontal', size: 'lg' },
      increment: 'w-9',
      decrement: 'w-9',
    },
  ],
})
