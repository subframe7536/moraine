import type { MoraineThemeColors } from './unocss.ts'

/** Default automatic hover and active mix percentages toward the role's foreground. */
export const DEFAULT_COLOR_STATES = { hover: 8, active: 12 } as const

// shadcn/ui's neutral palette in 8-bit sRGB, compositing dark borders over the page background.
// Status colors (danger, info, success, warning) follow Obsidian's callout colors.
export const DEFAULT_THEME_COLORS = {
  light: {
    background: { base: 'rgb(255, 255, 255)' },
    foreground: 'rgb(10, 10, 10)',
    card: { base: 'rgb(255, 255, 255)', foreground: 'rgb(10, 10, 10)' },
    popover: { base: 'rgb(255, 255, 255)', foreground: 'rgb(10, 10, 10)' },
    primary: { base: 'rgb(23, 23, 23)', foreground: 'rgb(250, 250, 250)' },
    secondary: { base: 'rgb(245, 245, 245)', foreground: 'rgb(23, 23, 23)' },
    muted: { base: 'rgb(245, 245, 245)', foreground: 'rgb(115, 115, 115)' },
    accent: { base: 'rgb(245, 245, 245)', foreground: 'rgb(23, 23, 23)' },
    danger: { base: 'rgb(233, 49, 71)' },
    info: { base: 'rgb(8, 109, 221)' },
    success: { base: 'rgb(8, 185, 78)' },
    warning: { base: 'rgb(202 117 1)' },
    border: 'rgb(229, 229, 229)',
    input: 'rgb(229, 229, 229)',
    control: 'rgb(255, 255, 255)',
    backdrop: 'rgb(0 0 0 / 0.1)',
    ring: 'rgb(161, 161, 161)',
  },
  dark: {
    background: { base: 'rgb(10, 10, 10)' },
    foreground: 'rgb(250, 250, 250)',
    card: { base: 'rgb(23, 23, 23)', foreground: 'rgb(250, 250, 250)' },
    popover: { base: 'rgb(23, 23, 23)', foreground: 'rgb(250, 250, 250)' },
    primary: { base: 'rgb(229, 229, 229)', foreground: 'rgb(23, 23, 23)' },
    secondary: { base: 'rgb(38, 38, 38)', foreground: 'rgb(250, 250, 250)' },
    muted: { base: 'rgb(38, 38, 38)', foreground: 'rgb(161, 161, 161)' },
    accent: { base: 'rgb(38, 38, 38)', foreground: 'rgb(250, 250, 250)' },
    danger: { base: 'rgb(198 89 89)' },
    info: { base: 'rgb(69 128 210)' },
    success: { base: 'rgb(49 151 81)' },
    warning: { base: 'rgb(166 128 6)' },
    border: 'rgb(35, 35, 35)',
    input: 'rgb(47, 47, 47)',
    control: 'rgb(23, 23, 23)',
    backdrop: 'rgb(0 0 0 / 0.1)',
    ring: 'rgb(115, 115, 115)',
  },
} satisfies Record<'light' | 'dark', MoraineThemeColors>
