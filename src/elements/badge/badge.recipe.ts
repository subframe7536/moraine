import { defineRecipe } from '../../shared/style/recipe'

import type { BadgeStyleSlot, BadgeRecipeVariant } from './badge.style-types.ts'

export const badgeRecipe = /* @__PURE__ */ defineRecipe<
  'badge',
  BadgeStyleSlot,
  BadgeRecipeVariant
>('badge', {
  base: {
    root: 'leading-normal font-medium border inline-flex shrink-0 max-w-full select-none whitespace-nowrap items-center',
    leading: 'shrink-0',
    label: 'min-w-0 truncate',
    trailing: 'shrink-0',
  },
  defaultVariants: {
    size: 'md',
    variant: 'subtle',
  },
  variants: {
    variant: {
      solid: {
        root: 'text-primary-foreground border-transparent bg-primary shadow-xs',
      },
      subtle: {
        root: 'text-accent-foreground border-transparent bg-accent',
      },
      surface: {
        root: 'text-accent-foreground border-border bg-accent',
      },
      outline: {
        root: 'text-foreground border-border bg-background',
      },
    },
    size: {
      sm: {
        root: 'text-[10px] px-1 rounded-xs gap-0.5 h-4',
        leading: 'size-3',
        trailing: 'size-3',
      },
      md: {
        root: 'text-xs px-1.5 rounded-sm gap-1 h-5',
        leading: 'size-3.5',
        trailing: 'size-3.5',
      },
      lg: {
        root: 'text-sm px-2 rounded-md gap-1 h-6',
        leading: 'size-4',
        trailing: 'size-4',
      },
    },
    square: {
      true: { root: 'px-0 justify-center' },
      false: {},
    },
  },
  compoundVariants: [
    { variants: { size: 'sm', square: true }, root: 'w-4' },
    { variants: { size: 'md', square: true }, root: 'w-5' },
    { variants: { size: 'lg', square: true }, root: 'w-6' },
  ],
})
