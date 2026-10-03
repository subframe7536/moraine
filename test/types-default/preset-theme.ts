import { presetMoraine } from 'moraine/unocss'
import type { MorainePresetTheme, PresetMoraineOptions } from 'moraine/unocss'

const theme = {
  colors: {
    background: '#fff',
    control: 'var(--palette-field)',
    primary: { foreground: '#fff', hover: 8, active: () => '#124' },
  },
  fonts: { sans: 'Inter' },
  shadows: { base: '0 1px #000', '2xs': '0 1px #111' },
  radius: '1rem',
  fontSize: '1rem',
  spacing: '0.25rem',
  sidebarWidth: '18rem',
} satisfies MorainePresetTheme

presetMoraine({
  fonts: { sans: 'Inter' },
  themeDefaults: false,
  override: {
    light: theme,
    dark: { selector: '.night', colors: { primary: '#eee' } },
    brand: { colors: { primary: '#369' } },
  },
  colorStates: false,
} satisfies PresetMoraineOptions)

// @ts-expect-error Unknown semantic colors belong in CSS.
presetMoraine({ override: { light: { colors: { brand: '#369' } } } })
// @ts-expect-error Theme variables are grouped by purpose.
presetMoraine({ override: { light: { '--radius': '1rem' } } })
// @ts-expect-error Colors are configured within named themes.
presetMoraine({ colors: { primary: '#369' } })
// @ts-expect-error Shadows are configured within named themes.
presetMoraine({ shadows: { sm: '0 1px #000' } })
// @ts-expect-error The selector-based themes option has been removed.
presetMoraine({ themes: { ':root': theme } })
// @ts-expect-error The removed colorVariables option is not accepted.
presetMoraine({ colorVariables: {} })
// @ts-expect-error The removed globalStyles option is not accepted.
presetMoraine({ globalStyles: false })
// @ts-expect-error The old baseStyles option has been replaced by themeDefaults.
presetMoraine({ baseStyles: false })
