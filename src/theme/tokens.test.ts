import { describe, expect, test } from 'vitest'

import { TONE_VARS } from './recipe-common.recipe'
import {
  DEFAULT_MIX_PERCENT,
  MORAINE_COLORS,
  THEME_COLOR_CONFIG_KEYS,
  THEME_COLOR_ROLES,
  TONES,
  createGatedColorDeclarations,
} from './tokens'
import { assertMixValue, createThemeCSS, resolveThemes } from './unocss-theme'

describe('assertMixValue Validation Contract', () => {
  test('preserves 0 as "0%"', () => {
    expect(assertMixValue(0, 'mix.hover')).toBe('0%')
  })

  test('converts valid numbers to percentage strings', () => {
    expect(assertMixValue(50, 'mix.active')).toBe('50%')
    expect(assertMixValue(100, 'mix.ink')).toBe('100%')
    expect(assertMixValue(8.5, 'mix.hover')).toBe('8.5%')
  })

  test('passes through raw CSS strings', () => {
    expect(assertMixValue('12%', 'mix.hover')).toBe('12%')
    expect(assertMixValue('var(--my-mix)', 'mix.active')).toBe('var(--my-mix)')
  })

  test('throws RangeError for out-of-range numbers', () => {
    expect(() => assertMixValue(-1, 'mix.hover')).toThrow(RangeError)
    expect(() => assertMixValue(-0.01, 'mix.hover')).toThrow(RangeError)
    expect(() => assertMixValue(100.1, 'mix.hover')).toThrow(RangeError)
    expect(() => assertMixValue(150, 'mix.hover')).toThrow(RangeError)
    expect(() => assertMixValue(Number.NaN, 'mix.hover')).toThrow(RangeError)
    expect(() => assertMixValue(Number.POSITIVE_INFINITY, 'mix.hover')).toThrow(RangeError)
    expect(() => assertMixValue(Number.NEGATIVE_INFINITY, 'mix.hover')).toThrow(RangeError)
  })

  test('throws TypeError for null, boolean, and non-primitives', () => {
    expect(() => assertMixValue(null, 'mix.hover')).toThrow(TypeError)
    expect(() => assertMixValue(true, 'mix.hover')).toThrow(TypeError)
    expect(() => assertMixValue(false, 'mix.hover')).toThrow(TypeError)
    expect(() => assertMixValue({}, 'mix.hover')).toThrow(TypeError)
    expect(() => assertMixValue([], 'mix.hover')).toThrow(TypeError)
    expect(() => assertMixValue(undefined, 'mix.hover')).toThrow(TypeError)
  })
})

describe('resolveThemes Inheritance & Precedence', () => {
  test('inherits top-level mix into light and dark themes', () => {
    const themes = resolveThemes({
      mix: { hover: 10, active: 15, ink: 80 },
    })
    const rootTheme = themes.find(([sel]) => sel === ':root')?.[1]
    const darkTheme = themes.find(([sel]) => sel === '.dark')?.[1]

    expect(rootTheme?.mix).toEqual({ hover: 10, active: 15, ink: 80 })
    expect(darkTheme?.mix).toEqual({ hover: 10, active: 15, ink: 80 })
  })

  test('per-theme override.mix shallow-merges over top-level mix', () => {
    const themes = resolveThemes({
      mix: { hover: 10, active: 15, ink: 80 },
      override: {
        dark: {
          mix: { hover: 12 },
        },
      },
    })
    const rootTheme = themes.find(([sel]) => sel === ':root')?.[1]
    const darkTheme = themes.find(([sel]) => sel === '.dark')?.[1]

    expect(rootTheme?.mix).toEqual({ hover: 10, active: 15, ink: 80 })
    expect(darkTheme?.mix).toEqual({ hover: 12, active: 15, ink: 80 })
  })
})

