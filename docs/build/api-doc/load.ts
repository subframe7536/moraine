import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { collectMarkdownFiles, resolveDocsPageContext } from '../core/paths'

import type { ComponentApi, IndexDoc } from './types'

const apiDocIndexCache = new Map<string, IndexDoc | null>()
const componentDocCache = new Map<string, ComponentApi | null>()

export function clearApiDocCache(projectRoot?: string): void {
  if (projectRoot) {
    apiDocIndexCache.delete(projectRoot)
    // Clear all component cache keys for this projectRoot
    for (const key of componentDocCache.keys()) {
      if (key.startsWith(`${projectRoot}#`)) {
        componentDocCache.delete(key)
      }
    }
    return
  }
  apiDocIndexCache.clear()
  componentDocCache.clear()
}

export function loadApiDocIndex(projectRoot: string): IndexDoc | null {
  if (apiDocIndexCache.has(projectRoot)) {
    return apiDocIndexCache.get(projectRoot) ?? null
  }

  const jsonPath = path.join(projectRoot, 'docs/pages/_api-index.json')
  if (!existsSync(jsonPath)) {
    apiDocIndexCache.set(projectRoot, null)
    return null
  }

  try {
    const raw = readFileSync(jsonPath, 'utf8')
    const indexDoc = JSON.parse(raw) as IndexDoc
    apiDocIndexCache.set(projectRoot, indexDoc)
    return indexDoc
  } catch (error) {
    throw new Error(
      `[api-doc] Malformed index document at ${jsonPath}:\n${(error as Error).message}`,
    )
  }
}

export function loadComponentApiDoc(projectRoot: string, key: string): ComponentApi | null {
  const cacheKey = `${projectRoot}#${key}`
  if (componentDocCache.has(cacheKey)) {
    return componentDocCache.get(cacheKey) ?? null
  }

  const pagesRoot = path.join(projectRoot, 'docs/pages')
  const pagePath = collectMarkdownFiles(pagesRoot)
    .map((file) => resolveDocsPageContext(file))
    .find((page) => page.pageKey === key)?.absolutePath

  if (!pagePath) {
    componentDocCache.set(cacheKey, null)
    return null
  }

  const jsonPath = path.join(path.dirname(pagePath), 'api.json')
  if (!existsSync(jsonPath)) {
    componentDocCache.set(cacheKey, null)
    return null
  }

  try {
    const raw = readFileSync(jsonPath, 'utf8')
    const doc = JSON.parse(raw) as ComponentApi
    componentDocCache.set(cacheKey, doc)
    return doc
  } catch (error) {
    throw new Error(
      `[api-doc] Malformed component API doc at ${jsonPath}:\n${(error as Error).message}`,
    )
  }
}
