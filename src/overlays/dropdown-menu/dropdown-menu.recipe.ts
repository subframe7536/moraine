import { defineRecipe } from '../../theme/style/recipe'
import { overlayMenuRecipeOptions } from '../base/menu/menu.class'

import type { DropdownMenuStyleSlot, DropdownMenuStyleVariant } from './dropdown-menu.style-types'

export const dropdownMenuRecipe = /* @__PURE__ */ defineRecipe<
  'dropdownMenu',
  DropdownMenuStyleSlot,
  DropdownMenuStyleVariant
>('dropdownMenu', {
  ...overlayMenuRecipeOptions,
})
