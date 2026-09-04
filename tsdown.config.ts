import lucideIcons from '@iconify-json/lucide/icons.json' with { type: 'json' }
import { presetIcons } from '@subf/unocss'
import { unocss } from 'rolldown-plugin-unocss'
import { defineConfig } from 'tsdown'
import solid from 'vite-plugin-solid'

import { DEFAULT_ICON_SHORTCUTS } from './src/shared/style/icons.ts'

export default defineConfig([
  {
    entry: {
      index: './src/index.ts',
      recipe: './src/recipe.ts',
      utils: './src/utils.ts',
      unocss: './src/unocss/index.ts',
      tailwind: './src/tailwind/index.ts',
    },
    plugins: [solid()],
    clean: false,
    deps: {
      neverBundle: ['@subf/unocss', '@tanstack/virtual-core', 'tailwindcss'],
      onlyBundle: ['valibot'],
    },
    dts: {
      parallel: true,
    },
  },
  {
    entry: {
      index: './src/index.ts',
    },
    clean: false,
    platform: 'neutral',
    plugins: [
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
        exports['./icon.css'] = './dist/icon.css'
        exports['./unocss'] = './dist/unocss.mjs'
        exports['./tailwind'] = './dist/tailwind.mjs'
        exports['./utils'] = './dist/utils.mjs'
        exports['./recipe'] = './dist/recipe.mjs'
        return exports
      },
    },
    deps: {
      neverBundle: ['@tanstack/virtual-core'],
    },
    outExtensions: () => ({ js: '.jsx' }),
    dts: false,
  },
])
