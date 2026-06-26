import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { addIconSelectors } from '@iconify/tailwind'
import { __unstable__loadDesignSystem, compile } from 'tailwindcss'
import { describe, expect, test } from 'vitest'

import { DEFAULT_ICON_SHORTCUTS } from '../shared/style/icons'

import { moraineTailwind } from './index'

const THEME_CSS = readFileSync(
  resolve(__dirname, '../../node_modules/tailwindcss/theme.css'),
  'utf8',
)
const UTILITIES_CSS = readFileSync(
  resolve(__dirname, '../../node_modules/tailwindcss/utilities.css'),
  'utf8',
)
const BASE_CSS = `${THEME_CSS}\n${UTILITIES_CSS}`

function moraineLoadModule(options?: { icons?: boolean }) {
  return async (id: string) => ({
    path: id,
    base: '',
    module: moraineTailwind(options),
  })
}

/**
 * Simulates the v4 config from docs/pages/styling.md:
 *
 *   plugin 'moraine/tailwind';
 *   plugin '@iconify/tailwind' { collections: lucide; }
 */
function combinedLoadModule(moraineOptions?: { icons?: boolean }) {
  return async (id: string) => {
    if (id === 'virtual:moraine') {
      return { path: id, base: '', module: moraineTailwind(moraineOptions) }
    }
    if (id === 'virtual:iconify') {
      return { path: id, base: '', module: addIconSelectors(['lucide']) }
    }
    throw new Error(`Unknown plugin: ${id}`)
  }
}

async function loadDesignSystem(options?: { icons?: boolean }) {
  return __unstable__loadDesignSystem(`${BASE_CSS}\n@plugin "virtual:moraine"`, {
    loadModule: moraineLoadModule(options),
  })
}

async function compileCSS(candidates: string[], options?: { icons?: boolean }) {
  const { build } = await compile(`${BASE_CSS}\n@plugin "virtual:moraine"`, {
    loadModule: moraineLoadModule(options),
  })
  return build(candidates)
}

async function loadDesignSystemWithIconify(moraineOptions?: { icons?: boolean }) {
  const css = [BASE_CSS, '@plugin "virtual:moraine";', '@plugin "virtual:iconify";'].join('\n')
  return __unstable__loadDesignSystem(css, {
    loadModule: combinedLoadModule(moraineOptions),
  })
}

async function compileCSSWithIconify(candidates: string[], moraineOptions?: { icons?: boolean }) {
  const css = [BASE_CSS, '@plugin "virtual:moraine";', '@plugin "virtual:iconify";'].join('\n')
  const { build } = await compile(css, {
    loadModule: combinedLoadModule(moraineOptions),
  })
  return build(candidates)
}

// ─── Colors ───────────────────────────────────────────────────────────

describe('colors', () => {
  test('bg-primary resolves to var(--primary)', async () => {
    const css = await compileCSS(['bg-primary'])
    expect(css).toContain('background-color: var(--primary)')
  })

  test('text-foreground resolves to var(--foreground)', async () => {
    const css = await compileCSS(['text-foreground'])
    expect(css).toContain('color: var(--foreground)')
  })

  test('bg-background resolves to var(--background)', async () => {
    const css = await compileCSS(['bg-background'])
    expect(css).toContain('background-color: var(--background)')
  })

  test('primary-foreground color resolves', async () => {
    const css = await compileCSS(['text-primary-foreground'])
    expect(css).toContain('color: var(--primary-foreground)')
  })

  test('secondary colors resolve', async () => {
    const css = await compileCSS(['bg-secondary', 'text-secondary-foreground'])
    expect(css).toContain('background-color: var(--secondary)')
    expect(css).toContain('color: var(--secondary-foreground)')
  })

  test('card colors resolve', async () => {
    const css = await compileCSS(['bg-card', 'text-card-foreground'])
    expect(css).toContain('background-color: var(--card)')
    expect(css).toContain('color: var(--card-foreground)')
  })

  test('muted colors resolve', async () => {
    const css = await compileCSS(['bg-muted', 'text-muted-foreground'])
    expect(css).toContain('background-color: var(--muted)')
    expect(css).toContain('color: var(--muted-foreground)')
  })

  test('accent colors resolve', async () => {
    const css = await compileCSS(['bg-accent', 'text-accent-foreground'])
    expect(css).toContain('background-color: var(--accent)')
    expect(css).toContain('color: var(--accent-foreground)')
  })

  test('destructive colors resolve', async () => {
    const css = await compileCSS(['bg-destructive', 'text-destructive-foreground'])
    expect(css).toContain('background-color: var(--destructive)')
    expect(css).toContain('color: var(--destructive-foreground)')
  })

  test('border/ring/input tokens resolve', async () => {
    const css = await compileCSS(['border-border', 'ring-ring', 'bg-input'])
    expect(css).toContain('border-color: var(--border)')
    expect(css).toContain('--tw-ring-color: var(--ring)')
    expect(css).toContain('background-color: var(--input)')
  })
})

