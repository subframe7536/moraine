import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Sheet } from './sheet'
import type { SheetProps } from './sheet'

describe('Sheet', () => {
  test.each([
    ['left', 'left-0', 'animate-sheet-side-left'],
    ['right', 'right-0', 'animate-sheet-side-right'],
    ['top', 'top-0', 'animate-sheet-side-top'],
    ['bottom', 'bottom-0', 'animate-sheet-side-bottom'],
  ] as const)('applies side variant %s to content', (side, expectedClass, sideClass) => {
    render(() => (
      <Sheet open side={side} body="Sheet body">
        <button type="button">Trigger</button>
      </Sheet>
    ))

    const content = document.body.querySelector('[data-slot="content"]')

    expect(content?.getAttribute('data-side')).toBe(side)
    expect(content?.className).toContain(expectedClass)
    expect(content?.className).toContain('data-expanded:animate-sheet-in')
    expect(content?.className).toContain('data-closed:animate-sheet-out')
    expect(content?.className).toContain(sideClass)
  })

  test('applies inset + transition=false classes', () => {
    render(() => (
      <Sheet
        open
        side="right"
        inset
        transition={false}
        classes={{
          content: 'content-class',
        }}
        body="Body"
      >
        <button type="button">Trigger</button>
      </Sheet>
    ))

    const content = document.body.querySelector('[data-slot="content"]')

    expect(content?.className).toContain('sm:(m-4 b-1 b-border rounded-2xl)')
    expect(content?.className).toContain(
      'transition-none data-expanded:animate-none data-closed:animate-none',
    )
    expect(content?.className).toContain('content-class')
  })

  test('renders default shell with title, description, actions, body, footer and close button', () => {
    render(() => (
      <Sheet
        open
        title="Panel"
        description="Panel description"
        actions={<button type="button">Action</button>}
        body="Sheet body"
        footer="Sheet footer"
      >
        <button type="button">Trigger</button>
      </Sheet>
    ))

    expect(document.body.textContent).toContain('Panel')
    expect(document.body.textContent).toContain('Panel description')
    expect(document.body.textContent).toContain('Action')
    expect(document.body.textContent).toContain('Sheet body')
    expect(document.body.textContent).toContain('Sheet footer')
    expect(document.body.querySelector('[data-slot="close"]')).not.toBeNull()
  })

  test('keeps trigger wrapper out of tab order', () => {
    render(() => (
      <Sheet open body="Body">
        <button type="button">Trigger</button>
      </Sheet>
    ))

    const trigger = document.body.querySelector('[data-slot="trigger"]')

    expect(trigger?.getAttribute('tabindex')).toBe('-1')
  })

  test('supports custom close content', () => {
    render(() => (
      <Sheet open close={<span data-testid="custom-close">X</span>} body="Body">
        <button type="button">Trigger</button>
      </Sheet>
    ))

    expect(document.body.querySelector('[data-testid="custom-close"]')?.textContent).toBe('X')
  })

  test('hides close button when close=false', () => {
    render(() => (
      <Sheet open close={false} body="Body">
        <button type="button">Trigger</button>
      </Sheet>
    ))

    expect(document.body.querySelector('[data-slot="close"]')).toBeNull()
  })

  test('renders body content and keeps shell sections', () => {
    render(() => (
      <Sheet open title="Sheet title" body={<div data-testid="custom-body">Body Content</div>}>
        <button type="button">Trigger</button>
      </Sheet>
    ))

    expect(document.body.querySelector('[data-testid="custom-body"]')?.textContent).toContain(
      'Body Content',
    )
    expect(document.body.textContent).toContain('Sheet title')
  })

  test('opens by trigger click and closes through close button', async () => {
    const onOpenChange = vi.fn()

    const screen = render(() => (
      <Sheet onOpenChange={onOpenChange} title="Sheet" body="Body">
        <button type="button">Open sheet</button>
      </Sheet>
    ))

    expect(document.body.querySelector('[data-slot="content"]')).toBeNull()

    await fireEvent.click(screen.getByText('Open sheet'))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })

    const closeButton = document.body.querySelector('[data-slot="close"]') as HTMLElement
    await fireEvent.click(closeButton)

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    })
  })

  test('renders into portal by default', () => {
    const screen = render(() => (
      <Sheet open title="Portal default" body="Body">
        <button type="button">Trigger</button>
      </Sheet>
    ))

    expect(screen.container.querySelector('[data-slot="content"]')).toBeNull()
    expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
  })

  test('supports overlay=false', () => {
    render(() => (
      <Sheet open overlay={false} body="Body">
        <button type="button">Trigger</button>
      </Sheet>
    ))

    expect(document.body.querySelector('[data-slot="overlay"]')).toBeNull()
  })

  test('prevents close when dismissible=false and emits onClosePrevent', async () => {
    const onClosePrevent = vi.fn()

    render(() => (
      <Sheet defaultOpen dismissible={false} onClosePrevent={onClosePrevent} body="Body">
        <button type="button">Trigger</button>
      </Sheet>
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
        <Sheet defaultOpen dismissible={false} onClosePrevent={onClosePrevent} body="Body">
          <button type="button">Trigger</button>
        </Sheet>
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
      <Sheet
        defaultOpen
        dismissible
        onClosePrevent={onClosePrevent}
        onOpenChange={onOpenChange}
        body="Body"
      >
        <button type="button">Trigger</button>
      </Sheet>
    ))

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement
    content.focus()
    await fireEvent.keyDown(content, { key: 'Escape' })

    await waitFor(() => {
      expect(onClosePrevent).not.toHaveBeenCalled()
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    })
  })

  test('requires children in type contract', () => {
    // @ts-expect-error children is required
    const props: SheetProps = { open: true, body: 'Body' }
    expect(props).toBeDefined()
  })

  test('applies styles override to content', () => {
    render(() => (
      <Sheet open body="Body" styles={{ content: { width: '200px' } } as any}>
        <button type="button">Trigger</button>
      </Sheet>
    ))

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement | null
    expect(content?.style.width).toBe('200px')
  })
})
