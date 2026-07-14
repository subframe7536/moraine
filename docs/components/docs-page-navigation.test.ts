import { describe, expect, test } from 'vitest'

import { getAdjacentDocsPages } from './docs-page-navigation.utils'
import type { DocsPageEntry } from './docs-route'

const page = (key: string, path: string, group?: string): DocsPageEntry => ({
  key,
  path,
  group,
  label: key,
  description: `${key} page`,
  order: 10,
  tags: [key],
})

const PAGES = [
  page('introduction', '/'),
  page('utils', '/utils'),
  page('checkbox', '/checkbox', 'form'),
  page('accordion', '/accordion', 'general'),
]

describe('getAdjacentDocsPages', () => {
  test('returns only next for the first page', () => {
    expect(getAdjacentDocsPages(PAGES, 'introduction')).toEqual({ next: PAGES[1] })
  })

  test('crosses group boundaries in the flattened sidebar order', () => {
    expect(getAdjacentDocsPages(PAGES, 'checkbox')).toEqual({
      previous: PAGES[1],
      next: PAGES[3],
    })
  })

  test('returns only previous for the final page', () => {
    expect(getAdjacentDocsPages(PAGES, 'accordion')).toEqual({ previous: PAGES[2] })
  })

  test('returns no links for an unknown path', () => {
    expect(getAdjacentDocsPages(PAGES, 'missing')).toEqual({})
  })
})
