import path from 'node:path'

import { generateApiDoc } from '../api-doc/extract'
import { writeJsonFiles } from '../api-doc/write'

export async function runApiDocGeneration(projectRoot: string): Promise<void> {
  const result = generateApiDoc(projectRoot)
  if (!result) {
    return
  }

  await writeJsonFiles(path.join(projectRoot, 'docs/api-doc'), result)
}
