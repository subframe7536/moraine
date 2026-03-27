import type { Preset, SourceCodeTransformer } from 'unocss'

import { transformerInjectCompileClass } from './inject-compile-class'
import { transformerInjectPrefix } from './inject-prefix'
import type { TransformerInjectPrefixOption } from './inject-prefix'

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

export type ComponentLayerStrategy = 'hash' | 'prefix'

export interface ComponentLayerOptions extends Partial<
  Omit<TransformerInjectPrefixOption, 'prefix'>
> {
  /**
   * Controls how component-owned utilities are isolated from consumer utilities.
   *
   * - `prefix`: prefixes component utilities with `utilityPrefix` and keeps them in the
   *   dedicated `moraine-component` layer.
   * - `hash`: compiles component utilities into internal hash classes in the
   *   `moraine-component` layer.
   *
   * `prefix` is the default because it keeps the generated output readable while still
   * making component styles override-safe out of the box.
   *
   * @default 'prefix'
   */
  strategy?: ComponentLayerStrategy
  /**
   * Prefix used for component-owned utilities when `strategy` is `prefix`.
   * @default 'mr-'
   */
  utilityPrefix?: `${string}-`
}

export interface PresetThemeOptions extends Pick<TransformerInjectPrefixOption, 'beforeTransform'> {
  wind3?: boolean
  icons?: Partial<Record<keyof typeof DEFAULT_ICONS, string>>
  enableComponentLayer?: boolean | ComponentLayerOptions
}

const MORAINE_COMPONENT_LAYER = 'moraine-component'
const DEFAULT_COMPONENT_UTILITY_PREFIX = 'mr-'
const MORAINE_HASH_TRIGGER = ':uno-moraine:'
const MORAINE_HASH_CLASS_PREFIX = 'mrc-'
const MORAINE_ENTER_ANIMATION_NAME = 'moraine-enter'
const MORAINE_EXIT_ANIMATION_NAME = 'moraine-exit'
const MORAINE_ANIMATION_DURATION_VAR = 'var(--moraine-animation-duration,150ms)'
const ANIMATION_SIDES = ['top', 'right', 'bottom', 'left'] as const

const RE_ATTR = /^(data|aria)-(\w+):/
const CORE_ANIMATION_KEYFRAMES = {
  [MORAINE_ENTER_ANIMATION_NAME]:
    '{ from { opacity: var(--moraine-enter-opacity, 1); transform: translate3d(var(--moraine-enter-translate-x, 0), var(--moraine-enter-translate-y, 0), 0) scale3d(var(--moraine-enter-scale, 1), var(--moraine-enter-scale, 1), var(--moraine-enter-scale, 1)) rotate(var(--moraine-enter-rotate, 0)) } }',
  [MORAINE_EXIT_ANIMATION_NAME]:
    '{ to { opacity: var(--moraine-exit-opacity, 1); transform: translate3d(var(--moraine-exit-translate-x, 0), var(--moraine-exit-translate-y, 0), 0) scale3d(var(--moraine-exit-scale, 1), var(--moraine-exit-scale, 1), var(--moraine-exit-scale, 1)) rotate(var(--moraine-exit-rotate, 0)) } }',
  'accordion-down': '{ from { height: 0 } to { height: var(--kb-accordion-content-height) } }',
  'accordion-up': '{ from { height: var(--kb-accordion-content-height) } to { height: 0 } }',
  carousel: '{ 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }',
  'carousel-rtl': '{ 0% { transform: translateX(100%) } 100% { transform: translateX(-100%) } }',
  'carousel-vertical':
    '{ 0% { transform: translateY(100%) } 100% { transform: translateY(-100%) } }',
  swing: '{ 0%, 100% { transform: translateX(-60%) } 50% { transform: translateX(60%) } }',
  'swing-vertical':
    '{ 0%, 100% { transform: translateY(60%) } 50% { transform: translateY(-60%) } }',
  elastic:
    '{ 0% { transform: translateX(-100%) scaleX(0.9) } 45% { transform: translateX(0) scaleX(1) } 100% { transform: translateX(100%) scaleX(0.9) } }',
  'elastic-vertical':
    '{ 0% { transform: translateY(100%) scaleY(0.9) } 45% { transform: translateY(0) scaleY(1) } 100% { transform: translateY(-100%) scaleY(0.9) } }',
} as const
const LOOPING_PREFIXES = ['carousel', 'swing', 'elastic']

function getAnimType(name: string): 'moraine' | 'looping' | 'default' {
  if (name === MORAINE_ENTER_ANIMATION_NAME || name === MORAINE_EXIT_ANIMATION_NAME) {
    return 'moraine'
  }
  if (LOOPING_PREFIXES.some((p) => name.startsWith(p))) {
    return 'looping'
  }
  return 'default'
}

const CORE_ANIMATION_DURATIONS: Record<string, string> = {}
const CORE_ANIMATION_TIMING_FNS: Record<string, string> = {}
const CORE_ANIMATION_COUNTS: Record<string, string> = {}

