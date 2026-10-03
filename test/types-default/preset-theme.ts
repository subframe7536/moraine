import { presetMoraine } from 'moraine/unocss'
import type { MorainePresetTheme, PresetMoraineOptions } from 'moraine/unocss'

const theme = {
  colorScheme: 'light',
  colors: {
    background: '#fff',
    control: 'var(--palette-field)',
    primary: { foreground: '#fff', hover: 8, active: () => '#124' },
  },
  shadows: { surface: '0 1px #000', overlay: '0 4px #111', input: 'none' },
  radius: '1rem',
  fontSize: '1rem',
  spacing: '0.25rem',
  sidebarWidth: '18rem',
} satisfies MorainePresetTheme

presetMoraine({
  wind3: true,
  themeDefaults: false,
  override: {
    light: theme,
    dark: { selector: '.night', colorScheme: 'dark', colors: { primary: '#eee' } },
    brand: { colorScheme: 'light', colors: { primary: '#369' } },
  },
  colorStates: false,
} satisfies PresetMoraineOptions)

presetMoraine({ wind3: false })
// @ts-expect-error Wind3 compatibility is a top-level boolean option.
presetMoraine({ wind3: 'auto' })
// @ts-expect-error Wind3 compatibility cannot vary by theme.
presetMoraine({ override: { light: { wind3: true } } })

// @ts-expect-error Unknown semantic colors belong in CSS.
presetMoraine({ override: { light: { colors: { brand: '#369' } } } })
// @ts-expect-error Theme variables are grouped by purpose.
presetMoraine({ override: { light: { '--radius': '1rem' } } })
// @ts-expect-error Colors are configured within named themes.
presetMoraine({ colors: { primary: '#369' } })
// @ts-expect-error Shadows are configured within named themes.
presetMoraine({ shadows: { surface: '0 1px #000' } })
// @ts-expect-error Font families belong in CSS.
presetMoraine({ fonts: { sans: 'Inter' } })
// @ts-expect-error Theme font families belong in CSS.
presetMoraine({ override: { light: { fonts: { sans: 'Inter' } } } })
// @ts-expect-error Color schemes are configured within named themes.
presetMoraine({ colorScheme: 'light' })
// @ts-expect-error Color schemes must be light or dark.
presetMoraine({ override: { light: { colorScheme: 'light dark' } } })
// @ts-expect-error Size-based shadows belong to the CSS engine's theme.
presetMoraine({ override: { light: { shadows: { xs: '0 1px #000' } } } })
// @ts-expect-error The selector-based themes option has been removed.
presetMoraine({ themes: { ':root': theme } })
// @ts-expect-error The removed colorVariables option is not accepted.
presetMoraine({ colorVariables: {} })
// @ts-expect-error The removed globalStyles option is not accepted.
presetMoraine({ globalStyles: false })
// @ts-expect-error The old baseStyles option has been replaced by themeDefaults.
presetMoraine({ baseStyles: false })
