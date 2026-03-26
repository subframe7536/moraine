import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Dialog } from './dialog'

describe('Modal', () => {
  test('renders default shell with title, description, body, footer and close button', () => {
    render(() => (
      <Dialog
        open
        title="Confirm"
        description="Please confirm"
        body="Modal body"
        footer="Modal footer"
      >
        <button type="button">Trigger</button>
      </Dialog>
    ))

    expect(document.body.textContent).toContain('Confirm')
    expect(document.body.textContent).toContain('Please confirm')
    expect(document.body.textContent).toContain('Modal body')
    expect(document.body.textContent).toContain('Modal footer')
    expect(document.body.querySelector('[data-slot="close"]')).not.toBeNull()

    const content = document.body.querySelector('[data-slot="content"]')
    const card = content?.querySelector('[data-slot="root"]')

    expect(card?.className).toContain('bg-background')
    expect(card?.className).toContain('surface-overlay')
    expect(content?.className).toContain('data-expanded:animate-surface-in')
  })

  test('composes dialog as popup container + card shell', () => {
    render(() => (
      <Dialog open title="Composed" body="Body">
        <button type="button">Trigger</button>
      </Dialog>
    ))

    const content = document.body.querySelector('[data-slot="content"]')
    const card = content?.querySelector('[data-slot="root"]')

    expect(content).not.toBeNull()
    expect(card).not.toBeNull()
  })

  test('keeps trigger wrapper out of tab order', () => {
    render(() => (
      <Dialog open body="Body">
        <button type="button">Trigger</button>
      </Dialog>
    ))

    const trigger = document.body.querySelector('[data-slot="trigger"]')

    expect(trigger?.getAttribute('tabindex')).toBe('-1')
  })

  test('renders custom header slot and overrides default title/description section', () => {
    render(() => (
      <Dialog
        open
        title="Default title"
        description="Default description"
        header={<div data-testid="custom-header">Custom Header</div>}
      >
        <button type="button">Trigger</button>
      </Dialog>
    ))

    expect(document.body.querySelector('[data-testid="custom-header"]')?.textContent).toContain(
      'Custom Header',
    )
    expect(document.body.textContent).not.toContain('Default title')
    expect(document.body.textContent).not.toContain('Default description')
  })

  test('renders body content and keeps shell sections', () => {
    render(() => (
      <Dialog open title="Dialog title" body={<div data-testid="custom-body">Body Content</div>}>
        <button type="button">Trigger</button>
      </Dialog>
    ))

    expect(document.body.querySelector('[data-testid="custom-body"]')?.textContent).toContain(
      'Body Content',
    )
    expect(document.body.textContent).toContain('Dialog title')
  })

  test('opens by trigger click and closes through close button', async () => {
    const onOpenChange = vi.fn()

    const screen = render(() => (
      <Dialog onOpenChange={onOpenChange} title="Settings" body="Body">
        <button type="button">Open modal</button>
      </Dialog>
    ))

    expect(document.body.querySelector('[data-slot="content"]')).toBeNull()

    await fireEvent.click(screen.getByText('Open modal'))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })

    const closeButton = document.body.querySelector('[data-slot="close"]') as HTMLElement
    await fireEvent.click(closeButton)

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)

      const content = document.body.querySelector('[data-slot="content"]')
      expect(content?.hasAttribute('data-closed')).toBe(true)
    })
  })

  test('renders into portal by default', () => {
    const screen = render(() => (
      <Dialog open title="Portal default" body="Body">
        <button type="button">Trigger</button>
      </Dialog>
    ))

    expect(screen.container.querySelector('[data-slot="content"]')).toBeNull()
    expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
  })

  test('supports overlay=false', () => {
    render(() => (
      <Dialog open overlay={false} body="Body">
        <button type="button">Trigger</button>
      </Dialog>
    ))

    expect(document.body.querySelector('[data-slot="overlay"]')).toBeNull()
  })

  test('supports scrollable overlay mode', () => {
    render(() => (
      <Dialog open scrollable body="Scrollable body">
        <button type="button">Trigger</button>
      </Dialog>
    ))

    const overlays = document.body.querySelectorAll('[data-slot="overlay"]')
    const contents = document.body.querySelectorAll('[data-slot="content"]')
    const overlay = overlays[overlays.length - 1]
    const content = contents[contents.length - 1]

    expect(overlay).not.toBeNull()
    expect(overlay?.contains(content ?? null)).toBe(true)
  })

  test('applies fullscreen + transition=false classes', () => {
    render(() => (
      <Dialog
        open
        fullscreen
        transition={false}
        classes={{
          content: 'content-class',
        }}
        body="Body"
      >
        <button type="button">Trigger</button>
      </Dialog>
    ))

    const content = document.body.querySelector('[data-slot="content"]')

    expect(content?.className).toContain('fixed')
    expect(content?.className).toContain('inset-0')
    expect(content?.className).toContain('flex')
    expect(content?.className).toContain('h-full')
    expect(content?.className).toContain('max-w-none')
    expect(content?.className).toContain('flex-col')
    expect(content?.className).toContain('transition-none')
    expect(content?.className).toContain('content-class')
  })

  test('supports custom close content', () => {
    render(() => (
      <Dialog open closeIcon={<span data-testid="custom-close">X</span>} body="Body">
        <button type="button">Trigger</button>
      </Dialog>
    ))

    expect(document.body.querySelector('[data-testid="custom-close"]')?.textContent).toBe('X')
  })

  test('hides close button when close=false', () => {
    render(() => (
      <Dialog open close={false} body="Body">
        <button type="button">Trigger</button>
      </Dialog>
    ))

    expect(document.body.querySelector('[data-slot="close"]')).toBeNull()
  })

  test('prevents close when dismissible=false and emits onClosePrevent', async () => {
    const onClosePrevent = vi.fn()

    render(() => (
      <Dialog defaultOpen dismissible={false} onClosePrevent={onClosePrevent} body="Body">
        <button type="button">Trigger</button>
      </Dialog>
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
        <Dialog defaultOpen dismissible={false} onClosePrevent={onClosePrevent} body="Body">
          <button type="button">Trigger</button>
        </Dialog>
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
      <Dialog
        defaultOpen
        dismissible
        onClosePrevent={onClosePrevent}
        onOpenChange={onOpenChange}
        body="Body"
      >
        <button type="button">Trigger</button>
      </Dialog>
    ))

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement
    content.focus()
    await fireEvent.keyDown(content, { key: 'Escape' })

    await waitFor(() => {
      expect(onClosePrevent).not.toHaveBeenCalled()
      expect(onOpenChange).toHaveBeenCalledWith(false)

      const contentNode = document.body.querySelector('[data-slot="content"]')
      expect(contentNode?.hasAttribute('data-closed')).toBe(true)
    })
  })

  test('applies styles override to content', () => {
    render(() => (
      <Dialog open body="Body" styles={{ content: { width: '200px' } } as any}>
        <button type="button">Trigger</button>
      </Dialog>
    ))

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement | null
    expect(content?.style.width).toBe('200px')
  })
})
