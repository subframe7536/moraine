import { defineRecipe } from '../../theme/style/recipe'
import { overlayMenuRecipeOptions } from '../base/menu/menu.class'

import type { ContextMenuStyleSlot, ContextMenuStyleVariant } from './context-menu.style-types'

export const contextMenuRecipe = /* @__PURE__ */ defineRecipe<
  ContextMenuStyleSlot,
  ContextMenuStyleVariant
>('contextMenu', {
  ...overlayMenuRecipeOptions,
})
