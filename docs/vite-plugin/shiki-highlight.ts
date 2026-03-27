import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine-javascript.mjs'

export type DocsHighlightLang = 'bash' | 'tsx' | 'css' | 'javascript'

const DOCS_HIGHLIGHTER_PROMISE = createHighlighterCore({
  themes: [import('shiki/themes/one-light.mjs'), import('shiki/themes/one-dark-pro.mjs')],
  langs: [
    import('shiki/langs/tsx.mjs'),
    import('shiki/langs/bash.mjs'),
    import('shiki/langs/css.mjs'),
    import('shiki/langs/javascript.mjs'),
  ],
  engine: createJavaScriptRegexEngine(),
})

export async function getDocsHighlighter() {
  return DOCS_HIGHLIGHTER_PROMISE
}
