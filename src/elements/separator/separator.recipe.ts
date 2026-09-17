import { defineRecipe } from '../../shared/style/recipe'

import type { SeparatorT } from './separator.types'

export const separatorRecipe = /* @__PURE__ */ defineRecipe<
  'separator',
  SeparatorT.Slot,
  SeparatorT.Variant
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
