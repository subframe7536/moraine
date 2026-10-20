/** Border radius scale mapped to `var(--radius)` multipliers. */
export const MORAINE_RADIUS = {
  xs: 'calc(var(--radius) * 0.5)',
  sm: 'calc(var(--radius) * 0.6)',
  md: 'calc(var(--radius) * 0.8)',
  lg: 'var(--radius)',
  xl: 'calc(var(--radius) * 1.4)',
  '2xl': 'calc(var(--radius) * 1.8)',
  '3xl': 'calc(var(--radius) * 2.2)',
  '4xl': 'calc(var(--radius) * 2.6)',
} as const

/** Type scale relative to a locally scoped `--font-size` base. */
export const MORAINE_TEXT_SIZE = {
  tiny: ['calc(var(--font-size, 1rem) * 0.625)', 'calc(var(--font-size, 1rem) * 0.875)'],
  xs: ['calc(var(--font-size, 1rem) * 0.75)', 'var(--font-size, 1rem)'],
  sm: ['calc(var(--font-size, 1rem) * 0.875)', 'calc(var(--font-size, 1rem) * 1.25)'],
  base: ['var(--font-size, 1rem)', 'calc(var(--font-size, 1rem) * 1.5)'],
  lg: ['calc(var(--font-size, 1rem) * 1.125)', 'calc(var(--font-size, 1rem) * 1.75)'],
  xl: ['calc(var(--font-size, 1rem) * 1.25)', 'calc(var(--font-size, 1rem) * 1.75)'],
  '2xl': ['calc(var(--font-size, 1rem) * 1.5)', 'calc(var(--font-size, 1rem) * 2)'],
  '3xl': ['calc(var(--font-size, 1rem) * 1.875)', 'calc(var(--font-size, 1rem) * 2.25)'],
  '4xl': ['calc(var(--font-size, 1rem) * 2.25)', 'calc(var(--font-size, 1rem) * 2.5)'],
  '5xl': ['calc(var(--font-size, 1rem) * 3)', '1'],
  '6xl': ['calc(var(--font-size, 1rem) * 3.75)', '1'],
  '7xl': ['calc(var(--font-size, 1rem) * 4.5)', '1'],
  '8xl': ['calc(var(--font-size, 1rem) * 6)', '1'],
  '9xl': ['calc(var(--font-size, 1rem) * 8)', '1'],
} as const

/** Semantic z-index scale shared by UnoCSS and Tailwind. */
export const MORAINE_Z_INDEX = {
  base: 1,
  raised: 2,
  control: 3,
  sticky: 10,
  resize: 20,
  overlay: 40,
  floating: 50,
} as const

/** Semantic box shadows shared by UnoCSS and Tailwind. */
export const MORAINE_SHADOW = {
  surface: 'var(--shadow-surface)',
  overlay: 'var(--shadow-overlay)',
  input: 'var(--shadow-input)',
} as const

/** Font family tokens. */
export const MORAINE_FONT = {
  sans: 'var(--font-sans)',
  mono: 'var(--font-mono)',
  serif: 'var(--font-serif)',
} as const

export const TONES = [
  'primary',
  'secondary',
  'neutral',
  'danger',
  'info',
  'success',
  'warning',
] as const
export type Tone = (typeof TONES)[number]

export const THEME_COLOR_ROLES = [
  'background',
  'foreground',
  'primary',
  'secondary',
  'neutral',
  'card',
  'popover',
  'muted',
  'accent',
  'danger',
  'info',
  'success',
  'warning',
  'border',
  'input',
  'control',
  'backdrop',
  'ring',
] as const
export type MoraineThemeColorRole = (typeof THEME_COLOR_ROLES)[number]

function stateColor(color: string, state: 'hover' | 'active'): string {
  const base = `var(--${color})`
  const hover = `var(--${color}-hover, var(--mo-${color}-hover, ${base}))`
  return state === 'hover' ? hover : `var(--${color}-active, var(--mo-${color}-active, ${hover}))`
}

function toneForeground(tone: Tone): string {
  const fallback =
    tone === 'primary' || tone === 'secondary' ? 'var(--foreground)' : 'var(--background)'
  return `var(--${tone}-foreground, ${fallback})`
}

