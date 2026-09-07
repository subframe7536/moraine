import { createGenerator, presetWind3, presetWind4 } from '@subf/unocss'
import { describe, expect, test, vi } from 'vitest'

import { presetMoraine, resolvePresetThemeOptions } from './theme.ts'

async function generate(
  tokens: string[],
  preflights = false,
  wind: typeof presetWind3 | typeof presetWind4 = presetWind4,
): Promise<string> {
  const generator = await createGenerator({
    presets: [wind(), presetMoraine()],
  })
  const { css } = await generator.generate(new Set(tokens), { preflights })
  return css
}

describe('presetMoraine', () => {
  test.each([
    ['Wind3', presetWind3],
    ['Wind4', presetWind4],
  ])('registers %s theme tokens', async (name, wind) => {
    const css = await generate(
      [
        'rounded-lg',
        'shadow-md',
        'font-sans',
        'w-sidebar',
        'bg-primary',
        'z-floating',
        'opacity-64',
      ],
      false,
      wind,
    )

    expect(css).toContain('.rounded-lg')
    expect(css).toContain('.shadow-md')
    expect(css).toContain('.font-sans')
    expect(css).toContain('--un-shadow:var(--shadow-md)')
    expect(css).toContain('font-family:var(--font-sans)')
    expect(css).toContain('.w-sidebar')
    expect(css).toContain(
      name === 'Wind3'
        ? 'width:var(--sidebar-width,clamp(14rem,25%,20rem))'
        : 'width:var(--spacing-sidebar)',
    )
    expect(css).toContain(
      name === 'Wind3' ? 'border-radius:var(--radius)' : 'border-radius:var(--radius-lg)',
    )
    expect(css).toContain('.bg-primary')
    expect(css).toContain('var(--primary)')
    expect(css).toContain('.z-floating')
    expect(css).toContain('z-index:50')
    expect(css).toMatch(/opacity:(0\.64|64%)/)
  })

  test('registers data and aria presence variants', async () => {
    const css = await generate([
      'data-disabled:opacity-64',
      'data-focused:ring-3',
      'aria-invalid:border-destructive',
    ])

    expect(css).toContain('[data-disabled]')
    expect(css).toContain('[data-focused]')
    expect(css).toContain('[aria-invalid]')
    expect(css).toMatch(/opacity:(0\.64|64%)/)
    expect(css).toContain('var(--destructive)')
  })

  test('registers shared enter and exit animations', async () => {
    const css = await generate(['animate-mo-enter', 'animate-mo-exit'], true)

    expect(css).toContain('.animate-mo-enter')
    expect(css).toContain('.animate-mo-exit')
    expect(css).toContain('@keyframes mo-enter')
    expect(css).toContain('@keyframes mo-exit')
    expect(css).toContain('--mo-anim-duration-enter,250ms')
    expect(css).toContain('--mo-anim-duration-exit,150ms')
  })

  test('retains semantic z-index and icon shortcuts only', () => {
    const preset = presetMoraine()
    const shortcuts = (preset.shortcuts as Array<[string, unknown]>).map((shortcut) => shortcut[0])

    expect(shortcuts).toContain('z-floating')
    expect(shortcuts).toContain('icon-check')
    expect(
      shortcuts.every((shortcut) => shortcut.startsWith('z-') || shortcut.startsWith('icon-')),
    ).toBe(true)
    expect(preset.transformers).toBeUndefined()
    expect(preset.rules).toBeDefined()
  })

  test.each([
    ['Wind3', presetWind3],
    ['Wind4', presetWind4],
  ])('registers enter and exit animation utilities with %s', async (_name, wind) => {
    const css = await generate(
      [
        'enter-opacity-0',
        'exit-opacity-0',
        'enter-opacity-50',
        'enter-scale-95',
        'exit-scale-95',
        'enter-translate-x-1',
        '-enter-translate-x-1',
        'exit-translate-x-1',
        '-exit-translate-x-1',
        'enter-translate-y-1',
        '-enter-translate-y-1',
        'exit-translate-y-1',
        '-exit-translate-y-1',
        'enter-translate-y-10',
        '-enter-translate-y-10',
        'enter-translate-y-full',
        '-enter-translate-y-full',
        'enter-rotate-45',
        '-enter-rotate-45',
        'data-expanded:enter-opacity-0',
        'data-closed:exit-scale-95',
      ],
      false,
      wind,
    )

    expect(css).toContain('.enter-opacity-0{--mo-enter-opacity:0;}')
    expect(css).toContain('.exit-opacity-0{--mo-exit-opacity:0;}')
    expect(css).toContain('.enter-opacity-50{--mo-enter-opacity:0.5;}')
    expect(css).toContain('.enter-scale-95{--mo-enter-scale:0.95;}')
    expect(css).toContain('.exit-scale-95{--mo-exit-scale:0.95;}')
    expect(css).toContain('.enter-translate-x-1{--mo-enter-translate-x:0.25rem;}')
    expect(css).toContain('.-enter-translate-x-1{--mo-enter-translate-x:-0.25rem;}')
    expect(css).toContain('.exit-translate-x-1{--mo-exit-translate-x:0.25rem;}')
    expect(css).toContain('.-exit-translate-x-1{--mo-exit-translate-x:-0.25rem;}')
    expect(css).toContain('.enter-translate-y-1{--mo-enter-translate-y:0.25rem;}')
    expect(css).toContain('.-enter-translate-y-1{--mo-enter-translate-y:-0.25rem;}')
    expect(css).toContain('.exit-translate-y-1{--mo-exit-translate-y:0.25rem;}')
    expect(css).toContain('.-exit-translate-y-1{--mo-exit-translate-y:-0.25rem;}')
    expect(css).toContain('.enter-translate-y-10{--mo-enter-translate-y:2.5rem;}')
    expect(css).toContain('.-enter-translate-y-10{--mo-enter-translate-y:-2.5rem;}')
    expect(css).toContain('.enter-translate-y-full{--mo-enter-translate-y:100%;}')
    expect(css).toContain('.-enter-translate-y-full{--mo-enter-translate-y:-100%;}')
    expect(css).toContain('.enter-rotate-45{--mo-enter-rotate:45deg;}')
    expect(css).toContain('.-enter-rotate-45{--mo-enter-rotate:-45deg;}')
    expect(css).toContain('[data-expanded]')
    expect(css).toContain('[data-closed]')
  })

  test.each([
    ['Wind3', presetWind3],
    ['Wind4', presetWind4],
  ])('preserves the host transition defaults with %s', async (_name, wind) => {
    const css = await generate(['transition', 'transition-colors'], true, wind)
    expect(css).not.toContain('transition-duration:var(--mo-anim-duration')
    expect(css).not.toContain('--default-transition-duration: var(--mo-anim-duration')
    expect(css).not.toContain('--default-transition-timingFunction: cubic-bezier(0.16, 1, 0.3, 1)')
  })

  test('does not emit color variables without configuration', async () => {
    const generator = await createGenerator({
      presets: [presetWind4(), presetMoraine()],
    })
    const { css } = await generator.generate(new Set(), { preflights: true })

    expect(css).not.toContain('--primary:')
    expect(css).toContain('background-color: var(--background)')
  })

  test('emits configured color variables and state adjustments', async () => {
    const activeResolver = vi.fn(() => '#135')
    const generator = await createGenerator({
      presets: [
        presetWind4(),
        presetMoraine({
          colorVariables: {
            light: {
              background: { DEFAULT: '#fff' },
              foreground: '#111',
              primary: {
                DEFAULT: '#246',
                foreground: '#fff',
                active: activeResolver,
              },
            },
            hoverAdjustment: 6,
            activeAdjustment: 12,
          },
        }),
      ],
    })
    const { css } = await generator.generate(new Set(), { preflights: true })

    expect(css).toContain('--background: #fff;')
    expect(css).toContain(
      '--background-hover: color-mix(in oklch, var(--background), var(--foreground) 6%);',
    )
    expect(css).toContain('--primary-active: #135;')
    expect(activeResolver).toHaveBeenCalledWith(
      expect.objectContaining({ color: 'primary', state: 'active', theme: 'light' }),
    )
  })

  test('normalizes selectors and rejects invalid adjustments', () => {
    expect(
      resolvePresetThemeOptions({
        colorVariables: { light: { foreground: '#111' } },
      }),
    ).toMatchObject({
      globalStyles: true,
      colorVariables: { lightSelector: ':root', darkSelector: '.dark' },
    })

    expect(() =>
      presetMoraine({ colorVariables: { hoverAdjustment: Number.POSITIVE_INFINITY } }),
    ).toThrow('colorVariables.hoverAdjustment')
  })
})
