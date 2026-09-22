// @vitest-environment node

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, test } from 'vitest'

import { loadApiDocIndex } from './load.ts'

const tempProjects: string[] = []

async function createTempProject(): Promise<string> {
  const projectRoot = await mkdtemp(path.join(tmpdir(), 'moraine-api-load-'))
  tempProjects.push(projectRoot)
  await mkdir(path.join(projectRoot, 'docs/pages'), { recursive: true })
  return projectRoot
}

async function writeIndex(projectRoot: string, key: string): Promise<void> {
  await writeFile(
    path.join(projectRoot, 'docs/pages/_api-index.json'),
    JSON.stringify({ components: [{ key, name: key }] }),
    'utf8',
  )
}

afterEach(async () => {
  await Promise.all(
    tempProjects.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  )
})

describe('loadApiDocIndex', () => {
  test('reads the latest index json', async () => {
    const projectRoot = await createTempProject()

    await writeIndex(projectRoot, 'first')
    expect(loadApiDocIndex(projectRoot)?.components[0]?.key).toBe('first')

    await writeIndex(projectRoot, 'second')
    expect(loadApiDocIndex(projectRoot)?.components[0]?.key).toBe('second')
  })

  test('throws on malformed index json instead of silently returning null', async () => {
    const projectRoot = await createTempProject()
    await writeFile(path.join(projectRoot, 'docs/pages/_api-index.json'), 'invalid json {', 'utf8')

    expect(() => loadApiDocIndex(projectRoot)).toThrow('Malformed index document')
  })
})
