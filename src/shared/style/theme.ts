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

/** Design-token color map shared by UnoCSS and Tailwind. */
export const MORAINE_COLORS = {
  background: {
    DEFAULT: 'var(--background)',
    hover: 'var(--background-hover, var(--background))',
    active: 'var(--background-active, var(--background-hover, var(--background)))',
  },
  foreground: 'var(--foreground)',
  primary: {
    DEFAULT: 'var(--primary)',
    foreground: 'var(--primary-foreground)',
    hover: 'var(--primary-hover, var(--primary))',
    active: 'var(--primary-active, var(--primary-hover, var(--primary)))',
  },
  secondary: {
    DEFAULT: 'var(--secondary)',
    foreground: 'var(--secondary-foreground)',
    hover: 'var(--secondary-hover, var(--secondary))',
    active: 'var(--secondary-active, var(--secondary-hover, var(--secondary)))',
  },
  card: {
    DEFAULT: 'var(--card)',
    foreground: 'var(--card-foreground)',
    hover: 'var(--card-hover, var(--card))',
    active: 'var(--card-active, var(--card-hover, var(--card)))',
  },
  popover: {
    DEFAULT: 'var(--popover)',
    foreground: 'var(--popover-foreground)',
    hover: 'var(--popover-hover, var(--popover))',
    active: 'var(--popover-active, var(--popover-hover, var(--popover)))',
  },
  muted: {
    DEFAULT: 'var(--muted)',
    foreground: 'var(--muted-foreground)',
    hover: 'var(--muted-hover, var(--muted))',
    active: 'var(--muted-active, var(--muted-hover, var(--muted)))',
  },
  accent: {
    DEFAULT: 'var(--accent)',
    foreground: 'var(--accent-foreground)',
    hover: 'var(--accent-hover, var(--accent))',
    active: 'var(--accent-active, var(--accent-hover, var(--accent)))',
  },
  destructive: {
    DEFAULT: 'var(--destructive)',
    foreground: 'var(--destructive-foreground)',
    hover: 'var(--destructive-hover, var(--destructive))',
    active: 'var(--destructive-active, var(--destructive-hover, var(--destructive)))',
  },
  border: 'var(--border)',
  input: 'var(--input)',
  ring: 'var(--ring)',
} as const

export const MORAINE_WIDTH = {
  sidebar: 'var(--sidebar-width,clamp(14rem,25%,20rem))',
}
