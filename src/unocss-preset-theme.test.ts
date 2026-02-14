import { colors as wind4Colors } from '@unocss/preset-wind4/colors'
import { describe, expect, test } from 'vitest'

import { presetTheme } from './unocss-preset-theme'

function getShortcut(name: string, shortcuts: unknown): string | undefined {
  if (!Array.isArray(shortcuts)) {
    return undefined
  }

  const hit = shortcuts.find((entry) => {
    return Array.isArray(entry) && entry[0] === name
  }) as [string, string] | undefined

  return hit?.[1]
}

describe('presetTheme', () => {
  test('creates default Nuxt UI icon aliases as shortcuts', () => {
    const preset = presetTheme()
    const iconLoading = getShortcut('icon-loading', preset.shortcuts)
    const iconChevronDown = getShortcut('icon-chevron-down', preset.shortcuts)

    expect(iconLoading).toBe('i-lucide-loader-circle')
    expect(iconChevronDown).toBe('i-lucide-chevron-down')
  })

  test('maps Nuxt UI colors and supports overrides', () => {
    const preset = presetTheme({
      colors: {
        primary: 'rose',
      },
      icons: {
        loading: 'i-lucide-loader',
      },
    })

    const themeColors = (preset.theme as { colors?: Record<string, any> } | undefined)?.colors

    expect(themeColors?.primary?.[500]).toBe(wind4Colors.rose[500])
    expect(themeColors?.secondary?.[500]).toBe(wind4Colors.blue[500])
    expect(getShortcut('icon-loading', preset.shortcuts)).toBe('i-lucide-loader')
  })

  test('emits Nuxt UI css variables and dark theme overrides in preflights', () => {
    const preset = presetTheme({
      colors: {
        primary: 'emerald',
      },
    })

    const css = preset.preflights?.[0]?.getCSS?.({} as any) ?? ''

    expect(css).toContain('--ui-color-primary-500')
    expect(css).toContain(wind4Colors.emerald[500])
    expect(css).toContain('--ui-primary: var(--ui-color-primary-500);')
    expect(css).toContain('--ui-primary: var(--ui-color-primary-400);')
    expect(css).toContain('.dark {')
    expect(css).toContain('--colors-background')
  })
})
