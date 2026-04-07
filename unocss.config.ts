import type { PresetWind4Theme } from '@subf/unocss'
import { presetWind4, transformerVariantGroup, presetIcons, defineConfig } from '@subf/unocss'
import { presetFunctionCompletion, presetObjectCompletion } from 'unocss-preset-completion'

import { presetMoraine } from './src/unocss'

export default defineConfig<PresetWind4Theme>({
  presets: [
    presetWind4(),
    presetIcons({
      scale: 1.2,
    }),
    presetMoraine(),
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
