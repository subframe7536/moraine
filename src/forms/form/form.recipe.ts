import { createDataAttributes } from '../../shared/style-contract.ts'
import type { StyleContractState } from '../../shared/style-contract.ts'
import { defineRecipe } from '../../theme/style/recipe'

import type { FormStyleSlot } from './form.style-types'

export const formDataAttributes = {
  root: (state: StyleContractState) =>
    createDataAttributes({ 'data-submitting': state.submitting }),
}

export const formRecipe = /* @__PURE__ */ defineRecipe<FormStyleSlot>('form', {
  base: {
    root: 'w-full space-y-4 data-submitting:opacity-80',
  },
})
