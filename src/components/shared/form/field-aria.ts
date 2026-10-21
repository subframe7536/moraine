import type { JSX } from 'solid-js'

/** Keep caller IDs first and append generated IDs once, preserving their semantic order. */

export function mergeFieldAriaAttributes(
  caller: JSX.AriaAttributes,
  generated: JSX.AriaAttributes,
): JSX.AriaAttributes {
  function _merge<K extends keyof JSX.AriaAttributes>(key: K): string | undefined {
    const tokens = [caller[key], generated[key]].flatMap(
      (value) => (value as string | undefined)?.split(/\s+/).filter(Boolean) ?? [],
    )
    return [...new Set(tokens)].join(' ') || undefined
  }
  function _pick<K extends keyof JSX.AriaAttributes>(key: K): JSX.AriaAttributes[K] {
    return caller[key] !== undefined ? caller[key] : generated[key]
  }

  return {
    'aria-label': caller['aria-label'],
    'aria-invalid': _pick('aria-invalid'),
    'aria-required': _pick('aria-required'),
    'aria-disabled': _pick('aria-disabled'),
    'aria-readonly': _pick('aria-readonly'),
    'aria-describedby': _merge('aria-describedby'),
    'aria-labelledby': _merge('aria-labelledby'),
  }
}