for (const name of Object.keys(CORE_ANIMATION_KEYFRAMES)) {
  const type = getAnimType(name)
  CORE_ANIMATION_DURATIONS[name] =
    type === 'moraine' ? MORAINE_ANIMATION_DURATION_VAR : type === 'looping' ? '2s' : '150ms'
  CORE_ANIMATION_TIMING_FNS[name] = 'ease-in-out'
  CORE_ANIMATION_COUNTS[name] = type === 'looping' ? 'infinite' : '1'
}
type AnimationSide = (typeof ANIMATION_SIDES)[number]
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
  const inScale = config.scale ? ` [--moraine-enter-scale:${config.scale}]` : ''
  const outScale = config.scale ? ` [--moraine-exit-scale:${config.scale}]` : ''
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
              `[--moraine-enter-translate-${axis}:${value}] [--moraine-exit-translate-${axis}:${value}]`,
            ] as const
          }),
        )

  return {
    [`animate-${name}-in`]: `animate-${MORAINE_ENTER_ANIMATION_NAME} [--moraine-enter-opacity:0]${inScale}`,
    [`animate-${name}-out`]: `animate-${MORAINE_EXIT_ANIMATION_NAME} [--moraine-exit-opacity:0]${outScale}`,
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
      '[preset-theme-moraine] `enableComponentLayer.strategy: "hash"` requires `@unocss/transformer-compile-class`. Install it or switch to `strategy: "prefix"`.',
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

export function presetTheme(options?: PresetThemeOptions): Preset {
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

  const radius = {
    xs: `calc(var(--radius) * 0.5)`,
    sm: `calc(var(--radius) * 0.6)`,
    md: `calc(var(--radius) * 0.8)`,
    lg: `var(--radius)`,
    xl: `calc(var(--radius) * 1.4)`,
    '2xl': `calc(var(--radius) * 1.8)`,
    '3xl': `calc(var(--radius) * 2.2)`,
    '4xl': `calc(var(--radius) * 2.6)`,
  }

  const shadow = {
    '2xs': 'var(--shadow-2xs)',
    xs: 'var(--shadow-xs)',
    sm: 'var(--shadow-sm)',
    DEFAULT: 'var(--shadow)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
    xl: 'var(--shadow-xl)',
    '2xl': 'var(--shadow-2xl)',
  }

  const font = {
    sans: 'var(--font-sans)',
    mono: 'var(--font-mono)',
    serif: 'var(--font-serif)',
  }

  const themeSpacing = normalized.wind3
    ? { borderRadius: radius, boxShadow: shadow, fontFamily: font }
    : { radius, shadow, font }

  return {
    name: 'preset-theme-moraine',
    theme: {
      ...themeSpacing,
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: { DEFAULT: 'var(--primary)', foreground: 'var(--primary-foreground)' },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        card: { DEFAULT: 'var(--card)', foreground: 'var(--card-foreground)' },
        input: 'var(--input)',
        ring: 'var(--ring)',
        border: 'var(--border)',
        popover: { DEFAULT: 'var(--popover)', foreground: 'var(--popover-foreground)' },
        muted: { DEFAULT: 'var(--muted)', foreground: 'var(--muted-foreground)' },
        accent: { DEFAULT: 'var(--accent)', foreground: 'var(--accent-foreground)' },
        destructive: { DEFAULT: 'var(--destructive)', foreground: 'var(--destructive-foreground)' },
      },
      animation: {
        keyframes: CORE_ANIMATION_KEYFRAMES,
        timingFns: CORE_ANIMATION_TIMING_FNS,
        durations: CORE_ANIMATION_DURATIONS,
        counts: CORE_ANIMATION_COUNTS,
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
      ['effect-loading', 'cursor-wait opacity-80'],
      [
        'effect-invalid',
        'border-destructive ring-3 ring-destructive/20 dark:(border-destructive/50 ring-destructive/40)',
      ],
      ['animate-loading', 'animate-spin'],
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
      ['surface-outline', 'ring-1 ring-border'],
      ['surface-outline-inset', 'ring ring-inset ring-border'],
      ['surface-highlight', 'ring-1 ring-border/50'],
      ['surface-overlay', 'ring-1 ring-foreground/10'],
      ['hidden-hitless', 'opacity-0 pointer-events-none'],
      ...Object.entries(SEMANTIC_ANIMATION_SHORTCUTS).map(
        ([name, value]) => [name, value] as [string, string],
      ),
      ...Object.entries(DEFAULT_ICONS).map(
        ([k, v]) =>
          [`icon-${k.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`, v] as [string, string],
      ),
    ],
    rules: [
      [
        /var-input-([\d.]+)/,
        ([, num], { theme }) => ({
          '--i-sm': createLength(theme, num),
          '--i-lg': createLength(theme, Number(num) + 1),
        }),
      ],
      [
        /var-progress-([\d.]+)/,
        ([, num], { theme }) => ({
          '--p-size': createLength(theme, num),
        }),
      ],
      [
        /var-select-([\d.]+)/,
        ([, num], { theme }) => ({
          '--s-p': createLength(theme, num),
          '--s-m': createLength(theme, Number(num) + 3.5),
        }),
      ],
      [
        /var-stepper-([\d.]+)-([\d.]+)-([\d.]+)-([\d.]+)/,
        ([, triggerSize, separatorOffset, gap, verticalPt], { theme }) => ({
          '--st-size': createLength(theme, triggerSize),
          '--st-sep-x': createLength(theme, separatorOffset),
          '--st-sep-top': createLength(theme, Number(triggerSize) + 1),
          '--st-gap': createLength(theme, gap),
          '--st-pt': createLength(theme, verticalPt),
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
