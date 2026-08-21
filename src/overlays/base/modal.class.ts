/** Default backdrop classes for modal overlays. */
export const MODAL_OVERLAY_CLASS =
  'bg-black/10 duration-150 inset-0 fixed z-floating supports-[backdrop-filter]:backdrop-blur-xs data-closed:animate-overlay-out data-expanded:animate-overlay-in motion-reduce:animate-none'

/** Default transition classes for custom modal content. */
export const MODAL_CONTENT_CLASS =
  'bg-popover rounded-xl shadow-xs outline-none w-full z-floating data-closed:animate-popup-out data-expanded:animate-popup-in motion-reduce:animate-none'

export const MODAL_CONTENT_DEFAULT_CLASS =
  'max-h-[calc(100%-2rem)] max-w-[calc(100%-2rem)] left-1/2 top-1/2 fixed sm:max-w-md -translate-x-1/2 -translate-y-1/2'
