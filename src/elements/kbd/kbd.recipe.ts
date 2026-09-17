import { defineRecipe } from '../../theme/style/recipe'

import type { KbdGroupStyleSlot, KbdGroupStyleVariant } from './kbd-group.style-types'
import type { KbdStyleSlot, KbdStyleVariant } from './kbd.style-types'

export const kbdRecipe = /* @__PURE__ */ defineRecipe<'kbd', KbdStyleSlot, KbdStyleVariant>('kbd', {
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

export const kbdGroupRecipe = /* @__PURE__ */ defineRecipe<
  'kbdGroup',
  KbdGroupStyleSlot,
  KbdGroupStyleVariant
>('kbdGroup', {
  base: {
    root: 'inline-flex gap-1 items-center text-muted-foreground',
    item: '',
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
  variants: {
    size: {
      sm: { root: 'text-[11px]' },
      md: { root: 'text-xs' },
      lg: { root: 'text-xs' },
    },
    variant: {
      default: {},
      outline: {},
      invert: {},
    },
  },
})
