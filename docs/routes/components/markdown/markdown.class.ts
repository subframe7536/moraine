import { FOCUS_VISIBLE_RING_CLASS } from '../../../../src/theme/recipe-common.class'

export const DOCS_INLINE_CODE_CLASS = 'docs-inline-code'

export const DOCS_BLOCK_CONTAINER_CLASS =
  'group my-4 border border-border/70 rounded-xl bg-card/40 shadow-xs relative overflow-hidden'

export const DOCS_PREVIEW_CANVAS_CLASS =
  'p-6 bg-background/45 flex min-h-[160px] items-center justify-center relative sm:p-8'

export const DOCS_CODE_SOURCE_CLASS =
  'group my-0 border-t border-border/70 bg-card/30 relative overflow-hidden'

export const DOCS_BLOCK_HEADER_CLASS =
  'px-3 py-1.5 border-b border-border/60 bg-muted/40 flex h-10 items-center justify-between'

export const DOCS_CODE_CONTENT_CLASS =
  'text-sm leading-relaxed font-mono p-4 outline-none overflow-x-auto [&_pre]:m-0 [&_pre]:p-0 [&_pre]:outline-none [&_pre]:border-0! [&_pre]:rounded-none! [&_pre]:bg-transparent!'

export const DOCS_CODE_FALLBACK_PRE_CLASS =
  'scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent text-sm leading-relaxed font-mono m-0 p-4 outline-none overflow-x-auto'

export const DOCS_CODE_EXPAND_BUTTON_CLASS = `text-xs border-border/80 rounded-lg bg-background/95 shadow-xs bottom-3 left-1/2 absolute backdrop-blur-sm ${FOCUS_VISIBLE_RING_CLASS} -translate-x-1/2`

export const DOCS_TABS_ROOT_CLASS = DOCS_BLOCK_CONTAINER_CLASS
export const DOCS_TABS_LIST_CLASS =
  'p-1.5 border-b border-border/60 rounded-none bg-muted/40 w-full justify-start overflow-x-auto'
export const DOCS_TABS_INDICATOR_CLASS =
  'border border-border/60 rounded-lg bg-background shadow-none'
export const DOCS_TABS_TRIGGER_CLASS =
  'text-xs text-muted-foreground px-3 py-1 rounded-lg flex-none transition-colors duration-150 z-base data-selected:text-foreground data-selected:font-medium hover:not-disabled:text-foreground'
export const DOCS_TABS_CONTENT_CLASS = 'p-0 relative'

export const DOCS_DEMO_BLOCK_CLASS = DOCS_BLOCK_CONTAINER_CLASS
export const DOCS_DEMO_BLOCK_PREVIEW_CLASS = DOCS_PREVIEW_CANVAS_CLASS
