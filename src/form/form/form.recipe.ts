import { createDataAttributes } from '../../shared/style-contract'
import type { DataAttributeContract } from '../../shared/style-contract'
import { defineRecipe } from '../../theme/recipe'

import type { FormStyleSlot } from './form.style-types'

export const formDataAttributes = {
  root: createDataAttributes('submitting'),
} satisfies DataAttributeContract<keyof FormStyleSlot>

export const formRecipe = /* @__PURE__ */ defineRecipe<FormStyleSlot>('form', {
  base: {
    root: 'w-full space-y-4 data-submitting:opacity-80',
  },
})
