import lucideIcons from '@iconify-json/lucide/icons.json' with { type: 'json' }
import type { PresetWind4Theme } from '@subf/unocss'
import { defineConfig, presetIcons, presetWind4, transformerVariantGroup } from '@subf/unocss'

import { presetMoraine } from '../src/unocss/theme.ts'

const transformer = transformerVariantGroup()
const docsShortCuts = {
  // Shared docs geometry. Use these names in docs routes instead of reintroducing measurements.
  'docs-shell-header': 'h-13',
  'docs-anchor-offset': 'scroll-mt-13',
  'docs-content-gutter': 'px-5 sm:px-8',
  'docs-article-measure': 'max-w-4xl',
  'docs-navigation-width': 'w-64',
  'docs-toc-width': 'w-60',
  'docs-focus-visible':
    'focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)',
  'docs-compact-control': 'h-8',
  'docs-content-enter': 'animate-docs-page-slide-up motion-reduce:animate-docs-page-fade-in',
}

const markdownShortCuts = {
  'docs-h1': 'text-3xl text-foreground font-bold mb-3 mt-6 sm:mt-10',
  'docs-h2':
    'text-xl sm:text-2xl text-foreground font-semibold mb-3 sm:mb-4 mt-8 sm:mt-11 pb-2 border-b border-border/80',
  'docs-h3': 'text-lg sm:text-xl text-foreground font-semibold mb-2 mt-5 sm:mt-7',
  'docs-h4': 'text-sm sm:text-base text-foreground font-semibold mb-1.5 mt-4',
  'docs-h5': 'text-sm text-foreground font-semibold mb-1 mt-3',
  'docs-p': 'text-muted-foreground leading-6 mb-3',
  'docs-ul': 'list-disc list-outside pl-5 mb-3 text-muted-foreground',
  'docs-ol': 'list-decimal list-outside pl-5 mb-3 text-muted-foreground',
  'docs-li': 'leading-6',
  'docs-a': 'text-primary underline underline-offset-2 hover:text-primary/80',
  'docs-blockquote':
    'my-4 rounded-md bg-secondary/60 b-1 b-input px-4 py-3 text-secondary-foreground [&>p]:m-0',
  'docs-strong': 'text-foreground font-semibold',
  'docs-hr': 'border-t border-border my-6',
  'docs-inline-code':
    'mx-[0.1rem] px-[0.3rem] py-0 bg-muted/70 border-2 border-border rounded-md text-sm text-destructive font-mono [h2>&]:text-xl [h2>&]:lg:text-2xl',
}
export default defineConfig<PresetWind4Theme>({
  shortcuts: { ...docsShortCuts, ...markdownShortCuts },
  safelist: [...Object.keys(docsShortCuts), ...Object.keys(markdownShortCuts)],
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
            hover: 'hsl(210 40% 98%)',
            active: 'hsl(210 40% 96.1%)',
          },
          foreground: 'hsl(222.2 84% 4.9%)',
          card: {
            DEFAULT: 'hsl(220 4% 99%)',
            foreground: 'hsl(222.2 84% 4.9%)',
            hover: 'hsl(220 4% 97%)',
            active: 'hsl(220 4% 95%)',
          },
          popover: {
            DEFAULT: 'hsl(0 0% 100%)',
            foreground: 'hsl(222.2 84% 4.9%)',
            hover: 'hsl(210 40% 98%)',
            active: 'hsl(210 40% 96.1%)',
          },
          primary: {
            DEFAULT: 'hsl(221.2 63.2% 58.3%)',
            foreground: 'hsl(210 40% 98%)',
            hover: 'hsl(221.2 63.2% 53.3%)',
            active: 'hsl(221.2 63.2% 48.3%)',
          },
          secondary: {
            DEFAULT: 'hsl(221.2 40% 90.1%)',
            foreground: 'hsl(222.2 47.4% 11.2%)',
            hover: 'hsl(221.2 40% 86.1%)',
            active: 'hsl(221.2 40% 82.1%)',
          },
          muted: {
            DEFAULT: 'hsl(210 40% 96.1%)',
            foreground: 'hsl(215.4 16.3% 46.9%)',
            hover: 'hsl(210 40% 92.1%)',
            active: 'hsl(210 40% 88.1%)',
          },
          accent: {
            DEFAULT: 'hsl(210 40% 88.1%)',
            foreground: 'hsl(222.2 47.4% 11.2%)',
            hover: 'hsl(210 40% 83.1%)',
            active: 'hsl(210 40% 78.1%)',
          },
          destructive: {
            DEFAULT: 'hsl(351.74 100% 40.54%)',
            foreground: 'hsl(359.81 59.23% 96.94%)',
            hover: 'hsl(351.74 100% 35.54%)',
            active: 'hsl(351.74 100% 30.54%)',
          },
          border: 'hsl(214.3 31.8% 91.4%)',
          input: 'hsl(214.3 31.8% 91.4%)',
          ring: 'hsl(221.2 43.2% 58.3%)',
        },
        dark: {
          background: {
            DEFAULT: 'hsl(222.2 84% 4.9%)',
            hover: 'hsl(222.2 70% 8.9%)',
            active: 'hsl(222.2 60% 12.9%)',
          },
          foreground: 'hsl(210 40% 98%)',
          card: {
            DEFAULT: 'hsl(222.2 84% 4.9%)',
            foreground: 'hsl(210 40% 98%)',
            hover: 'hsl(222.2 70% 8.9%)',
            active: 'hsl(222.2 60% 12.9%)',
          },
          popover: {
            DEFAULT: 'hsl(222.2 84% 4.9%)',
            foreground: 'hsl(210 40% 98%)',
            hover: 'hsl(222.2 70% 8.9%)',
            active: 'hsl(222.2 60% 12.9%)',
          },
          primary: {
            DEFAULT: 'hsl(217.2 51.2% 55.8%)',
            foreground: 'hsl(222.2 47.4% 96.2%)',
            hover: 'hsl(217.2 51.2% 60.8%)',
            active: 'hsl(217.2 51.2% 65.8%)',
          },
          secondary: {
            DEFAULT: 'hsl(217.2 46.6% 17.5%)',
            foreground: 'hsl(210 40% 90%)',
            hover: 'hsl(217.2 46.6% 22.5%)',
            active: 'hsl(217.2 46.6% 27.5%)',
          },
          muted: {
            DEFAULT: 'hsl(217.2 32.6% 17.5%)',
            foreground: 'hsl(215 20.2% 65.1%)',
            hover: 'hsl(217.2 32.6% 22.5%)',
            active: 'hsl(217.2 32.6% 27.5%)',
          },
          accent: {
            DEFAULT: 'hsl(217.2 32.6% 32.5%)',
            foreground: 'hsl(210 40% 98%)',
            hover: 'hsl(217.2 32.6% 37.5%)',
            active: 'hsl(217.2 32.6% 42.5%)',
          },
          destructive: {
            DEFAULT: 'hsl(358.77 100% 69.84%)',
            foreground: 'hsl(0 0% 100%)',
            hover: 'hsl(358.77 100% 74.84%)',
            active: 'hsl(358.77 100% 79.84%)',
          },
          border: 'hsl(217.2 32.6% 24.5%)',
          input: 'hsl(217.2 32.6% 20.5%)',
          ring: 'hsl(224.3 76.3% 58%)',
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
          transformer.transform(code, id, ctx)
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
  --sidebar: hsl(210 40% 98%);
  --sidebar-foreground: hsl(222.2 47.4% 11.2%);
  --sidebar-primary: hsl(221.2 83.2% 53.3%);
  --sidebar-primary-foreground: hsl(0 0% 100%);
  --sidebar-accent: hsl(214.3 31.8% 91.4%);
  --sidebar-accent-foreground: hsl(221.2 83.2% 53.3%);
  --sidebar-border: hsl(214.3 31.8% 91.4%);
  --sidebar-ring: hsl(221.2 83.2% 53.3%);
  --radius: 0.5rem;
  --shadow-x: 0;
  --shadow-y: 1px;
  --shadow-blur: 3px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.1;
  --shadow-color: oklch(0 0 0);
  --shadow-2xs: 0 1px 2px 0 hsl(0 0% 0% / 0.05);
  --shadow-xs: 0 1px 2px 0 hsl(0 0% 0% / 0.05);
  --shadow-sm: 0 1px 3px 0 hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow: 0 1px 3px 0 hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow-md: 0 4px 6px -1px hsl(0 0% 0% / 0.10), 0 2px 4px -2px hsl(0 0% 0% / 0.10);
  --shadow-lg: 0 10px 15px -3px hsl(0 0% 0% / 0.10), 0 4px 6px -4px hsl(0 0% 0% / 0.10);
  --shadow-xl: 0 20px 25px -5px hsl(0 0% 0% / 0.10), 0 8px 10px -6px hsl(0 0% 0% / 0.10);
  --shadow-2xl: 0 25px 50px -12px hsl(0 0% 0% / 0.25);
  --tracking-normal: -0.015em;
  --spacing: 0.25rem;
}

