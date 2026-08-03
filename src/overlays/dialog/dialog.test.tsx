import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import type { JSX } from 'solid-js'
import { Show, createComponent, createMemo, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { CommandPalette } from '../../navigation/command-palette'
import type { ComponentOrElement } from '../../shared/render-prop'
import { ModalContent, ModalRoot, ModalTrigger } from '../base'
import type { ModalContentContext } from '../base/modal'

import { Dialog } from './dialog'

interface TestModalProps {
  defaultOpen?: boolean
  open?: boolean
  overlay?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: JSX.Element
  content?: ComponentOrElement<ModalContentContext>
}

function TestModal(props: TestModalProps): JSX.Element {
  const trigger = createMemo(() => props.trigger)
  const content = createMemo(() => props.content)

  return (
    <ModalRoot
      open={props.open}
      defaultOpen={props.defaultOpen}
      hasOverlay={Boolean(props.overlay)}
      hasContent={Boolean(content())}
      onOpenChange={props.onOpenChange}
    >
      <ModalTrigger>{trigger()}</ModalTrigger>
      <Show when={content()}>
        <ModalContent overlay={props.overlay} contentRender={content()!} />
      </Show>
    </ModalRoot>
  )
}

async function finishExitMotion(): Promise<void> {
  const contents = Array.from(
    document.body.querySelectorAll('[data-slot="content"]'),
  ) as HTMLElement[]
  const overlays = Array.from(
    document.body.querySelectorAll('[data-slot="overlay"]'),
  ) as HTMLElement[]

  for (const content of contents) {
    await fireEvent.animationEnd(content)
    await fireEvent.transitionEnd(content)
  }

  for (const overlay of overlays) {
    await fireEvent.animationEnd(overlay)
    await fireEvent.transitionEnd(overlay)
  }
}

describe('Modal', () => {
  test('evaluates getter-backed trigger and content props once', () => {
    let triggerReads = 0
    let contentReads = 0

    render(() =>
      createComponent(TestModal, {
        open: true,
        get trigger() {
          triggerReads += 1
          return <button type="button">Open modal</button>
        },
        get content() {
          contentReads += 1
          return () => <span>Cached content</span>
        },
      }),
    )

    expect(triggerReads).toBe(1)
    expect(contentReads).toBe(1)
    expect(document.body.textContent).toContain('Cached content')
  })

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
    expect(content?.className).toContain('data-expanded:animate-popup-in')
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

  test('renders function content and closes through modal content context', async () => {
    const onOpenChange = vi.fn()

    render(() => (
      <TestModal
        defaultOpen
        onOpenChange={onOpenChange}
        trigger={<button type="button">Open modal</button>}
        content={({ close }) => (
          <button type="button" data-testid="content-close" onClick={close}>
            Close from content
          </button>
        )}
      />
    ))

    expect(document.body.querySelector('[data-testid="content-close"]')).not.toBeNull()

    await fireEvent.click(document.body.querySelector('[data-testid="content-close"]')!)
    await finishExitMotion()

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    })
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

    expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()

    await finishExitMotion()

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    })
  })

  test('keeps a CommandPalette input value until the Dialog exits', async () => {
    const [open, setOpen] = createSignal(false)
    const [searchTerm, setSearchTerm] = createSignal('')
    const onExitComplete = vi.fn()

    render(() => (
      <Dialog
        open={open()}
        onOpenChange={setOpen}
        onExitComplete={() => {
          setSearchTerm('')
          onExitComplete()
        }}
        close={false}
        body={
          <CommandPalette
            groups={[{ id: 'commands', items: [{ value: 'settings', label: 'Settings' }] }]}
            searchTerm={searchTerm()}
            onSearchTermChange={setSearchTerm}
          />
        }
      >
        <button type="button">Open palette</button>
      </Dialog>
    ))

    await fireEvent.click(document.body.querySelector('[data-slot="trigger"]') as HTMLElement)

    const input = (await waitFor(() =>
      document.body.querySelector('[data-slot="input"]'),
    )) as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'Settings' } })

    expect(input.value).toBe('Settings')

    await fireEvent.keyDown(input, { key: 'Escape' })

    await waitFor(() => {
      expect(input.value).toBe('Settings')
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })
    expect(onExitComplete).not.toHaveBeenCalled()

    await finishExitMotion()

    await waitFor(() => {
      expect(onExitComplete).toHaveBeenCalledTimes(1)
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    })

    await fireEvent.click(document.body.querySelector('[data-slot="trigger"]') as HTMLElement)

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="input"]')).not.toBeNull()
    })
    expect((document.body.querySelector('[data-slot="input"]') as HTMLInputElement).value).toBe('')
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

  test('clears text selection when dismissed by outside pointer interaction', async () => {
    const onOpenChange = vi.fn()

    const screen = render(() => (
      <>
        <button type="button" data-testid="outside">
          Outside target
        </button>
        <Dialog onOpenChange={onOpenChange} defaultOpen title="Dialog title" body="Dialog body">
          <button type="button">Trigger</button>
        </Dialog>
      </>
    ))

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement
    window.getSelection()?.selectAllChildren(content)

    expect(window.getSelection()?.toString()).toContain('Dialog title')

    await new Promise((resolve) => setTimeout(resolve, 0))
    await fireEvent.pointerDown(screen.getByTestId('outside'))

    await finishExitMotion()

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
      expect(window.getSelection()?.toString()).toBe('')
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

    await finishExitMotion()

    await waitFor(() => {
      expect(onClosePrevent).not.toHaveBeenCalled()
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    })
  })

  test('applies styles override to content', () => {
    render(() => (
      <Dialog open body="Body" styles={{ content: { width: '200px' } }}>
        <button type="button">Trigger</button>
      </Dialog>
    ))

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement | null
    expect(content?.style.width).toBe('200px')
  })

  test('escape only closes the topmost overlay when modals are nested', async () => {
    const onOuterChange = vi.fn()
    const onInnerChange = vi.fn()

    render(() => (
      <>
        <TestModal
          defaultOpen
          overlay
          onOpenChange={onOuterChange}
          trigger={<button type="button">Outer trigger</button>}
          content={<div data-testid="outer-body">Outer body</div>}
        />
        <TestModal
          defaultOpen
          overlay
          onOpenChange={onInnerChange}
          trigger={<button type="button">Inner trigger</button>}
          content={<div data-testid="inner-body">Inner body</div>}
        />
      </>
    ))

    const contents = document.body.querySelectorAll('[data-slot="content"]')
    expect(contents.length).toBe(2)

    const innerContent = contents[contents.length - 1] as HTMLElement
    innerContent.focus()
    await fireEvent.keyDown(innerContent, { key: 'Escape' })

    await finishExitMotion()

    await waitFor(() => {
      expect(onInnerChange).toHaveBeenCalledWith(false)
      expect(onOuterChange).not.toHaveBeenCalled()
      expect(document.body.querySelectorAll('[data-slot="content"]').length).toBe(1)
    })
  })

  test('outer modal ignores pointerdown that lands inside a nested modal', async () => {
    const onOuterChange = vi.fn()
    const onInnerChange = vi.fn()

    render(() => (
      <>
        <TestModal
          defaultOpen
          overlay
          onOpenChange={onOuterChange}
          trigger={<button type="button">Outer trigger</button>}
          content={<div data-testid="outer-body">Outer body</div>}
        />
        <TestModal
          defaultOpen
          overlay
          onOpenChange={onInnerChange}
          trigger={<button type="button">Inner trigger</button>}
          content={
            <button type="button" data-testid="inner-button">
              Inner button
            </button>
          }
        />
      </>
    ))

    await new Promise((resolve) => setTimeout(resolve, 0))

    const innerButton = document.body.querySelector('[data-testid="inner-button"]')!
    await fireEvent.pointerDown(innerButton)

    expect(onOuterChange).not.toHaveBeenCalled()
    expect(onInnerChange).not.toHaveBeenCalled()
    expect(document.body.querySelectorAll('[data-slot="content"]').length).toBe(2)
  })
})
