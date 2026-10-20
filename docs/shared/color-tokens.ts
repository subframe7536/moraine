import { DEFAULT_THEME_COLORS } from '../../src/theme/defaults.ts'
import { DEFAULT_MIX_PERCENT, MORAINE_COLORS, THEME_COLOR_ROLES } from '../../src/theme/tokens.ts'

export type DocsColorTokenScheme = 'light' | 'dark'

/** How a token resolves in a built-in theme when no explicit value is configured. */
export type DocsColorTokenDefault =
  | { type: 'value'; value: string }
  | { type: 'auto'; percent: number }
  | { type: 'fallback'; variable: string }
  | { type: 'none' }

export interface DocsColorToken {
  /** Token name used by utilities, such as `accent-hover` or `primary-ink`. */
  name: string
  /** CSS variable that configures the token, such as `--accent-hover` or `--primary-ink`. */
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
  if (variant === 'hover' || variant === 'active' || variant === 'ink' || variant === 'soft') {
    return { type: 'auto', percent: DEFAULT_MIX_PERCENT[variant] }
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

/** Lists every public theme color role, expanding grouped colors into their variants. */
export function listDocsColorTokens(): DocsColorToken[] {
  return THEME_COLOR_ROLES.flatMap((color) => {
    const schema = MORAINE_COLORS[color]
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
