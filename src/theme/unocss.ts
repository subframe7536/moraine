import type { Preset, PresetWind3Theme, PresetWind4Theme } from '@subf/unocss'

import { getMoraineAnimations, MORAINE_KEYFRAMES } from './animations.ts'
import { DEFAULT_ICON_SHORTCUTS } from './icons.ts'
import {
  MORAINE_COLORS,
  MORAINE_FONT,
  MORAINE_RADIUS,
  MORAINE_SHADOW,
  createStateColorDeclarations,
  MORAINE_TEXT_SIZE,
  MORAINE_WIDTH,
  MORAINE_Z_INDEX,
} from './tokens.ts'

type MoraineColorMap = typeof MORAINE_COLORS
type UtilityTheme = PresetWind3Theme & PresetWind4Theme

export type MoraineColorState = 'hover' | 'active'
export type MoraineGroupedColorName = {
  [Name in keyof MoraineColorMap]: MoraineColorMap[Name] extends string ? never : Name
}[keyof MoraineColorMap]

export interface MoraineColorStateResolverContext {
  adjustment?: number
  base: string
  color: MoraineGroupedColorName
  foreground: string
  selector: string
  state: MoraineColorState
}

export type MoraineColorStateValue =
  | string
  | number
  | ((context: MoraineColorStateResolverContext) => string)

type MoraineColorEntry<T> = T extends string
  ? string
  :
      | string
      | {
          [Key in keyof T as Key extends 'DEFAULT' ? 'base' : Key]?: Key extends MoraineColorState
            ? MoraineColorStateValue
            : string
        }

export type MoraineThemeColors = {
  [Name in keyof MoraineColorMap]?: MoraineColorEntry<MoraineColorMap[Name]>
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
}

export interface PresetMoraineOptions extends Omit<
  MorainePresetTheme,
  'colorScheme' | 'colors' | 'shadows'
> {
  /** Enable Wind3 token and utility compatibility. @default false */
  wind3?: boolean
  /** Emit neutral light/dark colors and color schemes, default shadows, and HTML background/foreground styles. @default true */
  themeDefaults?: boolean
  /** Generate missing semantic hover and active colors. @default { hover: 8, active: 12 } */
  colorStates?: false | Partial<Record<MoraineColorState, number>>
  /** Named theme overrides; selectors default to :root, .dark, or [data-theme="name"]. */
  override?: Partial<
    Record<'light' | 'dark' | (string & {}), MorainePresetTheme & { selector?: string }>
  >
}

/** Convert a single keyframe frames object to a UnoCSS-style string. */
function keyframeFramesToString(frames: Record<string, Record<string, string>>): string {
  const parts = Object.entries(frames).map(([stop, props]) => {
    const css = Object.entries(props)
      .map(([p, v]) => `${p}: ${v}`)
      .join('; ')
    return `${stop} { ${css} }`
  })
  return `{ ${parts.join(' ')} }`
}

/** All keyframes as UnoCSS-format strings (`{ stop { prop: val } }`). */
function toUnocssKeyframes(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(MORAINE_KEYFRAMES).map(([name, frames]) => [
      name,
      keyframeFramesToString(frames),
    ]),
  )
}

const RE_ATTR = /^(data|aria)-([\w-]+):/

const DEFAULT_COLOR_STATES = { hover: 8, active: 12 } as const

// Map the Tailwind shadow defaults used by shadcn/ui's neutral theme to Moraine roles.
const DEFAULT_THEME_SHADOWS = {
  surface: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  overlay: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  input: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
} satisfies MorainePresetTheme['shadows']

