// @vitest-environment node

import { mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { compileMarkdownPage } from './page'

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
  test('compiles mdx to JSX and passes frontmatter to Markdown runtime', () => {
    const code = compileMarkdownPage(
      `---
header: true
status: new
---

## Usage
`,
      '/tmp/docs/pages/general/button/button.mdx',
    )

    expect(code).toContain('const frontmatter =')
    expect(code).toContain('Markdown({ frontmatter, apiDoc')
    expect(code).toContain('"header":true')
    expect(code).toContain('"status":"new"')
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

      const code = compileMarkdownPage(
        `---
header: true
---
`,
        pagePath,
      )

      expect(code).toContain("import __docsRawApiDoc from './api.json'")
      expect(code).toContain('const apiDoc = __docsRawApiDoc')
      expect(code).toContain('apiDoc, onThisPageEntries')
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  test('collects CodeTabs packages only', () => {
    const code = compileMarkdownPage(
      '<CodeTabs package="moraine" />',
      '/tmp/docs/pages/introduction.mdx',
    )

    expect(code).toContain('bun add moraine')
    expect(code).toContain('codeTabs')
  })
})
