import { render } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { ContentHeader } from './content-header'

describe('ContentHeader', () => {
  test('places the GitHub link before the theme switcher', () => {
    const screen = render(() => (
      <ContentHeader
        pageTitle={() => 'Introduction'}
        scrolled={() => false}
        theme={() => 'dark'}
        setTheme={() => undefined}
      />
    ))
    const github = screen.getByRole('link', { name: 'GitHub repository' })
    const themeSwitcher = screen.getByRole('switch', { name: 'Toggle color theme' })
    const githubIcon = github.querySelector('[data-slot="icon"]')

    expect(github.compareDocumentPosition(themeSwitcher) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(githubIcon?.className).toContain('i-lucide-github')
  })
})
