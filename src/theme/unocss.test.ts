import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { createGenerator, presetWind3, presetWind4 } from '@subf/unocss'
import { describe, expect, test } from 'vitest'

import { baseSelectRecipe } from '../components/base-select/base-select.recipe'
import { boldSliderRecipe } from '../components/bold-slider/bold-slider.recipe'
import { COLLAPSIBLE_CONTENT_WRAPPER_CLASS } from '../components/collapsible/collapsible.recipe'
import { commandPaletteRecipe } from '../components/command-palette/command-palette.recipe'
import { iconRecipe } from '../components/icon/icon.recipe'
import { inputGroupRecipe } from '../components/input-group/input-group.recipe'
import { inputRecipe } from '../components/input/input.recipe'
import { numberInputRecipe } from '../components/number-input/number-input.recipe'
import { SELECT_FAMILY_SLOTS } from '../components/shared/form/select/select-field.recipe'
import { overlayMenuRecipeOptions } from '../components/shared/overlay/menu/menu.recipe'

import { cn } from './cn'
import { presetMoraine } from './unocss'
import type { PresetMoraineOptions } from './unocss'

const TAILWIND_THEME_CSS = readFileSync(
  resolve(__dirname, '../../node_modules/tailwindcss/theme.css'),
  'utf8',
)

const WIND_VERSIONS = [
  ['Wind3', presetWind3],
  ['Wind4', presetWind4],
] as const

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

