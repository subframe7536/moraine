import type { SlotRecipeOptions } from '../../shared/style/recipe.ts'
import { recipe } from '../../shared/style/recipe.ts'

import type { BadgeT } from './badge.types.ts'

export const badgeRecipeOptions = {
  base: {
    root: 'leading-normal font-medium border inline-flex shrink-0 max-w-full select-none whitespace-nowrap items-center',
    leading: '',
    label: 'min-w-0 truncate',
    trailing: '',
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
  variants: {
    variant: {
      default: {
        root: 'text-accent-foreground border-transparent bg-accent',
      },
      outline: {
        root: 'text-foreground border-border bg-background',
      },
      solid: {
        root: 'text-primary-foreground border-transparent bg-primary shadow-xs',
      },
    },
    size: {
      sm: {
        root: 'text-[10px] px-1 rounded-xs gap-0.5 h-4',
      },
      md: {
        root: 'text-xs px-1.5 rounded-sm gap-1 h-5',
      },
      lg: {
        root: 'text-sm px-2 rounded-md gap-1.5 h-6',
      },
    },
  },
} as const satisfies SlotRecipeOptions<keyof BadgeT.Slot>

export const badgeRecipe = recipe(badgeRecipeOptions)

export type BadgeVariantProps = BadgeT.Variant
