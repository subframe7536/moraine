import { defineRecipe } from '../../theme/recipe'
import type { DataAttributeContract } from '../../theme/style-contract'
import { createDataAttributes } from '../../theme/style-contract'

import type { CollapsibleStyleSlot } from './collapsible.style-types'

export const collapsibleDataAttributes = {
  root: /* @__PURE__ */ createDataAttributes('closed', 'expanded'),
  trigger: /* @__PURE__ */ createDataAttributes('closed', 'disabled', 'expanded'),
  content: /* @__PURE__ */ createDataAttributes('closed', 'expanded'),
} satisfies DataAttributeContract<keyof CollapsibleStyleSlot>

export const collapsibleWrapperDataAttributes = /* @__PURE__ */ createDataAttributes(
  'closed',
  'expanded',
  'transition',
)

// The height wrapper is implementation-only: it needs library styling for
// measurement and presence, but is not a stable family styling responsibility.
export const COLLAPSIBLE_CONTENT_WRAPPER_CLASS =
  'data-transition:h-(--mo-collapsible-content-height) data-transition:overflow-hidden data-transition:data-closed:h-0 data-transition:data-closed:animate-accordion-up data-transition:data-expanded:animate-accordion-down data-transition:motion-reduce:animate-none'

export const collapsibleRecipe = /* @__PURE__ */ defineRecipe<CollapsibleStyleSlot>('collapsible', {
  base: {
    root: '',
    trigger: '',
    content: '',
  },
})