// shadcn/ui's neutral palette in 8-bit sRGB, compositing dark borders over the page background.
const DEFAULT_THEME_COLORS = {
  light: {
    background: { base: 'rgb(255, 255, 255)' },
    foreground: 'rgb(10, 10, 10)',
    card: { base: 'rgb(255, 255, 255)', foreground: 'rgb(10, 10, 10)' },
    popover: { base: 'rgb(255, 255, 255)', foreground: 'rgb(10, 10, 10)' },
    primary: { base: 'rgb(23, 23, 23)', foreground: 'rgb(250, 250, 250)' },
    secondary: { base: 'rgb(245, 245, 245)', foreground: 'rgb(23, 23, 23)' },
    muted: { base: 'rgb(245, 245, 245)', foreground: 'rgb(115, 115, 115)' },
    accent: { base: 'rgb(245, 245, 245)', foreground: 'rgb(23, 23, 23)' },
    destructive: { base: 'rgb(231, 0, 11)' },
    border: 'rgb(229, 229, 229)',
    input: 'rgb(229, 229, 229)',
    control: 'rgb(255, 255, 255)',
    backdrop: 'rgb(0 0 0 / 0.1)',
    ring: 'rgb(161, 161, 161)',
  },
  dark: {
    background: { base: 'rgb(10, 10, 10)' },
    foreground: 'rgb(250, 250, 250)',
    card: { base: 'rgb(23, 23, 23)', foreground: 'rgb(250, 250, 250)' },
    popover: { base: 'rgb(23, 23, 23)', foreground: 'rgb(250, 250, 250)' },
    primary: { base: 'rgb(229, 229, 229)', foreground: 'rgb(23, 23, 23)' },
    secondary: { base: 'rgb(38, 38, 38)', foreground: 'rgb(250, 250, 250)' },
    muted: { base: 'rgb(38, 38, 38)', foreground: 'rgb(161, 161, 161)' },
    accent: { base: 'rgb(38, 38, 38)', foreground: 'rgb(250, 250, 250)' },
    destructive: { base: 'rgb(255, 100, 103)' },
    border: 'rgb(35, 35, 35)',
    input: 'rgb(47, 47, 47)',
    control: 'rgb(23, 23, 23)',
    backdrop: 'rgb(0 0 0 / 0.1)',
    ring: 'rgb(115, 115, 115)',
  },
} satisfies Record<'light' | 'dark', MoraineThemeColors>

function mergeTheme(base: MorainePresetTheme, override?: MorainePresetTheme): MorainePresetTheme {
  const colors = { ...base.colors } as Record<string, unknown>
  for (const [name, value] of Object.entries(override?.colors ?? {})) {
    const previous = colors[name]
    colors[name] =
      previous && typeof previous === 'object' && value && typeof value === 'object'
        ? { ...previous, ...value }
        : previous && typeof previous === 'object' && typeof value === 'string'
          ? { ...previous, base: value }
          : value
  }
  return {
    ...base,
    ...override,
    colors,
    shadows: { ...base.shadows, ...override?.shadows },
  }
}

function defaultSelector(name: string): string {
  if (name === 'light') {
    return ':root'
  }
  if (name === 'dark') {
    return '.dark'
  }
  const escaped = name.replace(
    /[\p{Cc}"\\]/gu,
    (character) => `\\${character.codePointAt(0)!.toString(16)} `,
  )
  return `[data-theme="${escaped}"]`
}

type ResolvedTheme = [selector: string, theme: MorainePresetTheme]

function resolveThemes(options: PresetMoraineOptions): ResolvedTheme[] {
  const light = options.override?.light
  const dark = options.override?.dark
  const lightSelector = light?.selector ?? ':root'
  const darkSelector = dark?.selector ?? '.dark'
  const shared: MorainePresetTheme = {
    radius: options.radius ?? '0.625rem',
    fontSize: options.fontSize ?? '1rem',
    spacing: options.spacing ?? '0.25rem',
    sidebarWidth: options.sidebarWidth,
  }
  const builtIn = options.themeDefaults !== false
  const defaultLight = mergeTheme(
    builtIn
      ? { colorScheme: 'light', colors: DEFAULT_THEME_COLORS.light, shadows: DEFAULT_THEME_SHADOWS }
      : {},
    shared,
  )
  const themes: ResolvedTheme[] = [
    [':root', lightSelector === ':root' ? mergeTheme(defaultLight, light) : defaultLight],
  ]
  if (lightSelector !== ':root') {
    themes.push([lightSelector, mergeTheme(defaultLight, light)])
  }
  if (builtIn || dark) {
    themes.push([
      darkSelector,
      mergeTheme(builtIn ? { colorScheme: 'dark', colors: DEFAULT_THEME_COLORS.dark } : {}, dark),
    ])
  }
  for (const [name, theme] of Object.entries(options.override ?? {})) {
    if (name !== 'light' && name !== 'dark' && theme) {
      themes.push([theme.selector ?? defaultSelector(name), theme])
    }
  }
  return themes
}

function assertColorAdjustment(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new RangeError(`[preset-moraine] ${label} must be a finite number between 0 and 100.`)
  }
}

function colorVariable(color: string, key?: string): string {
  return `--${color}${key ? `-${key}` : ''}`
}

