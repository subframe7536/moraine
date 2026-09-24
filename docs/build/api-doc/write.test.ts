import { access, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { resolveDocsPageContext } from '../core/paths.ts'
import type { DocsPageSource } from '../routes.ts'

import type { ComponentApi, GenerationResult } from './types.ts'
import { writeJsonFiles } from './write.ts'

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

function pageSource(sourcePath: string): DocsPageSource {
  return {
    page: resolveDocsPageContext(sourcePath),
    frontmatter: {
      title: 'Demo',
      description: 'Demo.',
      sidebar: { order: 1 },
      search: { tags: ['demo'] },
    },
  }
}

describe('writeJsonFiles', () => {
  test('writes changed files, preserves unchanged files, and removes stale files', async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), 'moraine-api-json-'))
    const pagesRoot = path.join(projectRoot, 'docs/pages')
    const pageDir = path.join(pagesRoot, 'general/demo')
    const apiPath = path.join(pageDir, 'api.json')
    const stalePath = path.join(pagesRoot, 'general/stale/api.json')
    await mkdir(pageDir, { recursive: true })
    await mkdir(path.dirname(stalePath), { recursive: true })
    await writeFile(path.join(pageDir, 'demo.mdx'), '---\ntitle: Demo\n---\n', 'utf8')
    await writeFile(apiPath, '{"stale":true}', 'utf8')
    await writeFile(stalePath, '{"key":"stale"}', 'utf8')

    const result: GenerationResult = {
      indexDoc: {
        components: [{ key: 'demo', name: 'Demo', category: 'element' }],
      },
      componentDocs: new Map([['demo', validComponent]]),
    }
    await writeJsonFiles(pagesRoot, [pageSource(path.join(pageDir, 'demo.mdx'))], result)
    expect(JSON.parse(await readFile(path.join(pagesRoot, '_api-index.json'), 'utf8'))).toEqual(
      result.indexDoc,
    )
    expect(JSON.parse(await readFile(apiPath, 'utf8'))).toMatchObject({ key: 'demo' })
    await expect(access(stalePath)).rejects.toThrow()

    const modifiedAt = (await stat(apiPath)).mtimeMs
    await writeJsonFiles(pagesRoot, [pageSource(path.join(pageDir, 'demo.mdx'))], result)
    expect((await stat(apiPath)).mtimeMs).toBe(modifiedAt)
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
    await expect(
      writeJsonFiles(pagesRoot, [pageSource(path.join(pageDir, 'demo.mdx'))], result),
    ).rejects.toThrow('at least one documented public part')
    expect(await readFile(apiPath, 'utf8')).toBe('{"original":true}')
    await rm(projectRoot, { recursive: true, force: true })
  })
})
