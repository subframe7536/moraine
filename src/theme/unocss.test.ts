import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { createGenerator, presetWind3, presetWind4 } from '@subf/unocss'
import { describe, expect, test, vi } from 'vitest'

import { COLLAPSIBLE_CONTENT_WRAPPER_CLASS } from '../element/collapsible/collapsible.recipe'
import { baseSelectRecipe } from '../form/base-select/base-select.recipe'
import { inputGroupRecipe } from '../form/input-group/input-group.recipe'
import { inputNumberRecipe } from '../form/input-number/input-number.recipe'
import { inputRecipe } from '../form/input/input.recipe'
import { SELECT_FAMILY_SLOTS } from '../form/shared/select/select-field.recipe'
import { sliderRecipe } from '../form/slider/slider.recipe'
import { commandPaletteRecipe } from '../navigation/command-palette/command-palette.recipe'
import { overlayMenuRecipeOptions } from '../overlay/base/menu/menu.recipe'

import { cn } from './cn'
import { presetMoraine } from './unocss'
import type { PresetMoraineOptions } from './unocss'

const TAILWIND_THEME_CSS = readFileSync(
  resolve(__dirname, '../../node_modules/tailwindcss/theme.css'),
  'utf8',
)

async function generate(
  tokens: string[],
  preflights = false,
  wind: typeof presetWind3 | typeof presetWind4 = presetWind4,
): Promise<string> {
  const generator = await createGenerator({
    presets: [wind(), presetMoraine({ wind3: wind === presetWind3 })],
  })
  const { css } = await generator.generate(new Set(tokens), { preflights })
  return css
}

