import { defineRecipe } from '../../shared/style/recipe'

import type { ButtonGroupStyleSlot, ButtonGroupRecipeVariant } from './button-group.style-types.ts'

export const buttonGroupRecipe = /* @__PURE__ */ defineRecipe<
  'buttonGroup',
  ButtonGroupStyleSlot,
  ButtonGroupRecipeVariant
>('buttonGroup', {
  base: {
    root: 'inline-flex size-fit items-stretch *:focus-visible:(relative z-sticky)',
    separator: 'relative self-stretch bg-input',
  },
  defaultVariants: {
    orientation: 'horizontal',
    size: 'md',
    variant: 'default',
  },
  variants: {
    size: {
      sm: {},
      md: {},
      lg: {},
    },
    variant: {
      default: {},
      secondary: {},
      outline: {},
      ghost: {},
      link: {},
      destructive: {},
    },
    orientation: {
      horizontal: {
        root: 'flex-row [&>*:not(:last-child)]:(-me-px border-e-0) [&>*:not(:first-child)]:rounded-s-none [&>*:not(:last-child)]:rounded-e-none',
        separator: 'mx-px w-auto',
      },
      vertical: {
        root: 'flex-col [&>*:not(:last-child)]:(-mb-px border-b-0) [&>*:not(:first-child)]:rounded-t-none [&>*:not(:last-child)]:rounded-b-none',
        separator: 'my-px h-auto',
      },
    },
  },
})
