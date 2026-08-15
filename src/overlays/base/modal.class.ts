/** Default backdrop classes for modal overlays. */
export const MODAL_OVERLAY_CLASS =
  'bg-black/10 duration-150 inset-0 fixed z-50 supports-[backdrop-filter]:backdrop-blur-xs data-closed:animate-overlay-out data-expanded:animate-overlay-in motion-reduce:animate-none'

/** Default transition classes for custom modal content. */
export const MODAL_CONTENT_CLASS =
  'outline-none w-full z-50 data-closed:animate-popup-out data-expanded:animate-popup-in motion-reduce:animate-none'
