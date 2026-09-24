import { defineRecipe } from '../../theme/style/recipe.ts'

import type { KbdGroupStyleSlot, KbdGroupStyleVariant } from './kbd-group.style-types.ts'

export const kbdGroupRecipe = /* @__PURE__ */ defineRecipe<KbdGroupStyleSlot, KbdGroupStyleVariant>(
  'kbdGroup',
  {
    base: { root: 'inline-flex gap-1 items-center text-muted-foreground', item: '' },
    defaultVariants: { size: 'md', variant: 'default' },
    variants: {
      size: {
        sm: { root: 'text-[10px]' },
        md: { root: 'text-xs' },
        lg: { root: 'text-sm' },
      },
      variant: { default: {}, outline: {}, invert: {} },
    },
  },
)
