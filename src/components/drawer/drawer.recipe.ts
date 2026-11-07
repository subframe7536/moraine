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

/** Motion tuning shared by content transitions and the overlay's enter/exit anims. */
export const DRAWER_MOTION = {
  // Enter and exit share the stack-settle timing so an exiting nested
  // drawer stays mounted until ancestors reach their resting size.
  '--mo-anim-duration': '450ms',
  '--mo-anim-ease': 'cubic-bezier(0.32,0.72,0,1)',
} as const

export const drawerDataAttributes = {
  trigger: overlayTriggerDataAttributes,
  overlay: /* @__PURE__ */ createDataAttributes('closed', 'expanded', 'swiping'),
  content: /* @__PURE__ */ createDataAttributes(
    'closed',
    'expanded',
    'entering',
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
      '--drawer-translate': '0px',
      '--drawer-max-height': 'calc(100dvh - max(0.5rem, env(safe-area-inset-top, 0px)))',
      '--drawer-safe-area-bottom': 'env(safe-area-inset-bottom, 0px)',
      '--drawer-bottom-inset':
        'max(var(--drawer-safe-area-bottom), var(--drawer-keyboard-inset, 0px))',
      '--drawer-nested-depth': 'calc(var(--drawer-nested-num) - var(--drawer-nested-progress))',
      '--drawer-nested-scale':
        'calc(max(0, 1 - var(--drawer-nested-num) * 0.05) + var(--drawer-nested-progress) * 0.05)',
      '--drawer-nested-offset':
        'calc(max(0px, var(--drawer-nested-depth) * (1.5rem - 1px)) + (1 - var(--drawer-nested-scale)) * var(--drawer-frontmost-height))',
      ...DRAWER_MOTION,
      content: `text-sm text-popover-foreground outline-none border-border bg-popover flex flex-col min-h-0 min-w-0 shadow-overlay transition-[transform,height,width] duration-(--mo-anim-duration) ease-(--mo-anim-ease) fixed z-floating bg-clip-padding data-closed:(pointer-events-none animate-mo-exit) data-nested-swiping:(select-none transition-none) data-swiping:(select-none transition-none) motion-reduce:(transition-none animate-none) data-entering:animate-mo-enter`,
      overlay: `${MODAL_OVERLAY_CLASS} transition-opacity data-swiping:transition-none`,
      handle: 'mx-auto rounded-full bg-input shrink-0 h-1 w-12 inset-x-0 absolute',
      header: 'p-6 shrink-0 gap-2 grid auto-rows-min min-w-0 data-body:pb-3 max-sm:pb-4',
      title: 'text-foreground font-medium',
      description: 'text-sm text-muted-foreground',
      contentClose: `right-4 top-4 absolute ${OVERLAY_CLOSE_BUTTON_CLASS}`,
      body: 'p-6 flex-1 min-h-0 overflow-auto data-footer:pb-1 data-header:pt-1',
      footer:
        'mt-auto px-6 pb-[calc(1.5rem+var(--drawer-safe-area-bottom))] pt-4 flex shrink-0 flex-col-reverse gap-2 data-body:pt-3 sm:(flex-row items-center justify-end)',
    },
    defaultVariants: {
      side: 'bottom',
    },
    variants: {
      side: {
        bottom: {
          '--drawer-translate':
            'calc(var(--drawer-snap-point-offset) + var(--drawer-swipe-movement) - var(--drawer-nested-offset))',
          content:
            "pb-(--drawer-bottom-inset) will-change-transform border-t rounded-t-xl max-h-(--drawer-max-height) origin-bottom translate-y-(--drawer-translate) scale-(--drawer-nested-scale) inset-x-0 bottom-0 enter-translate-y-full exit-translate-y-full data-handle:pt-2 before:(bg-inherit h-[100dvh] pointer-events-none content-[''] inset-x-0 top-full absolute) data-nested-open:h-(--drawer-frontmost-height) data-nested-open:overflow-hidden",
          handle: 'top-3',
        },
        top: {
          '--drawer-translate':
            'calc(var(--drawer-swipe-movement) - var(--drawer-snap-point-offset))',
          content:
            "border-b rounded-b-xl max-h-(--drawer-max-height) translate-y-(--drawer-translate) inset-x-0 top-0 data-handle:pb-2 before:(bg-inherit h-[100dvh] pointer-events-none content-[''] inset-x-0 bottom-full absolute) -enter-translate-y-full -exit-translate-y-full",
          handle: 'bottom-3',
        },
        left: {
          '--drawer-translate': 'var(--drawer-swipe-movement)',
          content:
            "border-r h-full w-3/4 translate-x-(--drawer-translate) inset-y-0 left-0 before:(bg-inherit w-[100dvw] pointer-events-none content-[''] inset-y-0 right-full absolute) sm:max-w-sm -enter-translate-x-full -exit-translate-x-full",
        },
        right: {
          '--drawer-translate': 'var(--drawer-swipe-movement)',
          content:
            "border-l h-full w-3/4 translate-x-(--drawer-translate) inset-y-0 right-0 enter-translate-x-full exit-translate-x-full before:(bg-inherit w-[100dvw] pointer-events-none content-[''] inset-y-0 left-full absolute) sm:max-w-sm",
        },
      },
    },
  },
)
