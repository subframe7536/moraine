import { defineRecipe } from '../../theme/recipe'
import {
  DARK_DATA_INVALID_CLASS,
  DATA_INVALID_CLASS,
  DISABLED_CLASS,
  FOCUS_VISIBLE_CLASS,
} from '../../theme/recipe-common.class'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { CheckboxStyleSlot, CheckboxStyleVariant } from './checkbox.style-types'

export const checkboxDataAttributes = {
  root: createDataAttributes(
    'checked',
    'disabled',
    'indeterminate',
    'invalid',
    'readonly',
    'required',
    'unchecked',
  ),
  control: createDataAttributes(
    'checked',
    'disabled',
    'indeterminate',
    'invalid',
    'readonly',
    'required',
    'unchecked',
  ),
  indicator: createDataAttributes('checked', 'disabled', 'indeterminate'),
  label: createDataAttributes('required'),
} satisfies DataAttributeContract<keyof CheckboxStyleSlot>

export const checkboxRecipe = /* @__PURE__ */ defineRecipe<CheckboxStyleSlot, CheckboxStyleVariant>(
  'checkbox',
  {
    base: {
      root: 'flex items-start relative',
      control: `${DISABLED_CLASS} outline-none border border-input rounded-xs bg-control inline-flex shrink-0 cursor-pointer shadow-xs transition-shadow items-center justify-center overflow-hidden bg-clip-padding ${FOCUS_VISIBLE_CLASS} data-checked:(border-primary bg-primary) ${DATA_INVALID_CLASS} ${DARK_DATA_INVALID_CLASS}`,
      indicator: 'text-primary-foreground bg-primary flex size-full items-center justify-center',
      icon: 'shrink-0 size-full',
      wrapper: 'flex flex-col gap-0.5 w-full',
      container: 'flex items-center',
      label:
        "text-foreground font-medium block select-none data-required:after:(text-destructive ms-0.5 content-['*'])",
      description: 'text-muted-foreground leading-normal',
    },
    defaultVariants: {
      size: 'md',
      indicator: 'start',
    },
    variants: {
      variant: {
        card: { root: 'border border-border rounded-md cursor-pointer' },
        list: {},
      },
      indicator: {
        start: { root: 'flex-row', wrapper: 'ms-2' },
        end: { root: 'flex-row-reverse', wrapper: 'me-2' },
        hidden: { wrapper: '' },
      },
      size: {
        sm: {
          control: 'size-3.5',
          container: 'h-4',
          wrapper: 'text-xs',
          description: 'text-xs leading-normal',
        },
        md: {
          control: 'size-4',
          container: 'h-5',
          wrapper: 'text-sm',
          description: 'text-sm leading-normal',
        },
        lg: {
          control: 'size-4.5',
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
  },
)
