import { fireEvent, render } from '@solidjs/testing-library'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { CopyButton } from './copy-button'
const writeText = vi.fn<(text: string) => Promise<void>>()

beforeEach(() => {
  vi.useFakeTimers()
  writeText.mockReset().mockResolvedValue(undefined)
  vi.stubGlobal('navigator', {
    clipboard: {
      writeText,
    },
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

async function flushMicrotasks() {
  for (let i = 0; i < 5; i++) {
    await Promise.resolve()
  }
}

describe('CopyButton', () => {
  test('renders default icon-button with accessible label, data-slot, and status transitions', async () => {
    const screen = render(() => <CopyButton value="moraine-package" />)
    const button = screen.getByRole('button', { name: 'Copy to clipboard' })
    expect(button.getAttribute('data-slot')).toBe('copy-button')
    expect(button.hasAttribute('data-copied')).toBe(false)
    expect(button.hasAttribute('aria-invalid')).toBe(false)

    const iconSlot = button.querySelector('[data-slot="copy-button-icon"]')!
    expect(iconSlot.hasAttribute('data-copied')).toBe(false)
    expect(iconSlot.getAttribute('class')).toContain('icon-copy')

    fireEvent.click(button)
    expect(writeText).toHaveBeenCalledWith('moraine-package')
    await flushMicrotasks()

    expect(button.getAttribute('data-copied')).toBe('')
    expect(iconSlot.getAttribute('data-copied')).toBe('')
    expect(iconSlot.getAttribute('class')).toContain('icon-check')
    expect(button.getAttribute('aria-label')).toBe('Copied to clipboard')

    vi.advanceTimersByTime(2000)
    expect(button.hasAttribute('data-copied')).toBe(false)
    expect(iconSlot.hasAttribute('data-copied')).toBe(false)
    expect(iconSlot.getAttribute('class')).toContain('icon-copy')
    expect(button.getAttribute('aria-label')).toBe('Copy to clipboard')
  })

  test('renders text label alongside icon', () => {
    const screen = render(() => (
      <CopyButton value="git clone repo">
        <span>Copy clone url</span>
      </CopyButton>
    ))
    const button = screen.getByRole('button', { name: 'Copy clone url' })
    expect(button.hasAttribute('aria-label')).toBe(false)
    const label = button.querySelector('[data-slot="copy-button-label"]')!
    expect(label.textContent).toBe('Copy clone url')
  })

  test('supports render-prop children receiving reactive copy state', async () => {
    const screen = render(() => (
      <CopyButton value="render-prop-data">
        {(state) => <span>{state.copied ? 'Copied URL' : 'Copy URL'}</span>}
      </CopyButton>
    ))
    const button = screen.getByRole('button', { name: 'Copy URL' })
    const label = button.querySelector('[data-slot="copy-button-label"]')!
    expect(label.textContent).toBe('Copy URL')

    fireEvent.click(button)
    await flushMicrotasks()

    expect(label.textContent).toBe('Copied URL')
    vi.advanceTimersByTime(2000)
    expect(label.textContent).toBe('Copy URL')
  })

  test('supports iconPosition="trailing"', () => {
    const screen = render(() => (
      <CopyButton value="trailing" iconPosition="trailing">
        <span>Trailing icon</span>
      </CopyButton>
    ))
    const button = screen.getByRole('button', { name: 'Trailing icon' })
    const children = Array.from(button.children)
    const labelIdx = children.findIndex(
      (el) => el.getAttribute('data-slot') === 'copy-button-label',
    )
    const iconIdx = children.findIndex((el) => el.getAttribute('data-slot') === 'copy-button-icon')
    expect(labelIdx).toBeLessThan(iconIdx)
  })

  test('sets aria-invalid on copy failure and clears it after the copied duration', async () => {
    writeText.mockRejectedValueOnce(new Error('Clipboard write error'))
    const onCopyError = vi.fn()
    const screen = render(() => <CopyButton value="failed-copy" onCopyError={onCopyError} />)
    const button = screen.getByRole('button', { name: 'Copy to clipboard' })

    expect(button.hasAttribute('aria-invalid')).toBe(false)

    fireEvent.click(button)
    await flushMicrotasks()

    expect(onCopyError).toHaveBeenCalled()
    expect(button.getAttribute('aria-invalid')).toBe('true')
    expect(button.getAttribute('aria-label')).toBe('Copy failed')
    expect(button.hasAttribute('data-copied')).toBe(false)

    vi.advanceTimersByTime(2000)
    expect(button.hasAttribute('aria-invalid')).toBe(false)
    expect(button.getAttribute('aria-label')).toBe('Copy to clipboard')
  })

  test('uses instance translations for the status labels', async () => {
    writeText.mockRejectedValueOnce(new Error('Clipboard write error'))
    const screen = render(() => (
      <CopyButton
        value="token"
        translations={{ copy: 'Copy token', copied: 'Token copied', failed: 'Token not copied' }}
      />
    ))
    const button = screen.getByRole('button', { name: 'Copy token' })

    fireEvent.click(button)
    await flushMicrotasks()
    expect(button.getAttribute('aria-label')).toBe('Token not copied')

    vi.advanceTimersByTime(2000)
    fireEvent.click(button)
    await flushMicrotasks()
    expect(button.getAttribute('aria-label')).toBe('Token copied')
  })

  test('disabled button prevents copy', () => {
    const screen = render(() => <CopyButton value="disabled-value" disabled />)
    const button = screen.getByRole('button', { name: 'Copy to clipboard' })
    expect(button.hasAttribute('disabled')).toBe(true)

    fireEvent.click(button)
    expect(writeText).not.toHaveBeenCalled()
  })

  test('calls onCopySuccess and onStatusChange callbacks', async () => {
    const onCopySuccess = vi.fn()
    const onStatusChange = vi.fn()
    const screen = render(() => (
      <CopyButton
        value="callback-test"
        resetDelay={1500}
        onCopySuccess={onCopySuccess}
        onStatusChange={onStatusChange}
      />
    ))
    const button = screen.getByRole('button', { name: 'Copy to clipboard' })
    fireEvent.click(button)
    await flushMicrotasks()

    expect(onCopySuccess).toHaveBeenCalledWith('callback-test')
    expect(onStatusChange.mock.calls).toEqual([['copied']])

    vi.advanceTimersByTime(1500)
    expect(onStatusChange.mock.calls).toEqual([['copied'], ['idle']])
  })

  test('omits icon when icon={false}', () => {
    const screen = render(() => (
      <CopyButton value="no-icon" icon={false}>
        <span>Text only</span>
      </CopyButton>
    ))
    const button = screen.getByRole('button', { name: 'Text only' })
    expect(button.querySelector('[data-slot="copy-button-icon"]')).toBeNull()
    expect(button.querySelector('[data-slot="copy-button-label"]')).not.toBeNull()
  })

  test('resolves square sizes from the label even when size is explicit', () => {
    const screen = render(() => (
      <>
        <CopyButton value="a" size="sm" />
        <CopyButton value="b" size="icon-sm">
          Labeled
        </CopyButton>
      </>
    ))
    const [iconOnly, labeled] = screen.getAllByRole('button')

    expect(iconOnly!.className).toContain('size-7')
    expect(labeled!.className).not.toContain('size-7')
  })

  test('reports a synchronous value error through onCopyError', async () => {
    const error = new Error('no value')
    const onCopyError = vi.fn()
    const screen = render(() => (
      <CopyButton
        value={() => {
          throw error
        }}
        onCopyError={onCopyError}
      />
    ))

    fireEvent.click(screen.getByRole('button'))
    await flushMicrotasks()

    expect(onCopyError).toHaveBeenCalledWith(error)
    expect(screen.getByRole('button').getAttribute('aria-invalid')).toBe('true')
  })
})
