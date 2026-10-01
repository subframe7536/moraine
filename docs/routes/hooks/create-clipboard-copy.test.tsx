import { createRoot } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { createClipboardCopy } from './create-clipboard-copy'

const writeText = vi.fn<(text: string) => Promise<void>>()
let dispose: () => void

beforeEach(() => {
  vi.useFakeTimers()
  writeText.mockReset().mockResolvedValue(undefined)
  vi.stubGlobal('navigator', { clipboard: { writeText } })
})

afterEach(() => {
  dispose?.()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function setup() {
  return createRoot((cleanup) => {
    dispose = cleanup
    return createClipboardCopy({ resetAfter: 1000 })
  })
}

describe('createClipboardCopy', () => {
  test('copies strings and async sources, then resets feedback', async () => {
    const clipboard = setup()
    expect(clipboard.state()).toBe('idle')
    await clipboard.copy('code')
    expect(writeText).toHaveBeenCalledWith('code')
    expect(clipboard.state()).toBe('copied')
    vi.advanceTimersByTime(1000)
    expect(clipboard.state()).toBe('idle')
    await clipboard.copy(async () => 'markdown')
    expect(writeText).toHaveBeenLastCalledWith('markdown')
    expect(clipboard.state()).toBe('copied')
  })

  test('reports rejected writes and rejected producers through the same feedback', async () => {
    const clipboard = setup()
    writeText.mockRejectedValueOnce(new Error('clipboard denied'))
    await clipboard.copy('code')
    expect(clipboard.state()).toBe('failed')
    vi.advanceTimersByTime(1000)
    expect(clipboard.state()).toBe('idle')
    await clipboard.copy(() => Promise.reject(new Error('network failed')))
    expect(writeText).toHaveBeenCalledTimes(1)
    expect(clipboard.state()).toBe('failed')
  })

  test('repeated copies replace the reset timer', async () => {
    const clipboard = setup()
    await clipboard.copy('first')
    vi.advanceTimersByTime(700)
    await clipboard.copy('second')
    vi.advanceTimersByTime(300)
    expect(clipboard.state()).toBe('copied')
    vi.advanceTimersByTime(700)
    expect(clipboard.state()).toBe('idle')
    expect(vi.getTimerCount()).toBe(0)
  })

  test('an old async producer cannot overwrite a newer copy', async () => {
    const clipboard = setup()
    let resolve!: (text: string) => void
    const pending = clipboard.copy(
      () =>
        new Promise<string>((done) => {
          resolve = done
        }),
    )
    await clipboard.copy('new')
    resolve('old')
    await pending
    expect(writeText).toHaveBeenCalledTimes(1)
    expect(writeText).toHaveBeenCalledWith('new')
  })

  test('cleanup cancels the reset timer and pending producers cannot recreate it', async () => {
    const clipboard = setup()
    await clipboard.copy('code')
    expect(vi.getTimerCount()).toBe(1)
    dispose()
    expect(vi.getTimerCount()).toBe(0)
    const pendingClipboard = setup()
    let resolve!: (text: string) => void
    const pending = pendingClipboard.copy(
      () =>
        new Promise<string>((done) => {
          resolve = done
        }),
    )
    dispose()
    resolve('late')
    await pending
    expect(vi.getTimerCount()).toBe(0)
    expect(writeText).toHaveBeenCalledTimes(1)
  })
})
