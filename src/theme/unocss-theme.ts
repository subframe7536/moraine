import { DEFAULT_THEME_COLORS } from './defaults.ts'
import {
  MORAINE_COLORS,
  MORAINE_SHADOW,
  THEME_COLOR_ROLES,
  createGatedColorDeclarations,
} from './tokens.ts'
import type { MorainePresetTheme, PresetMoraineOptions } from './unocss.ts'

const DEFAULT_THEME_SHADOWS = {
  surface: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  overlay: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  input: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
} satisfies MorainePresetTheme['shadows']

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
    mix: base.mix || override?.mix ? { ...base.mix, ...override?.mix } : undefined,
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

export function resolveThemes(options: PresetMoraineOptions): ResolvedTheme[] {
  const light = options.override?.light
  const dark = options.override?.dark
  const lightSelector = light?.selector ?? ':root'
  const darkSelector = dark?.selector ?? '.dark'
  const shared: MorainePresetTheme = {
    radius: options.radius ?? '0.625rem',
    fontSize: options.fontSize ?? '1rem',
    spacing: options.spacing ?? '0.25rem',
    sidebarWidth: options.sidebarWidth,
    mix: options.mix,
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
    const defaultDark = mergeTheme(
      builtIn ? { colorScheme: 'dark', colors: DEFAULT_THEME_COLORS.dark } : {},
      { mix: options.mix },
    )
    themes.push([darkSelector, mergeTheme(defaultDark, dark)])
  }
  for (const [name, theme] of Object.entries(options.override ?? {})) {
    if (name !== 'light' && name !== 'dark' && theme) {
      themes.push([theme.selector ?? defaultSelector(name), theme])
    }
  }
  return themes
}

export function assertMixValue(value: unknown, label: string): string {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new RangeError(`[preset-moraine] ${label} must be a finite number between 0 and 100.`)
    }
    return `${value}%`
  }
  if (typeof value === 'string') {
    return value
  }
  if (value === null) {
    throw new TypeError(`[preset-moraine] ${label} cannot be null.`)
  }
  throw new TypeError(`[preset-moraine] ${label} must be a number or string.`)
}

export function createThemeCSS(themes: ResolvedTheme[]): string {
  const supportedCSS = `@supports (color: color-mix(in oklch, red, white)) {\n  *, ::before, ::after {\n${Object.entries(
    createGatedColorDeclarations(),
  )
    .map(([name, value]) => `    ${name}: ${value};`)
    .join('\n')}\n  }\n}`

  const themeCSS = themes
    .map(([selector, theme]) => {
      const declarations: string[] = []
      const emit = (name: string, value: string | undefined) => {
        if (value !== undefined) {
          declarations.push(`  --${name}: ${value};`)
        }
      }
      const palette = theme.colors as Record<string, unknown> | undefined
      for (const color of THEME_COLOR_ROLES) {
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
        if (typeof group.base === 'string') {
          emit(color, group.base)
        }
        if ('foreground' in schema && typeof group.foreground === 'string') {
          emit(`${color}-foreground`, group.foreground)
        }
        if ('hover' in schema && typeof group.hover === 'string') {
          emit(`${color}-hover`, group.hover)
        }
        if ('active' in schema && typeof group.active === 'string') {
          emit(`${color}-active`, group.active)
        }
        if ('ink' in schema && typeof group.ink === 'string') {
          emit(`${color}-ink`, group.ink)
        }
      }
      for (const shadow of Object.keys(MORAINE_SHADOW) as Array<keyof typeof MORAINE_SHADOW>) {
        emit(`shadow-${shadow}`, theme.shadows?.[shadow])
      }
      emit('radius', theme.radius)
      emit('font-size', theme.fontSize)
      emit('spacing', theme.spacing)
      emit('sidebar-width', theme.sidebarWidth)
      if (theme.mix) {
        for (const knob of ['hover', 'active', 'ink'] as const) {
          const val = theme.mix[knob]
          if (val !== undefined) {
            const validated = assertMixValue(val, `mix.${knob}`)
            declarations.push(`  --mo-mix-${knob}: ${validated};`)
          }
        }
      }
      if (theme.colorScheme !== undefined) {
        declarations.push(`  color-scheme: ${theme.colorScheme};`)
      }
      return declarations.length ? `${selector} {\n${declarations.join('\n')}\n}` : ''
    })
    .filter(Boolean)
    .join('\n\n')
  return [supportedCSS, themeCSS].filter(Boolean).join('\n\n')
}
