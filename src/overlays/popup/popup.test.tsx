import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Popup } from './popup.tsx'

async function finishExitMotion(): Promise<void> {
  const content = document.body.querySelector('[data-slot="content"]') as HTMLElement | null
  const overlay = document.body.querySelector('[data-slot="overlay"]') as HTMLElement | null

  if (content) {
    await fireEvent.animationEnd(content)
    await fireEvent.transitionEnd(content)
  }

  if (overlay) {
    await fireEvent.animationEnd(overlay)
    await fireEvent.transitionEnd(overlay)
  }
}

describe('Popup', () => {
  test('renders popup content when open', () => {
    render(() => (
      <Popup open content="Popup content">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Popup>
    ))

    const content = document.body.querySelector('[data-slot="content"]')

    expect(content?.textContent).toContain('Popup content')
    expect(content?.getAttribute('role')).toBe('dialog')
  })

  test('renders into portal by default', () => {
    const screen = render(() => (
      <Popup open content="Portal content">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Popup>
    ))

    expect(screen.container.querySelector('[data-slot="content"]')).toBeNull()
    expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
  })

  test('supports overlay=false', () => {
    render(() => (
      <Popup open overlay={false} content="Body">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Popup>
    ))

    expect(document.body.querySelector('[data-slot="overlay"]')).toBeNull()
  })

  test('supports scrollable overlay mode', () => {
    render(() => (
      <Popup open scrollable content="Scrollable body">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Popup>
    ))

    const overlays = document.body.querySelectorAll('[data-slot="overlay"]')
    const contents = document.body.querySelectorAll('[data-slot="content"]')
    const overlay = overlays[overlays.length - 1]
    const content = contents[contents.length - 1]

    expect(overlay).not.toBeNull()
    expect(overlay?.contains(content ?? null)).toBe(true)
    expect(overlay?.className).toContain('overflow-y-auto')
  })

  test('renders the trigger content as a native button root', () => {
    render(() => (
      <Popup open content="Body">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Popup>
    ))

    const trigger = document.body.querySelector('[data-slot="trigger"]')

    expect(trigger?.tagName).toBe('BUTTON')
    expect(trigger?.getAttribute('type')).toBe('button')
  })

  test('renders an anchor trigger root', () => {
    render(() => (
      <Popup open content="Body">
        {(props) => (
          <a {...props} href="#popup">
            Open
          </a>
        )}
      </Popup>
    ))

    const trigger = document.body.querySelector('[data-slot="trigger"]') as HTMLAnchorElement
    expect(trigger.tagName).toBe('A')
    expect(trigger.getAttribute('href')).toBe('#popup')
  })

  test('does not lock body scroll in scrollable mode by default', () => {
    render(() => (
      <Popup defaultOpen scrollable content="Scrollable body">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Popup>
    ))

    expect(document.body.style.overflow).not.toBe('hidden')
  })

  test('applies classes overrides to trigger/content/overlay', () => {
    render(() => (
      <Popup
        open
        content="Body"
        classes={{
          content: 'content-override',
          overlay: 'overlay-override',
        }}
      >
        {(props) => (
          <button {...props} class="trigger-override" type="button">
            Trigger
          </button>
        )}
      </Popup>
    ))

    expect(document.body.querySelector('[data-slot="trigger"]')?.className).toContain(
      'trigger-override',
    )
    expect(document.body.querySelector('[data-slot="content"]')?.className).toContain(
      'content-override',
    )
    expect(document.body.querySelector('[data-slot="overlay"]')?.className).toContain(
      'overlay-override',
    )
  })

  test('applies top-level class and style to trigger', () => {
    render(() => (
      <Popup open content="Body">
        {(props) => (
          <button {...props} class="trigger-class" style={{ width: '200px' }} type="button">
            Trigger
          </button>
        )}
      </Popup>
    ))

    const trigger = document.body.querySelector('[data-slot="trigger"]') as HTMLElement | null

    expect(trigger?.className).toContain('trigger-class')
    expect(trigger?.style.width).toBe('200px')
  })

  test('does not render content when content is undefined or null', () => {
    render(() => (
      <Popup open>
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Popup>
    ))
    expect(document.body.querySelector('[data-slot="content"]')).toBeNull()

    render(() => (
      <Popup open content={null as never}>
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Popup>
    ))
    expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
  })

  test('prevents close when dismissible=false and emits onClosePrevent', async () => {
    const onClosePrevent = vi.fn()

    render(() => (
      <Popup defaultOpen dismissible={false} onClosePrevent={onClosePrevent} content="Body">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Popup>
    ))

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement
    content.focus()
    await fireEvent.keyDown(content, { key: 'Escape' })

    await waitFor(() => {
      expect(onClosePrevent).toHaveBeenCalledTimes(1)
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })
  })

  test('emits onClosePrevent once for blocked outside pointer interaction', async () => {
    const onClosePrevent = vi.fn()

    const screen = render(() => (
      <>
        <button type="button" data-testid="outside">
          Outside target
        </button>
        <Popup defaultOpen dismissible={false} onClosePrevent={onClosePrevent} content="Body">
          {(props) => (
            <button {...props} type="button">
              Trigger
            </button>
          )}
        </Popup>
      </>
    ))

    await new Promise((resolve) => setTimeout(resolve, 0))
    await fireEvent.pointerDown(screen.getByTestId('outside'))

    await waitFor(() => {
      expect(onClosePrevent).toHaveBeenCalledTimes(1)
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })
  })

  test('allows close when dismissible=true', async () => {
    const onClosePrevent = vi.fn()
    const onOpenChange = vi.fn()

    render(() => (
      <Popup
        defaultOpen
        dismissible
        onClosePrevent={onClosePrevent}
        onOpenChange={onOpenChange}
        content="Body"
      >
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Popup>
    ))

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement
    content.focus()
    await fireEvent.keyDown(content, { key: 'Escape' })

    await finishExitMotion()

    await waitFor(() => {
      expect(onClosePrevent).not.toHaveBeenCalled()
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    })
  })

  test('applies styles override to trigger/content/overlay', () => {
    render(() => (
      <Popup
        open
        content="Body"
        styles={{
          content: { width: '200px' },
          overlay: { width: '200px' },
        }}
      >
        {(props) => (
          <button {...props} style={{ width: '200px' }} type="button">
            Trigger
          </button>
        )}
      </Popup>
    ))

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement | null
    const overlay = document.body.querySelector('[data-slot="overlay"]') as HTMLElement | null

    expect(content?.style.width).toBe('200px')
    expect(overlay?.style.width).toBe('200px')
  })
})
