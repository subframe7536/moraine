import type { PresetWind4Theme } from '@subf/unocss'
import {
  presetWind4,
  transformerVariantGroup,
  presetIcons,
  defineConfig,
  presetCompletion,
} from '@subf/unocss'

import { presetMoraine } from './src/unocss'

export default defineConfig<PresetWind4Theme>({
  presets: [
    presetWind4(),
    presetIcons({
      scale: 1.2,
    }),
    presetMoraine({
      // enableComponentLayer: true,
    }),
    presetCompletion(),
  ],
  transformers: [transformerVariantGroup()],
  content: {
    pipeline: {
      include: ['**/*.tsx', '**/*.class.ts', 'node_modules/**/*.*'],
    },
  },
})
