import { createComponent, createSignal } from 'solid-js'
import { hydrate } from 'solid-js/web'
import { expect, test } from 'vitest'

import { renderSsrFixture, installHydrationState } from '../../test-utils/ssr-test'
import { createTheme } from '../../theme/create-theme'
import type { CnConfig } from '../style/cn'

import {
  CnHydrationFixture,
  fixtureCnConfig,
  ThemeHydrationFixture,
  fixtureTheme,
} from './moraine-provider.ssr.fixture'

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
  const dispose = hydrate(
    () =>
      createComponent(ThemeHydrationFixture, {
        get theme() {
          return theme()
        },
      }),
    container,
  )
  try {
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

test('hydrates headless presentation with the same component nodes', () => {
  const container = document.createElement('div')
  container.innerHTML = renderSsrFixture(
    '/src/shared/provider/moraine-provider.ssr.fixture.tsx',
    'renderHeadlessThemeFixture',
  )
  document.body.append(container)
  const button = container.querySelector('button')!
  const input = container.querySelector('input')!
  const restore = installHydrationState()
  const dispose = hydrate(() => <ThemeHydrationFixture />, container)
  try {
    expect(container.querySelector('button')).toBe(button)
    expect(container.querySelector('input')).toBe(input)
    expect(button.className).toBe('')
    expect(input.value).toBe('Input draft')
  } finally {
    dispose()
    container.remove()
    restore()
  }
})

test('isolates SSR requests and hydrates scoped merging with live config replacement', () => {
  const fixture = '/src/shared/provider/moraine-provider.ssr.fixture.tsx'
  const html = renderSsrFixture(fixture, 'renderCnFixture')
  const defaultHtml = renderSsrFixture(fixture, 'renderDefaultCnFixture')
  expect(html).toContain('p-2 p-4')
  expect(defaultHtml).not.toContain('p-2 p-4')
  expect(renderSsrFixture(fixture, 'renderCnFixture')).toBe(html)
  const container = document.createElement('div')
  container.innerHTML = html
  document.body.append(container)
  const button = container.querySelector('button')!
  const input = container.querySelector('input')!
  const before = button.className
  const restore = installHydrationState()
  const [config, setConfig] = createSignal<CnConfig | undefined>(fixtureCnConfig)
  const dispose = hydrate(() => <CnHydrationFixture cnConfig={config()} />, container)
  try {
    expect(container.querySelector('button')).toBe(button)
    expect(button.className).toBe(before)
    expect(container.querySelector('input')).toBe(input)
    input.focus()
    input.value = 'Local edit'
    input.setSelectionRange(1, 4)
    setConfig(undefined)
    expect(button.className).toContain('p-4')
    expect(button.className).not.toContain('p-2')
    expect(container.querySelector('input')).toBe(input)
    expect(input.value).toBe('Local edit')
    expect(document.activeElement).toBe(input)
    expect([input.selectionStart, input.selectionEnd]).toEqual([1, 4])
  } finally {
    dispose()
    container.remove()
    restore()
  }
})
