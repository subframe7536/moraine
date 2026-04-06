import lucideIcons from '@iconify-json/lucide/icons.json' with { type: 'json' }
import type { PresetWind4Theme } from 'unocss'
import { defineConfig, presetIcons, presetWind4, transformerVariantGroup } from 'unocss'

import { presetMoraine } from '../src/unocss/theme'

const transformer = transformerVariantGroup()
const markdownShortCuts = {
  'docs-h1': 'text-2xl sm:text-3xl text-foreground font-bold mb-3 mt-5 sm:mt-8',
  'docs-h2': 'text-xl sm:text-2xl text-foreground font-semibold mb-3 sm:mb-4 mt-5 sm:mt-8',
  'docs-h3': 'text-lg sm:text-xl text-foreground font-semibold mb-2 mt-3 sm:mt-4',
  'docs-h4': 'text-sm sm:text-base text-foreground font-semibold mb-1.5 mt-3',
  'docs-h5': 'text-sm text-foreground font-semibold mb-1 mt-3',
  'docs-p': 'text-muted-foreground leading-6 mb-3',
  'docs-ul': 'list-disc list-outside pl-5 mb-3 text-muted-foreground',
  'docs-ol': 'list-decimal list-outside pl-5 mb-3 text-muted-foreground',
  'docs-li': 'leading-6',
  'docs-a': 'text-primary underline underline-offset-2 hover:text-primary/80',
  'docs-blockquote': 'pl-4 border-l-2 border-border text-muted-foreground italic my-4',
  'docs-strong': 'text-foreground font-semibold',
  'docs-hr': 'border-t border-border my-6',
  'docs-inline-code':
    'mx-[0.1rem] px-[0.25rem] py-0 bg-muted border border-border rounded-[0.4em] text-sm font-mono [h2>&]:text-xl [h2>&]:lg:text-2xl',
  'docs-pre': 'b-1 b-border rounded-xl bg-muted overflow-x-auto text-xs my-4',
  'docs-code-block': 'b-1 b-border rounded-xl overflow-hidden my-4',
  'docs-code-block-inner': 'text-xs leading-relaxed overflow-x-auto font-mono',
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
      enableComponentLayer: {
        strategy: 'prefix',
        idFilter(id: string) {
          return id.includes('/src/') && (id.endsWith('.class.ts') || id.endsWith('.tsx'))
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
  },
  content: {
    pipeline: {
      include: [
        './**/*.tsx',
        './**/*.md',
        './**/*.class.ts',
        '../src/**/*.tsx',
        '../src/**/*.class.ts',
        'node_modules/**/*.*',
      ],
    },
  },
  preflights: [
    {
      getCSS: () => `
:root {
  --background: hsl(0 0% 100%);
  --foreground: hsl(222.2 84% 4.9%);
  --card: hsl(220 4% 99%);
  --card-foreground: hsl(222.2 84% 4.9%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(222.2 84% 4.9%);
  --primary: hsl(221.2 63.2% 58.3%);
  --primary-foreground: hsl(210 40% 98%);
  --secondary: hsl(221.2 40% 90.1%);
  --secondary-foreground: hsl(222.2 47.4% 11.2%);
  --muted: hsl(210 40% 96.1%);
  --muted-foreground: hsl(215.4 16.3% 46.9%);
  --accent: hsl(210 40% 88.1%);
  --accent-foreground: hsl(222.2 47.4% 11.2%);
  --destructive: hsl(351.74 100% 40.54%);
  --destructive-foreground: hsl(359.81 59.23% 96.94%);
  --border: hsl(214.3 31.8% 91.4%);
  --input: hsl(214.3 31.8% 91.4%);
  --ring: hsl(221.2 43.2% 58.3%);
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
  --shadow-2xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-sm: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow-md: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 2px 4px -1px hsl(0 0% 0% / 0.10);
  --shadow-lg: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 4px 6px -1px hsl(0 0% 0% / 0.10);
  --shadow-xl: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 8px 10px -1px hsl(0 0% 0% / 0.10);
  --shadow-2xl: 0 1px 3px 0px hsl(0 0% 0% / 0.25);
  --tracking-normal: -0.015em;
  --spacing: 0.25rem;
}

.dark {
  --background: hsl(222.2 84% 4.9%);
  --foreground: hsl(210 40% 98%);
  --card: hsl(222.2 84% 4.9%);
  --card-foreground: hsl(210 40% 98%);
  --popover: hsl(222.2 84% 4.9%);
  --popover-foreground: hsl(210 40% 98%);
  --primary: hsl(217.2 71.2% 45.8%);
  --primary-foreground: hsl(222.2 47.4% 96.2%);
  --secondary: hsl(217.2 46.6% 17.5%);
  --secondary-foreground: hsl(210 40% 90%);
  --muted: hsl(217.2 32.6% 17.5%);
  --muted-foreground: hsl(215 20.2% 65.1%);
  --accent: hsl(217.2 32.6% 32.5%);
  --accent-foreground: hsl(210 40% 98%);
  --destructive: hsl(358.77 100% 69.84%);
  --destructive-foreground: hsl(358.88 74.66% 50.36%);
  --border: hsl(217.2 32.6% 24.5%);
  --input: hsl(217.2 32.6% 17.5%);
  --ring: hsl(224.3 76.3% 58%);
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
  --shadow-2xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-sm: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow-md: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 2px 4px -1px hsl(0 0% 0% / 0.10);
  --shadow-lg: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 4px 6px -1px hsl(0 0% 0% / 0.10);
  --shadow-xl: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 8px 10px -1px hsl(0 0% 0% / 0.10);
  --shadow-2xl: 0 1px 3px 0px hsl(0 0% 0% / 0.25);
}
      `,
    },
  ],
})
