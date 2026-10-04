// @vitest-environment node

import { writeFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { createFileFixture } from '../test-util/file-fixture.ts'

import { loadApiDocIndex } from './load.ts'

async function writeIndex(projectRoot: string, key: string): Promise<void> {
  await writeFile(
    path.join(projectRoot, 'docs/pages/_api-index.json'),
    JSON.stringify({ components: [{ key, name: key }] }),
    'utf8',
  )
}

describe('loadApiDocIndex', () => {
  test('reads the latest index json', async () => {
    const projectRoot = await createFileFixture({ 'docs/pages/_api-index.json': '' })

    await writeIndex(projectRoot, 'first')
    expect(loadApiDocIndex(projectRoot)?.components[0]?.key).toBe('first')

    await writeIndex(projectRoot, 'second')
    expect(loadApiDocIndex(projectRoot)?.components[0]?.key).toBe('second')
  })

  test('throws on malformed index json instead of silently returning null', async () => {
    const projectRoot = await createFileFixture({ 'docs/pages/_api-index.json': '' })
    await writeFile(path.join(projectRoot, 'docs/pages/_api-index.json'), 'invalid json {', 'utf8')

    expect(() => loadApiDocIndex(projectRoot)).toThrow('Malformed index document')
  })
})
