import type { Preset } from 'unocss'
import type { Theme } from 'unocss/preset-wind4'

function generateCSSVariables(obj: Theme, prefix: string[] = []): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const currentPath = [...prefix, key]
    if (typeof value === 'string') {
      return [`--${currentPath.join('-')}: ${value}`]
    }
    return generateCSSVariables(value as Theme, currentPath)
  })
}

const light: Theme = {
  colors: {
    background: 'rgb(248, 247, 244)',
    foreground: 'rgb(26, 31, 46)',
    card: { DEFAULT: 'rgb(250, 250, 248)', foreground: 'rgb(26, 31, 46)' },
    popover: { DEFAULT: 'rgb(250, 250, 250)', foreground: 'rgb(26, 31, 46)' },
    primary: { DEFAULT: 'rgb(124, 144, 130)', foreground: 'rgb(239, 246, 241)' },
    secondary: { DEFAULT: 'rgb(153, 165, 120)', foreground: 'rgb(238, 241, 239)' },
    muted: { DEFAULT: 'rgb(232, 230, 225)', foreground: 'rgb(107, 114, 128)' },
    accent: { DEFAULT: 'rgb(215, 219, 223)', foreground: 'rgb(26, 31, 46)' },
    destructive: { DEFAULT: 'rgb(173, 84, 81)', foreground: 'rgb(232, 232, 232)' },
    border: 'rgb(232, 230, 225)',
    input: 'rgb(252, 252, 252)',
    ring: 'rgb(124, 144, 130)',
    chart: {
      1: 'rgb(124, 144, 130)',
      2: 'rgb(160, 170, 136)',
      3: 'rgb(139, 157, 131)',
      4: 'rgb(107, 114, 128)',
      5: 'rgb(232, 230, 225)',
    },
    sidebar: {
      DEFAULT: 'rgb(250, 250, 248)',
      foreground: 'rgb(26, 31, 46)',
      primary: { DEFAULT: 'rgb(124, 144, 130)', foreground: 'rgb(255, 255, 255)' },
      accent: { DEFAULT: 'rgb(232, 230, 225)', foreground: 'rgb(26, 31, 46)' },
      border: 'rgb(232, 230, 225)',
      ring: 'rgb(124, 144, 130)',
    },
  },
}

const dark: Theme = {
  colors: {
    background: 'rgb(37, 39, 38)',
    foreground: 'rgb(220, 220, 220)',
    card: { DEFAULT: 'rgb(42, 45, 43)', foreground: 'rgb(220, 220, 220)' },
    popover: { DEFAULT: 'rgb(51, 51, 51)', foreground: 'rgb(220, 220, 220)' },
    primary: { DEFAULT: 'rgb(124, 144, 130)', foreground: 'rgb(235, 239, 236)' },
    secondary: { DEFAULT: 'rgb(77, 91, 81)', foreground: 'rgb(219, 225, 221)' },
    muted: { DEFAULT: 'rgb(56, 61, 58)', foreground: 'rgb(173, 173, 173)' },
    accent: { DEFAULT: 'rgb(96, 112, 118)', foreground: 'rgb(217, 220, 227)' },
    destructive: { DEFAULT: 'rgb(149, 92, 92)', foreground: 'rgb(234, 234, 234)' },
    border: 'rgb(79, 79, 79)',
    input: 'rgb(65, 65, 65)',
    ring: 'rgb(192, 192, 192)',
    chart: {
      1: 'rgb(239, 239, 239)',
      2: 'rgb(208, 208, 208)',
      3: 'rgb(176, 176, 176)',
      4: 'rgb(144, 144, 144)',
      5: 'rgb(112, 112, 112)',
    },
    sidebar: {
      DEFAULT: 'rgb(44, 48, 45)',
      foreground: 'rgb(211, 213, 211)',
      primary: { DEFAULT: 'rgb(124, 144, 130)', foreground: 'rgb(33, 33, 33)' },
      accent: { DEFAULT: 'rgb(64, 69, 66)', foreground: 'rgb(211, 213, 211)' },
      border: 'rgb(101, 118, 106)',
      ring: 'rgb(192, 192, 192)',
    },
  },
}

export function presetTheme(radiusRem = 0.5): Preset {
  const darkVars = generateCSSVariables(dark).join(';\n')
  return {
    name: 'theme',
    theme: light,
    shortcuts: [
      ['effect-fv', 'outline-none ring-2 ring-ring ring-offset-(1 background)'],
      ['effect-dis', 'pointer-events-none opacity-64 cursor-not-allowed'],
      ['border', 'b-1 b-border'],
    ],
    preflights: [
      {
        getCSS: () => `.dark {
${darkVars}
}
:root {
  --radius: ${radiusRem}rem;
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}`,
      },
    ],
  }
}
