import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { finishExitMotion } from '../../test-util/overlay-test'

import { Toast } from './index'
import type { ToastT } from './index'

describe('Toast', () => {
  beforeEach(() => {
    Toast.close()
    // jsdom reports an unfocused document by default; the host re-syncs from hasFocus() on attach.
    vi.spyOn(document, 'hasFocus').mockReturnValue(true)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    Toast.close()
  })

  it('renders a toast with default props', async () => {
    render(() => <Toast />)

    Toast.show({ title: 'My Toast Notification' })

    expect(await screen.findByText('My Toast Notification')).not.toBeNull()
    const toastItem = document.querySelector('[data-slot="toast-item"]')
    expect(toastItem).not.toBeNull()
    expect(toastItem?.hasAttribute('data-front')).toBe(true)
  })

  it('renders JSX messages instead of treating DOM nodes as options', async () => {
    render(() => <Toast />)

    Toast.show({ title: <strong data-testid="jsx-message">JSX toast body</strong> })

    const message = await screen.findByTestId('jsx-message')
    expect(message.textContent).toBe('JSX toast body')
    expect(message.closest('[data-slot="toast-item"]')).not.toBeNull()
  })

  it('renders toast variant helpers (success, error, warning, info, loading)', async () => {
    render(() => <Toast />)

    Toast.success({ title: 'Success message' })
    Toast.error({ title: 'Error message' })
    Toast.warning({ title: 'Warning message' })
    Toast.info({ title: 'Info message' })
    Toast.loading({ title: 'Loading message' })

    expect(await screen.findByText('Success message')).not.toBeNull()
    expect(await screen.findByText('Error message')).not.toBeNull()
    expect(await screen.findByText('Warning message')).not.toBeNull()
    expect(await screen.findByText('Info message')).not.toBeNull()
    expect(await screen.findByText('Loading message')).not.toBeNull()

    const toasts = document.querySelectorAll('[data-slot="toast-item"]')
    expect(toasts.length).toBe(5)
  })

  it('renders action button and triggers callback on click', async () => {
    const handleAction = vi.fn()
    render(() => <Toast />)

    Toast.show({
      title: 'Action Needed',
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

    Toast.show({
      title: 'Discard changes?',
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

  it('defaults action button variant to solid primary and cancel button variant to soft neutral', async () => {
    render(() => <Toast />)

    Toast.show({
      title: 'Item deleted',
      action: { label: 'Undo' },
      cancel: { label: 'Dismiss' },
    })

    const actionButton = await screen.findByRole('button', { name: 'Undo' })
    const cancelButton = await screen.findByRole('button', { name: 'Dismiss' })

    expect(actionButton.className).toContain('bg-tone')
    expect(actionButton.style.getPropertyValue('--mo-tone')).toContain('var(--primary)')
    expect(cancelButton.className).toContain('bg-tone-soft')
    expect(cancelButton.style.getPropertyValue('--mo-tone')).toContain('var(--neutral)')
  })

  it('applies custom variant on action and cancel button configs', async () => {
    render(() => <Toast />)

    Toast.show({
      title: 'Item deleted',
      action: {
        label: 'Undo',
        variant: 'outline',
      },
      cancel: {
        label: 'Dismiss',
        variant: 'solid',
        tone: 'danger',
      },
    })

    const actionButton = await screen.findByRole('button', { name: 'Undo' })
    const cancelButton = await screen.findByRole('button', { name: 'Dismiss' })

    expect(actionButton.className).toContain('border-tone-soft-active')
    expect(cancelButton.className).toContain('bg-tone')
    expect(cancelButton.style.getPropertyValue('--mo-tone')).toContain('var(--danger)')
  })

  it('renders close button and closes on click', async () => {
    render(() => <Toast close />)

    Toast.show({ title: 'Closable item' })

    const closeBtn = await screen.findByRole('button', { name: 'Close notification' })
    expect(closeBtn).not.toBeNull()

    fireEvent.click(closeBtn)
    await finishExitMotion()
    await waitFor(() => {
      expect(screen.queryByText('Closable item')).toBeNull()
    })
  })

  it('keeps the same toast node mounted through close exit animation', async () => {
    render(() => <Toast close />)

    Toast.show({ title: 'Exit close anim' })
    const label = await screen.findByText('Exit close anim')
    const item = label.closest('[data-slot="toast-item"]') as HTMLElement
    expect(item).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Close notification' }))

    // Same DOM node must remain so CSS transform/opacity transitions can play.
    expect(document.querySelector('[data-slot="toast-item"]')).toBe(item)
    expect(item.style.opacity).toBe('0')

    await finishExitMotion()
    await waitFor(() => {
      expect(screen.queryByText('Exit close anim')).toBeNull()
    })
  })

  it('keeps the same toast node mounted through programmatic close exit animation', async () => {
    render(() => <Toast />)

    const handle = Toast.show({ title: 'Exit dismiss anim' })
    const label = await screen.findByText('Exit dismiss anim')
    const item = label.closest('[data-slot="toast-item"]') as HTMLElement

    Toast.close(handle.id)

    expect(document.querySelector('[data-slot="toast-item"]')).toBe(item)
    expect(item.style.opacity).toBe('0')

    await finishExitMotion()
    await waitFor(() => {
      expect(screen.queryByText('Exit dismiss anim')).toBeNull()
    })
  })

  it('keeps the same toast node mounted through auto-close exit animation', async () => {
    vi.useFakeTimers()
    try {
      render(() => <Toast duration={500} />)
      await Promise.resolve()

      Toast.show({ title: 'Exit auto anim' })
      const label = screen.getByText('Exit auto anim')
      const item = label.closest('[data-slot="toast-item"]') as HTMLElement

      await vi.advanceTimersByTimeAsync(600)

      expect(document.querySelector('[data-slot="toast-item"]')).toBe(item)
      expect(item.style.opacity).toBe('0')

      await finishExitMotion()
      expect(screen.queryByText('Exit auto anim')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('shows the close button when close is set on the call or the host', async () => {
    render(() => <Toast />)

    Toast.show({
      title: 'Boolean close',
      close: true,
    })

    expect(await screen.findByRole('button', { name: 'Close notification' })).not.toBeNull()
  })

  it('reads the latest host defaults when a toast is added', async () => {
    const [close, setClose] = createSignal(false)
    render(() => <Toast close={close()} />)

    setClose(true)
    Toast.show({ title: 'Latest host default' })

    expect(await screen.findByRole('button', { name: 'Close notification' })).not.toBeNull()
  })

  it('defaults role to alert for error and status otherwise', async () => {
    render(() => <Toast />)

    Toast.show({ title: 'Status toast' })
    Toast.error({ title: 'Error toast' })

    const statusToast = (await screen.findByText('Status toast')).closest(
      '[data-slot="toast-item"]',
    )
    const errorToast = (await screen.findByText('Error toast')).closest('[data-slot="toast-item"]')
    expect(statusToast?.getAttribute('role')).toBe('status')
    expect(errorToast?.getAttribute('role')).toBe('alert')
  })

  it('forwards action class and style to the action button', async () => {
    render(() => <Toast />)

    Toast.show({
      title: 'Styled action',
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

  it('auto-closes after duration', async () => {
    vi.useFakeTimers()
    try {
      render(() => <Toast duration={2000} />)
      await Promise.resolve()

      Toast.show({ title: 'Auto fading message' })
      expect(screen.getByText('Auto fading message')).not.toBeNull()

      await vi.advanceTimersByTimeAsync(2100)
      await finishExitMotion()

      expect(screen.queryByText('Auto fading message')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('auto-closes when expand is set', async () => {
    vi.useFakeTimers()
    try {
      render(() => <Toast duration={2000} expand />)
      await Promise.resolve()

      Toast.show({ title: 'Expanded auto dismiss' })
      expect(screen.getByText('Expanded auto dismiss')).not.toBeNull()

      await vi.advanceTimersByTimeAsync(2100)
      await finishExitMotion()

      expect(screen.queryByText('Expanded auto dismiss')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('pauses timer on mouse enter and resumes remaining duration on mouse leave', async () => {
    vi.useFakeTimers()
    try {
      render(() => <Toast duration={3000} />)
      await Promise.resolve()

      Toast.show({ title: 'Hover pause toast' })
      expect(screen.getByText('Hover pause toast')).not.toBeNull()

      const toastEl = document.querySelector('[data-slot="toast-item"]')!

      // Run 2000ms out of 3000ms (1000ms remaining)
      await vi.advanceTimersByTimeAsync(2000)
      expect(screen.queryByText('Hover pause toast')).not.toBeNull()

      // Mouse enters list and toast; timer pauses without resetting
      const list = screen.getByRole('list')
      fireEvent.mouseEnter(list)
      fireEvent.mouseEnter(toastEl)

      // While paused / hovering, advance 4000ms - toast stays visible
      await vi.advanceTimersByTimeAsync(4000)
      expect(screen.queryByText('Hover pause toast')).not.toBeNull()

      // Mouse leaves: timer resumes with remaining 1000ms
      fireEvent.mouseLeave(list)

      // After 500ms from mouse leave, toast should STILL be alive (1000ms remaining)
      await vi.advanceTimersByTimeAsync(500)
      expect(screen.queryByText('Hover pause toast')).not.toBeNull()

      // After another 600ms (1100ms total after leave, past 1000ms), toast finishes
      await vi.advanceTimersByTimeAsync(600)
      await finishExitMotion()
      expect(screen.queryByText('Hover pause toast')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('pauses timer on window blur and document hidden', async () => {
    vi.useFakeTimers()
    try {
      render(() => <Toast duration={2000} />)
      await Promise.resolve()

      Toast.show({ title: 'Blur pause toast' })
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
      Toast.show({ title: 'First toast' })
      await vi.advanceTimersByTimeAsync(1200)
      await finishExitMotion()
      expect(screen.queryByText('First toast')).toBeNull()

      // Re-attach re-syncs from document.hasFocus(): an unfocused window starts paused.
      hasFocus.mockReturnValue(false)
      Toast.show({ title: 'Second toast' })
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

  it('resets the timer when updating an existing id via Toast.show', async () => {
    vi.useFakeTimers()
    try {
      render(() => <Toast duration={2000} />)
      await Promise.resolve()

      Toast.show({ id: 'same', title: 'Original' })
      await vi.advanceTimersByTimeAsync(1500)
      Toast.show({ id: 'same', title: 'Updated' })
      await vi.advanceTimersByTimeAsync(1500)
      expect(screen.queryByText('Updated')).not.toBeNull()

      await vi.advanceTimersByTimeAsync(600)
      await finishExitMotion()
      expect(screen.queryByText('Updated')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('updates title and description in place via Toast.update and triggers bump', async () => {
    render(() => <Toast />)
    const handle = Toast.show({ title: 'Initial Title', description: 'Initial Desc' })
    expect(await screen.findByText('Initial Title')).not.toBeNull()
    expect(screen.getByText('Initial Desc')).not.toBeNull()

    Toast.update(handle.id, { title: 'Updated Title', description: 'Updated Desc' })
    expect(await screen.findByText('Updated Title')).not.toBeNull()
    expect(screen.getByText('Updated Desc')).not.toBeNull()
    expect(screen.queryByText('Initial Title')).toBeNull()

    const toastEl = document.querySelector('[data-slot="toast-item"]')
    await waitFor(() => {
      expect(toastEl?.hasAttribute('data-bump')).toBe(true)
    })
  })

  it('does not throw when a bump timer fires after the toast is removed', async () => {
    vi.useFakeTimers()
    try {
      render(() => <Toast />)
      await Promise.resolve()
      const handle = Toast.show({ title: 'Bump then gone' })
      Toast.update(handle.id, { title: 'Bumped' })
      Toast.close(handle.id)
      await vi.advanceTimersByTimeAsync(300)
      expect(screen.queryByText('Bumped')).not.toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('keeps bump completion on the original toast after a newer toast is prepended', async () => {
    vi.useFakeTimers()
    try {
      render(() => <Toast />)
      await Promise.resolve()

      const handle = Toast.show({ title: 'First' })
      Toast.update(handle.id, { title: 'First bumped' })
      await Promise.resolve()
      Toast.show({ title: 'Second' })
      await vi.advanceTimersByTimeAsync(300)

      const items = document.querySelectorAll('[data-slot="toast-item"]')
      expect(items[0]?.hasAttribute('data-bump')).toBe(false)
      expect(items[1]?.hasAttribute('data-bump')).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('invokes onClose with timeout on timer expiration and api on programmatic close', async () => {
    vi.useFakeTimers()
    const onAutoClose = vi.fn()
    const onManualClose = vi.fn()

    try {
      render(() => <Toast duration={1000} />)
      await Promise.resolve()

      Toast.show({ title: 'Auto toast', onClose: onAutoClose })
      const manual = Toast.show({ title: 'Manual toast', onClose: onManualClose })

      Toast.close(manual.id)
      expect(onManualClose).toHaveBeenCalledWith('api')

      await vi.advanceTimersByTimeAsync(1100)
      expect(onAutoClose).toHaveBeenCalledWith('timeout')
    } finally {
      vi.useRealTimers()
    }
  })

  it('supports custom JSX toasts via Toast.custom', async () => {
    render(() => <Toast />)

    Toast.custom((props) => (
      <div data-testid="custom-toast">
        <span>Custom JSX Content {props.id}</span>
        <button type="button" onClick={() => props.close()}>
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

    const handle = Toast.promise(samplePromise, {
      loading: { title: 'Saving profile...' },
      success: (data) => ({ title: `Profile saved: ${data}` }),
      error: { title: 'Failed to save' },
    })

    expect(await screen.findByText('Saving profile...')).not.toBeNull()

    resolvePromise!('Alice')

    expect(await screen.findByText('Profile saved: Alice')).not.toBeNull()
    expect(handle.id).toBeDefined()
  })

  it('handles promise rejection transitions', async () => {
    render(() => <Toast />)

    let rejectPromise: (err: Error) => void
    const samplePromise = new Promise<string>((_res, rej) => {
      rejectPromise = rej
    })

    Toast.promise(samplePromise, {
      loading: { title: 'Uploading file...' },
      success: { title: 'File uploaded' },
      error: (err) => ({ title: `Upload failed: ${(err as Error).message}` }),
    })

    expect(await screen.findByText('Uploading file...')).not.toBeNull()

    rejectPromise!(new Error('Network error'))

    expect(await screen.findByText('Upload failed: Network error')).not.toBeNull()
  })

  it('closes the loading toast when a promise settles without a matching handler', async () => {
    render(() => <Toast />)

    let resolvePromise: () => void
    const samplePromise = new Promise<void>((res) => {
      resolvePromise = res
    })

    Toast.promise(samplePromise, {
      loading: { title: 'Resolving silently...' },
    })

    expect(await screen.findByText('Resolving silently...')).not.toBeNull()

    resolvePromise!()
    await finishExitMotion()

    await waitFor(() => {
      expect(screen.queryByText('Resolving silently...')).toBeNull()
    })
  })

  it('does not apply the final duration to the loading toast', async () => {
    vi.useFakeTimers()
    try {
      render(() => <Toast />)
      await Promise.resolve()

      let resolvePromise: () => void
      const samplePromise = new Promise<void>((res) => {
        resolvePromise = res
      })

      Toast.promise(samplePromise, {
        loading: { title: 'Still loading...' },
        success: { title: 'Done!', duration: 2000 },
      })

      expect(screen.getByText('Still loading...')).not.toBeNull()

      // Advancing past standard duration should NOT dismiss the loading toast
      await vi.advanceTimersByTimeAsync(10000)
      expect(screen.getByText('Still loading...')).not.toBeNull()

      resolvePromise!()
      await Promise.resolve()
      await Promise.resolve()

      expect(screen.getByText('Done!')).not.toBeNull()

      await vi.advanceTimersByTimeAsync(2100)
      await finishExitMotion()
      expect(screen.queryByText('Done!')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('defaults preventDuplicate to false', async () => {
    render(() => <Toast />)

    const id1 = Toast.show({ title: 'Allow dup' })
    const id2 = Toast.show({ title: 'Allow dup' })
    expect(id1).not.toBe(id2)

    await screen.findAllByText('Allow dup')
    const toasts = document.querySelectorAll('[data-slot="toast-item"]')
    expect(toasts.length).toBe(2)
  })

  it('supports placement top and bottom', async () => {
    render(() => (
      <>
        <Toast id="top-host" placement="top" />
        <Toast id="bottom-host" placement="bottom" />
      </>
    ))

    Toast.show({ title: 'Top message', host: 'top-host' })
    Toast.show({ title: 'Bottom message', host: 'bottom-host' })

    const topItem = (await screen.findByText('Top message')).closest('[data-slot="toast-item"]')
    const bottomItem = (await screen.findByText('Bottom message')).closest(
      '[data-slot="toast-item"]',
    )
    expect(topItem?.className).toContain('top-0')
    expect(bottomItem?.className).toContain('bottom-0')
  })

  it('does not leak scoped host preventDuplicate to the default host', async () => {
    render(() => (
      <>
        <Toast id="scoped-pd" preventDuplicate />
        <Toast />
      </>
    ))

    const id1 = Toast.show({ title: 'Default message' })
    const id2 = Toast.show({ title: 'Default message' })
    expect(id1).not.toBe(id2)

    const s1 = Toast.show({ title: 'Scoped message', host: 'scoped-pd' })
    const s2 = Toast.show({ title: 'Scoped message', host: 'scoped-pd' })
    expect(s1).toBe(s2)
  })

  it('prevents duplicates and sets data-bump when preventDuplicate is set', async () => {
    render(() => <Toast preventDuplicate />)

    const id1 = Toast.show({ title: 'Duplicate message' })
    const id2 = Toast.show({ title: 'Duplicate message' })

    expect(id1).toBe(id2)

    await screen.findByText('Duplicate message')
    const toasts = document.querySelectorAll('[data-slot="toast-item"]')
    expect(toasts.length).toBe(1)

    await waitFor(() => {
      expect(toasts[0]?.hasAttribute('data-bump')).toBe(true)
    })
  })

  it('prevents duplicates only against the front toast in the stack', async () => {
    render(() => <Toast preventDuplicate />)

    const idA1 = Toast.show({ title: 'Toast A' })
    const idB = Toast.show({ title: 'Toast B' })

    const idA2 = Toast.show({ title: 'Toast A' })
    expect(idA2).not.toBe(idA1)
    expect(idA2).not.toBe(idB)

    await screen.findByText('Toast B')
    const toasts = document.querySelectorAll('[data-slot="toast-item"]')
    expect(toasts.length).toBe(3)

    const idA3 = Toast.show({ title: 'Toast A' })
    expect(idA3).toBe(idA2)
  })

  it('allows customizing preventDuplicate when calling Toast.show or similar functions', async () => {
    render(() => <Toast preventDuplicate />)

    const id1 = Toast.show({ title: 'Allow duplicate' })
    const id2 = Toast.show({ title: 'Allow duplicate', preventDuplicate: false })
    expect(id1).not.toBe(id2)

    const s1 = Toast.success({ title: 'Saved', preventDuplicate: true })
    const s2 = Toast.success({ title: 'Saved', preventDuplicate: true })
    expect(s1).toBe(s2)
  })

  it('applies inert and data-limited to toasts past visibleToasts limit', async () => {
    render(() => <Toast visibleToasts={2} />)

    Toast.show({ title: 'One' })
    Toast.show({ title: 'Two' })
    Toast.show({ title: 'Three' })

    await screen.findByText('One')
    await screen.findByText('Two')
    await screen.findByText('Three')

    const toasts = document.querySelectorAll<HTMLElement>('[data-slot="toast-item"]')
    expect(toasts.length).toBe(3)
    expect(toasts[2]?.hasAttribute('data-limited')).toBe(true)
    expect(toasts[0]?.hasAttribute('data-limited')).toBe(false)
    expect(toasts[1]?.hasAttribute('data-limited')).toBe(false)
  })

  it('filters by host for scoped host instances', async () => {
    render(() => (
      <>
        <Toast id="main" />
        <Toast id="alerts" />
      </>
    ))

    Toast.show({ title: 'Default host toast', host: 'main' })
    Toast.show({ title: 'Alerts host toast', host: 'alerts' })

    const defaultTitle = await screen.findByText('Default host toast')
    const alertsTitle = await screen.findByText('Alerts host toast')

    const defaultRegion = defaultTitle.closest('[data-slot="toast"]')
    const alertsRegion = alertsTitle.closest('[data-slot="toast"]')
    expect(defaultRegion).not.toBe(alertsRegion)
  })

  it('anchors the viewport to the placement corner instead of covering the screen', async () => {
    render(() => <Toast placement="bottom" align="end" />)
    const viewport = await screen.findByRole('region', { name: /Notifications/ })
    const classes = viewport.className.split(/\s+/)
    expect(classes).toContain('pointer-events-none')
    expect(classes).toContain('bottom-4')
    expect(classes).toContain('right-4')
  })

  it('applies aria-label to the viewport and falls back to the locale message', async () => {
    render(() => (
      <>
        <Toast aria-label="Custom alerts center" />
        <Toast id="fallback" />
      </>
    ))

    const custom = screen.getByRole('region', { name: 'Custom alerts center' })
    const fallback = screen.getByRole('region', { name: 'Notifications' })
    expect(custom).not.toBeNull()
    expect(fallback).not.toBeNull()
  })

  it('marks the stack list with data-slot="toast-list"', async () => {
    render(() => <Toast />)
    Toast.show({ title: 'Slot check' })
    await screen.findByText('Slot check')
    const list = screen.getByRole('list')
    expect(list.getAttribute('data-slot')).toBe('toast-list')
  })

  it('updates list data attributes reactively', async () => {
    render(() => <Toast expand />)
    Toast.show({ title: 'Data attrs' })
    await screen.findByText('Data attrs')
    const list = screen.getByRole('list')
    expect(list.getAttribute('data-expanded')).toBe('')
  })

  it('renders bottom progress bar with CSS transform scaleX animation when progress is enabled', async () => {
    render(() => <Toast progress duration={4000} />)

    Toast.show({ title: 'With Progress Bar' })

    await screen.findByText('With Progress Bar')
    const progressTrack = document.querySelector('[data-slot="toast-progress"]')
    const progressIndicator = document.querySelector<HTMLElement>(
      '[data-slot="toast-progress-indicator"]',
    )
    expect(progressTrack).not.toBeNull()
    expect(progressIndicator).not.toBeNull()
    expect(progressTrack?.className).toContain('bottom-0')
    expect(progressIndicator?.className).toContain('animate-toast-progress')
    expect(progressIndicator?.className).toContain('origin-left')
    expect(progressIndicator?.style.animationDuration).toBe('4000ms')
    expect(progressIndicator?.style.animationPlayState).toBe('running')
    expect(progressIndicator?.style.width).toBe('')
  })

  it('pauses progress indicator animation on mouse enter without resetting', async () => {
    render(() => <Toast progress duration={4000} />)
    Toast.show({ title: 'Hover progress test' })
    await screen.findByText('Hover progress test')

    const list = screen.getByRole('list')
    const indicator = document.querySelector<HTMLElement>('[data-slot="toast-progress-indicator"]')!
    expect(indicator).not.toBeNull()
    expect(indicator.style.animationPlayState).toBe('running')

    fireEvent.mouseEnter(list)
    expect(indicator.style.animationPlayState).toBe('paused')

    fireEvent.mouseLeave(list)
    expect(indicator.style.animationPlayState).toBe('running')
  })

  it('closes specific toast via Toast.close(id) and closes all toasts via Toast.close()', async () => {
    render(() => <Toast />)

    const id1 = Toast.show({ title: 'To close 1' })
    Toast.show({ title: 'To close 2' })
    expect(await screen.findByText('To close 1')).not.toBeNull()
    expect(await screen.findByText('To close 2')).not.toBeNull()

    Toast.close(id1.id)
    await finishExitMotion()
    await waitFor(() => {
      expect(screen.queryByText('To close 1')).toBeNull()
      expect(screen.getByText('To close 2')).not.toBeNull()
    })

    Toast.close()
    await finishExitMotion()
    await waitFor(() => {
      expect(screen.queryByText('To close 2')).toBeNull()
    })
  })

  it('sets data-front and data-behind attributes for stacked toasts', async () => {
    render(() => <Toast />)

    Toast.show({ title: 'Toast 1' })
    Toast.show({ title: 'Toast 2' })

    await screen.findByText('Toast 1')
    await screen.findByText('Toast 2')

    const toasts = document.querySelectorAll<HTMLElement>('[data-slot="toast-item"]')
    expect(toasts.length).toBe(2)
    expect(toasts[0]?.hasAttribute('data-front')).toBe(true)
    expect(toasts[0]?.hasAttribute('data-behind')).toBe(false)
    expect(toasts[1]?.hasAttribute('data-front')).toBe(false)
    expect(toasts[1]?.hasAttribute('data-behind')).toBe(true)
  })

  it('applies a custom gap between stacked toasts', async () => {
    render(() => <Toast gap={20} />)

    Toast.show({ title: 'Gap back' })
    Toast.show({ title: 'Gap front' })

    const back = (await screen.findByText('Gap back')).closest(
      '[data-slot="toast-item"]',
    ) as HTMLElement
    await waitFor(() => {
      expect(back.style.transform).toBe('translate3d(0, -20px, 0) scale(0.95)')
    })
  })

  it('expands toasts on mouse enter and collapses on mouse leave', async () => {
    render(() => <Toast />)

    Toast.show({ title: 'Expand 1' })
    Toast.show({ title: 'Expand 2' })

    await screen.findByText('Expand 1')
    await screen.findByText('Expand 2')

    const list = screen.getByRole('list')
    expect(list.tagName).toBe('UL')
    const toasts = document.querySelectorAll<HTMLElement>('[data-slot="toast-item"]')

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

  it('does not cause an extra drop for upper toasts when closing a toast in expanded mode', async () => {
    render(() => <Toast expand />)

    Toast.show({ title: 'Toast 1' })
    const id2 = Toast.show({ title: 'Toast 2' })

    const toast1El = await screen.findByText('Toast 1')
    const item1 = toast1El.closest('[data-slot="toast-item"]') as HTMLElement
    const toast2El = await screen.findByText('Toast 2')
    const item2 = toast2El.closest('[data-slot="toast-item"]') as HTMLElement

    await waitFor(() => {
      expect(item1.style.opacity).toBe('1')
      expect(item2.style.opacity).toBe('1')
    })

    // id2 is at front (index 0), id1 is behind (index 1)
    Toast.close(id2.id)
    await Promise.resolve()

    // id1 should now immediately target the front position with offset 0
    await waitFor(() => {
      expect(item1.style.transform).toBe('translate3d(0, 0px, 0) scale(1)')
    })

    // After exit animation completes and id2 unmounts:
    await finishExitMotion()
    expect(screen.queryByText('Toast 2')).toBeNull()

    // id1 should STILL remain at offset 0 (no extra drop after exit completes)
    expect(item1.style.transform).toBe('translate3d(0, 0px, 0) scale(1)')
  })

  it('does not cause an extra drop for upper toasts when closing a toast in collapsed mode', async () => {
    render(() => <Toast />)

    Toast.show({ title: 'Toast 1' })
    const id2 = Toast.show({ title: 'Toast 2' })

    const toast1El = await screen.findByText('Toast 1')
    const item1 = toast1El.closest('[data-slot="toast-item"]') as HTMLElement
    const toast2El = await screen.findByText('Toast 2')
    const item2 = toast2El.closest('[data-slot="toast-item"]') as HTMLElement

    await waitFor(() => {
      expect(item1.style.opacity).toBe('1')
      expect(item2.style.opacity).toBe('1')
    })

    // Initially id2 is front (index 0, 0px), id1 is behind (index 1, -14px)
    expect(item1.style.transform).toBe('translate3d(0, -14px, 0) scale(0.95)')

    // Close front toast (id2)
    Toast.close(id2.id)
    await Promise.resolve()

    // id1 immediately becomes active front and targets 0px (scale 1)
    await waitFor(() => {
      expect(item1.style.transform).toBe('translate3d(0, 0px, 0) scale(1)')
    })

    // After exit completes:
    await finishExitMotion()
    expect(screen.queryByText('Toast 2')).toBeNull()

    // id1 remains at 0px
    expect(item1.style.transform).toBe('translate3d(0, 0px, 0) scale(1)')
  })

  it('fades a buried toast out in place when several toasts are open', async () => {
    render(() => <Toast />)

    const back = Toast.show({ title: 'Back' })
    Toast.show({ title: 'Middle' })
    Toast.show({ title: 'Front' })

    const backEl = (await screen.findByText('Back')).closest(
      '[data-slot="toast-item"]',
    ) as HTMLElement
    const frontEl = (await screen.findByText('Front')).closest(
      '[data-slot="toast-item"]',
    ) as HTMLElement

    await waitFor(() => {
      expect(backEl.style.transform).toBe('translate3d(0, -28px, 0) scale(0.9)')
      expect(frontEl.style.transform).toBe('translate3d(0, 0px, 0) scale(1)')
    })

    Toast.close(back.id)
    await waitFor(() => {
      expect(backEl.style.opacity).toBe('0')
    })

    expect(backEl.style.transform).toBe('translate3d(0, -28px, 0) scale(0.9)')
    expect(Number(backEl.style.zIndex)).toBeLessThan(Number(frontEl.style.zIndex))
    expect(frontEl.style.transform).toBe('translate3d(0, 0px, 0) scale(1)')

    backEl.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true, elapsedTime: 0.4 }))
    expect(backEl.isConnected).toBe(true)

    backEl.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true, elapsedTime: 0 }))
    await waitFor(() => {
      expect(screen.queryByText('Back')).toBeNull()
    })
  })

  it('closes toast on swipe gesture past threshold', async () => {
    render(() => <Toast />)

    Toast.show({ title: 'Swipe me away' })
    const toastItem = await screen.findByText('Swipe me away')
    const itemEl = toastItem.closest('[data-slot="toast-item"]') as HTMLElement
    expect(itemEl).not.toBeNull()

    fireEvent.pointerDown(itemEl, { clientX: 200, clientY: 200, pointerId: 1 })
    fireEvent.pointerMove(itemEl, { clientX: 280, clientY: 200, pointerId: 1 })
    fireEvent.pointerUp(itemEl, { clientX: 280, clientY: 200, pointerId: 1 })

    await finishExitMotion()
    await waitFor(() => {
      expect(screen.queryByText('Swipe me away')).toBeNull()
    })
  })

  it('does not close on a small-distance swipe even with high velocity', async () => {
    render(() => <Toast />)

    Toast.show({ title: 'Jitter click' })
    const toastItem = await screen.findByText('Jitter click')
    const itemEl = toastItem.closest('[data-slot="toast-item"]') as HTMLElement

    fireEvent.pointerDown(itemEl, { clientX: 200, clientY: 200, pointerId: 1 })
    fireEvent.pointerMove(itemEl, { clientX: 203, clientY: 200, pointerId: 1 })
    fireEvent.pointerUp(itemEl, { clientX: 203, clientY: 200, pointerId: 1 })

    expect(screen.getByText('Jitter click')).not.toBeNull()
  })

  it('does not close when swiping in the dampened direction', async () => {
    render(() => <Toast align="end" />)

    Toast.show({ title: 'Stay put' })
    const toastItem = await screen.findByText('Stay put')
    const itemEl = toastItem.closest('[data-slot="toast-item"]') as HTMLElement

    fireEvent.pointerDown(itemEl, { clientX: 200, clientY: 200, pointerId: 1 })
    fireEvent.pointerMove(itemEl, { clientX: 120, clientY: 200, pointerId: 1 })
    fireEvent.pointerUp(itemEl, { clientX: 120, clientY: 200, pointerId: 1 })

    expect(screen.getByText('Stay put')).not.toBeNull()
  })

  it('preserves existing toast DOM node and updates stacking state when a new toast is created', async () => {
    render(() => <Toast />)

    Toast.show({ title: 'Toast A' })
    const itemA = await screen.findByText('Toast A')
    const toastNodeA = itemA.closest('[data-slot="toast-item"]') as HTMLElement
    expect(toastNodeA).not.toBeNull()
    expect(toastNodeA.hasAttribute('data-front')).toBe(true)
    expect(toastNodeA.hasAttribute('data-behind')).toBe(false)

    Toast.show({ title: 'Toast B' })
    await screen.findByText('Toast B')

    const itemAAfter = screen.getByText('Toast A')
    const toastNodeAAfter = itemAAfter.closest('[data-slot="toast-item"]') as HTMLElement

    expect(toastNodeAAfter).toBe(toastNodeA)
    expect(toastNodeAAfter.hasAttribute('data-front')).toBe(false)
    expect(toastNodeAAfter.hasAttribute('data-behind')).toBe(true)
  })

  it('renders data-slot attributes on all toast parts', async () => {
    render(() => <Toast close progress />)

    Toast.show({
      title: 'Slot Test Title',
      description: 'Slot Test Description',
      type: 'success',
      action: { label: 'Action Btn', onClick: vi.fn() },
      cancel: { label: 'Cancel Btn', onClick: vi.fn() },
    })

    const titleEl = await screen.findByText('Slot Test Title')
    expect(titleEl.closest('[data-slot="toast-item"]')?.getAttribute('data-slot')).toBe(
      'toast-item',
    )
    const toastItem = titleEl.closest('[data-slot="toast-item"]')!
    expect(toastItem.querySelector('[data-slot="toast-icon"]')).not.toBeNull()
    expect(toastItem.querySelector('[data-slot="toast-wrapper"]')).not.toBeNull()
    expect(toastItem.querySelector('[data-slot="toast-title"]')).not.toBeNull()
    expect(toastItem.querySelector('[data-slot="toast-description"]')).not.toBeNull()
    expect(toastItem.querySelector('[data-slot="toast-action"]')).not.toBeNull()
    expect(toastItem.querySelector('[data-slot="toast-cancel"]')).not.toBeNull()
    expect(toastItem.querySelector('[data-slot="toast-close"]')).not.toBeNull()
    expect(toastItem.querySelector('[data-slot="toast-progress"]')).not.toBeNull()
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
      '[moraine] Duplicate <Toast id="dup">. The last mounted host takes precedence.',
    )
  })

  it('renders a named host independently from the default host', async () => {
    render(() => (
      <>
        <Toast id="main" />
        <Toast id="isolated" />
      </>
    ))

    Toast.show({ title: 'Isolated only', host: 'isolated' })
    Toast.show({ title: 'Default only', host: 'main' })

    await screen.findByText('Isolated only')
    await screen.findByText('Default only')

    const isolatedViewport = screen
      .getByText('Isolated only')
      .closest('[data-slot="toast"]')?.textContent
    expect(isolatedViewport).toContain('Isolated only')
    expect(isolatedViewport).not.toContain('Default only')
  })

  it('sends calls without host only to the host without an id', async () => {
    render(() => (
      <>
        <Toast />
        <Toast id="dock" />
      </>
    ))
    Toast.show({ title: 'Default call' })
    const title = await screen.findByText('Default call')
    const hosts = Array.from(document.querySelectorAll('[data-slot="toast"]'))
    const dock = hosts.at(-1)
    expect(hosts.length).toBe(2)
    expect(dock?.textContent ?? '').not.toContain('Default call')
    expect(hosts[0]?.contains(title)).toBe(true)
  })

  it('throws when only hosts with an id are mounted and the call omits host', () => {
    render(() => <Toast id="dock" />)
    expect(() => Toast.show({ title: 'Nowhere' })).toThrow('Mount <Toast> before calling Toast.')
  })

  it('keeps the host mounted and renders the list only while it has toasts', async () => {
    render(() => <Toast />)
    const host = () => document.querySelector('[data-slot="toast"]')
    const list = () => document.querySelector('[data-slot="toast-list"]')
    // Persistent live region; no empty list.
    expect(host()?.getAttribute('aria-live')).toBe('polite')
    expect(list()).toBeNull()

    const id = Toast.show({ title: 'Lifecycle toast' })
    await screen.findByText('Lifecycle toast')
    expect(list()).not.toBeNull()

    Toast.close(id.id)
    // Still mounted while the exit animation plays.
    await Promise.resolve()
    expect(list()).not.toBeNull()
    expect(screen.queryByText('Lifecycle toast')).not.toBeNull()

    await finishExitMotion()
    await waitFor(() => expect(list()).toBeNull())
    expect(host()).not.toBeNull()
  })

  it('cleans up rendered toasts when the host unmounts', async () => {
    const result = render(() => <Toast />)
    Toast.show({ title: 'Unmount me' })
    expect(await screen.findByText('Unmount me')).not.toBeNull()

    result.unmount()
    expect(screen.queryByText('Unmount me')).toBeNull()
    expect(document.querySelector('[data-slot="toast"]')).toBeNull()
  })

  it('applies host invert and classes to toast items', async () => {
    render(() => <Toast invert classes={{ title: 'host-title-class' }} />)
    Toast.show({ title: 'Inverted' })
    const title = await screen.findByText('Inverted')
    expect(title.className).toContain('host-title-class')
  })

  it('lets user styles.list.width override the default list width', async () => {
    render(() => <Toast styles={{ list: { width: '200px' } }} />)
    Toast.show({ title: 'Width override' })
    await screen.findByText('Width override')
    const list = screen.getByRole('list')
    expect(list.style.width).toBe('200px')
  })

  it('applies class and style to root section and classes/styles to item', async () => {
    render(() => <Toast class="host-root-class" classes={{ item: 'item-custom-class' }} />)
    Toast.show({ title: 'Slot custom classes' })
    const title = await screen.findByText('Slot custom classes')
    const host = document.querySelector('[data-slot="toast"]') as HTMLElement
    const item = title.closest('[data-slot="toast-item"]') as HTMLElement

    expect(host).not.toBeNull()
    expect(host.className).toContain('host-root-class')
    expect(item).not.toBeNull()
    expect(item.className).toContain('item-custom-class')
  })

  it('supports default and large layout variants', async () => {
    render(() => <Toast />)

    Toast.show({
      id: 'default-toast',
      title: 'Default Size',
      action: { label: 'Action Default' },
      close: true,
    })

    Toast.show({
      id: 'large-toast',
      title: 'Large Size',
      large: true,
      action: { label: 'Action Large' },
      cancel: { label: 'Cancel Large' },
      close: true,
    })

    await screen.findByText('Default Size')
    await screen.findByText('Large Size')

    const defaultEl = screen.getByText('Default Size').closest('[data-slot="toast-item"]')!
    const largeEl = screen.getByText('Large Size').closest('[data-slot="toast-item"]')!

    // Default layout has center alignment
    expect(defaultEl.className).toContain('items-center')
    expect(defaultEl.querySelector('[data-slot="toast-actions"]')).not.toBeNull()

    // Large layout has multi-line wrapping layout and top-right close
    expect(largeEl.className).toContain('items-start')
    expect(largeEl.className).toContain('flex-wrap')

    const largeActions = largeEl.querySelector('[data-slot="toast-actions"]')!
    expect(largeActions).not.toBeNull()
    expect(largeActions.className).toContain('w-full')
    expect(largeActions.className).toContain('justify-end')

    const largeClose = largeEl.querySelector('[data-slot="toast-close"]')!
    expect(largeClose).not.toBeNull()
    expect(largeClose.className).toContain('absolute')
    expect(largeClose.className).toContain('right-3.5')
    expect(largeClose.className).toContain('top-3.5')
  })

  it('treats null host variant props as unset', async () => {
    render(() => <Toast large={null} />)

    Toast.show({ title: 'Null host variant' })

    const item = (await screen.findByText('Null host variant')).closest(
      '[data-slot="toast-item"]',
    ) as HTMLElement
    expect(item.className).toContain('items-center')
  })

  it('inherits host-level large default variant', async () => {
    render(() => <Toast large />)

    Toast.show({
      title: 'Inherited Large Size',
      action: { label: 'Action' },
      close: true,
    })

    await screen.findByText('Inherited Large Size')
    const itemEl = screen.getByText('Inherited Large Size').closest('[data-slot="toast-item"]')!
    expect(itemEl.className).toContain('items-start')
    expect(itemEl.className).toContain('flex-wrap')
  })

  it('supports custom itemRender on <Toast>', async () => {
    const customRender = vi.fn((props: ToastT.ItemRenderProps) => (
      <div data-testid={`custom-item-${props.id}`}>
        <span>Custom: {props.options.title}</span>
        <button type="button" onClick={() => props.close()}>
          Custom Dismiss
        </button>
      </div>
    ))

    render(() => <Toast itemRender={customRender} />)

    Toast.show({ title: 'ItemRender Toast' })

    await screen.findByText('Custom: ItemRender Toast')
    expect(customRender).toHaveBeenCalled()
    const callArgs = customRender.mock.calls[0]![0]
    expect(callArgs.options.title).toBe('ItemRender Toast')
    expect(callArgs.index).toBe(0)
    expect(typeof callArgs.close).toBe('function')

    // Custom close dismisses toast
    fireEvent.click(screen.getByText('Custom Dismiss'))
    await finishExitMotion()
    await waitFor(() => {
      expect(screen.queryByText('Custom: ItemRender Toast')).toBeNull()
    })
  })
})
