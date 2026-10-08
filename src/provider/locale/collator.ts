import { FALLBACK_LOCALE } from './default-locale'

const cache = new Map<string, Intl.Collator>()

function createCollator(locale: string, options: Intl.CollatorOptions): Intl.Collator {
  try {
    return new Intl.Collator(locale, options)
  } catch {
    return new Intl.Collator(FALLBACK_LOCALE, options)
  }
}

/** Locale-aware matcher for search, typeahead, and equality. */
export function createSearchCollator(locale: string): Intl.Collator {
  const key = locale || FALLBACK_LOCALE
  const cached = cache.get(key)
  if (cached) {
    return cached
  }

  let collator: Intl.Collator
  try {
    collator = createCollator(key, { usage: 'search', sensitivity: 'base' })
  } catch {
    collator = createCollator(key, { sensitivity: 'base' })
  }
  cache.set(key, collator)
  return collator
}

function normalize(value: string): string {
  return value.normalize('NFKC')
}

export function collatorStartsWith(collator: Intl.Collator, value: string, query: string): boolean {
  if (query.length === 0) {
    return true
  }
  const haystack = normalize(value)
  const needle = normalize(query)
  return collator.compare(haystack.slice(0, needle.length), needle) === 0
}

export function collatorEndsWith(collator: Intl.Collator, value: string, query: string): boolean {
  if (query.length === 0) {
    return true
  }
  const haystack = normalize(value)
  const needle = normalize(query)
  if (needle.length > haystack.length) {
    return false
  }
  return collator.compare(haystack.slice(haystack.length - needle.length), needle) === 0
}

export function collatorIncludes(collator: Intl.Collator, value: string, query: string): boolean {
  if (query.length === 0) {
    return true
  }
  const haystack = normalize(value)
  const needle = normalize(query)
  if (needle.length > haystack.length) {
    return false
  }
  for (let index = 0; index <= haystack.length - needle.length; index += 1) {
    if (collator.compare(haystack.slice(index, index + needle.length), needle) === 0) {
      return true
    }
  }
  return false
}

export function collatorEquals(collator: Intl.Collator, left: string, right: string): boolean {
  return collator.compare(normalize(left), normalize(right)) === 0
}
