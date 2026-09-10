import path from 'node:path'

import { generateApiDoc } from '../api-doc/extract'
import { writeJsonFiles } from '../api-doc/write'

export async function runApiDocGeneration(projectRoot: string): Promise<void> {
  const result = await generateApiDoc(projectRoot)
  if (!result) {
    return
  }
  if (result.componentDocs.size === 0) {
    throw new Error(
      '[api-doc] No component declarations were generated; refusing to remove API docs.',
    )
  }

  await writeJsonFiles(path.join(projectRoot, 'docs/pages'), result)
}
