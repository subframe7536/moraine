// @vitest-environment node

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, test, vi } from 'vitest'

import { buildLlmsDocuments, buildLlmsTxt, llmsTxtPlugin } from './llms.ts'
import { scanDocsRoutes } from './routes.ts'

async function createTempProject(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'moraine-docs-llms-'))
}

async function writeProjectFile(projectRoot: string, filePath: string, content: string) {
  const absolutePath = path.join(projectRoot, filePath)
  await mkdir(path.dirname(absolutePath), { recursive: true })
  await writeFile(absolutePath, content, 'utf8')
}

function pageSource(title: string, order: number, body: string): string {
  return `---
title: ${title}
description: ${title} page description.
sidebar:
  order: ${order}
search:
  tags: [${title.toLowerCase()}, docs]
---

${body}
`
}

describe('llms.txt generation', () => {
  test('builds grouped index links with absolute markdown URLs', async () => {
    const projectRoot = await createTempProject()

    try {
      await writeProjectFile(projectRoot, 'docs/pages/_api-index.json', '{"components":[]}')
      await writeProjectFile(
        projectRoot,
        'docs/pages/index.mdx',
        pageSource('Introduction', 1, 'Welcome.'),
      )
      await writeProjectFile(
        projectRoot,
        'docs/pages/(general)/button/index.mdx',
        pageSource('Button', 1, 'Buttons.'),
      )
      await writeProjectFile(
        projectRoot,
        'docs/pages/(form)/input/index.mdx',
        pageSource('Input', 1, 'Inputs.'),
      )

      const options = {
        projectRoot,
        siteName: 'Moraine',
        description: 'Docs description.',
        siteUrl: 'https://ui.subf.dev',
      }
      const output = buildLlmsTxt(options, scanDocsRoutes(projectRoot))

      expect(output).toContain('# Moraine\n\n> Docs description.')
      expect(output).toContain(
        '- [Introduction](https://ui.subf.dev/index.md): Introduction page description.',
      )
      expect(output).toContain('## Form\n\n- [Input](https://ui.subf.dev/input.md)')
      expect(output).toContain('## General\n\n- [Button](https://ui.subf.dev/button.md)')
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  test('converts MDX components, previews, internal links, and API data', async () => {
    const projectRoot = await createTempProject()

    try {
      await writeProjectFile(
        projectRoot,
        'docs/pages/_api-index.json',
        JSON.stringify({
          components: [
            {
              key: 'button',
              name: 'Button',
              category: 'elements',
            },
          ],
        }),
      )
      await writeProjectFile(
        projectRoot,
        'docs/pages/index.mdx',
        pageSource(
          'Introduction',
          1,
          '<IntroComponents />\n\n<CodeTabs>\n  <CodeTabs.Item lang="shell" title="bun">\n    bun add moraine\n  </CodeTabs.Item>\n  <CodeTabs.Item lang="shell" title="pnpm">\n    pnpm add moraine\n  </CodeTabs.Item>\n  <CodeTabs.Item lang="shell" title="npm">\n    npm i moraine\n  </CodeTabs.Item>\n</CodeTabs>',
        ),
      )
      await writeProjectFile(
        projectRoot,
        'docs/pages/(general)/button/index.mdx',
        pageSource(
          'Button',
          1,
          'Use [`Button`](/general/button).\n\n## Playground\n\n<Playground controls={[]}>\n  {(props) => <button><UnknownComponent />{String(props.label)}</button>}\n</Playground>\n\n## Examples\n\n<Preview path="./basic" />',
        ),
      )
      await writeProjectFile(
        projectRoot,
        'docs/pages/(general)/button/basic.tsx',
        'export default function Basic() {\n  return <button>Basic</button>\n}\n',
      )
      await writeProjectFile(
        projectRoot,
        'docs/pages/(general)/button/api.json',
        JSON.stringify({
          key: 'button',
          name: 'Button',
          kind: 'single',
          parts: [
            {
              id: 'button',
              name: 'Button',
              access: { kind: 'export', name: 'Button' },
              props: [
                {
                  name: 'variant',
                  optional: true,
                  type: 'cls_variant0."default" | "outline"_$',
                  description: 'Visual variant.',
                },
              ],
            },
          ],
          item: {
            generics: [{ name: 'Value', constraint: 'string | number' }],
            props: [{ name: 'value', optional: false, type: 'Value' }],
          },
          slots: ['root', 'content'],
          dataAttributes: [
            { target: 'root', attributes: ['data-disabled'] },
            { target: 'content', attributes: ['data-disabled', 'data-expanded'] },
          ],
        }),
      )
      await writeProjectFile(
        projectRoot,
        'docs/pages/(overlay)/dialog/index.mdx',
        pageSource('Dialog', 2, 'Dialog docs.'),
      )
      await writeProjectFile(
        projectRoot,
        'docs/pages/(overlay)/dialog/api.json',
        JSON.stringify({
          key: 'dialog',
          name: 'Dialog',
          kind: 'composite',
          parts: [
            {
              id: 'dialog',
              name: 'Dialog',
              access: { kind: 'export', name: 'Dialog' },
              props: [],
            },
            {
              id: 'trigger',
              name: 'Dialog.Trigger',
              access: { kind: 'attached', root: 'Dialog', member: 'Trigger' },
              props: [{ name: 'disabled', optional: true, type: 'boolean' }],
            },
          ],
          slots: ['root', 'trigger'],
          dataAttributes: [],
        }),
      )

      const documents = await buildLlmsDocuments({
        projectRoot,
        siteName: 'Moraine',
        description: 'Docs description.',
        siteUrl: 'https://ui.subf.dev/',
      })
      const introduction = documents.find((document) => document.fileName === 'index.md')?.source
      const button = documents.find((document) => document.fileName === 'button.md')?.source
      const dialog = documents.find((document) => document.fileName === 'dialog.md')?.source

      expect(introduction).toContain('[Button](https://ui.subf.dev/button.md)')
      expect(introduction).not.toContain('<CodeTabs')
      expect(introduction).toContain('```shell bun\nbun add moraine\n```')
      expect(introduction).toContain('```shell pnpm\npnpm add moraine\n```')
      expect(introduction).toContain('```shell npm\nnpm i moraine\n```')
      expect(button).toContain('## Props')
      expect(button).toContain('## Items')
      expect(button!.indexOf('## Attributes')).toBeLessThan(button!.indexOf('## Items'))
      expect(button!.indexOf('## Items')).toBeLessThan(button!.indexOf('## Props'))
      expect(button).not.toContain('### Props')
      expect(button).toContain('Generics: `<Value extends string | number>`')
      expect(button).toContain('| Field | Type | Default | Description |')
      expect(button).toContain('| variant | "default" \\| "outline" | — | Visual variant. |')
      expect(button).toContain('## Attributes')
      expect(button!.indexOf('## Attributes')).toBeLessThan(button!.indexOf('## Props'))
      expect(button).toContain('| Attributes | Slot | Description |')
      expect(button).toContain('| `data-disabled` | `root`, `content` |')
      expect(button?.match(/`data-disabled`/g)).toHaveLength(1)
      expect(button).toContain('| `data-expanded` | `content` |')
      expect(button).not.toContain('DOM & State')
      expect(button).not.toContain('### Slots')
      expect(button).not.toContain('Data attributes')
      expect(button).not.toContain('Composition:')
      expect(button).not.toContain('CSS variables')
      expect(button).not.toContain('### Accessibility')
      expect(button).not.toContain('### Anatomy')
      expect(button).toMatch(/^---\ntitle: Button\ndescription: Button page description\./)
      expect(button).toContain('\n---\n\n# Button\n')
      expect(button).toContain('## Examples')
      expect(button).not.toContain('<Preview')
      expect(button).not.toContain('## Playground')
      expect(button).not.toContain('<Playground')
      expect(button).not.toContain('props.label')
      expect(button).not.toContain('UnknownComponent')
      expect(dialog).toContain('### Dialog')
      expect(dialog).toContain('### Dialog.Trigger')
      expect(dialog).not.toContain('\n### Trigger\n')
      expect(dialog).not.toContain('`Dialog.Trigger`')
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  test('fails when a page contains an unsupported MDX component', async () => {
    const projectRoot = await createTempProject()

    try {
      await writeProjectFile(projectRoot, 'docs/pages/_api-index.json', '{"components":[]}')
      await writeProjectFile(
        projectRoot,
        'docs/pages/index.mdx',
        pageSource('Introduction', 1, '<UnknownComponent />'),
      )

      await expect(
        buildLlmsDocuments({
          projectRoot,
          siteName: 'Moraine',
          description: 'Docs description.',
          siteUrl: 'https://ui.subf.dev/',
        }),
      ).rejects.toThrow('unsupported JSX component <UnknownComponent>')
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  test('retries failed generation and emits assets only for the client build', async () => {
    const projectRoot = await createTempProject()
    const options = {
      projectRoot,
      siteName: 'Moraine',
      description: 'Docs description.',
      siteUrl: 'https://ui.subf.dev/',
    }
    type GenerateBundle = (this: {
      environment: { name: string }
      emitFile: (file: { type: 'asset'; fileName: string; source: string }) => void
    }) => Promise<void>

    try {
      await writeProjectFile(projectRoot, 'docs/pages/_api-index.json', '{"components":[]}')
      const pagePath = 'docs/pages/index.mdx'
      await writeProjectFile(
        projectRoot,
        pagePath,
        pageSource('Introduction', 1, '<UnknownComponent />'),
      )

      const generateBundle = llmsTxtPlugin(options).generateBundle as GenerateBundle
      const emitFile = vi.fn()
      await expect(
        generateBundle.call({ environment: { name: 'client' }, emitFile }),
      ).rejects.toThrow('unsupported JSX component')

      await writeProjectFile(projectRoot, pagePath, pageSource('Introduction', 1, 'Welcome.'))
      await generateBundle.call({ environment: { name: 'client' }, emitFile })
      expect(emitFile).toHaveBeenCalledTimes(2)

      emitFile.mockClear()
      await generateBundle.call({ environment: { name: 'ssr' }, emitFile })
      expect(emitFile).not.toHaveBeenCalled()
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})
