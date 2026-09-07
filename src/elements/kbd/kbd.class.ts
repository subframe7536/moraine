import type { SlotRecipeOptions } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

import type { KbdGroupT } from './kbd-group.types.ts'
import type { KbdT } from './kbd.types.ts'

export const kbdRecipeOptions = {
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
} as const satisfies SlotRecipeOptions<keyof KbdT.Slot>

export const kbdRecipe = recipe(kbdRecipeOptions)

export const kbdGroupRecipeOptions = {
  base: {
    root: 'inline-flex gap-1 items-center',
    chord: 'inline-flex gap-1 items-center',
    item: '',
    divider: 'text-muted-foreground',
    sequenceDivider: 'text-muted-foreground',
  },
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: { root: 'text-[11px]' },
      md: { root: 'text-xs' },
      lg: { root: 'text-xs' },
    },
  },
} as const satisfies SlotRecipeOptions<keyof KbdGroupT.Slot>

export const kbdGroupRecipe = recipe(kbdGroupRecipeOptions)

export type KbdVariantProps = KbdT.Variant
export type KbdGroupVariantProps = KbdGroupT.Variant
