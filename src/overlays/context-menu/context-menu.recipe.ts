import { defineRecipe } from '../../theme/style/recipe'
import {
  overlayMenuCssVariables,
  overlayMenuDataAttributes,
  overlayMenuRecipeOptions,
} from '../base/menu/menu.recipe.ts'
import { modalDataAttributes } from '../modal/modal.recipe.ts'

import type { ContextMenuStyleSlot, ContextMenuStyleVariant } from './context-menu.style-types'

export const contextMenuDataAttributes = {
  trigger: modalDataAttributes.trigger,
  content: overlayMenuDataAttributes.content,
  item: overlayMenuDataAttributes.item,
}

export const contextMenuCssVariables = {
  content: overlayMenuCssVariables.content,
}

export const contextMenuRecipe = /* @__PURE__ */ defineRecipe<
  ContextMenuStyleSlot,
  ContextMenuStyleVariant
>('contextMenu', {
  ...overlayMenuRecipeOptions,
})
