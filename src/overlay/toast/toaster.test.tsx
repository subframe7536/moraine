import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { finishExitMotion } from '../../test-util/overlay-test'

import { toast } from './toast-store'
import { Toaster } from './toaster'

describe('Toaster Component', () => {
  beforeEach(() => {
    toast.clear()
    toast.preventDuplicate = false
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    toast.clear()
  })

  it('renders a toast with default props', async () => {
    render(() => <Toaster />)

    toast.add('My Toast Notification')

    expect(await screen.findByText('My Toast Notification')).not.toBeNull()
    const toastItem = document.querySelector('[data-slot="toast"]')
    expect(toastItem).not.toBeNull()
    expect(toastItem?.getAttribute('data-type')).toBe('default')
  })

  it('renders toast variant helpers (success, error, warning, info, loading)', async () => {
    render(() => <Toaster />)

    toast.success('Success message')
    toast.error('Error message')
    toast.warning('Warning message')
    toast.info('Info message')
    toast.loading('Loading message')

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
    render(() => <Toaster />)

    toast.add('Action Needed', {
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
    render(() => <Toaster />)

    toast.add('Discard changes?', {
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
    render(() => <Toaster closeButton closeButtonAriaLabel="Dismiss notification" />)

    toast.add('Closable item')

    const closeBtn = await screen.findByRole('button', { name: 'Dismiss notification' })
    expect(closeBtn).not.toBeNull()

    fireEvent.click(closeBtn)
    await finishExitMotion()
    await waitFor(() => {
      expect(screen.queryByText('Closable item')).toBeNull()
    })
  })

  it('auto-dismisses after duration', async () => {
    vi.useFakeTimers()
    try {
      render(() => <Toaster duration={2000} />)
      await Promise.resolve()

      toast.add('Auto fading message')
      expect(screen.getByText('Auto fading message')).not.toBeNull()

      await vi.advanceTimersByTimeAsync(2100)
      await finishExitMotion()

      expect(screen.queryByText('Auto fading message')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('pauses timer on hover and resumes on mouse leave', async () => {
    vi.useFakeTimers()
    try {
      render(() => <Toaster duration={3000} />)
      await Promise.resolve()

      toast.add('Hover test toast')
      expect(screen.getByText('Hover test toast')).not.toBeNull()

      const list = screen.getByRole('list')

      // Advance halfway (1500ms)
      await vi.advanceTimersByTimeAsync(1500)
      expect(screen.queryByText('Hover test toast')).not.toBeNull()

      // Hover over list to pause
      fireEvent.mouseEnter(list)

      // Advance past initial duration while hovering (3000ms more)
      await vi.advanceTimersByTimeAsync(3000)
      expect(screen.queryByText('Hover test toast')).not.toBeNull()

      // Mouse leave to resume
      fireEvent.mouseLeave(list)

      // Advance remaining time (1500ms + buffer)
      await vi.advanceTimersByTimeAsync(1600)
      await finishExitMotion()
      expect(screen.queryByText('Hover test toast')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('supports custom JSX toasts via toast.custom', async () => {
    render(() => <Toaster />)

    toast.custom((id) => (
      <div data-testid="custom-toast">
        <span>Custom JSX Content {id}</span>
        <button type="button" onClick={() => toast.dismiss(id)}>
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
    render(() => <Toaster />)

    let resolvePromise: (val: string) => void
    const samplePromise = new Promise<string>((res) => {
      resolvePromise = res
    })

    const promiseReturn = toast.promise(samplePromise, {
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
    render(() => <Toaster />)

    let rejectPromise: (err: Error) => void
    const samplePromise = new Promise<string>((_res, rej) => {
      rejectPromise = rej
    })

    const promiseReturn = toast.promise(samplePromise, {
      loading: 'Uploading file...',
      success: 'File uploaded',
      error: (err) => `Upload failed: ${(err as Error).message}`,
    })

    expect(await screen.findByText('Uploading file...')).not.toBeNull()

    rejectPromise!(new Error('Network error'))

    expect(await screen.findByText('Upload failed: Network error')).not.toBeNull()
    await expect(promiseReturn.unwrap()).rejects.toThrow('Network error')
  })

  it('prevents duplicates and bumps bumpKey when preventDuplicate is set', async () => {
    toast.preventDuplicate = true
    render(() => <Toaster />)

    const id1 = toast.add('Duplicate message')
    const id2 = toast.add('Duplicate message')

    expect(id1).toBe(id2)

    await screen.findByText('Duplicate message')
    const toasts = document.querySelectorAll('[data-slot="toast"]')
    expect(toasts.length).toBe(1)
  })

  it('applies inert and data-limited to toasts past visibleToasts limit', async () => {
    render(() => <Toaster visibleToasts={2} />)

    toast.add('Toast 1')
    toast.add('Toast 2')
    toast.add('Toast 3')

    await screen.findByText('Toast 1')
    await screen.findByText('Toast 2')
    await screen.findByText('Toast 3')

    const toasts = document.querySelectorAll<HTMLElement>('[data-slot="toast"]')
    expect(toasts.length).toBe(3)

    // Third toast (index 2) is beyond limit of 2 visible
    expect(toasts[2]?.hasAttribute('data-limited')).toBe(true)

    // Front toasts are active
    expect(toasts[0]?.hasAttribute('data-limited')).toBe(false)
    expect(toasts[1]?.hasAttribute('data-limited')).toBe(false)
  })

  it('filters by toasterId for scoped toaster instances', async () => {
    render(() => (
      <>
        <Toaster />
        <Toaster id="scoped-toaster" />
      </>
    ))

    toast.add('Global notification')
    toast.add('Scoped notification', { toasterId: 'scoped-toaster' })

    await screen.findByText('Global notification')
    await screen.findByText('Scoped notification')

    const lists = document.querySelectorAll('ol')
    expect(lists.length).toBe(2)
    expect(lists[0]?.textContent).toContain('Global notification')
    expect(lists[0]?.textContent).not.toContain('Scoped notification')
    expect(lists[1]?.textContent).toContain('Scoped notification')
    expect(lists[1]?.textContent).not.toContain('Global notification')
  })

  it('supports F6 hotkey to expand and focus notifications region', async () => {
    render(() => <Toaster hotkey={['F6']} />)

    toast.add('Accessible notification')

    const region = await screen.findByRole('region', { name: /Notifications/ })
    expect(region).not.toBeNull()

    // Dispatch F6
    fireEvent.keyDown(window, { key: 'F6' })

    const toastItem = document.querySelector<HTMLElement>('[data-slot="toast"]')
    expect(document.activeElement).toBe(toastItem)
    expect(toastItem?.getAttribute('data-expanded')).toBe('')
  })

  it('renders progress bar when showProgress is enabled', async () => {
    render(() => <Toaster showProgress />)

    toast.add('With Progress Bar')

    await screen.findByText('With Progress Bar')
    const progress = document.querySelector('[role="progressbar"]')
    expect(progress).not.toBeNull()
  })

  it('dismisses via toast.dismiss and clears via toast.clear', async () => {
    render(() => <Toaster />)

    const id = toast.add('To dismiss')
    expect(await screen.findByText('To dismiss')).not.toBeNull()

    toast.dismiss(id)
    await finishExitMotion()
    await waitFor(() => {
      expect(screen.queryByText('To dismiss')).toBeNull()
    })

    toast.add('To clear 1')
    toast.add('To clear 2')
    expect(await screen.findByText('To clear 1')).not.toBeNull()
    expect(await screen.findByText('To clear 2')).not.toBeNull()

    toast.clear()
    await finishExitMotion()
    await waitFor(() => {
      expect(screen.queryByText('To clear 1')).toBeNull()
      expect(screen.queryByText('To clear 2')).toBeNull()
    })
  })
})
