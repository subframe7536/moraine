import type { MORAINE_SHADOW, MORAINE_SURFACES, MoraineThemeColorRole, Tone } from './tokens'

export type MoraineMixKnob = 'hover' | 'active' | 'ink' | 'soft' | 'border'
export type MoraineMixConfig = Partial<Record<MoraineMixKnob, number | string>>

export type MoraineToneColorConfig =
  | string
  | {
      base?: string
      foreground?: string
      hover?: string
      active?: string
      ink?: string
      soft?: string
      border?: string
    }

export type MoraineGroupColorConfig =
  | string
  | {
      base?: string
      foreground?: string
      hover?: string
      active?: string
    }

export type MoraineThemeColors = {
  [Name in MoraineThemeColorRole]?: Name extends Tone
    ? MoraineToneColorConfig
    : Name extends (typeof MORAINE_SURFACES)[number]
      ? MoraineGroupColorConfig
      : string
}

export interface MorainePresetTheme {
  /** CSS color-scheme declaration for this theme's selector. */
  colorScheme?: 'light' | 'dark'
  colors?: MoraineThemeColors
  shadows?: Partial<Record<keyof typeof MORAINE_SHADOW, string>>
  radius?: string
  fontSize?: string
  spacing?: string
  sidebarWidth?: string
  mix?: MoraineMixConfig
}

export interface PresetMoraineOptions extends Omit<
  MorainePresetTheme,
  'colorScheme' | 'colors' | 'shadows'
> {
  /** Enable Wind3 token and utility compatibility. @default false */
  wind3?: boolean
  /** Emit neutral light/dark colors and color schemes, default shadows, and HTML background/foreground styles. @default true */
  themeDefaults?: boolean
  /** Named theme overrides; selectors default to :root, .dark, or [data-theme="name"]. */
  override?: Partial<
    Record<'light' | 'dark' | (string & {}), MorainePresetTheme & { selector?: string }>
  >
}
