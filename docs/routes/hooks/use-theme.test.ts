import { render } from '@solidjs/testing-library'
import type { Accessor } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { THEME_STORAGE_KEY, useTheme } from './use-theme.ts'
import type { ThemeMode } from './use-theme.ts'

const originalMatchMedia = window.matchMedia
const originalLocalStorage = Object.getOwnPropertyDescriptor(window, 'localStorage')
const originalStartViewTransition = Object.getOwnPropertyDescriptor(document, 'startViewTransition')

let theme: Accessor<ThemeMode>
let updateTheme: (nextTheme: ThemeMode) => void

function renderTheme() {
  return render(() => {
    const state = useTheme()
    theme = state.theme
    updateTheme = state.updateTheme
    return document.createElement('div')
  })
}

beforeEach(() => {
  window.localStorage.clear()
  window.matchMedia = vi.fn(() => ({ matches: false })) as unknown as typeof window.matchMedia
  document.documentElement.classList.remove('dark')
  document.documentElement.style.colorScheme = ''
  Object.defineProperty(document, 'startViewTransition', {
    configurable: true,
    value: undefined,
  })
})

afterEach(() => {
  document.body.innerHTML = ''
  window.matchMedia = originalMatchMedia
  if (originalLocalStorage) {
    Object.defineProperty(window, 'localStorage', originalLocalStorage)
  }
  if (originalStartViewTransition) {
    Object.defineProperty(document, 'startViewTransition', originalStartViewTransition)
  } else {
    delete (document as { startViewTransition?: unknown }).startViewTransition
  }
  vi.restoreAllMocks()
})

describe('useTheme', () => {
  test('uses a stored explicit theme and synchronizes the bootstrap DOM', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    document.documentElement.classList.add('dark')
    document.documentElement.style.colorScheme = 'dark'

    renderTheme()

    expect(theme!()).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  test('falls back to the system preference when storage is missing', () => {
    window.matchMedia = vi.fn(() => ({ matches: true })) as unknown as typeof window.matchMedia

    renderTheme()

    expect(theme!()).toBe('dark')
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
  })

  test('falls back to the system preference for invalid storage', () => {
    window.matchMedia = vi.fn(() => ({ matches: true })) as unknown as typeof window.matchMedia
    window.localStorage.setItem(THEME_STORAGE_KEY, 'system')

    renderTheme()

    expect(theme!()).toBe('dark')
  })

  test('falls back to the system preference when storage is blocked', () => {
    const blockedStorage = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: blockedStorage,
    })
    window.matchMedia = vi.fn(() => ({ matches: true })) as unknown as typeof window.matchMedia

    renderTheme()

    expect(theme!()).toBe('dark')
  })

  test('applies and persists an explicit change without View Transitions', () => {
    renderTheme()
    updateTheme!('dark')

    expect(theme!()).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })
})