// ─── Border Radius ────────────────────────────────────────────────────

describe('border radius', () => {
  test('rounded-lg uses var(--radius)', async () => {
    const css = await compileCSS(['rounded-lg'])
    expect(css).toContain('border-radius: var(--radius)')
  })

  test('rounded-xl uses calc(var(--radius) * 1.4)', async () => {
    const css = await compileCSS(['rounded-xl'])
    expect(css).toContain('border-radius: calc(var(--radius) * 1.4)')
  })

  test('rounded-sm uses calc(var(--radius) * 0.6)', async () => {
    const css = await compileCSS(['rounded-sm'])
    expect(css).toContain('border-radius: calc(var(--radius) * 0.6)')
  })

  test('rounded-xs uses calc(var(--radius) * 0.5)', async () => {
    const css = await compileCSS(['rounded-xs'])
    expect(css).toContain('border-radius: calc(var(--radius) * 0.5)')
  })

  test('rounded-2xl through rounded-4xl resolve', async () => {
    const css = await compileCSS(['rounded-2xl', 'rounded-3xl', 'rounded-4xl'])
    expect(css).toContain('calc(var(--radius) * 1.8)')
    expect(css).toContain('calc(var(--radius) * 2.2)')
    expect(css).toContain('calc(var(--radius) * 2.6)')
  })
})

// ─── Shadows ──────────────────────────────────────────────────────────

describe('shadows', () => {
  test('shadow uses var(--shadow)', async () => {
    const css = await compileCSS(['shadow'])
    expect(css).toContain('var(--shadow)')
  })

  test('shadow-sm uses var(--shadow-sm)', async () => {
    const css = await compileCSS(['shadow-sm'])
    expect(css).toContain('var(--shadow-sm)')
  })

  test('shadow-lg uses var(--shadow-lg)', async () => {
    const css = await compileCSS(['shadow-lg'])
    expect(css).toContain('var(--shadow-lg)')
  })

  test('all shadow sizes use CSS custom properties', async () => {
    const css = await compileCSS([
      'shadow-2xs',
      'shadow-xs',
      'shadow-sm',
      'shadow',
      'shadow-md',
      'shadow-lg',
      'shadow-xl',
      'shadow-2xl',
    ])
    expect(css).toContain('var(--shadow-2xs)')
    expect(css).toContain('var(--shadow-xs)')
    expect(css).toContain('var(--shadow-sm)')
    expect(css).toContain('var(--shadow)')
    expect(css).toContain('var(--shadow-md)')
    expect(css).toContain('var(--shadow-lg)')
    expect(css).toContain('var(--shadow-xl)')
    expect(css).toContain('var(--shadow-2xl)')
  })
})

// ─── Animations ───────────────────────────────────────────────────────

