import { slotRecipe } from '../../shared/style/recipe'
import { overlayMenuRecipeOptions } from '../base/menu/menu.class'

import type { ContextMenuT } from './context-menu.types'

export const contextMenuRecipe = /* @__PURE__ */ slotRecipe<
  ContextMenuT.Slot,
  ContextMenuT.Variant
>({
  ...overlayMenuRecipeOptions,
})
