import type { Preset } from '@subf/unocss'

import {
  MORAINE_ANIM_DUR_VAR_ENTER,
  MORAINE_EASE_OUT,
  getMoraineAnimCounts,
  getMoraineAnimDurations,
  getMoraineAnimTimingFns,
  toUnocssKeyframes,
} from '../shared/style/animations.ts'
import { DEFAULT_ICONS, DEFAULT_ICON_SHORTCUTS } from '../shared/style/icons.ts'
import {
  MORAINE_COLORS,
  MORAINE_FONT,
  MORAINE_RADIUS,
  MORAINE_SHADOW,
  MORAINE_WIDTH,
  MORAINE_Z_INDEX,
} from '../shared/style/theme.ts'

export { DEFAULT_ICONS, DEFAULT_ICON_SHORTCUTS }

export interface PresetThemeOptions {
  /**
   * Controls whether to inject default global styles for CSS variables and base styles.
   */
  globalStyles?: boolean
  /**
   * Generates semantic color CSS variables from the grouped `MORAINE_COLORS` shape.
   * No color variables are emitted when this option is omitted.
   */
  colorVariables?: MoraineColorVariablesOptions
}

type MoraineColorMap = typeof MORAINE_COLORS

export type MoraineColorState = 'hover' | 'active'
export type MoraineColorTheme = 'light' | 'dark'
export type MoraineGroupedColorName = {
  [TName in keyof MoraineColorMap]: MoraineColorMap[TName] extends string ? never : TName
}[keyof MoraineColorMap]

export interface MoraineColorStateResolverContext {
  adjustment?: number
  base: string
  color: MoraineGroupedColorName
  foreground: string
  selector: string
  state: MoraineColorState
  theme: MoraineColorTheme
}

export type MoraineColorStateValue =
  | string
  | number
  | ((context: MoraineColorStateResolverContext) => string)

type MoraineColorVariableEntry<TEntry> = TEntry extends string
  ? string
  : {
      [TKey in keyof TEntry]?: TKey extends MoraineColorState ? MoraineColorStateValue : string
    }

export type MoraineColorVariables = {
  [TName in keyof MoraineColorMap]?: MoraineColorVariableEntry<MoraineColorMap[TName]>
}

export interface MoraineColorVariablesOptions {
  activeAdjustment?: number
  dark?: MoraineColorVariables
  /** @default '.dark' */
  darkSelector?: string
  hoverAdjustment?: number
  light?: MoraineColorVariables
  /** @default ':root' */
  lightSelector?: string
}

const RE_ATTR = /^(data|aria)-(\w+):/

interface ResolvedPresetThemeOptions {
  globalStyles: boolean
  colorVariables?: MoraineColorVariablesOptions & {
    darkSelector: string
    lightSelector: string
  }
}

function assertColorAdjustment(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new RangeError(`[preset-moraine] ${label} must be a finite number between 0 and 100.`)
  }
}

function getColorVariableName(color: string, key?: string): string {
  return key === undefined || key === 'DEFAULT' ? `--${color}` : `--${color}-${key}`
}

function getColorReference(color: string, key?: string): string {
  return `var(${getColorVariableName(color, key)})`
}

function resolveColorStateValue(options: {
  adjustment?: number
  base: string
  color: MoraineGroupedColorName
  foreground: string
  foregroundReference: string
  selector: string
  state: MoraineColorState
  theme: MoraineColorTheme
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
      theme: options.theme,
    })
  }

  if (adjustment === undefined) {
    return undefined
  }

  assertColorAdjustment(adjustment, `${options.color}.${options.state} adjustment`)
  return `color-mix(in oklch, ${getColorReference(options.color)}, ${options.foregroundReference} ${adjustment}%)`
}

