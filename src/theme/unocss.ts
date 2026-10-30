import type { Preset, PresetWind3Theme, PresetWind4Theme } from '@subf/unocss'

import { getMoraineAnimations, MORAINE_KEYFRAMES } from './animations.ts'
import { DEFAULT_ICON_SHORTCUTS } from './icons.ts'
import type { PresetMoraineOptions } from './theme-types.ts'
import {
  MORAINE_COLORS,
  MORAINE_FONT,
  MORAINE_RADIUS,
  MORAINE_SHADOW,
  MORAINE_TEXT_SIZE,
  MORAINE_WIDTH,
  MORAINE_Z_INDEX,
} from './tokens.ts'
import { createThemeCSS, resolveThemes } from './unocss-theme.ts'

type UtilityTheme = PresetWind3Theme & PresetWind4Theme

export type {
  MoraineMixConfig,
  MoraineMixKnob,
  MorainePresetTheme,
  MoraineThemeColors,
  PresetMoraineOptions,
} from './theme-types.ts'
export type { MoraineThemeColorRole } from './tokens.ts'

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
  const themeCSS = createThemeCSS(resolveThemes(options))
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
          /^(.+?)-(background|foreground|primary|secondary|neutral|card|popover|muted|accent|danger|info|success|warning|border|input|control|ring|tone)(?:-(foreground|hover|active|ink))?\/(\d+(?:\.\d+)?|\[[^\]]+\])$/,
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
        }
      },
    })
    // Wind4 and Tailwind ship `forced-colors:`; Wind3 does not.
    variants.push({
      name: 'moraine-forced-colors',
      match(matcher) {
        if (!matcher.startsWith('forced-colors:')) {
          return matcher
        }
        return {
          matcher: matcher.slice('forced-colors:'.length),
          parent: '@media (forced-colors: active)',
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
  if (options.wind3) {
    // Wind4 and Tailwind ship `forced-color-adjust-*`; Wind3 does not.
    rules.push([
      /^forced-color-adjust-(auto|none)$/,
      ([, value]) => ({ 'forced-color-adjust': value }),
      { autocomplete: ['forced-color-adjust-(auto|none)'] },
    ])
  }
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
