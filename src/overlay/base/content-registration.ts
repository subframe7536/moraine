import { createEffect, createSignal, createUniqueId, on, onCleanup } from 'solid-js'

export function useRegisteredContentId(
  source: () => string | undefined,
  register: (id: string) => () => void,
) {
  const fallbackId = createUniqueId()
  const id = () => source() ?? fallbackId
  let unregister = register(id())

  createEffect(
    on(
      id,
      (next) => {
        unregister()
        unregister = register(next)
      },
      { defer: true },
    ),
  )
  onCleanup(() => unregister())
  return id
}

/** State owned by one mounted styled modal surface. */
export function createContentRegistration() {
  const [headers, setHeaders] = createSignal(0)
  const [titles, setTitles] = createSignal<string[]>([])
  const [descriptions, setDescriptions] = createSignal<string[]>([])

  const registerHeader = () => {
    setHeaders((count) => count + 1)
    return () => setHeaders((count) => count - 1)
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
    registerHeader,
    registerTitle: (id: string) => registerId(setTitles, id),
    registerDescription: (id: string) => registerId(setDescriptions, id),
    hasExplicitHeader: () => headers() > 0,
    titleIds: titles,
    descriptionIds: descriptions,
  }
}
