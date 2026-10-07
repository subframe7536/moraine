import { defineRecipe } from '../../theme/recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'
import { POPPER_SIDE_CLASS } from '../base/popper.class'
import { overlayTriggerDataAttributes } from '../base/trigger.recipe'

import type { TooltipStyleSlot, TooltipStyleVariant } from './tooltip.style-types'

export const TOOLTIP_POSITIONER_CLASS =
  'motion-reduce:transition-none motion-safe:has-[[data-instant-motion]]:data-positioned:transition-transform'

export const tooltipDataAttributes = {
  trigger: overlayTriggerDataAttributes,
  content: createDataAttributes('closed', 'expanded', 'instant-motion', 'side', 'align'),
} satisfies DataAttributeContract<keyof TooltipStyleSlot>

export const tooltipContentDataAttributes = createDataAttributes('instant-motion', 'side', 'align')

export const tooltipRecipe = /* @__PURE__ */ defineRecipe<TooltipStyleSlot, TooltipStyleVariant>(
  'tooltip',
  {
    base: {
      trigger: '',
      content: `text-xs px-1.5 py-0.5 outline-none rounded-md flex gap-1 max-w-xs w-fit origin-(--mo-popper-content-transform-origin) items-center z-floating ${POPPER_SIDE_CLASS} data-closed:(animate-mo-exit exit-opacity-0 exit-scale-95) data-expanded:(animate-mo-enter enter-opacity-0 enter-scale-95) motion-reduce:animate-none data-instant-motion:data-closed:animate-none data-instant-motion:data-expanded:animate-none`,
      text: 'leading-4 text-pretty',
      kbds: 'rounded-sm relative z-floating isolate',
    },
    defaultVariants: {
      invert: false,
    },
    variants: {
      invert: {
        true: { content: 'text-background bg-foreground' },
        false: {
          content: 'text-foreground border border-border bg-background shadow-overlay',
        },
      },
    },
  },
)
