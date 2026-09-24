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

  test('validates an explicit API source registration', () => {
    expect(
      parseFrontmatterData(
        `${VALID_FRONTMATTER}\napi:\n  path: src/overlay/dialog/dialog\n  parts:\n    - Trigger\n    - name: Content\n      path: src/overlay/shared/content\n`,
        '/docs/dialog.mdx',
      ).api,
    ).toEqual({
      path: 'src/overlay/dialog/dialog',
      parts: ['Trigger', { name: 'Content', path: 'src/overlay/shared/content' }],
    })
  })

  test.each([
    ['src/element/button/button.tsx', 'api.path must be an extensionless component path under'],
    ['../button', 'api.path must be an extensionless component path under'],
  ])('rejects invalid API paths', (apiPath, message) => {
    expect(() =>
      parseFrontmatterData(`${VALID_FRONTMATTER}\napi:\n  path: ${apiPath}\n`, '/docs/button.mdx'),
    ).toThrow(message)
  })

  test('rejects duplicate composite parts', () => {
    expect(() =>
      parseFrontmatterData(
        `${VALID_FRONTMATTER}\napi:\n  path: src/overlay/dialog/dialog\n  parts: [Trigger, Trigger]\n`,
        '/docs/dialog.mdx',
      ),
    ).toThrow('api.parts[1] duplicates part "Trigger"')
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
