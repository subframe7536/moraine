import { defineRecipe } from '../../theme/recipe'
import {
  DARK_DATA_INVALID_CLASS,
  DATA_DISABLED_CLASS,
  DATA_INVALID_CLASS,
  DISABLED_CLASS,
  FOCUS_WITHIN_CLASS,
  FOCUS_WITHIN_INVALID_CLASS,
  INPUT_VARIANT,
} from '../../theme/recipe-common.class'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { InputNumberStyleSlot, InputNumberStyleVariant } from './input-number.style-types'

const controlDataAttributes = createDataAttributes('active', 'disabled')

export const inputNumberDataAttributes = {
  root: createDataAttributes('disabled', 'invalid', 'readonly', 'required'),
  input: createDataAttributes('auto-align', 'disabled', 'invalid', 'readonly', 'required'),
  increment: controlDataAttributes,
  decrement: controlDataAttributes,
} satisfies DataAttributeContract<keyof InputNumberStyleSlot>

export const inputNumberRecipe = /* @__PURE__ */ defineRecipe<
  InputNumberStyleSlot,
  InputNumberStyleVariant
>('inputNumber', {
  base: {
    root: `inline-flex w-full cursor-text transition-[color,background-color,border-color,box-shadow] items-stretch overflow-hidden ${FOCUS_WITHIN_CLASS}  ${DATA_INVALID_CLASS}  ${DARK_DATA_INVALID_CLASS}  ${DATA_DISABLED_CLASS}  ${FOCUS_WITHIN_INVALID_CLASS}`,
    input:
      'text-foreground text-center outline-none border-0 rounded-none bg-transparent flex-1 min-w-0 ring-0 shadow-none [appearance:textfield] placeholder:text-muted-foreground data-auto-align:text-start [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none disabled:bg-transparent aria-invalid:ring-0 focus-visible:ring-0',
    increment: `text-primary font-medium outline-none border-0 rounded-md bg-transparent inline-flex shrink-0 cursor-pointer select-none whitespace-nowrap transition-colors items-center justify-center touch-none ${DISABLED_CLASS} active:text-primary-active hover:text-primary-hover`,
    decrement: `text-primary font-medium outline-none border-0 rounded-md bg-transparent inline-flex shrink-0 cursor-pointer select-none whitespace-nowrap transition-colors items-center justify-center touch-none ${DISABLED_CLASS} active:text-primary-active hover:text-primary-hover`,
    controls: 'flex shrink-0 flex-col h-full',
  },
  defaultVariants: {
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
        input: 'text-base leading-6 px-3',
        increment: 'text-base',
        decrement: 'text-base',
        controls: 'w-10',
      },
    },
    variant: {
      outline: { root: INPUT_VARIANT.outline },
      subtle: { root: INPUT_VARIANT.subtle },
      ghost: {
        root: `${INPUT_VARIANT.ghost} group/input-number`,
        input:
          'group-focus-within/input-number:text-accent-foreground group-hover/input-number:text-accent-foreground group-focus-within/input-number:placeholder:text-accent-foreground group-hover/input-number:placeholder:text-accent-foreground',
        increment:
          'group-focus-within/input-number:text-accent-foreground group-hover/input-number:text-accent-foreground',
        decrement:
          'group-focus-within/input-number:text-accent-foreground group-hover/input-number:text-accent-foreground',
      },
      none: { root: INPUT_VARIANT.none },
    },
    align: {
      center: { input: 'text-center' },
      start: { input: 'text-start' },
    },
    orientation: {
      horizontal: {
        increment: 'rounded-e-none self-stretch',
        decrement: 'rounded-s-none self-stretch',
      },
      vertical: {
        increment: 'px-0 rounded-none flex-1 min-h-0 w-full',
        decrement: 'px-0 rounded-none flex-1 min-h-0 w-full',
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
    {
      variants: { orientation: 'vertical', variant: ['outline', 'subtle'] },
      increment: 'border-b-1 border-border',
      controls: 'border-s-1 border-border',
    },
  ],
})
