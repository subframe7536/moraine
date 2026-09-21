// @vitest-environment node

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { buildLlmsDocuments, buildLlmsTxt } from './llms'
import { scanDocsRoutes } from './routes'

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
              description: 'A button.',
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
          category: 'elements',
          kind: 'single',
          sourcePath: 'src/elements/button/button.tsx',
          parts: [
            {
              id: 'button',
              name: 'Button',
              access: { kind: 'export', name: 'Button', package: 'moraine' },
              sourcePath: 'src/elements/button/button.tsx',
              props: [
                {
                  name: 'variant',
                  optional: true,
                  type: { text: '"default" | "outline"' },
                  description: 'Visual variant.',
                  group: 'styling',
                },
              ],
              slots: [
                {
                  name: 'root',
                },
              ],
              runtime: [
                {
                  name: 'root',
                  slot: 'root',
                  selector: '[data-slot="root"]',
                  element: 'button',
                  attributes: [
                    {
                      name: 'aria-label',
                      kind: 'aria',
                      value: { kind: 'dynamic' },
                      description: 'Accessible label.',
                    },
                  ],
                },
              ],
              cssVariables: [],
            },
          ],
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

      expect(introduction).toContain('[Button](https://ui.subf.dev/button.md): A button.')
      expect(introduction).not.toContain('<CodeTabs')
      expect(introduction).toContain('```shell bun\nbun add moraine\n```')
      expect(introduction).toContain('```shell pnpm\npnpm add moraine\n```')
      expect(introduction).toContain('```shell npm\nnpm i moraine\n```')
      expect(button).toContain('## API')
      expect(button).toContain('### Props')
      expect(button).toContain('**Styling**')
      expect(button).not.toContain('### Styling')
      expect(button).not.toContain('#### Styling')
      expect(button).toContain('| variant | "default" \\| "outline" | — | Visual variant. |')
      expect(button).toContain('### Slots')
      expect(button).toContain('- `root`')
      expect(button).toContain('### Anatomy')
      expect(button).toContain('| root | [data-slot="root"] | button | — |')
      expect(button).toContain('### Accessibility')
      expect(button).toContain('| aria-label | root | Dynamic | Accessible label. |')
      expect(button).toMatch(/^---\ntitle: Button\ndescription: Button page description\./)
      expect(button).toContain('\n---\n\n# Button\n')
      expect(button).toContain('## Examples')
      expect(button).not.toContain('<Preview')
      expect(button).not.toContain('## Playground')
      expect(button).not.toContain('<Playground')
      expect(button).not.toContain('props.label')
      expect(button).not.toContain('UnknownComponent')
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
})
