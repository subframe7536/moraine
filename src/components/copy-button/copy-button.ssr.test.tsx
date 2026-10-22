import { fireEvent } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'

import { CopyButton } from './copy-button'

const writeText = vi.fn<(text: string) => Promise<void>>()

beforeEach(() => {
  writeText.mockReset().mockResolvedValue(undefined)
  vi.stubGlobal('navigator', {
    clipboard: {
      writeText,
    },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function flushMicrotasks() {
  for (let i = 0; i < 5; i++) {
    await Promise.resolve()
  }
}

describe('CopyButton SSR hydration', () => {
  test('hydrates without mismatch and preserves interactive copy behavior', async () => {
    const [text, setText] = createSignal('Copy server text')
    const { container } = hydrateFixture(
      '/src/components/copy-button/copy-button.ssr.fixture.tsx',
      'renderCopyButtonFixture',
      () => (
        <>
          <CopyButton value="server-value" />
          <CopyButton value="server-with-children">
            <span>{text()}</span>
          </CopyButton>
          <CopyButton value="render-prop-server">
            {(state) => (
              <span>
                {state.isCopied ? 'Copied' : 'Idle'} /{' '}
                {state.isSupported ? 'Supported' : 'Unsupported'}
              </span>
            )}
          </CopyButton>
        </>
      ),
    )

    const buttons = container.querySelectorAll<HTMLButtonElement>('button')
    expect(buttons).toHaveLength(3)

    const iconOnly = buttons[0]!
    const withChildren = buttons[1]!
    const renderProp = buttons[2]!

    expect(iconOnly.getAttribute('data-slot')).toBe('copy-button')
    expect(iconOnly.hasAttribute('data-copied')).toBe(false)
    expect(iconOnly.getAttribute('aria-label')).toBe('Copy to clipboard')

    const labelChild = withChildren.querySelector('span[data-slot="copy-button-label"] > span')!
    expect(labelChild.textContent).toBe('Copy server text')
    setText('Updated client text')
    expect(labelChild.textContent).toBe('Updated client text')

    fireEvent.click(iconOnly)
    expect(writeText).toHaveBeenCalledWith('server-value')
    await flushMicrotasks()
    expect(iconOnly.hasAttribute('data-copied')).toBe(true)
    expect(iconOnly.getAttribute('aria-label')).toBe('Copied to clipboard')

    const renderPropChild = renderProp.querySelector('span[data-slot="copy-button-label"] > span')!
    expect(renderPropChild.textContent).toContain('Idle / Unsupported')
  })
})
