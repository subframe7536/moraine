/** Copies `override` keys that are not `undefined` onto `base`. `null` and `false` are kept. */
export function mergeDefined<T extends object>(base: T, override: Partial<T>): T {
  const next = { ...base }
  for (const key of Object.keys(override) as (keyof T)[]) {
    const value = override[key]
    if (value !== undefined) {
      next[key] = value
    }
  }
  return next
}

export function pickDefined<T>(override: T | undefined, fallback: T | undefined): T | undefined {
  return override !== undefined ? override : fallback
}
