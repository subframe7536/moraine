import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { IconButton } from './icon-button'

function createDeferred() {
  let resolve: (() => void) | undefined
  const promise = new Promise<void>((r) => {
    resolve = r
  })

  return {
    promise,
    resolve: () => {
      resolve?.()
    },
  }
}

describe('IconButton', () => {
  test('auto loading follows async onclick lifecycle', async () => {
    const deferred = createDeferred()
    const onClick = vi.fn(() => deferred.promise)
    const screen = render(() => (
      <IconButton name="i-lucide:copy" aria-label="Copy" loadingAuto onClick={onClick} />
    ))

    const button = screen.getByRole('button', { name: 'Copy' })
    expect(button.getAttribute('data-slot')).toBe('root')
    await fireEvent.click(button)

    expect(onClick).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      expect(button.hasAttribute('data-loading')).toBe(true)
      expect(button.getAttribute('aria-busy')).toBe('true')
      expect(button.hasAttribute('disabled')).toBe(true)
    })

    deferred.resolve()

    await waitFor(() => {
      expect(button.hasAttribute('data-loading')).toBe(false)
      expect(button.hasAttribute('aria-busy')).toBe(false)
      expect(button.hasAttribute('disabled')).toBe(false)
    })
  })

  test('does not auto load for synchronous onclick handler', async () => {
    const onClick = vi.fn(() => 'ok')
    const screen = render(() => (
      <IconButton name="i-lucide:copy" aria-label="Copy" loadingAuto onClick={onClick} />
    ))

    const button = screen.getByRole('button', { name: 'Copy' })
    await fireEvent.click(button)

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(button.hasAttribute('data-loading')).toBe(false)
    expect(button.hasAttribute('aria-busy')).toBe(false)
    expect(button.hasAttribute('disabled')).toBe(false)
  })

  test('controlled loading keeps button busy even when loadingAuto is enabled', () => {
    const screen = render(() => (
      <IconButton name="i-lucide:copy" aria-label="Copy" loading loadingAuto />
    ))

    const button = screen.getByRole('button', { name: 'Copy' })

    expect(button.hasAttribute('data-loading')).toBe(true)
    expect(button.getAttribute('aria-busy')).toBe('true')
    expect(button.hasAttribute('disabled')).toBe(true)
  })

  test('switches icon between default and loading icon during auto loading', async () => {
    const deferred = createDeferred()
    const onClick = vi.fn(() => deferred.promise)
    const screen = render(() => (
      <IconButton
        name="i-lucide:copy"
        loadingIcon="i-lucide:check"
        aria-label="Copy"
        loadingAuto
        classes={{ icon: 'data-loading:animate-loading' }}
        onClick={onClick}
      />
    ))

    const button = screen.getByRole('button', { name: 'Copy' })
    const icon = () => screen.container.querySelector('[data-slot="icon"]')

    expect(icon()?.className).toContain('i-lucide:copy')

    await fireEvent.click(button)

    await waitFor(() => {
      expect(icon()?.className).toContain('i-lucide:check')
      expect(icon()?.className).toContain('data-loading:animate-loading')
    })

    deferred.resolve()

    await waitFor(() => {
      expect(icon()?.className).toContain('i-lucide:copy')
      expect(icon()?.className).toContain('data-loading:animate-loading')
    })
  })
})
