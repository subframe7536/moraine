import type { DataAttributeContract } from '../../shared/style-contract'
import { defineRecipe } from '../../theme/recipe'
import { overlayMenuDataAttributes, overlayMenuRecipeOptions } from '../base/menu/menu.recipe'
import { overlayTriggerDataAttributes } from '../base/trigger.recipe'

import type { DropdownMenuStyleSlot, DropdownMenuStyleVariant } from './dropdown-menu.style-types'

export const dropdownMenuDataAttributes = {
  trigger: overlayTriggerDataAttributes,
  content: overlayMenuDataAttributes.content,
  item: overlayMenuDataAttributes.item,
} satisfies DataAttributeContract<keyof DropdownMenuStyleSlot>

export const dropdownMenuRecipe = /* @__PURE__ */ defineRecipe<
  DropdownMenuStyleSlot,
  DropdownMenuStyleVariant
>('dropdownMenu', {
  ...overlayMenuRecipeOptions,
})
