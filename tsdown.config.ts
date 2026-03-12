import type { UnoCSSPluginOptions } from 'rolldown-plugin-unocss'
import { unocss } from 'rolldown-plugin-unocss'
import { defineConfig } from 'tsdown'
import { presetIcons, presetWind3, presetWind4, transformerVariantGroup } from 'unocss'
import { presetAnimations } from 'unocss-preset-animations'
import solid from 'vite-plugin-solid'

import { presetTheme } from './src/unocss-preset-theme'
import { createMigrateSyntaxTransformer } from './src/unocss-transformer-migrate-syntax'

const baseUnocssConfig = (preset: any): UnoCSSPluginOptions => {
  return {
    filter: { id: ['src/**/*.tsx', 'src/**/*.class.ts'] },
    config: {
      configFile: false,
      presets: [
        preset,
        presetIcons({
          scale: 1.2,
        }),
        presetAnimations() as any,
        presetTheme(),
      ],
      transformers: [transformerVariantGroup(), createMigrateSyntaxTransformer()],
      extractors: [
        {
          name: 'simplify',
          extract(ctx) {
            const shortcuts = new Set((presetTheme().shortcuts as any[]).map((s) => s[0]))
            Array.from(ctx.extracted.keys())
              .filter((e) => !e.startsWith('var-') && !shortcuts.has(e))
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
    entry: ['./src/index.ts', './src/unocss-preset-theme.ts'],
    // use the solid plugin to handle jsx
    plugins: [
      unocss({
        generateCSS: true,
        fileName: 'tw3.css',
        ...baseUnocssConfig(presetWind3()),
      }),
      solid(),
    ],
    dts: true,
  },
  {
    entry: ['./src/index.ts'],
    platform: 'neutral',
    plugins: [
      unocss({
        generateCSS: true,
        fileName: 'tw4.css',
        ...baseUnocssConfig(presetWind4({ preflights: { reset: false } })),
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
        return exports
      },
    },
    outExtensions: () => ({ js: '.jsx' }),
    dts: false,
  },
])
