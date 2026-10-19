import { defineRecipe } from '../../theme/recipe'
import { TONE_VARS } from '../../theme/recipe-common.recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { ButtonGroupStyleSlot, ButtonGroupRecipeVariant } from './button-group.style-types'

export const buttonGroupDataAttributes = {
  separator: /* @__PURE__ */ createDataAttributes('orientation'),
} satisfies DataAttributeContract<keyof ButtonGroupStyleSlot>

export const buttonGroupRecipe = /* @__PURE__ */ defineRecipe<
  ButtonGroupStyleSlot,
  ButtonGroupRecipeVariant
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
        separator: 'bg-tone/20',
      },
      solid: {
        separator: 'bg-tone-foreground/20',
      },
      soft: {
        separator: 'bg-tone/24',
      },
      ghost: {
        separator: 'bg-tone/20',
      },
      link: {
        separator: 'bg-tone/20',
      },
    },
    tone: TONE_VARS,
    orientation: {
      horizontal: {
        root: 'flex-row [&>*:not(:last-child)]:(border-e-0 rounded-e-none -me-px) [&>*:not(:first-child)]:rounded-s-none',
        separator: 'mx-px w-auto',
      },
      vertical: {
        root: 'flex-col [&>*:not(:last-child)]:(border-b-0 rounded-b-none -mb-px) [&>*:not(:first-child)]:rounded-t-none',
        separator: 'my-px h-auto',
      },
    },
  },
})
