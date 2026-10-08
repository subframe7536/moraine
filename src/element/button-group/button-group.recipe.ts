import { defineRecipe } from '../../theme/recipe'
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
    separator: 'bg-input self-stretch relative',
  },
  defaultVariants: {
    orientation: 'horizontal',
  },
  variants: {
    size: {},
    variant: {},
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
