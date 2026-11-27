import lucideIcons from '@iconify-json/lucide/icons.json' with { type: 'json' }
import { defineConfig, presetIcons, presetWind4, transformerVariantGroup } from '@subf/unocss'
import type { PresetWind4Theme } from '@subf/unocss'

import { presetMoraine } from '../src/theme/unocss.ts'

import { getDocsShikiCss } from './build/core/shiki.ts'
import { DOCS_MOBILE_QUERY } from './shared/docs-layout.ts'
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
    'px-1.5 py-0.5 bg-muted border border-border rounded-sm text-foreground text-sm font-mono font-medium wrap-anywhere [h2>&]:text-lg [h2>&]:lg:text-xl',
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
  overflow: hidden;
  overscroll-behavior: none;
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

.shiki {
  color: var(--shiki-light);
  background-color: transparent !important;
}

.shiki span {
  color: var(--shiki-light);
  font-style: var(--shiki-light-font-style, inherit);
  font-weight: var(--shiki-light-font-weight, inherit);
  text-decoration: var(--shiki-light-text-decoration, inherit);
}

.dark .shiki {
  color: var(--shiki-dark);
  background-color: transparent !important;
}

.dark .shiki span {
  color: var(--shiki-dark);
  font-style: var(--shiki-dark-font-style, inherit);
  font-weight: var(--shiki-dark-font-weight, inherit);
  text-decoration: var(--shiki-dark-text-decoration, inherit);
}

.shiki code {
  display: grid;
  min-width: 100%;
}

.shiki .line {
  position: relative;
}

.shiki .line:empty {
  min-height: 1.625em;
}

.shiki .line.highlighted {
  position: relative;
  isolation: isolate;
}

.shiki .line.highlighted::after {
  content: '';
  position: absolute;
  inset-block: 0;
  inset-inline: -1rem;
  background-color: var(--muted);
  background-color: color-mix(in srgb, var(--primary) 12%, transparent);
  border-inline-start: 2px solid var(--primary);
  pointer-events: none;
  z-index: -1;
}

.shiki.line-numbers code {
  counter-reset: line;
}

.shiki.line-numbers .line::before {
  counter-increment: line;
  content: counter(line);
  display: inline-block;
  width: 1.5rem;
  margin-inline-end: 1.25rem;
  text-align: right;
  color: var(--muted-foreground);
  opacity: 0.5;
  user-select: none;
}

      `,
    },
  ],
})
