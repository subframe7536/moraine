import { mkdirSync } from 'node:fs'
import { rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { collectFiles, collectMarkdownFiles, resolveDocsPageContext } from '../core/paths'

import { clearApiDocCache } from './load'
import type { ComponentApi, GenerationResult } from './types'
import { validateAllComponentApis } from './validate'

function getPageDirectoryByKey(pagesRoot: string): Map<string, string> {
  const pageDirectories = new Map<string, string>()
  for (const file of collectMarkdownFiles(pagesRoot)) {
    const page = resolveDocsPageContext(file)
    pageDirectories.set(page.pageKey, path.dirname(file))
  }
  return pageDirectories
}

function sortComponentApi(component: ComponentApi): ComponentApi {
  const sortedParts = component.parts.map((part) => ({
    ...part,
    props: [...part.props].sort((left, right) => left.name.localeCompare(right.name)),
  }))

  const sortedItem = component.item
    ? {
        ...component.item,
        props: [...component.item.props].sort((a, b) => a.name.localeCompare(b.name)),
      }
    : undefined

  return {
    ...component,
    parts: sortedParts,
    ...(sortedItem ? { item: sortedItem } : {}),
  }
}

export async function writeJsonFiles(pagesRoot: string, result: GenerationResult): Promise<void> {
  const projectRoot = path.dirname(path.dirname(pagesRoot))

  // 1. Validate complete generation result before modifying ANY file on disk
  if (result.diagnostics.length > 0) {
    throw new Error(
      `[api-doc] Extraction produced diagnostics:\n${result.diagnostics.map((diagnostic) => `- ${diagnostic}`).join('\n')}`,
    )
  }
  const allComponents = [...result.componentDocs.values()].map(sortComponentApi)
  validateAllComponentApis(allComponents)

  // 2. Prepare serialized outputs in memory
  const pageDirectoryByKey = getPageDirectoryByKey(pagesRoot)
  const apiIndexDoc = {
    components: [...result.indexDoc.components]
      .filter((c) => pageDirectoryByKey.has(c.key))
      .sort((a, b) => a.key.localeCompare(b.key)),
  }
  const serializedIndex = `${JSON.stringify(apiIndexDoc, null, 2)}\n`

  const filesToWrite: Array<{
    targetPath: string
    content: string
  }> = [
    {
      targetPath: path.join(pagesRoot, '_api-index.json'),
      content: serializedIndex,
    },
  ]

  for (const component of allComponents) {
    const pageDir = pageDirectoryByKey.get(component.key)
    if (!pageDir) {
      console.warn(
        `[api-doc] No docs page found for "${component.key}", skipping colocated api.json`,
      )
      continue
    }

    const targetPath = path.join(pageDir, 'api.json')
    const content = `${JSON.stringify(component, null, 2)}\n`
    filesToWrite.push({ targetPath, content })
  }

  // 3. Stage writes: write to temporary sibling files
  const stagedFiles: Array<{ tempPath: string; targetPath: string }> = []
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`

  mkdirSync(pagesRoot, { recursive: true })

  try {
    for (const item of filesToWrite) {
      const tempPath = `${item.targetPath}.tmp.${uniqueId}`
      mkdirSync(path.dirname(tempPath), { recursive: true })
      await writeFile(tempPath, item.content, 'utf8')
      stagedFiles.push({ tempPath, targetPath: item.targetPath })
    }

    // 4. Atomically rename all temporary files to target files
    for (const staged of stagedFiles) {
      await rename(staged.tempPath, staged.targetPath)
    }
  } catch (error) {
    // If any staged write or rename fails, clean up all temporary files and rethrow
    for (const staged of stagedFiles) {
      await unlink(staged.tempPath).catch(() => undefined)
    }
    throw error
  }

  // 5. Remove stale generated api.json files last
  const writtenTargets = new Set(filesToWrite.map((f) => path.resolve(f.targetPath)))
  const existingApiJsonFiles = collectFiles(pagesRoot, (file) => path.basename(file) === 'api.json')

  for (const file of existingApiJsonFiles) {
    if (!writtenTargets.has(path.resolve(file))) {
      await unlink(file).catch(() => undefined)
    }
  }

  // 6. Clear caches
  clearApiDocCache(projectRoot)

  console.log(
    `[api-doc] Generated ${filesToWrite.length - 1} colocated component api docs to ${pagesRoot}`,
  )
}
