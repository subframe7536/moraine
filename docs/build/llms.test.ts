// @vitest-environment node

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { buildLlmsDocuments, buildLlmsTxt } from './llms.ts'
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

  test('converts MDX components, examples, internal links, and API data', async () => {
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
        pageSource('Introduction', 1, '<IntroComponents />\n\n<CodeTabs package="moraine" />'),
      )
      await writeProjectFile(
        projectRoot,
        'docs/pages/(general)/button/index.mdx',
        pageSource(
          'Button',
          1,
          'Use [`Button`](/general/button).\n\n## Playground\n\n<Playground controls={[]}>\n  {(props) => <button><UnknownComponent />{String(props.label)}</button>}\n</Playground>\n\n## Examples\n\n<Example path="./basic" />',
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
          component: {
            key: 'button',
            name: 'Button',
            category: 'elements',
            polymorphic: false,
          },
          slots: [
            {
              name: 'root',
              cssVariables: [],
              dataAttributes: [],
              ariaAttributes: [
                {
                  name: 'aria-label',
                  required: false,
                  type: 'string | undefined',
                  description: 'Accessible label.',
                },
              ],
            },
          ],
          props: {
            own: [
              {
                name: 'variant',
                required: false,
                type: '"default" | "outline"',
                description: 'Visual variant.',
              },
            ],
            inherited: [],
          },
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
      expect(introduction).toContain('bun add moraine')
      expect(introduction).toContain('pnpm add moraine')
      expect(introduction).toContain('npm i moraine')
      expect(button).toContain('[`Button`](https://ui.subf.dev/button.md)')
      expect(button).toContain('function Basic()')
      expect(button).toContain('## API Reference')
      expect(button).toContain('| variant | "default" \\| "outline" | — | Visual variant. |')
      expect(button).toContain('#### `root`')
      expect(button).toContain('##### ARIA Attributes')
      expect(button).toMatch(/^---\ntitle: Button\ndescription: Button page description\./)
      expect(button).toContain('\n---\n\n# Button\n')
      expect(button).toContain('## Examples')
      expect(button).not.toContain('<Example')
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
