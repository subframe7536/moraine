import { slotRecipe } from '../../shared/style/recipe'

import type { ButtonGroupT } from './button-group.types'

export const buttonGroupRecipe = /* @__PURE__ */ slotRecipe<
  ButtonGroupT.Slot,
  ButtonGroupT.Variant
>({
  base: {
    root: 'inline-flex w-fit items-stretch *:focus-visible:(relative z-sticky)',
  },
  defaults: {
    orientation: 'horizontal',
  },
  variants: {
    orientation: {
      horizontal: {
        root: 'flex-row -[&>*:not(:last-child)]:me-px [&>*:not(:first-child)]:rounded-s-none [&>*:not(:last-child)]:rounded-e-none',
      },
      vertical: {
        root: 'flex-col -[&>*:not(:last-child)]:mb-px [&>*:not(:first-child)]:rounded-t-none [&>*:not(:last-child)]:rounded-b-none',
      },
    },
  },
})