function colorReference(color: string, key?: string): string {
  return `var(${colorVariable(color, key)})`
}

function stateForegroundReference(color: string): string {
  if (color === 'background') {
    return colorReference('foreground')
  }
  return `var(${colorVariable(color, 'foreground')}, ${colorReference(color === 'destructive' ? 'background' : 'foreground')})`
}

function resolveColorStateValue(options: {
  adjustment?: number
  base: string
  color: MoraineGroupedColorName
  foreground: string
  foregroundReference: string
  selector: string
  state: MoraineColorState
  value?: MoraineColorStateValue
}): string | undefined {
  const adjustment = typeof options.value === 'number' ? options.value : options.adjustment
  if (typeof options.value === 'string') {
    return options.value
  }
  if (typeof options.value === 'function') {
    return options.value({
      adjustment,
      base: options.base,
      color: options.color,
      foreground: options.foreground,
      selector: options.selector,
      state: options.state,
    })
  }
  if (adjustment === undefined) {
    return undefined
  }
  assertColorAdjustment(adjustment, `${options.color}.${options.state} adjustment`)
  return `color-mix(in oklch, ${colorReference(options.color)}, ${options.foregroundReference} ${adjustment}%)`
}

function createThemeCSS(
  themes: ResolvedTheme[],
  colorStates: PresetMoraineOptions['colorStates'],
): string {
  const adjustments =
    colorStates === false
      ? undefined
      : {
          hover: colorStates?.hover ?? DEFAULT_COLOR_STATES.hover,
          active: colorStates?.active ?? DEFAULT_COLOR_STATES.active,
        }
  for (const state of ['hover', 'active'] as const) {
    const adjustment = adjustments?.[state]
    if (adjustment !== undefined) {
      assertColorAdjustment(adjustment, `colorStates.${state}`)
    }
  }

  const supportedCSS = adjustments
    ? `@supports (color: color-mix(in oklch, red, white)) {\n  *, ::before, ::after {\n${Object.entries(
        createStateColorDeclarations(adjustments),
      )
        .map(([name, value]) => `    ${name}: ${value};`)
        .join('\n')}\n  }\n}`
    : ''
  const themeCSS = themes
    .map(([selector, theme]) => {
      const declarations: string[] = []
      const numericDeclarations: string[] = []
      const emit = (name: string, value: string | undefined) => {
        if (value !== undefined) {
          declarations.push(`  --${name}: ${value};`)
        }
      }
      const palette = theme.colors as Record<string, unknown> | undefined
      for (const color of Object.keys(MORAINE_COLORS) as Array<keyof MoraineColorMap>) {
        const schema = MORAINE_COLORS[color]
        const configured = palette?.[color]
        if (typeof schema === 'string') {
          if (typeof configured === 'string') {
            emit(color, configured)
          }
          continue
        }
        const entry = typeof configured === 'string' ? { base: configured } : configured
        if (!entry || typeof entry !== 'object') {
          continue
        }
        const group = entry as Record<string, unknown>
        const base = typeof group.base === 'string' ? group.base : colorReference(color)
        const foregroundReference = stateForegroundReference(color)
        const foreground =
          color === 'background'
            ? typeof palette?.foreground === 'string'
              ? palette.foreground
              : foregroundReference
            : typeof group.foreground === 'string'
              ? group.foreground
              : color === 'destructive' && typeof palette?.background === 'string'
                ? palette.background
                : foregroundReference
        if (typeof group.base === 'string') {
          emit(color, group.base)
        }
        if ('foreground' in schema && typeof group.foreground === 'string') {
          emit(`${color}-foreground`, group.foreground)
        }
        for (const state of ['hover', 'active'] as const) {
          const value = group[state]
          if (
            value !== undefined &&
            typeof value !== 'string' &&
            typeof value !== 'number' &&
            typeof value !== 'function'
          ) {
            throw new TypeError(
              `[preset-moraine] ${color}.${state} must be a CSS string, percentage, or resolver function.`,
            )
          }
          if (value === undefined) {
            continue
          }
          const resolved = resolveColorStateValue({
            adjustment: adjustments?.[state],
            base,
            color: color as MoraineGroupedColorName,
            foreground,
            foregroundReference,
            selector,
            state,
            value: value as MoraineColorStateValue | undefined,
          })
          if (resolved !== undefined) {
            const declaration = `  --${color}-${state}: ${resolved};`
            ;(typeof value === 'number' ? numericDeclarations : declarations).push(declaration)
          }
        }
      }
      for (const shadow of Object.keys(MORAINE_SHADOW) as Array<keyof typeof MORAINE_SHADOW>) {
        emit(`shadow-${shadow}`, theme.shadows?.[shadow])
      }
      emit('radius', theme.radius)
      emit('font-size', theme.fontSize)
      emit('spacing', theme.spacing)
      emit('sidebar-width', theme.sidebarWidth)
      if (theme.colorScheme !== undefined) {
        declarations.push(`  color-scheme: ${theme.colorScheme};`)
      }
      const numericBlock = `${selector} {\n${numericDeclarations.join('\n')}\n}`
      return [
        declarations.length ? `${selector} {\n${declarations.join('\n')}\n}` : '',
        numericDeclarations.length
          ? `@supports (color: color-mix(in oklch, red, white)) {\n  ${numericBlock.replaceAll('\n', '\n  ')}\n}`
          : '',
      ]
        .filter(Boolean)
        .join('\n\n')
    })
    .filter(Boolean)
    .join('\n\n')
  return [supportedCSS, themeCSS].filter(Boolean).join('\n\n')
}

