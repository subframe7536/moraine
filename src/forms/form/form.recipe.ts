import { defineRecipe } from '../../shared/style/recipe'

import type { FormT } from './form.types'

export const formRecipe = /* @__PURE__ */ defineRecipe<'form', FormT.Slot>('form', {
  base: {
    root: 'w-full space-y-4 data-submitting:opacity-80',
  },
})
