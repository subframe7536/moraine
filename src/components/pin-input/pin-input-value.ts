import type { PinInputT } from './pin-input.types'

export interface ValidationConfig {
  charPattern: RegExp
  slotPattern: string
  getRootPattern: (length: number) => string
  inputMode: 'numeric' | 'text'
}

export const VALIDATION_CONFIG: Record<PinInputT.ValidationType, ValidationConfig> = {
  number: {
    charPattern: /^\d$/,
    slotPattern: '\\d{1}',
    getRootPattern: (length) => `\\d{${length}}`,
    inputMode: 'numeric',
  },
  alpha: {
    charPattern: /^[a-zA-Z]$/,
    slotPattern: '[a-zA-Z]{1}',
    getRootPattern: (length) => `[a-zA-Z]{${length}}`,
    inputMode: 'text',
  },
  alphanumeric: {
    charPattern: /^[a-zA-Z0-9]$/,
    slotPattern: '[a-zA-Z0-9]{1}',
    getRootPattern: (length) => `[a-zA-Z0-9]{${length}}`,
    inputMode: 'text',
  },
  text: {
    charPattern: /^\S$/,
    slotPattern: '\\S{1}',
    getRootPattern: (length) => `\\S{${length}}`,
    inputMode: 'text',
  },
}

export function isValidChar(char: string, type: PinInputT.ValidationType): boolean {
  return VALIDATION_CONFIG[type]?.charPattern.test(char) ?? (char.length === 1 && !/\s/.test(char))
}

export function areCharArraysEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a === b) {
    return true
  }
  if (a.length !== b.length) {
    return false
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false
    }
  }
  return true
}

export function createEmptyChars(length: number): string[] {
  return new Array(length).fill('')
}

/**
 * Normalizes a list of slot characters through `normalizeValue`, then re-filters it.
 */
export function applyNormalizeValue(
  chars: string[],
  type: PinInputT.ValidationType,
  normalizeValue?: (value: string) => string,
): string[] {
  if (!normalizeValue) {
    return chars
  }
  const normalized = normalizeValue(chars.join(''))
  const result: string[] = []
  for (const char of normalized) {
    if (isValidChar(char, type)) {
      result.push(char)
    }
  }
  return result
}

/**
 * Filters pasted or autofilled text into valid slot characters.
 * Whitespace and dashes are silently stripped; dropped characters set `didReject`.
 */
export function filterInputText(
  text: string,
  type: PinInputT.ValidationType,
  normalizeValue?: (value: string) => string,
): [chars: string[], didReject: boolean] {
  const stripped = text.replace(/[\s-]+/g, '')
  const valid: string[] = []
  for (const char of stripped) {
    if (isValidChar(char, type)) {
      valid.push(char)
    }
  }
  const normalized = applyNormalizeValue(valid, type, normalizeValue)
  const strippedCount = Array.from(stripped).length
  return [normalized, strippedCount > normalized.length]
}

/**
 * Filters typed or IME-committed text into valid slot characters.
 * Whitespace is silently dropped like in `filterInputText`.
 */
export function filterTypedChars(
  typed: string,
  type: PinInputT.ValidationType,
  normalizeValue?: (value: string) => string,
): [chars: string[], didReject: boolean] {
  let nonWhitespaceCount = 0
  const valid: string[] = []
  for (const char of typed) {
    if (!/\s/.test(char)) {
      nonWhitespaceCount++
      if (isValidChar(char, type)) {
        valid.push(char)
      }
    }
  }
  const normalized = applyNormalizeValue(valid, type, normalizeValue)
  return [normalized, nonWhitespaceCount > normalized.length]
}

export function extractValidChars(
  val: string[] | string,
  type: PinInputT.ValidationType,
): string[] {
  const result: string[] = []
  if (typeof val === 'string') {
    for (const char of val) {
      if (isValidChar(char, type)) {
        result.push(char)
      }
    }
  } else {
    for (const s of val) {
      for (const char of s) {
        if (isValidChar(char, type)) {
          result.push(char)
        }
      }
    }
  }
  return result
}

export function normalizeChars(
  val: string[] | string | undefined | null,
  length: number,
  type: PinInputT.ValidationType,
  normalizeValue?: (value: string) => string,
): string[] {
  const result = createEmptyChars(length)
  if (val === undefined || val === null) {
    return result
  }
  if (Array.isArray(val)) {
    // Array elements map to slots positionally: an empty element keeps a hole
    // in the middle instead of packing the following characters left.
    const limit = Math.min(val.length, length)
    for (let i = 0; i < limit; i++) {
      const element = val[i]
      if (!element) {
        continue
      }
      const valid = applyNormalizeValue(extractValidChars(element, type), type, normalizeValue)
      result[i] = valid[0] ?? ''
    }
    return result
  }
  const valid = applyNormalizeValue(extractValidChars(val, type), type, normalizeValue)
  const limit = Math.min(valid.length, length)
  for (let i = 0; i < limit; i++) {
    result[i] = valid[i]!
  }
  return result
}

/** Splices characters into the current slot array, clamping to `maxLength` and filling voids. */
export function spliceChars(
  current: readonly string[],
  startIndex: number,
  insert: readonly string[],
  maxLength: number,
): string[] {
  const next = [...current]
  next.splice(startIndex, insert.length, ...insert)
  next.length = maxLength
  for (let i = 0; i < maxLength; i++) {
    if (next[i] === undefined) {
      next[i] = ''
    }
  }
  return next
}
