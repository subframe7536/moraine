import { render } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { expect, test, vi } from 'vitest'

import type { ComponentApi } from '../../../build/api-doc/types'

import { Markdown } from './markdown'

vi.mock('./docs-page-navigation', () => ({ DocsPageNavigation: () => null }))
vi.mock('./on-this-page', () => ({ OnThisPage: () => null }))

test('shows the generated kind in the header and updates it with page metadata', () => {
  const [apiDoc, setApiDoc] = createSignal<ComponentApi | undefined>({
    key: 'button',
    name: 'Button',
    category: 'elements',
    kind: 'single',
    parts: [
      {
        id: 'button',
        name: 'Button',
        access: { kind: 'export', name: 'Button', package: 'moraine' },
        props: [],
      },
    ],
    slots: [],
    dataAttributes: [],
    cssVariables: [],
  })
  let childrenReads = 0
  const view = render(() =>
    createComponent(Markdown, {
      pageKey: 'button',
      frontmatter: {
        title: 'Button',
        description: 'Button documentation.',
        api: { path: 'src/elements/button/button' },
        sidebar: { order: 1 },
        search: { tags: [] },
      },
      get apiDoc() {
        return apiDoc()
      },
      get children() {
        childrenReads++
        return <p>Page content</p>
      },
    }),
  )

  const single = view.getByRole('link', { name: 'Single component: styling guide' })
  expect(single.textContent).toBe('Single')
  expect(single.getAttribute('href')).toBe('/styling#component-kinds')
  expect(single.getAttribute('tabindex')).toBeNull()
  expect(single.closest('header')).not.toBeNull()

  setApiDoc((doc) => ({ ...doc!, kind: 'composite' }))
  expect(view.getByRole('link', { name: 'Composite component: styling guide' }).textContent).toBe(
    'Composite',
  )
  expect(view.queryByRole('link', { name: 'Single component: styling guide' })).toBeNull()

  setApiDoc((doc) => ({ ...doc!, kind: undefined as any }))
  expect(view.queryByRole('link', { name: /component: styling guide/ })).toBeNull()

  setApiDoc(undefined)
  expect(view.queryByRole('link', { name: /component: styling guide/ })).toBeNull()
  expect(view.getByText('Page content')).toBeTruthy()
  expect(childrenReads).toBe(1)
})
