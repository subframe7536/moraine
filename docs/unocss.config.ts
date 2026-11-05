import lucideIcons from '@iconify-json/lucide/icons.json' with { type: 'json' }
import type { PresetWind4Theme } from '@subf/unocss'
import { defineConfig, presetIcons, presetWind4, transformerVariantGroup } from '@subf/unocss'

import { presetMoraine } from '../src/theme/unocss.ts'

import { getDocsShikiCss } from './build/core/shiki.ts'
import { DOCS_MOBILE_QUERY } from './shared/docs-layout.ts'

const IMPORTANT_RE = /\s*!important$/

function splitCssTokens(value: string): string[] {
  const tokens: string[] = []
  let depth = 0
  let current = ''
  for (const char of value) {
    if (char === '(') {
      depth += 1
    } else if (char === ')' && depth > 0) {
      depth -= 1
    }
    if (depth === 0 && /\s/.test(char)) {
      if (current) {
        tokens.push(current)
        current = ''
      }
      continue
    }
    current += char
  }
  if (current) {
    tokens.push(current)
  }
  return tokens
}

const DYNAMIC_VH_RE = /\d+(?:\.\d+)?(?:dvh|svh|lvh|dvw|svw|lvw)/g

// presetWind4 emits declarations Chrome 86 cannot parse: standalone transform
// properties (104+), `inset`/`inset-inline` (87+), `overflow: clip` (90+), and
// d*/s*/l* viewport units (108+). Rewrite each entry into the equivalent
// legacy form or prepend a parseable fallback declaration.
function chrome86Postprocess(utility: {
  entries: [string, string | number | undefined, ...unknown[]][]
}): void {
  const entries: [string, string | number | undefined, ...unknown[]][] = []
  for (const entry of utility.entries) {
    const [property, rawValue] = entry
    if (typeof rawValue !== 'string') {
      entries.push(entry)
      continue
    }
    const important = IMPORTANT_RE.test(rawValue) ? ' !important' : ''
    const value = important ? rawValue.replace(IMPORTANT_RE, '') : rawValue
    if (property === 'translate' || property === 'rotate' || property === 'scale') {
      const tokens = splitCssTokens(value)
      const fn = property === 'translate' && tokens.length === 3 ? 'translate3d' : property
      entries.push(['transform', `${fn}(${tokens.join(', ')})${important}`])
      continue
    }
    if (property === 'inset') {
      const [t = '0', r = t, b = t, l = r] = splitCssTokens(value)
      entries.push(
        ['top', `${t}${important}`],
        ['right', `${r}${important}`],
        ['bottom', `${b}${important}`],
        ['left', `${l}${important}`],
      )
      continue
    }
    if (property === 'inset-inline') {
      entries.push(['left', `${value}${important}`], ['right', `${value}${important}`])
      continue
    }
    if (property === 'inset-block') {
      entries.push(['top', `${value}${important}`], ['bottom', `${value}${important}`])
      continue
    }
    if (property.startsWith('inset-')) {
      const physical = {
        'inset-block-start': 'top',
        'inset-block-end': 'bottom',
        'inset-inline-start': 'left',
        'inset-inline-end': 'right',
      }[property]
      if (physical) {
        entries.push([physical, `${value}${important}`])
      } else {
        entries.push(entry)
      }
      continue
    }
    if (property.startsWith('overflow') && value === 'clip') {
      entries.push([property, `hidden${important}`])
    }
    const fallback = value.replace(
      DYNAMIC_VH_RE,
      (match) => `${match.slice(0, -3)}v${match.slice(-1)}`,
    )
    if (fallback !== value) {
      entries.push([property, `${fallback}${important}`])
    }
    entries.push(entry)
  }
  utility.entries = entries
}

