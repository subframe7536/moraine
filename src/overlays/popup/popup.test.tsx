import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { hydrate } from 'solid-js/web'
import { describe, expect, test, vi } from 'vitest'

import { installHydrationState, renderSsrFixture } from '../../test-utils/ssr-test.ts'

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

  test('uses the title to provide the dialog accessible name', () => {
    render(() => (
      <Popup
        open
        id="account-popup"
        title="Popup title"
        description="Popup description"
        content="Body"
      />
    ))

    const dialog = screen.getByRole('dialog', { name: 'Popup title' })
    const title = document.body.querySelector('[data-slot="title"]')
    const description = document.body.querySelector('[data-slot="description"]')

    expect(title?.id).toBe('account-popup-title')
    expect(description?.id).toBe('account-popup-description')
    expect(dialog.getAttribute('aria-labelledby')).toBe('account-popup-title')
    expect(dialog.getAttribute('aria-describedby')).toBe('account-popup-description')
    expect(title?.textContent).toBe('Popup title')
  })

  test('uses ariaLabel when the popup has no title', () => {
    render(() => <Popup open ariaLabel="Account actions" content="Body" />)

    const dialog = screen.getByRole('dialog', { name: 'Account actions' })

    expect(dialog.getAttribute('aria-label')).toBe('Account actions')
    expect(dialog.getAttribute('aria-labelledby')).toBeNull()
  })

  test('prefers the title over ariaLabel when both are provided', () => {
    render(() => <Popup open title="Popup title" ariaLabel="Fallback name" content="Body" />)

    const dialog = screen.getByRole('dialog', { name: 'Popup title' })

    expect(dialog.getAttribute('aria-label')).toBeNull()
    expect(dialog.getAttribute('aria-labelledby')).not.toBeNull()
  })

  test('updates the labelled-by relationship and accessible name when the title changes', async () => {
    const [title, setTitle] = createSignal<string | undefined>('Initial title')

    render(() => <Popup open title={title()} ariaLabel="Fallback name" content="Body" />)

    const dialog = screen.getByRole('dialog', { name: 'Initial title' })
    const titleElement = document.body.querySelector('[data-slot="title"]')!
    const titleId = titleElement.id

    setTitle('Updated title')

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Updated title' })).toBe(dialog)
      expect(dialog.getAttribute('aria-labelledby')).toBe(titleId)
      expect(titleElement.textContent).toBe('Updated title')
    })

    setTitle(undefined)

    await waitFor(() => {
      expect(dialog.getAttribute('aria-labelledby')).toBeNull()
      expect(dialog.getAttribute('aria-label')).toBe('Fallback name')
      expect(screen.getByRole('dialog', { name: 'Fallback name' })).toBe(dialog)
      expect(document.body.querySelector('[data-slot="title"]')).toBeNull()
    })
  })

  test('does not infer the accessible name from content without title or ariaLabel', () => {
    render(() => <Popup open content="Body" />)

    const dialog = screen.getByRole('dialog')

    expect(dialog.getAttribute('aria-label')).toBeNull()
    expect(dialog.getAttribute('aria-labelledby')).toBeNull()
    expect(dialog.textContent).toContain('Body')
  })

  test('evaluates content, title, and description getters once', () => {
    const reads = { content: 0, description: 0, title: 0 }

    render(() =>
      createComponent(Popup, {
        open: true,
        get content() {
          reads.content += 1
          return 'Body'
        },
        get description() {
          reads.description += 1
          return 'Description'
        },
        get title() {
          reads.title += 1
          return 'Title'
        },
      }),
    )

    expect(reads).toEqual({ content: 1, description: 1, title: 1 })
  })

  test('hydrates the closed popup without replacing the trigger before opening', async () => {
    const markup = renderSsrFixture(
      '/src/overlays/popup/popup.ssr.fixture.tsx',
      'renderPopupFixture',
    )
    const container = document.createElement('div')
    container.innerHTML = markup
    document.body.append(container)
    const serverTrigger = container.querySelector('[data-slot="trigger"]')!
    const restoreHydrationState = installHydrationState()

    const dispose = hydrate(
      () => (
        <Popup title="Hydrated popup" content="Hydrated body">
          {(props) => (
            <button {...props} type="button">
              Open popup
            </button>
          )}
        </Popup>
      ),
      container,
    )

    expect(container.querySelector('[data-slot="trigger"]')).toBe(serverTrigger)

    await fireEvent.click(serverTrigger)

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Hydrated popup' })).not.toBeNull()
    })

    dispose()
    container.remove()
    restoreHydrationState()
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

  test('keeps content inside the overlay until both exit motions settle', async () => {
    let resolveOverlayExit!: () => void
    let resolveContentExit!: () => void
    const overlayExit = new Promise<void>((resolve) => {
      resolveOverlayExit = resolve
    })
    const contentExit = new Promise<void>((resolve) => {
      resolveContentExit = resolve
    })
    const [open, setOpen] = createSignal(true)

    render(() => (
      <Popup open={open()} content="Body">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Popup>
    ))

    const overlay = document.body.querySelector('[data-slot="overlay"]') as HTMLElement
    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement

    Object.defineProperty(overlay, 'getAnimations', {
      configurable: true,
      value: () => [{ finished: overlayExit }],
    })
    Object.defineProperty(content, 'getAnimations', {
      configurable: true,
      value: () => [{ finished: contentExit }],
    })

    setOpen(false)
    await Promise.resolve()
    resolveOverlayExit()
    await waitFor(() => {
      expect(content.parentElement).toBe(overlay)
    })

    resolveContentExit()
    await waitFor(() => {
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
