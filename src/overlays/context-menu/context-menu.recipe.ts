import { defineRecipe } from '../../shared/style/recipe'
import { overlayMenuRecipeOptions } from '../base/menu/menu.class'

import type { ContextMenuStyleSlot, ContextMenuStyleVariant } from './context-menu.style-types.ts'

export const contextMenuRecipe = /* @__PURE__ */ defineRecipe<
  'contextMenu',
  ContextMenuStyleSlot,
  ContextMenuStyleVariant
>('contextMenu', {
  ...overlayMenuRecipeOptions,
})
