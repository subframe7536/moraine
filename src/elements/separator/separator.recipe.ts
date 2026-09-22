import { createDataAttributes } from '../../shared/style-contract.ts'
import type { StyleContractState } from '../../shared/style-contract.ts'
import { defineRecipe } from '../../theme/style/recipe'

import type { SeparatorStyleSlot, SeparatorStyleVariant } from './separator.style-types'

export const separatorDataAttributes = {
  root: (state: StyleContractState) =>
    createDataAttributes({ 'data-orientation': state.orientation }),
}

export const separatorRecipe = /* @__PURE__ */ defineRecipe<
  SeparatorStyleSlot,
  SeparatorStyleVariant
>('separator', {
  base: {
    root: 'bg-border shrink-0',
  },
  defaultVariants: {
    orientation: 'horizontal',
  },
  variants: {
    orientation: {
      horizontal: { root: 'h-px w-full' },
      vertical: { root: 'h-full w-px' },
    },
  },
})
