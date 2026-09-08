import type { SlotRecipeOptions } from '../../shared/style/recipe.ts'
import { slotRecipe } from '../../shared/style/recipe.ts'

import type { IconT } from './icon.types.ts'

export const iconRecipeOptions = {
  base: {
    root: '',
  },
} as const satisfies SlotRecipeOptions<keyof IconT.Slot>

export const iconRecipe = /* @__PURE__ */ slotRecipe(iconRecipeOptions)
