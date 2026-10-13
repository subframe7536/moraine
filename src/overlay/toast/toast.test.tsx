import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { finishExitMotion } from '../../test-util/overlay-test'

import { createToastStore } from './toast-store'

import { Toast } from './index'
import type { ToastT } from './index'

describe('Toast', () => {
  beforeEach(() => {
    Toast.close()
    Toast.preventDuplicate = false
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

    Toast.add({ title: 'My Toast Notification' })

    expect(await screen.findByText('My Toast Notification')).not.toBeNull()
    const toastItem = document.querySelector('[data-slot="toast-item"]')
    expect(toastItem).not.toBeNull()
    expect(toastItem?.hasAttribute('data-front')).toBe(true)
  })

  it('renders JSX messages instead of treating DOM nodes as options', async () => {
    render(() => <Toast />)

    Toast.add({ title: <strong data-testid="jsx-message">JSX toast body</strong> })

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

    Toast.add({
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

    Toast.add({
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

  it('defaults action button variant to default and cancel button variant to secondary', async () => {
    render(() => <Toast />)

    Toast.add({
      title: 'Item deleted',
      action: { label: 'Undo' },
      cancel: { label: 'Dismiss' },
    })

    const actionButton = await screen.findByRole('button', { name: 'Undo' })
    const cancelButton = await screen.findByRole('button', { name: 'Dismiss' })

    expect(actionButton.className).toContain('bg-primary')
    expect(cancelButton.className).toContain('bg-secondary')
  })

  it('applies custom variant and size on action and cancel button configs', async () => {
    render(() => <Toast />)

    Toast.add({
      title: 'Item deleted',
      action: {
        label: 'Undo',
        variant: 'outline',
        size: 'lg',
      },
      cancel: {
        label: 'Dismiss',
        variant: 'danger',
      },
    })

    const actionButton = await screen.findByRole('button', { name: 'Undo' })
    const cancelButton = await screen.findByRole('button', { name: 'Dismiss' })

    expect(actionButton.className).toContain('border-border')
    expect(actionButton.className).toContain('text-base')
    expect(cancelButton.className).toContain('bg-danger')
  })

  it('renders close button and closes on click', async () => {
    render(() => <Toast close={{ label: 'Dismiss notification' }} />)

    Toast.add({ title: 'Closable item' })

    const closeBtn = await screen.findByRole('button', { name: 'Dismiss notification' })
    expect(closeBtn).not.toBeNull()

    fireEvent.click(closeBtn)
    await finishExitMotion()
    await waitFor(() => {
      expect(screen.queryByText('Closable item')).toBeNull()
    })
  })

  it('keeps the same toast node mounted through close exit animation', async () => {
    render(() => <Toast close={{ label: 'Dismiss notification' }} />)

    Toast.add({ title: 'Exit close anim' })
    const label = await screen.findByText('Exit close anim')
    const item = label.closest('[data-slot="toast-item"]') as HTMLElement
    expect(item).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }))

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

    const id = Toast.add({ title: 'Exit dismiss anim' })
    const label = await screen.findByText('Exit dismiss anim')
    const item = label.closest('[data-slot="toast-item"]') as HTMLElement

    Toast.close(id)

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

      Toast.add({ title: 'Exit auto anim' })
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

  it('supports close prop as Action, JSX.Element, and boolean', async () => {
    render(() => <Toast />)

    Toast.add({
      title: 'Boolean close',
      close: true,
    })
    Toast.add({
      title: 'Action close',
      close: { label: 'Close Item' },
    })
    Toast.add({
      title: 'Custom element close',
      close: <span data-testid="custom-close">X</span>,
    })

    expect(await screen.findByRole('button', { name: 'Close notification' })).not.toBeNull()
    expect(await screen.findByRole('button', { name: 'Close Item' })).not.toBeNull()
    expect(await screen.findByTestId('custom-close')).not.toBeNull()
  })

  it('defaults role to alert for error and status otherwise', async () => {
    render(() => <Toast />)

    Toast.add({ title: 'Status toast' })
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

    Toast.add({
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

      Toast.add({ title: 'Auto fading message' })
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

      Toast.add({ title: 'Expanded auto dismiss' })
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

      Toast.add({ title: 'Hover pause toast' })
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

      Toast.add({ title: 'Blur pause toast' })
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
      Toast.add({ title: 'First toast' })
      await vi.advanceTimersByTimeAsync(1200)
      await finishExitMotion()
      expect(screen.queryByText('First toast')).toBeNull()

      // Re-attach re-syncs from document.hasFocus(): an unfocused window starts paused.
      hasFocus.mockReturnValue(false)
      Toast.add({ title: 'Second toast' })
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

      Toast.add({ id: 'same', title: 'Original' })
      await vi.advanceTimersByTimeAsync(1500)
      Toast.add({ id: 'same', title: 'Updated' })
      await vi.advanceTimersByTimeAsync(1500)
      expect(screen.queryByText('Updated')).not.toBeNull()

      await vi.advanceTimersByTimeAsync(600)
      await finishExitMotion()
      expect(screen.queryByText('Updated')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('updates title and description in place via Toast.update and triggers isBumping', async () => {
    render(() => <Toast />)
    const id = Toast.add({ title: 'Initial Title', description: 'Initial Desc' })
    expect(await screen.findByText('Initial Title')).not.toBeNull()
    expect(screen.getByText('Initial Desc')).not.toBeNull()

    Toast.update(id, { title: 'Updated Title', description: 'Updated Desc' })
    expect(await screen.findByText('Updated Title')).not.toBeNull()
    expect(screen.getByText('Updated Desc')).not.toBeNull()
    expect(screen.queryByText('Initial Title')).toBeNull()

    const toastEl = document.querySelector('[data-slot="toast-item"]')
    await waitFor(() => {
      expect(toastEl?.hasAttribute('data-bump')).toBe(true)
    })
  })

  it('invokes onClose with auto: true on timer expiration and auto: false on manual close', async () => {
    vi.useFakeTimers()
    const onAutoClose = vi.fn()
    const onManualClose = vi.fn()

    try {
      render(() => <Toast duration={1000} />)
      await Promise.resolve()

      const id1 = Toast.add({ title: 'Auto toast', onClose: onAutoClose })
      const id2 = Toast.add({ title: 'Manual toast', onClose: onManualClose })

      Toast.close(id2)
      expect(onManualClose).toHaveBeenCalledWith(id2, false)

      await vi.advanceTimersByTimeAsync(1100)
      expect(onAutoClose).toHaveBeenCalledWith(id1, true)
    } finally {
      vi.useRealTimers()
    }
  })

  it('supports custom JSX toasts via Toast.custom', async () => {
    render(() => <Toast />)

    Toast.custom((id) => (
      <div data-testid="custom-toast">
        <span>Custom JSX Content {id}</span>
        <button type="button" onClick={() => Toast.close(id)}>
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

  it('closes the loading toast when a promise settles without a matching handler', async () => {
    render(() => <Toast />)

    let resolvePromise: () => void
    const samplePromise = new Promise<void>((res) => {
      resolvePromise = res
    })

    Toast.promise(samplePromise, {
      loading: 'Resolving silently...',
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
        loading: 'Still loading...',
        success: 'Done!',
        duration: 2000,
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

    const id1 = Toast.add({ title: 'Allow dup' })
    const id2 = Toast.add({ title: 'Allow dup' })
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

    Toast.add({ title: 'Top message', toastId: 'top-host' })
    Toast.add({ title: 'Bottom message', toastId: 'bottom-host' })

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

    const id1 = Toast.add({ title: 'Default message' })
    const id2 = Toast.add({ title: 'Default message' })
    expect(id1).not.toBe(id2)

    const s1 = Toast.add({ title: 'Scoped message', toastId: 'scoped-pd' })
    const s2 = Toast.add({ title: 'Scoped message', toastId: 'scoped-pd' })
    expect(s1).toBe(s2)
  })

  it('prevents duplicates and sets data-bump when preventDuplicate is set', async () => {
    Toast.preventDuplicate = true
    render(() => <Toast />)

    const id1 = Toast.add({ title: 'Duplicate message' })
    const id2 = Toast.add({ title: 'Duplicate message' })

    expect(id1).toBe(id2)

    await screen.findByText('Duplicate message')
    const toasts = document.querySelectorAll('[data-slot="toast-item"]')
    expect(toasts.length).toBe(1)

    await waitFor(() => {
      expect(toasts[0]?.hasAttribute('data-bump')).toBe(true)
    })
  })

  it('prevents duplicates only against the front toast in the stack', async () => {
    Toast.preventDuplicate = true
    render(() => <Toast />)

    const idA1 = Toast.add({ title: 'Toast A' })
    const idB = Toast.add({ title: 'Toast B' })

    const idA2 = Toast.add({ title: 'Toast A' })
    expect(idA2).not.toBe(idA1)
    expect(idA2).not.toBe(idB)

    await screen.findByText('Toast B')
    const toasts = document.querySelectorAll('[data-slot="toast-item"]')
    expect(toasts.length).toBe(3)

    const idA3 = Toast.add({ title: 'Toast A' })
    expect(idA3).toBe(idA2)
  })

  it('allows customizing preventDuplicate when calling Toast.show or similar functions', async () => {
    Toast.preventDuplicate = true
    render(() => <Toast />)

    const id1 = Toast.add({ title: 'Allow duplicate' })
    const id2 = Toast.add({ title: 'Allow duplicate', preventDuplicate: false })
    expect(id1).not.toBe(id2)

    Toast.preventDuplicate = false
    const s1 = Toast.success({ title: 'Saved', preventDuplicate: true })
    const s2 = Toast.success({ title: 'Saved', preventDuplicate: true })
    expect(s1).toBe(s2)
  })

  it('applies inert and data-limited to toasts past visibleToasts limit', async () => {
    render(() => <Toast visibleToasts={2} />)

    Toast.add({ title: 'One' })
    Toast.add({ title: 'Two' })
    Toast.add({ title: 'Three' })

    await screen.findByText('One')
    await screen.findByText('Two')
    await screen.findByText('Three')

    const toasts = document.querySelectorAll<HTMLElement>('[data-slot="toast-item"]')
    expect(toasts.length).toBe(3)
    expect(toasts[2]?.hasAttribute('data-limited')).toBe(true)
    expect(toasts[0]?.hasAttribute('data-limited')).toBe(false)
    expect(toasts[1]?.hasAttribute('data-limited')).toBe(false)
  })

  it('filters by toastId for scoped host instances', async () => {
    render(() => (
      <>
        <Toast />
        <Toast id="alerts" />
      </>
    ))

    Toast.add({ title: 'Default host toast' })
    Toast.add({ title: 'Alerts host toast', toastId: 'alerts' })

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
    Toast.add({ title: 'Slot check' })
    await screen.findByText('Slot check')
    const list = screen.getByRole('list')
    expect(list.getAttribute('data-slot')).toBe('toast-list')
  })

  it('updates list data attributes reactively', async () => {
    render(() => <Toast expand />)
    Toast.add({ title: 'Data attrs' })
    await screen.findByText('Data attrs')
    const list = screen.getByRole('list')
    expect(list.getAttribute('data-expanded')).toBe('')
  })

  it('renders bottom progress bar with CSS transform scaleX animation when showProgress is enabled', async () => {
    render(() => <Toast showProgress duration={4000} />)

    Toast.add({ title: 'With Progress Bar' })

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
    render(() => <Toast showProgress duration={4000} />)
    Toast.add({ title: 'Hover progress test' })
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

    const id1 = Toast.add({ title: 'To close 1' })
    Toast.add({ title: 'To close 2' })
    expect(await screen.findByText('To close 1')).not.toBeNull()
    expect(await screen.findByText('To close 2')).not.toBeNull()

    Toast.close(id1)
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

    Toast.add({ title: 'Toast 1' })
    Toast.add({ title: 'Toast 2' })

    await screen.findByText('Toast 1')
    await screen.findByText('Toast 2')

    const toasts = document.querySelectorAll<HTMLElement>('[data-slot="toast-item"]')
    expect(toasts.length).toBe(2)
    expect(toasts[0]?.hasAttribute('data-front')).toBe(true)
    expect(toasts[0]?.hasAttribute('data-behind')).toBe(false)
    expect(toasts[1]?.hasAttribute('data-front')).toBe(false)
    expect(toasts[1]?.hasAttribute('data-behind')).toBe(true)
  })

  it('expands toasts on mouse enter and collapses on mouse leave', async () => {
    render(() => <Toast />)

    Toast.add({ title: 'Expand 1' })
    Toast.add({ title: 'Expand 2' })

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

  it('closes toast on swipe gesture past threshold', async () => {
    render(() => <Toast />)

    Toast.add({ title: 'Swipe me away' })
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

    Toast.add({ title: 'Jitter click' })
    const toastItem = await screen.findByText('Jitter click')
    const itemEl = toastItem.closest('[data-slot="toast-item"]') as HTMLElement

    fireEvent.pointerDown(itemEl, { clientX: 200, clientY: 200, pointerId: 1 })
    fireEvent.pointerMove(itemEl, { clientX: 203, clientY: 200, pointerId: 1 })
    fireEvent.pointerUp(itemEl, { clientX: 203, clientY: 200, pointerId: 1 })

    expect(screen.getByText('Jitter click')).not.toBeNull()
  })

  it('does not close when swiping in the dampened direction', async () => {
    render(() => <Toast align="end" />)

    Toast.add({ title: 'Stay put' })
    const toastItem = await screen.findByText('Stay put')
    const itemEl = toastItem.closest('[data-slot="toast-item"]') as HTMLElement

    fireEvent.pointerDown(itemEl, { clientX: 200, clientY: 200, pointerId: 1 })
    fireEvent.pointerMove(itemEl, { clientX: 120, clientY: 200, pointerId: 1 })
    fireEvent.pointerUp(itemEl, { clientX: 120, clientY: 200, pointerId: 1 })

    expect(screen.getByText('Stay put')).not.toBeNull()
  })

  it('preserves existing toast DOM node and updates stacking state when a new toast is created', async () => {
    render(() => <Toast />)

    Toast.add({ title: 'Toast A' })
    const itemA = await screen.findByText('Toast A')
    const toastNodeA = itemA.closest('[data-slot="toast-item"]') as HTMLElement
    expect(toastNodeA).not.toBeNull()
    expect(toastNodeA.hasAttribute('data-front')).toBe(true)
    expect(toastNodeA.hasAttribute('data-behind')).toBe(false)

    Toast.add({ title: 'Toast B' })
    await screen.findByText('Toast B')

    const itemAAfter = screen.getByText('Toast A')
    const toastNodeAAfter = itemAAfter.closest('[data-slot="toast-item"]') as HTMLElement

    expect(toastNodeAAfter).toBe(toastNodeA)
    expect(toastNodeAAfter.hasAttribute('data-front')).toBe(false)
    expect(toastNodeAAfter.hasAttribute('data-behind')).toBe(true)
  })

  it('renders data-slot attributes on all toast parts', async () => {
    render(() => <Toast close showProgress />)

    Toast.add({
      title: 'Slot Test Title',
      description: 'Slot Test Description',
      variants: { variant: 'success' },
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

    store.add({ title: 'Isolated only', toastId: 'isolated' })
    Toast.add({ title: 'Default only' })

    await screen.findByText('Isolated only')
    await screen.findByText('Default only')

    const isolatedViewport = screen
      .getByText('Isolated only')
      .closest('[data-slot="toast"]')?.textContent
    expect(isolatedViewport).toContain('Isolated only')
    expect(isolatedViewport).not.toContain('Default only')
  })

  it('keeps the host mounted and renders the list only while it has toasts', async () => {
    render(() => <Toast />)
    const host = () => document.querySelector('[data-slot="toast"]')
    const list = () => document.querySelector('[data-slot="toast-list"]')
    // Persistent live region; no empty list.
    expect(host()?.getAttribute('aria-live')).toBe('polite')
    expect(list()).toBeNull()

    const id = Toast.add({ title: 'Lifecycle toast' })
    await screen.findByText('Lifecycle toast')
    expect(list()).not.toBeNull()

    Toast.close(id)
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
    Toast.add({ title: 'Unmount me' })
    expect(await screen.findByText('Unmount me')).not.toBeNull()

    result.unmount()
    expect(screen.queryByText('Unmount me')).toBeNull()
    expect(document.querySelector('[data-slot="toast"]')).toBeNull()
  })

  it('applies host invert and classes to toast items', async () => {
    render(() => <Toast invert classes={{ title: 'host-title-class' }} />)
    Toast.add({ title: 'Inverted' })
    const title = await screen.findByText('Inverted')
    expect(title.className).toContain('host-title-class')
  })

  it('lets user styles.list.width override the default list width', async () => {
    render(() => <Toast styles={{ list: { width: '200px' } }} />)
    Toast.add({ title: 'Width override' })
    await screen.findByText('Width override')
    const list = screen.getByRole('list')
    expect(list.style.width).toBe('200px')
  })

  it('applies class and style to root section and classes/styles to item', async () => {
    render(() => <Toast class="host-root-class" classes={{ item: 'item-custom-class' }} />)
    Toast.add({ title: 'Slot custom classes' })
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

    Toast.add({
      id: 'default-toast',
      title: 'Default Size',
      action: { label: 'Action Default' },
      close: true,
    })

    Toast.add({
      id: 'large-toast',
      title: 'Large Size',
      variants: { large: true },
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

  it('inherits host-level large default variant', async () => {
    render(() => <Toast large />)

    Toast.add({
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
      <div data-testid={`custom-item-${props.toast.id}`}>
        <span>Custom: {props.toast.title}</span>
        <button type="button" onClick={() => props.close()}>
          Custom Dismiss
        </button>
      </div>
    ))

    render(() => <Toast itemRender={customRender} />)

    Toast.add({ title: 'ItemRender Toast' })

    await screen.findByText('Custom: ItemRender Toast')
    expect(customRender).toHaveBeenCalled()
    const callArgs = customRender.mock.calls[0]![0]
    expect(callArgs.toast.title).toBe('ItemRender Toast')
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
