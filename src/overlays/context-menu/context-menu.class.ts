import { slotRecipe } from '../../shared/style/recipe.ts'
import { overlayMenuRecipeOptions } from '../base/menu/menu.class.ts'

import type { ContextMenuT } from './context-menu.types.ts'

export const contextMenuRecipe = /* @__PURE__ */ slotRecipe<keyof ContextMenuT.Slot>({
  ...overlayMenuRecipeOptions,
})
