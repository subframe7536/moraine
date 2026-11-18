export type EmptyValueMode = 'preserve' | 'null' | 'undefined'

export interface InputModifiers {
  trim?: boolean
  lazy?: boolean
  empty?: EmptyValueMode
  number?: boolean
}

/**
 * Resolves the output value type based on modifiers config.
 * - `number: true`       → base type is `number`, otherwise `string`
 * - `empty: 'null'`      → adds `null` to the union
 * - `empty: 'undefined'` → adds `undefined` to the union
 */
export type ModifierValue<TModifiers extends InputModifiers | undefined> =
  | (TModifiers extends { number: true }
      ? number | (TModifiers extends { empty: 'null' } ? null : undefined)
      : string)
  | (TModifiers extends { empty: 'null' } ? null : never)
  | (TModifiers extends { empty: 'undefined' } ? undefined : never)

export function applyInputModifiers<T>(value: string, modifiers?: InputModifiers): T {
  let nextValue: string | number | null | undefined = value

  if (modifiers?.trim) {
    nextValue = nextValue.trim()
  }

  const trimmed = typeof nextValue === 'string' ? nextValue.trim() : ''
  const isEmpty = trimmed === ''

  if (modifiers?.number) {
    if (isEmpty) {
      if (modifiers.empty === 'null') {
        return null as T
      }
      return undefined as T
    }

    const num = Number(trimmed)
    if (Number.isNaN(num)) {
      return undefined as T
    }

    return num as T
  }

  if (isEmpty) {
    if (modifiers?.empty === 'null') {
      return null as T
    }
    if (modifiers?.empty === 'undefined') {
      return undefined as T
    }
  }

  return nextValue as T
}
