import { MemoryRouter, Route } from '@solidjs/router'
import { fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal, untrack } from 'solid-js'
import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { DocsCommandPalette, buildDocsCommandItems } from './docs-command-palette.tsx'

const pages = [
  {
    key: 'button',
    label: 'Button',
    description: 'Trigger an action.',
    order: 1,
    tags: ['action'],
    path: '/button',
    sections: [
      { id: 'usage', label: 'Usage', level: 2 },
      { id: 'usage-1', label: 'Usage', level: 2 },
      { id: 'api-props', label: 'Props', level: 2 },
    ],
  },
]

describe('buildDocsCommandItems', () => {
  test('builds ordered page and section destinations with encoded IDs', () => {
    expect(buildDocsCommandItems(pages)).toEqual([
      {
        id: 'pages',
        label: 'Pages',
        items: [expect.objectContaining({ value: '/button', label: 'Button' })],
      },
      {
        id: 'sections',
        label: 'Sections',
        items: [
          expect.objectContaining({ value: '/button#usage', label: 'Usage' }),
          expect.objectContaining({ value: '/button#usage-1', label: 'Usage' }),
          expect.objectContaining({ value: '/button#api-props', label: 'Props' }),
        ],
      },
    ])
  })

  test('deduplicates exact destinations while retaining document order', () => {
    const firstPage = pages[0]!
    const items = buildDocsCommandItems([
      {
        ...firstPage,
        sections: [
          { id: 'usage', label: 'Usage', level: 2 },
          { id: 'usage', label: 'Repeated usage', level: 2 },
        ],
      },
    ])

    expect(items[1]?.items).toEqual([
      expect.objectContaining({ value: '/button#usage', label: 'Usage' }),
    ])
  })
})

describe('DocsCommandPalette', () => {
  beforeEach(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  afterAll(() => {
    vi.restoreAllMocks()
  })

  test('uses native links without intercepting modified activation', () => {
    const navigate = vi.fn()
    const [open, setOpen] = createSignal(true)

    render(() => (
      <MemoryRouter>
        <Route
          path="/*"
          component={() => (
            <DocsCommandPalette pages={pages} onNavigate={navigate} open={open} setOpen={setOpen} />
          )}
        />
      </MemoryRouter>
    ))

    const usage = screen
      .getAllByRole('link', { name: 'Button: Usage' })
      .find((link) => link.getAttribute('href') === '/button#usage')
    expect(usage).toBeDefined()
    expect(usage?.getAttribute('href')).toBe('/button#usage')

    usage?.addEventListener('click', (event) => event.preventDefault(), { once: true })
    fireEvent.click(usage as HTMLAnchorElement, { ctrlKey: true })
    expect(navigate).not.toHaveBeenCalled()
    expect(untrack(open)).toBe(true)
  })

  test('renders the generated Props section as a Button: Props destination', () => {
    const [open, setOpen] = createSignal(true)

    render(() => (
      <MemoryRouter>
        <Route
          path="/*"
          component={() => (
            <DocsCommandPalette
              pages={pages}
              onNavigate={() => undefined}
              open={open}
              setOpen={setOpen}
            />
          )}
        />
      </MemoryRouter>
    ))

    const props = screen.getByRole('link', { name: 'Button: Props' })
    expect(props.getAttribute('href')).toBe('/button#api-props')
  })

  test('navigates the highlighted section when activated with Enter', () => {
    const navigate = vi.fn()
    const [open, setOpen] = createSignal(true)

    render(() => (
      <MemoryRouter>
        <Route
          path="/*"
          component={() => (
            <DocsCommandPalette pages={pages} onNavigate={navigate} open={open} setOpen={setOpen} />
          )}
        />
      </MemoryRouter>
    ))

    const input = screen.getByRole('combobox')
    fireEvent.input(input, { target: { value: 'usage' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(navigate).toHaveBeenCalledWith('/button#usage')
    expect(untrack(open)).toBe(false)
  })

  test('opens with the global shortcut and removes its listener on cleanup', () => {
    const navigate = vi.fn()
    const [open, setOpen] = createSignal(false)
    const result = render(() => (
      <MemoryRouter>
        <Route
          path="/*"
          component={() => (
            <DocsCommandPalette pages={pages} onNavigate={navigate} open={open} setOpen={setOpen} />
          )}
        />
      </MemoryRouter>
    ))

    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(untrack(open)).toBe(true)

    result.unmount()
    setOpen(false)
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(untrack(open)).toBe(false)
  })
})
