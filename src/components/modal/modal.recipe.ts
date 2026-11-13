import { defineRecipe } from '../../theme/recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { ModalStyleSlot } from './modal.style-types'

export const modalDataAttributes = {
  overlay: /* @__PURE__ */ createDataAttributes(
    'closed',
    'expanded',
    'overlay-scroll',
    'transition',
  ),
  content: /* @__PURE__ */ createDataAttributes('closed', 'expanded', 'transition'),
} satisfies DataAttributeContract<keyof ModalStyleSlot>

/** Default backdrop classes for modal overlays. */
export const MODAL_OVERLAY_CLASS =
  'bg-backdrop inset-0 fixed z-floating motion-reduce:animate-none supports-[backdrop-filter]:backdrop-blur-[4px] data-transition:data-closed:(animate-mo-exit exit-opacity-0) data-transition:data-expanded:(animate-mo-enter enter-opacity-0)'

/** Default transition classes for custom modal content. */
export const MODAL_CONTENT_CLASS =
  'text-popover-foreground outline-none rounded-xl bg-popover w-full shadow-overlay z-floating motion-reduce:animate-none data-transition:data-closed:(animate-mo-exit exit-opacity-0 exit-scale-95) data-transition:data-expanded:(animate-mo-enter enter-opacity-0 enter-scale-95)'

export const MODAL_CONTENT_FRAME_CLASS =
  'border border-border flex flex-col max-w-lg w-[calc(100vw-2rem)]'

export const MODAL_CONTENT_CENTERED_CLASS = 'm-auto h-fit inset-0 fixed'

export const MODAL_CONTENT_DEFAULT_CLASS = `${MODAL_CONTENT_FRAME_CLASS}  ${MODAL_CONTENT_CENTERED_CLASS} max-h-[calc(100dvh-2rem)] overflow-hidden sm:max-h-[calc(100dvh-4rem)]`

export const modalRecipe = /* @__PURE__ */ defineRecipe<ModalStyleSlot>('modal', {
  base: {
    overlay: `${MODAL_OVERLAY_CLASS} data-overlay-scroll:(p-4 overflow-y-auto)`,
    content: `${MODAL_CONTENT_CLASS}  ${MODAL_CONTENT_DEFAULT_CLASS}`,
  },
})
