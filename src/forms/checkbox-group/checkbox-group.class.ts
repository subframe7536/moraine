import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const checkboxGroupRecipe = recipe({
  base: {
    root: 'relative',
    fieldset: 'flex',
    legend: 'text-foreground font-medium mb-1.5 block',
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
    tableOrientation: {
      horizontal: {
        item: 'first-of-type:rounded-s-lg last-of-type:rounded-e-lg [&:not(:first-of-type)]:-ms-px',
      },
      vertical: {
        item: 'first-of-type:rounded-t-lg last-of-type:rounded-b-lg [&:not(:first-of-type)]:-mt-px',
      },
    },
    required: {
      true: {
        legend: "after:text-destructive after:ms-0.5 after:content-['*']",
      },
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
})

export type CheckboxGroupVariantProps = VariantProps<typeof checkboxGroupRecipe>
