import type { DataAttributeContract } from '../../shared/style-contract.ts'
import { defineRecipe } from '../../theme/style/recipe'
import { overlayMenuDataAttributes, overlayMenuRecipeOptions } from '../base/menu/menu.recipe.ts'
import { overlayTriggerDataAttributes } from '../base/trigger.recipe'

import type { ContextMenuStyleSlot, ContextMenuStyleVariant } from './context-menu.style-types'

export const contextMenuDataAttributes = {
  trigger: overlayTriggerDataAttributes,
  content: overlayMenuDataAttributes.content,
  item: overlayMenuDataAttributes.item,
} satisfies DataAttributeContract<keyof ContextMenuStyleSlot>

export const contextMenuRecipe = /* @__PURE__ */ defineRecipe<
  ContextMenuStyleSlot,
  ContextMenuStyleVariant
>('contextMenu', {
  ...overlayMenuRecipeOptions,
})
