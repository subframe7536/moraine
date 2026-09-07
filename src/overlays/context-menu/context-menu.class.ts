import type { SlotRecipeOptions } from '../../shared/style/recipe.ts'
import { overlayMenuRecipeOptions } from '../base/menu/menu.class.ts'

import type { ContextMenuT } from './context-menu.types.ts'

export const contextMenuRecipeOptions = {
  ...overlayMenuRecipeOptions,
} as const satisfies SlotRecipeOptions<keyof ContextMenuT.Slot>
