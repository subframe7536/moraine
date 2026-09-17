import { defineRecipe } from '../../shared/style/recipe'

import type { FormStyleSlot } from './form.style-types.ts'

export const formRecipe = /* @__PURE__ */ defineRecipe<'form', FormStyleSlot>('form', {
  base: {
    root: 'w-full space-y-4 data-submitting:opacity-80',
  },
})
