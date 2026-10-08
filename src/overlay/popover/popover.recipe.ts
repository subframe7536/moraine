import { defineRecipe } from '../../theme/recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'
import {
  POPPER_CONTENT_MAX_HEIGHT_CLASS,
  POPPER_CONTENT_MAX_WIDTH_CLASS,
  POPPER_SIDE_CLASS,
} from '../base/popper.class'
import { overlayTriggerDataAttributes } from '../base/trigger.recipe'

import type { PopoverStyleSlot } from './popover.style-types'

export const popoverDataAttributes = {
  trigger: overlayTriggerDataAttributes,
  content: /* @__PURE__ */ createDataAttributes('closed', 'expanded', 'side', 'align'),
} satisfies DataAttributeContract<keyof PopoverStyleSlot>

export const popoverContentDataAttributes = /* @__PURE__ */ createDataAttributes('side', 'align')

export const popoverRecipe = /* @__PURE__ */ defineRecipe<PopoverStyleSlot>('popover', {
  base: {
    trigger: '',
    content: `text-popover-foreground outline-none border border-border rounded-md bg-popover flex flex-col gap-4 ${POPPER_CONTENT_MAX_WIDTH_CLASS} w-72 shadow-overlay origin-(--mo-popper-content-transform-origin) relative z-floating ${POPPER_SIDE_CLASS} data-closed:(animate-mo-exit exit-opacity-0 exit-scale-95) data-expanded:(animate-mo-enter enter-opacity-0 enter-scale-95) motion-reduce:animate-none`,
    body: `${POPPER_CONTENT_MAX_HEIGHT_CLASS} overflow-auto`,
  },
})