describe('animations', () => {
  test('animate-mo-enter uses CSS variable duration', async () => {
    const css = await compileCSS(['animate-mo-enter'])
    expect(css).toContain(
      'animation: mo-enter var(--mo-anim-duration,var(--mo-anim-duration-enter,150ms)) cubic-bezier(0.16, 1, 0.3, 1) 1',
    )
  })

  test('animate-mo-exit uses CSS variable duration', async () => {
    const css = await compileCSS(['animate-mo-exit'])
    expect(css).toContain(
      'animation: mo-exit var(--mo-anim-duration,var(--mo-anim-duration-exit,100ms)) cubic-bezier(0.7, 0, 0.84, 0) 1',
    )
  })

  test('mo-enter keyframe uses CSS variable transforms', async () => {
    const css = await compileCSS(['animate-mo-enter'])
    expect(css).toContain('@keyframes mo-enter')
    expect(css).toContain('var(--mo-enter-opacity, 1)')
    expect(css).toContain('var(--mo-enter-translate-x, 0)')
    expect(css).toContain('var(--mo-enter-translate-y, 0)')
    expect(css).toContain('var(--mo-enter-scale, 1)')
    expect(css).toContain('var(--mo-enter-rotate, 0)')
  })

  test('mo-exit keyframe uses CSS variable transforms', async () => {
    const css = await compileCSS(['animate-mo-exit'])
    expect(css).toContain('@keyframes mo-exit')
    expect(css).toContain('var(--mo-exit-opacity, 1)')
    expect(css).toContain('var(--mo-exit-translate-x, 0)')
    expect(css).toContain('var(--mo-exit-scale, 1)')
  })

  test('accordion-down animation resolves', async () => {
    const css = await compileCSS(['animate-accordion-down'])
    expect(css).toContain('@keyframes accordion-down')
    expect(css).toContain('var(--mo-collapsible-content-height)')
    expect(css).toContain('animation: accordion-down 200ms cubic-bezier(0.16, 1, 0.3, 1) 1')
  })

  test('accordion-up animation resolves', async () => {
    const css = await compileCSS(['animate-accordion-up'])
    expect(css).toContain('@keyframes accordion-up')
    expect(css).toContain('animation: accordion-up 200ms cubic-bezier(0.7, 0, 0.84, 0) 1')
  })

  test('looping animations use infinite count and 2s duration', async () => {
    const css = await compileCSS(['animate-carousel', 'animate-swing', 'animate-elastic'])
    expect(css).toContain('animation: carousel 2s ease-in-out infinite')
    expect(css).toContain('animation: swing 2s ease-in-out infinite')
    expect(css).toContain('animation: elastic 2s ease-in-out infinite')
  })

  test('transition utilities use shared animation tokens', async () => {
    const css = await compileCSS(['transition-mo-enter', 'transition-mo-exit'])
    expect(css).toContain('.transition-mo-enter')
    expect(css).toContain(
      'transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,150ms))',
    )
    expect(css).toContain('transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1)')
    expect(css).toContain('.transition-mo-exit')
    expect(css).toContain(
      'transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-exit,100ms))',
    )
    expect(css).toContain('transition-timing-function: cubic-bezier(0.7, 0, 0.84, 0)')
  })
})

// ─── Icon Utilities ──────────────────────────────────────────────────

describe('icon utilities', () => {
  test('icon classes appear in class list when icons enabled', async () => {
    const ds = await loadDesignSystem({ icons: true })
    const classList = ds.getClassList()
    const iconClasses = classList.filter(([name]) => name.startsWith('icon-')).map(([name]) => name)

    expect(iconClasses.length).toBe(DEFAULT_ICON_SHORTCUTS.length)

    for (const [name] of DEFAULT_ICON_SHORTCUTS) {
      expect(iconClasses).toContain(name)
    }
  })

  test('icon classes do not appear when icons disabled', async () => {
    const ds = await loadDesignSystem({ icons: false })
    const classList = ds.getClassList()
    const iconClasses = classList.filter(([name]) => name.startsWith('icon-'))
    expect(iconClasses).toHaveLength(0)
  })

  test('icons default to enabled', async () => {
    const ds = await loadDesignSystem()
    const classList = ds.getClassList()
    const iconClasses = classList.filter(([name]) => name.startsWith('icon-'))
    expect(iconClasses.length).toBe(DEFAULT_ICON_SHORTCUTS.length)
  })

  test('icon stubs produce no CSS (handled by iconify)', async () => {
    const ds = await loadDesignSystem({ icons: true })
    const cssResults = ds.candidatesToCss(['icon-arrow-down', 'icon-check', 'icon-close'])
    for (const result of cssResults) {
      expect(result).toBeNull()
    }
  })

  test('all expected icon names are registered', async () => {
    const ds = await loadDesignSystem({ icons: true })
    const classList = ds.getClassList()
    const iconNames = classList.filter(([name]) => name.startsWith('icon-')).map(([name]) => name)

    const expected = [
      'icon-arrow-down',
      'icon-arrow-up',
      'icon-arrow-left',
      'icon-arrow-right',
      'icon-check',
      'icon-close',
      'icon-menu',
      'icon-plus',
      'icon-minus',
      'icon-chevron-down',
      'icon-chevron-up',
      'icon-chevron-left',
      'icon-chevron-right',
    ]
    for (const icon of expected) {
      expect(iconNames).toContain(icon)
    }
  })
})

