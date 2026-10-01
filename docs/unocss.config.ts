import lucideIcons from '@iconify-json/lucide/icons.json' with { type: 'json' }
import type { PresetWind4Theme } from '@subf/unocss'
import { defineConfig, presetIcons, presetWind4, transformerVariantGroup } from '@subf/unocss'

import { presetMoraine } from '../src/theme/unocss.ts'

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
      fonts: {
        sans: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
        mono: 'Maple Mono NF CN, Maple Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      },
      override: {
        light: {
          shadows: {
            '2xs': '0 1px 2px 0 hsl(0 0% 0% / 0.03)',
            xs: '0 1px 2px 0 hsl(0 0% 0% / 0.04)',
            sm: '0 1px 3px 0 hsl(0 0% 0% / 0.05), 0 1px 2px -1px hsl(0 0% 0% / 0.05)',
            base: '0 1px 3px 0 hsl(0 0% 0% / 0.05), 0 1px 2px -1px hsl(0 0% 0% / 0.05)',
            md: '0 3px 6px -1px hsl(0 0% 0% / 0.05), 0 2px 4px -2px hsl(0 0% 0% / 0.05)',
            lg: '0 6px 12px -2px hsl(0 0% 0% / 0.06), 0 3px 6px -3px hsl(0 0% 0% / 0.06)',
            xl: '0 10px 20px -3px hsl(0 0% 0% / 0.07), 0 4px 8px -4px hsl(0 0% 0% / 0.07)',
            '2xl': '0 16px 32px -8px hsl(0 0% 0% / 0.12)',
          },
        },
        dark: {
          shadows: {
            '2xs': '0 1px 2px 0 hsl(0 0% 0% / 0.08)',
            xs: '0 1px 2px 0 hsl(0 0% 0% / 0.08)',
            sm: '0 1px 3px 0 hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10)',
            base: '0 1px 3px 0 hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10)',
            md: '0 3px 6px -1px hsl(0 0% 0% / 0.10), 0 2px 4px -2px hsl(0 0% 0% / 0.10)',
            lg: '0 6px 12px -2px hsl(0 0% 0% / 0.12), 0 3px 6px -3px hsl(0 0% 0% / 0.12)',
            xl: '0 10px 20px -3px hsl(0 0% 0% / 0.14), 0 4px 8px -4px hsl(0 0% 0% / 0.14)',
            '2xl': '0 16px 32px -8px hsl(0 0% 0% / 0.20)',
          },
        },
      },
    }),
  ],
  transformers: [transformerVariantGroup()],
  theme: {
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
      getCSS: () => `
/* The server renders the desktop rail before SidebarFrame resolves the viewport. */
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