function resolveTranslateValue(value: string, theme: UtilityTheme): string | undefined {
  if (value.startsWith('[') && value.endsWith(']')) {
    return value.slice(1, -1)
  }
  if (value === 'full') {
    return '100%'
  }
  if (value === 'px') {
    return '1px'
  }
  if (value === '0') {
    return '0px'
  }
  if (value.includes('/')) {
    const [numerator, denominator] = value.split('/')
    const n = Number(numerator)
    const d = Number(denominator)
    if (!Number.isNaN(n) && !Number.isNaN(d) && d !== 0) {
      return `${(n / d) * 100}%`
    }
  }
  const themeVal = theme.spacing?.[value] ?? theme.width?.[value]
  if (themeVal) {
    return themeVal
  }
  const num = Number(value)
  if (!Number.isNaN(num)) {
    return `calc(var(--spacing, 0.25rem) * ${num})`
  }
  return undefined
}

function resolvePercentageValue(value: string): string | undefined {
  if (value.startsWith('[') && value.endsWith(']')) {
    return value.slice(1, -1)
  }
  const num = Number(value)
  if (!Number.isNaN(num)) {
    return `${num / 100}`
  }
  return undefined
}

function resolveRotateValue(value: string): string | undefined {
  if (value.startsWith('[') && value.endsWith(']')) {
    return value.slice(1, -1)
  }
  const num = Number(value)
  if (!Number.isNaN(num)) {
    return `${num}deg`
  }
  return undefined
}

