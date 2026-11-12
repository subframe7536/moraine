import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { addIconSelectors } from '@iconify/tailwind'
import { __unstable__loadDesignSystem, compile } from 'tailwindcss'
import { describe, expect, test } from 'vitest'

import { boldSliderRecipe } from '../components/bold-slider/bold-slider.recipe'
import { COLLAPSIBLE_CONTENT_WRAPPER_CLASS } from '../components/collapsible/collapsible.recipe'
import { iconRecipe } from '../components/icon/icon.recipe'
import { TOOLTIP_INSTANT_POSITIONER_CLASS } from '../components/tooltip/tooltip.recipe'

import { cn } from './cn'
import { moraineTailwind } from './tailwind'

const THEME_CSS = readFileSync(
  resolve(__dirname, '../../node_modules/tailwindcss/theme.css'),
  'utf8',
)
const UTILITIES_CSS = readFileSync(
  resolve(__dirname, '../../node_modules/tailwindcss/utilities.css'),
  'utf8',
)
const BASE_CSS = `${THEME_CSS}\n${UTILITIES_CSS}`

function withoutAutoStateBase(css: string): string {
  return css.replace(
    /\n@layer base \{\n {2}@supports \(color: color-mix\(in oklch, red, white\)\) \{\n {4}\*, ::before, ::after \{[\s\S]*?\n {4}\}\n {2}\}\n\}/,
    '',
  )
}

function moraineLoadModule() {
  return async (id: string) => ({
    path: id,
    base: '',
    module: moraineTailwind,
  })
}

/**
 * Simulates the v4 config from docs/pages/styling.md:
 *
 *   plugin 'moraine/tailwind';
 *   plugin '@iconify/tailwind' { collections: lucide; }
 */
function combinedLoadModule() {
  return async (id: string) => {
    if (id === 'virtual:moraine') {
      return { path: id, base: '', module: moraineTailwind }
    }
    if (id === 'virtual:iconify') {
      return { path: id, base: '', module: addIconSelectors(['lucide']) }
    }
    throw new Error(`Unknown plugin: ${id}`)
  }
}

async function loadDesignSystem() {
  return __unstable__loadDesignSystem(`${BASE_CSS}\n@plugin "virtual:moraine"`, {
    loadModule: moraineLoadModule(),
  })
}

async function compileCSS(candidates: string[], includeAutoStates = false) {
  const { build } = await compile(`${BASE_CSS}\n@plugin "virtual:moraine"`, {
    loadModule: moraineLoadModule(),
  })
  const css = build(candidates)
  if (includeAutoStates) {
    return css
  }
  return withoutAutoStateBase(css)
}

async function compileCSSWithIconify(candidates: string[]) {
  const inputCSS = [BASE_CSS, '@plugin "virtual:moraine";', '@plugin "virtual:iconify";'].join('\n')
  const { build } = await compile(inputCSS, {
    loadModule: combinedLoadModule(),
  })
  return withoutAutoStateBase(build(candidates))
}

