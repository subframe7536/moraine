import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { collectFiles } from '../core/paths.ts'
import type { DocsPageSource } from '../routes.ts'

import type { ComponentApi, GenerationResult } from './types.ts'
import { validateAllComponentApis } from './validate.ts'

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

export async function writeJsonFiles(
  pagesRoot: string,
  pages: readonly DocsPageSource[],
  result: GenerationResult,
): Promise<void> {
  const allComponents = [...result.componentDocs.values()].map(sortComponentApi)
  validateAllComponentApis(allComponents)

  const pageDirectoryByKey = new Map(
    pages.map(({ page }) => [page.pageKey, path.dirname(page.absolutePath)]),
  )
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

  const changedFiles = filesToWrite.filter(
    ({ targetPath, content }) =>
      !existsSync(targetPath) || readFileSync(targetPath, 'utf8') !== content,
  )
  const stagedFiles: Array<{ tempPath: string; targetPath: string }> = []
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`

  mkdirSync(pagesRoot, { recursive: true })

  try {
    for (const item of changedFiles) {
      const tempPath = `${item.targetPath}.tmp.${uniqueId}`
      mkdirSync(path.dirname(tempPath), { recursive: true })
      await writeFile(tempPath, item.content, 'utf8')
      stagedFiles.push({ tempPath, targetPath: item.targetPath })
    }

    for (const staged of stagedFiles) {
      await rename(staged.tempPath, staged.targetPath)
    }
  } catch (error) {
    for (const staged of stagedFiles) {
      await unlink(staged.tempPath).catch(() => undefined)
    }
    throw error
  }

  const writtenTargets = new Set(filesToWrite.map((f) => path.resolve(f.targetPath)))
  const existingApiJsonFiles = collectFiles(pagesRoot, (file) => path.basename(file) === 'api.json')

  for (const file of existingApiJsonFiles) {
    if (!writtenTargets.has(path.resolve(file))) {
      await unlink(file).catch(() => undefined)
    }
  }

  console.log(
    `[api-doc] Generated ${filesToWrite.length - 1} colocated component api docs to ${pagesRoot}`,
  )
}
