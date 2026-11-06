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
    'handle',
  ),
  body: /* @__PURE__ */ createDataAttributes('header', 'footer'),
  header: /* @__PURE__ */ createDataAttributes('body'),
  footer: /* @__PURE__ */ createDataAttributes('body'),
} satisfies DataAttributeContract<keyof DrawerStyleSlot>

export const drawerRecipe = /* @__PURE__ */ defineRecipe<DrawerStyleSlot, DrawerStyleVariants>(
  'drawer',
  {
    base: {
      trigger: OVERLAY_TRIGGER_CLASS,
      '--drawer-swipe-movement': '0px',
      '--drawer-snap-point-offset': '0px',
      '--drawer-keyboard-inset': '0px',
      // Enter and exit share the stack-settle timing so an exiting nested
      // drawer stays mounted until ancestors reach their resting size.
      '--mo-anim-duration': '450ms',
      '--mo-anim-ease': 'cubic-bezier(0.32,0.72,0,1)',
      '--drawer-nested-scale':
        'calc(max(0, 1 - var(--nested-drawers) * 0.05) + var(--drawer-nested-progress) * 0.05)',
      '--drawer-nested-offset':
        'calc(max(0px, (var(--nested-drawers) - var(--drawer-nested-progress)) * (1.5rem - 1px)) + (1 - var(--drawer-nested-scale)) * var(--drawer-frontmost-height))',
      content: `text-sm text-popover-foreground outline-none bg-popover flex flex-col min-h-0 min-w-0 shadow-overlay transition-[transform,height,width] duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] fixed z-floating bg-clip-padding after:(rounded-[inherit] bg-black/0 pointer-events-none content-[''] transition-colors duration-450 inset-0 absolute) data-nested-swiping:(select-none transition-none after:duration-0) data-swiping:(select-none transition-none) motion-reduce:(transition-none animate-none) data-closed:animate-mo-exit data-expanded:animate-mo-enter data-nested-open:after:bg-[rgb(0_0_0/calc((var(--nested-drawers)-var(--drawer-nested-progress))*2%))] dark:data-nested-open:after:bg-[rgb(0_0_0/calc((var(--nested-drawers)-var(--drawer-nested-progress))*6%))]`,
      overlay: `${MODAL_OVERLAY_CLASS} transition-opacity duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:transition-none`,
      handle: 'mx-auto rounded-full bg-input shrink-0 h-1 w-12 inset-x-0 absolute',
      header: 'p-6 shrink-0 gap-2 grid auto-rows-min min-w-0 data-body:pb-3 max-sm:pb-4',
      title: 'text-foreground font-medium',
      description: 'text-sm text-muted-foreground',
      contentClose: `right-4 top-4 absolute ${OVERLAY_CLOSE_BUTTON_CLASS}`,
      body: 'p-6 flex-1 min-h-0 overflow-auto data-footer:pb-1 data-header:pt-1',
      footer:
        'mt-auto px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-4 flex shrink-0 flex-col-reverse gap-2 data-body:pt-3 sm:(flex-row items-center justify-end)',
    },
    defaultVariants: {
      side: 'bottom',
    },
    variants: {
      side: {
        bottom: {
          content:
            'pb-[max(env(safe-area-inset-bottom,0px),var(--drawer-keyboard-inset,0px))] will-change-transform border-t border-border rounded-t-[calc(var(--radius)*1.6)] max-h-[calc(100dvh-max(0.5rem,env(safe-area-inset-top,0px)))] origin-bottom translate-y-[calc(var(--drawer-snap-point-offset)_+_var(--drawer-swipe-movement)_-_var(--drawer-nested-offset))] scale-(--drawer-nested-scale) inset-x-0 bottom-0 enter-translate-y-full exit-translate-y-full data-handle:pt-2 data-nested-open:h-(--drawer-frontmost-height) data-nested-open:overflow-hidden',
          handle: 'top-3',
        },
        top: {
          content:
            'border-b rounded-b-[calc(var(--radius)*1.6)] max-h-[calc(100dvh-max(0.5rem,env(safe-area-inset-top,0px)))] translate-y-[calc(var(--drawer-swipe-movement)_-_var(--drawer-snap-point-offset))] inset-x-0 top-0 data-handle:pb-2 -enter-translate-y-full -exit-translate-y-full',
          handle: 'bottom-3',
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