describe('colors', () => {
  test.each([
    ['bg-primary', 'background-color: var(--primary);'],
    ['text-primary-foreground', 'color: var(--primary-foreground);'],
    ['bg-secondary', 'background-color: var(--secondary);'],
    ['text-secondary-foreground', 'color: var(--secondary-foreground);'],
    ['text-foreground', 'color: var(--foreground);'],
    ['bg-background', 'background-color: var(--background);'],
    ['bg-card', 'background-color: var(--card);'],
    ['text-card-foreground', 'color: var(--card-foreground);'],
    ['bg-muted', 'background-color: var(--muted);'],
    ['text-muted-foreground', 'color: var(--muted-foreground);'],
    ['bg-accent', 'background-color: var(--accent);'],
    ['text-accent-foreground', 'color: var(--accent-foreground);'],
    ['bg-danger', 'background-color: var(--danger);'],
    ['text-danger-foreground', 'color: var(--danger-foreground, var(--background));'],
    ['bg-info', 'background-color: var(--info);'],
    ['text-info-foreground', 'color: var(--info-foreground, var(--background));'],
  ])('%s resolves to the semantic color token', async (utility, declaration) => {
    const css = await compileCSS([utility])
    expect(css).toContain(declaration)
  })

  test.each(['info', 'success', 'warning'] as const)('%s tone colors resolve', async (color) => {
    const css = await compileCSS([`bg-${color}`, `text-${color}`, `text-${color}-foreground`])
    expect(css).toContain(`background-color: var(--${color});`)
    expect(css).toContain(`color: var(--${color});`)
    expect(css).toContain(`color: var(--${color}-foreground, var(--background));`)
  })

  test('hover and active colors fall back through the base color', async () => {
    const css = await compileCSS([
      'bg-background-hover',
      'bg-card-active',
      'bg-popover-hover',
      'bg-muted-active',
      'bg-accent-hover',
      'bg-primary-hover',
      'bg-primary-active',
      'text-primary-ink',
      'text-danger-ink',
    ])

    expect(css).toContain('var(--background-hover, var(--mo-background-hover, var(--background)))')
    expect(css).toContain(
      'var(--card-active, var(--mo-card-active, var(--card-hover, var(--mo-card-hover, var(--card)))))',
    )
    expect(css).toContain('var(--popover-hover, var(--mo-popover-hover, var(--popover)))')
    expect(css).toContain(
      'var(--muted-active, var(--mo-muted-active, var(--muted-hover, var(--mo-muted-hover, var(--muted)))))',
    )
    expect(css).toContain('var(--accent-hover, var(--mo-accent-hover, var(--accent)))')
    expect(css).toContain('var(--primary-hover, var(--mo-primary-hover, var(--primary)))')
    expect(css).toContain(
      'var(--primary-active, var(--mo-primary-active, var(--primary-hover, var(--mo-primary-hover, var(--primary)))))',
    )
    expect(css).toContain('var(--primary-ink, var(--mo-primary-ink, var(--primary)))')
    expect(css).toContain('var(--danger-ink, var(--mo-danger-ink, var(--danger)))')
    expect(css).not.toContain('-focus')
  })

  test('tone channel utilities read the tone variables', async () => {
    const css = await compileCSS([
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
    ])

    expect(css).toContain('--mo-tone: var(--danger);')
    expect(css).toContain('--mo-tone-foreground: var(--danger-foreground, var(--background));')
    expect(css).toContain(
      '--mo-tone-hover: var(--danger-hover, var(--mo-danger-hover, var(--danger)));',
    )
    expect(css).toContain('--mo-tone-ink: var(--danger-ink, var(--mo-danger-ink, var(--danger)));')
    expect(css).toContain('--mo-tone-soft: var(--danger-soft, var(--mo-danger-soft, transparent));')
    expect(css).toContain('background-color: color-mix(in oklab, var(--mo-tone) 12%, transparent);')
    expect(css).toContain('border-color: color-mix(in oklab, var(--mo-tone) 40%, transparent);')
    expect(css).toContain('color: var(--mo-tone-foreground);')
    expect(css).toContain('color: var(--mo-tone-ink);')
    expect(css).toContain('background-color: var(--mo-tone-hover, var(--mo-tone));')
    expect(css).toContain(
      'background-color: var(--mo-tone-soft-hover, var(--mo-tone-soft, transparent));',
    )
    expect(css).toContain(
      'background-color: var(--danger-soft, var(--mo-danger-soft, transparent));',
    )
    expect(css).toContain('--tw-ring-color: color-mix(in oklab, var(--mo-tone) 20%, transparent);')
  })

  test('mixes colors in the local scope only when color-mix is supported', async () => {
    const css = await compileCSS(['bg-accent-hover'], true)
    expect(css).toContain('@supports (color: color-mix(in oklch, red, white))')
    expect(css).toContain(
      '--mo-accent-hover: color-mix(in oklch, var(--accent), var(--accent-foreground, var(--foreground)) var(--mo-mix-hover, 8%));',
    )
    expect(css).not.toMatch(/--primary:\s/)
  })

  test('control, boundary, and focus tokens resolve without default colors', async () => {
    const css = await compileCSS(['border-border', 'border-input', 'bg-control', 'ring-ring'], true)
    expect(css).toContain('border-color: var(--border)')
    expect(css).toContain('border-color: var(--input)')
    expect(css).toContain('background-color: var(--control)')
    expect(css).toContain('--tw-ring-color: var(--ring)')
    expect(css).not.toMatch(/--control:\s/)
  })
})

