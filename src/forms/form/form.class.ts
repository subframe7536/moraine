import type { SlotRecipeOptions } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

import type { FormT } from './form.types.ts'

export const formRecipeOptions = {
  base: {
    root: 'w-full space-y-4 data-submitting:opacity-80',
  },
} as const satisfies SlotRecipeOptions<keyof FormT.Slot>

export const formRecipe = recipe(formRecipeOptions)
