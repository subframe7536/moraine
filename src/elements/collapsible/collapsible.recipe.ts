import type { DataAttributeContract } from '../../shared/style-contract.ts'
import { createDataAttributes } from '../../shared/style-contract.ts'
import { defineRecipe } from '../../theme/style/recipe'

import type { CollapsibleStyleSlot } from './collapsible.style-types'

export const collapsibleDataAttributes = {
  root: createDataAttributes('closed', 'expanded'),
  trigger: createDataAttributes('closed', 'disabled', 'expanded'),
  content: createDataAttributes('closed', 'expanded', 'transition'),
} satisfies DataAttributeContract<keyof CollapsibleStyleSlot>

// The height wrapper is implementation-only: it needs library styling for
// measurement and presence, but is not a stable family styling responsibility.
export const COLLAPSIBLE_CONTENT_WRAPPER_CLASS =
  'data-transition:h-(--mo-collapsible-content-height) data-transition:overflow-hidden data-transition:data-expanded:animate-accordion-down data-transition:data-closed:h-0 data-transition:data-closed:animate-accordion-up data-transition:motion-reduce:animate-none'

export const collapsibleRecipe = /* @__PURE__ */ defineRecipe<CollapsibleStyleSlot>('collapsible', {
  base: {
    root: '',
    trigger: '',
    content: '',
  },
})
