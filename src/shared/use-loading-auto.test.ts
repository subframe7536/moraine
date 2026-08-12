import { createRoot, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { useLoadingAutoClick } from './use-loading-auto.ts'

function deferred(): {
  promise: Promise<void>
  reject: (reason?: unknown) => void
  resolve: () => void
} {
  let reject: ((reason?: unknown) => void) | undefined
  let resolve: (() => void) | undefined
  const promise = new Promise<void>((nextResolve, nextReject) => {
    reject = nextReject
    resolve = nextResolve
  })

  return {
    promise,
    reject: (reason) => reject?.(reason),
    resolve: () => resolve?.(),
  }
}

function createClickEvent(): MouseEvent & { currentTarget: HTMLButtonElement; target: Element } {
  return new MouseEvent('click', { cancelable: true }) as MouseEvent & {
    currentTarget: HTMLButtonElement
    target: Element
  }
}

describe('useLoadingAutoClick', () => {
  test('stays loading until every overlapping action settles', async () => {
    const first = deferred()
    const second = deferred()
    const onClick = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const lifecycle = createRoot((dispose) => ({
      dispose,
      state: useLoadingAutoClick<HTMLButtonElement>({
        loadingAuto: () => true,
        onClick,
      }),
    }))

    lifecycle.state.onClick(createClickEvent())
    lifecycle.state.onClick(createClickEvent())

    expect(lifecycle.state.isLoading()).toBe(true)

    second.resolve()
    await Promise.resolve()
    await Promise.resolve()

    expect(lifecycle.state.isLoading()).toBe(true)

    first.resolve()
    await Promise.resolve()
    await Promise.resolve()

    expect(lifecycle.state.isLoading()).toBe(false)
    lifecycle.dispose()
  })

  test('clears loading on rejection without changing the original rejection', async () => {
    const task = deferred()
    const error = new Error('failed')
    const lifecycle = createRoot((dispose) => ({
      dispose,
      state: useLoadingAutoClick<HTMLButtonElement>({
        loadingAuto: () => true,
        onClick: () => task.promise,
      }),
    }))

    lifecycle.state.onClick(createClickEvent())
    expect(lifecycle.state.isLoading()).toBe(true)

    task.reject(error)

    await expect(task.promise).rejects.toBe(error)
    await Promise.resolve()

    expect(lifecycle.state.isLoading()).toBe(false)
    lifecycle.dispose()
  })

  test('does not publish stale completion after its owner is disposed', async () => {
    const task = deferred()
    const lifecycle = createRoot((dispose) => ({
      dispose,
      state: useLoadingAutoClick<HTMLButtonElement>({
        loadingAuto: () => true,
        onClick: () => task.promise,
      }),
    }))

    lifecycle.state.onClick(createClickEvent())
    expect(lifecycle.state.isLoading()).toBe(true)

    lifecycle.dispose()
    task.resolve()
    await Promise.resolve()
    await Promise.resolve()

    expect(lifecycle.state.isLoading()).toBe(true)
  })

  test('does not enter loading for synchronous returns or thrown errors', () => {
    const error = new Error('sync failure')
    const onClick = vi
      .fn()
      .mockReturnValueOnce('done')
      .mockImplementationOnce(() => {
        throw error
      })
    const lifecycle = createRoot((dispose) => ({
      dispose,
      state: useLoadingAutoClick<HTMLButtonElement>({
        loadingAuto: () => true,
        onClick,
      }),
    }))

    lifecycle.state.onClick(createClickEvent())
    expect(lifecycle.state.isLoading()).toBe(false)

    expect(() => lifecycle.state.onClick(createClickEvent())).toThrow(error)
    expect(lifecycle.state.isLoading()).toBe(false)
    lifecycle.dispose()
  })

  test('tracks a non-Promise thenable through settlement', async () => {
    let resolveThenable: (() => void) | undefined
    const thenable = {
      // oxlint-disable-next-line unicorn/no-thenable -- This fixture intentionally exercises PromiseLike interoperability.
      then(onFulfilled: () => void) {
        resolveThenable = onFulfilled
      },
    } as PromiseLike<void>
    const lifecycle = createRoot((dispose) => ({
      dispose,
      state: useLoadingAutoClick<HTMLButtonElement>({
        loadingAuto: () => true,
        onClick: () => thenable,
      }),
    }))

    lifecycle.state.onClick(createClickEvent())
    expect(lifecycle.state.isLoading()).toBe(true)

    await Promise.resolve()
    resolveThenable?.()
    await Promise.resolve()
    await Promise.resolve()

    expect(lifecycle.state.isLoading()).toBe(false)
    lifecycle.dispose()
  })

  test('does not auto-load a prevented async click', () => {
    const task = deferred()
    const lifecycle = createRoot((dispose) => ({
      dispose,
      state: useLoadingAutoClick<HTMLButtonElement>({
        loadingAuto: () => true,
        onClick: (event) => {
          event.preventDefault()
          return task.promise
        },
      }),
    }))

    lifecycle.state.onClick(createClickEvent())

    expect(lifecycle.state.isLoading()).toBe(false)
    lifecycle.dispose()
  })

  test('keeps automatic work visible when controlled loading turns off', async () => {
    const task = deferred()
    const lifecycle = createRoot((dispose) => {
      const [loading, setLoading] = createSignal(true)
      return {
        dispose,
        setLoading,
        state: useLoadingAutoClick<HTMLButtonElement>({
          loading,
          loadingAuto: () => true,
          onClick: () => task.promise,
        }),
      }
    })

    lifecycle.state.onClick(createClickEvent())
    lifecycle.setLoading(false)

    expect(lifecycle.state.isLoading()).toBe(true)

    task.resolve()
    await Promise.resolve()
    await Promise.resolve()

    expect(lifecycle.state.isLoading()).toBe(false)
    lifecycle.dispose()
  })
})