export const DEFAULT_MIX_PERCENT = {
  hover: 8,
  active: 12,
  ink: 25,
  soft: 12,
} as const

export const THEME_COLOR_CONFIG_KEYS = [
  'base',
  'foreground',
  'hover',
  'active',
  'ink',
  'soft',
] as const
export type ThemeColorConfigKey = (typeof THEME_COLOR_CONFIG_KEYS)[number]

/** Design-token color map shared by UnoCSS and Tailwind. */
export const MORAINE_COLORS = {
  background: {
    DEFAULT: 'var(--background)',
    hover: stateColor('background', 'hover'),
    active: stateColor('background', 'active'),
  },
  foreground: 'var(--foreground)',
  primary: {
    DEFAULT: 'var(--primary)',
    foreground: 'var(--primary-foreground)',
    hover: stateColor('primary', 'hover'),
    active: stateColor('primary', 'active'),
    ink: 'var(--primary-ink, var(--mo-primary-ink, var(--primary)))',
    soft: 'var(--primary-soft, var(--mo-primary-soft, var(--background)))',
  },
  secondary: {
    DEFAULT: 'var(--secondary)',
    foreground: 'var(--secondary-foreground)',
    hover: stateColor('secondary', 'hover'),
    active: stateColor('secondary', 'active'),
    ink: 'var(--secondary-ink, var(--mo-secondary-ink, var(--secondary)))',
    soft: 'var(--secondary-soft, var(--mo-secondary-soft, var(--background)))',
  },
  neutral: {
    DEFAULT: 'var(--neutral)',
    foreground: 'var(--neutral-foreground, var(--background))',
    hover: stateColor('neutral', 'hover'),
    active: stateColor('neutral', 'active'),
    ink: 'var(--neutral-ink, var(--mo-neutral-ink, var(--neutral)))',
    soft: 'var(--neutral-soft, var(--mo-neutral-soft, var(--background)))',
  },
  card: {
    DEFAULT: 'var(--card)',
    foreground: 'var(--card-foreground)',
    hover: stateColor('card', 'hover'),
    active: stateColor('card', 'active'),
  },
  popover: {
    DEFAULT: 'var(--popover)',
    foreground: 'var(--popover-foreground)',
    hover: stateColor('popover', 'hover'),
    active: stateColor('popover', 'active'),
  },
  muted: {
    DEFAULT: 'var(--muted)',
    foreground: 'var(--muted-foreground)',
    hover: stateColor('muted', 'hover'),
    active: stateColor('muted', 'active'),
  },
  accent: {
    DEFAULT: 'var(--accent)',
    foreground: 'var(--accent-foreground)',
    hover: stateColor('accent', 'hover'),
    active: stateColor('accent', 'active'),
  },
  danger: {
    DEFAULT: 'var(--danger)',
    foreground: 'var(--danger-foreground, var(--background))',
    hover: stateColor('danger', 'hover'),
    active: stateColor('danger', 'active'),
    ink: 'var(--danger-ink, var(--mo-danger-ink, var(--danger)))',
    soft: 'var(--danger-soft, var(--mo-danger-soft, var(--background)))',
  },
  info: {
    DEFAULT: 'var(--info)',
    foreground: 'var(--info-foreground, var(--background))',
    hover: stateColor('info', 'hover'),
    active: stateColor('info', 'active'),
    ink: 'var(--info-ink, var(--mo-info-ink, var(--info)))',
    soft: 'var(--info-soft, var(--mo-info-soft, var(--background)))',
  },
  success: {
    DEFAULT: 'var(--success)',
    foreground: 'var(--success-foreground, var(--background))',
    hover: stateColor('success', 'hover'),
    active: stateColor('success', 'active'),
    ink: 'var(--success-ink, var(--mo-success-ink, var(--success)))',
    soft: 'var(--success-soft, var(--mo-success-soft, var(--background)))',
  },
  warning: {
    DEFAULT: 'var(--warning)',
    foreground: 'var(--warning-foreground, var(--background))',
    hover: stateColor('warning', 'hover'),
    active: stateColor('warning', 'active'),
    ink: 'var(--warning-ink, var(--mo-warning-ink, var(--warning)))',
    soft: 'var(--warning-soft, var(--mo-warning-soft, var(--background)))',
  },
  tone: {
    DEFAULT: 'var(--mo-tone)',
    foreground: 'var(--mo-tone-foreground)',
    hover: 'var(--mo-tone-hover, var(--mo-tone))',
    active: 'var(--mo-tone-active, var(--mo-tone-hover, var(--mo-tone)))',
    ink: 'var(--mo-tone-ink)',
    soft: 'var(--mo-tone-soft, var(--background))',
    'soft-hover': 'var(--mo-tone-soft-hover, var(--mo-tone-soft, var(--background)))',
    'soft-active':
      'var(--mo-tone-soft-active, var(--mo-tone-soft-hover, var(--mo-tone-soft, var(--background))))',
  },
  border: 'var(--border)',
  input: 'var(--input)',
  control: 'var(--control)',
  backdrop: 'var(--backdrop, rgb(0 0 0 / 0.1))',
  ring: 'var(--ring)',
} as const

