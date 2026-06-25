import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import type { GenerationResult } from './types'
import { writeJsonFiles } from './write'

describe('writeJsonFiles', () => {
  test('writes colocated index/api files and removes stale page api files', async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), 'moraine-api-json-'))
    const pagesRoot = path.join(projectRoot, 'docs/pages')
    const pageDir = path.join(pagesRoot, 'general/demo')
    const stalePath = path.join(pageDir, 'api.json')
    await mkdir(pageDir, { recursive: true })
    await writeFile(path.join(pageDir, 'demo.mdx'), '<DocsHeader />', 'utf8')
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
            slots: [{ name: 'root', description: 'Root wrapper.' }],
            props: { own: [], inherited: [] },
            items: {
              description: 'Items for demo.',
              props: [],
            },
          },
        ],
      ]),
    }

    await writeJsonFiles(pagesRoot, result)

    expect(JSON.parse(await readFile(path.join(pagesRoot, '_api-index.json'), 'utf8'))).toEqual(
      result.indexDoc,
    )
    expect(JSON.parse(await readFile(stalePath, 'utf8'))).toEqual(result.componentDocs.get('demo'))
    expect(existsSync(path.join(projectRoot, 'docs/api-doc'))).toBe(false)

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('skips docs without matching pages and writes filtered index', async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), 'moraine-api-json-empty-'))
    const pagesRoot = path.join(projectRoot, 'docs/pages')
    const pageDir = path.join(pagesRoot, 'general/demo')
    const stalePath = path.join(pageDir, 'api.json')
    await mkdir(pageDir, { recursive: true })
    await writeFile(path.join(pageDir, 'demo.mdx'), '<DocsHeader />', 'utf8')
    await writeFile(stalePath, '{"stale":true}', 'utf8')

    await writeJsonFiles(pagesRoot, {
      indexDoc: {
        components: [
          {
            key: 'missing',
            name: 'Missing',
            category: 'General',
            polymorphic: false,
          },
        ],
      },
      componentDocs: new Map([
        [
          'missing',
          {
            component: {
              key: 'missing',
              name: 'Missing',
              category: 'General',
              polymorphic: false,
            },
            slots: [],
            props: { own: [], inherited: [] },
          },
        ],
      ]),
    })

    expect(existsSync(stalePath)).toBe(false)
    expect(JSON.parse(await readFile(path.join(pagesRoot, '_api-index.json'), 'utf8'))).toEqual({
      components: [],
    })

    await rm(projectRoot, { recursive: true, force: true })
  })
})
