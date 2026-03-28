import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import type { GenerationResult } from './types'
import { writeJsonFiles } from './write'

describe('writeJsonFiles', () => {
  test('writes index/components and removes stale component files', async () => {
    const outDir = await mkdtemp(path.join(tmpdir(), 'moraine-api-json-'))
    const stalePath = path.join(outDir, 'components', 'stale.json')
    await mkdir(path.dirname(stalePath), { recursive: true })
    await writeFile(stalePath, '{"stale":true}', 'utf8')

    const result: GenerationResult = {
      indexDoc: {
        components: [
          {
            key: 'demo',
            name: 'Demo',
            category: 'General',
            polymorphic: false,
          },
        ],
      },
      componentDocs: new Map([
        [
          'demo',
          {
            component: {
              key: 'demo',
              name: 'Demo',
              category: 'General',
              polymorphic: false,
            },
            slots: ['root'],
            props: { own: [], inherited: [] },
            items: {
              description: 'Items for demo.',
              props: [],
            },
          },
        ],
      ]),
    }

    await writeJsonFiles(outDir, result)

    expect(existsSync(stalePath)).toBe(false)
    expect(JSON.parse(await readFile(path.join(outDir, 'index.json'), 'utf8'))).toEqual(
      result.indexDoc,
    )
    expect(
      JSON.parse(await readFile(path.join(outDir, 'components', 'demo.json'), 'utf8')),
    ).toEqual(result.componentDocs.get('demo'))

    await rm(outDir, { recursive: true, force: true })
  })

  test('clears stale component files even when no components are generated', async () => {
    const outDir = await mkdtemp(path.join(tmpdir(), 'moraine-api-json-empty-'))
    const stalePath = path.join(outDir, 'components', 'stale.json')
    await mkdir(path.dirname(stalePath), { recursive: true })
    await writeFile(stalePath, '{"stale":true}', 'utf8')

    await writeJsonFiles(outDir, {
      indexDoc: { components: [] },
      componentDocs: new Map(),
    })

    const componentDir = path.join(outDir, 'components')
    expect(existsSync(componentDir)).toBe(true)
    expect(await readdir(componentDir)).toEqual([])
    expect(existsSync(stalePath)).toBe(false)
    expect(JSON.parse(await readFile(path.join(outDir, 'index.json'), 'utf8'))).toEqual({
      components: [],
    })

    await rm(outDir, { recursive: true, force: true })
  })
})
