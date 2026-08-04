import { stat } from 'node:fs/promises'
import path from 'node:path'

import { generateApiDoc } from '../api-doc/extract.ts'
import { writeJsonFiles } from '../api-doc/write.ts'

async function statSafe(filePath: string) {
  try {
    return await stat(filePath)
  } catch {
    return null
  }
}

export async function runApiDocGeneration(projectRoot: string): Promise<void> {
  const result = await generateApiDoc(projectRoot)
  if (!result) {
    return
  }

  await writeJsonFiles(path.join(projectRoot, 'docs/pages'), result)
}

export async function ensureApiDocGeneration(projectRoot: string): Promise<void> {
  const indexJson = path.join(projectRoot, 'docs/pages/_api-index.json')
  const distDts = path.join(projectRoot, 'dist/index.d.mts')
  const [indexStat, distStat] = await Promise.all([statSafe(indexJson), statSafe(distDts)])

  if (indexStat && (!distStat || distStat.mtimeMs <= indexStat.mtimeMs)) {
    return
  }

  await runApiDocGeneration(projectRoot)
}
