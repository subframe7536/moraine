import { defineRecipe } from '../../theme/recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'
import { POPPER_CONTENT_MAX_WIDTH_CLASS, POPPER_SIDE_CLASS } from '../shared/overlay/popper.recipe'
import { overlayTriggerDataAttributes } from '../shared/overlay/trigger.recipe'

import type { HoverCardStyleSlot } from './hover-card.style-types'
export const hoverCardDataAttributes = {
  trigger: overlayTriggerDataAttributes,
  content: /* @__PURE__ */ createDataAttributes(
    'closed',
    'expanded',
    'instant-motion',
    'side',
    'align',
  ),
} satisfies DataAttributeContract<keyof HoverCardStyleSlot>

export const hoverCardContentDataAttributes = /* @__PURE__ */ createDataAttributes(
  'instant-motion',
  'side',
  'align',
)

export const hoverCardRecipe = /* @__PURE__ */ defineRecipe<HoverCardStyleSlot>('hover-card', {
  base: {
    trigger: '',
    content: `text-popover-foreground p-4 outline-none border border-border rounded-md bg-popover w-64 shadow-overlay origin-(--mo-popper-content-transform-origin) relative z-floating ${POPPER_CONTENT_MAX_WIDTH_CLASS}  ${POPPER_SIDE_CLASS} data-closed:(animate-mo-exit exit-opacity-0 exit-scale-95) data-expanded:(animate-mo-enter enter-opacity-0 enter-scale-95) motion-reduce:animate-none data-instant-motion:data-closed:animate-none data-instant-motion:data-expanded:animate-none`,
  },
})
