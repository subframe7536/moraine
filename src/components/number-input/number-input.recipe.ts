import { defineRecipe } from '../../theme/recipe'
import {
  DARK_DATA_INVALID_CLASS,
  DATA_DISABLED_CLASS,
  DATA_INVALID_CLASS,
  DISABLED_CLASS,
  FOCUS_WITHIN_CLASS,
  FOCUS_WITHIN_INVALID_CLASS,
  INPUT_VARIANT,
} from '../../theme/recipe-common.recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { NumberInputStyleSlot, NumberInputStyleVariants } from './number-input.style-types'

const controlDataAttributes = /* @__PURE__ */ createDataAttributes('active', 'disabled')
const CONTROL_BUTTON_CLASS = `text-primary font-medium outline-none border-0 rounded-md bg-transparent inline-flex shrink-0 cursor-pointer select-none whitespace-nowrap transition-colors items-center justify-center touch-none ${DISABLED_CLASS} active:text-primary-active hover:text-primary-hover`
const NUMBER_INPUT_ACCENT_CLASS = 'accent-fg-foreground placeholder:accent-fg-muted-foreground'

export const numberInputDataAttributes = {
  root: /* @__PURE__ */ createDataAttributes('disabled', 'invalid', 'readonly', 'required'),
  input: /* @__PURE__ */ createDataAttributes(
    'auto-align',
    'disabled',
    'invalid',
    'readonly',
    'required',
  ),
  increment: controlDataAttributes,
  decrement: controlDataAttributes,
} satisfies DataAttributeContract<keyof NumberInputStyleSlot>

export const numberInputRecipe = /* @__PURE__ */ defineRecipe<
  NumberInputStyleSlot,
  NumberInputStyleVariants
>('numberInput', {
  base: {
    root: `inline-flex w-full cursor-text transition-[color,background-color,border-color,box-shadow] items-stretch overflow-hidden ${FOCUS_WITHIN_CLASS}  ${DATA_INVALID_CLASS}  ${DARK_DATA_INVALID_CLASS}  ${DATA_DISABLED_CLASS}  ${FOCUS_WITHIN_INVALID_CLASS}`,
    input:
      'text-foreground text-center outline-none border-0 rounded-none bg-transparent flex-1 min-w-0 ring-0 shadow-none [appearance:textfield] placeholder:text-muted-foreground data-auto-align:text-start [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none disabled:bg-transparent aria-invalid:ring-0 focus-visible:ring-0',
    increment: CONTROL_BUTTON_CLASS,
    decrement: CONTROL_BUTTON_CLASS,
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
        root: INPUT_VARIANT.ghost,
        input: NUMBER_INPUT_ACCENT_CLASS,
        increment: 'accent-fg-primary',
        decrement: 'accent-fg-primary',
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
