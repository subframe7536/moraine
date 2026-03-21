import lucideIcons from '@iconify-json/lucide/icons.json' with { type: 'json' }
import type { PresetWind4Theme } from 'unocss'
import { defineConfig, presetIcons, presetWind4, transformerVariantGroup } from 'unocss'
import { presetAnimations } from 'unocss-preset-animations'

import { presetTheme } from '../src/unocss-preset-theme'

const transformer = transformerVariantGroup()
export default defineConfig<PresetWind4Theme>({
  presets: [
    presetWind4(),
    presetIcons({
      scale: 1.2,
      collections: {
        lucide: () => lucideIcons,
      },
    }),
    presetAnimations() as any,
    presetTheme({
      enableComponentLayer: {
        idFilter(id: string) {
          return id.includes('/src/') && (id.endsWith('.class.ts') || id.endsWith('.tsx'))
        },
        beforeTransform(code, id, ctx) {
          transformer.transform(code, id, ctx)
        },
      },
    }),
  ],
  content: {
    pipeline: {
      include: [
        './**/*.tsx',
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
  --destructive: hsl(0 84.2% 60.2%);
  --destructive-foreground: hsl(210 40% 98%);
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
  --font-sans: Inter, system-ui, sans-serif;
  --font-serif: Georgia, serif;
  --font-mono: Maple Mono NF CN, Maple Mono, monospace;
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
  --primary: hsl(217.2 71.2% 39.8%);
  --primary-foreground: hsl(222.2 47.4% 96.2%);
  --secondary: hsl(217.2 46.6% 17.5%);
  --secondary-foreground: hsl(210 40% 90%);
  --muted: hsl(217.2 32.6% 17.5%);
  --muted-foreground: hsl(215 20.2% 65.1%);
  --accent: hsl(217.2 32.6% 32.5%);
  --accent-foreground: hsl(210 40% 98%);
  --destructive: hsl(0 62.8% 30.6%);
  --destructive-foreground: hsl(210 40% 98%);
  --border: hsl(217.2 32.6% 17.5%);
  --input: hsl(217.2 32.6% 17.5%);
  --ring: hsl(224.3 76.3% 48%);
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
