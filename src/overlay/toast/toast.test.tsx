import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { finishExitMotion } from '../../test-util/overlay-test'

import { createToastStore } from './toast-store'

import { Toast } from './index'

describe('Toast', () => {
  beforeEach(() => {
    Toast.clear()
    Toast.preventDuplicate = false
    // jsdom reports an unfocused document by default; the host re-syncs from hasFocus() on attach.
    vi.spyOn(document, 'hasFocus').mockReturnValue(true)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    Toast.clear()
  })

  it('renders a toast with default props', async () => {
    render(() => <Toast />)

    Toast.show('My Toast Notification')

    expect(await screen.findByText('My Toast Notification')).not.toBeNull()
    const toastItem = document.querySelector('[data-slot="toast"]')
    expect(toastItem).not.toBeNull()
    expect(toastItem?.hasAttribute('data-front')).toBe(true)
  })

  it('renders JSX messages instead of treating DOM nodes as options', async () => {
    render(() => <Toast />)

    Toast.show(<strong data-testid="jsx-message">JSX toast body</strong>)

    const message = await screen.findByTestId('jsx-message')
    expect(message.textContent).toBe('JSX toast body')
    expect(message.closest('[data-slot="toast"]')).not.toBeNull()
  })

  it('renders toast variant helpers (success, error, warning, info, loading)', async () => {
    render(() => <Toast />)

    Toast.success('Success message')
    Toast.error('Error message')
    Toast.warning('Warning message')
    Toast.info('Info message')
    Toast.loading('Loading message')

    expect(await screen.findByText('Success message')).not.toBeNull()
    expect(await screen.findByText('Error message')).not.toBeNull()
    expect(await screen.findByText('Warning message')).not.toBeNull()
    expect(await screen.findByText('Info message')).not.toBeNull()
    expect(await screen.findByText('Loading message')).not.toBeNull()

    const toasts = document.querySelectorAll('[data-slot="toast"]')
    expect(toasts.length).toBe(5)
  })

  it('renders action button and triggers callback on click', async () => {
    const handleAction = vi.fn()
    render(() => <Toast />)

    Toast.show('Action Needed', {
      action: {
        label: 'Undo Action',
        onClick: handleAction,
      },
    })

    const actionButton = await screen.findByRole('button', { name: 'Undo Action' })
    expect(actionButton).not.toBeNull()

    fireEvent.click(actionButton)
    expect(handleAction).toHaveBeenCalledTimes(1)

    await finishExitMotion()
    await waitFor(() => {
      expect(screen.queryByText('Action Needed')).toBeNull()
    })
  })

  it('renders cancel button and triggers callback on click', async () => {
    const handleCancel = vi.fn()
    render(() => <Toast />)

    Toast.show('Discard changes?', {
      cancel: {
        label: 'Cancel',
        onClick: handleCancel,
      },
    })

    const cancelButton = await screen.findByRole('button', { name: 'Cancel' })
    expect(cancelButton).not.toBeNull()

    fireEvent.click(cancelButton)
    expect(handleCancel).toHaveBeenCalledTimes(1)

    await finishExitMotion()
    await waitFor(() => {
      expect(screen.queryByText('Discard changes?')).toBeNull()
    })
  })

  it('renders close button and dismisses on click', async () => {
    render(() => <Toast closeButton closeButtonAriaLabel="Dismiss notification" />)

    Toast.show('Closable item')

    const closeBtn = await screen.findByRole('button', { name: 'Dismiss notification' })
    expect(closeBtn).not.toBeNull()

    fireEvent.click(closeBtn)
    await finishExitMotion()
    await waitFor(() => {
      expect(screen.queryByText('Closable item')).toBeNull()
    })
  })

  it('keeps the same toast node mounted through close exit animation', async () => {
    render(() => <Toast closeButton closeButtonAriaLabel="Dismiss notification" />)

    Toast.show('Exit close anim')
    const label = await screen.findByText('Exit close anim')
    const item = label.closest('[data-slot="toast"]') as HTMLElement
    expect(item).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }))

    // Same DOM node must remain so CSS transform/opacity transitions can play.
    expect(document.querySelector('[data-slot="toast"]')).toBe(item)
    expect(item.style.opacity).toBe('0')

    await finishExitMotion()
    await waitFor(() => {
      expect(screen.queryByText('Exit close anim')).toBeNull()
    })
  })

  it('keeps the same toast node mounted through programmatic dismiss exit animation', async () => {
    render(() => <Toast />)

    const id = Toast.show('Exit dismiss anim')
    const label = await screen.findByText('Exit dismiss anim')
    const item = label.closest('[data-slot="toast"]') as HTMLElement

    Toast.dismiss(id)

    expect(document.querySelector('[data-slot="toast"]')).toBe(item)
    expect(item.style.opacity).toBe('0')

    await finishExitMotion()
    await waitFor(() => {
      expect(screen.queryByText('Exit dismiss anim')).toBeNull()
    })
  })

  it('keeps the same toast node mounted through auto-dismiss exit animation', async () => {
    vi.useFakeTimers()
    try {
      render(() => <Toast duration={500} />)
      await Promise.resolve()

      Toast.show('Exit auto anim')
      const label = screen.getByText('Exit auto anim')
      const item = label.closest('[data-slot="toast"]') as HTMLElement

      await vi.advanceTimersByTimeAsync(600)

      expect(document.querySelector('[data-slot="toast"]')).toBe(item)
      expect(item.style.opacity).toBe('0')

      await finishExitMotion()
      expect(screen.queryByText('Exit auto anim')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('uses item-level closeButtonAriaLabel over the host default', async () => {
    render(() => <Toast closeButton closeButtonAriaLabel="Host close" />)

    Toast.show('Item label', { closeButton: true, closeButtonAriaLabel: 'Item close' })

    expect(await screen.findByRole('button', { name: 'Item close' })).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Host close' })).toBeNull()
  })

  it('defaults role to alert for error and status otherwise', async () => {
    render(() => <Toast />)

    Toast.show('Status toast')
    Toast.error('Error toast')

    const statusToast = (await screen.findByText('Status toast')).closest('[data-slot="toast"]')
    const errorToast = (await screen.findByText('Error toast')).closest('[data-slot="toast"]')
    expect(statusToast?.getAttribute('role')).toBe('status')
    expect(errorToast?.getAttribute('role')).toBe('alert')
  })

  it('forwards action class and style to the action button', async () => {
    render(() => <Toast />)

    Toast.show('Styled action', {
      action: {
        label: 'Retry',
        class: 'toast-action-extra',
        style: { color: 'rgb(255, 0, 0)' },
      },
    })

    const actionButton = await screen.findByRole('button', { name: 'Retry' })
    expect(actionButton.className).toContain('toast-action-extra')
    expect(actionButton.style.color).toBe('rgb(255, 0, 0)')
  })

  it('auto-dismisses after duration', async () => {
    vi.useFakeTimers()
    try {
      render(() => <Toast duration={2000} />)
      await Promise.resolve()

      Toast.show('Auto fading message')
      expect(screen.getByText('Auto fading message')).not.toBeNull()

      await vi.advanceTimersByTimeAsync(2100)
      await finishExitMotion()

      expect(screen.queryByText('Auto fading message')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('auto-dismisses when expand is set', async () => {
    vi.useFakeTimers()
    try {
      render(() => <Toast duration={2000} expand />)
      await Promise.resolve()

      Toast.show('Expanded auto dismiss')
      expect(screen.getByText('Expanded auto dismiss')).not.toBeNull()

      await vi.advanceTimersByTimeAsync(2100)
      await finishExitMotion()

      expect(screen.queryByText('Expanded auto dismiss')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('pauses timer on hover and resumes on mouse leave', async () => {
    vi.useFakeTimers()
    try {
      render(() => <Toast duration={3000} />)
      await Promise.resolve()

      Toast.show('Hover test toast')
      expect(screen.getByText('Hover test toast')).not.toBeNull()

      const list = screen.getByRole('list')

      await vi.advanceTimersByTimeAsync(1500)
      expect(screen.queryByText('Hover test toast')).not.toBeNull()

      fireEvent.mouseEnter(list)

      await vi.advanceTimersByTimeAsync(3000)
      expect(screen.queryByText('Hover test toast')).not.toBeNull()

      fireEvent.mouseLeave(list)

      await vi.advanceTimersByTimeAsync(1600)
      await finishExitMotion()
      expect(screen.queryByText('Hover test toast')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('pauses timer on window blur and document hidden', async () => {
    vi.useFakeTimers()
    try {
      render(() => <Toast duration={2000} />)
      await Promise.resolve()

      Toast.show('Blur pause toast')
      expect(screen.getByText('Blur pause toast')).not.toBeNull()

      await vi.advanceTimersByTimeAsync(800)
      fireEvent.blur(window)
      await vi.advanceTimersByTimeAsync(3000)
      expect(screen.queryByText('Blur pause toast')).not.toBeNull()

      fireEvent.focus(window)
      Object.defineProperty(document, 'hidden', { configurable: true, value: true })
      fireEvent(document, new Event('visibilitychange'))
      await vi.advanceTimersByTimeAsync(3000)
      expect(screen.queryByText('Blur pause toast')).not.toBeNull()

      Object.defineProperty(document, 'hidden', { configurable: true, value: false })
      fireEvent(document, new Event('visibilitychange'))
      await vi.advanceTimersByTimeAsync(1300)
      await finishExitMotion()
      expect(screen.queryByText('Blur pause toast')).toBeNull()
    } finally {
      Object.defineProperty(document, 'hidden', { configurable: true, value: false })
      vi.useRealTimers()
    }
  })

  it('only tracks window focus/visibility while host has toasts', async () => {
    vi.useFakeTimers()
    const hasFocus = vi.mocked(document.hasFocus)
    try {
      render(() => <Toast duration={1000} />)
      await Promise.resolve()

      // No toasts: blur is ignored, so it can't leave the host stuck paused.
      fireEvent.blur(window)
      Toast.show('First toast')
      await vi.advanceTimersByTimeAsync(1200)
      await finishExitMotion()
      expect(screen.queryByText('First toast')).toBeNull()

      // Re-attach re-syncs from document.hasFocus(): an unfocused window starts paused.
      hasFocus.mockReturnValue(false)
      Toast.show('Second toast')
      await vi.advanceTimersByTimeAsync(3000)
      expect(screen.queryByText('Second toast')).not.toBeNull()

      fireEvent.focus(window)
      await vi.advanceTimersByTimeAsync(1200)
      await finishExitMotion()
      expect(screen.queryByText('Second toast')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('resets the timer when updating an existing id', async () => {
    vi.useFakeTimers()
    try {
      render(() => <Toast duration={2000} />)
      await Promise.resolve()

      Toast.show('Original', { id: 'same' })
      await vi.advanceTimersByTimeAsync(1500)
      Toast.show('Updated', { id: 'same' })
      await vi.advanceTimersByTimeAsync(1500)
      expect(screen.queryByText('Updated')).not.toBeNull()

      await vi.advanceTimersByTimeAsync(600)
      await finishExitMotion()
      expect(screen.queryByText('Updated')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('supports custom JSX toasts via Toast.custom', async () => {
    render(() => <Toast />)

    Toast.custom((id) => (
      <div data-testid="custom-toast">
        <span>Custom JSX Content {id}</span>
        <button type="button" onClick={() => Toast.dismiss(id)}>
          Close Custom
        </button>
      </div>
    ))

    expect(await screen.findByTestId('custom-toast')).not.toBeNull()
    expect(screen.getByText(/Custom JSX Content/)).not.toBeNull()

    const closeBtn = screen.getByRole('button', { name: 'Close Custom' })
    fireEvent.click(closeBtn)

    await finishExitMotion()
    await waitFor(() => {
      expect(screen.queryByTestId('custom-toast')).toBeNull()
    })
  })

  it('handles promise resolution transitions', async () => {
    render(() => <Toast />)

    let resolvePromise: (val: string) => void
    const samplePromise = new Promise<string>((res) => {
      resolvePromise = res
    })

    const promiseReturn = Toast.promise(samplePromise, {
      loading: 'Saving profile...',
      success: (data) => `Profile saved: ${data}`,
      error: 'Failed to save',
    })

    expect(await screen.findByText('Saving profile...')).not.toBeNull()

    resolvePromise!('Alice')

    expect(await screen.findByText('Profile saved: Alice')).not.toBeNull()
    expect(await promiseReturn.unwrap()).toBe('Alice')
  })

  it('handles promise rejection transitions', async () => {
    render(() => <Toast />)

    let rejectPromise: (err: Error) => void
    const samplePromise = new Promise<string>((_res, rej) => {
      rejectPromise = rej
    })

    const promiseReturn = Toast.promise(samplePromise, {
      loading: 'Uploading file...',
      success: 'File uploaded',
      error: (err) => `Upload failed: ${(err as Error).message}`,
    })

    expect(await screen.findByText('Uploading file...')).not.toBeNull()

    rejectPromise!(new Error('Network error'))

    expect(await screen.findByText('Upload failed: Network error')).not.toBeNull()
    await expect(promiseReturn.unwrap()).rejects.toThrow('Network error')
  })

  it('dismisses the loading toast when a promise settles without a matching handler', async () => {
    render(() => <Toast />)

    let resolvePromise: (val: string) => void
    const samplePromise = new Promise<string>((res) => {
      resolvePromise = res
    })

    Toast.promise(samplePromise, {
      loading: 'Only error handler',
      error: 'Failed',
    })

    expect(await screen.findByText('Only error handler')).not.toBeNull()
    resolvePromise!('ok')

    await finishExitMotion()
    await waitFor(() => {
      expect(screen.queryByText('Only error handler')).toBeNull()
    })
  })

  it('does not apply the final duration to the loading toast', async () => {
    vi.useFakeTimers()
    try {
      render(() => <Toast />)
      await Promise.resolve()

      const pending = new Promise<string>(() => {})
      Toast.promise(pending, {
        loading: 'Still loading',
        success: 'Done',
        duration: 50,
      })

      expect(screen.getByText('Still loading')).not.toBeNull()
      await vi.advanceTimersByTimeAsync(400)
      expect(screen.queryByText('Still loading')).not.toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('defaults preventDuplicate to false', async () => {
    render(() => <Toast />)

    expect(Toast.preventDuplicate).toBe(false)
    const id1 = Toast.show('Repeated default message')
    const id2 = Toast.show('Repeated default message')

    expect(id1).not.toBe(id2)
    await screen.findAllByText('Repeated default message')
    const toasts = document.querySelectorAll('[data-slot="toast"]')
    expect(toasts.length).toBe(2)
  })

  it('supports placement top and bottom', async () => {
    render(() => <Toast placement="top" align="center" />)
    Toast.show('Top notification')

    await screen.findByText('Top notification')
    const list = screen.getByRole('list')
    expect(list.className).toContain('top-4')
  })

  it('does not leak scoped host preventDuplicate to the default host', async () => {
    render(() => (
      <>
        <Toast />
        <Toast id="scoped-pd" preventDuplicate />
      </>
    ))

    expect(Toast.preventDuplicate).toBe(false)
    const d1 = Toast.show('Default message')
    const d2 = Toast.show('Default message')
    expect(d1).not.toBe(d2)

    const s1 = Toast.show('Scoped message', { toastId: 'scoped-pd' })
    const s2 = Toast.show('Scoped message', { toastId: 'scoped-pd' })
    expect(s1).toBe(s2)
  })

  it('prevents duplicates and bumps bumpKey when preventDuplicate is set', async () => {
    Toast.preventDuplicate = true
    render(() => <Toast />)

    const id1 = Toast.show('Duplicate message')
    const id2 = Toast.show('Duplicate message')

    expect(id1).toBe(id2)

    await screen.findByText('Duplicate message')
    const toasts = document.querySelectorAll('[data-slot="toast"]')
    expect(toasts.length).toBe(1)
  })

  it('prevents duplicates only against the front toast in the stack', async () => {
    Toast.preventDuplicate = true
    render(() => <Toast />)

    const idA1 = Toast.show('Toast A')
    const idB = Toast.show('Toast B')

    const idA2 = Toast.show('Toast A')
    expect(idA2).not.toBe(idA1)
    expect(idA2).not.toBe(idB)

    await screen.findByText('Toast B')
    const toasts = document.querySelectorAll('[data-slot="toast"]')
    expect(toasts.length).toBe(3)

    const idA3 = Toast.show('Toast A')
    expect(idA3).toBe(idA2)
  })

  it('allows customizing preventDuplicate when calling Toast.show or similar functions', async () => {
    Toast.preventDuplicate = true
    render(() => <Toast />)

    const id1 = Toast.show('Allow duplicate')
    const id2 = Toast.show('Allow duplicate', { preventDuplicate: false })
    expect(id1).not.toBe(id2)

    Toast.preventDuplicate = false
    const s1 = Toast.success('Saved', { preventDuplicate: true })
    const s2 = Toast.success('Saved', { preventDuplicate: true })
    expect(s1).toBe(s2)

    const e1 = Toast.error('Error: network timeout', {
      preventDuplicate: (candidate, front) =>
        typeof candidate.title === 'string' &&
        candidate.title.startsWith('Error:') &&
        typeof front.title === 'string' &&
        front.title.startsWith('Error:'),
    })
    const e2 = Toast.error('Error: server disconnect', {
      preventDuplicate: (candidate, front) =>
        typeof candidate.title === 'string' &&
        candidate.title.startsWith('Error:') &&
        typeof front.title === 'string' &&
        front.title.startsWith('Error:'),
    })
    expect(e1).toBe(e2)

    const c1 = Toast.custom((id) => <div>Custom {id}</div>, {
      id: 'custom-single',
      preventDuplicate: true,
    })
    const c2 = Toast.custom((id) => <div>Custom {id}</div>, {
      id: 'custom-single',
      preventDuplicate: true,
    })
    expect(c1).toBe(c2)
  })

  it('applies inert and data-limited to toasts past visibleToasts limit', async () => {
    render(() => <Toast visibleToasts={2} />)

    Toast.show('Toast 1')
    Toast.show('Toast 2')
    Toast.show('Toast 3')

    await screen.findByText('Toast 1')
    await screen.findByText('Toast 2')
    await screen.findByText('Toast 3')

    const toasts = document.querySelectorAll<HTMLElement>('[data-slot="toast"]')
    expect(toasts.length).toBe(3)

    expect(toasts[2]?.hasAttribute('data-limited')).toBe(true)
    expect(toasts[0]?.hasAttribute('data-limited')).toBe(false)
    expect(toasts[1]?.hasAttribute('data-limited')).toBe(false)
  })

  it('filters by toastId for scoped host instances', async () => {
    render(() => (
      <>
        <Toast />
        <Toast id="scoped-host" />
      </>
    ))

    Toast.show('Global notification')
    Toast.show('Scoped notification', { toastId: 'scoped-host' })

    await screen.findByText('Global notification')
    await screen.findByText('Scoped notification')

    const lists = document.querySelectorAll('ul')
    expect(lists.length).toBe(2)
    expect(lists[0]?.textContent).toContain('Global notification')
    expect(lists[0]?.textContent).not.toContain('Scoped notification')
    expect(lists[1]?.textContent).toContain('Scoped notification')
    expect(lists[1]?.textContent).not.toContain('Global notification')
  })

  it('anchors the viewport to the placement corner instead of covering the screen', async () => {
    render(() => <Toast placement="top" align="start" />)
    Toast.show('Anchored')
    await screen.findByText('Anchored')

    const viewport = document.querySelector<HTMLElement>('[data-slot="toast-viewport"]')!
    expect(viewport.getAttribute('role')).toBe('region')
    const classes = viewport.className.split(/\s+/)
    expect(classes).not.toContain('inset-0')
    expect(classes).toEqual(expect.arrayContaining(['fixed', 'top-4', 'left-4', 'w-sm']))
    expect(classes).not.toContain('bottom-4')
  })

  it('applies aria-label to the viewport and falls back to the locale message', async () => {
    render(() => (
      <>
        <Toast />
        <Toast id="labelled" aria-label="Custom alerts" />
      </>
    ))
    Toast.show('Default label')
    Toast.show('Custom label', { toastId: 'labelled' })
    await screen.findByText('Custom label')
    const viewportOf = (text: string) =>
      screen.getByText(text).closest('[data-slot="toast-viewport"]')
    expect(viewportOf('Default label')?.getAttribute('aria-label')).toBe('Notifications (F6)')
    expect(viewportOf('Custom label')?.getAttribute('aria-label')).toBe('Custom alerts')
  })

  it('marks the stack list with data-slot="toast-list"', async () => {
    render(() => <Toast />)
    Toast.show('List slot')
    await screen.findByText('List slot')
    const list = document.querySelector('ul')
    expect(list?.getAttribute('data-slot')).toBe('toast-list')
    expect(document.querySelectorAll('[data-slot="toast-list"]').length).toBe(1)
  })

  it('updates list data attributes reactively', async () => {
    render(() => <Toast />)
    Toast.show('Reactive attrs')
    await screen.findByText('Reactive attrs')
    const list = document.querySelector('ul')!
    expect(list.hasAttribute('data-expanded')).toBe(false)

    fireEvent.mouseEnter(list)
    expect(list.getAttribute('data-expanded')).toBe('')
    fireEvent.mouseLeave(list)
    expect(list.hasAttribute('data-expanded')).toBe(false)
  })

  it('supports F6 hotkey to expand and focus notifications viewport', async () => {
    render(() => <Toast hotkey={['F6']} />)

    Toast.show('Accessible notification')

    const region = await screen.findByRole('region', { name: /Notifications/ })
    expect(region).not.toBeNull()
    expect(region.getAttribute('aria-live')).toBe('polite')

    fireEvent.keyDown(window, { key: 'F6' })

    const toastItem = region.querySelector<HTMLElement>('[data-slot="toast"]')
    expect(document.activeElement).toBe(toastItem)
    expect(toastItem?.getAttribute('data-expanded')).toBe('')
  })

  it('does not preventDefault F6 when this host has no toasts', () => {
    render(() => <Toast hotkey={['F6']} />)

    const event = new KeyboardEvent('keydown', { key: 'F6', bubbles: true, cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })

  it('only the host with toasts reacts to F6 when multiple hosts exist', async () => {
    render(() => (
      <>
        <button type="button">Prior focus</button>
        <Toast id="empty-host" aria-label="Empty region" />
        <Toast id="busy-host" aria-label="Busy region" />
      </>
    ))

    const prior = screen.getByRole('button', { name: 'Prior focus' })
    prior.focus()
    Toast.show('Busy notification', { toastId: 'busy-host' })
    await screen.findByText('Busy notification')

    const event = new KeyboardEvent('keydown', { key: 'F6', bubbles: true, cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    const focused = document.activeElement as HTMLElement
    expect(focused.getAttribute('data-slot')).toBe('toast')
    expect(focused.textContent).toContain('Busy notification')

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(document.activeElement).toBe(prior)
  })

  it('requires every key in a hotkey combo', async () => {
    render(() => <Toast hotkey={['altKey', 'KeyT']} />)

    Toast.show('Combo toast')
    await screen.findByText('Combo toast')

    const plain = new KeyboardEvent('keydown', {
      key: 't',
      code: 'KeyT',
      bubbles: true,
      cancelable: true,
    })
    window.dispatchEvent(plain)
    expect(plain.defaultPrevented).toBe(false)

    const combo = new KeyboardEvent('keydown', {
      key: 't',
      code: 'KeyT',
      altKey: true,
      bubbles: true,
      cancelable: true,
    })
    window.dispatchEvent(combo)
    expect(combo.defaultPrevented).toBe(true)
    expect(document.activeElement?.getAttribute('data-slot')).toBe('toast')
  })

  it('restores focus after Escape following F6', async () => {
    render(() => (
      <>
        <button type="button">Prior focus</button>
        <Toast />
      </>
    ))

    const prior = screen.getByRole('button', { name: 'Prior focus' })
    prior.focus()
    Toast.show('Focus restore')
    await screen.findByText('Focus restore')

    fireEvent.keyDown(window, { key: 'F6' })
    expect(document.activeElement?.getAttribute('data-slot')).toBe('toast')

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(document.activeElement).toBe(prior)
  })

  it('keeps progress in sync with the dismiss timer across pause/resume', async () => {
    vi.useFakeTimers()
    try {
      render(() => <Toast duration={1000} showProgress />)
      await Promise.resolve()
      Toast.show('Synced progress')
      const value = () =>
        Number(document.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow'))

      await vi.advanceTimersByTimeAsync(400)
      const list = document.querySelector('ul')!
      fireEvent.mouseEnter(list)
      await vi.advanceTimersByTimeAsync(0)
      expect(value()).toBeCloseTo(60, 0)
      await vi.advanceTimersByTimeAsync(2000)
      expect(value()).toBeCloseTo(60, 0)

      fireEvent.mouseLeave(list)
      await vi.advanceTimersByTimeAsync(590)
      expect(screen.queryByText('Synced progress')).not.toBeNull()
      expect(value()).toBeGreaterThan(0)
      expect(value()).toBeLessThan(5)

      await vi.advanceTimersByTimeAsync(10)
      // Dismissed exactly as progress hits 0.
      expect(value()).toBe(0)
      expect(document.querySelector('[data-slot="toast"]')?.getAttribute('style')).toContain(
        'opacity: 0',
      )
    } finally {
      vi.useRealTimers()
    }
  })

  it('renders progress bar when showProgress is enabled', async () => {
    render(() => <Toast showProgress />)

    Toast.show('With Progress Bar')

    await screen.findByText('With Progress Bar')
    const progress = document.querySelector('[role="progressbar"]')
    expect(progress).not.toBeNull()
  })

  it('dismisses via Toast.dismiss and clears via Toast.clear', async () => {
    render(() => <Toast />)

    const id = Toast.show('To dismiss')
    expect(await screen.findByText('To dismiss')).not.toBeNull()

    Toast.dismiss(id)
    await finishExitMotion()
    await waitFor(() => {
      expect(screen.queryByText('To dismiss')).toBeNull()
    })

    Toast.show('To clear 1')
    Toast.show('To clear 2')
    expect(await screen.findByText('To clear 1')).not.toBeNull()
    expect(await screen.findByText('To clear 2')).not.toBeNull()
    expect(Toast.getHistory().length).toBeGreaterThan(0)

    Toast.clear()
    await finishExitMotion()
    await waitFor(() => {
      expect(screen.queryByText('To clear 1')).toBeNull()
      expect(screen.queryByText('To clear 2')).toBeNull()
    })
    expect(Toast.getHistory()).toEqual([])
  })

  it('sets data-front and data-behind attributes for stacked toasts', async () => {
    render(() => <Toast />)

    Toast.show('Toast 1')
    Toast.show('Toast 2')

    await screen.findByText('Toast 1')
    await screen.findByText('Toast 2')

    const toasts = document.querySelectorAll<HTMLElement>('[data-slot="toast"]')
    expect(toasts.length).toBe(2)
    expect(toasts[0]?.hasAttribute('data-front')).toBe(true)
    expect(toasts[0]?.hasAttribute('data-behind')).toBe(false)
    expect(toasts[1]?.hasAttribute('data-front')).toBe(false)
    expect(toasts[1]?.hasAttribute('data-behind')).toBe(true)
  })

  it('expands toasts on mouse enter and collapses on mouse leave', async () => {
    render(() => <Toast />)

    Toast.show('Expand 1')
    Toast.show('Expand 2')

    await screen.findByText('Expand 1')
    await screen.findByText('Expand 2')

    const list = screen.getByRole('list')
    expect(list.tagName).toBe('UL')
    const toasts = document.querySelectorAll<HTMLElement>('[data-slot="toast"]')

    expect(list.hasAttribute('data-expanded')).toBe(false)
    expect(toasts[0]?.hasAttribute('data-expanded')).toBe(false)

    fireEvent.mouseEnter(list)
    expect(list.hasAttribute('data-expanded')).toBe(true)
    expect(toasts[0]?.hasAttribute('data-expanded')).toBe(true)
    expect(toasts[1]?.hasAttribute('data-expanded')).toBe(true)

    fireEvent.mouseLeave(list)
    expect(list.hasAttribute('data-expanded')).toBe(false)
    expect(toasts[0]?.hasAttribute('data-expanded')).toBe(false)
    expect(toasts[1]?.hasAttribute('data-expanded')).toBe(false)
  })

  it('dismisses toast on swipe gesture past threshold', async () => {
    render(() => <Toast />)

    Toast.show('Swipe me away')
    const toastItem = await screen.findByText('Swipe me away')
    const itemEl = toastItem.closest('[data-slot="toast"]') as HTMLElement
    expect(itemEl).not.toBeNull()

    fireEvent.pointerDown(itemEl, { clientX: 200, clientY: 200, pointerId: 1 })
    fireEvent.pointerMove(itemEl, { clientX: 280, clientY: 200, pointerId: 1 })
    fireEvent.pointerUp(itemEl, { clientX: 280, clientY: 200, pointerId: 1 })

    await finishExitMotion()
    await waitFor(() => {
      expect(screen.queryByText('Swipe me away')).toBeNull()
    })
  })

  it('does not dismiss on a small-distance swipe even with high velocity', async () => {
    render(() => <Toast />)

    Toast.show('Jitter click')
    const toastItem = await screen.findByText('Jitter click')
    const itemEl = toastItem.closest('[data-slot="toast"]') as HTMLElement

    fireEvent.pointerDown(itemEl, { clientX: 200, clientY: 200, pointerId: 1 })
    fireEvent.pointerMove(itemEl, { clientX: 203, clientY: 200, pointerId: 1 })
    fireEvent.pointerUp(itemEl, { clientX: 203, clientY: 200, pointerId: 1 })

    expect(screen.getByText('Jitter click')).not.toBeNull()
  })

  it('does not dismiss when swiping in the dampened direction', async () => {
    render(() => <Toast align="end" />)

    Toast.show('Stay put')
    const toastItem = await screen.findByText('Stay put')
    const itemEl = toastItem.closest('[data-slot="toast"]') as HTMLElement

    fireEvent.pointerDown(itemEl, { clientX: 200, clientY: 200, pointerId: 1 })
    fireEvent.pointerMove(itemEl, { clientX: 120, clientY: 200, pointerId: 1 })
    fireEvent.pointerUp(itemEl, { clientX: 120, clientY: 200, pointerId: 1 })

    expect(screen.getByText('Stay put')).not.toBeNull()
  })

  it('preserves existing toast DOM node and updates stacking state when a new toast is created', async () => {
    render(() => <Toast />)

    Toast.show('Toast A')
    const itemA = await screen.findByText('Toast A')
    const toastNodeA = itemA.closest('[data-slot="toast"]') as HTMLElement
    expect(toastNodeA).not.toBeNull()
    expect(toastNodeA.hasAttribute('data-front')).toBe(true)
    expect(toastNodeA.hasAttribute('data-behind')).toBe(false)

    Toast.show('Toast B')
    await screen.findByText('Toast B')

    const itemAAfter = screen.getByText('Toast A')
    const toastNodeAAfter = itemAAfter.closest('[data-slot="toast"]') as HTMLElement

    expect(toastNodeAAfter).toBe(toastNodeA)
    expect(toastNodeAAfter.hasAttribute('data-front')).toBe(false)
    expect(toastNodeAAfter.hasAttribute('data-behind')).toBe(true)
  })

  it('renders data-slot attributes on all toast parts', async () => {
    render(() => <Toast closeButton showProgress />)

    Toast.show({
      title: 'Slot Test Title',
      description: 'Slot Test Description',
      variant: 'success',
      action: { label: 'Action Btn', onClick: vi.fn() },
      cancel: { label: 'Cancel Btn', onClick: vi.fn() },
    })

    const root = await screen.findByText('Slot Test Title')
    expect(root.closest('[data-slot="toast"]')?.getAttribute('data-slot')).toBe('toast')
    const toastRoot = root.closest('[data-slot="toast"]')!
    expect(toastRoot.querySelector('[data-slot="toast-icon"]')).not.toBeNull()
    expect(toastRoot.querySelector('[data-slot="toast-content"]')).not.toBeNull()
    expect(toastRoot.querySelector('[data-slot="toast-title"]')).not.toBeNull()
    expect(toastRoot.querySelector('[data-slot="toast-description"]')).not.toBeNull()
    expect(toastRoot.querySelector('[data-slot="toast-action"]')).not.toBeNull()
    expect(toastRoot.querySelector('[data-slot="toast-cancel"]')).not.toBeNull()
    expect(toastRoot.querySelector('[data-slot="toast-close"]')).not.toBeNull()
    expect(toastRoot.querySelector('[data-slot="toast-progress"]')).not.toBeNull()
  })

  it('warns on duplicate host ids', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(() => (
      <>
        <Toast id="dup" />
        <Toast id="dup" />
      </>
    ))
    expect(warn).toHaveBeenCalledWith(
      '[moraine] Duplicate <Toast id="dup" />. Each Toast host id must be unique.',
    )
  })

  it('renders an isolated store independently from Toast.*', async () => {
    const store = createToastStore()
    render(() => (
      <>
        <Toast />
        <Toast id="isolated" store={store} />
      </>
    ))

    store.show('Isolated only', { toastId: 'isolated' })
    Toast.show('Default only')

    await screen.findByText('Isolated only')
    await screen.findByText('Default only')

    const isolatedViewport = screen
      .getByText('Isolated only')
      .closest('[data-slot="toast-viewport"]')?.textContent
    expect(isolatedViewport).toContain('Isolated only')
    expect(isolatedViewport).not.toContain('Default only')
  })

  it('keeps the viewport mounted and renders the list only while it has toasts', async () => {
    render(() => <Toast />)
    const viewport = () => document.querySelector('[data-slot="toast-viewport"]')
    const list = () => document.querySelector('[data-slot="toast-list"]')
    // Persistent live region; no empty list.
    expect(viewport()?.getAttribute('aria-live')).toBe('polite')
    expect(list()).toBeNull()

    const id = Toast.show('Lifecycle toast')
    await screen.findByText('Lifecycle toast')
    expect(list()).not.toBeNull()

    Toast.dismiss(id)
    // Still mounted while the exit animation plays.
    await Promise.resolve()
    expect(list()).not.toBeNull()
    expect(screen.queryByText('Lifecycle toast')).not.toBeNull()

    await finishExitMotion()
    await waitFor(() => expect(list()).toBeNull())
    expect(viewport()).not.toBeNull()
  })

  it('cleans up rendered toasts when the host unmounts', async () => {
    const result = render(() => <Toast />)
    Toast.show('Unmount me')
    expect(await screen.findByText('Unmount me')).not.toBeNull()

    result.unmount()
    expect(screen.queryByText('Unmount me')).toBeNull()
    expect(document.querySelector('[data-slot="toast-viewport"]')).toBeNull()
  })

  it('applies host invert and classes to toast items', async () => {
    render(() => <Toast invert classes={{ title: 'host-title-class' }} />)
    Toast.show('Inverted')
    const title = await screen.findByText('Inverted')
    expect(title.className).toContain('host-title-class')
  })

  it('lets user style.width override the default list width', async () => {
    render(() => <Toast style={{ width: '200px' }} />)
    Toast.show('Width override')
    await screen.findByText('Width override')
    const list = screen.getByRole('list')
    expect(list.style.width).toBe('200px')
  })
})