function rootBlock(css: string): string {
  return css.match(/:root \{([^}]+)\}/)?.[1] ?? ''
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
      numberInputRecipe.config.variants?.variant?.ghost?.root,
      numberInputRecipe.config.variants?.variant?.ghost?.input,
      inputGroupRecipe.config.variants?.variant?.ghost?.root,
      inputGroupRecipe.config.variants?.variant?.ghost?.leading,
    ].flatMap((classes) => cn(classes)?.split(' ') ?? [])
    const { css } = await generator.generate(new Set(tokens), { preflights: true })

    expect(css).toContain('--accent: rgb(10, 10, 10);')
    expect(css).toContain('--accent-foreground: rgb(250, 250, 250);')
    expect(css).toContain('var(--accent-hover')
    expect(css).toContain('color:var(--mo-accent-fg, var(--foreground))')
    expect(css).toContain('color:var(--mo-accent-fg, var(--muted-foreground))')
  })

  test.each(WIND_VERSIONS)(
    'compiles disclosure child state and slider peer state with %s',
    async (_name, wind) => {
      const tokens = [
        ...COLLAPSIBLE_CONTENT_WRAPPER_CLASS.split(' '),
        ...[boldSliderRecipe.config.base.content, boldSliderRecipe.config.base.indicator]
          .flatMap((value) => cn(value)!.split(' '))
          .filter((token) => token.startsWith('peer-')),
      ]
      const css = await generate(tokens, false, wind)
      expect(css).toMatch(/\[data-(?:transition\]\[data-expanded|expanded\]\[data-transition)\]/)
      expect(css).toMatch(/\[data-(?:transition\]\[data-closed|closed\]\[data-transition)\]/)
      expect(css).toContain('@keyframes accordion-down')
      expect(css).toContain('@keyframes accordion-up')
      expect(css).toMatch(/\.peer\)?\[data-focus-visible\] ?~/)
      expect(css).toMatch(/\.peer\)?:hover ?~/)
      expect(css).toMatch(/\.peer\)?\[data-dragging\] ?~/)
      expect(css).not.toContain(':has(')
    },
  )

  test.each(WIND_VERSIONS)(
    'compiles compound and hyphenated attributes with %s',
    async (_name, wind) => {
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
    },
  )

  test.each(WIND_VERSIONS)(
    'highlighted items keep readable text and danger tones with %s',
    async (_name, wind) => {
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
      expect(css).toContain('[data-danger]')
      expect(css).toContain('--danger')
    },
  )

  test.each(WIND_VERSIONS)(
    'CSS variable shorthand reads the variable with %s',
    async (_name, wind) => {
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
      expect(css).toContain('height:var(--test-height)')
      expect(css).toContain('margin-top:calc(var(--test-offset) * -1)')
      expect(css).toContain('--mo-enter-translate-x:var(--test-translate)')
    },
  )

  test.each(WIND_VERSIONS)('registers %s theme tokens', async (name, wind) => {
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
        'bg-info',
        'text-success',
        'text-warning',
        'text-danger',
        'text-danger-foreground',
        'hover:bg-accent-hover',
        'active:bg-muted-active',
        'hover:bg-primary-hover',
        'active:bg-primary-active',
        'text-info-ink',
        'text-success-ink',
        'bg-control',
        'bg-control/30',
        'z-floating',
        'opacity-64',
      ],
      false,
      wind,
    )

    expect(css).toContain('--un-shadow:var(--shadow-surface)')
    expect(css).toContain('--un-shadow:var(--shadow-overlay)')
    expect(css).toContain('--un-shadow:var(--shadow-input)')
    expect(css).toContain('var(--backdrop, rgb(0 0 0 / 0.32))')
    expect(css).toContain('font-family:var(--font-sans)')
    expect(css).toContain(
      name === 'Wind3'
        ? 'width:var(--sidebar-width,clamp(14rem,25%,20rem))'
        : 'width:var(--spacing-sidebar)',
    )
    expect(css).toContain('border-radius:var(--radius)')
    expect(css).toContain('var(--primary)')
    expect(css).toContain('var(--info)')
    expect(css).toContain('var(--success)')
    expect(css).toContain('var(--warning)')
    expect(css).toContain('var(--danger)')
    expect(css).toContain('var(--danger-foreground, var(--background))')
    expect(css).toContain('var(--accent-hover, var(--mo-accent-hover, var(--accent)))')
    expect(css).toContain(
      'var(--muted-active, var(--mo-muted-active, var(--muted-hover, var(--mo-muted-hover, var(--muted)))))',
    )
    expect(css).toContain('var(--primary-hover, var(--mo-primary-hover, var(--primary)))')
    expect(css).toContain(
      'var(--primary-active, var(--mo-primary-active, var(--primary-hover, var(--mo-primary-hover, var(--primary)))))',
    )
    expect(css).toContain('var(--info-ink, var(--mo-info-ink, var(--info)))')
    expect(css).toContain('var(--success-ink, var(--mo-success-ink, var(--success)))')
    expect(css).toMatch(
      /background-color:\s*(?:var\(--control\)|color-mix\(in srgb, var\(--control\))/,
    )
    expect(css).toMatch(/color-mix\(in srgb,\s*var\(--control\) 30%,\s*transparent\)/)
    expect(css).toContain('z-index:50')
    expect(css).toMatch(/opacity:(0\.64|64%)/)
  })

  test.each(WIND_VERSIONS)(
    'resolves the internal tone channel utilities with %s',
    async (_name, wind) => {
      const css = await generate(
        [
          'tone-danger',
          'bg-tone',
          'bg-tone/12',
          'bg-tone-soft',
          'hover:bg-tone-soft-hover',
          'active:bg-tone-soft-active',
          'bg-danger-soft',
          'border-tone/40',
          'text-tone-foreground',
          'text-tone-ink',
          'hover:bg-tone-hover',
          'active:bg-tone-active',
          'ring-tone/20',
        ],
        false,
        wind,
      )

      expect(css).toContain('--mo-tone:var(--danger)')
      expect(css).toContain('--mo-tone-foreground:var(--danger-foreground, var(--background))')
      expect(css).toContain(
        '--mo-tone-hover:var(--danger-hover, var(--mo-danger-hover, var(--danger)))',
      )
      expect(css).toContain(
        '--mo-tone-active:var(--danger-active, var(--mo-danger-active, var(--danger-hover, var(--mo-danger-hover, var(--danger)))))',
      )
      expect(css).toContain('--mo-tone-ink:var(--danger-ink, var(--mo-danger-ink, var(--danger)))')
      expect(css).toContain('--mo-tone-soft:var(--danger-soft, var(--mo-danger-soft, transparent))')
      expect(css).toContain(
        '--mo-tone-border:var(--danger-border, var(--mo-danger-border, var(--border)))',
      )
      expect(css).toMatch(/\.bg-tone\{background-color:[^}]*var\(--mo-tone\)/)
      expect(css).toContain('var(--mo-tone) 12%')
      expect(css).toContain('var(--mo-tone) 40%')
      expect(css).toContain('var(--mo-tone) 20%')
      expect(css).toContain('var(--mo-tone-foreground)')
      expect(css).toContain('var(--mo-tone-ink)')
      expect(css).toContain('var(--mo-tone-hover, var(--mo-tone))')
      expect(css).toContain('var(--mo-tone-active, var(--mo-tone-hover, var(--mo-tone)))')
      expect(css).toContain('var(--mo-tone-soft, transparent)')
      expect(css).toContain('var(--mo-tone-soft-hover, var(--mo-tone-soft, transparent))')
      expect(css).toContain(
        'var(--mo-tone-soft-active, var(--mo-tone-soft-hover, var(--mo-tone-soft, transparent)))',
      )
      expect(css).toContain('var(--danger-soft, var(--mo-danger-soft, transparent))')
    },
  )

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
    const css = await generate(['text-tiny', 'text-xs', 'text-sm', 'text-base', 'text-5xl'])

    expect(css).toContain('font-size:calc(var(--font-size, 1rem) * 0.625)')
    expect(css).toContain('line-height:var(--un-leading, calc(var(--font-size, 1rem) * 0.875))')
    expect(css).toContain('font-size:calc(var(--font-size, 1rem) * 0.75)')
    expect(css).toContain('font-size:calc(var(--font-size, 1rem) * 0.875)')
    expect(css).toContain('.text-base{font-size:var(--font-size, 1rem)')
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
      'aria-invalid:border-danger',
    ])

    expect(css).toContain('[data-disabled]')
    expect(css).toContain('[data-focused]')
    expect(css).toContain('[aria-invalid]')
    expect(css).toMatch(/opacity:(0\.64|64%)/)
    expect(css).toContain('var(--danger)')
  })

  test.each(WIND_VERSIONS)(
    'registers shared enter and exit animation defaults with %s',
    async (_name, wind) => {
      const css = await generate(['animate-mo-enter', 'animate-mo-exit'], false, wind)

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
    },
  )

  test.each(WIND_VERSIONS)(
    'registers enter and exit animation utilities with %s',
    async (_name, wind) => {
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
        '.exit-translate-y-1{--mo-exit-translate-y:calc(var(--spacing, 0.25rem) * 1);}',
      )
      expect(css).toContain(
        '.-exit-translate-y-1{--mo-exit-translate-y:calc(calc(var(--spacing, 0.25rem) * 1) * -1);}',
      )
      expect(css).toContain('.enter-translate-y-full{--mo-enter-translate-y:100%;}')
      expect(css).toContain('.-enter-translate-y-full{--mo-enter-translate-y:-100%;}')
      expect(css).toContain('.enter-rotate-45{--mo-enter-rotate:45deg;}')
      expect(css).toContain('.-enter-rotate-45{--mo-enter-rotate:-45deg;}')
      expect(css).toContain('[data-expanded]')
      expect(css).toContain('[data-closed]')
    },
  )

  test.each(WIND_VERSIONS)('keeps host transition defaults with %s', async (_name, wind) => {
    const css = await generate(['transition', 'transition-colors'], true, wind)
    expect(css).not.toContain('transition-duration:var(--mo-anim-duration')
    expect(css).not.toContain('--default-transition-duration: var(--mo-anim-duration')
    expect(css).not.toContain('--default-transition-timingFunction: cubic-bezier(0.16, 1, 0.3, 1)')
  })

  test.each(WIND_VERSIONS)(
    'emits neutral theme variables and semantic shadows with %s',
    async (_name, wind) => {
      const generator = await createGenerator({
        presets: [wind(), presetMoraine({ wind3: wind === presetWind3 })],
      })
      const { css } = await generator.generate(new Set(), { preflights: true })
      const root = rootBlock(css)

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
      expect(root).toContain('--radius: 0.625rem;')
      expect(root).toContain('--font-size: 1rem;')
      expect(root).toContain('--spacing: 0.25rem;')
      expect(css).toMatch(/\.dark \{[^}]*--muted-foreground: rgb\(161, 161, 161\);/)
      expect(css).not.toContain('--sidebar-width:')
      expect(css).toContain('@supports (color: color-mix(in oklch, red, white))')
      expect(css).toContain(
        '--mo-background-hover: color-mix(in oklch, var(--background), var(--foreground) var(--mo-mix-hover, 6%));',
      )
      expect(css).toContain(
        '--mo-primary-ink: color-mix(in oklch, var(--primary), var(--foreground) var(--mo-mix-ink, 25%));',
      )
      expect(css).toContain(
        '--mo-danger-soft: color-mix(in oklch, var(--danger) var(--mo-mix-soft, 12%), transparent);',
      )
      expect(css).toContain('background-color: var(--background)')
      expect(css.indexOf(':root {')).toBeLessThan(css.indexOf('.dark {'))
    },
  )

  test.each(WIND_VERSIONS)('lets CSS own theme colors and shadows with %s', async (_name, wind) => {
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
    const { css } = await generator.generate(new Set(['bg-accent-hover']), { preflights: true })

    expect(css).not.toContain('--sidebar-width:')
    expect(rootBlock(css)).toContain('--radius: 0.625rem;')
    expect(css).toMatch(/\[data-theme="brand"\] \{[^}]*--primary: #369;/)
    expect(css).not.toContain('--background: rgb(')
    expect(css).not.toContain('--control:')
    expect(css).not.toContain('--backdrop:')
    expect(css).not.toContain('color-scheme:')
    expect(css).not.toMatch(/--shadow-(?:surface|overlay|input):/)
    expect(css).toContain('var(--accent-hover, var(--mo-accent-hover, var(--accent)))')
  })

  test.each(WIND_VERSIONS)(
    'overrides control without coupling other surfaces with %s',
    async (_name, wind) => {
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
        expect(rootBlock(css)).toMatch(/--control: var\(--palette-field\);/)
        if (themeDefaults) {
          expect(rootBlock(css)).toMatch(/--input: rgb\(229, 229, 229\);/)
          expect(rootBlock(css)).toMatch(/--card: rgb\(255, 255, 255\);/)
          expect(rootBlock(css)).toMatch(/--background: rgb\(255, 255, 255\);/)
          expect(css).toMatch(/\.dark \{[^}]*--control: rgb\(23, 23, 23\);/)
        } else {
          expect(css).not.toMatch(/--(?:input|card|background):/)
          expect(css).not.toMatch(/\.dark \{[^}]*--control:/)
        }
      }
    },
  )

  test('uses configured proportions for locally scoped mix values', async () => {
    const generator = await createGenerator({
      presets: [presetWind4(), presetMoraine({ mix: { hover: 20, active: 40, ink: 30 } })],
    })
    const { css } = await generator.generate(new Set(), { preflights: true })

    expect(rootBlock(css)).toMatch(/--mo-mix-hover: 20%;/)
    expect(rootBlock(css)).toMatch(/--mo-mix-active: 40%;/)
    expect(rootBlock(css)).toMatch(/--mo-mix-ink: 30%;/)
    expect(css).toMatch(/\.dark \{[^}]*--mo-mix-hover: 20%;/)
  })

  test('applies per-theme mix overrides and explicit tone ink', async () => {
    const generator = await createGenerator({
      presets: [
        presetWind4(),
        presetMoraine({
          mix: { hover: 5, active: 10 },
          override: {
            light: {
              colors: { primary: { ink: '#2563eb' } },
            },
            dark: {
              mix: { hover: 12 },
              colors: { primary: { ink: '#60a5fa' } },
            },
          },
        }),
      ],
    })
    const { css } = await generator.generate(new Set(), { preflights: true })

    expect(rootBlock(css)).toMatch(/--mo-mix-hover: 5%;/)
    expect(rootBlock(css)).toMatch(/--mo-mix-active: 10%;/)
    expect(rootBlock(css)).toMatch(/--primary-ink: #2563eb;/)
    expect(css).toMatch(/\.dark \{[^}]*--mo-mix-hover: 12%;/)
    expect(css).toMatch(/\.dark \{[^}]*--mo-mix-active: 10%;/)
    expect(css).toMatch(/\.dark \{[^}]*--primary-ink: #60a5fa;/)
  })

  test('a zero mix percentage is emitted as 0%', async () => {
    const generator = await createGenerator({
      presets: [presetWind4(), presetMoraine({ mix: { hover: 0 } })],
    })
    const { css } = await generator.generate(new Set(), { preflights: true })
    expect(rootBlock(css)).toMatch(/--mo-mix-hover: 0%;/)
  })

  test('explicit tone hover and active colors are emitted as theme variables', async () => {
    const generator = await createGenerator({
      presets: [
        presetWind4(),
        presetMoraine({
          override: {
            light: {
              colors: { primary: { base: '#123456', hover: '#234567', active: '#345678' } },
            },
          },
        }),
      ],
    })
    const { css } = await generator.generate(new Set(), { preflights: true })
    expect(rootBlock(css)).toMatch(/--primary-hover: #234567;/)
    expect(rootBlock(css)).toMatch(/--primary-active: #345678;/)
  })

  test.each(WIND_VERSIONS)(
    'applies named overrides and top-level tokens with %s',
    async (_name, wind) => {
      const options: PresetMoraineOptions = {
        radius: '0.75rem',
        fontSize: '1.125rem',
        spacing: '0.5rem',
        sidebarWidth: '18rem',
        mix: { hover: 6 },
        override: {
          light: {
            colorScheme: 'dark',
            shadows: {
              surface: '0 2px 4px #123',
              overlay: '0 8px 16px #456',
              input: 'none',
            },
            colors: {
              primary: { base: '#246', ink: '#135' },
              secondary: { foreground: '#fff' },
              backdrop: 'rgb(20 30 40 / 0.4)',
            },
          },
          dark: {
            colorScheme: 'light',
            colors: { primary: { foreground: '#111', ink: '#369' } },
            shadows: { surface: '0 2px #111' },
          },
          brand: { colorScheme: 'light', colors: { primary: '#369' } },
          custom: {
            selector: '[data-theme="custom"]',
            colors: { primary: { foreground: '#fff', ink: '#555' } },
          },
        },
      }
      const generator = await createGenerator({
        presets: [wind(), presetMoraine({ ...options, wind3: wind === presetWind3 })],
      })
      const { css } = await generator.generate(new Set(), { preflights: true })

      expect(css).toMatch(/:root \{[^}]*color-scheme: dark;/)
      expect(css).toMatch(/\.dark \{[^}]*color-scheme: light;/)
      expect(css).toMatch(/\[data-theme="brand"\] \{[^}]*color-scheme: light;/)
      expect(css).toContain('--primary: #246;')
      expect(css).toContain('--primary-foreground: rgb(250, 250, 250);')
      expect(css).toContain('--mo-mix-hover: 6%;')
      expect(css).toContain('--primary-ink: #135;')
      expect(css).toContain('--secondary: rgb(51, 65, 85);')
      expect(css).toContain('--secondary-foreground: #fff;')
      expect(rootBlock(css)).toMatch(/--shadow-surface: 0 2px 4px #123;/)
      expect(rootBlock(css)).toMatch(/--shadow-overlay: 0 8px 16px #456;/)
      expect(rootBlock(css)).toMatch(/--shadow-input: none;/)
      expect(rootBlock(css)).toMatch(/--backdrop: rgb\(20 30 40 \/ 0.4\);/)
      expect(css).toMatch(/\.dark \{[^}]*--shadow-surface: 0 2px #111;/)
      expect(css).toContain('--radius: 0.75rem;')
      expect(css).toContain('--font-size: 1.125rem;')
      expect(css).toContain('--spacing: 0.5rem;')
      expect(css).toContain('--sidebar-width: 18rem;')
      expect(css).toContain('--primary-ink: #369;')
      expect(css).toMatch(/\[data-theme="custom"\] \{\s*--primary-foreground: #fff;/)
      expect(css).not.toMatch(/\[data-theme="custom"\] \{\s*--primary:/)
      expect(css.indexOf(':root {')).toBeLessThan(css.indexOf('.dark {'))
      expect(css.indexOf('.dark {')).toBeLessThan(css.indexOf('[data-theme="brand"] {'))
    },
  )

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
      expect(css).toMatch(/\[data-mode="custom"\] \{\s*color-scheme: dark;/)
      expect(css.match(/:root \{[^}]*color-scheme: (\w+);/)?.[1]).toBe(
        themeDefaults ? 'light' : undefined,
      )
      expect(css).not.toContain('.dark {')
    },
  )

  test('an explicit selector receives its own mix and colors without base colors', async () => {
    const generator = await createGenerator({
      presets: [
        presetWind4(),
        presetMoraine({
          themeDefaults: false,
          override: {
            dark: {
              selector: '[data-mode="night"]',
              mix: { hover: 5 },
              colors: { primary: { ink: '#135' } },
            },
          },
        }),
      ],
    })
    const { css } = await generator.generate(new Set(), { preflights: true })

    expect(css).toMatch(/\[data-mode="night"\] \{[^}]*--mo-mix-hover: 5%;/)
    expect(css).toMatch(/\[data-mode="night"\] \{[^}]*--primary-ink: #135;/)
    expect(css).not.toContain('.dark {')
    expect(css).not.toContain('--background: rgb(')
  })

  test('a custom theme without a base receives only its own colors', async () => {
    const generator = await createGenerator({
      presets: [
        presetWind4(),
        presetMoraine({
          override: { brand: { colors: { primary: { foreground: '#fff', ink: '#369' } } } },
        }),
      ],
    })
    const { css } = await generator.generate(new Set(), { preflights: true })
    expect(css).toMatch(
      /\[data-theme="brand"\] \{\s*--primary-foreground: #fff;\s*--primary-ink: #369;\s*\}/,
    )
    expect(css).not.toMatch(/\[data-theme="brand"\] \{\s*--primary:/)
  })

  test('emits an explicit soft token and the mix.soft override', async () => {
    const generator = await createGenerator({
      presets: [
        presetWind4(),
        presetMoraine({
          mix: { soft: 16 },
          override: { light: { colors: { primary: { soft: '#F0F7FF' } } } },
        }),
      ],
    })
    const { css } = await generator.generate(new Set(), { preflights: true })
    expect(css).toContain('--primary-soft: #F0F7FF;')
    expect(css).toContain('--mo-mix-soft: 16%;')
  })

  test('rejects invalid mix adjustments', () => {
    expect(() => presetMoraine({ mix: { hover: Number.POSITIVE_INFINITY } })).toThrow(RangeError)
    expect(() => presetMoraine({ mix: { hover: -1 } })).toThrow(RangeError)
    expect(() => presetMoraine({ mix: { hover: 101 } })).toThrow(RangeError)
    expect(() => presetMoraine({ mix: { hover: Number.NaN } })).toThrow(RangeError)
    expect(() => presetMoraine({ mix: { hover: null as unknown as number } })).toThrow(TypeError)
    expect(() => presetMoraine({ mix: { hover: false as unknown as number } })).toThrow(TypeError)
  })
})

describe('icon host utilities', () => {
  test.each(WIND_VERSIONS)('compiles the icon host classes with %s', async (_name, wind) => {
    const tokens = cn(iconRecipe.config.variants!.isMask!.false!.root)?.split(' ') ?? []
    const css = await generate(tokens, false, wind)

    expect(css).toMatch(/\.size-\\\[1\\\.2em\\\]\{width:1\.2em;height:1\.2em;\}/)
    expect(css).toMatch(/>\s*\*\)?\{width:100%;height:100%;\}/)
  })
})

describe('forced colors utilities', () => {
  test.each(WIND_VERSIONS)('expands the icon-mask shortcut with %s', async (_name, wind) => {
    const css = await generate(['icon-mask'], false, wind)

    expect(css).toMatch(/\.icon-mask\{forced-color-adjust:none;\}/)
    expect(css).toMatch(
      /@supports \(forced-color-adjust:preserve-parent-color\)\{\s*\.icon-mask\{forced-color-adjust:preserve-parent-color;\}/,
    )
    expect(css).toMatch(/@media \(forced-colors: active\)\{\s*\.icon-mask\{color:inherit;\}/)
  })
})

describe('Wind3 semantic color and layout compatibility', () => {
  test('applies alpha to semantic variables through interaction variants', async () => {
    const css = await generate(
      [
        'bg-primary/20',
        'text-primary/50',
        'border-danger/50',
        'bg-info/20',
        'text-danger/50',
        'ring-ring/50',
        'bg-primary/[0.2]',
        'data-danger:data-highlighted:bg-danger/15',
        'hover:bg-accent-hover/30',
        'text-primary-ink/50',
      ],
      false,
      presetWind3,
    )
    expect(css).toContain('background-color:color-mix(in srgb,var(--primary) 20%,transparent)')
    expect(css).not.toContain(
      'background-color:var(--primary);background-color:color-mix(in srgb,var(--primary) 20%,transparent)',
    )
    expect(css).toContain('color-mix(in srgb,var(--primary) calc(0.2 * 100%),transparent)')
    expect(css).toContain('color-mix(in srgb,var(--primary) 50%,transparent)')
    expect(css).toContain('color-mix(in srgb,var(--danger) 15%,transparent)')
    expect(css).toContain('color-mix(in srgb,var(--info) 20%,transparent)')
    expect(css).toContain('color-mix(in srgb,var(--danger) 50%,transparent)')
    expect(css).toContain('color-mix(in srgb,var(--ring) 50%,transparent)')
    expect(css).toContain('var(--accent-hover, var(--mo-accent-hover, var(--accent))) 30%')
    expect(css).toContain('var(--primary-ink, var(--mo-primary-ink, var(--primary))) 50%')
    expect(css).toContain('[data-highlighted][data-danger]')
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
