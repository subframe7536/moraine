import { defineRecipe } from '../../theme/recipe'

import type { KbdGroupStyleSlot, KbdGroupStyleVariant } from './kbd-group.style-types'

export const kbdGroupRecipe = /* @__PURE__ */ defineRecipe<KbdGroupStyleSlot, KbdGroupStyleVariant>(
  'kbdGroup',
  {
    base: { root: 'text-muted-foreground inline-flex gap-1 items-center', item: '' },
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
