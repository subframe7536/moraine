import { defineRecipe } from '../../theme/recipe'
import { TONE_VARS } from '../../theme/recipe-common.recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { ButtonGroupStyleSlot, ButtonGroupRecipeVariants } from './button-group.style-types'

export const buttonGroupDataAttributes = {
  separator: /* @__PURE__ */ createDataAttributes('orientation'),
} satisfies DataAttributeContract<keyof ButtonGroupStyleSlot>

export const buttonGroupRecipe = /* @__PURE__ */ defineRecipe<
  ButtonGroupStyleSlot,
  ButtonGroupRecipeVariants
>('buttonGroup', {
  base: {
    root: 'inline-flex size-fit items-stretch *:focus-visible:(relative z-sticky)',
    separator: 'bg-border self-stretch relative',
  },
  defaultVariants: {
    orientation: 'horizontal',
  },
  variants: {
    size: {},
    variant: {
      outline: {
        separator: 'bg-tone-border',
      },
      solid: {
        separator: 'bg-tone-active',
      },
      soft: {
        separator: 'bg-tone-soft-active',
      },
      ghost: {
        separator: 'bg-tone-soft-active',
      },
      link: {
        separator: 'bg-tone-soft-active',
      },
    },
    tone: TONE_VARS,
    orientation: {
      horizontal: {
        root: 'flex-row [&>*:not(:last-child)]:(border-e-0 rounded-e-none) [&>*:not(:first-child)]:rounded-s-none',
        separator: 'mx-px w-auto',
      },
      vertical: {
        root: 'flex-col [&>*:not(:last-child)]:(border-b-0 rounded-b-none) [&>*:not(:first-child)]:rounded-t-none',
        separator: 'my-px h-auto',
      },
    },
  },
})