export const MORAINE_SURFACES = ['background', 'card', 'popover', 'muted', 'accent'] as const

export const MORAINE_WIDTH = {
  sidebar: 'var(--sidebar-width,clamp(14rem,25%,20rem))',
}

export function createGatedColorDeclarations(): Record<string, string> {
  const declarations: Record<string, string> = {}

  for (const surface of MORAINE_SURFACES) {
    const foreground =
      surface === 'background'
        ? 'var(--foreground)'
        : `var(--${surface}-foreground, var(--foreground))`
    declarations[`--mo-${surface}-hover`] =
      `color-mix(in oklch, var(--${surface}), ${foreground} var(--mo-mix-hover, ${DEFAULT_MIX_PERCENT.hover}%))`
    declarations[`--mo-${surface}-active`] =
      `color-mix(in oklch, var(--${surface}), ${foreground} var(--mo-mix-active, ${DEFAULT_MIX_PERCENT.active}%))`
  }

  for (const tone of TONES) {
    const foreground = toneForeground(tone)
    declarations[`--mo-${tone}-hover`] =
      `color-mix(in oklch, var(--${tone}), ${foreground} var(--mo-mix-hover, ${DEFAULT_MIX_PERCENT.hover}%))`
    declarations[`--mo-${tone}-active`] =
      `color-mix(in oklch, var(--${tone}), ${foreground} var(--mo-mix-active, ${DEFAULT_MIX_PERCENT.active}%))`
    declarations[`--mo-${tone}-ink`] =
      `color-mix(in oklch, var(--${tone}), var(--foreground) var(--mo-mix-ink, ${DEFAULT_MIX_PERCENT.ink}%))`
    declarations[`--mo-${tone}-soft`] =
      `color-mix(in oklch, var(--${tone}) var(--mo-mix-soft, ${DEFAULT_MIX_PERCENT.soft}%), var(--background))`
  }

  declarations['--mo-tone-hover'] =
    `color-mix(in oklch, var(--mo-tone), var(--mo-tone-foreground) var(--mo-mix-hover, ${DEFAULT_MIX_PERCENT.hover}%))`
  declarations['--mo-tone-active'] =
    `color-mix(in oklch, var(--mo-tone), var(--mo-tone-foreground) var(--mo-mix-active, ${DEFAULT_MIX_PERCENT.active}%))`
  declarations['--mo-tone-soft'] =
    `color-mix(in oklch, var(--mo-tone) var(--mo-mix-soft, ${DEFAULT_MIX_PERCENT.soft}%), var(--background))`
  declarations['--mo-tone-soft-hover'] =
    `color-mix(in oklch, var(--mo-tone-soft), var(--mo-tone-ink) var(--mo-mix-hover, ${DEFAULT_MIX_PERCENT.hover}%))`
  declarations['--mo-tone-soft-active'] =
    `color-mix(in oklch, var(--mo-tone-soft), var(--mo-tone-ink) var(--mo-mix-active, ${DEFAULT_MIX_PERCENT.active}%))`

  return declarations
}
