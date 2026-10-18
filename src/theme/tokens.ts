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

function surfaceStateColor(color: string, state: 'hover' | 'active'): string {
  const base = `var(--${color})`
  const hover = `var(--${color}-hover, var(--mo-${color}-hover, ${base}))`
  return state === 'hover' ? hover : `var(--${color}-active, var(--mo-${color}-active, ${hover}))`
}

const BACKGROUND_FOREGROUND_COLORS = new Set(['neutral', 'danger', 'info', 'success', 'warning'])

/** Status and neutral colors mix toward `--background` when their foreground token is unset. */
export function usesBackgroundForegroundFallback(color: string): boolean {
  return BACKGROUND_FOREGROUND_COLORS.has(color)
}

/** Design-token color map shared by UnoCSS and Tailwind. */
export const MORAINE_COLORS = {
  background: {
    DEFAULT: 'var(--background)',
    hover: surfaceStateColor('background', 'hover'),
    active: surfaceStateColor('background', 'active'),
  },
  foreground: 'var(--foreground)',
  primary: {
    DEFAULT: 'var(--primary)',
    foreground: 'var(--primary-foreground)',
    ink: 'var(--primary-ink, var(--mo-primary-ink, var(--primary)))',
  },
  secondary: {
    DEFAULT: 'var(--secondary)',
    foreground: 'var(--secondary-foreground)',
    ink: 'var(--secondary-ink, var(--mo-secondary-ink, var(--secondary)))',
  },
  neutral: {
    DEFAULT: 'var(--neutral)',
    foreground: 'var(--neutral-foreground, var(--background))',
    ink: 'var(--neutral-ink, var(--mo-neutral-ink, var(--neutral)))',
  },
  card: {
    DEFAULT: 'var(--card)',
    foreground: 'var(--card-foreground)',
    hover: surfaceStateColor('card', 'hover'),
    active: surfaceStateColor('card', 'active'),
  },
  popover: {
    DEFAULT: 'var(--popover)',
    foreground: 'var(--popover-foreground)',
    hover: surfaceStateColor('popover', 'hover'),
    active: surfaceStateColor('popover', 'active'),
  },
  muted: {
    DEFAULT: 'var(--muted)',
    foreground: 'var(--muted-foreground)',
    hover: surfaceStateColor('muted', 'hover'),
    active: surfaceStateColor('muted', 'active'),
  },
  accent: {
    DEFAULT: 'var(--accent)',
    foreground: 'var(--accent-foreground)',
    hover: surfaceStateColor('accent', 'hover'),
    active: surfaceStateColor('accent', 'active'),
  },
  danger: {
    DEFAULT: 'var(--danger)',
    foreground: 'var(--danger-foreground, var(--background))',
    ink: 'var(--danger-ink, var(--mo-danger-ink, var(--danger)))',
  },
  info: {
    DEFAULT: 'var(--info)',
    foreground: 'var(--info-foreground, var(--background))',
    ink: 'var(--info-ink, var(--mo-info-ink, var(--info)))',
  },
  success: {
    DEFAULT: 'var(--success)',
    foreground: 'var(--success-foreground, var(--background))',
    ink: 'var(--success-ink, var(--mo-success-ink, var(--success)))',
  },
  warning: {
    DEFAULT: 'var(--warning)',
    foreground: 'var(--warning-foreground, var(--background))',
    ink: 'var(--warning-ink, var(--mo-warning-ink, var(--warning)))',
  },
  tone: {
    DEFAULT: 'var(--mo-tone)',
    foreground: 'var(--mo-tone-foreground)',
    hover: 'var(--mo-tone-hover, var(--mo-tone))',
    active: 'var(--mo-tone-active, var(--mo-tone-hover, var(--mo-tone)))',
    ink: 'var(--mo-tone-ink)',
  },
  border: 'var(--border)',
  input: 'var(--input)',
  control: 'var(--control)',
  backdrop: 'var(--backdrop, rgb(0 0 0 / 0.1))',
  ring: 'var(--ring)',
} as const

const MORAINE_SURFACES = ['background', 'card', 'popover', 'muted', 'accent'] as const

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
      `color-mix(in oklch, var(--${surface}), ${foreground} var(--mo-mix-hover, 8%))`
    declarations[`--mo-${surface}-active`] =
      `color-mix(in oklch, var(--${surface}), ${foreground} var(--mo-mix-active, 12%))`
  }

  for (const tone of TONES) {
    declarations[`--mo-${tone}-ink`] =
      `color-mix(in oklch, var(--${tone}), var(--foreground) var(--mo-mix-ink, 25%))`
  }

  declarations['--mo-tone-hover'] =
    'color-mix(in oklch, var(--mo-tone), var(--mo-tone-foreground) var(--mo-mix-hover, 8%))'
  declarations['--mo-tone-active'] =
    'color-mix(in oklch, var(--mo-tone), var(--mo-tone-foreground) var(--mo-mix-active, 12%))'

  return declarations
}
