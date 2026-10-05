export type EmptyValueMode = 'preserve' | 'null' | 'undefined'

export interface ModelModifiers {
  trim?: boolean
  lazy?: boolean
  empty?: EmptyValueMode
  number?: boolean
}

/**
 * Resolves the output value type based on modelModifiers config.
 * - `number: true`       → base type is `number`, otherwise `string`
 * - `empty: 'null'`      → adds `null` to the union
 * - `empty: 'undefined'` → adds `undefined` to the union
 */
export type ModifierValue<M extends ModelModifiers | undefined> =
  | (M extends { number: true }
      ? number | (M extends { empty: 'null' } ? null : undefined)
      : string)
  | (M extends { empty: 'null' } ? null : never)
  | (M extends { empty: 'undefined' } ? undefined : never)

export function applyInputModifiers<T>(value: string, modelModifiers?: ModelModifiers): T {
  let nextValue: string | number | null | undefined = value

  if (modelModifiers?.trim) {
    nextValue = nextValue.trim()
  }

  const trimmed = typeof nextValue === 'string' ? nextValue.trim() : ''
  const isEmpty = trimmed === ''

  if (modelModifiers?.number) {
    if (isEmpty) {
      if (modelModifiers.empty === 'null') {
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
    if (modelModifiers?.empty === 'null') {
      return null as T
    }
    if (modelModifiers?.empty === 'undefined') {
      return undefined as T
    }
  }

  return nextValue as T
}
