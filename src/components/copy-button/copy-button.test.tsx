import { fireEvent, render } from '@solidjs/testing-library'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { ButtonGroup } from '../button-group'

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
    expect(button).toBeDefined()
    expect(button.getAttribute('data-slot')).toBe('copy-button')
    expect(button.hasAttribute('data-state')).toBe(false)
    expect(button.hasAttribute('data-copied')).toBe(false)
    expect(button.hasAttribute('aria-invalid')).toBe(false)

    const iconSlot = button.querySelector('[data-slot="copy-button-icon"]')!
    expect(iconSlot).toBeDefined()
    expect(iconSlot.hasAttribute('data-copied')).toBe(false)
    expect(iconSlot.getAttribute('class')).toContain('icon-copy')

    // Click triggers copy and switches icon
    fireEvent.click(button)
    expect(writeText).toHaveBeenCalledWith('moraine-package')
    await flushMicrotasks()

    expect(button.hasAttribute('data-state')).toBe(false)
    expect(button.getAttribute('data-copied')).toBe('')
    expect(iconSlot.getAttribute('data-copied')).toBe('')
    expect(iconSlot.getAttribute('class')).toContain('icon-check')
    expect(button.getAttribute('aria-label')).toBe('Copied to clipboard')

    // Timeout resets state
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
    const button = screen.getByRole('button', { name: 'Copy to clipboard' })
    const label = button.querySelector('[data-slot="copy-button-label"]')!
    expect(label.textContent).toBe('Copy clone url')
  })

  test('supports render-prop children receiving reactive copy state', async () => {
    const screen = render(() => (
      <CopyButton value="render-prop-data">
        {(state) => <span>{state.isCopied ? 'Copied URL' : 'Copy URL'}</span>}
      </CopyButton>
    ))
    const button = screen.getByRole('button', { name: 'Copy to clipboard' })
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
    const button = screen.getByRole('button', { name: 'Copy to clipboard' })
    const children = Array.from(button.children)
    const labelIdx = children.findIndex(
      (el) => el.getAttribute('data-slot') === 'copy-button-label',
    )
    const iconIdx = children.findIndex((el) => el.getAttribute('data-slot') === 'copy-button-icon')
    expect(labelIdx).toBeLessThan(iconIdx)
  })

  test('sets aria-invalid on copy failure, including invalid styling', async () => {
    writeText.mockRejectedValueOnce(new Error('Clipboard write error'))
    const onError = vi.fn()
    const screen = render(() => <CopyButton value="failed-copy" onError={onError} />)
    const button = screen.getByRole('button', { name: 'Copy to clipboard' })

    expect(button.hasAttribute('aria-invalid')).toBe(false)
    expect(button.className).toContain('aria-invalid:border-danger')

    fireEvent.click(button)
    await flushMicrotasks()

    expect(onError).toHaveBeenCalled()
    expect(button.getAttribute('aria-invalid')).toBe('true')
    expect(button.hasAttribute('data-copied')).toBe(false)

    // Resets after timeout
    vi.advanceTimersByTime(2000)
    expect(button.hasAttribute('aria-invalid')).toBe(false)
  })

  test('disabled button prevents copy', () => {
    const screen = render(() => <CopyButton value="disabled-value" disabled />)
    const button = screen.getByRole('button', { name: 'Copy to clipboard' })
    expect(button.hasAttribute('disabled')).toBe(true)

    fireEvent.click(button)
    expect(writeText).not.toHaveBeenCalled()
  })

  test('calls onCopy and onStatusChange callbacks', async () => {
    const onCopy = vi.fn()
    const onStatusChange = vi.fn()
    const screen = render(() => (
      <CopyButton
        value="callback-test"
        copiedDuration={1500}
        onCopy={onCopy}
        onStatusChange={onStatusChange}
      />
    ))
    const button = screen.getByRole('button', { name: 'Copy to clipboard' })
    fireEvent.click(button)
    await flushMicrotasks()

    expect(onCopy).toHaveBeenCalledWith('callback-test')
    expect(onStatusChange).toHaveBeenCalledWith({
      isCopied: true,
      state: 'copied',
    })

    vi.advanceTimersByTime(1500)
    expect(onStatusChange).toHaveBeenCalledWith({
      isCopied: false,
      state: 'idle',
    })
  })

  test('omits icon when icon={false}', () => {
    const screen = render(() => (
      <CopyButton value="no-icon" icon={false}>
        <span>Text only</span>
      </CopyButton>
    ))
    const button = screen.getByRole('button', { name: 'Copy to clipboard' })
    expect(button.querySelector('[data-slot="copy-button-icon"]')).toBeNull()
    expect(button.querySelector('[data-slot="copy-button-label"]')).not.toBeNull()
  })

  test('auto-prepends icon- to size when icon exists without label, and uses standard size with label', () => {
    const iconOnly = render(() => <CopyButton value="test" size="sm" />)
    const iconBtn = iconOnly.getByRole('button', { name: 'Copy to clipboard' })
    expect(iconBtn.classList.contains('size-7')).toBe(true)

    const labeled = render(() => (
      <CopyButton value="test" size="sm">
        <span>Copy</span>
      </CopyButton>
    ))
    const labeledBtn = labeled.getByRole('button', { name: 'Copy to clipboard' })
    expect(labeledBtn.classList.contains('h-7')).toBe(true)
    expect(labeledBtn.classList.contains('px-2')).toBe(true)
  })

  test('inherits variants from button group context', () => {
    const screen = render(() => (
      <ButtonGroup size="sm" variant="outline">
        <CopyButton value="in-group" />
      </ButtonGroup>
    ))
    const button = screen.getByRole('button', { name: 'Copy to clipboard' })
    expect(button.classList.contains('size-7')).toBe(true)
    expect(button.classList.contains('border-tone-border')).toBe(true)
  })
})
