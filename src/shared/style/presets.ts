/** Loading styles. LOADING_SPINNER applies only to the icon/spinner slot. */
export const LOADING_SPINNER = 'cursor-wait opacity-80 animate-spin'

/** Surface and layout styles. */
export const SURFACE_OVERLAY = 'border border-border shadow-md'

/** Animation styles registered by the required engine integration. */
export const POPUP_ENTER =
  'data-expanded:animate-mo-enter data-expanded:[--mo-enter-opacity:0] data-expanded:[--mo-enter-scale:0.95]'
export const POPUP_EXIT =
  'data-closed:animate-mo-exit data-closed:[--mo-exit-opacity:0] data-closed:[--mo-exit-scale:0.95]'

export const MENU_SIDE_TOP = '[--mo-enter-translate-y:0.25rem] [--mo-exit-translate-y:0.25rem]'
export const MENU_SIDE_RIGHT = '[--mo-enter-translate-x:-0.25rem] [--mo-exit-translate-x:-0.25rem]'
export const MENU_SIDE_BOTTOM = '[--mo-enter-translate-y:-0.25rem] [--mo-exit-translate-y:-0.25rem]'
export const MENU_SIDE_LEFT = '[--mo-enter-translate-x:0.25rem] [--mo-exit-translate-x:0.25rem]'
