import { defineRecipe } from '../../theme/recipe'
import type { DataAttributeContract } from '../../theme/style-contract'
import {
  overlayMenuDataAttributes,
  overlayMenuRecipeOptions,
} from '../shared/overlay/menu/menu.recipe'
import { overlayTriggerDataAttributes } from '../shared/overlay/trigger.recipe'

import type { DropdownMenuStyleSlot, DropdownMenuStyleVariants } from './dropdown-menu.style-types'

export const dropdownMenuDataAttributes = {
  trigger: overlayTriggerDataAttributes,
  content: overlayMenuDataAttributes.content,
  item: overlayMenuDataAttributes.item,
} satisfies DataAttributeContract<keyof DropdownMenuStyleSlot>

export const dropdownMenuRecipe = /* @__PURE__ */ defineRecipe<
  DropdownMenuStyleSlot,
  DropdownMenuStyleVariants
>('dropdownMenu', {
  ...overlayMenuRecipeOptions,
})
