import path from 'pathe'
import type { Plugin } from 'vite'

import { generateApiDoc } from './api-doc/extract.ts'
import { loadApiDocIndex } from './api-doc/load.ts'
import { writeJsonFiles } from './api-doc/write.ts'
import { onDocsShikiClass, renderDocsCodeHtml } from './core/shiki.ts'
import { parsePreviewCode } from './previews/ast.ts'
import { transformPreviewModule } from './previews/module.ts'
import { transformPreviewSourceModule } from './previews/source.ts'
import { scanDocsPages } from './routes.ts'

const VIRTUAL_API_DOC = 'virtual:api-doc'
const RESOLVED_VIRTUAL_API_DOC = '\0moraine-api-doc'

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
      if (config.command === 'serve') {
        await Promise.all([
          renderDocsCodeHtml({
            code: "import { createSignal } from 'solid-js'\nexport const x = 1\nconst s = 'text'\n// comment",
            language: 'tsx',
          }),
          renderDocsCodeHtml({
            code: 'pnpm add moraine\n# install packages',
            language: 'bash',
          }),
          renderDocsCodeHtml({
            code: '{\n  "name": "moraine",\n  "private": true\n}',
            language: 'json',
          }),
        ]).catch(() => {})
      }
      generatedForBuild = config.command === 'build'
    },

    resolveId: {
      filter: {
        id: /^virtual:api-doc$/,
      },
      handler(id) {
        if (id === VIRTUAL_API_DOC) {
          return RESOLVED_VIRTUAL_API_DOC
        }
        return null
      },
    },

    load: {
      filter: {
        id: /moraine-api-doc$/,
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
        return null
      },
    },

    configureServer(server) {
      let scheduled = false
      onDocsShikiClass(() => {
        if (scheduled) {
          return
        }
        scheduled = true
        queueMicrotask(() => {
          scheduled = false
          const unoMods = Array.from(server.moduleGraph.idToModuleMap.values()).filter(
            (mod) => mod.id && /(?:^|[\\/])(?:virtual:)?uno(?:(?::|_).*)?\.css/.test(mod.id),
          )
          for (const mod of unoMods) {
            server.moduleGraph.invalidateModule(mod)
          }
          if (unoMods.length > 0) {
            const hot = server.hot ?? server.ws
            hot?.send({
              type: 'update',
              updates: unoMods.map((mod) => ({
                type: 'js-update',
                path: mod.url,
                acceptedPath: mod.url,
                timestamp: Date.now(),
              })),
            })
          }
        })
      })
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
