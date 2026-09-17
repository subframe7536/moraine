import { defineRecipe } from '../../theme/style/recipe'

import type { FormStyleSlot } from './form.style-types'

export const formRecipe = /* @__PURE__ */ defineRecipe<'form', FormStyleSlot>('form', {
  base: {
    root: 'w-full space-y-4 data-submitting:opacity-80',
  },
})
