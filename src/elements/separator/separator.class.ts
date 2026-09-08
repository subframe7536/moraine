import type { SlotRecipeOptions } from '../../shared/style/recipe.ts'
import { slotRecipe } from '../../shared/style/recipe.ts'
import { cn } from '../../shared/utils.ts'

import type { SeparatorT } from './separator.types.ts'

export const separatorRecipeOptions = {
  base: {
    root: /* @__PURE__ */ cn(
      'border-current bg-border shrink-0',
      'data-[orientation=horizontal]:border-t data-[orientation=vertical]:border-s data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
    ),
  },
  defaults: {
    size: 'sm',

    type: 'solid',
  },
  variants: {
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
} as const satisfies SlotRecipeOptions<keyof SeparatorT.Slot>

export const separatorRecipe = /* @__PURE__ */ slotRecipe(separatorRecipeOptions)