.dark {
  --chart-1: hsl(224.3 76.3% 48%);
  --chart-2: hsl(221 83% 53%);
  --chart-3: hsl(199 89% 48%);
  --chart-4: hsl(215 25% 27%);
  --chart-5: hsl(224 71% 45%);
  --sidebar: hsl(222.2 84% 4.9%);
  --sidebar-foreground: hsl(210 40% 98%);
  --sidebar-primary: hsl(217.2 91.2% 59.8%);
  --sidebar-primary-foreground: hsl(222.2 84% 4.9%);
  --sidebar-accent: hsl(217.2 32.6% 17.5%);
  --sidebar-accent-foreground: hsl(210 40% 98%);
  --sidebar-border: hsl(217.2 32.6% 17.5%);
  --sidebar-ring: hsl(224.3 76.3% 48%);
  --shadow-x: 0;
  --shadow-y: 1px;
  --shadow-blur: 3px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.1;
  --shadow-color: oklch(0 0 0);
  --shadow-2xs: 0 1px 2px 0 hsl(0 0% 0% / 0.15);
  --shadow-xs: 0 1px 2px 0 hsl(0 0% 0% / 0.15);
  --shadow-sm: 0 1px 3px 0 hsl(0 0% 0% / 0.20), 0 1px 2px -1px hsl(0 0% 0% / 0.20);
  --shadow: 0 1px 3px 0 hsl(0 0% 0% / 0.20), 0 1px 2px -1px hsl(0 0% 0% / 0.20);
  --shadow-md: 0 4px 6px -1px hsl(0 0% 0% / 0.20), 0 2px 4px -2px hsl(0 0% 0% / 0.20);
  --shadow-lg: 0 10px 15px -3px hsl(0 0% 0% / 0.20), 0 4px 6px -4px hsl(0 0% 0% / 0.20);
  --shadow-xl: 0 20px 25px -5px hsl(0 0% 0% / 0.20), 0 8px 10px -6px hsl(0 0% 0% / 0.20);
  --shadow-2xl: 0 25px 50px -12px hsl(0 0% 0% / 0.40);
}
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 180ms;
}

      `,
    },
  ],
})
