import lucideIcons from '@iconify-json/lucide/icons.json' with { type: 'json' }
import type { PresetWind4Theme } from 'unocss'
import { defineConfig, presetIcons, presetWind4, transformerVariantGroup } from 'unocss'
import { presetAnimations } from 'unocss-preset-animations'
import { presetFunctionCompletion, presetObjectCompletion } from 'unocss-preset-completion'

import { presetTheme } from '../src/unocss-preset-theme'

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
      lowLayer: true,
    }),
    presetObjectCompletion(),
    presetFunctionCompletion(),
  ],
  transformers: [
    // pipelines:
    // 1) lib build: inject only
    // 2) playground fast-simulate: inject + rock post
    // 3) real user app: rock post only
    transformerVariantGroup(),
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
  theme: {
    animation: {
      durations: {
        slideup: '.3s',
        slidedown: '.3s',
      },
      timingFns: {
        slideup: 'ease-out',
        slidedown: 'ease-out',
      },
      keyframes: {
        slideup: `
{
    0% {
        height: var(--rock-collapsible-content-height);
    }
    100% {
        height: 0;
    }
}`,
        slidedown: `
{
    0% {
        height: 0;
    }
    100% {
        height: var(--rock-collapsible-content-height);
    }
}`,
      },
    },
  },
})