// ─── Full compilation ────────────────────────────────────────────────

// ─── Font Families ────────────────────────────────────────────────────

describe('font families', () => {
  test('font-sans resolves to var(--font-sans)', async () => {
    const css = await compileCSS(['font-sans'])
    expect(css).toContain('font-family: var(--font-sans)')
  })

  test('font-mono resolves to var(--font-mono)', async () => {
    const css = await compileCSS(['font-mono'])
    expect(css).toContain('font-family: var(--font-mono)')
  })

  test('font-serif resolves to var(--font-serif)', async () => {
    const css = await compileCSS(['font-serif'])
    expect(css).toContain('font-family: var(--font-serif)')
  })
})

// ─── Animation Metadata ───────────────────────────────────────────────

describe('animation metadata', () => {
  test('animation durations are available as transition durations', async () => {
    const ds = await loadDesignSystem()
    const durations = ds.theme.get(['--transition-duration'])
    expect(durations).toBeDefined()
  })

  test('animation timing functions are available', async () => {
    const ds = await loadDesignSystem()
    const timingFns = ds.theme.get(['--transition-timing-function'])
    expect(timingFns).toBeDefined()
  })

  test('animation iteration counts are available', async () => {
    const ds = await loadDesignSystem()
    const counts = ds.theme.get(['--animation-iteration-count'])
    expect(counts).toBeDefined()
  })
})

// ─── Attribute Variants ───────────────────────────────────────────────

describe('attribute variants', () => {
  test('data-active variant transforms correctly', async () => {
    const css = await compileCSS(['data-active:bg-primary'])
    expect(css).toContain('[data-active]')
    expect(css).toContain('background-color: var(--primary)')
  })

  test('data-checked variant transforms correctly', async () => {
    const css = await compileCSS(['data-checked:text-foreground'])
    expect(css).toContain('[data-checked]')
    expect(css).toContain('color: var(--foreground)')
  })

  test('data-disabled variant works with opacity', async () => {
    const css = await compileCSS(['data-disabled:opacity-50'])
    expect(css).toContain('[data-disabled]')
    expect(css).toContain('opacity: 50%')
  })

  test('aria-busy variant transforms correctly', async () => {
    const css = await compileCSS(['aria-busy:opacity-80'])
    expect(css).toContain('[aria-busy]')
    expect(css).toContain('opacity: 80%')
  })

  test('aria-checked variant works with moraine colors', async () => {
    const css = await compileCSS(['aria-checked:bg-accent'])
    expect(css).toContain('[aria-checked]')
    expect(css).toContain('background-color: var(--accent)')
  })

  test('aria-disabled variant works with pointer-events', async () => {
    const css = await compileCSS(['aria-disabled:pointer-events-none'])
    expect(css).toContain('[aria-disabled]')
    expect(css).toContain('pointer-events: none')
  })

  test('data variants compose with hover', async () => {
    const css = await compileCSS(['hover:data-active:bg-primary'])
    expect(css).toContain('[data-active]')
    expect(css).toContain('background-color: var(--primary)')
  })
})

// ─── Full compilation ────────────────────────────────────────────────

