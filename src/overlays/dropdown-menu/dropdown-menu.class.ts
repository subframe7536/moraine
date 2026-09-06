import type { SlotRecipeOptions } from '../../shared/style/recipe.ts'
import { overlayMenuRecipeOptions } from '../base/menu/menu.class.ts'

import type { DropdownMenuT } from './dropdown-menu.types.ts'

export const dropdownMenuRecipeOptions = {
  ...overlayMenuRecipeOptions,
  base: {
    ...overlayMenuRecipeOptions.base,
    content: `${overlayMenuRecipeOptions.base.content} min-w-32`,
  },
} as const satisfies SlotRecipeOptions<keyof DropdownMenuT.Slot>
