/** Default backdrop classes for modal overlays. */
export const MODAL_OVERLAY_CLASS =
  'bg-black/10 inset-0 fixed z-floating supports-[backdrop-filter]:backdrop-blur-xs data-closed:animate-mo-exit data-closed:[--mo-exit-opacity:0] data-expanded:animate-mo-enter data-expanded:[--mo-enter-opacity:0] motion-reduce:animate-none'

/** Default transition classes for custom modal content. */
export const MODAL_CONTENT_CLASS =
  'bg-popover rounded-xl shadow-xs outline-none w-full z-floating data-closed:animate-mo-exit data-closed:[--mo-exit-opacity:0] data-closed:[--mo-exit-scale:0.95] data-expanded:animate-mo-enter data-expanded:[--mo-enter-opacity:0] data-expanded:[--mo-enter-scale:0.95] motion-reduce:animate-none'

export const MODAL_CONTENT_DEFAULT_CLASS =
  'max-h-[calc(100%-2rem)] max-w-[calc(100%-2rem)] left-1/2 top-1/2 fixed sm:max-w-md -translate-x-1/2 -translate-y-1/2'
