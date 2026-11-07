import { defineRecipe } from '../../theme/recipe'
import {
  DISABLED_CLASS,
  FOCUS_CLASS,
  FOCUS_INVALID_CLASS,
  INPUT_VARIANT,
} from '../../theme/recipe-common.recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { PinInputStyleSlot, PinInputStyleVariants } from './pin-input.style-types'

export const pinInputDataAttributes = {
  root: /* @__PURE__ */ createDataAttributes('disabled', 'invalid', 'readonly', 'required'),
  input: /* @__PURE__ */ createDataAttributes('disabled', 'invalid', 'readonly', 'required'),
} satisfies DataAttributeContract<keyof PinInputStyleSlot>

export const pinInputRecipe = /* @__PURE__ */ defineRecipe<
  PinInputStyleSlot,
  PinInputStyleVariants
>('pinInput', {
  base: {
    root: 'inline-flex gap-1.5 items-center relative',
    input: `text-foreground font-medium text-center outline-none transition-[color,background-color,border-color,box-shadow] [appearance:textfield] placeholder:text-muted-foreground [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none focus:placeholder:text-transparent ${DISABLED_CLASS} data-invalid:border-danger dark:data-invalid:border-danger/50`,
    separator:
      'text-muted-foreground font-medium inline-flex select-none items-center justify-center',
  },
  defaultVariants: {
    size: 'md',
    variant: 'outline',
    fixed: false,
  },
  variants: {
    size: {
      sm: {
        input: 'text-sm rounded-sm size-7',
        separator: 'text-xs',
      },
      md: {
        input: 'text-base rounded-md size-8',
        separator: 'text-sm',
      },
      lg: {
        input: 'text-base rounded-md size-9',
        separator: 'text-base',
      },
    },
    variant: {
      outline: {
        input: `${INPUT_VARIANT.outline}  ${FOCUS_CLASS}  ${FOCUS_INVALID_CLASS}`,
      },
      subtle: {
        input: `${INPUT_VARIANT.subtle}  ${FOCUS_CLASS}  ${FOCUS_INVALID_CLASS}`,
      },
      ghost: {
        input: `bg-transparent focus:bg-accent-hover hover:bg-accent-hover ${FOCUS_CLASS}  ${FOCUS_INVALID_CLASS}`,
      },
      none: {
        input: 'border-0 bg-transparent shadow-none focus:ring-0',
      },
    },
    fixed: {
      false: {},
    },
  },
  compoundVariants: [
    {
      variants: { fixed: false, size: 'sm' },
      input: 'md:text-xs',
    },
    {
      variants: { fixed: false, size: 'md' },
      input: 'md:text-sm',
    },
    {
      variants: { fixed: false, size: 'lg' },
      input: 'md:text-sm',
    },
  ],
})
