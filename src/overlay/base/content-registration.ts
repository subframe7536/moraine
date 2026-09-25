import { createSignal } from 'solid-js'

/** State owned by one mounted styled modal surface. */
export function createContentRegistration() {
  const [headers, setHeaders] = createSignal(0)
  const [footers, setFooters] = createSignal(0)
  const [titles, setTitles] = createSignal<string[]>([])
  const [descriptions, setDescriptions] = createSignal<string[]>([])

  const registerCount = (update: typeof setHeaders) => {
    update((count) => count + 1)
    return () => update((count) => count - 1)
  }
  const registerId = (update: typeof setTitles, id: string) => {
    update((ids) => [...ids, id])
    return () =>
      update((ids) => {
        const index = ids.indexOf(id)
        return index < 0 ? ids : [...ids.slice(0, index), ...ids.slice(index + 1)]
      })
  }

  return {
    registerHeader: () => registerCount(setHeaders),
    registerFooter: () => registerCount(setFooters),
    registerTitle: (id: string) => registerId(setTitles, id),
    registerDescription: (id: string) => registerId(setDescriptions, id),
    hasExplicitHeader: () => headers() > 0,
    hasFooter: () => footers() > 0,
    titleIds: titles,
    descriptionIds: descriptions,
  }
}
