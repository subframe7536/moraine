import { access, readFile, stat } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { resolveDocsPageContext } from '../core/paths.ts'
import type { DocsPageSource } from '../routes.ts'
import { createFileFixture } from '../test-util/file-fixture.ts'

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
    const projectRoot = await createFileFixture({
      'docs/pages/components/(general)/demo/demo.mdx': '---\ntitle: Demo\n---\n',
      'docs/pages/components/(general)/demo/api.json': '{"stale":true}',
      'docs/pages/components/(general)/stale/api.json': '{"key":"stale"}',
    })
    const pagesRoot = path.join(projectRoot, 'docs/pages')
    const pageDir = path.join(pagesRoot, 'components/(general)/demo')
    const apiPath = path.join(pageDir, 'api.json')
    const stalePath = path.join(pagesRoot, 'components/(general)/stale/api.json')

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
  })

  test('preserves existing files when validation fails', async () => {
    const projectRoot = await createFileFixture({
      'docs/pages/components/(general)/demo/demo.mdx': '---\ntitle: Demo\n---\n',
      'docs/pages/components/(general)/demo/api.json': '{"original":true}',
    })
    const pagesRoot = path.join(projectRoot, 'docs/pages')
    const pageDir = path.join(pagesRoot, 'components/(general)/demo')
    const apiPath = path.join(pageDir, 'api.json')
    const invalid = { ...validComponent, parts: [] }
    const result: GenerationResult = {
      indexDoc: { components: [] },
      componentDocs: new Map([['demo', invalid]]),
    }
    await expect(
      writeJsonFiles(pagesRoot, [pageSource(path.join(pageDir, 'demo.mdx'))], result),
    ).rejects.toThrow('at least one documented public part')
    expect(await readFile(apiPath, 'utf8')).toBe('{"original":true}')

    const emptyType = {
      ...validComponent,
      parts: [
        {
          ...validComponent.parts[0]!,
          props: [{ name: 'as', optional: true, type: ' ' }],
        },
      ],
    }
    await expect(
      writeJsonFiles(pagesRoot, [pageSource(path.join(pageDir, 'demo.mdx'))], {
        indexDoc: { components: [] },
        componentDocs: new Map([['demo', emptyType]]),
      }),
    ).rejects.toThrow('Prop "as" has an empty type')
    expect(await readFile(apiPath, 'utf8')).toBe('{"original":true}')
  })
})
