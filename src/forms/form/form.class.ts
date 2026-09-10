import { slotRecipe } from '../../shared/style/recipe'

import type { FormT } from './form.types'

export const formRecipe = /* @__PURE__ */ slotRecipe<FormT.Slot, FormT.Variant>({
  base: {
    root: 'w-full space-y-4 data-submitting:opacity-80',
  },
})
