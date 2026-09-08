import { slotRecipe } from '../../shared/style/recipe.ts'

import type { ButtonGroupT } from './button-group.types.ts'

export const buttonGroupRecipe = /* @__PURE__ */ slotRecipe<keyof ButtonGroupT.Slot>({
  base: {
    root: 'inline-flex w-fit items-stretch *:focus-visible:(relative z-sticky)',
    separator: 'bg-input shrink-0 self-stretch',
  },
  defaults: {
    orientation: 'horizontal',
  },
  variants: {
    orientation: {
      horizontal: {
        root: 'flex-row [&>[data-slot=separator]]:mx-px [&>*:not(:first-child)]:(border-s-0 rounded-s-none) [&>*:not(:last-child)]:rounded-e-none',
        separator: 'h-full w-px',
      },
      vertical: {
        root: 'flex-col [&>[data-slot=separator]]:my-px [&>*:not(:first-child)]:(border-t-0 rounded-t-none) [&>*:not(:last-child)]:rounded-b-none',
        separator: 'h-px w-full',
      },
    },
  },
})
