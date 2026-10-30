import { defineRecipe } from '../../theme/recipe'
import {
  DARK_DATA_INVALID_CLASS,
  DATA_INVALID_CLASS,
  DISABLED_CLASS,
  FOCUS_VISIBLE_CLASS,
} from '../../theme/recipe-common.recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { CheckboxStyleSlot, CheckboxStyleVariants } from './checkbox.style-types'

export const checkboxDataAttributes = {
  root: /* @__PURE__ */ createDataAttributes(
    'checked',
    'disabled',
    'indeterminate',
    'invalid',
    'readonly',
    'required',
    'unchecked',
  ),
  control: /* @__PURE__ */ createDataAttributes(
    'checked',
    'disabled',
    'indeterminate',
    'invalid',
    'readonly',
    'required',
    'unchecked',
  ),
  indicator: /* @__PURE__ */ createDataAttributes('checked', 'disabled', 'indeterminate'),
  label: /* @__PURE__ */ createDataAttributes('required'),
} satisfies DataAttributeContract<keyof CheckboxStyleSlot>

/**
 * Checkbox control styling, shared with bound checkbox controls (e.g. `tree.ItemCheckbox`).
 * Checked and indeterminate states share the same border and fill, so both look the same size.
 * The state icon inherits the control's color and font size.
 */
export const CHECKBOX_CONTROL_CLASS = `${DISABLED_CLASS} outline-none border border-input rounded-xs bg-control inline-flex shrink-0 cursor-pointer shadow-input transition-shadow items-center justify-center overflow-hidden bg-clip-padding ${FOCUS_VISIBLE_CLASS} data-checked:(text-primary-foreground border-primary bg-primary) data-indeterminate:(text-primary-foreground border-primary bg-primary) ${DATA_INVALID_CLASS}  ${DARK_DATA_INVALID_CLASS}`

/**
 * Control box and icon font size per size. The icon is `1.2em`, so each font size fits the icon
 * to the box inside the 1px border.
 */
export const CHECKBOX_CONTROL_SIZE_CLASS = {
  sm: 'text-tiny size-3.5',
  md: 'text-xs size-4',
  lg: 'text-sm size-4.5',
} as const

export const checkboxRecipe = /* @__PURE__ */ defineRecipe<
  CheckboxStyleSlot,
  CheckboxStyleVariants
>('checkbox', {
  base: {
    root: 'flex items-start relative',
    control: CHECKBOX_CONTROL_CLASS,
    indicator: 'text-primary-foreground bg-primary flex size-full items-center justify-center',
    wrapper: 'flex flex-col gap-0.5 w-full',
    container: 'flex items-center',
    label:
      "text-foreground font-medium block select-none data-required:after:(text-danger-ink ms-0.5 content-['*'])",
    description: 'text-muted-foreground leading-normal',
  },
  defaultVariants: {
    size: 'md',
    indicator: 'start',
  },
  variants: {
    variant: {
      card: { root: 'border border-border rounded-md cursor-pointer' },
    },
    indicator: {
      start: { root: 'flex-row', wrapper: 'ms-2' },
      end: { root: 'flex-row-reverse', wrapper: 'me-2' },
    },
    size: {
      sm: {
        control: CHECKBOX_CONTROL_SIZE_CLASS.sm,
        container: 'h-4',
        wrapper: 'text-xs',
        description: 'text-xs leading-normal',
      },
      md: {
        control: CHECKBOX_CONTROL_SIZE_CLASS.md,
        container: 'h-5',
        wrapper: 'text-sm',
        description: 'text-sm leading-normal',
      },
      lg: {
        control: CHECKBOX_CONTROL_SIZE_CLASS.lg,
        container: 'h-6',
        wrapper: 'text-base',
        description: 'text-base leading-normal',
      },
    },
  },
  compoundVariants: [
    {
      variants: { variant: 'card', size: 'sm' },
      root: 'p-3',
    },
    {
      variants: { variant: 'card', size: 'md' },
      root: 'p-3.5',
    },
    {
      variants: { variant: 'card', size: 'lg' },
      root: 'p-4',
    },
  ],
})
