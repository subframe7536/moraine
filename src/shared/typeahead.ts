import { onCleanup } from 'solid-js'

export interface CreateTypeaheadOptions<T> {
  getItems: () => readonly T[]
  getStartIndex: () => number
  getText: (item: T) => string | undefined
  isDisabled?: (item: T) => boolean
  onMatch: (item: T, index: number) => void
  timeout?: number
}

/** Incremental Unicode-aware typeahead with repeated-character cycling. */
export function createTypeahead<T>(options: CreateTypeaheadOptions<T>): {
  handleKeyDown: (event: KeyboardEvent) => boolean
  reset: () => void
} {
  let search = ''
  let matchIndex = -1
  let startIndex = 0
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = options.timeout ?? 500
  const normalize = (value: string): string => value.normalize('NFKC').toLocaleLowerCase()

  function reset(): void {
    search = ''
    startIndex = 0
    matchIndex = -1
    clearTimeout(timeoutId)
    timeoutId = undefined
  }

  function findMatch(items: readonly T[], value: string, initialIndex: number): number {
    for (let offset = 0; offset < items.length; offset += 1) {
      const index = (initialIndex + offset) % items.length
      const item = items[index]

      if (!item || options.isDisabled?.(item)) {
        continue
      }

      const text = options.getText(item)
      if (text && normalize(text).startsWith(value)) {
        return index
      }
    }

    return -1
  }

  function handleKeyDown(event: KeyboardEvent): boolean {
    const character = event.key.length === 1 ? event.key : ''
    if (!character || event.ctrlKey || event.metaKey || event.altKey) {
      return false
    }

    if (character === ' ' && search.length === 0) {
      return false
    }

    const items = options.getItems()
    if (items.length === 0) {
      return false
    }

    event.preventDefault()
    const normalizedCharacter = normalize(character)
    if (search === '') {
      startIndex = options.getStartIndex() + 1
    }

    let nextSearch = search + normalizedCharacter
    let nextStartIndex = startIndex
    let nextMatchIndex = findMatch(items, nextSearch, nextStartIndex)
    if (
      nextMatchIndex === -1 &&
      nextSearch.length > 1 &&
      [...nextSearch].every((value) => value === normalizedCharacter)
    ) {
      nextSearch = normalizedCharacter
      nextStartIndex = matchIndex + 1
      nextMatchIndex = findMatch(items, nextSearch, nextStartIndex)
    }

    const match = items[nextMatchIndex]
    if (match) {
      options.onMatch(match, nextMatchIndex)
      search = nextSearch
      matchIndex = nextMatchIndex
    } else if (character !== ' ') {
      search = ''
      matchIndex = -1
    }

    clearTimeout(timeoutId)
    timeoutId = setTimeout(reset, timeout)
    return true
  }

  onCleanup(reset)
  return { handleKeyDown, reset }
}
