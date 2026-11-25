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
    slotPattern: String.raw`\d{1}`,
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
    slotPattern: String.raw`\S{1}`,
    getRootPattern: (length) => `\\S{${length}}`,
    inputMode: 'text',
  },
}

export function isValidChar(char: string, type: PinInputT.ValidationType): boolean {
  return VALIDATION_CONFIG[type]?.charPattern.test(char) ?? (char.length === 1 && !/\s/.test(char))
}

export function areCharArraysEqual(a: ReadonlyArray<string>, b: ReadonlyArray<string>): boolean {
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

export function createEmptyChars(length: number): Array<string> {
  return new Array(length).fill('')
}

/**
 * Normalizes a list of slot characters through `normalizeValue`, then re-filters it.
 */
export function applyNormalizeValue(
  chars: Array<string>,
  type: PinInputT.ValidationType,
  normalizeValue?: (value: string) => string,
): Array<string> {
  if (!normalizeValue) {
    return chars
  }
  const normalized = normalizeValue(chars.join(''))
  const result: Array<string> = []
  for (const char of normalized) {
    if (isValidChar(char, type)) {
      result.push(char)
    }
  }
  return result
}

/**
 * The characters of `before` that did not make it into `after`, joined; each output character
 * cancels one equal input character. Empty while no character was lost, so a `normalizeValue`
 * that only transforms characters (such as upper-casing) reports nothing.
 */
function droppedChars(before: Array<string>, after: Array<string>): string {
  if (after.length >= before.length) {
    return ''
  }
  const remaining = [...before]
  for (const char of after) {
    const at = remaining.indexOf(char)
    if (at >= 0) {
      remaining.splice(at, 1)
    }
  }
  return remaining.join('')
}

/**
 * Filters pasted or autofilled text into valid slot characters.
 * Whitespace and dashes are silently stripped; the second tuple entry holds the characters
 * dropped by `validationType` or `normalizeValue`, or `''` when none were.
 */
export function filterInputText(
  text: string,
  type: PinInputT.ValidationType,
  normalizeValue?: (value: string) => string,
): [chars: Array<string>, rejected: string] {
  const stripped = Array.from(text.replaceAll(/[\s-]+/g, ''))
  const valid = stripped.filter((char) => isValidChar(char, type))
  const normalized = applyNormalizeValue(valid, type, normalizeValue)
  return [normalized, droppedChars(stripped, normalized)]
}

/**
 * Filters typed or IME-committed text into valid slot characters.
 * Whitespace is silently dropped like in `filterInputText`.
 */
export function filterTypedChars(
  typed: string,
  type: PinInputT.ValidationType,
  normalizeValue?: (value: string) => string,
): [chars: Array<string>, rejected: string] {
  const nonWhitespace = Array.from(typed).filter((char) => !/\s/.test(char))
  const valid = nonWhitespace.filter((char) => isValidChar(char, type))
  const normalized = applyNormalizeValue(valid, type, normalizeValue)
  return [normalized, droppedChars(nonWhitespace, normalized)]
}

export function extractValidChars(val: string, type: PinInputT.ValidationType): Array<string> {
  const result: Array<string> = []
  for (const char of val) {
    if (isValidChar(char, type)) {
      result.push(char)
    }
  }
  return result
}

export function normalizeChars(
  val: string | undefined | null,
  length: number,
  type: PinInputT.ValidationType,
  normalizeValue?: (value: string) => string,
): Array<string> {
  const result = createEmptyChars(length)
  if (val === undefined || val === null) {
    return result
  }
  const valid = applyNormalizeValue(extractValidChars(val, type), type, normalizeValue)
  const limit = Math.min(valid.length, length)
  for (let i = 0; i < limit; i++) {
    const char = valid[i]
    if (char !== undefined) {
      result[i] = char
    }
  }
  return result
}

/** Splices characters into the current slot array, clamping to `maxLength` and filling voids. */
export function spliceChars(
  current: ReadonlyArray<string>,
  startIndex: number,
  insert: ReadonlyArray<string>,
  maxLength: number,
): Array<string> {
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
