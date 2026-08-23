import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

const rootPageSource = readFileSync(path.resolve('docs/pages/index.mdx'), 'utf8')
const componentSource = readFileSync(
  path.resolve('docs/routes/components/markdown/intro-components.tsx'),
  'utf8',
)
const apiIndex = JSON.parse(readFileSync(path.resolve('docs/pages/_api-index.json'), 'utf8')) as {
  components: Array<{
    key: string
    name: string
    category: string
    description?: string
    sourcePath?: string
  }>
}

describe('Introduction landing content', () => {
  test('keeps the generated API inventory as the sole source for grouped directory data', () => {
    const groups = new Map<string, typeof apiIndex.components>()
    for (const component of apiIndex.components) {
      const components = groups.get(component.category) ?? []
      components.push(component)
      groups.set(component.category, components)
    }

    expect(apiIndex.components).toHaveLength(41)
    expect(
      [...groups.entries()].map(([category, components]) => [category, components.length]),
    ).toEqual([
      ['elements', 15],
      ['forms', 13],
      ['navigation', 6],
      ['overlays', 7],
    ])
    expect(
      groups
        .get('elements')
        ?.slice(0, 3)
        .map((component) => component.name),
    ).toEqual(['Icon', 'Accordion', 'Avatar'])
    expect(componentSource).toContain('for (const component of apiIndex.components)')
    expect(componentSource).toContain('.filter(([, components]) => components.length > 0)')
    expect(componentSource).toContain('href={`/${component.key}`}')
    expect(componentSource).toContain('{component.description}')
    expect(componentSource).toContain('{component.sourcePath}')
  })

  test("keeps the compact specimen's form, navigation, status, and overlay semantics", () => {
    expect(componentSource).toContain(
      '<form class="flex flex-col gap-4 min-w-0" onSubmit={saveSpecimen}>',
    )
    expect(componentSource).toContain('<Checkbox')
    expect(componentSource).toContain('<Tabs')
    expect(componentSource).toContain('<Dialog')
    expect(componentSource).toContain('<output aria-live="polite"')
    expect(componentSource).toContain('Review in dialog')
    expect(componentSource).toContain('docs-focus-visible')
  })

  test('states status, setup, compatibility, and resource destinations in the root document', () => {
    expect(rootPageSource).toContain('pre-1.0; breaking changes may occur')
    expect(rootPageSource).toContain('## Setup')
    expect(rootPageSource).toContain('<CodeTabs package="moraine" />')
    expect(rootPageSource).toContain('](/styling)')
    expect(componentSource).toContain('Tailwind integration is\n          experimental')
    expect(componentSource).toContain('href="/styling"')
    expect(componentSource).toContain('href="/typescript"')
    expect(componentSource).toContain('href="/utils"')
    expect(componentSource).toContain('href="/llms.txt"')
    expect(componentSource).toContain('Source repository')
    expect(componentSource).toContain('README')
    expect(componentSource).toContain('MIT License')
  })
})