describe('font size and border radius', () => {
  test('text utilities scale from the local --font-size', async () => {
    const css = await compileCSS(['text-tiny', 'text-sm', 'text-base', 'text-5xl'])

    expect(css).toContain('font-size: calc(var(--font-size, 1rem) * 0.625)')
    expect(css).toContain('line-height: var(--tw-leading, calc(var(--font-size, 1rem) * 0.875))')
    expect(css).toContain('font-size: calc(var(--font-size, 1rem) * 0.875)')
    expect(css).toContain('font-size: var(--font-size, 1rem)')
    expect(css).toContain('font-size: calc(var(--font-size, 1rem) * 3)')
  })

  test.each([
    ['rounded-lg', 'border-radius: var(--radius);'],
    ['rounded-xl', 'border-radius: calc(var(--radius) * 1.4);'],
    ['rounded-sm', 'border-radius: calc(var(--radius) * 0.6);'],
    ['rounded-xs', 'border-radius: calc(var(--radius) * 0.5);'],
    ['rounded-2xl', 'border-radius: calc(var(--radius) * 1.8);'],
    ['rounded-4xl', 'border-radius: calc(var(--radius) * 2.6);'],
  ])('%s scales from --radius', async (utility, declaration) => {
    expect(await compileCSS([utility])).toContain(declaration)
  })
})

describe('shadows and z-index', () => {
  test('preserves the native Tailwind shadow scale', async () => {
    const candidates = [
      'shadow-2xs',
      'shadow-xs',
      'shadow-sm',
      'shadow',
      'shadow-md',
      'shadow-lg',
      'shadow-xl',
      'shadow-2xl',
    ]
    const { build } = await compile(BASE_CSS)
    expect(await compileCSS(candidates)).toBe(build(candidates))
  })

  test('semantic shadow tokens resolve through the box-shadow variable', async () => {
    expect(await compileCSS(['shadow-overlay'])).toContain('--tw-shadow: var(--shadow-overlay);')
  })

  test.each([
    ['z-base', 'z-index: 1;'],
    ['z-raised', 'z-index: 2;'],
    ['z-control', 'z-index: 3;'],
    ['z-sticky', 'z-index: 10;'],
    ['z-resize', 'z-index: 20;'],
    ['z-overlay', 'z-index: 40;'],
    ['z-floating', 'z-index: 50;'],
  ])('%s resolves to its semantic layer', async (utility, declaration) => {
    expect(await compileCSS([utility])).toContain(declaration)
  })
})

