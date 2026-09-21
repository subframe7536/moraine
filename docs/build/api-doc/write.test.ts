import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import type { ComponentApi, GenerationResult } from './types'
import { writeJsonFiles } from './write'

describe('writeJsonFiles', () => {
  const validComponent: ComponentApi = {
    key: 'demo',
    name: 'Demo',
    category: 'elements',
    kind: 'single',
    sourcePath: 'src/elements/demo/demo.tsx',
    parts: [
      {
        id: 'demo',
        name: 'Demo',
        access: { kind: 'export', name: 'Demo', package: 'moraine' },
        sourcePath: 'src/elements/demo/demo.tsx',
        props: [
          {
            name: 'variant',
            optional: true,
            type: { text: 'string' },
            group: 'styling',
          },
        ],
        slots: [{ name: 'root' }],
        runtime: [],
      },
    ],
  }

  test('writes colocated index/api files and removes stale page api files', async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), 'moraine-api-json-'))
    const pagesRoot = path.join(projectRoot, 'docs/pages')
    const pageDir = path.join(pagesRoot, 'general/demo')
    const stalePath = path.join(pageDir, 'api.json')
    await mkdir(pageDir, { recursive: true })
    await writeFile(
      path.join(pageDir, 'demo.mdx'),
      '---\ntitle: Demo\ndescription: Demo page.\nsidebar:\n  order: 10\nsearch:\n  tags: [demo]\n---\n',
      'utf8',
    )
    await writeFile(stalePath, '{"stale":true}', 'utf8')

    const result: GenerationResult = {
      indexDoc: {
        components: [
          {
            key: 'demo',
            name: 'Demo',
            category: 'elements',
            kind: 'single',
            sourcePath: 'src/elements/demo/demo.tsx',
          },
        ],
      },
      componentDocs: new Map([['demo', validComponent]]),
    }

    await writeJsonFiles(pagesRoot, result)

    expect(JSON.parse(await readFile(path.join(pagesRoot, '_api-index.json'), 'utf8'))).toEqual(
      result.indexDoc,
    )
    const written = JSON.parse(await readFile(stalePath, 'utf8'))
    expect(written.key).toBe('demo')
    expect(written.parts).toHaveLength(1)
    expect(written.parts[0].name).toBe('Demo')

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('preserves existing api.json when validation fails (failure safety)', async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), 'moraine-api-fail-'))
    const pagesRoot = path.join(projectRoot, 'docs/pages')
    const pageDir = path.join(pagesRoot, 'general/demo')
    const apiPath = path.join(pageDir, 'api.json')
    await mkdir(pageDir, { recursive: true })
    await writeFile(
      path.join(pageDir, 'demo.mdx'),
      '---\ntitle: Demo\ndescription: Demo page.\nsidebar:\n  order: 10\nsearch:\n  tags: [demo]\n---\n',
      'utf8',
    )
    const originalContent = '{"original":true}'
    await writeFile(apiPath, originalContent, 'utf8')

    const invalidComponent: ComponentApi = {
      ...validComponent,
      parts: [], // Invalid: component must have at least one part!
    }

    const failingResult: GenerationResult = {
      indexDoc: { components: [] },
      componentDocs: new Map([['demo', invalidComponent]]),
    }

    await expect(writeJsonFiles(pagesRoot, failingResult)).rejects.toThrow(
      'at least one documented public part',
    )

    // Existing api.json must be completely unchanged!
    expect(await readFile(apiPath, 'utf8')).toBe(originalContent)

    await rm(projectRoot, { recursive: true, force: true })
  })
})
