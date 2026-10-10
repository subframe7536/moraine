import lucideIcons from '@iconify-json/lucide/icons.json' with { type: 'json' }
import { presetIcons } from '@subf/unocss'
import { unocss } from 'rolldown-plugin-unocss'
import { defineConfig } from 'tsdown'
import type { ExportsOptions } from 'tsdown'
import solid from 'vite-plugin-solid'

import { DEFAULT_ICON_SHORTCUTS } from './src/theme/icons.ts'
import { variantGroupPlugin } from './vite-plugin-variant-group.ts'

const packageExports: ExportsOptions = {
  customExports(exports, { chunks }) {
    const jsxEntries = new Set<string>()
    for (const group of Object.values(chunks)) {
      for (const chunk of group) {
        if (chunk.type !== 'chunk' || !chunk.isEntry || !chunk.fileName.endsWith('.jsx')) {
          continue
        }
        jsxEntries.add(chunk.fileName.replace(/\\/g, '/').replace(/\.jsx$/, ''))
      }
    }

    for (const [key, value] of Object.entries(exports)) {
      if (typeof value !== 'string') {
        continue
      }
      const slashIndex = value.lastIndexOf('/')
      const fileName = value.slice(slashIndex + 1)
      if (!fileName.endsWith('.mjs') && !fileName.endsWith('.jsx')) {
        continue
      }
      const dir = value.slice(0, slashIndex + 1)
      const name = fileName.replace(/\.(?:mjs|jsx)$/, '')
      exports[key] = {
        types: `${dir}${name}.d.mts`,
        ...(jsxEntries.has(name) ? { solid: `${dir}${name}.jsx` } : {}),
        default: `${dir}${name}.mjs`,
      }
    }

    return exports
  },
}

export default defineConfig([
  {
    entry: {
      index: './src/index.ts',
      utils: './src/utils.ts',
      virtualizer: './src/virtualizer.ts',
      unocss: './src/theme/unocss.ts',
      tailwind: './src/theme/tailwind.ts',
      theme: './src/theme.ts',
    },
    plugins: [variantGroupPlugin(), solid()],
    unbundle: true,
    clean: true,
    deps: {
      neverBundle: ['@subf/unocss', '@tanstack/virtual-core', 'tailwindcss'],
    },
    dts: {
      parallel: true,
    },
    exports: packageExports,
  },
  {
    entry: {
      index: './src/index.ts',
      utils: './src/utils.ts',
      virtualizer: './src/virtualizer.ts',
    },
    unbundle: true,
    clean: false,
    platform: 'neutral',
    plugins: [
      variantGroupPlugin(),
      unocss({
        generateCSS: true,
        fileName: 'icon.css',
        config: {
          content: {
            pipeline: false,
          },
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
    deps: {
      neverBundle: ['@tanstack/virtual-core'],
    },
    outExtensions: () => ({ js: '.jsx' }),
    dts: false,
    exports: packageExports,
  },
])
