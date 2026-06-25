import path from 'node:path'

import { exactRegex } from '@rolldown/pluginutils'
import type { Plugin } from 'vite'

import { loadApiDocIndex } from './api-doc/load'
import { runApiDocGeneration } from './plugins/api-doc-generator'
import { createDocsTransformHandler, DOCS_TRANSFORM_FILTER } from './plugins/transform-docs'

const VIRTUAL_API_DOC = 'virtual:api-doc'
const RESOLVED_VIRTUAL_API_DOC = '\0moraine-api-doc'
const VIRTUAL_API_DOC_FILTER = exactRegex(VIRTUAL_API_DOC)
const RESOLVED_VIRTUAL_API_DOC_FILTER = /moraine-api-doc$/

export interface DocsBuildPluginOptions {
  projectRoot?: string
}

const API_DOC_GENERATION_BY_PROJECT = new Map<string, Promise<void>>()

export function docsBuildPlugin(options: DocsBuildPluginOptions = {}): Plugin {
  let projectRoot = ''
  const transformHandler = createDocsTransformHandler(() => projectRoot)
  const ensureApiDocs = async () => {
    let promise = API_DOC_GENERATION_BY_PROJECT.get(projectRoot)
    if (!promise) {
      promise = runApiDocGeneration(projectRoot)
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
        id: VIRTUAL_API_DOC_FILTER,
      },
      handler(id) {
        return id === VIRTUAL_API_DOC ? RESOLVED_VIRTUAL_API_DOC : null
      },
    },

    load: {
      filter: {
        id: RESOLVED_VIRTUAL_API_DOC_FILTER,
      },
      handler(id) {
        if (id !== RESOLVED_VIRTUAL_API_DOC) {
          return null
        }

        const indexDoc = loadApiDocIndex(projectRoot)
        if (indexDoc) {
          return `export default ${JSON.stringify(indexDoc)}`
        }

        console.warn('[api-doc] index.json not found, serving empty data')
        return 'export default { components: [] }'
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
