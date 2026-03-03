import { colors as wind4Colors } from '@unocss/preset-wind4/colors'
import type { Preset } from 'unocss'
import type { Theme } from 'unocss/preset-wind4'

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

type Shade = (typeof SHADES)[number]
type Shortcut = [string, string]
type WindColorName = keyof typeof wind4Colors
type ColorName = WindColorName | string
type IconKey = keyof typeof DEFAULT_ICONS
type ColorKey = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
type ToneKey = Exclude<ColorKey, 'neutral'>
type ColorScale = Record<Shade, string>
type SemanticColor = Record<Shade, string> & {
  DEFAULT: string
  foreground: string
}

export interface AppConfig {
  colors: Record<ColorKey, ColorName>
  icons: Record<IconKey, string>
}

export interface PresetThemeOptions {
  radiusRem?: number
  colors?: Partial<AppConfig['colors']>
  icons?: Partial<AppConfig['icons']>
  idFilter?: (id: string) => boolean
}

export const DEFAULT_COLORS: AppConfig['colors'] = {
  primary: 'gray',
  secondary: 'blue',
  success: 'green',
  info: 'blue',
  warning: 'yellow',
  error: 'red',
  neutral: 'slate',
}

export const DEFAULT_ICONS = {
  arrowDown: 'i-lucide-arrow-down',
  arrowLeft: 'i-lucide-arrow-left',
  arrowRight: 'i-lucide-arrow-right',
  arrowUp: 'i-lucide-arrow-up',
  caution: 'i-lucide-circle-alert',
  check: 'i-lucide-check',
  chevronDoubleLeft: 'i-lucide-chevrons-left',
  chevronDoubleRight: 'i-lucide-chevrons-right',
  chevronDown: 'i-lucide-chevron-down',
  chevronLeft: 'i-lucide-chevron-left',
  chevronRight: 'i-lucide-chevron-right',
  chevronUp: 'i-lucide-chevron-up',
  close: 'i-lucide-x',
  copy: 'i-lucide-copy',
  copyCheck: 'i-lucide-copy-check',
  dark: 'i-lucide-moon',
  drag: 'i-lucide-grip-vertical',
  ellipsis: 'i-lucide-ellipsis',
  error: 'i-lucide-circle-x',
  external: 'i-lucide-arrow-up-right',
  eye: 'i-lucide-eye',
  eyeOff: 'i-lucide-eye-off',
  file: 'i-lucide-file',
  folder: 'i-lucide-folder',
  folderOpen: 'i-lucide-folder-open',
  hash: 'i-lucide-hash',
  info: 'i-lucide-info',
  light: 'i-lucide-sun',
  loading: 'i-lucide-loader-circle',
  menu: 'i-lucide-menu',
  minus: 'i-lucide-minus',
  panelClose: 'i-lucide-panel-left-close',
  panelOpen: 'i-lucide-panel-left-open',
  plus: 'i-lucide-plus',
  reload: 'i-lucide-rotate-ccw',
  search: 'i-lucide-search',
  stop: 'i-lucide-square',
  success: 'i-lucide-circle-check',
  system: 'i-lucide-monitor',
  tip: 'i-lucide-lightbulb',
  upload: 'i-lucide-upload',
  warning: 'i-lucide-triangle-alert',
} as const

const LIGHT_BASE_COLORS = {
  background: 'rgb(248, 247, 244)',
  foreground: 'rgb(26, 31, 46)',
  card: { DEFAULT: 'rgb(250, 250, 248)', foreground: 'rgb(26, 31, 46)' },
  popover: { DEFAULT: 'rgb(250, 250, 250)', foreground: 'rgb(26, 31, 46)' },
  muted: { DEFAULT: 'rgb(232, 230, 225)', foreground: 'rgb(107, 114, 128)' },
  accent: { DEFAULT: 'rgb(215, 219, 223)', foreground: 'rgb(26, 31, 46)' },
  border: 'rgb(232, 230, 225)',
  input: { DEFAULT: 'rgb(212, 217, 223)', foreground: 'rgb(26, 31, 46)' },
} satisfies Theme['colors']

const DARK_BASE_COLORS = {
  background: 'rgb(37, 39, 38)',
  foreground: 'rgb(220, 220, 220)',
  card: { DEFAULT: 'rgb(42, 45, 43)', foreground: 'rgb(220, 220, 220)' },
  popover: { DEFAULT: 'rgb(51, 51, 51)', foreground: 'rgb(220, 220, 220)' },
  muted: { DEFAULT: 'rgb(56, 61, 58)', foreground: 'rgb(173, 173, 173)' },
  accent: { DEFAULT: 'rgb(96, 112, 118)', foreground: 'rgb(217, 220, 227)' },
  border: 'rgb(79, 79, 79)',
  input: { DEFAULT: 'rgb(65, 65, 65)', foreground: 'rgb(220, 220, 220)' },
} satisfies Theme['colors']

