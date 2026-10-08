const cache = new Map<string, Intl.Collator>()

/** Locale-aware matcher for search, typeahead, and equality. */
export function createSearchCollator(locale: string): Intl.Collator {
  const cached = cache.get(locale)
  if (cached) {
    return cached
  }

  let collator: Intl.Collator
  try {
    collator = new Intl.Collator(locale, { usage: 'search', sensitivity: 'base' })
  } catch {
    collator = new Intl.Collator(locale, { sensitivity: 'base' })
  }
  cache.set(locale, collator)
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
