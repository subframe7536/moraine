import { readFileSync } from 'node:fs'
import path from 'node:path'

import { collectMarkdownFiles, resolveDocsPageContext } from '../core/paths.ts'

import type { ComponentDoc, IndexDoc } from './types.ts'

const apiDocIndexCache = new Map<string, IndexDoc | null>()

export function clearApiDocCache(projectRoot?: string): void {
  if (projectRoot) {
    apiDocIndexCache.delete(projectRoot)
    return
  }
  apiDocIndexCache.clear()
}

export function loadApiDocIndex(projectRoot: string): IndexDoc | null {
  if (apiDocIndexCache.has(projectRoot)) {
    return apiDocIndexCache.get(projectRoot) ?? null
  }

  try {
    const jsonPath = path.join(projectRoot, 'docs/pages/_api-index.json')
    const indexDoc = JSON.parse(readFileSync(jsonPath, 'utf8')) as IndexDoc
    apiDocIndexCache.set(projectRoot, indexDoc)
    return indexDoc
  } catch {
    apiDocIndexCache.set(projectRoot, null)
    return null
  }
}

export function loadComponentApiDoc(projectRoot: string, key: string): ComponentDoc | null {
  try {
    const pagesRoot = path.join(projectRoot, 'docs/pages')
    const pagePath = collectMarkdownFiles(pagesRoot)
      .map((file) => resolveDocsPageContext(file))
      .find((page) => page.pageKey === key)?.absolutePath
    if (!pagePath) {
      return null
    }
    const jsonPath = path.join(path.dirname(pagePath), 'api.json')
    return JSON.parse(readFileSync(jsonPath, 'utf8')) as ComponentDoc
  } catch {
    return null
  }
}
