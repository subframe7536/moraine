import { slotRecipe } from '../../shared/style/recipe'
import { overlayMenuRecipeOptions } from '../base/menu/menu.class'

import type { DropdownMenuT } from './dropdown-menu.types'

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
