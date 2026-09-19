import { render } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { expect, test, vi } from 'vitest'

import type { ComponentDoc } from '../../../build/api-doc/types'

import { Markdown } from './markdown'

vi.mock('./docs-page-navigation', () => ({ DocsPageNavigation: () => null }))
vi.mock('./on-this-page', () => ({ OnThisPage: () => null }))

test('shows the generated kind in the header and updates it with page metadata', () => {
  const [apiDoc, setApiDoc] = createSignal<ComponentDoc | undefined>({
    component: {
      key: 'button',
      name: 'Button',
      category: 'elements',
      polymorphic: true,
      kind: 'single',
    },
    slots: [],
    props: { own: [], inherited: [] },
  })
  let childrenReads = 0
  const view = render(() =>
    createComponent(Markdown, {
      pageKey: 'button',
      frontmatter: {
        title: 'Button',
        description: 'Button documentation.',
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

  setApiDoc((doc) => ({ ...doc!, component: { ...doc!.component, kind: 'composite' } }))
  expect(view.getByRole('link', { name: 'Composite component: styling guide' }).textContent).toBe(
    'Composite',
  )
  expect(view.queryByRole('link', { name: 'Single component: styling guide' })).toBeNull()

  setApiDoc((doc) => ({ ...doc!, component: { ...doc!.component, kind: undefined } }))
  expect(view.queryByRole('link', { name: /component: styling guide/ })).toBeNull()

  setApiDoc(undefined)
  expect(view.queryByRole('link', { name: /component: styling guide/ })).toBeNull()
  expect(view.getByText('Page content')).toBeTruthy()
  expect(childrenReads).toBe(1)
})

test('focuses the closest heading when clicking on or near ### title', () => {
  const view = render(() =>
    createComponent(Markdown, {
      pageKey: 'accordion',
      frontmatter: {
        title: 'Accordion',
        description: 'Accordion documentation.',
        sidebar: { order: 1 },
        search: { tags: [] },
      },
      get children() {
        return (
          <div id="content-wrap">
            <h2 id="import" tabIndex={-1}>
              Import
              <a href="#import">#</a>
            </h2>
            <p id="p-import">Import description</p>
            <h3 id="basic-usage" tabIndex={-1}>
              Basic Usage
              <a href="#basic-usage">#</a>
            </h3>
            <p id="p-basic">Basic description</p>
            <button type="button" id="preview-btn">
              Preview Button
            </button>
          </div>
        )
      },
    }),
  )

  const h3 = view.container.querySelector('#basic-usage') as HTMLElement
  const pBasic = view.container.querySelector('#p-basic') as HTMLElement
  const previewBtn = view.container.querySelector('#preview-btn') as HTMLElement

  // Clicking directly on ### heading focuses ###
  h3.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }))
  expect(document.activeElement).toBe(h3)

  // Clicking near ### heading (on adjacent paragraph) focuses the closest element rather than jumping to top
  pBasic.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }))
  expect(document.activeElement).not.toBe(document.body)
  expect(document.activeElement?.id).not.toBe('import')

  // Clicking button focuses button directly
  previewBtn.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }))
  expect(document.activeElement).toBe(previewBtn)
})
