import type { Preset, SourceCodeTransformer } from '@subf/unocss'

import {
  MORAINE_ANIM_DUR_VAR_ENTER,
  MORAINE_ANIM_DUR_VAR_EXIT,
  MORAINE_EASE_IN,
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
} from '../shared/style/theme.ts'

import { transformerInjectCompileClass } from './inject-compile-class.ts'
import { transformerInjectPrefix } from './inject-prefix.ts'
import type { TransformerInjectPrefixOption } from './inject-prefix.ts'

export { DEFAULT_ICONS, DEFAULT_ICON_SHORTCUTS }

export type ComponentLayerStrategy = 'hash' | 'prefix'

export interface ComponentLayerOptions extends Partial<
  Omit<TransformerInjectPrefixOption, 'prefix'>
> {
  /**
   * Controls how component-owned utilities are isolated from consumer utilities.
   *
   * - `prefix`: prefixes component utilities with `utilityPrefix` and keeps them in the
   *   dedicated `mo-component` layer.
   * - `hash`: compiles component utilities into internal hash classes in the
   *   `mo-component` layer.
   *
   * `prefix` is the default because it keeps the generated output readable while still
   * making component styles override-safe out of the box.
   *
   * @default 'prefix'
   */
  strategy?: ComponentLayerStrategy
  /**
   * Prefix used for component-owned utilities when `strategy` is `prefix`.
   * @default 'mo-'
   */
  utilityPrefix?: `${string}-`
}

export interface PresetThemeOptions extends Pick<TransformerInjectPrefixOption, 'beforeTransform'> {
  /**
   * Controls whether to inject global styles for CSS variables and base styles.
   */
  globalStyles?: boolean
  wind3?: boolean
  icons?: Partial<Record<keyof typeof DEFAULT_ICONS, string>>
  enableComponentLayer?: boolean | ComponentLayerOptions
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

const MORAINE_COMPONENT_LAYER = 'mo-component'
const DEFAULT_COMPONENT_UTILITY_PREFIX = 'mo-'
const MORAINE_HASH_TRIGGER = ':uno-mo:'
const MORAINE_HASH_CLASS_PREFIX = 'moc-'
const ANIMATION_SIDES = ['top', 'right', 'bottom', 'left'] as const
type AnimationSide = (typeof ANIMATION_SIDES)[number]
const MORAINE_ENTER_ANIMATION_NAME = 'mo-enter'
const MORAINE_EXIT_ANIMATION_NAME = 'mo-exit'
const RE_ATTR = /^(data|aria)-(\w+):/
type SemanticAnimationTarget = 'overlay' | 'popup' | 'menu' | 'popover' | 'tooltip' | 'sheet'

const ANIMATION_SIDE_AXES: Record<AnimationSide, 'x' | 'y'> = {
  top: 'y',
  right: 'x',
  bottom: 'y',
  left: 'x',
}

const ANIMATION_SIDE_SIGNS: Record<AnimationSide, '' | '-'> = {
  top: '-',
  right: '',
  bottom: '',
  left: '-',
}

const ANIMATION_SIDE_OPPOSITES: Record<AnimationSide, AnimationSide> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
}

interface SemanticAnimationConfig {
  offsetRem?: string
  scale?: string
  oppositeSide?: boolean
  withSide?: boolean
}

const SEMANTIC_ANIMATION_CONFIGS: Record<SemanticAnimationTarget, SemanticAnimationConfig> = {
  overlay: { withSide: false },
  popup: { scale: '0.95', withSide: false },
  menu: { offsetRem: '0.5', scale: '0.95', oppositeSide: true },
  popover: { offsetRem: '0.5', scale: '0.95', oppositeSide: true },
  tooltip: { offsetRem: '0.25', scale: '0.95', oppositeSide: true },
  sheet: { offsetRem: '2.5' },
}

