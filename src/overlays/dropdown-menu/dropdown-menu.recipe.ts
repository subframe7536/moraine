import { defineRecipe } from '../../shared/style/recipe'
import { overlayMenuRecipeOptions } from '../base/menu/menu.class'

import type { DropdownMenuT } from './dropdown-menu.types'

export const dropdownMenuRecipe = /* @__PURE__ */ defineRecipe<
  'dropdownMenu',
  DropdownMenuT.Slot,
  DropdownMenuT.Variant
>('dropdownMenu', {
  ...overlayMenuRecipeOptions,
})
