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
  test('renders default icon-button with accessible label, data-slot, and opacity transition classes', async () => {
    const screen = render(() => <CopyButton value="moraine-package" />)
    const button = screen.getByRole('button', { name: 'Copy to clipboard' })
    expect(button).toBeDefined()
    expect(button.getAttribute('data-slot')).toBe('copy-button')
    expect(button.getAttribute('data-state')).toBe('idle')
    expect(button.hasAttribute('data-copied')).toBe(false)

    const indicator = button.querySelector('[data-slot="copy-button-indicator"]')!
    expect(indicator).toBeDefined()

    const idleIcon = indicator.querySelector('[data-slot="copy-button-icon"]')!
    const copiedIcon = indicator.querySelector('[data-slot="copy-button-copied-icon"]')!
    expect(idleIcon.className).toContain('opacity-100')
    expect(idleIcon.className).toContain('scale-100')
    expect(copiedIcon.className).toContain('opacity-0')
    expect(copiedIcon.className).toContain('scale-75')

    // Click triggers copy and animates transition
    fireEvent.click(button)
    expect(writeText).toHaveBeenCalledWith('moraine-package')
    await flushMicrotasks()

    expect(button.getAttribute('data-state')).toBe('copied')
    expect(button.getAttribute('data-copied')).toBe('')
    expect(button.getAttribute('aria-label')).toBe('Copied to clipboard')

    expect(idleIcon.className).toContain('opacity-0')
    expect(idleIcon.className).toContain('scale-75')
    expect(copiedIcon.className).toContain('opacity-100')
    expect(copiedIcon.className).toContain('scale-100')

    // Timeout resets state
    vi.advanceTimersByTime(2000)
    expect(button.getAttribute('data-state')).toBe('idle')
    expect(button.hasAttribute('data-copied')).toBe(false)
    expect(button.getAttribute('aria-label')).toBe('Copy to clipboard')
  })

  test('renders text label alongside indicator icon', () => {
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
        {(state) => <span>{state.copied ? 'Copied URL' : 'Copy URL'}</span>}
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

  test('supports indicatorTransition=false to render a single icon without transitions', async () => {
    const screen = render(() => <CopyButton value="no-transition" indicatorTransition={false} />)
    const button = screen.getByRole('button', { name: 'Copy to clipboard' })
    const indicator = button.querySelector('[data-slot="copy-button-indicator"]')!
    expect(indicator.querySelector('[data-slot="copy-button-copied-icon"]')).toBeNull()

    const icon = indicator.querySelector('[data-slot="copy-button-icon"]')!
    expect(icon).toBeDefined()

    fireEvent.click(button)
    await flushMicrotasks()

    expect(button.getAttribute('data-state')).toBe('copied')
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
    const indicatorIdx = children.findIndex(
      (el) => el.getAttribute('data-slot') === 'copy-button-indicator',
    )
    expect(labelIdx).toBeLessThan(indicatorIdx)
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
      copied: true,
      state: 'copied',
      data: 'callback-test',
    })

    vi.advanceTimersByTime(1500)
    expect(onStatusChange).toHaveBeenCalledWith({
      copied: false,
      state: 'idle',
      data: 'callback-test',
    })
  })

  test('switches variant and tone when copiedVariant and copiedTone are specified', async () => {
    const screen = render(() => (
      <CopyButton
        value="tone-test"
        variant="ghost"
        copiedVariant="solid"
        tone="neutral"
        copiedTone="success"
      />
    ))
    const button = screen.getByRole('button', { name: 'Copy to clipboard' })
    expect(button.classList.contains('bg-tone')).toBe(false)

    fireEvent.click(button)
    await flushMicrotasks()

    expect(button.getAttribute('data-state')).toBe('copied')
    expect(button.classList.contains('bg-tone')).toBe(true)
  })

  test('inherits variants from button group context', () => {
    const screen = render(() => (
      <ButtonGroup size="sm" variant="outline">
        <CopyButton value="in-group" />
      </ButtonGroup>
    ))
    const button = screen.getByRole('button', { name: 'Copy to clipboard' })
    expect(button.classList.contains('h-7')).toBe(true)
  })
})
