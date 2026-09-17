import { defineRecipe } from '../../theme/style/recipe'

import type { CollapsibleStyleSlot } from './collapsible.style-types'

export const COLLAPSIBLE_TRANSITION_CLASS =
  'data-transition:h-(--mo-collapsible-content-height) data-transition:overflow-hidden data-transition:data-expanded:animate-accordion-down data-transition:data-closed:(h-0 animate-accordion-up) data-transition:motion-reduce:animate-none'

/** data-transition enables measured height animation on the content wrapper. */
export const collapsibleRecipe = /* @__PURE__ */ defineRecipe<'collapsible', CollapsibleStyleSlot>(
  'collapsible',
  {
    base: {
      root: '',
      trigger: '',
      contentWrapper: COLLAPSIBLE_TRANSITION_CLASS,
      content: '',
    },
  },
)
