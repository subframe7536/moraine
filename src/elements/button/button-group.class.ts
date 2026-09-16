import { slotRecipe } from '../../shared/style/recipe'

import type { ButtonGroupT } from './button-group.types'

export const buttonGroupRecipe = /* @__PURE__ */ slotRecipe<
  ButtonGroupT.Slot,
  ButtonGroupT.Variant
>({
  base: {
    root: 'inline-flex size-fit items-stretch *:focus-visible:(relative z-sticky)',
    separator: 'relative self-stretch bg-input',
  },
  defaults: {
    orientation: 'horizontal',
  },
  variants: {
    orientation: {
      horizontal: {
        root: 'flex-row [&>*:not([data-slot=button-group-separator]):not(:last-child):not(:has(+[data-slot=button-group-separator]))]:(-me-px border-e-0) [&>*:not([data-slot=button-group-separator]):has(+[data-slot=button-group-separator])]:border-e-0 [&>[data-slot=button-group-separator]+*:not([data-slot=button-group-separator])]:border-s-0 [&>*:not(:first-child)]:rounded-s-none [&>*:not(:last-child)]:rounded-e-none',
        separator: 'mx-px w-auto',
      },
      vertical: {
        root: 'flex-col [&>*:not([data-slot=button-group-separator]):not(:last-child):not(:has(+[data-slot=button-group-separator]))]:(-mb-px border-b-0) [&>*:not([data-slot=button-group-separator]):has(+[data-slot=button-group-separator])]:border-b-0 [&>[data-slot=button-group-separator]+*:not([data-slot=button-group-separator])]:border-t-0 [&>*:not(:first-child)]:rounded-t-none [&>*:not(:last-child)]:rounded-b-none',
        separator: 'my-px h-auto',
      },
    },
  },
})
