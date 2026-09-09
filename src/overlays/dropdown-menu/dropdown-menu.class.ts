import { slotRecipe } from '../../shared/style/recipe.ts'
import { overlayMenuRecipeOptions } from '../base/menu/menu.class.ts'

import type { DropdownMenuT } from './dropdown-menu.types.ts'

export const dropdownMenuRecipe = /* @__PURE__ */ slotRecipe<
  DropdownMenuT.Slot,
  DropdownMenuT.Variant
>({
  ...overlayMenuRecipeOptions,
  base: {
    ...overlayMenuRecipeOptions.base,
    content: `${overlayMenuRecipeOptions.base.content} min-w-32`,
  },
})
