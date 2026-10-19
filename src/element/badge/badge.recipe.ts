import { defineRecipe } from '../../theme/recipe'
import { TONE_VARS } from '../../theme/recipe-common.recipe'

import type { BadgeStyleSlot, BadgeRecipeVariant } from './badge.style-types'

export const badgeRecipe = /* @__PURE__ */ defineRecipe<BadgeStyleSlot, BadgeRecipeVariant>(
  'badge',
  {
    base: {
      root: 'leading-normal font-medium border inline-flex shrink-0 max-w-full select-none whitespace-nowrap items-center',
      leading: 'shrink-0',
      label: 'min-w-0 truncate',
      trailing: 'shrink-0',
    },
    defaultVariants: {
      size: 'md',
      variant: 'soft',
      tone: 'neutral',
    },
    variants: {
      variant: {
        solid: {
          root: 'text-tone-foreground border-transparent bg-tone shadow-surface',
        },
        soft: {
          root: 'text-tone-ink border-transparent bg-tone-soft',
        },
        surface: {
          root: 'text-tone-ink border-tone-border-subtle bg-tone-soft',
        },
        outline: {
          root: 'text-tone-ink border-tone-border bg-background',
        },
      },
      tone: TONE_VARS,
      size: {
        sm: {
          root: 'text-tiny px-1 rounded-xs gap-0.5 h-4',
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
      },
    },
    compoundVariants: [
      { variants: { size: 'sm', square: true }, root: 'w-4' },
      { variants: { size: 'md', square: true }, root: 'w-5' },
      { variants: { size: 'lg', square: true }, root: 'w-6' },
    ],
  },
)
