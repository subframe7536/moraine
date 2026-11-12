import { render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { expect, test } from 'vitest'

import { MoraineProvider, Skeleton } from '../../index'
import { defineTheme } from '../../theme'

test('keeps placeholders mounted and applies user classes when the theme changes', () => {
  const [theme, setTheme] = createSignal(
    defineTheme({ skeleton: { base: { root: 'theme-skeleton-a' } } }),
  )
  const { container } = render(() => (
    <MoraineProvider theme={theme()}>
      <Skeleton id="themed" class="user-skeleton" />
      <Skeleton id="explicit" variant="pulse" />
    </MoraineProvider>
  ))
  const themed = container.querySelector('#themed')!
  const explicit = container.querySelector('#explicit')!
  expect(themed.className).toContain('theme-skeleton-a')
  expect(themed.className).toContain('user-skeleton')

  setTheme(defineTheme({ skeleton: { base: { root: 'theme-skeleton-b' } } }))

  expect(container.querySelector('#themed')).toBe(themed)
  expect(themed.className).toContain('theme-skeleton-b')
  expect(themed.className).toContain('user-skeleton')
  expect(container.querySelector('#explicit')).toBe(explicit)
})
