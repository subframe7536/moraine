import {
  CARD_PADDING_SIZE_VARIANT,
  TABLE_EDGE_ORIENTATION_VARIANT,
} from '../../shared/recipe-common.class.ts'
import type { VariantProps } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

export const checkboxGroupRecipe = recipe({
  slots: ['root', 'fieldset', 'legend', 'item'],
  base: {
    root: '',
    fieldset: 'flex',
    legend: 'text-foreground font-medium mb-1.5 block',
    item: '',
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
    required: {
      true: {
        legend: "after:text-destructive after:ms-0.5 after:content-['*']",
      },
    },
  },
})

export const checkboxGroupItemVariants = recipe({
  base: '',
  variants: {
    tableSize: CARD_PADDING_SIZE_VARIANT,
    tableOrientation: TABLE_EDGE_ORIENTATION_VARIANT,
  },
})

export type CheckboxGroupVariantProps = VariantProps<typeof checkboxGroupRecipe> & {
  variant?: 'list' | 'card' | 'table'
}
