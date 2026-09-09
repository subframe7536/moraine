import { slotRecipe } from '../../shared/style/recipe.ts'

import type { SeparatorT } from './separator.types.ts'

export const separatorRecipe = /* @__PURE__ */ slotRecipe<SeparatorT.Slot, SeparatorT.Variant>({
  base: {
    root: 'bg-border shrink-0',
  },
  defaults: {
    orientation: 'horizontal',
  },
  variants: {
    orientation: {
      horizontal: { root: 'h-px w-full' },
      vertical: { root: 'h-full w-px' },
    },
  },
})
