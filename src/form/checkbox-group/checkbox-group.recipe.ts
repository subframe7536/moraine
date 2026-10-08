import { defineRecipe } from '../../theme/recipe'
import { JOINED_COLUMN_CLASS, JOINED_ROW_CLASS } from '../../theme/recipe-common.class'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'
import { checkboxDataAttributes } from '../checkbox/checkbox.recipe'

import type {
  CheckboxGroupStyleSlot,
  CheckboxGroupStyleVariant,
} from './checkbox-group.style-types'

export const checkboxGroupDataAttributes = {
  root: /* @__PURE__ */ createDataAttributes('disabled', 'invalid', 'readonly', 'required'),
  item: checkboxDataAttributes.root,
  control: checkboxDataAttributes.control,
  indicator: checkboxDataAttributes.indicator,
  label: checkboxDataAttributes.label,
  legend: checkboxDataAttributes.label,
} satisfies DataAttributeContract<keyof CheckboxGroupStyleSlot>

export const checkboxGroupRecipe = /* @__PURE__ */ defineRecipe<
  CheckboxGroupStyleSlot,
  CheckboxGroupStyleVariant
>('checkboxGroup', {
  base: {
    root: 'relative',
    fieldset: 'flex',
    legend:
      "text-foreground font-medium mb-1.5 block data-required:after:(text-destructive ms-0.5 content-['*'])",
    item: '',
    container: '',
    control: '',
    indicator: '',
    icon: '',
    wrapper: '',
    label: '',
    description: '',
  },
  defaultVariants: {
    variant: 'list',
    orientation: 'vertical',
    size: 'md',
  },
  variants: {
    orientation: {
      horizontal: { fieldset: 'flex-row' },
      vertical: { fieldset: 'flex-col' },
    },
    size: {
      sm: { legend: 'text-xs' },
      md: { legend: 'text-sm' },
      lg: { legend: 'text-base' },
    },
    variant: {
      card: { fieldset: 'gap-2' },
      list: { fieldset: 'gap-2' },
      table: {
        item: 'border border-muted rounded-none relative',
      },
    },
  },
  compoundVariants: [
    {
      variants: { variant: 'table', size: 'sm' },
      item: 'p-3',
    },
    {
      variants: { variant: 'table', size: 'md' },
      item: 'p-3.5',
    },
    {
      variants: { variant: 'table', size: 'lg' },
      item: 'p-4',
    },
    {
      variants: { variant: 'table', orientation: 'horizontal' },
      item: JOINED_ROW_CLASS,
    },
    {
      variants: { variant: 'table', orientation: 'vertical' },
      item: JOINED_COLUMN_CLASS,
    },
  ],
})
