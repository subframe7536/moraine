import { defineRecipe } from '../../theme/recipe'
import {
  DARK_DATA_INVALID_CLASS,
  DATA_DISABLED_CLASS,
  DATA_INVALID_CLASS,
  JOINED_COLUMN_CLASS,
  JOINED_ROW_CLASS,
  PEER_FOCUS_VISIBLE_CLASS,
} from '../../theme/recipe-common.class'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { RadioGroupStyleSlot, RadioGroupStyleVariant } from './radio-group.style-types'

export const radioGroupDataAttributes = {
  root: /* @__PURE__ */ createDataAttributes('disabled', 'invalid', 'readonly', 'required'),
  item: /* @__PURE__ */ createDataAttributes('checked', 'disabled'),
  control: /* @__PURE__ */ createDataAttributes(
    'checked',
    'disabled',
    'invalid',
    'readonly',
    'required',
  ),
  indicator: /* @__PURE__ */ createDataAttributes('checked'),
} satisfies DataAttributeContract<keyof RadioGroupStyleSlot>

export const radioGroupRecipe = /* @__PURE__ */ defineRecipe<
  RadioGroupStyleSlot,
  RadioGroupStyleVariant
>('radioGroup', {
  base: {
    root: 'flex relative',
    item: `flex items-start ${DATA_DISABLED_CLASS}`,
    control: `outline-none border border-input rounded-full bg-control inline-flex shrink-0 transition-shadow items-center justify-center relative overflow-hidden bg-clip-padding data-checked:(text-primary-foreground border-primary bg-primary) ${PEER_FOCUS_VISIBLE_CLASS}  ${DATA_INVALID_CLASS}  ${DARK_DATA_INVALID_CLASS}`,
    container: 'flex items-center',
    indicator: 'rounded-full bg-primary-foreground',
    wrapper: 'flex flex-col gap-0.5 w-full',
    label: 'text-foreground font-medium block',
    description: 'text-muted-foreground leading-normal',
  },
  defaultVariants: {
    variant: 'list',
    orientation: 'vertical',
    size: 'md',
    indicator: 'start',
  },
  variants: {
    orientation: {
      horizontal: { root: 'flex-row' },
      vertical: { root: 'flex-col' },
    },
    size: {
      sm: {
        item: 'text-xs',
        control: 'size-3.5',
        container: 'h-4',
        indicator: 'size-1.5',
        description: 'text-xs leading-normal',
      },
      md: {
        item: 'text-sm',
        control: 'size-4',
        container: 'h-5',
        indicator: 'size-2',
        description: 'text-sm leading-normal',
      },
      lg: {
        item: 'text-base',
        control: 'size-4.5',
        container: 'h-6',
        indicator: 'size-2.5',
        description: 'text-base leading-normal',
      },
    },
    variant: {
      card: {
        root: 'gap-2',
        item: 'border border-border rounded-md data-checked:border-primary',
      },
      table: {
        item: 'border border-muted relative data-checked:(border-primary/50 bg-primary/10 z-base)',
      },
      list: {
        root: 'gap-2',
      },
    },
    indicator: {
      start: { item: 'flex-row', wrapper: 'ms-2' },
      end: { item: 'flex-row-reverse', wrapper: 'me-2' },
    },
  },
  compoundVariants: [
    {
      variants: { variant: 'card', size: 'sm' },
      item: 'p-3',
    },
    {
      variants: { variant: 'card', size: 'md' },
      item: 'p-3.5',
    },
    {
      variants: { variant: 'card', size: 'lg' },
      item: 'p-4',
    },
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
