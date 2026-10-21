import path from 'pathe'
import type { Plugin } from 'vite'

import { generateApiDoc } from './api-doc/extract.ts'
import { loadApiDocIndex } from './api-doc/load.ts'
import { writeJsonFiles } from './api-doc/write.ts'
import {
  docsShikiStyleToClass,
  getDocsShikiCss,
  onDocsShikiClass,
  renderDocsCodeHtml,
} from './core/shiki.ts'
import { parsePreviewCode } from './previews/ast.ts'
import { transformPreviewModule } from './previews/module.ts'
import { transformPreviewSourceModule } from './previews/source.ts'
import { scanDocsPages } from './routes.ts'

const VIRTUAL_API_DOC = 'virtual:api-doc'
const RESOLVED_VIRTUAL_API_DOC = '\0moraine-api-doc'

const VIRTUAL_SHIKI_CSS = 'virtual:shiki.css'
const RESOLVED_VIRTUAL_SHIKI_CSS = '\0moraine-shiki.css'

const DOCS_TRANSFORM_FILTER = /(?:\?preview(?:&|$)|\?preview-source(?:&|$))/

export interface DocsBuildPluginOptions {
  projectRoot?: string
}

const API_DOC_GENERATION_BY_PROJECT = new Map<string, Promise<void>>()

interface PreviewRequest {
  sourcePath: string
  kind: 'preview' | 'source'
}

function parsePreviewRequest(id: string): PreviewRequest | null {
  const queryIndex = id.indexOf('?')
  if (queryIndex < 0) {
    return null
  }
  const params = new URLSearchParams(id.slice(queryIndex + 1))
  const kind = params.has('preview-source') ? 'source' : params.has('preview') ? 'preview' : null
  return kind ? { sourcePath: id.slice(0, queryIndex), kind } : null
}

async function transformDocs(
  code: string,
  id: string,
  options?: { ssr?: boolean },
): Promise<string | null> {
  const request = parsePreviewRequest(id)
  if (!request) {
    return null
  }

  if (request.kind === 'source') {
    const sourceModule = await transformPreviewSourceModule(
      code,
      parsePreviewCode,
      (source, lang) => {
        return renderDocsCodeHtml({
          code: source,
          language: lang,
          lineNumbers: true,
        })
      },
    )
    if (sourceModule) {
      return sourceModule
    }
  }

  if (request.kind === 'preview') {
    const previewModule = await transformPreviewModule(code, request.sourcePath, parsePreviewCode, {
      ssr: options?.ssr,
    })
    if (previewModule) {
      return previewModule
    }
  }

  return null
}

async function generateApiDocs(projectRoot: string): Promise<void> {
  const pages = scanDocsPages(projectRoot)
  const result = await generateApiDoc(projectRoot, pages)
  if (result.componentDocs.size === 0) {
    throw new Error(
      '[api-doc] No component declarations were generated; refusing to remove API docs.',
    )
  }
  await writeJsonFiles(path.join(projectRoot, 'docs/pages'), pages, result)
}

export function docsBuildPlugin(options: DocsBuildPluginOptions = {}): Plugin {
  let projectRoot = ''
  let generatedForBuild = false
  const ensureApiDocs = async () => {
    let promise = API_DOC_GENERATION_BY_PROJECT.get(projectRoot)
    if (!promise) {
      promise = generateApiDocs(projectRoot).finally(() => {
        API_DOC_GENERATION_BY_PROJECT.delete(projectRoot)
      })
      API_DOC_GENERATION_BY_PROJECT.set(projectRoot, promise)
    }
    await promise
  }

  return {
    name: 'moraine-docs-build',
    enforce: 'pre',
    sharedDuringBuild: true,

    async configResolved(config) {
      projectRoot = options.projectRoot ?? path.resolve(config.root, '..')
      if (config.command === 'build' && generatedForBuild) {
        return
      }
      await ensureApiDocs()
      generatedForBuild = config.command === 'build'
    },

    resolveId: {
      filter: {
        id: /^(?:virtual:api-doc|virtual:shiki\.css)$/,
      },
      handler(id) {
        if (id === VIRTUAL_API_DOC) {
          return RESOLVED_VIRTUAL_API_DOC
        }
        if (id === VIRTUAL_SHIKI_CSS) {
          return RESOLVED_VIRTUAL_SHIKI_CSS
        }
        return null
      },
    },

    load: {
      filter: {
        id: /(?:moraine-api-doc|moraine-shiki\.css)$/,
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
        if (id === RESOLVED_VIRTUAL_SHIKI_CSS) {
          return getDocsShikiCss()
        }
        return null
      },
    },

    configureServer(server) {
      onDocsShikiClass(() => {
        const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_SHIKI_CSS)
        if (mod) {
          server.moduleGraph.invalidateModule(mod)
          server.ws.send({
            type: 'update',
            updates: [
              {
                type: 'css-update',
                path: `/${VIRTUAL_SHIKI_CSS}`,
                acceptedPath: `/${VIRTUAL_SHIKI_CSS}`,
                timestamp: Date.now(),
              },
            ],
          })
        }
      })
    },

    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (
          file.type === 'asset' &&
          typeof file.source === 'string' &&
          file.fileName.endsWith('.css')
        ) {
          const missingRules: string[] = []
          for (const [className, style] of docsShikiStyleToClass.getClassRegistry().entries()) {
            if (!file.source.includes(`.${className}`)) {
              const str =
                typeof style === 'string'
                  ? style
                  : Object.entries(style)
                      .map(([k, v]) => `${k}:${v}`)
                      .join(';')
              missingRules.push(`.${className}{${str}}`)
            }
          }
          if (missingRules.length > 0) {
            file.source += `\n${missingRules.join('')}`
          }
          break
        }
      }
    },

    transform: {
      order: 'pre',
      filter: {
        id: DOCS_TRANSFORM_FILTER,
      },
      handler(code, id, options) {
        return transformDocs(code, id, options)
      },
    },
  }
}
