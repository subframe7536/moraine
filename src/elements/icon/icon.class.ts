import type { SlotRecipeOptions } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

import type { IconT } from './icon.types.ts'

export const iconRecipeOptions = {
  base: {
    root: '',
  },
} as const satisfies SlotRecipeOptions<keyof IconT.Slot>

export const iconRecipe = recipe(iconRecipeOptions)
