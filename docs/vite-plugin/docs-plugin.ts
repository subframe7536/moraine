import path from 'node:path'

import { exactRegex } from '@rolldown/pluginutils'
import { normalizePath } from 'vite'
import type { Plugin } from 'vite'

import { generateApiDoc } from './api-doc/extract'
import { loadApiDocIndex } from './api-doc/load'
import { writeJsonFiles } from './api-doc/write'
import { DOCS_PAGE_FILE_RE } from './core/paths'
import { DOCS_HIGHLIGHT_THEMES, getDocsHighlighter } from './core/shiki'
import {
  buildExamplePageEntries,
  buildExamplePagesModuleCode,
  readComponentNameMap,
  scanExamplePages,
} from './examples/pages'
import { transformExampleSourceModule } from './examples/source'
import { compileMarkdownPage } from './markdown/compile'

const VIRTUAL_API_DOC = 'virtual:api-doc'
const RESOLVED_VIRTUAL_API_DOC = '\0moraine-api-doc'
const VIRTUAL_EXAMPLE_PAGES = 'virtual:example-pages'
const RESOLVED_VIRTUAL_EXAMPLE_PAGES = '\0moraine-example-pages'
const VIRTUAL_ID_FILTER = new RegExp(
  `${exactRegex(VIRTUAL_API_DOC).source}|${exactRegex(VIRTUAL_EXAMPLE_PAGES).source}`,
)
const RESOLVED_VIRTUAL_ID_FILTER = /moraine-(api-doc|example-pages)$/
const DOCS_TRANSFORM_FILTER = /(?:\?example-source(?:&|$)|[\\/]docs[\\/]pages[\\/].*\.md$)/

function isExampleSourceRequest(id: string): boolean {
  return id.includes('?example-source')
}

function isDocsPageRequest(id: string): boolean {
  return DOCS_PAGE_FILE_RE.test(normalizePath(id))
}

export interface DocsPluginOptions {
  projectRoot?: string
}

export function docsPlugin(options: DocsPluginOptions = {}): Plugin {
  const highlighterPromise = getDocsHighlighter()
  let projectRoot = ''

  return {
    name: 'moraine-docs',
    enforce: 'pre',

    configResolved(config) {
      projectRoot = options.projectRoot ?? path.resolve(config.root, '..')
    },

    async buildStart() {
      const result = generateApiDoc(projectRoot)
      if (result) {
        await writeJsonFiles(path.join(projectRoot, 'docs/api-doc'), result)
      }
    },

    resolveId: {
      filter: {
        id: VIRTUAL_ID_FILTER,
      },
      handler(id) {
        if (id === VIRTUAL_API_DOC) {
          return RESOLVED_VIRTUAL_API_DOC
        }

        if (id === VIRTUAL_EXAMPLE_PAGES) {
          return RESOLVED_VIRTUAL_EXAMPLE_PAGES
        }

        return null
      },
    },

    load: {
      filter: {
        id: RESOLVED_VIRTUAL_ID_FILTER,
      },
      async handler(id) {
        if (id === RESOLVED_VIRTUAL_API_DOC) {
          const indexDoc = loadApiDocIndex(projectRoot)
          if (indexDoc) {
            return `export default ${JSON.stringify(indexDoc)}`
          }

          console.warn('[api-doc] index.json not found, serving empty data')
          return 'export default { components: [] }'
        }

        if (id === RESOLVED_VIRTUAL_EXAMPLE_PAGES) {
          try {
            const scannedPages = await scanExamplePages(projectRoot)
            const pages = buildExamplePageEntries(scannedPages, readComponentNameMap(projectRoot))
            return buildExamplePagesModuleCode(pages)
          } catch {
            console.warn('[example-pages] failed to scan docs/pages, serving empty data')
            return 'export const exampleMap = {}\nexport const pages = []\n'
          }
        }

        return null
      },
    },

    transform: {
      order: 'pre',
      filter: {
        id: DOCS_TRANSFORM_FILTER,
      },
      async handler(code, id) {
        const highlighter = await highlighterPromise

        if (!isExampleSourceRequest(id) && !isDocsPageRequest(id)) {
          return null
        }

        const sourceModule = transformExampleSourceModule(code, id, (source, lang) =>
          highlighter.codeToHtml(source, { lang, themes: DOCS_HIGHLIGHT_THEMES }),
        )
        if (sourceModule) {
          return sourceModule
        }

        const idWithoutQuery = id.split('?')[0] ?? id
        if (!isDocsPageRequest(idWithoutQuery)) {
          return null
        }

        return compileMarkdownPage(code, idWithoutQuery, {
          projectRoot,
          highlightCode: (source, lang) =>
            highlighter.codeToHtml(source, { lang, themes: DOCS_HIGHLIGHT_THEMES }),
        })
      },
    },
  }
}
