import { render } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { DocsHeader } from './docs-header'

describe('DocsHeader', () => {
  test.each([
    ['new', 'NEW'],
    ['update', 'UPDATE'],
    ['unreleased', 'UNRELEASED'],
    ['unrelease', 'UNRELEASED'],
    ['NeW', 'NEW'],
  ])('renders status %s as %s', (status, label) => {
    const screen = render(() => (
      <DocsHeader componentKey="button" name="Button" status={status as any} />
    ))

    expect(screen.getByText(label)).toBeDefined()
  })

  test('does not render status badge when status is missing', () => {
    const screen = render(() => <DocsHeader componentKey="button" name="Button" />)

    expect(screen.queryByText('NEW')).toBeNull()
    expect(screen.queryByText('UPDATE')).toBeNull()
    expect(screen.queryByText('UNRELEASED')).toBeNull()
  })
})
