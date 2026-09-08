import type { SlotRecipeOptions } from '../../shared/style/recipe.ts'
import { slotRecipe } from '../../shared/style/recipe.ts'
import { cn } from '../../shared/utils.ts'

import type { CheckboxGroupT } from './checkbox-group.types.ts'

export const checkboxGroupRecipeOptions = {
  base: {
    root: 'relative',
    fieldset: 'data-[variant=list]:gap-2 data-[variant=card]:gap-2 flex',
    legend: /* @__PURE__ */ cn(
      'text-foreground font-medium mb-1.5 block',
      "data-required:after:text-destructive data-required:after:ms-0.5 data-required:after:content-['*']",
    ),
    item: /* @__PURE__ */ cn(
      '',
      'data-[table-orientation=horizontal]:first-of-type:rounded-s-lg data-[table-orientation=horizontal]:last-of-type:rounded-e-lg data-[table-orientation=vertical]:first-of-type:rounded-t-lg data-[table-orientation=vertical]:last-of-type:rounded-b-lg data-[table-orientation=horizontal]:[&:not(:first-of-type)]:-ms-px data-[table-orientation=vertical]:[&:not(:first-of-type)]:-mt-px',
    ),
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
      card: {},
      table: {
        item: 'border border-muted rounded-none relative',
      },
      list: {},
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
  ],
} as const satisfies SlotRecipeOptions<keyof CheckboxGroupT.Slot>

export const checkboxGroupRecipe = /* @__PURE__ */ slotRecipe(checkboxGroupRecipeOptions)
