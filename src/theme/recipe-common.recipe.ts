export const INPUT_VARIANT = {
  outline: 'border border-input bg-control shadow-input',
  subtle: 'border border-input bg-muted shadow-input',
  ghost:
    'hover:(bg-accent-hover text-accent-foreground accent-scope) focus-within:(bg-accent-hover text-accent-foreground accent-scope)',
  none: 'focus-within:ring-0',
} as const

export const TEXT_SIZE_VARIANT = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
} as const

export const PEER_CLASS = 'peer'
export const VISUALLY_HIDDEN_CLASS = 'sr-only'

// Keep selector-specific groups literal so CSS engines can discover every utility.
export const FOCUS_CLASS = 'focus:(border-ring ring-3 ring-ring/50)'
export const FOCUS_VISIBLE_CLASS = 'focus-visible:(outline-none border-ring ring-3 ring-ring/50)'
export const FOCUS_VISIBLE_RING_CLASS = 'focus-visible:(outline-none ring-3 ring-ring/50)'
export const BUTTON_FOCUS_VISIBLE_CLASS =
  'focus-visible:(outline-none ring-3 ring-tone/30 dark:ring-tone/30)'
export const FOCUS_WITHIN_CLASS = 'focus-within:(outline-none border-ring ring-3 ring-ring/50)'
export const PEER_FOCUS_CLASS = 'peer-focus:(border-ring ring-3 ring-ring/50)'
export const PEER_FOCUS_VISIBLE_CLASS =
  'peer-focus-visible:(outline-none border-ring ring-3 ring-ring/50)'
export const EDITABLE_FOCUS_WITHIN_CLASS =
  'data-editable:focus-within:(outline-none border-ring ring-3 ring-ring/50)'

export const DATA_INVALID_CLASS = 'data-invalid:(border-danger ring-3 ring-danger/20)'
export const DARK_DATA_INVALID_CLASS = 'dark:data-invalid:(border-danger/50 ring-danger/40)'
export const FOCUS_INVALID_CLASS =
  'focus:data-invalid:(border-danger ring-3 ring-danger/20) dark:focus:data-invalid:(border-danger/50 ring-danger/40)'
export const FOCUS_WITHIN_INVALID_CLASS =
  'focus-within:data-invalid:(border-danger ring-3 ring-danger/20) dark:focus-within:data-invalid:(border-danger/50 ring-danger/40)'
export const PEER_INVALID_CLASS =
  'peer-aria-[invalid=true]:border-danger peer-aria-[invalid=true]:ring-3 peer-aria-[invalid=true]:ring-danger/20 dark:peer-aria-[invalid=true]:border-danger/50 dark:peer-aria-[invalid=true]:ring-danger/40'
export const EDITABLE_FOCUS_WITHIN_INVALID_CLASS =
  'data-editable:focus-within:data-invalid:(border-danger ring-danger/20)'
export const DARK_EDITABLE_FOCUS_WITHIN_INVALID_CLASS =
  'dark:data-editable:focus-within:data-invalid:(border-danger/50 ring-danger/40)'

export const DISABLED_CLASS = 'disabled:(opacity-64 pointer-events-none)'
export const DATA_DISABLED_CLASS = 'data-disabled:(opacity-64 pointer-events-none)'
export const ARIA_DISABLED_CLASS = 'aria-disabled:(opacity-64 pointer-events-none)'

export const SELECT_TRIGGER_FOCUS_CLASS =
  "focus-visible:after:(border border-ring rounded-md pointer-events-none content-[''] ring-3 ring-ring/50 inset-0 absolute z-10) focus-visible:data-invalid:after:(border-danger ring-danger/20) dark:focus-visible:data-invalid:after:(border-danger/50 ring-danger/40)"

export const HIGHLIGHTED_MUTED_TEXT_CLASS =
  'text-muted-foreground data-highlighted:text-accent-foreground'

export const JOINED_ROW_CLASS =
  '-ms-px first-of-type:ms-0 first-of-type:rounded-s-lg last-of-type:rounded-e-lg'
export const JOINED_COLUMN_CLASS =
  '-mt-px first-of-type:mt-0 first-of-type:rounded-t-lg last-of-type:rounded-b-lg'

export const OVERLAY_CLOSE_BUTTON_CLASS = `rounded-md inline-flex size-8 items-center justify-center active:(text-accent-foreground bg-accent-active) hover:(text-accent-foreground bg-accent-hover) ${FOCUS_VISIBLE_RING_CLASS} disabled:(opacity-50 pointer-events-none)`

// Keep each tone-<tone> class literal so CSS engines can discover every utility.
export const TONE_CLASS = {
  primary: { root: 'tone-primary' },
  secondary: { root: 'tone-secondary' },
  neutral: { root: 'tone-neutral' },
  danger: { root: 'tone-danger' },
  info: { root: 'tone-info' },
  success: { root: 'tone-success' },
  warning: { root: 'tone-warning' },
} as const

/**
 * Utility class that hides the native scrollbar of a scroll container while it keeps scrolling.
 *
 * UnoCSS expands it as a shortcut; Tailwind declares the same properties in a utility, because
 * `@apply` drops the `::-webkit-scrollbar` variant.
 */
export const SCROLLBAR_NONE_CLASS = 'scrollbar-none'

/** Classes behind `SCROLLBAR_NONE_CLASS`: `scrollbar-width` for Firefox and current Chromium, the pseudo-element for older WebKit. */
export const SCROLLBAR_NONE_CLASSES = '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden'

/**
 * Utility class for the drop target presentation of `createTreeSortable` from `moraine/dnd`, which
 * sets `data-drop-position` on the item that is the parent of the row. The copy that follows the
 * pointer (`data-dnd-dragging`, while the item stays in place) gets a solid surface, the target row
 * keeps a muted background while the pointer is captured by the drag, and a straight line from the
 * label start marks `before` and `after`.
 *
 * UnoCSS expands it as a shortcut and Tailwind applies the same list in a utility.
 */
export const TREE_DROP_TARGET_CLASS = 'tree-drop-target'

/**
 * Classes behind `TREE_DROP_TARGET_CLASS`. Each `[...&]` variant matches the row by the state its
 * parent item carries, so the row only needs the one class. Variant groups are expanded at build
 * time because this is a class module; utilities inside a group use `[var(--x)]` instead of
 * `(--x)`, which the expansion cannot nest.
 */
export const TREE_DROP_TARGET_CLASSES = `[[data-dnd-dragging]>&]:(bg-popover ring-1 ring-border)
  [[data-drop-position]>&:not([data-selected])]:bg-muted
  [[data-drop-position=inside]>&]:(ring-2 ring-primary/60)
  [[data-drop-position=before]>&]:before:(content-[''] absolute h-0.5 rounded-full bg-primary pointer-events-none start-[var(--mo-tree-pad-start)] end-0 -top-px)
  [[data-drop-position=after]>&]:after:(content-[''] absolute h-0.5 rounded-full bg-primary pointer-events-none start-[var(--mo-tree-pad-start)] end-0 -bottom-px)`
