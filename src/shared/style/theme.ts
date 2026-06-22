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
  background: 'var(--background)',
  foreground: 'var(--foreground)',
  primary: { DEFAULT: 'var(--primary)', foreground: 'var(--primary-foreground)' },
  secondary: { DEFAULT: 'var(--secondary)', foreground: 'var(--secondary-foreground)' },
  card: { DEFAULT: 'var(--card)', foreground: 'var(--card-foreground)' },
  popover: { DEFAULT: 'var(--popover)', foreground: 'var(--popover-foreground)' },
  muted: { DEFAULT: 'var(--muted)', foreground: 'var(--muted-foreground)' },
  accent: { DEFAULT: 'var(--accent)', foreground: 'var(--accent-foreground)' },
  destructive: { DEFAULT: 'var(--destructive)', foreground: 'var(--destructive-foreground)' },
  border: 'var(--border)',
  input: 'var(--input)',
  ring: 'var(--ring)',
} as const

export const MORAINE_WIDTH = {
  sidebar: 'var(--sidebar-width,clamp(14rem,25%,20rem))',
}