describe('animations', () => {
  test('compiles disclosure child state and slider peer state', async () => {
    const tokens = [
      ...COLLAPSIBLE_CONTENT_WRAPPER_CLASS.split(' '),
      ...[boldSliderRecipe.config.base.content, boldSliderRecipe.config.base.indicator]
        .flatMap((value) => cn(value)!.split(' '))
        .filter((token) => token.startsWith('peer-')),
    ]
    const css = await compileCSS(tokens)
    expect(css).toMatch(/\[data-(?:transition\]\[data-expanded|expanded\]\[data-transition)\]/)
    expect(css).toMatch(/\[data-(?:transition\]\[data-closed|closed\]\[data-transition)\]/)
    expect(css).toContain('@keyframes accordion-down')
    expect(css).toContain('@keyframes accordion-up')
    expect(css).toMatch(/\.peer\)?\[data-focus-visible\] ?~/)
    expect(css).toMatch(/\.peer\)?:hover ?~/)
    expect(css).toMatch(/\.peer\)?\[data-dragging\] ?~/)
    expect(css).not.toContain(':has(')
  })

  test('compound data states compile for disclosure and instant motion', async () => {
    const css = await compileCSS([
      'data-transition:data-expanded:animate-accordion-down',
      'data-instant-motion:data-expanded:animate-none',
      'data-instant-motion:data-closed:animate-none',
    ])
    expect(css).toContain('[data-transition][data-expanded]')
    expect(css).toContain('[data-instant-motion][data-expanded]')
    expect(css).toContain('[data-instant-motion][data-closed]')
    expect(css).toContain('animation: none')
    expect(css).toContain('@keyframes accordion-down')
  })

  test('the instant tooltip positioner compiles without :has', async () => {
    const css = await compileCSS(TOOLTIP_INSTANT_POSITIONER_CLASS.split(' '))
    expect(css).toContain('[data-positioned]')
    expect(css).not.toContain(':has(')
  })

  test('enter and exit animations read shared duration, easing, and keyframe variables', async () => {
    const enter = await compileCSS(['animate-mo-enter'])
    expect(enter).toContain(
      'animation: mo-enter var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))',
    )
    expect(enter).toContain(
      'var(--mo-anim-ease,var(--mo-anim-ease-enter,cubic-bezier(0.16, 1, 0.3, 1)))',
    )
    expect(enter).toContain('opacity: var(--mo-enter-opacity, 1);')
    expect(enter).toContain('scale(var(--mo-enter-scale, 1))')

    const exit = await compileCSS(['animate-mo-exit'])
    expect(exit).toContain(
      'animation: mo-exit var(--mo-anim-duration,var(--mo-anim-duration-exit,150ms))',
    )
    expect(exit).toContain('1 forwards;')
    expect(exit).toContain('opacity: var(--mo-exit-opacity, 1);')
  })

  test.each([
    [
      'animate-carousel',
      'carousel var(--mo-anim-duration,var(--mo-anim-duration-loop,2s)) ease-in-out infinite',
    ],
    [
      'animate-swing',
      'swing var(--mo-anim-duration,var(--mo-anim-duration-loop,2s)) ease-in-out infinite',
    ],
    [
      'animate-elastic',
      'elastic var(--mo-anim-duration,var(--mo-anim-duration-loop,2s)) ease-in-out infinite',
    ],
    [
      'animate-spin',
      'spin var(--mo-anim-duration,var(--mo-anim-duration-spin,1s)) linear infinite',
    ],
  ])('%s uses the shared duration variable', async (utility, animation) => {
    expect(await compileCSS([utility])).toContain(`animation: ${animation};`)
  })

  test('standard transition utilities keep Tailwind defaults', async () => {
    const css = await compileCSS(['transition', 'transition-colors', 'transition-mo-enter'])
    expect(css).toContain(
      'transition-duration: var(--tw-duration, var(--default-transition-duration));',
    )
    expect(css).toContain(
      'transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));',
    )
    expect(css).not.toContain('.transition-mo-enter')
  })

  test('enter and exit utilities set the matching CSS variables', async () => {
    const css = await compileCSS([
      'enter-opacity-0',
      'exit-opacity-0',
      'enter-opacity-50',
      'enter-scale-95',
      'exit-scale-95',
      'enter-translate-x-1',
      '-enter-translate-x-1',
      'exit-translate-x-1',
      'enter-translate-y-10',
      '-enter-translate-y-10',
      'enter-translate-y-full',
      '-enter-translate-y-full',
      'enter-rotate-45',
      '-enter-rotate-45',
      'exit-rotate-45',
    ])
    expect(css).toContain('--mo-enter-opacity: 0;')
    expect(css).toContain('--mo-exit-opacity: 0;')
    expect(css).toContain('--mo-enter-opacity: 0.5;')
    expect(css).toContain('--mo-enter-scale: .95;')
    expect(css).toContain('--mo-exit-scale: .95;')
    expect(css).toContain('--mo-enter-translate-x: 0.25rem;')
    expect(css).toContain('--mo-enter-translate-x: calc(0.25rem * -1);')
    expect(css).toContain('--mo-exit-translate-x: 0.25rem;')
    expect(css).toContain('--mo-enter-translate-y: 2.5rem;')
    expect(css).toContain('--mo-enter-translate-y: calc(2.5rem * -1);')
    expect(css).toContain('--mo-enter-translate-y: 100%;')
    expect(css).toContain('--mo-enter-translate-y: calc(100% * -1);')
    expect(css).toContain('--mo-enter-rotate: 45deg;')
    expect(css).toContain('--mo-enter-rotate: calc(45deg * -1);')
    expect(css).toContain('--mo-exit-rotate: 45deg;')
  })

  test('enter and exit utilities compose with data variants', async () => {
    const css = await compileCSS([
      'data-expanded:enter-opacity-0',
      'data-closed:exit-opacity-0',
      'data-expanded:enter-scale-95',
      'data-closed:exit-scale-95',
    ])
    expect(css).toContain('.data-expanded\\:enter-opacity-0[data-expanded]')
    expect(css).toContain('.data-closed\\:exit-opacity-0[data-closed]')
    expect(css).toContain('.data-expanded\\:enter-scale-95[data-expanded]')
    expect(css).toContain('.data-closed\\:exit-scale-95[data-closed]')
  })
})

