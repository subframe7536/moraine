import type { PresetWind4Theme } from 'unocss'
import { presetWind4, transformerVariantGroup, presetIcons, defineConfig } from 'unocss'
import { presetFunctionCompletion, presetObjectCompletion } from 'unocss-preset-completion'

import { presetTheme } from './src/unocss-preset-theme'

export default defineConfig<PresetWind4Theme>({
  presets: [
    presetWind4(),
    presetIcons({
      scale: 1.2,
    }),
    presetTheme(),
    presetObjectCompletion(),
    presetFunctionCompletion(),
  ],
  transformers: [transformerVariantGroup()],
  content: {
    pipeline: {
      include: ['**/*.tsx', '**/*.class.ts', 'node_modules/**/*.*'],
    },
  },
})
