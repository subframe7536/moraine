// @vitest-environment node

import { mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { compileMarkdownPage } from './page'

function withFrontmatter(content = ''): string {
  return `---
title: Test Page
description: Test page description.
sidebar:
  order: 10
search:
  tags: [test]
---

${content}`
}

async function createTempPage(): Promise<{ projectRoot: string; pagePath: string }> {
  const projectRoot = await mkdtemp(path.join(tmpdir(), 'moraine-mdx-page-'))
  const pageDir = path.join(projectRoot, 'docs/pages/general/button')
  await mkdir(pageDir, { recursive: true })
  return {
    projectRoot,
    pagePath: path.join(pageDir, 'button.mdx'),
  }
}

describe('compileMarkdownPage', () => {
  test('compiles mdx to JSX and passes frontmatter to Markdown runtime', async () => {
    const code = await compileMarkdownPage(
      withFrontmatter('## Usage'),
      '/tmp/docs/pages/general/button/button.mdx',
    )

    expect(code).toContain('const frontmatter =')
    expect(code).toContain('Markdown({ pageKey: "button", frontmatter, apiDoc')
    expect(code).toContain('"title":"Test Page"')
    expect(code).toContain('"order":10')
    expect(code).toContain('Content: MDXContent')
    expect(code).toContain('return <_components.h2')
    expect(code).not.toContain('solid-js/h')
    expect(code).not.toContain('_jsx(')
  })

  test('imports colocated api json when available', async () => {
    const { projectRoot, pagePath } = await createTempPage()

    try {
      await writeFile(
        path.join(path.dirname(pagePath), 'api.json'),
        '{"component":{"key":"button"}}',
      )

      const code = await compileMarkdownPage(withFrontmatter(), pagePath)

      expect(code).toContain("import __docsRawApiDoc from './api.json'")
      expect(code).toContain('const apiDoc = __docsRawApiDoc')
      expect(code).toContain('apiDoc, onThisPageEntries')
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  test('collects CodeTabs packages only', async () => {
    const code = await compileMarkdownPage(
      withFrontmatter('<CodeTabs package="moraine" />'),
      '/tmp/docs/pages/introduction.mdx',
    )

    expect(code).toContain('bun add moraine')
    expect(code).toContain('codeTabs')
    expect(code).toContain('expressive-code')
    expect(code).not.toContain('is-terminal')
    expect(code).toContain('data-language=\\"bash\\"')
    expect(code).not.toContain('class=\\"ln\\"')
  })

  test('renders fenced code and metadata through Expressive Code', async () => {
    const code = await compileMarkdownPage(
      withFrontmatter('```tsx title="value.tsx" ins={1}\nconst value = 1\n```'),
      '/tmp/docs/pages/typescript.mdx',
    )

    expect(code).toContain('expressive-code')
    expect(code).toContain('value.tsx')
    expect(code).not.toContain('class=\\"ln\\"')
    expect(code).toContain('highlight ins')
    expect(code).not.toContain('ShikiCodeBlock')
    expect(code).not.toContain('<script')
  })

  test('collects Example paths into precise descriptor imports', async () => {
    const { projectRoot, pagePath } = await createTempPage()

    try {
      await writeFile(
        path.join(path.dirname(pagePath), 'variants.tsx'),
        'export function Variants() { return <div /> }',
      )

      const code = await compileMarkdownPage(
        withFrontmatter('<Example path="./variants" />\n\n<Example path="./variants" />'),
        pagePath,
      )

      expect(code.match(/import __DocsExample0/g)).toHaveLength(1)
      expect(code).toContain("from './variants.tsx?example'")
      expect(code).toContain('"./variants": __DocsExample0')
      expect(code).toContain('Content: MDXContent, examples, codeTabs')
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  test('supports parent-relative paths and explicit TSX extensions', async () => {
    const { projectRoot, pagePath } = await createTempPage()

    try {
      const sharedExample = path.join(projectRoot, 'docs/pages/shared/advanced.tsx')
      await mkdir(path.dirname(sharedExample), { recursive: true })
      await writeFile(sharedExample, 'export default function Advanced() { return <div /> }')

      const code = await compileMarkdownPage(
        withFrontmatter('<Example path="../../shared/advanced.tsx" />'),
        pagePath,
      )

      expect(code).toContain("from '../../shared/advanced.tsx?example'")
      expect(code).toContain('"../../shared/advanced.tsx": __DocsExample0')
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  test.each([
    ['missing path', '<Example />', 'requires a static "path" string'],
    ['dynamic path', '<Example path={examplePath} />', 'requires a static "path" string'],
    ['absolute path', '<Example path="/variants" />', 'must be a relative POSIX path'],
    ['query', '<Example path="./variants?raw" />', 'cannot contain a query or hash'],
    ['unsupported extension', '<Example path="./variants.ts" />', 'must reference a TSX file'],
    ['outside pages', '<Example path="../../../outside" />', 'must stay inside docs/pages'],
    ['missing file', '<Example path="./missing" />', 'file not found'],
  ])('rejects %s example references', async (_name, source, message) => {
    const { projectRoot, pagePath } = await createTempPage()

    try {
      await expect(compileMarkdownPage(withFrontmatter(source), pagePath)).rejects.toThrow(message)
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  test('rejects example paths that resolve to directories', async () => {
    const { projectRoot, pagePath } = await createTempPage()

    try {
      await mkdir(path.join(path.dirname(pagePath), 'directory.tsx'))

      await expect(
        compileMarkdownPage(withFrontmatter('<Example path="./directory.tsx" />'), pagePath),
      ).rejects.toThrow('path is not a file')
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})
