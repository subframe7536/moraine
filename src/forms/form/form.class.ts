import { slotRecipe } from '../../shared/style/recipe.ts'

import type { FormT } from './form.types.ts'

export const formRecipe = /* @__PURE__ */ slotRecipe<keyof FormT.Slot>({
  base: {
    root: 'w-full space-y-4 data-submitting:opacity-80',
  },
})
