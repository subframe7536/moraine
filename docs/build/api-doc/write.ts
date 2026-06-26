import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { writeFile, unlink } from 'node:fs/promises'
import path from 'node:path'

import { resolveDocsPageContext } from '../core/paths'

import { extractSourceAttributeReference } from './attributes'
import { clearApiDocCache } from './load'
import type { GenerationResult } from './types'

function collectFiles(dir: string, predicate: (file: string) => boolean): string[] {
  if (!existsSync(dir)) {
    return []
  }

  const files: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath, predicate))
      continue
    }
    if (entry.isFile() && predicate(fullPath)) {
      files.push(fullPath)
    }
  }
  return files
}

function getPageDirectoryByKey(pagesRoot: string): Map<string, string> {
  const pageDirectories = new Map<string, string>()
  for (const file of collectFiles(pagesRoot, (item) => item.endsWith('.mdx'))) {
    const page = resolveDocsPageContext(file)
    pageDirectories.set(page.pageKey, path.dirname(file))
  }
  return pageDirectories
}

async function removeStaleApiJson(pagesRoot: string): Promise<void> {
  await Promise.all(
    collectFiles(pagesRoot, (file) => path.basename(file) === 'api.json').map((file) =>
      unlink(file).catch(() => undefined),
    ),
  )
}

export async function writeJsonFiles(pagesRoot: string, result: GenerationResult): Promise<void> {
  const projectRoot = path.dirname(path.dirname(pagesRoot))
  const pageDirectoryByKey = getPageDirectoryByKey(pagesRoot)
  const apiIndexDoc = {
    components: result.indexDoc.components.filter((component) =>
      pageDirectoryByKey.has(component.key),
    ),
  }

  mkdirSync(pagesRoot, { recursive: true })
  await removeStaleApiJson(pagesRoot)
  await writeFile(
    path.join(pagesRoot, '_api-index.json'),
    JSON.stringify(apiIndexDoc, null, 2),
    'utf8',
  )

  const writes = [...result.componentDocs.entries()].flatMap(([key, doc]) => {
    const pageDirectory = pageDirectoryByKey.get(key)
    if (!pageDirectory) {
      console.warn(`[api-doc] No docs page found for "${key}", skipping colocated api.json`)
      return []
    }
    const completeDoc = {
      ...doc,
      attributes: extractSourceAttributeReference(projectRoot, doc.component.sourcePath),
    }
    return [
      writeFile(path.join(pageDirectory, 'api.json'), JSON.stringify(completeDoc, null, 2), 'utf8'),
    ]
  })
  await Promise.all(writes)
  clearApiDocCache(projectRoot)

  console.log(`[api-doc] Generated ${writes.length} colocated component api docs to ${pagesRoot}`)
}
