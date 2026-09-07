import type { SlotRecipeOptions } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

import type { SeparatorT } from './separator.types.ts'

export const separatorRecipeOptions = {
  base: {
    root: 'border-current bg-border shrink-0',
  },
  defaultVariants: {
    size: 'sm',
    orientation: 'horizontal',
    type: 'solid',
  },
  variants: {
    size: {
      sm: { root: 'border-2' },
      md: { root: 'border-3' },
      lg: { root: 'border-4' },
    },
    orientation: {
      horizontal: { root: 'border-t h-px w-full' },
      vertical: { root: 'border-s h-full w-px' },
    },
    type: {
      solid: { root: 'border-solid' },
      dashed: { root: 'border-dashed' },
      dotted: { root: 'border-dotted' },
    },
  },
} as const satisfies SlotRecipeOptions<keyof SeparatorT.Slot>

export const separatorRecipe = recipe(separatorRecipeOptions)

export type SeparatorVariantProps = SeparatorT.Variant