const markdownShortCuts = {
  'docs-h1': 'text-3xl sm:text-3xl text-foreground font-bold tracking-tight mb-3 mt-6 sm:mt-8',
  'docs-h2':
    'text-xl sm:text-2xl text-foreground font-semibold tracking-tight mb-3 sm:mb-4 mt-8 sm:mt-10 pb-2 border-b border-border/60',
  'docs-h3': 'text-lg sm:text-xl text-foreground font-semibold tracking-tight mb-2 mt-5 sm:mt-6',
  'docs-h4': 'sm:text-base text-foreground font-semibold mb-1.5 mt-4',
  'docs-h5': 'text-foreground font-semibold mb-1 mt-3',
  'docs-p': 'text-muted-foreground leading-relaxed mb-3.5',
  'docs-ul': 'list-disc list-outside pl-5 mb-3.5 text-muted-foreground space-y-1',
  'docs-ol': 'list-decimal list-outside pl-5 mb-3.5 text-muted-foreground space-y-1',
  'docs-li': 'leading-relaxed',
  'docs-a': 'text-primary underline underline-offset-3 hover:text-primary-hover transition-colors',
  'docs-blockquote':
    'my-4 rounded-xl bg-muted/40 border border-border/60 px-4 py-3 text-muted-foreground [&>p]:m-0',
  'docs-strong': 'text-foreground font-semibold',
  'docs-hr': 'border-t border-border/60 my-6',
  'docs-inline-code':
    'px-1.5 py-0.5 bg-muted border border-border rounded-sm text-foreground text-sm font-mono font-medium [h2>&]:text-lg [h2>&]:lg:text-xl',
}
export default defineConfig<PresetWind4Theme>({
  shortcuts: markdownShortCuts,
  safelist: Object.keys(markdownShortCuts),
  presets: [
    presetWind4(),
    presetIcons({
      scale: 1.2,
      collections: {
        lucide: () => lucideIcons,
      },
    }),
    presetMoraine({
      override: {
        light: {
          shadows: {
            input: '0 1px 2px 0 hsl(0 0% 0% / 0.04)',
            surface: '0 1px 3px 0 hsl(0 0% 0% / 0.05), 0 1px 2px -1px hsl(0 0% 0% / 0.05)',
            overlay: '0 3px 6px -1px hsl(0 0% 0% / 0.05), 0 2px 4px -2px hsl(0 0% 0% / 0.05)',
          },
        },
        dark: {
          shadows: {
            input: '0 1px 2px 0 hsl(0 0% 0% / 0.08)',
            surface: '0 1px 3px 0 hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10)',
            overlay: '0 3px 6px -1px hsl(0 0% 0% / 0.10), 0 2px 4px -2px hsl(0 0% 0% / 0.10)',
          },
        },
      },
    }),
  ],
  transformers: [transformerVariantGroup({ separators: [':'] })],
  postprocess: [chrome86Postprocess],
  theme: {
    font: {
      sans: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
      mono: '"Maple Mono NF CN", "Maple Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
    animation: {
      keyframes: {
        'docs-page-slide-up': '{ from { opacity: 0; transform: translateY(8px); } }',
        'docs-page-fade-in': '{ from { opacity: 0; } }',
      },
      timingFns: {
        'docs-page-slide-up': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'docs-page-fade-in': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      durations: {
        'docs-page-slide-up': '220ms',
        'docs-page-fade-in': '120ms',
      },
      counts: {
        'docs-page-slide-up': '1',
        'docs-page-fade-in': '1',
      },
    },
  },
  content: {
    filesystem: [
      '../src/**/*.{ts,tsx}',
      'routes/**/*.{ts,tsx}',
      'pages/**/*.{mdx,tsx}',
      '!../src/**/*.test.{ts,tsx}',
      '!routes/**/*.test.tsx',
    ],
    // The filesystem scan uses this filter too; UnoCSS's default omits .ts recipe and class files.
    pipeline: {
      include: [/\.(?:ts|tsx|mdx)(?:\?|$)/],
    },
  },
  preflights: [
    {
      getCSS: () => getDocsShikiCss(),
    },
    {
      getCSS: () => `
html,
body {
  overflow-x: hidden;
  overflow-x: clip;
}

/* The server renders the desktop rail before Sidebar resolves the viewport. */
@media ${DOCS_MOBILE_QUERY} {
  [data-docs-sidebar]:not([data-mobile]) {
    display: none;
  }
}

::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 180ms;
}
      `,
    },
  ],
})
