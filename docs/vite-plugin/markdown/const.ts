export const MARKDOWN_ANCHOR_HEADING_CLASS = 'group scroll-mt-12'
export const MARKDOWN_ANCHOR_LINK_CLASS =
  'text-lg text-muted-foreground font-bold ms-2 opacity-0 inline-block no-underline transition-opacity focus:opacity-80 group-hover:opacity-80'

// Keep widget heading anchors and markdown-it heading anchors consistent.
export const DOCS_HEADING_ANCHOR_ARIA_LABEL = 'Link to this section'

// Typography shortcut class names injected by the markdown-it renderer pipeline.
// Each constant is declared here so UnoCSS content-scanning picks them up.
export const DOCS_H_CLASS_BY_LEVEL: Readonly<Record<number, string>> = {
  1: 'docs-h1',
  2: 'docs-h2',
  3: 'docs-h3',
  4: 'docs-h4',
  5: 'docs-h5',
}
export const DOCS_P_CLASS = 'docs-p'
export const DOCS_UL_CLASS = 'docs-ul'
export const DOCS_OL_CLASS = 'docs-ol'
export const DOCS_LI_CLASS = 'docs-li'
export const DOCS_A_CLASS = 'docs-a'
export const DOCS_BLOCKQUOTE_CLASS = 'docs-blockquote'
export const DOCS_STRONG_CLASS = 'docs-strong'
export const DOCS_HR_CLASS = 'docs-hr'
export const DOCS_INLINE_CODE_CLASS = 'docs-inline-code'
export const DOCS_PRE_CLASS = 'docs-pre'
export const DOCS_CODE_BLOCK_CLASS = 'docs-code-block'
export const DOCS_CODE_BLOCK_INNER_CLASS = 'docs-code-block-inner'
// These atomic utilities must live here so UnoCSS content-scanning picks them up.
export const DOCS_CODE_PRE_EXTRA_CLASS = 'm-0 p-4'