describe('Tone Ink 3-Tier Precedence & Declarations', () => {
  test('Tier 1: Explicit tone ink override is emitted directly in selector', () => {
    const themes = resolveThemes({
      override: {
        light: {
          colors: {
            primary: { base: '#123456', ink: '#abcdef' },
          },
        },
      },
    })
    const css = createThemeCSS(themes)
    expect(css).toMatch(/:root \{[^}]*--primary-ink: #abcdef;/)
  })

  test('Tier 2: @supports declares auto-mixed tone ink using --mo-mix-ink', () => {
    const declarations = createGatedColorDeclarations()
    for (const tone of TONES) {
      expect(declarations[`--mo-${tone}-ink`]).toBe(
        `color-mix(in oklch, var(--${tone}), var(--foreground) var(--mo-mix-ink, 25%))`,
      )
    }
  })

  test('Tier 3: MORAINE_COLORS exposes 3-tier fallback for each tone ink', () => {
    for (const tone of TONES) {
      const schema = MORAINE_COLORS[tone]
      expect(typeof schema).toBe('object')
      expect(schema.ink).toBe(`var(--${tone}-ink, var(--mo-${tone}-ink, var(--${tone})))`)
    }
  })
})

describe('Tone State Hover & Active 3-Tier Precedence & Declarations', () => {
  test('Tier 1: Explicit tone hover & active override is emitted directly in selector', () => {
    const themes = resolveThemes({
      override: {
        light: {
          colors: {
            primary: { base: '#123456', hover: '#234567', active: '#345678' },
          },
        },
      },
    })
    const css = createThemeCSS(themes)
    expect(css).toMatch(/:root \{[^}]*--primary-hover: #234567;/)
    expect(css).toMatch(/:root \{[^}]*--primary-active: #345678;/)
  })

  test('Tier 2: @supports declares auto-mixed tone hover & active using tone foreground', () => {
    const declarations = createGatedColorDeclarations()
    for (const tone of TONES) {
      const foreground =
        tone === 'primary' || tone === 'secondary' ? 'var(--foreground)' : 'var(--background)'
      expect(declarations[`--mo-${tone}-hover`]).toBe(
        `color-mix(in oklch, var(--${tone}), var(--${tone}-foreground, ${foreground}) var(--mo-mix-hover, 8%))`,
      )
      expect(declarations[`--mo-${tone}-active`]).toBe(
        `color-mix(in oklch, var(--${tone}), var(--${tone}-foreground, ${foreground}) var(--mo-mix-active, 12%))`,
      )
    }
  })

  test('Tier 3: MORAINE_COLORS exposes 3-tier fallback for each tone hover & active', () => {
    for (const tone of TONES) {
      const schema = MORAINE_COLORS[tone]
      expect(typeof schema).toBe('object')
      expect(schema.hover).toBe(`var(--${tone}-hover, var(--mo-${tone}-hover, var(--${tone})))`)
      expect(schema.active).toBe(
        `var(--${tone}-active, var(--mo-${tone}-active, var(--${tone}-hover, var(--mo-${tone}-hover, var(--${tone})))))`,
      )
    }
  })
})

describe('Tone Soft 3-Tier Precedence & Declarations', () => {
  test('Tier 1: Explicit tone soft override is emitted directly in selector', () => {
    const themes = resolveThemes({
      override: {
        light: {
          colors: {
            primary: { soft: '#F0F7FF' },
          },
        },
      },
    })
    const css = createThemeCSS(themes)
    expect(css).toMatch(/:root \{[^}]*--primary-soft: #F0F7FF;/)
  })

  test('Tier 2: @supports declares auto-mixed tone soft using var(--background)', () => {
    const declarations = createGatedColorDeclarations()
    for (const tone of TONES) {
      expect(declarations[`--mo-${tone}-soft`]).toBe(
        `color-mix(in oklch, var(--${tone}) var(--mo-mix-soft, 12%), var(--background))`,
      )
    }
  })

  test('Tier 3: MORAINE_COLORS exposes 3-tier fallback for each tone soft', () => {
    for (const tone of TONES) {
      const schema = MORAINE_COLORS[tone]
      expect(typeof schema).toBe('object')
      expect(schema.soft).toBe(`var(--${tone}-soft, var(--mo-${tone}-soft, var(--background)))`)
    }
  })

  test('mix.soft emits --mo-mix-soft override', () => {
    const themes = resolveThemes({
      mix: { soft: 16 },
    })
    const css = createThemeCSS(themes)
    expect(css).toMatch(/:root \{[^}]*--mo-mix-soft: 16%;/)
  })
})

describe('Cross-preset Parity & Anti-drift Integrity', () => {
  test('THEME_COLOR_ROLES does NOT include "tone"', () => {
    expect(THEME_COLOR_ROLES).not.toContain('tone')
    expect(THEME_COLOR_ROLES).not.toContain('mo-tone')
  })

  test('TONES matches exactly the 7 co-equal tone roles', () => {
    expect(TONES).toEqual([
      'primary',
      'secondary',
      'neutral',
      'danger',
      'info',
      'success',
      'warning',
    ])
  })

  test('TONE_VARS maps every tone to its CSS variable', () => {
    for (const tone of TONES) {
      expect(TONE_VARS[tone]).toEqual({
        '--mo-tone': `var(--${tone})`,
        '--mo-tone-foreground': MORAINE_COLORS[tone].foreground,
        '--mo-tone-hover': MORAINE_COLORS[tone].hover,
        '--mo-tone-active': MORAINE_COLORS[tone].active,
        '--mo-tone-ink': `var(--${tone}-ink, var(--mo-${tone}-ink, var(--${tone})))`,
        '--mo-tone-soft': `var(--${tone}-soft, var(--mo-${tone}-soft, var(--background)))`,
      })
    }
  })

  test('exports DEFAULT_MIX_PERCENT and THEME_COLOR_CONFIG_KEYS contracts', () => {
    expect(DEFAULT_MIX_PERCENT).toEqual({
      hover: 8,
      active: 12,
      ink: 25,
      soft: 12,
    })
    expect(THEME_COLOR_CONFIG_KEYS).toEqual([
      'base',
      'foreground',
      'hover',
      'active',
      'ink',
      'soft',
    ])
  })

  test('MORAINE_COLORS contains internal tone channel with complete state tokens', () => {
    expect(MORAINE_COLORS.tone).toEqual({
      DEFAULT: 'var(--mo-tone)',
      foreground: 'var(--mo-tone-foreground)',
      ink: 'var(--mo-tone-ink)',
      hover: 'var(--mo-tone-hover, var(--mo-tone))',
      active: 'var(--mo-tone-active, var(--mo-tone-hover, var(--mo-tone)))',
      soft: 'var(--mo-tone-soft, var(--background))',
      'soft-hover': 'var(--mo-tone-soft-hover, var(--mo-tone-soft, var(--background)))',
      'soft-active':
        'var(--mo-tone-soft-active, var(--mo-tone-soft-hover, var(--mo-tone-soft, var(--background))))',
    })
  })

  test('MORAINE_COLORS exposes soft color token for each tone', () => {
    for (const tone of TONES) {
      const schema = MORAINE_COLORS[tone]
      expect(typeof schema).toBe('object')
      expect(schema.soft).toBe(`var(--${tone}-soft, var(--mo-${tone}-soft, var(--background)))`)
    }
  })

  test('createGatedColorDeclarations generates exactly 43 declarations', () => {
    const decls = createGatedColorDeclarations()
    const keys = Object.keys(decls)
    // 5 surfaces * 2 (hover, active) = 10
    // 7 tones * 4 (hover, active, ink, soft) = 28
    // 1 tone channel * 5 (hover, active, soft, soft-hover, soft-active) = 5
    expect(keys).toHaveLength(43)

    // Surfaces
    expect(decls['--mo-background-hover']).toBeDefined()
    expect(decls['--mo-background-active']).toBeDefined()
    expect(decls['--mo-card-hover']).toBeDefined()
    expect(decls['--mo-card-active']).toBeDefined()
    expect(decls['--mo-popover-hover']).toBeDefined()
    expect(decls['--mo-popover-active']).toBeDefined()
    expect(decls['--mo-muted-hover']).toBeDefined()
    expect(decls['--mo-muted-active']).toBeDefined()
    expect(decls['--mo-accent-hover']).toBeDefined()
    expect(decls['--mo-accent-active']).toBeDefined()

    // Tone states
    for (const tone of TONES) {
      expect(decls[`--mo-${tone}-hover`]).toBeDefined()
      expect(decls[`--mo-${tone}-active`]).toBeDefined()
      expect(decls[`--mo-${tone}-ink`]).toBeDefined()
      expect(decls[`--mo-${tone}-soft`]).toBe(
        `color-mix(in oklch, var(--${tone}) var(--mo-mix-soft, 12%), var(--background))`,
      )
    }

    // Tone channel states
    expect(decls['--mo-tone-hover']).toBeDefined()
    expect(decls['--mo-tone-active']).toBeDefined()
    expect(decls['--mo-tone-soft']).toBe(
      'color-mix(in oklch, var(--mo-tone) var(--mo-mix-soft, 12%), var(--background))',
    )
    expect(decls['--mo-tone-soft-hover']).toBe(
      'color-mix(in oklch, var(--mo-tone-soft), var(--mo-tone-ink) var(--mo-mix-hover, 8%))',
    )
    expect(decls['--mo-tone-soft-active']).toBe(
      'color-mix(in oklch, var(--mo-tone-soft), var(--mo-tone-ink) var(--mo-mix-active, 12%))',
    )
  })
})
