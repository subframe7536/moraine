import { createGenerator, presetWind3, presetWind4 } from '@subf/unocss'
import { describe, expect, test, vi } from 'vitest'

import { COLLAPSIBLE_CONTENT_WRAPPER_CLASS } from '../element/collapsible/collapsible.recipe'
import { sliderRecipe } from '../form/slider/slider.recipe'

import { cn } from './cn'
import { presetMoraine } from './unocss'
import type { PresetMoraineOptions } from './unocss'

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
  ])('compiles disclosure child state and slider group state with %s', async (_name, wind) => {
    const tokens = [
      ...COLLAPSIBLE_CONTENT_WRAPPER_CLASS.split(' '),
      ...cn(sliderRecipe.config.variants?.variant?.bold?.range)!
        .split(' ')
        .filter((token) => token.includes('dragging')),
    ]
    const css = await generate(tokens, false, wind)
    expect(css).toMatch(/\[data-(?:transition\]\[data-expanded|expanded\]\[data-transition)\]/)
    expect(css).toMatch(/\[data-(?:transition\]\[data-closed|closed\]\[data-transition)\]/)
    expect(css).toContain('@keyframes accordion-down')
    expect(css).toContain('@keyframes accordion-up')
    expect(css).toMatch(/\[data-multiple\]::before/)
    expect(css).toContain('::before')
    expect(css).toContain('::after')
    expect(css).toMatch(/transition(?:-property)?:\s*none/)
    expect(css).toMatch(/(?:\.group|:where\(\.group\))\[data-dragging\]/)
  })
  test.each([
    ['Wind3', presetWind3],
    ['Wind4', presetWind4],
  ])('compiles compound and hyphenated attributes with %s', async (_name, wind) => {
    const css = await generate(
      [
        'data-transition:data-expanded:animate-accordion-down',
        'data-transition:data-closed:h-0',
        'data-instant-motion:data-expanded:animate-none',
        'data-instant-motion:data-closed:animate-none',
      ],
      false,
      wind,
    )
    expect(css).toContain('[data-expanded][data-transition]')
    expect(css).toContain('[data-closed][data-transition]')
    expect(css).toContain('[data-expanded][data-instant-motion]')
    expect(css).toContain('[data-closed][data-instant-motion]')
    expect(css).toContain('animation:none')
    expect(css).toContain('@keyframes accordion-down')
  })
  test.each([
    ['Wind3', presetWind3],
    ['Wind4', presetWind4],
  ])('compiles CSS variable shorthand with %s', async (_name, wind) => {
    const utilities = {
      w: 'width',
      h: 'height',
      'min-w': 'min-width',
      'max-w': 'max-width',
      'max-h': 'max-height',
      mt: 'margin-top',
      mr: 'margin-right',
      mb: 'margin-bottom',
      ml: 'margin-left',
      pt: 'padding-top',
      gap: 'gap',
      top: 'top',
      bottom: 'bottom',
      left: 'left',
      right: 'right',
      origin: 'transform-origin',
    }
    for (const [utility, property] of Object.entries(utilities)) {
      const css = await generate([`${utility}-(--test-value)`], false, wind)
      expect(css).toContain(`${property}:var(--test-value)`)
    }

    const css = await generate(
      [
        'size-(--test-size)',
        'data-expanded:after:h-(--test-height)',
        'hover:-mt-(--test-offset)',
        'enter-translate-x-(--test-translate)',
      ],
      false,
      wind,
    )
    expect(css).toContain('width:var(--test-size)')
    expect(css).toContain('height:var(--test-size)')
    expect(css).toContain('[data-expanded]')
    expect(css).toContain('::after')
    expect(css).toContain('height:var(--test-height)')
    expect(css).toContain(':hover')
    expect(css).toContain('margin-top:calc(var(--test-offset) * -1)')
    expect(css).toContain('--mo-enter-translate-x:var(--test-translate)')
  })

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
    expect(css).toContain('border-radius:var(--radius)')
    expect(css).toContain('.bg-primary')
    expect(css).toContain('var(--primary)')
    expect(css).toContain('.z-floating')
    expect(css).toContain('z-index:50')
    expect(css).toMatch(/opacity:(0\.64|64%)/)
  })

  test.each([
    ['Wind3', presetWind3],
    ['Wind4', presetWind4],
  ])('%s rounded utilities read the local --radius', async (_name, wind) => {
    const css = await generate(['rounded-md', 'rounded-xl', 'rounded-t-lg'], false, wind)

    expect(css).toContain('.rounded-md{border-radius:calc(var(--radius) * 0.8);}')
    expect(css).toContain('.rounded-xl{border-radius:calc(var(--radius) * 1.4);}')
    expect(css).toContain(
      '.rounded-t-lg{border-top-left-radius:var(--radius);border-top-right-radius:var(--radius);}',
    )
  })

  test.each([
    ['Wind3', presetWind3],
    ['Wind4', presetWind4],
  ])('%s font utilities read the local --font-size', async (_name, wind) => {
    const css = await generate(['text-xs', 'text-sm', 'text-base', 'text-5xl'], false, wind)

    expect(css).toContain('font-size:calc(var(--font-size, 1rem) * 0.75)')
    expect(css).toContain('font-size:calc(var(--font-size, 1rem) * 0.875)')
    expect(css).toContain('.text-base{font-size:var(--font-size, 1rem)')
    expect(css).toContain('line-height:var(--un-leading, calc(var(--font-size, 1rem) * 1.25))')
    expect(css).toContain('.text-5xl{font-size:calc(var(--font-size, 1rem) * 3)')
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

  test.each([
    ['Wind3', presetWind3],
    ['Wind4', presetWind4],
  ])('emits the neutral light and dark defaults with %s', async (_name, wind) => {
    const generator = await createGenerator({ presets: [wind(), presetMoraine()] })
    const { css } = await generator.generate(new Set(), { preflights: true })

    expect(css).toContain(':root {')
    expect(css).toContain('--background: rgb(255, 255, 255);')
    expect(css).toContain('--primary: rgb(23, 23, 23);')
    expect(css).toContain('--primary-foreground: rgb(250, 250, 250);')
    expect(css).toContain('.dark {')
    expect(css).toContain('--background: rgb(10, 10, 10);')
    expect(css).toContain('--primary: rgb(229, 229, 229);')
    expect(css).toContain('--border: rgba(255, 255, 255, 0.1);')
    expect(css).toContain('--input: rgba(255, 255, 255, 0.15);')
    expect(css).not.toMatch(/--[\w-]+: oklch\(/)
    expect(css).toContain('@supports not (color: color-mix(in oklch, red, white))')
    expect(css).toContain('--mo-auto-primary-hover: rgb(41, 41, 41);')
    expect(css).toContain('--mo-auto-primary-active: rgb(50, 50, 50);')
    expect(css).toContain('--mo-auto-destructive-hover: rgb(233, 20, 31);')
    expect(css).toContain('@supports (color: color-mix(in oklch, red, white))')
    expect(css).toContain(
      '--mo-auto-primary-hover: color-mix(in oklch, var(--primary), var(--primary-foreground, var(--foreground)) 8%);',
    )
    expect(css).not.toContain('--primary-hover: color-mix(')
    expect(css).toContain('background-color: var(--background)')
    expect(css.indexOf(':root {')).toBeLessThan(css.indexOf('.dark {'))
  })

  test.each([
    ['Wind3', presetWind3],
    ['Wind4', presetWind4],
  ])('lets CSS own theme colors with %s', async (_name, wind) => {
    const generator = await createGenerator({
      presets: [
        wind(),
        presetMoraine({
          themeDefaults: false,
          fonts: { sans: 'Inter' },
          override: { brand: { colors: { primary: '#369' } } },
        }),
      ],
    })
    const { css } = await generator.generate(new Set(['bg-primary-hover']), { preflights: true })

    expect(css).toContain('--font-sans: Inter;')
    expect(css).toContain('[data-theme="brand"] {\n  --primary: #369;\n}')
    expect(css).not.toContain('--background: rgb(')
    expect(css).not.toContain('html {\n  background-color: var(--background);')
    expect(css).toContain('--mo-auto-primary-hover: var(--primary);')
    expect(css).toContain('*, ::before, ::after {')
    expect(css).toContain('var(--primary-hover, var(--mo-auto-primary-hover, var(--primary)))')
  })

  test('uses configured proportions for neutral RGB fallbacks', async () => {
    const generator = await createGenerator({
      presets: [presetWind4(), presetMoraine({ colorStates: { hover: 20, active: 40 } })],
    })
    const { css } = await generator.generate(new Set(), { preflights: true })

    expect(css).toContain('--mo-auto-primary-hover: rgb(68, 68, 68);')
    expect(css).toContain('--mo-auto-primary-active: rgb(114, 114, 114);')
    expect(css).toContain(
      '--mo-auto-primary-hover: color-mix(in oklch, var(--primary), var(--primary-foreground, var(--foreground)) 20%);',
    )
  })

  test('uses a numeric state override for the neutral RGB fallback', async () => {
    const generator = await createGenerator({
      presets: [
        presetWind4(),
        presetMoraine({ override: { light: { colors: { primary: { hover: 5 } } } } }),
      ],
    })
    const { css } = await generator.generate(new Set(), { preflights: true })

    expect(css).toContain('--mo-auto-primary-hover: rgb(34, 34, 34);')
    expect(css).toContain(
      '--primary-hover: color-mix(in oklch, var(--primary), var(--primary-foreground, var(--foreground)) 5%);',
    )
  })

  test.each([
    ['Wind3', presetWind3],
    ['Wind4', presetWind4],
  ])('applies named overrides and top-level tokens with %s', async (_name, wind) => {
    const activeResolver = vi.fn(() => '#135')
    const options: PresetMoraineOptions = {
      fonts: { sans: 'Inter', mono: 'monospace', serif: 'Georgia' },
      radius: '0.625rem',
      fontSize: '1rem',
      spacing: '0.25rem',
      sidebarWidth: '18rem',
      colorStates: { hover: 6 },
      override: {
        light: {
          shadows: { base: '0 1px 2px #111', '2xs': '0 1px #111' },
          colors: {
            primary: { base: '#246', active: activeResolver },
            secondary: { foreground: '#fff' },
          },
        },
        dark: {
          colors: { primary: { foreground: '#111', hover: '#369' } },
          shadows: { sm: '0 2px #111' },
        },
        brand: { colors: { primary: '#369' } },
        custom: {
          selector: '[data-theme="custom"]',
          colors: { primary: { foreground: '#fff', hover: 5 } },
        },
      },
    }
    const generator = await createGenerator({ presets: [wind(), presetMoraine(options)] })
    const { css } = await generator.generate(new Set(), { preflights: true })

    expect(css).toContain(':root {')
    expect(css).toContain('--primary: #246;')
    expect(css).toContain('--primary-foreground: rgb(250, 250, 250);')
    expect(css).toContain(
      '--mo-auto-primary-hover: color-mix(in oklch, var(--primary), var(--primary-foreground, var(--foreground)) 6%);',
    )
    expect(css).toContain('--mo-auto-primary-hover: var(--primary);')
    expect(css).toContain('--primary-active: #135;')
    expect(css).toContain('--secondary: rgb(245, 245, 245);')
    expect(css).toContain('--secondary-foreground: #fff;')
    expect(css).toContain('--font-sans: Inter;')
    expect(css).toContain('--font-mono: monospace;')
    expect(css).toContain('--font-serif: Georgia;')
    expect(css).toMatch(/:root \{[^}]*--shadow: 0 1px 2px #111;/)
    expect(css).toMatch(/:root \{[^}]*--shadow-2xs: 0 1px #111;/)
    expect(css).toMatch(/\.dark \{[^}]*--shadow-sm: 0 2px #111;/)
    expect(css).not.toMatch(/\.dark \{[^}]*--shadow-2xs:/)
    expect(css).toContain('--radius: 0.625rem;')
    expect(css).toContain('--font-size: 1rem;')
    expect(css).toContain('--spacing: 0.25rem;')
    expect(css).toContain('--sidebar-width: 18rem;')
    expect(css).toContain('--primary-hover: #369;')
    expect(css).toContain('[data-theme="brand"] {')
    expect(css).toContain('[data-theme="custom"] {\n  --primary-foreground: #fff;')
    expect(css).not.toContain('[data-theme="custom"] {\n  --primary:')
    expect(css.indexOf(':root {')).toBeLessThan(css.indexOf('.dark {'))
    expect(css.indexOf('.dark {')).toBeLessThan(css.indexOf('[data-theme="brand"] {'))
    expect(activeResolver).toHaveBeenCalledWith(
      expect.objectContaining({ selector: ':root', color: 'primary', base: '#246' }),
    )
  })

  test('uses an explicit selector and keeps explicit states when generation is disabled', async () => {
    const active = vi.fn(() => '#135')
    const generator = await createGenerator({
      presets: [
        presetWind4(),
        presetMoraine({
          colorStates: false,
          themeDefaults: false,
          override: {
            dark: {
              selector: '[data-mode="night"]',
              colors: { background: { active }, primary: { hover: 5 } },
            },
          },
        }),
      ],
    })
    const { css } = await generator.generate(new Set(), { preflights: true })

    expect(css).toContain('[data-mode="night"] {')
    expect(css).not.toContain('.dark {')
    expect(css).toContain('--background-active: #135;')
    expect(css).toContain(
      '--primary-hover: color-mix(in oklch, var(--primary), var(--primary-foreground, var(--foreground)) 5%);',
    )
    expect(css).not.toContain('--primary-active:')
    expect(css).not.toContain('--mo-auto-primary-hover:')
    expect(css).not.toContain('--background: rgb(')
    expect(css).not.toContain('background-color: var(--background)')
    expect(active).toHaveBeenCalledWith(
      expect.objectContaining({ selector: '[data-mode="night"]', base: 'var(--background)' }),
    )
  })

  test('does not generate extra states for a custom theme without a base', async () => {
    const hover = vi.fn(() => '#369')
    const generator = await createGenerator({
      presets: [
        presetWind4(),
        presetMoraine({
          override: { brand: { colors: { primary: { foreground: '#fff', hover } } } },
        }),
      ],
    })
    const { css } = await generator.generate(new Set(), { preflights: true })
    expect(css).toContain(
      '[data-theme="brand"] {\n  --primary-foreground: #fff;\n  --primary-hover: #369;\n}',
    )
    expect(css).not.toContain('[data-theme="brand"] {\n  --primary:')
    expect(hover).toHaveBeenCalledWith(
      expect.objectContaining({ selector: '[data-theme="brand"]', base: 'var(--primary)' }),
    )
  })

  test('rejects invalid adjustments', () => {
    expect(() => presetMoraine({ colorStates: { hover: Number.POSITIVE_INFINITY } })).toThrow(
      'colorStates.hover',
    )
  })
})
