import { defineRecipe } from '../../theme/recipe'
import {
  DARK_DATA_INVALID_CLASS,
  DATA_INVALID_CLASS,
  DISABLED_CLASS,
  FOCUS_CLASS,
  FOCUS_INVALID_CLASS,
  INPUT_VARIANT,
  TONE_CLASS,
} from '../../theme/recipe-common.recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { PinInputStyleSlot, PinInputStyleVariants } from './pin-input.style-types'

export const pinInputDataAttributes = {
  root: /* @__PURE__ */ createDataAttributes('disabled', 'invalid', 'readonly', 'required'),
  input: /* @__PURE__ */ createDataAttributes('disabled', 'invalid', 'readonly', 'required'),
} satisfies DataAttributeContract<keyof PinInputStyleSlot>

const PIN_INPUT_BASE_CLASS = `text-foreground font-medium text-center outline-none transition-[color,background-color,border-color,box-shadow] [appearance:textfield] placeholder:text-muted-foreground [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none focus:placeholder:text-transparent ${DISABLED_CLASS}  ${DATA_INVALID_CLASS}  ${DARK_DATA_INVALID_CLASS}`

export const pinInputRecipe = /* @__PURE__ */ defineRecipe<
  PinInputStyleSlot,
  PinInputStyleVariants
>('pinInput', {
  base: {
    root: 'inline-flex gap-1.5 items-center relative',
    input: PIN_INPUT_BASE_CLASS,
    separator:
      'text-muted-foreground font-medium inline-flex select-none items-center justify-center',
  },
  defaultVariants: {
    size: 'md',
    variant: 'outline',
    tone: 'primary',
  },
  variants: {
    size: {
      xs: {
        input: 'text-xs rounded-sm size-6',
        separator: 'text-xs',
      },
      sm: {
        input: 'text-xs rounded-sm size-7',
        separator: 'text-xs',
      },
      md: {
        input: 'text-sm rounded-md size-8',
        separator: 'text-sm',
      },
      lg: {
        input: 'text-base rounded-md size-9',
        separator: 'text-base',
      },
      xl: {
        input: 'text-base rounded-lg size-10',
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
    tone: {
      primary: TONE_CLASS.primary,
      secondary: TONE_CLASS.secondary,
      neutral: TONE_CLASS.neutral,
      danger: TONE_CLASS.danger,
      info: TONE_CLASS.info,
      success: TONE_CLASS.success,
      warning: TONE_CLASS.warning,
    },
    highlight: {
      true: {
        input: 'border-ring ring-2 ring-ring',
      },
    },
    fixed: {
      false: {},
    },
  },
})
