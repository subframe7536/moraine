import { describe, expect, test } from 'vitest'

import {
  docsPageLoadingFromPath,
  isDocsPageLoading,
  loadDocsPage,
  markDocsNavigationReady,
} from './docs-route-loading'

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((next, fail) => {
    resolve = next
    reject = fail
  })
  return { promise, reject, resolve }
}

describe('docs route loading', () => {
  test('ignores hydration, tracks concurrent navigation loads, and clears failures', async () => {
    const initial = createDeferred<string>()
    const initialLoad = loadDocsPage(() => initial.promise)

    expect(isDocsPageLoading()).toBe(false)
    initial.resolve('initial')
    await expect(initialLoad).resolves.toBe('initial')

    markDocsNavigationReady()
    window.history.replaceState(null, '', '/current-page')

    const first = createDeferred<string>()
    const second = createDeferred<string>()
    const firstLoad = loadDocsPage(() => first.promise)
    const secondLoad = loadDocsPage(() => second.promise)

    expect(isDocsPageLoading()).toBe(true)
    expect(docsPageLoadingFromPath()).toBe('/current-page')

    first.resolve('first')
    await expect(firstLoad).resolves.toBe('first')
    expect(isDocsPageLoading()).toBe(true)

    second.reject(new Error('load failed'))
    await expect(secondLoad).rejects.toThrow('load failed')
    expect(isDocsPageLoading()).toBe(false)
    expect(docsPageLoadingFromPath()).toBeUndefined()
  })
})