describe('icon utilities', () => {
  test('registers semantic icon names without generating CSS', async () => {
    const ds = await loadDesignSystem()
    const iconClasses = ds
      .getClassList()
      .filter(([name]) => name.startsWith('icon-'))
      .map(([name]) => name)

    expect(iconClasses).toContain('icon-check')
    expect(iconClasses).toContain('icon-close')
    for (const result of ds.candidatesToCss(['icon-arrow-down', 'icon-check', 'icon-close'])) {
      expect(result).toBeNull()
    }
  })

  test('compiles the icon-mask forced-colors behavior', async () => {
    const css = await compileCSS(
      cn(iconRecipe.config.variants!.isMask!.true!.root)?.split(' ') ?? [],
    )

    expect(css).toMatch(/\.icon-mask\s*\{\s*forced-color-adjust: none;/)
    expect(css).toMatch(
      /@supports \(forced-color-adjust: ?preserve-parent-color\)\s*\{\s*forced-color-adjust: preserve-parent-color;/,
    )
    expect(css).toMatch(/@media \(forced-colors: active\)\s*\{\s*color: inherit;/)
  })

  test('compiles the icon host sizing classes', async () => {
    const css = await compileCSS(
      cn(iconRecipe.config.variants!.isMask!.false!.root)?.split(' ') ?? [],
    )

    expect(css).toMatch(/\.size-\\\[1\\\.2em\\\]\s*\{\s*width: 1\.2em;\s*height: 1\.2em;/)
    expect(css).toMatch(/>\s*\*\)?\s*\{\s*width: 100%;\s*height: 100%;/)
  })
})

describe('font families', () => {
  test.each([
    ['font-sans', 'var(--font-sans)'],
    ['font-mono', 'var(--font-mono)'],
    ['font-serif', 'var(--font-serif)'],
  ])('%s resolves to its font variable', async (utility, variable) => {
    expect(await compileCSS([utility])).toContain(`font-family: ${variable};`)
  })
})

describe('attribute variants', () => {
  test.each([
    ['data-active:bg-primary', '[data-active]', 'background-color: var(--primary);'],
    ['data-checked:text-foreground', '[data-checked]', 'color: var(--foreground);'],
    ['data-disabled:opacity-50', '[data-disabled]', 'opacity: 50%;'],
    ['aria-busy:opacity-80', '[aria-busy]', 'opacity: 80%;'],
    ['aria-checked:bg-accent', '[aria-checked]', 'background-color: var(--accent);'],
    ['aria-disabled:pointer-events-none', '[aria-disabled]', 'pointer-events: none;'],
  ])('%s targets its attribute selector', async (candidate, selector, declaration) => {
    const css = await compileCSS([candidate])
    expect(css).toContain(`${selector} {`)
    expect(css).toContain(declaration)
  })

  test('data-leaf compiles tree item utilities', async () => {
    expect(await compileCSS(['data-leaf:invisible'])).toContain('.data-leaf\\:invisible[data-leaf]')
  })

  test('the button press selector applies only to the active, non-popup state', async () => {
    const css = await compileCSS([
      'transition-all',
      '[&:active:not([aria-haspopup])]:translate-y-px',
    ])

    expect(css).toMatch(/:active:not\(\[aria-haspopup\]\)\s*\{\s*--tw-translate-y: 1px;/)
  })

  test('data variants compose with hover inside a hover media query', async () => {
    const css = await compileCSS(['hover:data-active:bg-primary'])
    expect(css).toContain('@media (hover: hover)')
    expect(css).toMatch(
      /\.hover\\:data-active\\:bg-primary:hover\[data-active\]\s*\{\s*background-color: var\(--primary\);/,
    )
  })

  test('hover, focus, and responsive variants resolve moraine tokens', async () => {
    const css = await compileCSS(['hover:bg-primary', 'focus:ring-ring', 'md:bg-secondary'])
    expect(css).toMatch(
      /@media \(hover: hover\)\s*\{\s*\.hover\\:bg-primary:hover\s*\{\s*background-color: var\(--primary\);/,
    )
    expect(css).toMatch(/\.focus\\:ring-ring:focus\s*\{\s*--tw-ring-color: var\(--ring\);/)
    expect(css).toMatch(
      /@media \(width >= 48rem\)\s*\{\s*\.md\\:bg-secondary\s*\{\s*background-color: var\(--secondary\);/,
    )
  })

  test('component attribute states compile into attribute selectors', async () => {
    const candidates = [
      "data-required:after:content-['*']",
      'data-dropzone:border-dashed',
      'data-dropzone:min-h-40',
      'data-mobile:hidden',
      'data-placeholder:text-muted-foreground',
      'data-compact:px-1',
      'data-tags:ps-1',
      'data-has-text:px-3',
      'data-autoresize:resize-none',
      'data-auto-align:text-start',
      'data-danger:data-highlighted:bg-danger/15',
    ]
    const designSystem = await loadDesignSystem()
    expect(designSystem.candidatesToCss(candidates).every(Boolean)).toBe(true)
    const css = await compileCSS(candidates)
    for (const attribute of [
      'required',
      'dropzone',
      'mobile',
      'placeholder',
      'compact',
      'tags',
      'has-text',
      'autoresize',
      'auto-align',
      'danger',
      'highlighted',
    ]) {
      expect(css).toContain(`[data-${attribute}]`)
    }
  })

  test('accent channel utilities compile with state variants', async () => {
    const candidates = [
      'hover:accent-scope',
      'focus-within:accent-scope',
      'accent-fg-muted-foreground',
      'accent-fg-foreground',
      'accent-fg-primary',
      'placeholder:accent-fg-muted-foreground',
      'data-placeholder:accent-fg-muted-foreground',
    ]
    const designSystem = await loadDesignSystem()
    expect(designSystem.candidatesToCss(candidates).every(Boolean)).toBe(true)
    const css = await compileCSS(candidates)
    expect(css).toContain('--mo-accent-fg: var(--accent-foreground)')
    expect(css).toContain('color: var(--mo-accent-fg, var(--muted-foreground))')
    expect(css).toContain('color: var(--mo-accent-fg, var(--foreground))')
    expect(css).toContain('color: var(--mo-accent-fg, var(--primary))')
    expect(css).toContain('::placeholder')
    expect(css).toContain('[data-placeholder]')
  })
})

describe('iconify integration (docs config)', () => {
  test('lucide icon utilities generate SVG mask CSS', async () => {
    const css = await compileCSSWithIconify(['lucide--arrow-down'])
    expect(css).toContain('--svg: url("data:image/svg+xml,')
    expect(css).toContain("d='M12 5v14m7-7l-7 7l-7-7'")
  })

  test('the iconify base class renders currentColor through a mask', async () => {
    const css = await compileCSSWithIconify(['iconify'])
    expect(css).toContain('background-color: currentColor;')
    expect(css).toContain('mask-image: var(--svg);')
  })

  test('moraine tokens still work alongside iconify', async () => {
    const css = await compileCSSWithIconify(['bg-primary', 'rounded-lg', 'animate-mo-enter'])
    expect(css).toContain('background-color: var(--primary);')
    expect(css).toContain('border-radius: var(--radius);')
    expect(css).toContain('animation: mo-enter')
  })

  test('lucide icons are registered and produce CSS while moraine icon stubs do not', async () => {
    const ds = await loadDesignSystemWithIconify()
    const lucideClasses = ds.getClassList().filter(([name]) => name.startsWith('lucide--'))
    expect(lucideClasses.length).toBeGreaterThan(1000)

    const [arrow, check, arrowStub, checkStub] = ds.candidatesToCss([
      'lucide--arrow-down',
      'lucide--check',
      'icon-arrow-down',
      'icon-check',
    ])
    expect(arrow).toContain('--svg: url(')
    expect(check).toContain('--svg: url(')
    expect(arrowStub).toBeNull()
    expect(checkStub).toBeNull()
  })

  test('iconify icons work with variants', async () => {
    const css = await compileCSSWithIconify(['hover:lucide--arrow-down'])
    expect(css).toContain('@media (hover: hover)')
    expect(css).toContain('.hover\\:lucide--arrow-down:hover')
  })
})

async function loadDesignSystemWithIconify() {
  const css = [BASE_CSS, '@plugin "virtual:moraine";', '@plugin "virtual:iconify";'].join('\n')
  return __unstable__loadDesignSystem(css, {
    loadModule: combinedLoadModule(),
  })
}

describe('full compilation', () => {
  test('utilities from every family compile together', async () => {
    const css = await compileCSS([
      'bg-primary',
      'text-primary-foreground',
      'rounded-lg',
      'shadow-overlay',
      'animate-mo-enter',
      'border-border',
    ])
    expect(css).toContain('background-color: var(--primary);')
    expect(css).toContain('color: var(--primary-foreground);')
    expect(css).toContain('border-radius: var(--radius);')
    expect(css).toContain('border-color: var(--border);')
    expect(css).toContain('--tw-shadow: var(--shadow-overlay);')
    expect(css).toContain('animation: mo-enter')
  })
})
