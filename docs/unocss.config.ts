import lucideIcons from '@iconify-json/lucide/icons.json' with { type: 'json' }
import type { PresetWind4Theme } from '@subf/unocss'
import { defineConfig, presetIcons, presetWind4, transformerVariantGroup } from '@subf/unocss'

import { presetMoraine } from '../src/unocss/theme'

const transformer = transformerVariantGroup()

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
    'mx-1 px-1.5 py-0.5 bg-muted border-2 border-border rounded-sm text-foreground text-sm font-mono font-medium [h2>&]:text-lg [h2>&]:lg:text-xl',
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
      colorVariables: {
        light: {
          background: {
            DEFAULT: 'hsl(0 0% 100%)',
            hover: 'hsl(220 14% 98%)',
            active: 'hsl(220 14% 96%)',
          },
          foreground: 'hsl(224 71.4% 4.1%)',
          card: {
            DEFAULT: 'hsl(220 14% 99%)',
            foreground: 'hsl(224 71.4% 4.1%)',
            hover: 'hsl(220 14% 97%)',
            active: 'hsl(220 14% 95%)',
          },
          popover: {
            DEFAULT: 'hsl(0 0% 100%)',
            foreground: 'hsl(224 71.4% 4.1%)',
            hover: 'hsl(220 14% 98%)',
            active: 'hsl(220 14% 96%)',
          },
          primary: {
            DEFAULT: 'hsl(221.2 83.2% 53.3%)',
            foreground: 'hsl(210 40% 98%)',
            hover: 'hsl(221.2 83.2% 48.3%)',
            active: 'hsl(221.2 83.2% 43.3%)',
          },
          secondary: {
            DEFAULT: 'hsl(220 14.3% 95.9%)',
            foreground: 'hsl(220.9 39.3% 11%)',
            hover: 'hsl(220 14.3% 92%)',
            active: 'hsl(220 14.3% 88%)',
          },
          muted: {
            DEFAULT: 'hsl(220 14.3% 95.9%)',
            foreground: 'hsl(220 8.9% 46.1%)',
            hover: 'hsl(220 14.3% 92%)',
            active: 'hsl(220 14.3% 88%)',
          },
          accent: {
            DEFAULT: 'hsl(220 14.3% 95.9%)',
            foreground: 'hsl(220.9 39.3% 11%)',
            hover: 'hsl(220 14.3% 91%)',
            active: 'hsl(220 14.3% 86%)',
          },
          destructive: {
            DEFAULT: 'hsl(0 84.2% 60.2%)',
            foreground: 'hsl(210 40% 98%)',
            hover: 'hsl(0 84.2% 55.2%)',
            active: 'hsl(0 84.2% 50.2%)',
          },
          border: 'hsl(220 13% 91%)',
          input: 'hsl(220 13% 91%)',
          ring: 'hsl(221.2 83.2% 53.3%)',
        },
        dark: {
          background: {
            DEFAULT: 'hsl(224 71.4% 4.1%)',
            hover: 'hsl(224 50% 7%)',
            active: 'hsl(224 50% 10%)',
          },
          foreground: 'hsl(210 20% 98%)',
          card: {
            DEFAULT: 'hsl(224 71.4% 4.1%)',
            foreground: 'hsl(210 20% 98%)',
            hover: 'hsl(224 50% 7%)',
            active: 'hsl(224 50% 10%)',
          },
          popover: {
            DEFAULT: 'hsl(224 71.4% 4.1%)',
            foreground: 'hsl(210 20% 98%)',
            hover: 'hsl(224 50% 7%)',
            active: 'hsl(224 50% 10%)',
          },
          primary: {
            DEFAULT: 'hsl(217.2 91.2% 59.8%)',
            foreground: 'hsl(222.2 47.4% 11.2%)',
            hover: 'hsl(217.2 91.2% 64.8%)',
            active: 'hsl(217.2 91.2% 69.8%)',
          },
          secondary: {
            DEFAULT: 'hsl(215 27.9% 16.9%)',
            foreground: 'hsl(210 20% 98%)',
            hover: 'hsl(215 27.9% 21.9%)',
            active: 'hsl(215 27.9% 26.9%)',
          },
          muted: {
            DEFAULT: 'hsl(215 27.9% 16.9%)',
            foreground: 'hsl(217.9 10.6% 64.9%)',
            hover: 'hsl(215 27.9% 21.9%)',
            active: 'hsl(215 27.9% 26.9%)',
          },
          accent: {
            DEFAULT: 'hsl(215 27.9% 16.9%)',
            foreground: 'hsl(210 20% 98%)',
            hover: 'hsl(215 27.9% 22%)',
            active: 'hsl(215 27.9% 27%)',
          },
          destructive: {
            DEFAULT: 'hsl(0 62.8% 30.6%)',
            foreground: 'hsl(210 20% 98%)',
            hover: 'hsl(0 62.8% 35.6%)',
            active: 'hsl(0 62.8% 40.6%)',
          },
          border: 'hsl(215 27.9% 18.9%)',
          input: 'hsl(215 27.9% 24.9%)',
          ring: 'hsl(217.2 91.2% 59.8%)',
        },
      },
      globalStyles: true,
      enableComponentLayer: {
        strategy: 'prefix',
        idFilter(id: string) {
          // Match both source files and built library (for CF Pages compatibility)
          return (
            (id.includes('/src/') ||
              id.includes('/dist/') ||
              id.includes('node_modules/moraine')) &&
            (id.endsWith('.class.ts') || id.endsWith('.tsx') || id.endsWith('.jsx'))
          )
        },
        beforeTransform(code, id, ctx) {
          void transformer.transform(code, id, ctx)
        },
      },
    }),
  ],
  theme: {
    font: {
      sans: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
      mono: 'Maple Mono NF CN, Maple Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
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
    pipeline: {
      include: [/\.(?:[jt]sx|mdx?|class\.ts)(?:\?.*)?$/],
    },
  },
  preflights: [
    {
      getCSS: () => `
:root {
  --chart-1: hsl(221.2 83.2% 53.3%);
  --chart-2: hsl(212 95% 68%);
  --chart-3: hsl(216 92% 60%);
  --chart-4: hsl(210 98% 78%);
  --chart-5: hsl(212 97% 87%);
  --sidebar: hsl(220 14% 99%);
  --sidebar-foreground: hsl(220.9 39.3% 11%);
  --sidebar-primary: hsl(221.2 83.2% 53.3%);
  --sidebar-primary-foreground: hsl(0 0% 100%);
  --sidebar-accent: hsl(220 14.3% 95.9%);
  --sidebar-accent-foreground: hsl(220.9 39.3% 11%);
  --sidebar-border: hsl(220 13% 91%);
  --sidebar-ring: hsl(221.2 83.2% 53.3%);
  --radius: 0.625rem;
  --shadow-x: 0;
  --shadow-y: 1px;
  --shadow-blur: 2px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.04;
  --shadow-color: oklch(0 0 0);
  --shadow-2xs: 0 1px 2px 0 hsl(0 0% 0% / 0.03);
  --shadow-xs: 0 1px 2px 0 hsl(0 0% 0% / 0.04);
  --shadow-sm: 0 1px 3px 0 hsl(0 0% 0% / 0.05), 0 1px 2px -1px hsl(0 0% 0% / 0.05);
  --shadow: 0 1px 3px 0 hsl(0 0% 0% / 0.05), 0 1px 2px -1px hsl(0 0% 0% / 0.05);
  --shadow-md: 0 3px 6px -1px hsl(0 0% 0% / 0.05), 0 2px 4px -2px hsl(0 0% 0% / 0.05);
  --shadow-lg: 0 6px 12px -2px hsl(0 0% 0% / 0.06), 0 3px 6px -3px hsl(0 0% 0% / 0.06);
  --shadow-xl: 0 10px 20px -3px hsl(0 0% 0% / 0.07), 0 4px 8px -4px hsl(0 0% 0% / 0.07);
  --shadow-2xl: 0 16px 32px -8px hsl(0 0% 0% / 0.12);
  --tracking-normal: -0.012em;
  --spacing: 0.25rem;
}

.dark {
  --chart-1: hsl(224.3 76.3% 48%);
  --chart-2: hsl(221 83% 53%);
  --chart-3: hsl(199 89% 48%);
  --chart-4: hsl(215 25% 27%);
  --chart-5: hsl(224 71% 45%);
  --sidebar: hsl(224 71.4% 4.1%);
  --sidebar-foreground: hsl(210 20% 98%);
  --sidebar-primary: hsl(217.2 91.2% 59.8%);
  --sidebar-primary-foreground: hsl(222.2 47.4% 11.2%);
  --sidebar-accent: hsl(215 27.9% 16.9%);
  --sidebar-accent-foreground: hsl(210 20% 98%);
  --sidebar-border: hsl(215 27.9% 16.9%);
  --sidebar-ring: hsl(217.2 91.2% 59.8%);
  --shadow-x: 0;
  --shadow-y: 1px;
  --shadow-blur: 2px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.08;
  --shadow-color: oklch(0 0 0);
  --shadow-2xs: 0 1px 2px 0 hsl(0 0% 0% / 0.08);
  --shadow-xs: 0 1px 2px 0 hsl(0 0% 0% / 0.08);
  --shadow-sm: 0 1px 3px 0 hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow: 0 1px 3px 0 hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow-md: 0 3px 6px -1px hsl(0 0% 0% / 0.10), 0 2px 4px -2px hsl(0 0% 0% / 0.10);
  --shadow-lg: 0 6px 12px -2px hsl(0 0% 0% / 0.12), 0 3px 6px -3px hsl(0 0% 0% / 0.12);
  --shadow-xl: 0 10px 20px -3px hsl(0 0% 0% / 0.14), 0 4px 8px -4px hsl(0 0% 0% / 0.14);
  --shadow-2xl: 0 16px 32px -8px hsl(0 0% 0% / 0.20);
}
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 180ms;
}

      `,
    },
  ],
})
