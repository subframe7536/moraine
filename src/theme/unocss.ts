import type { Preset } from '@subf/unocss'

import {
  getMoraineAnimCounts,
  getMoraineAnimDurations,
  getMoraineAnimTimingFns,
  MORAINE_KEYFRAMES,
} from './animations.ts'
import { DEFAULT_ICON_SHORTCUTS } from './icons.ts'
import {
  MORAINE_COLORS,
  MORAINE_FONT,
  MORAINE_RADIUS,
  MORAINE_SHADOW,
  MORAINE_STATE_COLORS,
  MORAINE_TEXT_SIZE,
  MORAINE_WIDTH,
  MORAINE_Z_INDEX,
} from './tokens.ts'

type MoraineColorMap = typeof MORAINE_COLORS

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
  colors?: MoraineThemeColors
  fonts?: Partial<Record<keyof typeof MORAINE_FONT, string>>
  shadows?: Partial<Record<Exclude<keyof typeof MORAINE_SHADOW, 'DEFAULT'> | 'base', string>>
  radius?: string
  fontSize?: string
  spacing?: string
  sidebarWidth?: string
}

export interface PresetMoraineOptions extends Omit<MorainePresetTheme, 'colors' | 'shadows'> {
  /** Emit neutral light/dark colors and HTML background/foreground styles. @default true */
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

const RADIUS_CORNERS: Record<string, string[]> = {
  '': ['border-radius'],
  t: ['border-top-left-radius', 'border-top-right-radius'],
  b: ['border-bottom-left-radius', 'border-bottom-right-radius'],
  l: ['border-top-left-radius', 'border-bottom-left-radius'],
  r: ['border-top-right-radius', 'border-bottom-right-radius'],
  s: ['border-start-start-radius', 'border-end-start-radius'],
  e: ['border-start-end-radius', 'border-end-end-radius'],
  tl: ['border-top-left-radius'],
  tr: ['border-top-right-radius'],
  bl: ['border-bottom-left-radius'],
  br: ['border-bottom-right-radius'],
  ss: ['border-start-start-radius'],
  se: ['border-start-end-radius'],
  es: ['border-end-start-radius'],
  ee: ['border-end-end-radius'],
}

const DEFAULT_COLOR_STATES = { hover: 8, active: 12 } as const

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
    border: 'rgba(255, 255, 255, 0.1)',
    input: 'rgba(255, 255, 255, 0.15)',
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
    fonts: { ...base.fonts, ...override?.fonts },
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

type ResolvedTheme = [selector: string, theme: MorainePresetTheme, builtIn: boolean]

function resolveThemes(options: PresetMoraineOptions): ResolvedTheme[] {
  const light = options.override?.light
  const dark = options.override?.dark
  const lightSelector = light?.selector ?? ':root'
  const darkSelector = dark?.selector ?? '.dark'
  const shared: MorainePresetTheme = {
    fonts: options.fonts,
    radius: options.radius,
    fontSize: options.fontSize,
    spacing: options.spacing,
    sidebarWidth: options.sidebarWidth,
  }
  const builtIn = options.themeDefaults !== false
  const defaultLight = mergeTheme(builtIn ? { colors: DEFAULT_THEME_COLORS.light } : {}, shared)
  const themes: ResolvedTheme[] = [
    [':root', lightSelector === ':root' ? mergeTheme(defaultLight, light) : defaultLight, builtIn],
  ]
  if (lightSelector !== ':root') {
    themes.push([lightSelector, mergeTheme(defaultLight, light), builtIn])
  }
  if (builtIn || dark) {
    themes.push([
      darkSelector,
      mergeTheme(builtIn ? { colors: DEFAULT_THEME_COLORS.dark } : {}, dark),
      builtIn,
    ])
  }
  for (const [name, theme] of Object.entries(options.override ?? {})) {
    if (name !== 'light' && name !== 'dark' && theme) {
      themes.push([theme.selector ?? defaultSelector(name), theme, false])
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

function mixRgb(base: string, foreground: string, adjustment: number): string | undefined {
  const parse = (value: string) => /^rgb\((\d+), (\d+), (\d+)\)$/.exec(value)?.slice(1).map(Number)
  const baseChannels = parse(base)
  const foregroundChannels = parse(foreground)
  if (!baseChannels || !foregroundChannels) {
    return undefined
  }
  return `rgb(${baseChannels.map((channel, index) => Math.round(channel * (1 - adjustment / 100) + (foregroundChannels[index]! * adjustment) / 100)).join(', ')})`
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

  const numericStateCSS: string[] = []
  const fallbackCSS: string[] = []
  const themeCSS = themes
    .map(([selector, theme, builtIn]) => {
      const declarations: string[] = []
      const numericDeclarations: string[] = []
      const fallbackDeclarations: string[] = []
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
      if (adjustments) {
        for (const color of MORAINE_STATE_COLORS) {
          const entry = palette?.[color]
          const group = typeof entry === 'string' ? { base: entry } : entry
          const values =
            group && typeof group === 'object' ? (group as Record<string, unknown>) : {}
          const base = typeof values.base === 'string' ? values.base : colorReference(color)
          const background = palette?.background
          const foreground =
            color === 'background'
              ? palette?.foreground
              : typeof values.foreground === 'string'
                ? values.foreground
                : color === 'destructive'
                  ? typeof background === 'string'
                    ? background
                    : background && typeof background === 'object'
                      ? (background as Record<string, unknown>).base
                      : undefined
                  : undefined
          for (const state of ['hover', 'active'] as const) {
            const adjustment =
              typeof values[state] === 'number' ? values[state] : adjustments[state]
            const fallback =
              builtIn && typeof base === 'string' && typeof foreground === 'string'
                ? mixRgb(base, foreground, adjustment)
                : undefined
            fallbackDeclarations.push(
              `  --mo-auto-${color}-${state}: ${fallback ?? colorReference(color)};`,
            )
          }
        }
      }
      for (const font of Object.keys(MORAINE_FONT) as Array<keyof typeof MORAINE_FONT>) {
        emit(`font-${font}`, theme.fonts?.[font])
      }
      for (const shadow of Object.keys(MORAINE_SHADOW) as Array<keyof typeof MORAINE_SHADOW>) {
        emit(
          shadow === 'DEFAULT' ? 'shadow' : `shadow-${shadow}`,
          theme.shadows?.[shadow === 'DEFAULT' ? 'base' : shadow],
        )
      }
      emit('radius', theme.radius)
      emit('font-size', theme.fontSize)
      emit('spacing', theme.spacing)
      emit('sidebar-width', theme.sidebarWidth)
      if (numericDeclarations.length) {
        numericStateCSS.push(`${selector} {\n${numericDeclarations.join('\n')}\n}`)
      }
      if (fallbackDeclarations.length) {
        fallbackCSS.push(`${selector} {\n${fallbackDeclarations.join('\n')}\n}`)
      }
      return declarations.length ? `${selector} {\n${declarations.join('\n')}\n}` : ''
    })
    .filter(Boolean)
    .join('\n\n')
  const supportedCSS: string[] = []
  if (adjustments) {
    const declarations = MORAINE_STATE_COLORS.flatMap((color) =>
      (['hover', 'active'] as const).map(
        (state) =>
          `    --mo-auto-${color}-${state}: color-mix(in oklch, ${colorReference(color)}, ${stateForegroundReference(color)} ${adjustments[state]}%);`,
      ),
    )
    supportedCSS.push(`  *, ::before, ::after {\n${declarations.join('\n')}\n  }`)
  }
  supportedCSS.push(...numericStateCSS.map((block) => `  ${block.replaceAll('\n', '\n  ')}`))
  return [
    themeCSS,
    fallbackCSS.length
      ? `@supports not (color: color-mix(in oklch, red, white)) {\n${fallbackCSS.map((block) => `  ${block.replaceAll('\n', '\n  ')}`).join('\n\n')}\n}`
      : '',
    supportedCSS.length
      ? `@supports (color: color-mix(in oklch, red, white)) {\n${supportedCSS.join('\n\n')}\n}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n')
}

function resolveTranslateValue(value: string, theme: Record<string, any>): string | undefined {
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
    return `${num * 0.25}rem`
  }
  return undefined
}

function resolveScaleValue(value: string): string | undefined {
  if (value.startsWith('[') && value.endsWith(']')) {
    return value.slice(1, -1)
  }
  const num = Number(value)
  if (!Number.isNaN(num)) {
    return `${num / 100}`
  }
  return undefined
}

function resolveOpacityValue(value: string): string | undefined {
  if (value.startsWith('[') && value.endsWith(']')) {
    return value.slice(1, -1)
  }
  const num = Number(value)
  if (!Number.isNaN(num)) {
    return num === 0 ? '0' : `${num / 100}`
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

  return {
    name: 'preset-theme-moraine',
    rules: [
      [
        /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/,
        ([, size]) => {
          const [fontSize, lineHeight] = MORAINE_TEXT_SIZE[size as keyof typeof MORAINE_TEXT_SIZE]
          return { 'font-size': fontSize, 'line-height': `var(--un-leading, ${lineHeight})` }
        },
      ],
      [
        // inline theme support
        /^rounded-(?:(t|b|l|r|s|e|tl|tr|bl|br|ss|se|es|ee)-)?(xs|sm|md|lg|xl|2xl|3xl|4xl)$/,
        ([, corner = '', size]) => {
          const radius = MORAINE_RADIUS[size as keyof typeof MORAINE_RADIUS]
          return Object.fromEntries(RADIUS_CORNERS[corner]!.map((property) => [property, radius]))
        },
      ],
      [
        /^(enter|exit)-opacity-(.+)$/,
        ([, type, value]) => {
          if (value === undefined) {
            return
          }
          const resolved = resolveOpacityValue(value)
          if (resolved !== undefined) {
            return { [`--mo-${type}-opacity`]: resolved }
          }
        },
        { autocomplete: ['(enter|exit)-opacity-<percent>'] },
      ],
      [
        /^(enter|exit)-scale-(.+)$/,
        ([, type, value]) => {
          if (value === undefined) {
            return
          }
          const resolved = resolveScaleValue(value)
          if (resolved !== undefined) {
            return { [`--mo-${type}-scale`]: resolved }
          }
        },
        { autocomplete: ['(enter|exit)-scale-<percent>'] },
      ],
      [
        /^(enter|exit)-translate-([xy])-(.+)$/,
        ([, type, axis, value], { theme }) => {
          if (value === undefined) {
            return
          }
          const resolved = resolveTranslateValue(value, theme as Record<string, any>)
          if (resolved !== undefined) {
            return { [`--mo-${type}-translate-${axis}`]: resolved }
          }
        },
        { autocomplete: ['(enter|exit)-translate-(x|y)-<num>'] },
      ],
      [
        /^(enter|exit)-rotate-(.+)$/,
        ([, type, value]) => {
          if (value === undefined) {
            return
          }
          const resolved = resolveRotateValue(value)
          if (resolved !== undefined) {
            return { [`--mo-${type}-rotate`]: resolved }
          }
        },
        { autocomplete: ['(enter|exit)-rotate-<percent>'] },
      ],
    ],
    theme: {
      // Wind4 theme keys
      radius: MORAINE_RADIUS,
      shadow: MORAINE_SHADOW,
      font: MORAINE_FONT,
      spacing: MORAINE_WIDTH,

      // Wind3 theme keys
      borderRadius: MORAINE_RADIUS,
      boxShadow: MORAINE_SHADOW,
      fontFamily: MORAINE_FONT,
      width: MORAINE_WIDTH,
      zIndex: MORAINE_Z_INDEX,

      colors: MORAINE_COLORS,
      animation: {
        keyframes: toUnocssKeyframes(),
        timingFns: getMoraineAnimTimingFns(),
        durations: getMoraineAnimDurations(),
        counts: getMoraineAnimCounts(),
      },
    },
    variants,
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
