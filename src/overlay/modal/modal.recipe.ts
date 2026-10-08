import { defineRecipe } from '../../theme/recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { ModalStyleSlot } from './modal.style-types'

export const modalDataAttributes = {
  overlay: /* @__PURE__ */ createDataAttributes('closed', 'expanded', 'overlay-scroll'),
  content: /* @__PURE__ */ createDataAttributes('closed', 'expanded'),
} satisfies DataAttributeContract<keyof ModalStyleSlot>

/** Default backdrop classes for modal overlays. */
export const MODAL_OVERLAY_CLASS =
  'bg-backdrop inset-0 fixed z-floating data-closed:(animate-mo-exit exit-opacity-0) data-expanded:(animate-mo-enter enter-opacity-0) motion-reduce:animate-none supports-[backdrop-filter]:backdrop-blur-[4px]'

/** Default transition classes for custom modal content. */
export const MODAL_CONTENT_CLASS =
  'outline-none rounded-xl bg-popover w-full shadow-overlay z-floating data-closed:(animate-mo-exit exit-opacity-0 exit-scale-95) data-expanded:(animate-mo-enter enter-opacity-0 enter-scale-95) motion-reduce:animate-none'

export const MODAL_CONTENT_DEFAULT_CLASS =
  'max-h-[calc(100%-2rem)] max-w-[calc(100%-2rem)] left-1/2 top-1/2 fixed sm:max-w-md -translate-x-1/2 -translate-y-1/2'

export const modalRecipe = /* @__PURE__ */ defineRecipe<ModalStyleSlot>('modal', {
  base: {
    overlay: `${MODAL_OVERLAY_CLASS} data-overlay-scroll:(p-4 overflow-y-auto)`,
    content: `${MODAL_CONTENT_CLASS}  ${MODAL_CONTENT_DEFAULT_CLASS}`,
  },
})