const LIGHT_TONE_FOREGROUND: Record<ToneKey, string> = {
  primary: 'rgb(239, 246, 241)',
  secondary: 'rgb(238, 243, 252)',
  success: 'rgb(236, 247, 239)',
  info: 'rgb(236, 245, 255)',
  warning: 'rgb(41, 37, 36)',
  error: 'rgb(253, 238, 238)',
}

const DARK_TONE_FOREGROUND: Record<ToneKey, string> = {
  primary: 'rgb(235, 239, 236)',
  secondary: 'rgb(231, 237, 247)',
  success: 'rgb(229, 240, 232)',
  info: 'rgb(230, 239, 250)',
  warning: 'rgb(41, 37, 36)',
  error: 'rgb(248, 232, 232)',
}

function generateCSSVariables(obj: Record<string, unknown>, prefix: string[] = []): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const currentPath = [...prefix, key]

    if (typeof value === 'string') {
      return [`--${currentPath.join('-')}: ${value}`]
    }

    if (value && typeof value === 'object') {
      return generateCSSVariables(value as Record<string, unknown>, currentPath)
    }

    return []
  })
}

function toKebabCase(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isColorScale(value: unknown): value is ColorScale {
  return SHADES.every((shade) => {
    return typeof (value as Record<number, unknown> | undefined)?.[shade] === 'string'
  })
}

function getColorScale(name: ColorName): ColorScale {
  const candidate = (wind4Colors as Record<string, unknown>)[name]
  if (isColorScale(candidate)) {
    return candidate
  }

  return wind4Colors.slate as ColorScale
}

function createSemanticColor(
  name: ColorName,
  foreground: string,
  defaultShade: Shade = 500,
): SemanticColor {
  const scale = getColorScale(name)
  const shades = Object.fromEntries(SHADES.map((shade) => [shade, scale[shade]])) as Record<
    Shade,
    string
  >

  return {
    ...shades,
    DEFAULT: scale[defaultShade],
    foreground,
  }
}

function createIconShortcuts(icons: AppConfig['icons']): Shortcut[] {
  return Object.entries(icons).map(([name, icon]) => [`icon-${toKebabCase(name)}`, icon])
}

function createThemeColors(colors: AppConfig['colors'], isDark: boolean): Theme['colors'] {
  const defaultShade: Shade = isDark ? 300 : 600
  const toneForeground = isDark ? DARK_TONE_FOREGROUND : LIGHT_TONE_FOREGROUND
  const primary = createSemanticColor(colors.primary, toneForeground.primary, defaultShade)
  const secondary = createSemanticColor(colors.secondary, toneForeground.secondary, defaultShade)
  const success = createSemanticColor(colors.success, toneForeground.success, defaultShade)
  const info = createSemanticColor(colors.info, toneForeground.info, defaultShade)
  const warning = createSemanticColor(colors.warning, toneForeground.warning, defaultShade)
  const error = createSemanticColor(colors.error, toneForeground.error, defaultShade)
  const neutral = createSemanticColor(colors.neutral, isDark ? '#f9fafb' : '#111827', defaultShade)
  const base = isDark ? DARK_BASE_COLORS : LIGHT_BASE_COLORS

  return {
    ...base,
    primary,
    secondary,
    success,
    info,
    warning,
    error,
    neutral,
    destructive: {
      ...error,
      foreground: toneForeground.error,
    },
    ring: primary.DEFAULT,
    chart: {
      1: primary[defaultShade],
      2: secondary[defaultShade],
      3: success[defaultShade],
      4: warning[defaultShade],
      5: neutral[isDark ? 600 : 300],
    },
    sidebar: {
      DEFAULT: isDark ? 'rgb(44, 48, 45)' : 'rgb(250, 250, 248)',
      foreground: isDark ? 'rgb(211, 213, 211)' : 'rgb(26, 31, 46)',
      primary: {
        DEFAULT: primary.DEFAULT,
        foreground: toneForeground.primary,
      },
      accent: {
        DEFAULT: isDark ? neutral[700] : neutral[100],
        foreground: isDark ? neutral[200] : neutral[900],
      },
      border: isDark ? neutral[700] : neutral[200],
      ring: primary.DEFAULT,
    },
  }
}

function normalizeOptions(options?: number | PresetThemeOptions): Required<PresetThemeOptions> {
  if (typeof options === 'number') {
    return {
      radiusRem: options,
      colors: {},
      icons: {},
      idFilter: DEFAULT_ID_FILTER,
    }
  }

  return {
    radiusRem: options?.radiusRem ?? 0.5,
    colors: options?.colors ?? {},
    icons: options?.icons ?? {},
    idFilter: options?.idFilter ?? DEFAULT_ID_FILTER,
  }
}

export const ROCK_COMPONENT_LAYER = 'rock-component'
export const ROCK_PREFIX = '_RK-'
const ROCK_PREFIX_RE = new RegExp(escapeRegExp(ROCK_PREFIX), 'g')
const ROCK_PREFIX_CLEAN_RE = new RegExp(`\\\\?${escapeRegExp(ROCK_PREFIX)}`, 'g')
const SCRIPT_ID_RE = /\.(?:js|jsx|ts|tsx|mjs|cjs|mts|cts)(?:$|[?#])/i
const DEFAULT_ID_FILTER = (id: string): boolean => SCRIPT_ID_RE.test(id)

export function presetTheme(options?: number | PresetThemeOptions): Preset {
  const normalized = normalizeOptions(options)
  const appConfig: AppConfig = {
    colors: {
      ...DEFAULT_COLORS,
      ...normalized.colors,
    },
    icons: {
      ...DEFAULT_ICONS,
      ...normalized.icons,
    },
  }

  const lightTheme: Theme = {
    colors: createThemeColors(appConfig.colors, false),
  }
  const darkTheme: Theme = {
    colors: createThemeColors(appConfig.colors, true),
  }

  const darkThemeVars = generateCSSVariables(darkTheme as Record<string, unknown>).join(';\n')

  return {
    name: 'preset-rock',
    theme: lightTheme,
    layers: {
      [ROCK_PREFIX]: -1,
      default: 1,
    },
    transformers: [
      {
        name: 'transformer-rock',
        enforce: 'post',
        idFilter: normalized.idFilter,
        transform(code) {
          const source = code.toString()
          const nextSource = source.replace(ROCK_PREFIX_RE, '')
          if (nextSource !== source) {
            code.overwrite(0, code.original.length, nextSource)
          }
        },
      },
    ],
    variants: [
      (matcher) => {
        if (!matcher.startsWith(ROCK_PREFIX)) {
          return matcher
        }

        return {
          matcher: matcher.slice(ROCK_PREFIX.length),
          layer: ROCK_COMPONENT_LAYER,
        }
      },
      (matcher) => {
        const match = matcher.match(/^(data|aria)-(\w+):/)
        if (!match) {
          return matcher
        }

        return {
          // Remove the prefix (e.g., "data-invalid:") from the matcher string
          matcher: matcher.slice(match[0].length),
          // Transform the selector to include the attribute: .foo -> .foo[data-invalid]
          selector: (s) => `${s}[${match[1]}-${match[2]}]`,
        }
      },
    ],
    postprocess: [
      (util) => {
        if (util.layer !== ROCK_COMPONENT_LAYER) {
          return
        }

        util.selector = util.selector.replace(ROCK_PREFIX_CLEAN_RE, '')
        if (util.parent) {
          util.parent = util.parent.replace(ROCK_PREFIX_CLEAN_RE, '')
        }
      },
    ],
    shortcuts: [
      ['effect-fv', 'outline-none ring-3px ring-ring/50'],
      ['effect-fv-border', 'outline-none border-ring ring-3px ring-ring/50'],
      ['surface-highlight', 'ring-1 ring-border/50'],
      ['surface-soft', 'b-transparent bg-muted/50 hover:bg-muted'],
      ['surface-subtle', 'border bg-muted'],
      ['surface-ghost', 'b-transparent bg-transparent hover:bg-muted'],
      ['surface-none', 'b-transparent bg-transparent'],
      ['hidden-hitless', 'opacity-0 pointer-events-none'],
      [
        'effect-invalid',
        'border-destructive ring-3 ring-destructive/20 dark:(border-destructive/50 ring-destructive/40)',
      ],
      ['effect-dis', 'pointer-events-none opacity-64 cursor-not-allowed'],
      ['border', 'b-1 b-border'],
      ...createIconShortcuts(appConfig.icons),
    ],
    preflights: [
      {
        getCSS: () => `:root {
  --radius: ${normalized.radiusRem}rem;
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --ui-radius: var(--radius);
  --ui-container: 80rem;
}
.dark {
  ${darkThemeVars};
}`,
      },
    ],
  }
}
