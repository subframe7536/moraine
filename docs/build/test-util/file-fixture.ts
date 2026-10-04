import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { onTestFinished } from 'vitest'

export async function createFileFixture(files: Record<string, string>): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'moraine-docs-'))
  onTestFinished(() => rm(root, { recursive: true, force: true }))
  await Promise.all(
    Object.entries(files).map(async ([name, source]) => {
      const target = path.join(root, name)
      await mkdir(path.dirname(target), { recursive: true })
      await writeFile(target, source, 'utf8')
    }),
  )
  return root
}