function createSemanticAnimationShortcuts(
  name: SemanticAnimationTarget,
  config: SemanticAnimationConfig,
): Record<string, string> {
  const inScale = config.scale ? ` [--mo-enter-scale:${config.scale}]` : ''
  const outScale = config.scale ? ` [--mo-exit-scale:${config.scale}]` : ''
  const sideShortcuts =
    config.withSide === false || !config.offsetRem
      ? {}
      : Object.fromEntries(
          ANIMATION_SIDES.map((side) => {
            const motionSide = config.oppositeSide ? ANIMATION_SIDE_OPPOSITES[side] : side
            const axis = ANIMATION_SIDE_AXES[motionSide]
            const sign = ANIMATION_SIDE_SIGNS[motionSide]
            const value = `${sign}${config.offsetRem}rem`
            return [
              `animate-${name}-side-${side}`,
              `[--mo-enter-translate-${axis}:${value}] [--mo-exit-translate-${axis}:${value}]`,
            ] as const
          }),
        )

  return {
    [`animate-${name}-in`]: `animate-${MORAINE_ENTER_ANIMATION_NAME} [--mo-enter-opacity:0]${inScale}`,
    [`animate-${name}-out`]: `animate-${MORAINE_EXIT_ANIMATION_NAME} [--mo-exit-opacity:0]${outScale}`,
    ...sideShortcuts,
  }
}

const SEMANTIC_ANIMATION_SHORTCUTS: Record<string, string> = {
  ...createSemanticAnimationShortcuts('overlay', SEMANTIC_ANIMATION_CONFIGS.overlay),
  ...createSemanticAnimationShortcuts('popup', SEMANTIC_ANIMATION_CONFIGS.popup),
  ...createSemanticAnimationShortcuts('menu', SEMANTIC_ANIMATION_CONFIGS.menu),
  ...createSemanticAnimationShortcuts('popover', SEMANTIC_ANIMATION_CONFIGS.popover),
  ...createSemanticAnimationShortcuts('tooltip', SEMANTIC_ANIMATION_CONFIGS.tooltip),
  ...createSemanticAnimationShortcuts('sheet', SEMANTIC_ANIMATION_CONFIGS.sheet),
}

const TRANSITION_ANIMATION_SHORTCUTS: Record<string, string> = {
  'transition-mo-enter': [
    `[transition-duration:${MORAINE_ANIM_DUR_VAR_ENTER}]`,
    `[transition-timing-function:${MORAINE_EASE_OUT.replaceAll(' ', '')}]`,
  ].join(' '),
  'transition-mo-exit': [
    `[transition-duration:${MORAINE_ANIM_DUR_VAR_EXIT}]`,
    `[transition-timing-function:${MORAINE_EASE_IN.replaceAll(' ', '')}]`,
  ].join(' '),
}

interface ResolvedPresetThemeOptions {
  wind3: boolean
  globalStyles: boolean
  colorVariables?: MoraineColorVariablesOptions & {
    darkSelector: string
    lightSelector: string
  }
  icons: Partial<Record<keyof typeof DEFAULT_ICONS, string>>
  enableComponentLayer: boolean
  strategy: ComponentLayerStrategy
  utilityPrefix: `${string}-`
  idFilter: (id: string) => boolean
  beforeTransform?: TransformerInjectPrefixOption['beforeTransform']
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
        const state = key as MoraineColorState
        const stateValue = configuredGroup[state]

        if (
          stateValue !== undefined &&
          typeof stateValue !== 'string' &&
          typeof stateValue !== 'number' &&
          typeof stateValue !== 'function'
        ) {
          throw new TypeError(
            `[preset-moraine] ${color}.${state} must be a CSS string, percentage, or resolver function.`,
          )
        }

        const value = resolveColorStateValue({
          adjustment:
            state === 'hover'
              ? options.adjustment.hoverAdjustment
              : options.adjustment.activeAdjustment,
          base,
          color: color as MoraineGroupedColorName,
          foreground,
          foregroundReference,
          selector: options.selector,
          state,
          theme: options.theme,
          value: stateValue as MoraineColorStateValue | undefined,
        })

