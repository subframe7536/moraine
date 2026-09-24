// @vitest-environment jsdom

import { render } from '@solidjs/testing-library'
import { expect, test } from 'vitest'

import { buildDocsCommandItems } from './docs-command-palette'
import { Sidebar } from './sidebar'

test('starts sidebar and search with Getting Started, without a landing docs entry', () => {
  const pages = [
    {
      key: 'start',
      path: '/start',
      label: 'Getting Started',
      description: 'Install Moraine.',
      order: 1,
      tags: ['installation'],
      sections: [],
    },
    {
      key: 'styling',
      path: '/styling',
      label: 'Styling',
      description: 'Configure styles.',
      order: 2,
      tags: ['theme'],
      sections: [],
    },
  ]
  expect(pages.map((page) => page.path)).toEqual(['/start', '/styling'])
  expect(buildDocsCommandItems(pages)[0]?.items?.[0]).toMatchObject({
    href: '/start',
    label: 'Getting Started',
  })

  const view = render(() => (
    <Sidebar pages={pages} activePage={() => 'start'} setActivePage={() => {}} />
  ))
  expect(view.getByRole('link', { name: 'Getting Started' }).getAttribute('aria-current')).toBe(
    'page',
  )
  expect(view.queryByRole('link', { name: 'Introduction' })).toBeNull()
})

test('the landing route owns distinct product metadata', async () => {
  const { default: landing } = await import('../../index')
  expect(landing.metadata).toMatchObject({
    title: 'Moraine — SolidJS component library',
    canonical: 'https://ui.subf.dev/',
  })
  expect(landing.metadata?.meta).toEqual(
    expect.arrayContaining([
      { property: 'og:url', content: 'https://ui.subf.dev/' },
      { name: 'twitter:title', content: 'Moraine — SolidJS component library' },
    ]),
  )
})