describe('full compilation', () => {
  test('multiple utility types compile together', async () => {
    const css = await compileCSS([
      'bg-primary',
      'text-primary-foreground',
      'rounded-lg',
      'shadow-md',
      'animate-mo-enter',
      'border-border',
    ])
    expect(css).toContain('background-color: var(--primary)')
    expect(css).toContain('color: var(--primary-foreground)')
    expect(css).toContain('border-radius: var(--radius)')
    expect(css).toContain('var(--shadow-md)')
    expect(css).toContain('animation: mo-enter')
    expect(css).toContain('border-color: var(--border)')
  })

  test('hover variant works with moraine tokens', async () => {
    const css = await compileCSS(['hover:bg-primary'])
    expect(css).toContain('hover\\:bg-primary')
    expect(css).toContain('background-color: var(--primary)')
  })

  test('focus variant works with moraine tokens', async () => {
    const css = await compileCSS(['focus:ring-ring'])
    expect(css).toContain('focus\\:ring-ring')
    expect(css).toContain('--tw-ring-color: var(--ring)')
  })

  test('responsive variants work with moraine tokens', async () => {
    const css = await compileCSS(['md:bg-secondary'])
    expect(css).toContain('md\\:bg-secondary')
    expect(css).toContain('background-color: var(--secondary)')
  })
})

// ─── @iconify/tailwind integration (docs config) ────────────────────

describe('with @iconify/tailwind (docs config)', () => {
  test('lucide icon utilities generate SVG CSS', async () => {
    const css = await compileCSSWithIconify(['lucide--arrow-down'])
    expect(css).toContain('.lucide--arrow-down')
    expect(css).toContain('--svg: url(')
    expect(css).toContain('data:image/svg+xml')
  })

  test('.iconify base class provides mask-image styles', async () => {
    const css = await compileCSSWithIconify(['iconify'])
    expect(css).toContain('.iconify {')
    expect(css).toContain('mask-image: var(--svg)')
    expect(css).toContain('display: inline-block')
  })

  test('iconify icons render with currentColor via mask', async () => {
    const css = await compileCSSWithIconify(['lucide--check'])
    expect(css).toContain('.lucide--check')
    expect(css).toContain('--svg: url(')
  })

  test('moraine tokens still work alongside iconify', async () => {
    const css = await compileCSSWithIconify(['bg-primary', 'rounded-lg', 'animate-mo-enter'])
    expect(css).toContain('background-color: var(--primary)')
    expect(css).toContain('border-radius: var(--radius)')
    expect(css).toContain('animation: mo-enter')
  })

  test('moraine icon stubs still registered in class list', async () => {
    const ds = await loadDesignSystemWithIconify()
    const classList = ds.getClassList()
    const moraineIcons = classList.filter(([n]) => n.startsWith('icon-'))
    expect(moraineIcons.length).toBe(DEFAULT_ICON_SHORTCUTS.length)
  })

  test('lucide icon classes registered from iconify', async () => {
    const ds = await loadDesignSystemWithIconify()
    const classList = ds.getClassList()
    const lucideClasses = classList.filter(([n]) => n.startsWith('lucide--'))
    expect(lucideClasses.length).toBeGreaterThan(1000)
  })

  test('iconify icon candidates produce CSS, moraine stubs do not', async () => {
    const ds = await loadDesignSystemWithIconify()
    const results = ds.candidatesToCss([
      'lucide--arrow-down',
      'lucide--check',
      'icon-arrow-down',
      'icon-check',
    ])
    // iconify icons produce real CSS
    expect(results[0]).not.toBeNull()
    expect(results[0]).toContain('--svg: url(')
    expect(results[1]).not.toBeNull()
    expect(results[1]).toContain('--svg: url(')
    // moraine stubs produce no CSS
    expect(results[2]).toBeNull()
    expect(results[3]).toBeNull()
  })

  test('moraine icons disabled still allows iconify icons', async () => {
    const ds = await loadDesignSystemWithIconify({ icons: false })
    const classList = ds.getClassList()

    // moraine stubs gone
    expect(classList.filter(([n]) => n.startsWith('icon-'))).toHaveLength(0)

    // iconify still works
    const lucideClasses = classList.filter(([n]) => n.startsWith('lucide--'))
    expect(lucideClasses.length).toBeGreaterThan(1000)

    const results = ds.candidatesToCss(['lucide--arrow-down'])
    expect(results[0]).toContain('--svg: url(')
  })

  test('iconify icons work with variants', async () => {
    const css = await compileCSSWithIconify(['hover:lucide--arrow-down'])
    expect(css).toContain('hover\\:lucide--arrow-down')
    expect(css).toContain('--svg: url(')
  })
})