        if (value !== undefined) {
          declarations.push(`${getColorVariableName(color, state)}: ${value};`)
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

let compileClassTransformerPromise: Promise<SourceCodeTransformer> | undefined

async function loadHashClassTransformer(): Promise<SourceCodeTransformer> {
  if (compileClassTransformerPromise) {
    return compileClassTransformerPromise
  }

  const tryLoad = async (): Promise<SourceCodeTransformer> => {
    const transformerCompileClassOptions = {
      trigger: MORAINE_HASH_TRIGGER,
      classPrefix: MORAINE_HASH_CLASS_PREFIX,
      layer: MORAINE_COMPONENT_LAYER,
    }
    // 1. Try @subf/unocss (named export)
    try {
      const { transformerCompileClass } = await import('@subf/unocss')
      return transformerCompileClass(transformerCompileClassOptions)
    } catch {}

    // 2. Try unocss (named export)
    try {
      const unocssPackage = 'unocss'
      const { transformerCompileClass } = await import(unocssPackage)
      return transformerCompileClass(transformerCompileClassOptions)
    } catch {}

    // 3. Try @unocss/transformer-compile-class (default export)
    try {
      const transformerPackage = '@unocss/transformer-compile-class'
      const { default: transformerCompileClass } = await import(transformerPackage)
      return transformerCompileClass(transformerCompileClassOptions)
    } catch {}

    throw new Error(
      '[preset-moraine] `enableComponentLayer.strategy: "hash"` requires `@unocss/transformer-compile-class`. Install it or switch to `strategy: "prefix"`.',
    )
  }

  compileClassTransformerPromise = tryLoad()
  try {
    return await compileClassTransformerPromise
  } catch (error) {
    compileClassTransformerPromise = undefined
    throw error
  }
}

function createHashClassTransformer(idFilter: (id: string) => boolean): SourceCodeTransformer {
  return {
    name: 'transformer-moraine-hash-class',
    enforce: 'pre',
    idFilter,
    async transform(code, id, context) {
      const transformer = await loadHashClassTransformer()

      return transformer.transform?.(code, id, context)
    },
  }
}

export function resolvePresetThemeOptions(
  options?: PresetThemeOptions,
): ResolvedPresetThemeOptions {
  const raw = options?.enableComponentLayer ?? false
  const layerOpts: ComponentLayerOptions | undefined =
    typeof raw === 'object' && raw !== null ? raw : raw ? {} : undefined

  return {
    wind3: options?.wind3 ?? false,
    icons: options?.icons ?? {},
    enableComponentLayer: layerOpts !== undefined,
    strategy: layerOpts?.strategy ?? 'prefix',
    utilityPrefix: layerOpts?.utilityPrefix ?? DEFAULT_COMPONENT_UTILITY_PREFIX,
    idFilter: layerOpts?.idFilter ?? ((id: string) => id.includes('node_modules/moraine/')),
    beforeTransform: layerOpts?.beforeTransform ?? options?.beforeTransform,
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

  const isHash = normalized.strategy === 'hash'
  const transformers: Preset['transformers'] =
    normalized.enableComponentLayer && isHash
      ? [
          transformerInjectCompileClass({
            trigger: MORAINE_HASH_TRIGGER,
            idFilter: normalized.idFilter,
            beforeTransform: normalized.beforeTransform,
          }),
          createHashClassTransformer(normalized.idFilter),
        ]
      : normalized.enableComponentLayer
        ? [
            transformerInjectPrefix({
              prefix: normalized.utilityPrefix,
              idFilter: normalized.idFilter,
              beforeTransform: normalized.beforeTransform,
            }),
          ]
        : []

  const usePrefixLayer = normalized.enableComponentLayer && normalized.strategy === 'prefix'
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
    ...(usePrefixLayer
      ? [
          (matcher: string) => {
            if (!matcher.startsWith(normalized.utilityPrefix)) {
              return matcher
            }
            return {
              matcher: matcher.slice(normalized.utilityPrefix.length),
              layer: MORAINE_COMPONENT_LAYER,
            }
          },
        ]
      : []),
  ]

  function createLength(theme: { spacing?: any }, num: string | number) {
    const base = normalized.wind3 ? (theme.spacing?.[0] ?? '0.25rem') : 'var(--spacing)'
    return `calc(${base} * ${num})`
  }

  const themeSpacing = normalized.wind3
    ? {
        borderRadius: MORAINE_RADIUS,
        boxShadow: MORAINE_SHADOW,
        fontFamily: MORAINE_FONT,
        width: MORAINE_WIDTH,
      }
    : { radius: MORAINE_RADIUS, shadow: MORAINE_SHADOW, font: MORAINE_FONT, spacing: MORAINE_WIDTH }

  return {
    name: 'preset-theme-moraine',
    theme: {
      ...themeSpacing,
      colors: MORAINE_COLORS,
      animation: {
        keyframes: toUnocssKeyframes(),
        timingFns: getMoraineAnimTimingFns(),
        durations: getMoraineAnimDurations(),
        counts: getMoraineAnimCounts(),
      },
    },
    layers: {
      [MORAINE_COMPONENT_LAYER]: -1,
      default: 1,
    },
    transformers,
    variants,
    shortcuts: [
      ['effect-fv', 'outline-none ring-3px ring-ring/50'],
      ['effect-fv-border', 'outline-none border-ring ring-3px ring-ring/50'],
      ['effect-dis', 'opacity-64 pointer-events-none'],
      ['effect-loading', 'cursor-wait opacity-80 animate-spin'],
      [
        'effect-invalid',
        'border-destructive ring-3px ring-destructive/20 dark:(border-destructive/50 ring-destructive/40)',
      ],
      ['transition-bg', '[transition-property:background-color]'],
      ['style-placeholder', 'placeholder:(text-muted-foreground select-none)'],
      [
        'style-input-number',
        '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
      ],
      [
        'style-accordion-content',
        '[&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4',
      ],
      ['surface-border', 'border border-border'],
      ['surface-overlay', 'border border-border shadow-md'],
      ['hidden-hitless', 'opacity-0 pointer-events-none'],
      ['rm-side-b', '[&>[data-slot=sidebar]]:border-0!'],
      ...Object.entries(SEMANTIC_ANIMATION_SHORTCUTS).map(
        ([name, value]) => [name, value] as [string, string],
      ),
      ...Object.entries(TRANSITION_ANIMATION_SHORTCUTS).map(
        ([name, value]) => [name, value] as [string, string],
      ),
      ...DEFAULT_ICON_SHORTCUTS,
    ],
    rules: [
      [
        /var-input-([\d.]+)/,
        ([, num], { theme }) => ({
          '--i-sm': createLength(theme, num!),
          '--i-lg': createLength(theme, Number(num) + 1),
        }),
      ],
      [
        /var-progress-([\d.]+)/,
        ([, num], { theme }) => ({
          '--p-size': createLength(theme, num!),
        }),
      ],
      [
        /var-select-([\d.]+)/,
        ([, num], { theme }) => ({
          '--s-p': createLength(theme, num!),
          '--s-m': createLength(theme, Number(num) + 3.5),
        }),
      ],
      [
        /var-stepper-([\d.]+)-([\d.]+)-([\d.]+)-([\d.]+)/,
        ([, triggerSize, separatorOffset, gap, verticalPt], { theme }) => ({
          '--st-size': createLength(theme, triggerSize!),
          '--st-sep-x': createLength(theme, separatorOffset!),
          '--st-sep-top': createLength(theme, Number(triggerSize) + 1),
          '--st-gap': createLength(theme, gap!),
          '--st-pt': createLength(theme, verticalPt!),
        }),
      ],
      [
        /var-slider-([\d.]+)/,
        ([, num]) => ({
          '--s-size': `${num}px`,
        }),
      ],
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
