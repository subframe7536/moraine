// @vitest-environment node

import { mdxToJs } from 'satteri'
import { describe, expect, test } from 'vitest'

import { createDocsCodePlugin, createDocsCodeTabsPlugin } from './plugins'

describe('createDocsCodeTabsPlugin with group-id', () => {
  test('transforms consecutive code blocks with group-id into CodeTabs', async () => {
    const markdown = `
\`\`\`shell title="bun" group-id="install"
bun add moraine
\`\`\`

\`\`\`shell title="pnpm" group-id="install"
pnpm add moraine
\`\`\`

\`\`\`shell title="npm" group-id="install"
npm i moraine
\`\`\`
`

    const res = await mdxToJs(markdown, {
      mdastPlugins: [() => createDocsCodeTabsPlugin(), () => createDocsCodePlugin()],
    })

    expect(res.code).toContain('CodeTabs')
    expect(res.code).toContain('groupId: "install"')
    expect(res.code).toContain('bun add moraine')
    expect(res.code).toContain('pnpm add moraine')
    expect(res.code).toContain('npm i moraine')
  })

  test('keeps ungrouped code blocks as CodeBlock while grouping group-id blocks', async () => {
    const markdown = `
\`\`\`shell title="bun" group-id="install"
bun add moraine
\`\`\`

\`\`\`shell title="pnpm" group-id="install"
pnpm add moraine
\`\`\`

Normal block:

\`\`\`ts title="example.ts"
console.log('standalone')
\`\`\`
`

    const res = await mdxToJs(markdown, {
      mdastPlugins: [() => createDocsCodeTabsPlugin(), () => createDocsCodePlugin()],
    })

    expect(res.code).toContain('CodeTabs')
    expect(res.code).toContain('CodeBlock')
    expect(res.code).toContain('standalone')
  })

  test('separates consecutive code blocks with different group-id values into distinct CodeTabs', async () => {
    const markdown = `
\`\`\`shell title="bun" group-id="install"
bun add moraine
\`\`\`

\`\`\`shell title="pnpm" group-id="install"
pnpm add moraine
\`\`\`

\`\`\`shell title="bun" group-id="run"
bun dev
\`\`\`

\`\`\`shell title="pnpm" group-id="run"
pnpm dev
\`\`\`
`

    const res = await mdxToJs(markdown, {
      mdastPlugins: [() => createDocsCodeTabsPlugin(), () => createDocsCodePlugin()],
    })

    expect(res.code).toContain('groupId: "install"')
    expect(res.code).toContain('groupId: "run"')
  })

  test('parses highlighted lines in grouped code blocks', async () => {
    const markdown = `
\`\`\`ts title="wind4" {1} group-id="unocss"
import { presetWind4 } from '@subf/unocss'
export default {}
\`\`\`

\`\`\`ts title="wind3" {2} group-id="unocss"
import { presetWind3 } from '@subf/unocss'
export default {}
\`\`\`
`

    const res = await mdxToJs(markdown, {
      mdastPlugins: [() => createDocsCodeTabsPlugin(), () => createDocsCodePlugin()],
    })

    expect(res.code).toContain('"highlightedLines": [1]')
    expect(res.code).toContain('"highlightedLines": [2]')
  })
})
