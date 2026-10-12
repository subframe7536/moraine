import { MORAINE_COLORS } from '../../src/theme/tokens.ts'

export interface DocsColorToken {
  /** Token name used by utilities, such as `primary-hover` in `bg-primary-hover`. */
  name: string
  /** CSS variable that configures the token, such as `--primary-hover`. */
  cssVariable: string
  /** CSS value emitted by the utility, including state and foreground fallbacks. */
  value: string
}

function readCssVariable(value: string, name: string): string {
  return /^var\((--[\w-]+)/.exec(value)?.[1] ?? `--${name}`
}

/** Lists every color token in `MORAINE_COLORS`, expanding grouped colors into their variants. */
export function listDocsColorTokens(): DocsColorToken[] {
  return Object.entries(MORAINE_COLORS).flatMap(([color, schema]) => {
    const entries: Array<[string, string]> =
      typeof schema === 'string'
        ? [[color, schema]]
        : Object.entries(schema).map(([variant, value]) => [
            variant === 'DEFAULT' ? color : `${color}-${variant}`,
            value,
          ])
    return entries.map(([name, value]) => ({
      name,
      cssVariable: readCssVariable(value, name),
      value,
    }))
  })
}
