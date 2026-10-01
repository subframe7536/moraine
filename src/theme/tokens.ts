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

/** Box shadow scale mapped to `var(--shadow-*)` tokens. */
export const MORAINE_SHADOW = {
  '2xs': 'var(--shadow-2xs)',
  xs: 'var(--shadow-xs)',
  sm: 'var(--shadow-sm)',
  DEFAULT: 'var(--shadow)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  xl: 'var(--shadow-xl)',
  '2xl': 'var(--shadow-2xl)',
} as const

/** Font family tokens. */
export const MORAINE_FONT = {
  sans: 'var(--font-sans)',
  mono: 'var(--font-mono)',
  serif: 'var(--font-serif)',
} as const

function stateColor(color: string, state: 'hover' | 'active'): string {
  const base = `var(--${color})`
  const hover = `var(--${color}-hover, var(--mo-auto-${color}-hover, ${base}))`
  return state === 'hover'
    ? hover
    : `var(--${color}-active, var(--mo-auto-${color}-active, ${hover}))`
}

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
  },
  secondary: {
    DEFAULT: 'var(--secondary)',
    foreground: 'var(--secondary-foreground)',
    hover: stateColor('secondary', 'hover'),
    active: stateColor('secondary', 'active'),
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
  destructive: {
    DEFAULT: 'var(--destructive)',
    foreground: 'var(--destructive-foreground, var(--background))',
    hover: stateColor('destructive', 'hover'),
    active: stateColor('destructive', 'active'),
  },
  border: 'var(--border)',
  input: 'var(--input)',
  ring: 'var(--ring)',
} as const

const MORAINE_STATE_COLORS = [
  'background',
  'primary',
  'secondary',
  'card',
  'popover',
  'muted',
  'accent',
  'destructive',
] as const

export const MORAINE_WIDTH = {
  sidebar: 'var(--sidebar-width,clamp(14rem,25%,20rem))',
}

export function createStateColorDeclarations(adjustments: {
  hover: number
  active: number
}): Record<string, string> {
  return Object.fromEntries(
    MORAINE_STATE_COLORS.flatMap((color) => {
      const foreground =
        color === 'background'
          ? 'var(--foreground)'
          : `var(--${color}-foreground, var(--${color === 'destructive' ? 'background' : 'foreground'}))`
      return (['hover', 'active'] as const).map((state) => [
        `--mo-auto-${color}-${state}`,
        `color-mix(in oklch, var(--${color}), ${foreground} ${adjustments[state]}%)`,
      ])
    }),
  )
}
