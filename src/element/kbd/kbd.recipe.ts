import { defineRecipe } from '../../theme/style/recipe'

import type { KbdStyleSlot, KbdStyleVariant } from './kbd.style-types'

export const kbdRecipe = /* @__PURE__ */ defineRecipe<KbdStyleSlot, KbdStyleVariant>('kbd', {
  base: {
    root: 'leading-none font-medium font-mono px-1 rounded-sm inline-flex select-none uppercase items-center justify-center',
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
  variants: {
    size: {
      sm: { root: 'text-[10px] h-4.5 min-w-4.5' },
      md: { root: 'text-xs h-5 min-w-5' },
      lg: { root: 'text-sm h-5.5 min-w-5.5' },
    },
    variant: {
      default: { root: 'text-muted-foreground bg-muted' },
      outline: { root: 'text-muted-foreground border border-b-2 border-border' },
      invert: { root: 'text-muted bg-muted-foreground' },
    },
  },
})
