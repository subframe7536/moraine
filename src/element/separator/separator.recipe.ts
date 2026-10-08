import { defineRecipe } from '../../theme/recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { SeparatorStyleSlot, SeparatorStyleVariant } from './separator.style-types'

export const separatorDataAttributes = {
  root: /* @__PURE__ */ createDataAttributes('orientation'),
} satisfies DataAttributeContract<keyof SeparatorStyleSlot>

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