export function presetMoraine(options: PresetMoraineOptions = {}): Preset {
  const themeCSS = createThemeCSS(resolveThemes(options), options.colorStates)
  const variants: Preset['variants'] = [
    {
      name: 'moraine-attribute',
      multiPass: true,
      match(matcher) {
        const match = matcher.match(RE_ATTR)
        if (!match) {
          return matcher
        }
        return {
          matcher: matcher.slice(match[0].length),
          selector: (s) => `${s}[${match[1]}-${match[2]}]`,
        }
      },
    },
  ]
  if (options.wind3) {
    variants.unshift({
      name: 'moraine-color-alpha',
      multiPass: true,
      match(matcher, { theme }) {
        const match = matcher.match(
          /^(.+?)-(background|foreground|primary|secondary|card|popover|muted|accent|destructive|border|input|control|ring)(?:-(foreground|hover|active))?\/(\d+(?:\.\d+)?|\[[^\]]+\])$/,
        )
        if (!match) {
          return matcher
        }
        const [, utility, groupName, state, alpha] = match
        const group = (theme as UtilityTheme).colors?.[groupName!]
        const color =
          typeof group === 'string' ? (state ? undefined : group) : group?.[state ?? 'DEFAULT']
        if (typeof color !== 'string') {
          return matcher
        }
        const opacity = resolvePercentageValue(alpha!)!
        const percentage = alpha!.startsWith('[')
          ? opacity.endsWith('%')
            ? opacity
            : `calc(${opacity} * 100%)`
          : `${alpha}%`
        const mixedColor = `color-mix(in srgb,${color} ${percentage},transparent)`
        return {
          matcher: `${utility}-[${mixedColor.replaceAll(' ', '_')}]`,
          body(entries) {
            const result: typeof entries = []
            for (const entry of entries) {
              if (entry[1] === mixedColor) {
                result.push([entry[0], color])
              }
              result.push(entry)
            }
            return result
          },
        }
      },
    })
  }

  const rules: Preset['rules'] = [
    [
      /^(enter|exit)-opacity-(.+)$/,
      ([, type, value]) => {
        const resolved = resolvePercentageValue(value!)
        if (resolved !== undefined) {
          return { [`--mo-${type}-opacity`]: resolved }
        }
      },
      { autocomplete: ['(enter|exit)-opacity-<percent>'] },
    ],
    [
      /^(enter|exit)-scale-(.+)$/,
      ([, type, value]) => {
        const resolved = resolvePercentageValue(value!)
        if (resolved !== undefined) {
          return { [`--mo-${type}-scale`]: resolved }
        }
      },
      { autocomplete: ['(enter|exit)-scale-<percent>'] },
    ],
    [
      /^(enter|exit)-translate-([xy])-(.+)$/,
      ([, type, axis, value], { theme }) => {
        const resolved = resolveTranslateValue(value!, theme)
        if (resolved !== undefined) {
          return { [`--mo-${type}-translate-${axis}`]: resolved }
        }
      },
      { autocomplete: ['(enter|exit)-translate-(x|y)-<num>'] },
    ],
    [
      /^(enter|exit)-rotate-(.+)$/,
      ([, type, value]) => {
        const resolved = resolveRotateValue(value!)
        if (resolved !== undefined) {
          return { [`--mo-${type}-rotate`]: resolved }
        }
      },
      { autocomplete: ['(enter|exit)-rotate-<percent>'] },
    ],
  ]
  return {
    name: 'preset-theme-moraine',
    rules,
    theme: {
      ...(options.wind3
        ? {
            borderRadius: MORAINE_RADIUS,
            boxShadow: MORAINE_SHADOW,
            fontFamily: MORAINE_FONT,
            fontSize: {
              tiny: ['0.625rem', '0.875rem'],
            },
            width: MORAINE_WIDTH,
          }
        : {
            radius: MORAINE_RADIUS,
            text: Object.fromEntries(
              Object.entries(MORAINE_TEXT_SIZE).map(([size, [fontSize, lineHeight]]) => [
                size,
                { fontSize, lineHeight },
              ]),
            ),
            shadow: MORAINE_SHADOW,
            font: MORAINE_FONT,
            spacing: MORAINE_WIDTH,
          }),
      zIndex: MORAINE_Z_INDEX,

      colors: MORAINE_COLORS,
      animation: {
        keyframes: toUnocssKeyframes(),
        ...getMoraineAnimations(),
      },
    },
    variants,
    configResolved: options.wind3
      ? undefined
      : (config) => {
          const theme = config.theme as PresetWind4Theme
          const inlineVariables = new Map<string, string>()
          for (const [size, value] of Object.entries(theme.radius ?? {})) {
            inlineVariables.set(`--radius-${size}`, value)
          }
          for (const [size, values] of Object.entries(theme.text ?? {})) {
            for (const [property, value] of Object.entries(values)) {
              if (typeof value === 'string') {
                inlineVariables.set(`--text-${size}-${property}`, value)
              }
            }
          }
          // Inline resolved tokens before other processors so local CSS variables stay live.
          config.postprocess.unshift((utility) => {
            for (const entry of utility.entries) {
              if (typeof entry[1] === 'string') {
                entry[1] = entry[1].replace(
                  /var\((--(?:text|radius)-[\w-]+)\)/g,
                  (reference, variable: string) => inlineVariables.get(variable) ?? reference,
                )
              }
            }
          })
        },
    shortcuts: [
      [/^(.*)-\((--[\w-]+)\)$/, ([, name, variable]) => `${name}-[var(${variable})]`],
      ...Object.entries(MORAINE_Z_INDEX).map(
        ([name, value]) => [`z-${name}`, `z-${value}`] as [string, string],
      ),
      ...DEFAULT_ICON_SHORTCUTS,
    ],
    preflights: [
      {
        getCSS: () => themeCSS,
      },
      {
        getCSS: () =>
          options.themeDefaults !== false
            ? `
html {
  background-color: var(--background);
  color: var(--foreground);
}
`
            : '',
      },
    ],
  }
}
