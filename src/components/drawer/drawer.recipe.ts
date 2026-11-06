import { defineRecipe } from '../../theme/recipe'
import { OVERLAY_CLOSE_BUTTON_CLASS } from '../../theme/recipe-common.recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'
import { MODAL_OVERLAY_CLASS } from '../modal/modal.recipe'
import {
  OVERLAY_TRIGGER_CLASS,
  overlayTriggerDataAttributes,
} from '../shared/overlay/trigger.recipe'

import type { DrawerStyleSlot, DrawerStyleVariants } from './drawer.style-types'

export const drawerDataAttributes = {
  trigger: overlayTriggerDataAttributes,
  overlay: /* @__PURE__ */ createDataAttributes('closed', 'expanded', 'swiping'),
  content: /* @__PURE__ */ createDataAttributes(
    'closed',
    'expanded',
    'swiping',
    'nested-open',
    'nested-swiping',
  ),
  body: /* @__PURE__ */ createDataAttributes('header'),
} satisfies DataAttributeContract<keyof DrawerStyleSlot>

export const drawerRecipe = /* @__PURE__ */ defineRecipe<DrawerStyleSlot, DrawerStyleVariants>(
  'drawer',
  {
    base: {
      trigger: OVERLAY_TRIGGER_CLASS,
      '--drawer-swipe-movement': '0px',
      '--drawer-snap-point-offset': '0px',
      '--drawer-keyboard-inset': '0px',
      '--drawer-nested-scale':
        'calc(max(0, 1 - var(--nested-drawers) * 0.05) + var(--drawer-nested-progress) * 0.05)',
      '--drawer-nested-offset':
        'calc(max(0px, (var(--nested-drawers) - var(--drawer-nested-progress)) * 1rem) + (1 - var(--drawer-nested-scale)) * var(--drawer-frontmost-height))',
      content: `text-sm text-popover-foreground pb-(--drawer-keyboard-inset) outline-none bg-popover flex flex-col min-h-0 min-w-0 shadow-overlay transition-[transform,height,width] duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] fixed z-floating bg-clip-padding after:(rounded-[inherit] bg-black/0 pointer-events-none content-[''] transition-colors duration-450 inset-0 absolute) data-nested-swiping:(select-none transition-none after:duration-0) data-swiping:(select-none transition-none) motion-reduce:(transition-none animate-none) data-closed:animate-mo-exit data-expanded:animate-mo-enter data-nested-open:after:bg-black/5`,
      overlay: `${MODAL_OVERLAY_CLASS} transition-opacity data-swiping:transition-none`,
      handle: 'mx-auto my-3 rounded-full bg-muted shrink-0 h-1.5 w-12',
      header: 'p-4 gap-0.5 grid auto-rows-min min-w-0',
      title: 'text-foreground font-medium',
      description: 'text-sm text-muted-foreground',
      contentClose: `right-4 top-4 absolute ${OVERLAY_CLOSE_BUTTON_CLASS}`,
      body: 'flex-1 overflow-auto data-header:(px-4 pb-4 pt-0)',
      footer: 'mt-auto p-4 flex flex-col gap-2',
    },
    defaultVariants: {
      side: 'bottom',
    },
    variants: {
      side: {
        bottom: {
          content:
            'will-change-transform border-t border-border rounded-t-2xl max-h-[calc(100dvh-4rem)] origin-bottom translate-y-[calc(var(--drawer-snap-point-offset)_+_var(--drawer-swipe-movement)_-_var(--drawer-nested-offset))] scale-(--drawer-nested-scale) inset-x-0 bottom-0 enter-translate-y-full exit-translate-y-full data-nested-open:h-(--drawer-frontmost-height) data-nested-open:overflow-hidden',
        },
        top: {
          content:
            'border-b rounded-b-2xl max-h-[calc(100dvh-4rem)] translate-y-[calc(var(--drawer-swipe-movement)_-_var(--drawer-snap-point-offset))] inset-x-0 top-0 -enter-translate-y-full -exit-translate-y-full',
          handle: 'order-last',
        },
        left: {
          content:
            'border-r border-border h-full w-3/4 translate-x-(--drawer-swipe-movement) inset-y-0 left-0 sm:max-w-sm -enter-translate-x-full -exit-translate-x-full',
        },
        right: {
          content:
            'border-l border-border h-full w-3/4 translate-x-(--drawer-swipe-movement) inset-y-0 right-0 enter-translate-x-full exit-translate-x-full sm:max-w-sm',
        },
      },
    },
  },
)
