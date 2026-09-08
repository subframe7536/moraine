import { createComponent, createSignal } from 'solid-js'
import { hydrate } from 'solid-js/web'
import { expect, test } from 'vitest'

import { renderSsrFixture, installHydrationState } from '../../test-utils/ssr-test.ts'
import { createTheme } from '../../theme/create-theme.ts'

import { ThemeHydrationFixture, fixtureTheme } from './moraine-provider.ssr.fixture.tsx'

test('hydrates Theme presentation once and preserves native nodes across replacement', () => {
  const container = document.createElement('div')
  container.innerHTML = renderSsrFixture(
    '/src/shared/provider/moraine-provider.ssr.fixture.tsx',
    'renderThemeFixture',
  )
  document.body.append(container)
  const presentation = () =>
    Array.from(container.querySelectorAll('*'), (element) => [
      element.tagName,
      ...Array.from(element.attributes, (attr) => [attr.name, attr.value]).filter(
        ([name]) =>
          name === 'class' ||
          name === 'style' ||
          name?.startsWith('data-') ||
          name?.startsWith('aria-'),
      ),
    ])
  const before = presentation()
  const input = container.querySelector('input')!
  const textarea = container.querySelector('textarea')!
  const button = container.querySelector('button')!
  const restore = installHydrationState()
  const [theme, setTheme] = createSignal(fixtureTheme)
  let reads = 0
  const dispose = hydrate(
    () =>
      createComponent(ThemeHydrationFixture, {
        get theme() {
          reads++
          return theme()
        },
      }),
    container,
  )
  try {
    expect(reads).toBe(1)
    expect(presentation()).toEqual(before)
    expect(input.readOnly).toBe(false)
    expect(textarea.readOnly).toBe(false)
    expect(container.querySelector('input')).toBe(input)
    expect(container.querySelector('textarea')).toBe(textarea)
    expect(button.className).toContain('h-7')
    expect(button.hasAttribute('data-loading')).toBe(true)
    input.focus()
    input.value = 'Local edit'
    input.setSelectionRange(1, 4)
    textarea.value = 'Another edit'
    setTheme(createTheme({ button: { defaults: { size: 'lg' }, base: { root: 'rounded-xl' } } }))
    expect(reads).toBe(2)
    expect(container.querySelector('button')).toBe(button)
    expect(button.className).toContain('rounded-xl')
    expect(input.value).toBe('Local edit')
    expect(textarea.value).toBe('Another edit')
    expect(document.activeElement).toBe(input)
    expect([input.selectionStart, input.selectionEnd]).toEqual([1, 4])
  } finally {
    dispose()
    container.remove()
    restore()
  }
})
