import { slotRecipe } from '../../shared/style/recipe.ts'

import type { ModalT } from './modal.types.ts'

/** Default backdrop classes for modal overlays. */
export const MODAL_OVERLAY_CLASS =
  'bg-black/10 inset-0 fixed z-floating supports-[backdrop-filter]:backdrop-blur-xs data-closed:(animate-mo-exit exit-opacity-0) data-expanded:(animate-mo-enter enter-opacity-0) motion-reduce:animate-none'

/** Default transition classes for custom modal content. */
export const MODAL_CONTENT_CLASS =
  'bg-popover rounded-xl shadow-xs outline-none w-full z-floating data-closed:(animate-mo-exit exit-opacity-0 exit-scale-95) data-expanded:(animate-mo-enter enter-opacity-0 enter-scale-95) motion-reduce:animate-none'

export const MODAL_CONTENT_DEFAULT_CLASS =
  'max-h-[calc(100%-2rem)] max-w-[calc(100%-2rem)] left-1/2 top-1/2 fixed sm:max-w-md -translate-x-1/2 -translate-y-1/2'

export const modalRecipe = /* @__PURE__ */ slotRecipe<ModalT.Slot, ModalT.Variant>({
  base: {
    overlay: `${MODAL_OVERLAY_CLASS} data-overlay-scroll:(p-4 overflow-y-auto)`,
    content: `${MODAL_CONTENT_CLASS} ${MODAL_CONTENT_DEFAULT_CLASS}`,
  },
})
