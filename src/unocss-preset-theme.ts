import type { Preset, SourceCodeTransformer } from 'unocss'

import { transformerInjectCompileClass } from './unocss-transformer/inject-compile-class'
import { transformerInjectPrefix } from './unocss-transformer/inject-prefix'
import type { TransformerInjectPrefixOption } from './unocss-transformer/inject-prefix'

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
   *   dedicated `flint-component` layer.
   * - `hash`: compiles component utilities into internal hash classes in the
   *   `flint-component` layer.
   *
   * `prefix` is the default because it keeps the generated output readable while still
   * making component styles override-safe out of the box.
   *
   * @default 'prefix'
   */
  strategy?: ComponentLayerStrategy
  /**
   * Prefix used for component-owned utilities when `strategy` is `prefix`.
   * @default 'fl-'
   */
  utilityPrefix?: `${string}-`
}

export interface PresetThemeOptions extends Pick<TransformerInjectPrefixOption, 'beforeTransform'> {
  wind3?: boolean
  icons?: Partial<Record<keyof typeof DEFAULT_ICONS, string>>
  enableComponentLayer?: boolean | ComponentLayerOptions
}

const FLINT_COMPONENT_LAYER = 'flint-component'
const DEFAULT_COMPONENT_UTILITY_PREFIX = 'fl-'
const FLINT_HASH_TRIGGER = ':uno-flint:'
const FLINT_HASH_CLASS_PREFIX = 'flc-'

const RE_ATTR = /^(data|aria)-(\w+):/
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
          trigger: FLINT_HASH_TRIGGER,
          classPrefix: FLINT_HASH_CLASS_PREFIX,
          layer: FLINT_COMPONENT_LAYER,
        }),
    )

    return await compileClassTransformerPromise
  } catch (error) {
    compileClassTransformerPromise = undefined

    throw new Error(
      '[preset-theme-flint] `enableComponentLayer.strategy: "hash"` requires `@unocss/transformer-compile-class`. Install it or switch to `strategy: "prefix"`.',
      { cause: error },
    )
  }
}

function createHashClassTransformer(idFilter: (id: string) => boolean): SourceCodeTransformer {
  return {
    name: 'transformer-flint-hash-class',
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
  const layerOpt = options?.enableComponentLayer ?? false
  const isObj = typeof layerOpt === 'object' && layerOpt !== null

  let enableComponentLayer = false
  let strategy: ComponentLayerStrategy = 'prefix'
  let utilityPrefix: `${string}-` = DEFAULT_COMPONENT_UTILITY_PREFIX

  if (isObj) {
    enableComponentLayer = true
    strategy = layerOpt.strategy ?? 'prefix'
    utilityPrefix = layerOpt.utilityPrefix ?? DEFAULT_COMPONENT_UTILITY_PREFIX
  } else if (layerOpt) {
    enableComponentLayer = true
  }

  return {
    wind3: options?.wind3 ?? false,
    icons: options?.icons ?? {},
    enableComponentLayer,
    strategy,
    utilityPrefix,
    idFilter:
      (isObj && layerOpt.idFilter) || ((id: string) => id.includes('node_modules/flint-ui/')),
    beforeTransform: (isObj && layerOpt.beforeTransform) || options?.beforeTransform,
  }
}

export function presetTheme(options?: PresetThemeOptions): Preset {
  const normalized = resolvePresetThemeOptions(options)

  const transformers: Preset['transformers'] = []
  if (normalized.enableComponentLayer) {
    if (normalized.strategy === 'hash') {
      transformers.push(createHashClassTransformer(normalized.idFilter))
      transformers.unshift(
        transformerInjectCompileClass({
          trigger: FLINT_HASH_TRIGGER,
          idFilter: normalized.idFilter,
          beforeTransform: normalized.beforeTransform,
        }),
      )
    } else {
      transformers.push(
        transformerInjectPrefix({
          prefix: normalized.utilityPrefix,
          idFilter: normalized.idFilter,
          beforeTransform: normalized.beforeTransform,
        }),
      )
    }
  }

  const variants: Preset['variants'] = [
    (matcher) => {
      const match = matcher.match(RE_ATTR)
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
  ]

  if (normalized.enableComponentLayer && normalized.strategy === 'prefix') {
    variants.push((matcher) => {
      if (!matcher.startsWith(normalized.utilityPrefix)) {
        return matcher
      }

      return {
        matcher: matcher.slice(normalized.utilityPrefix.length),
        layer: FLINT_COMPONENT_LAYER,
      }
    })
  }

  function createLength(theme: { spacing?: any }, num: string | number) {
    return `calc(${normalized.wind3 ? (theme.spacing?.[0] ?? '0.25rem') : 'var(--spacing)'} * ${num})`
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

  return {
    name: 'preset-theme-flint',
    theme: {
      ...(normalized.wind3
        ? { borderRadius: radius, boxShadow: shadow, fontFamily: font }
        : { radius, shadow, font }),
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
        keyframes: {
          'accordion-down':
            '{ from { height: 0 } to { height: var(--kb-accordion-content-height) } }',
          'accordion-up':
            '{ from { height: var(--kb-accordion-content-height) } to { height: 0 } }',
        },
        timingFns: {
          'accordion-down': 'ease-in-out',
          'accordion-up': 'ease-in-out',
        },
        durations: {
          'accordion-down': '150ms',
          'accordion-up': '150ms',
        },
      },
    },
    layers: {
      [FLINT_COMPONENT_LAYER]: -1,
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
        ([, px], { theme }) => ({
          '--s-p': createLength(theme, px),
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
