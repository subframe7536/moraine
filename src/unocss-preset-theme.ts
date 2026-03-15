import type { Preset } from 'unocss'

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

export interface PresetThemeOptions extends Pick<TransformerInjectPrefixOption, 'beforeTransform'> {
  wind3?: boolean
  colors?: Record<string, unknown>
  icons?: Partial<Record<keyof typeof DEFAULT_ICONS, string>>
  enableComponentLayer?:
    | boolean
    | 'preservePrefix'
    | (Partial<TransformerInjectPrefixOption> & { preservePrefix?: boolean })
}

const ROCK_COMPONENT_LAYER = 'rock-component'
const ROCK_PREFIX = 'rk-'
const RE_ROCK_PREFIX = new RegExp(ROCK_PREFIX, 'g')
const RE_ROCK_PREFIX_CLEAN = new RegExp(`\\\\?${ROCK_PREFIX}`, 'g')

const RE_ATTR = /^(data|aria)-(\w+):/
interface ResolvedPresetThemeOptions {
  wind3: boolean
  colors: Record<string, unknown>
  icons: Partial<Record<keyof typeof DEFAULT_ICONS, string>>
  enableComponentLayer: boolean
  preservePrefix: boolean
  prefix: string
  idFilter: (id: string) => boolean
  beforeTransform?: TransformerInjectPrefixOption['beforeTransform']
}

export function resolvePresetThemeOptions(
  options?: PresetThemeOptions,
): ResolvedPresetThemeOptions {
  const layerOpt = options?.enableComponentLayer ?? false
  const isObj = typeof layerOpt === 'object' && layerOpt !== null

  let enableComponentLayer = false
  let preservePrefix = false

  if (isObj) {
    enableComponentLayer = true
    if (layerOpt.preservePrefix) {
      preservePrefix = true
    }
  } else if (layerOpt) {
    enableComponentLayer = true
    if (layerOpt === 'preservePrefix') {
      preservePrefix = true
    }
  }

  return {
    wind3: options?.wind3 ?? false,
    colors: options?.colors ?? {},
    icons: options?.icons ?? {},
    enableComponentLayer,
    preservePrefix,
    prefix: (isObj && layerOpt.prefix) || ROCK_PREFIX,
    idFilter:
      (isObj && layerOpt.idFilter) || ((id: string) => id.includes('node_modules/rock-ui/')),
    beforeTransform: (isObj && layerOpt.beforeTransform) || options?.beforeTransform,
  }
}

export function presetTheme(options?: PresetThemeOptions): Preset {
  const normalized = resolvePresetThemeOptions(options)

  const transformers: Preset['transformers'] = []
  if (normalized.enableComponentLayer) {
    transformers.push(
      transformerInjectPrefix({
        prefix: normalized.prefix,
        idFilter: normalized.idFilter,
        beforeTransform: normalized.beforeTransform,
      }),
    )

    if (!normalized.preservePrefix) {
      transformers.push({
        name: 'transformer-rock',
        enforce: 'post',
        idFilter: normalized.idFilter,
        transform(code) {
          const source = code.toString()
          const nextSource = source.replace(RE_ROCK_PREFIX, '')
          if (nextSource !== source) {
            code.overwrite(0, code.original.length, nextSource)
          }
        },
      })
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

  if (normalized.enableComponentLayer) {
    variants.push((matcher) => {
      if (!matcher.startsWith(ROCK_PREFIX)) {
        return matcher
      }

      return {
        matcher: matcher.slice(ROCK_PREFIX.length),
        layer: ROCK_COMPONENT_LAYER,
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
    name: 'preset-theme-rock',
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
      [ROCK_COMPONENT_LAYER]: -1,
      default: 1,
    },
    transformers,
    variants,
    postprocess:
      normalized.enableComponentLayer && !normalized.preservePrefix
        ? [
            (util) => {
              if (util.layer !== ROCK_COMPONENT_LAYER) {
                return
              }

              util.selector = util.selector.replace(RE_ROCK_PREFIX_CLEAN, '')
              if (util.parent) {
                util.parent = util.parent.replace(RE_ROCK_PREFIX_CLEAN, '')
              }
            },
          ]
        : undefined,
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
      ['transition-flex-basis', '[transition-property:flex-basis]'],
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
        /var-select-([\d.]+)-([\d.]+)-([\d.]+)/,
        ([, h, px, ps], { theme }) => ({
          '--s-h': createLength(theme, h),
          '--s-px': createLength(theme, px),
          '--s-ps': createLength(theme, ps),
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