describe('presetMoraine', () => {
  test.each([
    ['Wind3', presetWind3, () => createGenerator({ presets: [presetWind3()] })],
    ['Wind4', presetWind4, () => createGenerator({ presets: [presetWind4()] })],
  ])('preserves the native %s shadow scale', async (_name, wind, createBaseline) => {
    const candidates = ['shadow-xs', 'shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-2xl']
    const generator = await createBaseline()
    const { css } = await generator.generate(new Set(candidates), { preflights: false })
    expect(await generate(candidates, false, wind)).toBe(css)
  })

  test('compiles high-contrast accent colors for ghost controls and their text slots', async () => {
    const generator = await createGenerator({
      presets: [
        presetWind4(),
        presetMoraine({
          override: {
            light: {
              colors: {
                accent: { base: 'rgb(10, 10, 10)', foreground: 'rgb(250, 250, 250)' },
              },
            },
          },
        }),
      ],
    })
    const tokens = [
      inputRecipe.config.compoundVariants?.find((variant) => variant.variants.variant === 'ghost')
        ?.root,
      inputNumberRecipe.config.variants?.variant?.ghost?.root,
      inputNumberRecipe.config.variants?.variant?.ghost?.input,
      inputGroupRecipe.config.variants?.variant?.ghost?.root,
      'group-hover/input-group:text-accent-foreground',
      'group-focus-within/input-group:text-accent-foreground',
    ].flatMap((classes) => cn(classes)?.split(' ') ?? [])
    const { css } = await generator.generate(new Set(tokens), { preflights: true })

    expect(css).toContain('--accent: rgb(10, 10, 10);')
    expect(css).toContain('--accent-foreground: rgb(250, 250, 250);')
    expect(css).toContain('var(--accent-hover')
    expect(css).toContain('color:color-mix(in srgb, var(--accent-foreground)')
    expect(css).toContain('group\\/input-number')
    expect(css).toContain('group\\/input-group')
  })
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
  ])('compiles readable highlighted item colors with %s', async (_name, wind) => {
    for (const item of [
      commandPaletteRecipe.config.base.item,
      baseSelectRecipe.config.base.item,
      overlayMenuRecipeOptions.base.item,
    ]) {
      expect(cn(item)?.split(' ')).toContain('data-highlighted:text-accent-foreground')
    }
    for (const detail of [
      commandPaletteRecipe.config.base.itemLeading,
      commandPaletteRecipe.config.base.itemDescription,
      commandPaletteRecipe.config.base.itemTrailing,
      SELECT_FAMILY_SLOTS.itemDescription,
    ]) {
      expect(cn(detail)?.split(' ')).toContain('group-data-[highlighted]:text-accent-foreground')
    }
    const classes = [
      commandPaletteRecipe.config.base.item,
      commandPaletteRecipe.config.base.itemLeading,
      commandPaletteRecipe.config.base.itemDescription,
      commandPaletteRecipe.config.base.itemTrailing,
      baseSelectRecipe.config.base.item,
      SELECT_FAMILY_SLOTS.itemDescription,
      overlayMenuRecipeOptions.base.item,
    ]
    const tokens = classes.flatMap((value) => cn(value)?.split(' ') ?? [])
    const css = await generate(tokens, false, wind)

    expect(css).toContain('[data-highlighted]')
    expect(css).toContain('var(--accent-hover')
    expect(css).toContain('--accent-foreground')
    expect(css).toContain('.group')
    expect(css).toContain('[data-destructive]')
    expect(css).toContain('--destructive')
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
        'shadow-surface',
        'shadow-overlay',
        'shadow-input',
        'bg-backdrop',
        'font-sans',
        'w-sidebar',
        'bg-primary',
        'bg-control',
        'bg-control/30',
        'z-floating',
        'opacity-64',
      ],
      false,
      wind,
    )

    expect(css).toContain('.rounded-lg')
    expect(css).toContain('.shadow-md')
    expect(css).toContain('.font-sans')
    expect(css).toContain('--un-shadow:var(--shadow-surface)')
    expect(css).toContain('--un-shadow:var(--shadow-overlay)')
    expect(css).toContain('--un-shadow:var(--shadow-input)')
    expect(css).toContain('var(--backdrop, rgb(0 0 0 / 0.1))')
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
    expect(css).toContain('.bg-control')
    expect(css).toMatch(
      /background-color:\s*(?:var\(--control\)|color-mix\(in srgb, var\(--control\))/,
    )
    expect(css).toMatch(/color-mix\(in srgb,\s*var\(--control\) 30%,\s*transparent\)/)
    expect(css).toContain('.z-floating')
    expect(css).toContain('z-index:50')
    expect(css).toMatch(/opacity:(0\.64|64%)/)
  })

  test('Wind4 rounded utilities read the local --radius', async () => {
    const css = await generate(['rounded-md', 'rounded-xl', 'rounded-t-lg', 'rounded-none'])

    expect(css).toContain('.rounded-md{border-radius:calc(var(--radius) * 0.8);}')
    expect(css).toContain('.rounded-xl{border-radius:calc(var(--radius) * 1.4);}')
    expect(css).toContain(
      '.rounded-t-lg{border-top-left-radius:var(--radius);border-top-right-radius:var(--radius);}',
    )
    expect(css).toContain('.rounded-none{border-radius:0;}')
  })

  test('Wind4 font utilities read the local --font-size', async () => {
    const css = await generate(['text-xs', 'text-sm', 'text-base', 'text-5xl'])

    expect(css).toContain('font-size:calc(var(--font-size, 1rem) * 0.75)')
    expect(css).toContain('font-size:calc(var(--font-size, 1rem) * 0.875)')
    expect(css).toContain('.text-base{font-size:var(--font-size, 1rem)')
    expect(css).toContain('line-height:var(--un-leading, calc(var(--font-size, 1rem) * 1.25))')
    expect(css).toContain('.text-5xl{font-size:calc(var(--font-size, 1rem) * 3)')
  })

  test('inlines resolved Wind4 typography and radius overrides', async () => {
    const generator = await createGenerator({
      presets: [presetWind4(), presetMoraine()],
      theme: {
        text: {
          sm: {
            fontSize: 'var(--app-font-size)',
            lineHeight: 'var(--app-line-height)',
            letterSpacing: 'var(--app-tracking)',
          },
          hero: { fontSize: 'calc(var(--app-font-size) * 2)', lineHeight: '1.1' },
        },
        radius: { md: 'var(--app-radius)', pill: 'calc(var(--app-radius) * 2)' },
      },
    })
    const { css } = await generator.generate(
      new Set([
        'text-sm',
        'text-size-sm',
        'text-sm/7',
        'text-hero',
        'rounded-md',
        'rounded-pill',
        'rounded-ss-md',
        'hover:rd-md',
      ]),
      { preflights: false },
    )
    expect(css).toContain(
      '.text-sm{font-size:var(--app-font-size);line-height:var(--un-leading, var(--app-line-height));letter-spacing:var(--app-tracking);}',
    )
    expect(css).toContain('.text-size-sm{font-size:var(--app-font-size);')
    expect(css).toContain('.text-sm\\/7{font-size:var(--app-font-size);line-height:1.75rem;')
    expect(css).toContain(
      '.text-hero{font-size:calc(var(--app-font-size) * 2);line-height:var(--un-leading, 1.1);}',
    )
    expect(css).toContain('.rounded-md{border-radius:var(--app-radius);}')
    expect(css).toContain('.rounded-pill{border-radius:calc(var(--app-radius) * 2);}')
    expect(css).toContain('.rounded-ss-md{border-start-start-radius:var(--app-radius);}')
    expect(css).toContain('.hover\\:rd-md:hover{border-radius:var(--app-radius);}')
  })

  test('preserves native Wind4 arbitrary typography and radius utilities', async () => {
    const tokens = new Set([
      'text-[length:1.125rem]',
      'text-[length:var(--app-size)]',
      'text-[length:1.125rem]/[1.8]',
      'rounded-[13px]',
      'rounded-t-[var(--app-radius)]',
      'rounded-full',
    ])
    const baseline = await createGenerator({ presets: [presetWind4()] })
    const generator = await createGenerator({ presets: [presetWind4(), presetMoraine()] })
    const expected = await baseline.generate(tokens, { preflights: false })
    const actual = await generator.generate(tokens, { preflights: false })
    expect(actual.css).toBe(expected.css)
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

  test.each([
    ['Wind3', presetWind3],
    ['Wind4', presetWind4],
  ])('registers shared enter and exit animation defaults with %s', async (_name, wind) => {
    const css = await generate(['animate-mo-enter', 'animate-mo-exit'], false, wind)

    expect(css).toContain('.animate-mo-enter')
    expect(css).toContain('.animate-mo-exit')
    expect(css).toContain('@keyframes mo-enter')
    expect(css).toContain('@keyframes mo-exit')
    expect(css).toContain('--mo-anim-duration-enter,250ms')
    expect(css).toContain('--mo-anim-duration-exit,150ms')
    expect(css).toContain(
      'var(--mo-anim-ease,var(--mo-anim-ease-enter,cubic-bezier(0.16, 1, 0.3, 1)))',
    )
    expect(css).toContain(
      'var(--mo-anim-ease,var(--mo-anim-ease-exit,cubic-bezier(0.7, 0, 0.84, 0)))',
    )
    expect(css).toMatch(/\.animate-mo-exit\{[^}]*animation-fill-mode:forwards;/)
    expect(css).not.toMatch(/\.animate-mo-enter\{[^}]*animation-fill-mode:forwards;/)
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
    expect(css).toContain(
      '.enter-translate-x-1{--mo-enter-translate-x:calc(var(--spacing, 0.25rem) * 1);}',
    )
    expect(css).toContain(
      '.-enter-translate-x-1{--mo-enter-translate-x:calc(calc(var(--spacing, 0.25rem) * 1) * -1);}',
    )
    expect(css).toContain(
      '.exit-translate-x-1{--mo-exit-translate-x:calc(var(--spacing, 0.25rem) * 1);}',
    )
    expect(css).toContain(
      '.-exit-translate-x-1{--mo-exit-translate-x:calc(calc(var(--spacing, 0.25rem) * 1) * -1);}',
    )
    expect(css).toContain(
      '.enter-translate-y-1{--mo-enter-translate-y:calc(var(--spacing, 0.25rem) * 1);}',
    )
    expect(css).toContain(
      '.-enter-translate-y-1{--mo-enter-translate-y:calc(calc(var(--spacing, 0.25rem) * 1) * -1);}',
    )
    expect(css).toContain(
      '.exit-translate-y-1{--mo-exit-translate-y:calc(var(--spacing, 0.25rem) * 1);}',
    )
    expect(css).toContain(
      '.-exit-translate-y-1{--mo-exit-translate-y:calc(calc(var(--spacing, 0.25rem) * 1) * -1);}',
    )
    expect(css).toContain(
      '.enter-translate-y-10{--mo-enter-translate-y:calc(var(--spacing, 0.25rem) * 10);}',
    )
    expect(css).toContain(
      '.-enter-translate-y-10{--mo-enter-translate-y:calc(calc(var(--spacing, 0.25rem) * 10) * -1);}',
    )
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
  ])('emits neutral colors and default semantic shadows with %s', async (_name, wind) => {
    const generator = await createGenerator({
      presets: [wind(), presetMoraine({ wind3: wind === presetWind3 })],
    })
    const { css } = await generator.generate(new Set(), { preflights: true })

    expect(css).toContain(':root {')
    const root = css.match(/:root \{([^}]+)\}/)?.[1]
    expect(root).toContain('color-scheme: light;')
    expect(css).toMatch(/\.dark \{[^}]*color-scheme: dark;/)
    for (const [role, size] of [
      ['surface', 'sm'],
      ['overlay', 'md'],
      ['input', 'xs'],
    ]) {
      const value = TAILWIND_THEME_CSS.match(new RegExp(`--shadow-${size}: ([^;]+);`))?.[1]
      expect(value).toBeDefined()
      expect(root).toContain(`--shadow-${role}: ${value};`)
    }
    expect(root).not.toMatch(/--shadow(?:-(?:2xs|xs|sm|md|lg|xl|2xl))?:/)
    expect(css).toContain('--background: rgb(255, 255, 255);')
    expect(css).toContain('--primary: rgb(23, 23, 23);')
    expect(css).toContain('--primary-foreground: rgb(250, 250, 250);')
    expect(root).toContain('--muted-foreground: rgb(115, 115, 115);')
    expect(root).toContain('--destructive: rgb(231, 0, 11);')
    expect(css).not.toContain('--sidebar-width:')
    expect(css).toMatch(/:root \{[^}]*--radius: 0.625rem;/)
    expect(css).toMatch(/:root \{[^}]*--font-size: 1rem;/)
    expect(css).toMatch(/:root \{[^}]*--spacing: 0.25rem;/)
    expect(css).toContain('.dark {')
    expect(css).toMatch(/\.dark \{[^}]*--muted-foreground: rgb\(161, 161, 161\);/)
    expect(css).toContain('--background: rgb(10, 10, 10);')
    expect(css).toContain('--primary: rgb(229, 229, 229);')
    expect(css).toContain('--border: rgb(35, 35, 35);')
    expect(css).toContain('--input: rgb(47, 47, 47);')
    expect(css).toMatch(/:root \{[^}]*--control: rgb\(255, 255, 255\);/)
    expect(css).toMatch(/\.dark \{[^}]*--control: rgb\(23, 23, 23\);/)
    expect(css).toMatch(/:root \{[^}]*--backdrop: rgb\(0 0 0 \/ 0.1\);/)
    expect(css).toMatch(/\.dark \{[^}]*--backdrop: rgb\(0 0 0 \/ 0.1\);/)
    expect(css).not.toMatch(/--(?:mo-auto-)?control-(?:foreground|hover|active):/)
    expect(css).not.toMatch(/--[\w-]+: oklch\(/)
    expect(css).not.toContain('@supports not (color: color-mix(')
    expect(css).not.toMatch(/--mo-auto-[\w-]+: (?:rgb\(|var\()/)
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
  ])('lets CSS own theme colors and shadows with %s', async (_name, wind) => {
    const generator = await createGenerator({
      presets: [
        wind(),
        presetMoraine({
          wind3: wind === presetWind3,
          themeDefaults: false,
          override: { brand: { colors: { primary: '#369' } } },
        }),
      ],
    })
    const { css } = await generator.generate(new Set(['bg-primary-hover']), { preflights: true })

    expect(css).not.toContain('--sidebar-width:')
    expect(css).toMatch(/:root \{[^}]*--radius: 0.625rem;/)
    expect(css).toMatch(/:root \{[^}]*--font-size: 1rem;/)
    expect(css).toMatch(/:root \{[^}]*--spacing: 0.25rem;/)
    expect(css).toContain('[data-theme="brand"] {\n  --primary: #369;\n}')
    expect(css).not.toContain('--background: rgb(')
    expect(css).not.toContain('--control:')
    expect(css).not.toContain('--backdrop:')
    expect(css).not.toContain('color-scheme:')
    expect(css).not.toMatch(/--shadow-(?:surface|overlay|input):/)
    expect(css).not.toContain('html {\n  background-color: var(--background);')
    expect(css).not.toContain('--mo-auto-primary-hover: var(--primary);')
    expect(css).toContain('*, ::before, ::after {')
    expect(css).toContain('var(--primary-hover, var(--mo-auto-primary-hover, var(--primary)))')
  })

  test.each([
    ['Wind3', presetWind3],
    ['Wind4', presetWind4],
  ])('overrides control without coupling other surfaces with %s', async (_name, wind) => {
    for (const themeDefaults of [true, false]) {
      const generator = await createGenerator({
        presets: [
          wind(),
          presetMoraine({
            wind3: wind === presetWind3,
            themeDefaults,
            override: { light: { colors: { control: 'var(--palette-field)' } } },
          }),
        ],
      })
      const { css } = await generator.generate(new Set(['bg-control']), { preflights: true })
      expect(css).toMatch(/:root \{[^}]*--control: var\(--palette-field\);/)
      if (themeDefaults) {
        expect(css).toMatch(/:root \{[^}]*--input: rgb\(229, 229, 229\);/)
        expect(css).toMatch(/:root \{[^}]*--card: rgb\(255, 255, 255\);/)
        expect(css).toMatch(/:root \{[^}]*--background: rgb\(255, 255, 255\);/)
        expect(css).toMatch(/\.dark \{[^}]*--control: rgb\(23, 23, 23\);/)
      } else {
        expect(css).not.toMatch(/--(?:input|card|background):/)
        expect(css).not.toMatch(/\.dark \{[^}]*--control:/)
      }
      expect(css).not.toMatch(/--(?:mo-auto-)?control-(?:foreground|hover|active):/)
    }
  })

  test('uses configured proportions for locally scoped state colors', async () => {
    const generator = await createGenerator({
      presets: [presetWind4(), presetMoraine({ colorStates: { hover: 20, active: 40 } })],
    })
    const { css } = await generator.generate(new Set(), { preflights: true })

    expect(css).toContain(
      '--mo-auto-primary-hover: color-mix(in oklch, var(--primary), var(--primary-foreground, var(--foreground)) 20%);',
    )
    expect(css).toContain(
      '--mo-auto-primary-active: color-mix(in oklch, var(--primary), var(--primary-foreground, var(--foreground)) 40%);',
    )
  })

  test('keeps numeric state overrides before later theme declarations', async () => {
    const generator = await createGenerator({
      presets: [
        presetWind4(),
        presetMoraine({
          override: {
            light: { colors: { primary: { hover: 5, active: 10 } } },
            dark: {
              colors: {
                primary: {
                  hover: '#60a5fa',
                  active: () => '#93c5fd',
                },
              },
            },
          },
        }),
      ],
    })
    const { css } = await generator.generate(new Set(), { preflights: true })

    expect(css.indexOf('--primary-hover: color-mix(')).toBeLessThan(
      css.indexOf('--primary-hover: #60a5fa;'),
    )
    expect(css.indexOf('--primary-active: color-mix(')).toBeLessThan(
      css.indexOf('--primary-active: #93c5fd;'),
    )
  })

  test.each([
    ['Wind3', presetWind3],
    ['Wind4', presetWind4],
  ])('applies named overrides and top-level tokens with %s', async (_name, wind) => {
    const activeResolver = vi.fn(() => '#135')
    const options: PresetMoraineOptions = {
      radius: '0.75rem',
      fontSize: '1.125rem',
      spacing: '0.5rem',
      sidebarWidth: '18rem',
      colorStates: { hover: 6 },
      override: {
        light: {
          colorScheme: 'dark',
          shadows: {
            surface: '0 2px 4px #123',
            overlay: '0 8px 16px #456',
            input: 'none',
          },
          colors: {
            primary: { base: '#246', active: activeResolver },
            secondary: { foreground: '#fff' },
            backdrop: 'rgb(20 30 40 / 0.4)',
          },
        },
        dark: {
          colorScheme: 'light',
          colors: { primary: { foreground: '#111', hover: '#369' } },
          shadows: { surface: '0 2px #111' },
        },
        brand: { colorScheme: 'light', colors: { primary: '#369' } },
        custom: {
          selector: '[data-theme="custom"]',
          colors: { primary: { foreground: '#fff', hover: 5 } },
        },
      },
    }
    const generator = await createGenerator({
      presets: [wind(), presetMoraine({ ...options, wind3: wind === presetWind3 })],
    })
    const { css } = await generator.generate(new Set(), { preflights: true })

    expect(css).toContain(':root {')
    expect(css).toMatch(/:root \{[^}]*color-scheme: dark;/)
    expect(css).toMatch(/\.dark \{[^}]*color-scheme: light;/)
    expect(css).toMatch(/\[data-theme="brand"\] \{[^}]*color-scheme: light;/)
    expect(css).toContain('--primary: #246;')
    expect(css).toContain('--primary-foreground: rgb(250, 250, 250);')
    expect(css).toContain(
      '--mo-auto-primary-hover: color-mix(in oklch, var(--primary), var(--primary-foreground, var(--foreground)) 6%);',
    )
    expect(css).not.toContain('--mo-auto-primary-hover: var(--primary);')
    expect(css).toContain('--primary-active: #135;')
    expect(css).toContain('--secondary: rgb(245, 245, 245);')
    expect(css).toContain('--secondary-foreground: #fff;')
    expect(css).toMatch(/:root \{[^}]*--shadow-surface: 0 2px 4px #123;/)
    expect(css).toMatch(/:root \{[^}]*--shadow-overlay: 0 8px 16px #456;/)
    expect(css).toMatch(/:root \{[^}]*--shadow-input: none;/)
    expect(css).toMatch(/:root \{[^}]*--backdrop: rgb\(20 30 40 \/ 0.4\);/)
    expect(css).not.toMatch(/--(?:surface|overlay|input)-shadow:/)
    expect(css).toMatch(/\.dark \{[^}]*--shadow-surface: 0 2px #111;/)
    expect(css).toContain('--radius: 0.75rem;')
    expect(css).toContain('--font-size: 1.125rem;')
    expect(css).toContain('--spacing: 0.5rem;')
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

  test.each([true, false])(
    'emits color-scheme-only overrides with explicit selectors when themeDefaults is %s',
    async (themeDefaults) => {
      const generator = await createGenerator({
        presets: [
          presetMoraine({
            themeDefaults,
            override: {
              light: { selector: '.day', colorScheme: 'light' },
              dark: { selector: '.night', colorScheme: 'dark' },
              custom: { selector: '[data-mode="custom"]', colorScheme: 'dark' },
            },
          }),
        ],
      })
      const { css } = await generator.generate(new Set(), { preflights: true })

      expect(css).toMatch(/\.day \{[^}]*color-scheme: light;/)
      expect(css).toMatch(/\.night \{[^}]*color-scheme: dark;/)
      expect(css).toContain('[data-mode="custom"] {\n  color-scheme: dark;\n}')
      expect(css.match(/:root \{[^}]*color-scheme: (\w+);/)?.[1]).toBe(
        themeDefaults ? 'light' : undefined,
      )
      expect(css).not.toContain('.dark {')
    },
  )

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

describe('Wind3 semantic color and layout compatibility', () => {
  test('applies alpha to semantic variables through interaction variants', async () => {
    const css = await generate(
      [
        'bg-primary/20',
        'text-primary/50',
        'border-destructive/50',
        'ring-ring/50',
        'bg-primary/[0.2]',
        'data-destructive:data-highlighted:bg-destructive/15',
        'hover:bg-primary-hover/30',
      ],
      false,
      presetWind3,
    )
    expect(css).toContain(
      'background-color:var(--primary);background-color:color-mix(in srgb,var(--primary) 20%,transparent)',
    )
    expect(css).toContain('color-mix(in srgb,var(--primary) calc(0.2 * 100%),transparent)')
    expect(css).toContain('color-mix(in srgb,var(--primary) 50%,transparent)')
    expect(css).toContain('color-mix(in srgb,var(--destructive) 15%,transparent)')
    expect(css).toContain('color-mix(in srgb,var(--ring) 50%,transparent)')
    expect(css).toContain('var(--primary-hover, var(--mo-auto-primary-hover, var(--primary))) 30%')
    expect(css).toContain('[data-highlighted][data-destructive]')
  })

  test.each([undefined, false, true])(
    'preserves native spacing and sizes with wind3=%s',
    async (wind3) => {
      const theme = { spacing: { 4: '2rem' }, width: { 8: '3rem' } }
      const candidates = new Set([
        'p-4',
        'px-2.5',
        'gap-1.5',
        'h-8',
        'w-8',
        'min-w-8',
        'max-h-8',
        'size-6',
        '-mt-3',
      ])
      const baseline = await createGenerator({ presets: [presetWind3()], theme })
      const generator = await createGenerator({
        presets: [presetWind3(), presetMoraine({ wind3, spacing: '0.5rem' })],
        theme,
      })
      const expected = await baseline.generate(candidates, { preflights: false })
      const actual = await generator.generate(candidates, { preflights: false })
      expect(actual.css).toBe(expected.css)
    },
  )

  test.each([undefined, false])(
    'does not enable Wind3 compatibility with wind3=%s',
    async (wind3) => {
      const generator = await createGenerator({
        presets: [presetWind3(), presetMoraine({ wind3 })],
      })
      const { css } = await generator.generate(
        new Set(['text-sm', 'leading-5', 'bg-primary/20', 'font-sans']),
        { preflights: true },
      )
      expect(css).not.toContain('--mo-leading')
      expect(css).not.toContain('@property --un-leading')
      expect(css).not.toContain('color-mix(in srgb,var(--primary) 20%,transparent)')
      const baseline = await createGenerator({ presets: [presetWind3()] })
      const expected = await baseline.generate(new Set(['font-sans']), { preflights: false })
      expect(css).toContain(expected.css.replace('/* layer: default */\n', ''))
    },
  )

  test('preserves native typography and radius overrides with Wind3', async () => {
    const theme = {
      fontSize: { sm: ['1.125rem', '1.75rem'] as [string, string] },
      borderRadius: { md: '7px', xl: '11px', lg: '9px' },
      lineHeight: { wide: '1.8' },
    }
    const candidates = new Set([
      'text-xs',
      'text-sm',
      'text-base',
      'text-5xl',
      'rounded-md',
      'rounded-xl',
      'rounded-t-lg',
      'leading-tight',
      'leading-5',
      'leading-[1.7]',
      'lh-6',
      'line-height-7',
      'font-leading-8',
      'hover:leading-6',
      'leading-wide',
    ])
    const baseline = await createGenerator({ presets: [presetWind3()], theme })
    const generator = await createGenerator({
      presets: [{ ...presetWind3(), name: 'host-wind' }, presetMoraine({ wind3: true })],
      theme,
    })
    const expected = await baseline.generate(candidates, { preflights: false })
    const { css } = await generator.generate(candidates, { preflights: false })
    expect(css).toBe(expected.css)
    expect(css).not.toContain('--font-size')
    expect(css).not.toContain('--mo-leading')
    expect(css).not.toContain('--un-leading')
  })
})
