import { presetMoraine } from 'moraine/unocss'
import type { MorainePresetTheme, PresetMoraineOptions } from 'moraine/unocss'

const theme = {
  colors: {
    background: '#fff',
    primary: { foreground: '#fff', hover: 8, active: () => '#124' },
  },
  fonts: { sans: 'Inter' },
  shadows: { base: '0 1px #000', '2xs': '0 1px #111' },
  radius: '1rem',
  fontSize: '1rem',
  spacing: '0.25rem',
  sidebarWidth: '18rem',
} satisfies MorainePresetTheme

presetMoraine({ themes: { ':root': theme }, colorStates: false } satisfies PresetMoraineOptions)

// @ts-expect-error Unknown semantic colors belong in CSS.
presetMoraine({ themes: { ':root': { colors: { brand: '#369' } } } })
// @ts-expect-error Theme variables are grouped by purpose.
presetMoraine({ themes: { ':root': { '--radius': '1rem' } } })
// @ts-expect-error The removed colorVariables option is not accepted.
presetMoraine({ colorVariables: {} })
// @ts-expect-error The removed globalStyles option is not accepted.
presetMoraine({ globalStyles: false })
