import type { JSX } from 'solid-js'

/** Keep caller IDs first and append generated IDs once, preserving their semantic order. */
function mergeAriaTokens(...values: (string | undefined)[]): string | undefined {
  const tokens = values.flatMap((value) => value?.split(/\s+/).filter(Boolean) ?? [])
  return [...new Set(tokens)].join(' ') || undefined
}

export function mergeFieldAriaAttributes(
  caller: JSX.AriaAttributes,
  generated: JSX.AriaAttributes,
): JSX.AriaAttributes {
  return {
    'aria-invalid':
      caller['aria-invalid'] !== undefined ? caller['aria-invalid'] : generated['aria-invalid'],
    'aria-required':
      caller['aria-required'] !== undefined ? caller['aria-required'] : generated['aria-required'],
    'aria-disabled':
      caller['aria-disabled'] !== undefined ? caller['aria-disabled'] : generated['aria-disabled'],
    'aria-readonly':
      caller['aria-readonly'] !== undefined ? caller['aria-readonly'] : generated['aria-readonly'],
    'aria-describedby': mergeAriaTokens(caller['aria-describedby'], generated['aria-describedby']),
    'aria-labelledby': mergeAriaTokens(caller['aria-labelledby'], generated['aria-labelledby']),
  }
}
