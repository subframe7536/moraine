export type EmptyValueMode = 'preserve' | 'null'

export interface InputModifiers {
  trim?: boolean
  lazy?: boolean
  empty?: EmptyValueMode
  number?: boolean
}

/**
 * Resolves the output value type based on modifiers config.
 * - `number: true`  → `number | null`; empty and non-numeric text give `null`
 * - `empty: 'null'` → adds `null` to the union, otherwise `string`
 */
export type ModifierValue<TModifiers extends InputModifiers | undefined> = TModifiers extends {
  number: true
}
  ? number | null
  : TModifiers extends { empty: 'null' }
    ? string | null
    : string

export function applyInputModifiers<T>(value: string, modifiers?: InputModifiers): T {
  let nextValue: string | number | null = value

  if (modifiers?.trim) {
    nextValue = nextValue.trim()
  }

  const trimmed = typeof nextValue === 'string' ? nextValue.trim() : ''
  const isEmpty = trimmed === ''

  if (modifiers?.number) {
    if (isEmpty) {
      return null as T
    }

    const num = Number(trimmed)
    if (Number.isNaN(num)) {
      return null as T
    }

    return num as T
  }

  if (isEmpty && modifiers?.empty === 'null') {
    return null as T
  }

  return nextValue as T
}
