import type { Preset, SourceCodeTransformer } from '@unocss/core'

import {
  getMoraineAnimCounts,
  getMoraineAnimDurations,
  getMoraineAnimTimingFns,
  toUnocssKeyframes,
} from '../shared/style/animations'
import { DEFAULT_ICONS, DEFAULT_ICON_SHORTCUTS } from '../shared/style/icons'
import { MORAINE_COLORS, MORAINE_FONT, MORAINE_RADIUS, MORAINE_SHADOW } from '../shared/style/theme'

import { transformerInjectCompileClass } from './inject-compile-class'
import { transformerInjectPrefix } from './inject-prefix'
import type { TransformerInjectPrefixOption } from './inject-prefix'

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
  wind3?: boolean
  icons?: Partial<Record<keyof typeof DEFAULT_ICONS, string>>
  enableComponentLayer?: boolean | ComponentLayerOptions
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
  popup: { scale: '0.9', withSide: false },
  menu: { offsetRem: '0.5', scale: '0.9', oppositeSide: true },
  popover: { offsetRem: '0.5', scale: '0.9', oppositeSide: true },
  tooltip: { offsetRem: '0.25', scale: '0.9', oppositeSide: true },
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
interface ResolvedPresetThemeOptions {
  wind3: boolean
  icons: Partial<Record<keyof typeof DEFAULT_ICONS, string>>
  enableComponentLayer: boolean
  strategy: ComponentLayerStrategy
  utilityPrefix: `${string}-`
  idFilter: (id: string) => boolean
  beforeTransform?: TransformerInjectPrefixOption['beforeTransform']
}

let compileClassTransformerPromise: Promise<SourceCodeTransformer> | undefined

async function loadHashClassTransformer(): Promise<SourceCodeTransformer> {
  try {
    compileClassTransformerPromise ??= import('@unocss/transformer-compile-class').then(
      ({ default: transformerCompileClass }) =>
        transformerCompileClass({
          trigger: MORAINE_HASH_TRIGGER,
          classPrefix: MORAINE_HASH_CLASS_PREFIX,
          layer: MORAINE_COMPONENT_LAYER,
        }),
    )

    return await compileClassTransformerPromise
  } catch (error) {
    compileClassTransformerPromise = undefined

    throw new Error(
      '[preset-moraine] `enableComponentLayer.strategy: "hash"` requires `@unocss/transformer-compile-class`. Install it or switch to `strategy: "prefix"`.',
      { cause: error },
    )
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
  }
}

export function presetMoraine(options?: PresetThemeOptions): Preset {
  const normalized = resolvePresetThemeOptions(options)

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
    ? { borderRadius: MORAINE_RADIUS, boxShadow: MORAINE_SHADOW, fontFamily: MORAINE_FONT }
    : { radius: MORAINE_RADIUS, shadow: MORAINE_SHADOW, font: MORAINE_FONT }

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
      ['effect-fv', 'outline-none ring-3px ring-ring/30'],
      ['effect-fv-border', 'outline-none border-ring ring-3px ring-ring/30'],
      ['effect-dis', 'opacity-64 pointer-events-none'],
      ['effect-loading', 'cursor-wait opacity-80 animate-spin'],
      [
        'effect-invalid',
        'border-destructive ring-3 ring-destructive/20 dark:(border-destructive/50 ring-destructive/40)',
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
      ['surface-border', 'b-(1 border)'],
      ['surface-overlay', 'ring-1 ring-foreground/10'],
      ['hidden-hitless', 'opacity-0 pointer-events-none'],
      ['rm-side-b', '[&>[data-slot=sidebar]]:b-0!'],
      ...Object.entries(SEMANTIC_ANIMATION_SHORTCUTS).map(
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
  }
}
