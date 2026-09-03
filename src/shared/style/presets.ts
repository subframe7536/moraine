/**
 * 1. Focus Ring Presets (Outline & Ring)
 * Replaces: 'effect-fv' and 'effect-fv-border'
 */
export const FOCUS_VISIBLE_RING =
  'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

export const HOVER_RING = 'hover:outline-none hover:ring-3 hover:ring-ring/50'

export const FOCUS_VISIBLE_RING_BORDER =
  'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export const FOCUS_WITHIN_RING_BORDER =
  'focus-within:outline-none focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50'

export const PEER_FOCUS_VISIBLE_RING_BORDER =
  'peer-focus-visible:outline-none peer-focus-visible:border-ring peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50'

export const DATA_FOCUSED_RING_BORDER =
  'data-focused:outline-none data-focused:border-ring data-focused:ring-3 data-focused:ring-ring/50'

/**
 * 2. Disabled State Presets
 * Replaces: 'effect-dis'
 */
export const DISABLED_EFFECT = 'disabled:opacity-64 disabled:pointer-events-none'

export const ARIA_DISABLED_EFFECT = 'aria-disabled:opacity-64 aria-disabled:pointer-events-none'

export const DATA_DISABLED_EFFECT = 'data-disabled:opacity-64 data-disabled:pointer-events-none'

export const INTERACTION_DISABLED =
  'disabled:opacity-64 disabled:pointer-events-none aria-disabled:opacity-64 aria-disabled:pointer-events-none data-disabled:opacity-64 data-disabled:pointer-events-none'

/**
 * 3. Invalid State Presets
 * Replaces: 'effect-invalid'
 */
export const DATA_INVALID_BORDER =
  'data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40'

export const ARIA_INVALID_BORDER =
  'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40'

export const FOCUS_WITHIN_DATA_INVALID_BORDER =
  'focus-within:data-invalid:border-destructive focus-within:data-invalid:ring-3 focus-within:data-invalid:ring-destructive/20 dark:focus-within:data-invalid:border-destructive/50 dark:focus-within:data-invalid:ring-destructive/40'

export const FOCUS_VISIBLE_DATA_INVALID_BORDER =
  'focus-visible:data-invalid:border-destructive focus-visible:data-invalid:ring-3 focus-visible:data-invalid:ring-destructive/20 dark:focus-visible:data-invalid:border-destructive/50 dark:focus-visible:data-invalid:ring-destructive/40'

export const DATA_FOCUSED_DATA_INVALID_BORDER =
  'data-focused:data-invalid:border-destructive data-focused:data-invalid:ring-3 data-focused:data-invalid:ring-destructive/20 dark:data-focused:data-invalid:border-destructive/50 dark:data-focused:data-invalid:ring-destructive/40'

/**
 * 4. Loading & Animation Presets
 * Replaces: 'effect-loading'
 * Note: LOADING_SPINNER applies strictly to the icon/spinner slot, NOT the root control.
 */
export const LOADING_SPINNER = 'cursor-wait opacity-80 animate-spin'

export const ROOT_LOADING = 'aria-busy:cursor-wait data-loading:cursor-wait'

/**
 * 5. Surface & Layout Presets
 * Replaces: 'surface-overlay', 'hidden-hitless', 'rm-side-b'
 */
export const SURFACE_OVERLAY = 'border border-border shadow-md'

export const HIDDEN_HITLESS = 'opacity-0 pointer-events-none'

export const RM_SIDE_BORDER = '[&>[data-slot=sidebar]]:border-0!'

/**
 * 6. Element Style Presets
 * Replaces: 'style-placeholder', 'style-input-number', 'style-accordion-content', 'transition-bg'
 */
export const STYLE_PLACEHOLDER = 'placeholder:text-muted-foreground placeholder:select-none'

export const STYLE_INPUT_NUMBER =
  '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

export const STYLE_ACCORDION_CONTENT =
  '[&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4'

export const TRANSITION_BG = '[transition-property:background-color]'

/**
 * 7. Semantic Animation Presets
 * Replaces UnoCSS-only animate-{target}-{phase/side} shortcuts in src/.
 * These constants expand to utilities registered by the required engine integration.
 */
export const OVERLAY_ENTER = 'data-expanded:animate-mo-enter data-expanded:[--mo-enter-opacity:0]'
export const OVERLAY_EXIT = 'data-closed:animate-mo-exit data-closed:[--mo-exit-opacity:0]'
export const POPUP_ENTER =
  'data-expanded:animate-mo-enter data-expanded:[--mo-enter-opacity:0] data-expanded:[--mo-enter-scale:0.95]'
export const POPUP_EXIT =
  'data-closed:animate-mo-exit data-closed:[--mo-exit-opacity:0] data-closed:[--mo-exit-scale:0.95]'

export const MENU_SIDE_TOP = '[--mo-enter-translate-y:0.25rem] [--mo-exit-translate-y:0.25rem]'
export const MENU_SIDE_RIGHT = '[--mo-enter-translate-x:-0.25rem] [--mo-exit-translate-x:-0.25rem]'
export const MENU_SIDE_BOTTOM = '[--mo-enter-translate-y:-0.25rem] [--mo-exit-translate-y:-0.25rem]'
export const MENU_SIDE_LEFT = '[--mo-enter-translate-x:0.25rem] [--mo-exit-translate-x:0.25rem]'

export const POPOVER_SIDE_TOP = '[--mo-enter-translate-y:0.5rem] [--mo-exit-translate-y:0.5rem]'
export const POPOVER_SIDE_RIGHT = '[--mo-enter-translate-x:-0.5rem] [--mo-exit-translate-x:-0.5rem]'
export const POPOVER_SIDE_BOTTOM =
  '[--mo-enter-translate-y:-0.5rem] [--mo-exit-translate-y:-0.5rem]'
export const POPOVER_SIDE_LEFT = '[--mo-enter-translate-x:0.5rem] [--mo-exit-translate-x:0.5rem]'

export const TOOLTIP_SIDE_TOP = '[--mo-enter-translate-y:0.25rem] [--mo-exit-translate-y:0.25rem]'
export const TOOLTIP_SIDE_RIGHT =
  '[--mo-enter-translate-x:-0.25rem] [--mo-exit-translate-x:-0.25rem]'
export const TOOLTIP_SIDE_BOTTOM =
  '[--mo-enter-translate-y:-0.25rem] [--mo-exit-translate-y:-0.25rem]'
export const TOOLTIP_SIDE_LEFT = '[--mo-enter-translate-x:0.25rem] [--mo-exit-translate-x:0.25rem]'

export const SHEET_SIDE_TOP = '[--mo-enter-translate-y:-2.5rem] [--mo-exit-translate-y:-2.5rem]'
export const SHEET_SIDE_RIGHT = '[--mo-enter-translate-x:2.5rem] [--mo-exit-translate-x:2.5rem]'
export const SHEET_SIDE_BOTTOM = '[--mo-enter-translate-y:2.5rem] [--mo-exit-translate-y:2.5rem]'
export const SHEET_SIDE_LEFT = '[--mo-enter-translate-x:-2.5rem] [--mo-exit-translate-x:-2.5rem]'

/**
 * 8. Semantic z-index scale
 */
export const Z_BASE = 'z-base'
export const Z_RAISED = 'z-raised'
export const Z_CONTROL = 'z-control'
export const Z_STICKY = 'z-sticky'
export const Z_RESIZE = 'z-resize'
export const Z_OVERLAY = 'z-overlay'
export const Z_FLOATING = 'z-floating'
