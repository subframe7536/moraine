import { render, waitFor } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { useHashScrolling } from './use-hash-scrolling'

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    queueMicrotask(() => callback(0))
    return 1
  })
  Element.prototype.scrollIntoView = vi.fn()
  window.history.replaceState(null, '', '/')
})
afterEach(() => {
  vi.unstubAllGlobals()
  window.history.replaceState(null, '', '/')
})

function setup() {
  const root = document.createElement('div')
  document.body.append(root)
  const [path, setPath] = createSignal('/start')
  const [hash, setHash] = createSignal(window.location.hash)
  const [ready, setReady] = createSignal(true)
  const view = render(() => {
    useHashScrolling({ element: () => root, path, hash, ready })
    return <div />
  })
  return { root, setPath, setHash, setReady, view }
}

test('initial encoded hash scrolls after the committed target appears', async () => {
  window.history.replaceState(null, '', '/start#with%20space')
  const { root, view } = setup()
  const target = document.createElement('h2')
  target.id = 'with space'
  root.append(target)
  await waitFor(() => expect(target.scrollIntoView).toHaveBeenCalledWith({ block: 'start' }))
  view.unmount()
  root.remove()
})

test('route hash waits for readiness and browser history hash changes scroll', async () => {
  const { root, setPath, setHash, setReady, view } = setup()
  const target = document.createElement('h2')
  target.id = 'api'
  root.append(target)
  setReady(false)
  window.history.replaceState(null, '', '/button#api')
  setPath('/button')
  setHash('#api')
  await Promise.resolve()
  expect(target.scrollIntoView).not.toHaveBeenCalled()
  setReady(true)
  await waitFor(() => expect(target.scrollIntoView).toHaveBeenCalledTimes(1))
  const other = document.createElement('h2')
  other.id = 'usage'
  root.append(other)
  window.history.replaceState(null, '', '/button#usage')
  window.dispatchEvent(new HashChangeEvent('hashchange'))
  await waitFor(() => expect(other.scrollIntoView).toHaveBeenCalledWith({ block: 'start' }))
  view.unmount()
  root.remove()
})

test('missing and malformed targets do not scroll; no-hash route leaves scrolling alone', async () => {
  window.history.replaceState(null, '', '/start#missing')
  const { root, setPath, setHash, view } = setup()
  const target = document.createElement('h2')
  target.id = 'real'
  root.append(target)
  await Promise.resolve()
  expect(target.scrollIntoView).not.toHaveBeenCalled()
  window.history.replaceState(null, '', '/start#%E0%A4%A')
  setHash('#%E0%A4%A')
  setPath('/other')
  await Promise.resolve()
  expect(target.scrollIntoView).not.toHaveBeenCalled()
  window.history.replaceState(null, '', '/other')
  setHash('')
  setPath('/start')
  await Promise.resolve()
  expect(target.scrollIntoView).not.toHaveBeenCalled()
  view.unmount()
  root.remove()
})
