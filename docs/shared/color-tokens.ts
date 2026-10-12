import { DEFAULT_COLOR_STATES, DEFAULT_THEME_COLORS } from '../../src/theme/defaults.ts'
import { MORAINE_COLORS } from '../../src/theme/tokens.ts'

export type DocsColorTokenScheme = 'light' | 'dark'

/** How a token resolves in a built-in theme when no explicit value is configured. */
export type DocsColorTokenDefault =
  | { type: 'value'; value: string }
  | { type: 'auto'; percent: number }
  | { type: 'fallback'; variable: string }
  | { type: 'none' }

export interface DocsColorToken {
  /** Token name used by utilities, such as `primary-hover` in `bg-primary-hover`. */
  name: string
  /** CSS variable that configures the token, such as `--primary-hover`. */
  cssVariable: string
  /** CSS value emitted by the utility, including state and foreground fallbacks. */
  value: string
  /** Built-in UnoCSS defaults for the light and dark themes. */
  defaults: Record<DocsColorTokenScheme, DocsColorTokenDefault>
}

function readCssVariable(value: string, name: string): string {
  return /^var\((--[\w-]+)/.exec(value)?.[1] ?? `--${name}`
}

function readDefault(
  scheme: DocsColorTokenScheme,
  color: string,
  variant: string | undefined,
  value: string,
): DocsColorTokenDefault {
  if (variant === 'hover' || variant === 'active') {
    return { type: 'auto', percent: DEFAULT_COLOR_STATES[variant] }
  }
  const configured = (DEFAULT_THEME_COLORS[scheme] as Record<string, unknown>)[color]
  const literal =
    variant === undefined
      ? typeof configured === 'string'
        ? configured
        : (configured as Record<string, unknown> | undefined)?.base
      : (configured as Record<string, unknown> | undefined)?.[variant]
  if (typeof literal === 'string') {
    return { type: 'value', value: literal }
  }
  const fallback = /^var\(--[\w-]+,\s*var\((--[\w-]+)\)\)$/.exec(value)?.[1]
  return fallback ? { type: 'fallback', variable: fallback } : { type: 'none' }
}

/** Lists every color token in `MORAINE_COLORS`, expanding grouped colors into their variants. */
export function listDocsColorTokens(): DocsColorToken[] {
  return Object.entries(MORAINE_COLORS).flatMap(([color, schema]) => {
    const entries: Array<[string | undefined, string]> =
      typeof schema === 'string'
        ? [[undefined, schema]]
        : Object.entries(schema).map(([variant, value]) => [
            variant === 'DEFAULT' ? undefined : variant,
            value,
          ])
    return entries.map(([variant, value]) => {
      const name = variant ? `${color}-${variant}` : color
      return {
        name,
        cssVariable: readCssVariable(value, name),
        value,
        defaults: {
          light: readDefault('light', color, variant, value),
          dark: readDefault('dark', color, variant, value),
        },
      }
    })
  })
}

/** Formats a default cell as Markdown, using inline code for CSS values. */
export function formatDocsColorTokenDefault(value: DocsColorTokenDefault): string {
  switch (value.type) {
    case 'value':
      return `\`${value.value}\``
    case 'auto':
      return `auto (color-mix, ${value.percent}%)`
    case 'fallback':
      return `falls back to \`${value.variable}\``
    case 'none':
      return 'none'
  }
}
