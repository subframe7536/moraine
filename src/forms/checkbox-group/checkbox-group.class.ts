import { slotRecipe } from '../../shared/style/recipe.ts'

import type { CheckboxGroupT } from './checkbox-group.types.ts'

export const checkboxGroupRecipe = /* @__PURE__ */ slotRecipe<
  CheckboxGroupT.Slot,
  CheckboxGroupT.Variant
>({
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
  defaults: {
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
      table: {
        item: 'border border-muted rounded-none relative',
      },
      list: { fieldset: 'gap-2' },
    },
  },
  compoundVariants: [
    {
      variants: { variant: 'table', size: 'sm' },
      class: { item: 'p-3' },
    },
    {
      variants: { variant: 'table', size: 'md' },
      class: { item: 'p-3.5' },
    },
    {
      variants: { variant: 'table', size: 'lg' },
      class: { item: 'p-4' },
    },
    {
      variants: { variant: 'table', orientation: 'horizontal' },
      class: {
        item: 'first-of-type:rounded-s-lg last-of-type:rounded-e-lg [&:not(:first-of-type)]:-ms-px',
      },
    },
    {
      variants: { variant: 'table', orientation: 'vertical' },
      class: {
        item: 'first-of-type:rounded-t-lg last-of-type:rounded-b-lg [&:not(:first-of-type)]:-mt-px',
      },
    },
  ],
})
