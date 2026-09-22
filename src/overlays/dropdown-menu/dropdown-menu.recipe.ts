import { defineRecipe } from '../../theme/style/recipe'
import {
  overlayMenuCssVariables,
  overlayMenuDataAttributes,
  overlayMenuRecipeOptions,
} from '../base/menu/menu.recipe.ts'
import { modalDataAttributes } from '../modal/modal.recipe.ts'

import type { DropdownMenuStyleSlot, DropdownMenuStyleVariant } from './dropdown-menu.style-types'

export const dropdownMenuDataAttributes = {
  trigger: modalDataAttributes.trigger,
  content: overlayMenuDataAttributes.content,
  item: overlayMenuDataAttributes.item,
}

export const dropdownMenuCssVariables = {
  content: overlayMenuCssVariables.content,
}

export const dropdownMenuRecipe = /* @__PURE__ */ defineRecipe<
  DropdownMenuStyleSlot,
  DropdownMenuStyleVariant
>('dropdownMenu', {
  ...overlayMenuRecipeOptions,
})
