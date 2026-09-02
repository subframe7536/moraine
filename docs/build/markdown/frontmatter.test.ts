// @vitest-environment node

import { describe, expect, test } from 'vitest'

import { parseFrontmatterData } from './frontmatter'

const VALID_FRONTMATTER = `
title: Button
description: Button page.
sidebar:
  order: 10
  badge: New
search:
  tags: [action, submit]
`

describe('parseFrontmatterData', () => {
  test('normalizes required page metadata', () => {
    expect(parseFrontmatterData(VALID_FRONTMATTER, '/docs/button.mdx')).toMatchObject({
      title: 'Button',
      description: 'Button page.',
      sidebar: { order: 10, badge: 'New' },
      search: { tags: ['action', 'submit'] },
    })
  })

  test.each([
    ['', 'frontmatter is required'],
    [VALID_FRONTMATTER.replace('title: Button\n', ''), 'title must be a non-empty string'],
    [
      VALID_FRONTMATTER.replace('description: Button page.\n', ''),
      'description must be a non-empty string',
    ],
    [
      VALID_FRONTMATTER.replace('order: 10', 'order: -1'),
      'sidebar.order must be a non-negative integer',
    ],
    [
      VALID_FRONTMATTER.replace('[action, submit]', '[]'),
      'search.tags must be a non-empty string array',
    ],
    [
      VALID_FRONTMATTER.replace('badge: New', 'badge: ""'),
      'sidebar.badge must be a non-empty string',
    ],
  ])('rejects invalid metadata', (source, message) => {
    expect(() => parseFrontmatterData(source, '/docs/button.mdx')).toThrow(
      `/docs/button.mdx: ${message}`,
    )
  })
})
