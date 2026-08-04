import { mkdirSync } from 'node:fs'
import { writeFile, unlink } from 'node:fs/promises'
import path from 'node:path'

import { collectFiles, collectMarkdownFiles, resolveDocsPageContext } from '../core/paths.ts'

import { extractSourceAttributeReference } from './attributes.ts'
import { clearApiDocCache } from './load.ts'
import type { GenerationResult } from './types.ts'

function getPageDirectoryByKey(pagesRoot: string): Map<string, string> {
  const pageDirectories = new Map<string, string>()
  for (const file of collectMarkdownFiles(pagesRoot)) {
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
    return [
      (async () => {
        const completeDoc = {
          ...doc,
          attributes: await extractSourceAttributeReference(projectRoot, doc.component.sourcePath),
        }
        await writeFile(
          path.join(pageDirectory, 'api.json'),
          JSON.stringify(completeDoc, null, 2),
          'utf8',
        )
      })(),
    ]
  })
  await Promise.all(writes)
  clearApiDocCache(projectRoot)

  console.log(`[api-doc] Generated ${writes.length} colocated component api docs to ${pagesRoot}`)
}
