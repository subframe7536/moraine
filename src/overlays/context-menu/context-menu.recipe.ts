import { defineRecipe } from '../../shared/style/recipe'
import { overlayMenuRecipeOptions } from '../base/menu/menu.class'

import type { ContextMenuT } from './context-menu.types'

export const contextMenuRecipe = /* @__PURE__ */ defineRecipe<
  'contextMenu',
  ContextMenuT.Slot,
  ContextMenuT.Variant
>('contextMenu', {
  ...overlayMenuRecipeOptions,
})
