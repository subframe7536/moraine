import path from 'node:path'

import { exactRegex } from '@rolldown/pluginutils'
import type { Plugin } from 'vite'

import { runApiDocGeneration } from './plugins/api-doc-generator'
import { createDocsTransformHandler, DOCS_TRANSFORM_FILTER } from './plugins/transform-docs'
import {
  VIRTUAL_API_DOC,
  VIRTUAL_EXAMPLE_PAGES,
  loadDocsVirtualModule,
  resolveDocsVirtualId,
} from './plugins/virtual-modules'
import { createDocsPluginRegistry } from './registry'

const VIRTUAL_ID_FILTER = new RegExp(
  `${exactRegex(VIRTUAL_API_DOC).source}|${exactRegex(VIRTUAL_EXAMPLE_PAGES).source}`,
)
const RESOLVED_VIRTUAL_ID_FILTER = /moraine-(api-doc|example-pages)$/

export interface DocsPluginOptions {
  projectRoot?: string
}

export function docsPlugin(options: DocsPluginOptions = {}): Plugin {
  const registry = createDocsPluginRegistry()
  let projectRoot = ''
  const transformHandler = createDocsTransformHandler(() => projectRoot, registry)

  return {
    name: 'moraine-docs',
    enforce: 'pre',

    configResolved(config) {
      projectRoot = options.projectRoot ?? path.resolve(config.root, '..')
    },

    async buildStart() {
      await runApiDocGeneration(projectRoot)
    },

    resolveId: {
      filter: {
        id: VIRTUAL_ID_FILTER,
      },
      handler(id) {
        return resolveDocsVirtualId(id)
      },
    },

    load: {
      filter: {
        id: RESOLVED_VIRTUAL_ID_FILTER,
      },
      async handler(id) {
        return loadDocsVirtualModule(id, projectRoot)
      },
    },

    transform: {
      order: 'pre',
      filter: {
        id: DOCS_TRANSFORM_FILTER,
      },
      handler(code, id) {
        return transformHandler(code, id)
      },
    },
  }
}
