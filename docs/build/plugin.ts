import path from 'node:path'

import type { Plugin } from 'vite'

import { loadApiDocIndex } from './api-doc/load'
import { getDocsExpressiveCodeAssets } from './core/expressive-code'
import { ensureApiDocGeneration } from './plugins/api-doc-generator'
import { createDocsTransformHandler, DOCS_TRANSFORM_FILTER } from './plugins/transform-docs'

const VIRTUAL_API_DOC = 'virtual:api-doc'
const RESOLVED_VIRTUAL_API_DOC = '\0moraine-api-doc'
const VIRTUAL_EXPRESSIVE_CODE_CSS = 'virtual:docs-expressive-code.css'
const RESOLVED_VIRTUAL_EXPRESSIVE_CODE_CSS = '\0moraine-docs-expressive-code.css'
const VIRTUAL_EXPRESSIVE_CODE_CLIENT = 'virtual:docs-expressive-code-client'
const RESOLVED_VIRTUAL_EXPRESSIVE_CODE_CLIENT = '\0moraine-docs-expressive-code-client'
const VIRTUAL_DOCS_MODULE_FILTER =
  /^(?:virtual:api-doc|virtual:docs-expressive-code(?:\.css|-client))$/
const RESOLVED_VIRTUAL_DOCS_MODULE_FILTER =
  /moraine-(?:api-doc|docs-expressive-code(?:\.css|-client))$/

export interface DocsBuildPluginOptions {
  projectRoot?: string
}

const API_DOC_GENERATION_BY_PROJECT = new Map<string, Promise<void>>()

export function docsBuildPlugin(options: DocsBuildPluginOptions = {}): Plugin {
  let projectRoot = ''
  const transformHandler = createDocsTransformHandler()
  const ensureApiDocs = async () => {
    let promise = API_DOC_GENERATION_BY_PROJECT.get(projectRoot)
    if (!promise) {
      promise = ensureApiDocGeneration(projectRoot).finally(() => {
        API_DOC_GENERATION_BY_PROJECT.delete(projectRoot)
      })
      API_DOC_GENERATION_BY_PROJECT.set(projectRoot, promise)
    }
    await promise
  }

  return {
    name: 'moraine-docs-build',
    enforce: 'pre',

    async configResolved(config) {
      projectRoot = options.projectRoot ?? path.resolve(config.root, '..')
      await ensureApiDocs()
    },

    resolveId: {
      filter: {
        id: VIRTUAL_DOCS_MODULE_FILTER,
      },
      handler(id) {
        if (id === VIRTUAL_API_DOC) {
          return RESOLVED_VIRTUAL_API_DOC
        }
        if (id === VIRTUAL_EXPRESSIVE_CODE_CSS) {
          return RESOLVED_VIRTUAL_EXPRESSIVE_CODE_CSS
        }
        if (id === VIRTUAL_EXPRESSIVE_CODE_CLIENT) {
          return RESOLVED_VIRTUAL_EXPRESSIVE_CODE_CLIENT
        }
        return null
      },
    },

    load: {
      filter: {
        id: RESOLVED_VIRTUAL_DOCS_MODULE_FILTER,
      },
      async handler(id) {
        if (id === RESOLVED_VIRTUAL_EXPRESSIVE_CODE_CSS) {
          return (await getDocsExpressiveCodeAssets()).css
        }
        if (id === RESOLVED_VIRTUAL_EXPRESSIVE_CODE_CLIENT) {
          return (await getDocsExpressiveCodeAssets()).js
        }
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

    transform: {
      order: 'pre',
      filter: {
        id: DOCS_TRANSFORM_FILTER,
      },
      handler(code, id, options) {
        return transformHandler.call(this, code, id, options)
      },
    },
  }
}
