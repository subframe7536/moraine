import { stat } from 'node:fs/promises'
import path from 'node:path'

import { generateApiDoc } from '../api-doc/extract'
import { writeJsonFiles } from '../api-doc/write'
import { collectFiles } from '../core/paths'

async function statSafe(filePath: string) {
  try {
    return await stat(filePath)
  } catch {
    return null
  }
}

async function getNewestSourceMtime(projectRoot: string): Promise<number> {
  const srcRoot = path.join(projectRoot, 'src')
  const files = collectFiles(srcRoot, (file) => /\.(tsx?|jsx?)$/.test(file))
  const stats = await Promise.all(files.map((file) => statSafe(file)))
  return Math.max(0, ...stats.map((item) => item?.mtimeMs ?? 0))
}

export async function runApiDocGeneration(projectRoot: string): Promise<void> {
  const result = generateApiDoc(projectRoot)
  if (!result) return

  await writeJsonFiles(path.join(projectRoot, 'docs/pages'), result)
}

export async function ensureApiDocGeneration(projectRoot: string): Promise<void> {
  const indexJson = path.join(projectRoot, 'docs/pages/_api-index.json')
  const [indexStat, sourceMtime] = await Promise.all([
    statSafe(indexJson),
    getNewestSourceMtime(projectRoot),
  ])

  if (indexStat && sourceMtime <= indexStat.mtimeMs) return

  await runApiDocGeneration(projectRoot)
}
