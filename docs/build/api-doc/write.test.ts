import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import type { ComponentApi, GenerationResult } from './types'
import { writeJsonFiles } from './write'

const validComponent: ComponentApi = {
  key: 'demo',
  name: 'Demo',
  kind: 'single',
  parts: [
    {
      id: 'demo',
      name: 'Demo',
      access: { kind: 'export', name: 'Demo' },
      props: [{ name: 'variant', optional: true, type: 'string' }],
    },
  ],
  slots: ['root'],
  dataAttributes: [{ target: 'root', attributes: ['data-disabled'] }],
}

describe('writeJsonFiles', () => {
  test('atomically writes colocated API files', async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), 'moraine-api-json-'))
    const pagesRoot = path.join(projectRoot, 'docs/pages')
    const pageDir = path.join(pagesRoot, 'general/demo')
    const apiPath = path.join(pageDir, 'api.json')
    await mkdir(pageDir, { recursive: true })
    await writeFile(path.join(pageDir, 'demo.mdx'), '---\ntitle: Demo\n---\n', 'utf8')
    await writeFile(apiPath, '{"stale":true}', 'utf8')

    const result: GenerationResult = {
      indexDoc: {
        components: [{ key: 'demo', name: 'Demo', category: 'elements' }],
      },
      componentDocs: new Map([['demo', validComponent]]),
    }
    await writeJsonFiles(pagesRoot, result)
    expect(JSON.parse(await readFile(path.join(pagesRoot, '_api-index.json'), 'utf8'))).toEqual(
      result.indexDoc,
    )
    expect(JSON.parse(await readFile(apiPath, 'utf8'))).toMatchObject({ key: 'demo' })
    await rm(projectRoot, { recursive: true, force: true })
  })

  test('preserves existing files when validation fails', async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), 'moraine-api-fail-'))
    const pagesRoot = path.join(projectRoot, 'docs/pages')
    const pageDir = path.join(pagesRoot, 'general/demo')
    const apiPath = path.join(pageDir, 'api.json')
    await mkdir(pageDir, { recursive: true })
    await writeFile(path.join(pageDir, 'demo.mdx'), '---\ntitle: Demo\n---\n', 'utf8')
    await writeFile(apiPath, '{"original":true}', 'utf8')
    const invalid = { ...validComponent, parts: [] }
    const result: GenerationResult = {
      indexDoc: { components: [] },
      componentDocs: new Map([['demo', invalid]]),
    }
    await expect(writeJsonFiles(pagesRoot, result)).rejects.toThrow(
      'at least one documented public part',
    )
    expect(await readFile(apiPath, 'utf8')).toBe('{"original":true}')
    await rm(projectRoot, { recursive: true, force: true })
  })
})
