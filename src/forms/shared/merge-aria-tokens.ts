/** Keep caller IDs first and append generated IDs once, preserving their semantic order. */
export function mergeAriaTokens(...values: unknown[]): string | undefined {
  const tokens = values.flatMap((value) =>
    typeof value === 'string' ? value.split(/\s+/).filter(Boolean) : [],
  )
  return [...new Set(tokens)].join(' ') || undefined
}
