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
  | (M extends { number: true } ? number : string)
  | (M extends { empty: 'null' } ? null : never)
  | (M extends { empty: 'undefined' } ? undefined : never)

export function applyInputModifiers<T>(value: string, modelModifiers?: ModelModifiers): T {
  let nextValue: unknown = value

  if (modelModifiers?.trim) {
    nextValue = String(nextValue ?? '').trim()
  }

  if (modelModifiers?.number && nextValue !== '') {
    nextValue = Number(nextValue)
  }

  if (modelModifiers?.empty === 'null' && nextValue === '') {
    nextValue = null
  }

  if (modelModifiers?.empty === 'undefined' && nextValue === '') {
    nextValue = undefined
  }

  return nextValue as T
}
