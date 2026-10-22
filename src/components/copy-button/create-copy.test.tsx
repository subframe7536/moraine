import { createRoot } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { createCopy } from './create-copy'

const writeText = vi.fn<(text: string) => Promise<void>>()
const write = vi.fn<(items: ClipboardItem[]) => Promise<void>>()
let dispose: () => void

beforeEach(() => {
  vi.useFakeTimers()
  writeText.mockReset().mockResolvedValue(undefined)
  write.mockReset().mockResolvedValue(undefined)
  vi.stubGlobal('navigator', {
    clipboard: {
      writeText,
      write,
    },
  })
})

afterEach(() => {
  dispose?.()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function setup(options = {}) {
  return createRoot((cleanup) => {
    dispose = cleanup
    return createCopy({ copiedDuration: 1000, ...options })
  })
}

describe('createCopy', () => {
  test('copies strings and resets feedback after copiedDuration', async () => {
    const clipboard = setup()
    expect(clipboard.state()).toBe('idle')
    expect(clipboard.copied()).toBe(false)

    const success = await clipboard.copy('hello world')
    expect(success).toBe(true)
    expect(writeText).toHaveBeenCalledWith('hello world')
    expect(clipboard.state()).toBe('copied')
    expect(clipboard.copied()).toBe(true)
    expect(clipboard.data()).toBe('hello world')

    vi.advanceTimersByTime(1000)
    expect(clipboard.state()).toBe('idle')
    expect(clipboard.copied()).toBe(false)
  })

  test('copies ClipboardItem using modern navigator.clipboard.write', async () => {
    const clipboard = setup()
    const item = { types: ['text/plain'] } as unknown as ClipboardItem

    const success = await clipboard.copy(item)
    expect(success).toBe(true)
    expect(write).toHaveBeenCalledWith([item])
    expect(clipboard.state()).toBe('copied')
  })

  test('falls back to command when navigator.clipboard is unavailable', async () => {
    vi.stubGlobal('navigator', {})
    const execCommand = vi.fn().mockReturnValue(true)
    document.execCommand = execCommand

    const clipboard = setup()
    const success = await clipboard.copy('fallback string')
    expect(success).toBe(true)
    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(clipboard.state()).toBe('copied')
  })

  test('falls back to command when navigator.clipboard.writeText rejects', async () => {
    writeText.mockRejectedValueOnce(new Error('Permission denied'))
    const execCommand = vi.fn().mockReturnValue(true)
    document.execCommand = execCommand

    const clipboard = setup()
    const success = await clipboard.copy('fallback text')
    expect(success).toBe(true)
    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(clipboard.state()).toBe('copied')
  })

  test('extracts text/plain from ClipboardItem on legacy fallback', async () => {
    vi.stubGlobal('navigator', {})
    const execCommand = vi.fn().mockReturnValue(true)
    document.execCommand = execCommand

    const mockItem = {
      types: ['text/plain'],
      getType: vi.fn().mockResolvedValue({
        text: () => Promise.resolve('extracted text'),
      }),
    } as unknown as ClipboardItem

    const clipboard = setup()
    const success = await clipboard.copy(mockItem)
    expect(success).toBe(true)
    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(clipboard.state()).toBe('copied')
  })

  test('falls back to JSON.stringify when ClipboardItem has no text type', async () => {
    vi.stubGlobal('navigator', {})
    let copiedContent = ''
    const origCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreateElement(tag)
      if (tag === 'textarea') {
        Object.defineProperty(el, 'value', {
          set: (val: string) => {
            copiedContent = val
          },
          get: () => copiedContent,
        })
      }
      return el
    })
    const execCommand = vi.fn().mockReturnValue(true)
    document.execCommand = execCommand

    const nonTextData = { foo: 'bar' } as unknown as ClipboardItem
    const clipboard = setup()
    const success = await clipboard.copy(nonTextData)
    expect(success).toBe(true)
    expect(copiedContent).toBe(JSON.stringify(nonTextData))
    expect(clipboard.state()).toBe('copied')
  })

  test('reports failure when modern API and execCommand both fail', async () => {
    writeText.mockRejectedValue(new Error('Modern writeText failed'))
    document.execCommand = vi.fn().mockReturnValue(false)

    const onError = vi.fn()
    const clipboard = setup({ onError })
    const success = await clipboard.copy('will fail')
    expect(success).toBe(false)
    expect(clipboard.state()).toBe('failed')
    expect(clipboard.copied()).toBe(false)
    expect(onError).toHaveBeenCalled()

    vi.advanceTimersByTime(1000)
    expect(clipboard.state()).toBe('idle')
  })

  test('fires onStatusChange for transitions', async () => {
    const onStatusChange = vi.fn()
    const clipboard = setup({ onStatusChange })

    await clipboard.copy('status check')
    expect(onStatusChange).toHaveBeenCalledWith({
      copied: true,
      state: 'copied',
      data: 'status check',
    })

    vi.advanceTimersByTime(1000)
    expect(onStatusChange).toHaveBeenCalledWith({
      copied: false,
      state: 'idle',
      data: 'status check',
    })
  })

  test('reset cancels the duration timer and resets state to idle', async () => {
    const clipboard = setup()
    await clipboard.copy('test')
    expect(clipboard.state()).toBe('copied')

    clipboard.reset()
    expect(clipboard.state()).toBe('idle')
    expect(vi.getTimerCount()).toBe(0)
  })

  test('cleanup cancels reset timer on unmount', async () => {
    const clipboard = setup()
    await clipboard.copy('unmount-test')
    expect(vi.getTimerCount()).toBe(1)

    dispose()
    expect(vi.getTimerCount()).toBe(0)
  })
})
