import lucideIcons from '@iconify-json/lucide/icons.json' with { type: 'json' }
import { presetIcons, presetWind3, presetWind4, transformerVariantGroup } from '@subf/unocss'
import type { UnoCSSPluginOptions } from 'rolldown-plugin-unocss'
import { unocss } from 'rolldown-plugin-unocss'
import { defineConfig } from 'tsdown'
import solid from 'vite-plugin-solid'

import { DEFAULT_ICON_SHORTCUTS, presetMoraine } from './src/unocss'
import { createMigrateSyntaxTransformer } from './src/unocss/migrate-syntax'
function hasShortcutSuffix(token: string, shortcuts: Iterable<string>): boolean {
  for (const shortcut of shortcuts) {
    if (token.endsWith(shortcut)) {
      return true
    }
  }
  return false
}

const baseUnocssConfig = (wind3: boolean): UnoCSSPluginOptions => {
  const theme = presetMoraine()
  return {
    filter: { id: ['src/**/*.tsx', 'src/**/*.ts'] },
    config: {
      configFile: false,
      presets: [
        wind3 ? presetWind3() : presetWind4({ preflights: { reset: false } }),
        presetIcons({
          scale: 1.2,
          collections: {
            lucide: () => lucideIcons,
          },
        }),
        theme,
      ],
      preflights: wind3
        ? [
            {
              getCSS: () => `:root { --spacing: 0.25rem }`,
            },
          ]
        : undefined,
      transformers: [transformerVariantGroup(), createMigrateSyntaxTransformer()],
      extractors: [
        {
          name: 'simplify',
          extract(ctx) {
            const shortcuts = new Set<string>((theme.shortcuts as any[]).map((s) => s[0]))
            Array.from(ctx.extracted.keys())
              .filter((e) => {
                // Keep var-* tokens
                if (e.startsWith('var-')) {
                  return false
                }
                // Keep animate-* and keyframes-* tokens for presetTheme animations
                if (e.includes('animate-') || e.includes('keyframes-')) {
                  return false
                }
                // Keep shortcuts without icon
                if (hasShortcutSuffix(e, shortcuts) && !e.startsWith('icon-')) {
                  return false
                }
                // Delete everything else
                return true
              })
              .forEach((s) => ctx.extracted.delete(s))
          },
        },
      ],
    },
  }
}

// export both js and jsx
export default defineConfig([
  {
    entry: {
      index: './src/index.ts',
      unocss: './src/unocss/index.ts',
      tailwind: './src/tailwind/index.ts',
    },
    // use the solid plugin to handle jsx
    plugins: [
      unocss({
        generateCSS: true,
        fileName: 'tw3.css',
        ...baseUnocssConfig(true),
      }),
      solid(),
    ],
    deps: {
      neverBundle: ['@unocss/core', '@unocss/transformer-compile-class', 'tailwindcss'],
    },
    dts: {
      parallel: true,
    },
  },
  {
    entry: ['./src/index.ts'],
    platform: 'neutral',
    plugins: [
      unocss({
        generateCSS: true,
        fileName: 'tw4.css',
        ...baseUnocssConfig(false),
      }),
      unocss({
        generateCSS: true,
        fileName: 'icon.css',
        filter: { id: /^$/ },
        config: {
          configFile: false,
          presets: [
            presetIcons({
              scale: 1.2,
              collections: {
                lucide: () => lucideIcons,
              },
            }),
          ],
          shortcuts: DEFAULT_ICON_SHORTCUTS,
          safelist: DEFAULT_ICON_SHORTCUTS.map(([name]) => name),
        },
      }),
    ],
    exports: {
      customExports(exports) {
        for (const [key, val] of Object.entries(exports)) {
          if (val.endsWith('.jsx')) {
            exports[key] = {
              solid: val,
              default: val.replace('.jsx', '.mjs'),
              type: val.replace('.jsx', '.d.mts'),
            }
          }
        }
        exports['./tw3.css'] = './dist/tw3.css'
        exports['./tw4.css'] = './dist/tw4.css'
        exports['./icon.css'] = './dist/icon.css'
        exports['./unocss'] = './dist/unocss.mjs'
        exports['./tailwind'] = './dist/tailwind.mjs'
        return exports
      },
    },
    outExtensions: () => ({ js: '.jsx' }),
    dts: false,
  },
])
