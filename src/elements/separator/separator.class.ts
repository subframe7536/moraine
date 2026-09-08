import { slotRecipe } from '../../shared/style/recipe.ts'

import type { SeparatorT } from './separator.types.ts'

export const separatorRecipe = /* @__PURE__ */ slotRecipe<keyof SeparatorT.Slot>({
  base: {
    root: 'border-current bg-border shrink-0',
  },
  defaults: {
    orientation: 'horizontal',
    size: 'sm',
    type: 'solid',
  },
  variants: {
    orientation: {
      horizontal: { root: 'border-t h-px w-full' },
      vertical: { root: 'border-s h-full w-px' },
    },
    size: {
      sm: { root: 'border-2' },
      md: { root: 'border-3' },
      lg: { root: 'border-4' },
    },
    type: {
      solid: { root: 'border-solid' },
      dashed: { root: 'border-dashed' },
      dotted: { root: 'border-dotted' },
    },
  },
})
