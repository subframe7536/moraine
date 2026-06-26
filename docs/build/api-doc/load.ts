import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { resolveDocsPageContext } from '../core/paths'

import type { ComponentDoc, IndexDoc } from './types'

const apiDocIndexCache = new Map<string, IndexDoc | null>()

function collectMarkdownFiles(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectMarkdownFiles(fullPath))
      continue
    }
    if (entry.isFile() && entry.name.endsWith('.mdx')) {
      files.push(fullPath)
    }
  }
  return files
}

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