function createColorVariableDeclarations(options: {
  adjustment: Pick<MoraineColorVariablesOptions, 'activeAdjustment' | 'hoverAdjustment'>
  palette?: MoraineColorVariables
  selector: string
  theme: MoraineColorTheme
}): string[] {
  if (!options.palette) {
    return []
  }

  const declarations: string[] = []
  const palette = options.palette as Record<string, unknown>

  for (const color of Object.keys(MORAINE_COLORS) as Array<keyof MoraineColorMap>) {
    const schemaEntry = MORAINE_COLORS[color]
    const configuredEntry = palette[color]

    if (typeof schemaEntry === 'string') {
      if (typeof configuredEntry === 'string') {
        declarations.push(`${getColorVariableName(color)}: ${configuredEntry};`)
      }
      continue
    }

    if (!configuredEntry || typeof configuredEntry !== 'object') {
      continue
    }

    const configuredGroup = configuredEntry as Record<string, unknown>
    const base =
      typeof configuredGroup.DEFAULT === 'string'
        ? configuredGroup.DEFAULT
        : getColorReference(color)
    const foreground =
      'foreground' in schemaEntry
        ? typeof configuredGroup.foreground === 'string'
          ? configuredGroup.foreground
          : getColorReference(color, 'foreground')
        : typeof palette.foreground === 'string'
          ? palette.foreground
          : getColorReference('foreground')
    const foregroundReference =
      'foreground' in schemaEntry
        ? getColorReference(color, 'foreground')
        : getColorReference('foreground')

    for (const key of Object.keys(schemaEntry)) {
      if (key === 'hover' || key === 'active') {
        const stateValue = configuredGroup[key]

        if (
          stateValue !== undefined &&
          typeof stateValue !== 'string' &&
          typeof stateValue !== 'number' &&
          typeof stateValue !== 'function'
        ) {
          throw new TypeError(
            `[preset-moraine] ${color}.${key} must be a CSS string, percentage, or resolver function.`,
          )
        }

        const value = resolveColorStateValue({
          adjustment:
            key === 'hover'
              ? options.adjustment.hoverAdjustment
              : options.adjustment.activeAdjustment,
          base,
          color: color as MoraineGroupedColorName,
          foreground,
          foregroundReference,
          selector: options.selector,
          state: key,
          theme: options.theme,
          value: stateValue as MoraineColorStateValue | undefined,
        })

        if (value !== undefined) {
          declarations.push(`${getColorVariableName(color, key)}: ${value};`)
        }
        continue
      }

      const value = configuredGroup[key]
      if (typeof value === 'string') {
        declarations.push(`${getColorVariableName(color, key)}: ${value};`)
      }
    }
  }

  return declarations
}

function createColorVariablesCSS(options?: ResolvedPresetThemeOptions['colorVariables']): string {
  if (!options) {
    return ''
  }

  if (options.hoverAdjustment !== undefined) {
    assertColorAdjustment(options.hoverAdjustment, 'colorVariables.hoverAdjustment')
  }
  if (options.activeAdjustment !== undefined) {
    assertColorAdjustment(options.activeAdjustment, 'colorVariables.activeAdjustment')
  }

  const adjustment = {
    activeAdjustment: options.activeAdjustment,
    hoverAdjustment: options.hoverAdjustment,
  }
  const themes: Array<{
    palette?: MoraineColorVariables
    selector: string
    theme: MoraineColorTheme
  }> = [
    { palette: options.light, selector: options.lightSelector, theme: 'light' },
    { palette: options.dark, selector: options.darkSelector, theme: 'dark' },
  ]

  return themes
    .map(({ palette, selector, theme }) => {
      const declarations = createColorVariableDeclarations({
        adjustment,
        palette,
        selector,
        theme,
      })
      if (declarations.length === 0) {
        return ''
      }
      return `${selector} {\n${declarations.map((declaration) => `  ${declaration}`).join('\n')}\n}`
    })
    .filter(Boolean)
    .join('\n\n')
}

export function resolvePresetThemeOptions(
  options?: PresetThemeOptions,
): ResolvedPresetThemeOptions {
  return {
    globalStyles: options?.globalStyles ?? true,
    colorVariables: options?.colorVariables
      ? {
          ...options.colorVariables,
          darkSelector: options.colorVariables.darkSelector ?? '.dark',
          lightSelector: options.colorVariables.lightSelector ?? ':root',
        }
      : undefined,
  }
}

export function presetMoraine(options?: PresetThemeOptions): Preset {
  const normalized = resolvePresetThemeOptions(options)
  const colorVariablesCSS = createColorVariablesCSS(normalized.colorVariables)
  const variants: Preset['variants'] = [
    (matcher) => {
      const match = matcher.match(RE_ATTR)
      if (!match) {
        return matcher
      }
      return {
        matcher: matcher.slice(match[0].length),
        selector: (s) => `${s}[${match[1]}-${match[2]}]`,
      }
    },
  ]

  return {
    name: 'preset-theme-moraine',
    theme: {
      radius: MORAINE_RADIUS,
      shadow: MORAINE_SHADOW,
      font: MORAINE_FONT,
      spacing: MORAINE_WIDTH,
      zIndex: MORAINE_Z_INDEX,
      default: {
        transition: {
          duration: MORAINE_ANIM_DUR_VAR_ENTER,
          timingFunction: MORAINE_EASE_OUT,
        },
      },
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
      ...Object.entries(MORAINE_Z_INDEX).map(
        ([name, value]) => [`z-${name}`, `z-${value}`] as [string, string],
      ),
      ...DEFAULT_ICON_SHORTCUTS,
    ],
    preflights: [
      {
        getCSS: () => colorVariablesCSS,
      },
      {
        getCSS: () =>
          normalized.globalStyles
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
