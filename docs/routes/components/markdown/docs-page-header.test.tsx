import { render } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import type { ComponentApi } from '../../../build/api-doc/types.ts'
import type { FrontmatterData } from '../../../build/markdown/types.ts'

import { DocsPageHeader } from './docs-page-header.tsx'

const frontmatter: FrontmatterData = {
  title: 'Demo',
  description: 'Demo component',
  sidebar: { order: 1 },
  search: { tags: [] },
}

function component(parts: Array<{ name: string; props: string[] }>): ComponentApi {
  return {
    key: 'demo',
    name: 'Demo',
    kind: parts.length > 1 ? 'composite' : 'single',
    parts: parts.map((part) => ({
      id: part.name.toLowerCase(),
      name: part.name,
      access: { kind: 'export', name: part.name },
      props: part.props.map((name) => ({ name, optional: true, type: 'string' })),
    })),
    slots: [],
    dataAttributes: [],
  }
}

describe('DocsPageHeader', () => {
  test('links the polymorphic badge for a root or attached part with as', () => {
    for (const apiDoc of [
      component([{ name: 'Button', props: ['as'] }]),
      component([
        { name: 'Dialog', props: ['open'] },
        { name: 'Dialog.Trigger', props: ['as'] },
      ]),
    ]) {
      const screen = render(() => (
        <DocsPageHeader pageKey="demo" apiDoc={apiDoc} frontmatter={frontmatter} />
      ))
      const badge = screen.getByRole('link', { name: /Polymorphic: at least one component/ })
      expect(badge.getAttribute('href')).toBe('/typescript#polymorphic-rendering-as-prop')
      expect(badge.className).toContain('focus-visible:')
      expect(badge.parentElement?.className).toContain('flex-wrap')
      expect(screen.getByRole('link', { name: /component: styling guide/ })).toBeTruthy()
      screen.unmount()
    }
  })

  test('omits the badge for non-polymorphic components and regular pages', () => {
    for (const apiDoc of [
      component([{ name: 'Slider', props: ['value'] }]),
      component([{ name: 'Card', props: ['children'] }]),
      undefined,
    ]) {
      const screen = render(() => (
        <DocsPageHeader pageKey="demo" apiDoc={apiDoc} frontmatter={frontmatter} />
      ))
      expect(screen.queryByRole('link', { name: /Polymorphic:/ })).toBeNull()
      screen.unmount()
    }
  })
})
