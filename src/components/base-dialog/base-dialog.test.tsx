import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import type { JSX } from '@solidjs/web'
import { Show, createSignal, flush, onCleanup } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { MoraineProvider } from '../../provider'
import { callHandler } from '../../shared/utils'
import { finishExitMotion } from '../../test-util/overlay-test'
import { defineTheme } from '../../theme'
import { Button } from '../button'
import { Dialog } from '../dialog/dialog'
import { pushOverlayLayer } from '../shared/overlay/overlay-stack'
import { Sheet } from '../sheet/sheet'

import { BaseDialog } from './base-dialog'
describe('BaseDialog primitives', () => {
  test('passes each mounted content element to the ref once and dismisses reopened content', async () => {
    const ref = vi.fn()
    const [open, setOpen] = createSignal(true)
    const onOpenChange = vi.fn(setOpen)
    render(() => (
      <BaseDialog open={open()} onOpenChange={onOpenChange}>
        <BaseDialog.Portal>
          <BaseDialog.Content ref={ref} aria-label="Bound content">
            <button type="button">Inside</button>
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    const findContent = () =>
      vi.waitFor(() => {
        const content = document.body.querySelector<HTMLElement>(
          '[data-slot="base-dialog-content"]',
        )
        expect(content).not.toBeNull()
        return content!
      })
    const first = await findContent()
    expect(ref.mock.calls).toEqual([[first]])

    flush(() => setOpen(false))
    await finishExitMotion()
    expect(document.body.querySelector('[data-slot="base-dialog-content"]')).toBeNull()

    flush(() => setOpen(true))
    const second = await findContent()
    expect(second).not.toBe(first)
    expect(ref.mock.calls).toEqual([[first], [second]])

    fireEvent.keyDown(second, { key: 'Escape' })
    await finishExitMotion()
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(document.body.querySelector('[data-slot="base-dialog-content"]')).toBeNull()
  })
  test('honors a custom trigger that cancels click before forwarding it', async () => {
    const onOpenChange = vi.fn()
    const onCustomClick = vi.fn()
    const CancelingButton = (props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button
        {...props}
        onClick={(event) => {
          onCustomClick()
          event.preventDefault()
          callHandler(event, props.onClick)
        }}
      />
    )
    const screen = render(() => (
      <BaseDialog onOpenChange={onOpenChange}>
        <BaseDialog.Trigger as={CancelingButton}>Open</BaseDialog.Trigger>
        <BaseDialog.Portal>
          <BaseDialog.Content>Content</BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    fireEvent.click(screen.getByText('Open'))
    await Promise.resolve()
    expect(onCustomClick).toHaveBeenCalledTimes(1)
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  test('isolates a modal in a ShadowRoot without hiding its host', async () => {
    const outside = document.createElement('main')
    const host = document.createElement('div')
    const shadowRoot = host.attachShadow({ mode: 'open' })
    document.body.append(outside, host)
    const screen = render(() => (
      <BaseDialog defaultOpen mount={shadowRoot}>
        <BaseDialog.Portal>
          <BaseDialog.Content aria-label="Shadow modal">Content</BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    await waitFor(() => expect(outside.getAttribute('aria-hidden')).toBe('true'))
    expect(host.hasAttribute('aria-hidden')).toBe(false)
    expect(shadowRoot.querySelector('[aria-modal="true"]')).not.toBeNull()
    screen.unmount()
    expect(outside.hasAttribute('aria-hidden')).toBe(false)
    outside.remove()
    host.remove()
  })

  test('restores outer isolation after a nested shadow modal closes', async () => {
    const outside = document.createElement('main')
    const host = document.createElement('div')
    const shadowRoot = host.attachShadow({ mode: 'open' })
    document.body.append(outside, host)
    const [innerOpen, setInnerOpen] = createSignal(true)
    const screen = render(() => (
      <BaseDialog defaultOpen mount={shadowRoot}>
        <BaseDialog.Portal>
          <BaseDialog.Content aria-label="Outer">
            <BaseDialog open={innerOpen()} mount={shadowRoot}>
              <BaseDialog.Portal>
                <BaseDialog.Content aria-label="Inner">Inner</BaseDialog.Content>
              </BaseDialog.Portal>
            </BaseDialog>
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))
    try {
      await waitFor(() =>
        expect(shadowRoot.querySelectorAll('[aria-modal="true"]')).toHaveLength(2),
      )
      expect(host.hasAttribute('aria-hidden')).toBe(false)
      expect(outside.getAttribute('aria-hidden')).toBe('true')
      const innerContent = shadowRoot.querySelectorAll<HTMLElement>(
        '[data-slot="base-dialog-content"]',
      )[1]!
      flush(() => setInnerOpen(false))
      await finishExitMotion(innerContent)
      await waitFor(() =>
        expect(shadowRoot.querySelectorAll('[aria-modal="true"]')).toHaveLength(1),
      )
      expect(host.hasAttribute('aria-hidden')).toBe(false)
      expect(outside.getAttribute('aria-hidden')).toBe('true')
    } finally {
      screen.unmount()
      expect(outside.hasAttribute('aria-hidden')).toBe(false)
      outside.remove()
      host.remove()
    }
  })

  test('opens from a native trigger in a foreign Document', async () => {
    const iframe = document.createElement('iframe')
    document.body.append(iframe)
    const ownerDocument = iframe.contentDocument!
    const host = ownerDocument.createElement('div')
    ownerDocument.body.append(host)
    const screen = render(
      () => (
        <BaseDialog>
          <BaseDialog.Trigger>Foreign modal trigger</BaseDialog.Trigger>
          <BaseDialog.Portal>
            <BaseDialog.Content aria-label="Foreign modal">Content</BaseDialog.Content>
          </BaseDialog.Portal>
        </BaseDialog>
      ),
      { container: host },
    )
    try {
      const trigger = host.querySelector<HTMLButtonElement>('[data-slot="base-dialog-trigger"]')!
      expect(trigger.disabled).toBe(false)
      expect(trigger.tabIndex).toBe(0)
      fireEvent.click(trigger)
      await waitFor(() =>
        expect(
          ownerDocument.body.querySelector('[data-slot="base-dialog-content"]'),
        ).not.toBeNull(),
      )
      expect(document.body.querySelector('[data-slot="base-dialog-content"]')).toBeNull()
    } finally {
      screen.unmount()
      iframe.remove()
    }
  })

  test.each([
    [true, true, 'true', 'true', 'hidden'],
    [true, false, 'true', 'true', ''],
    [false, true, null, null, 'hidden'],
    [false, false, null, null, ''],
  ] as const)(
    'keeps modal %s and preventScroll %s independent',
    async (modal, preventScroll, ariaModal, ariaHidden, overflow) => {
      const outside = document.createElement('main')
      document.body.append(outside)
      const screen = render(() => (
        <BaseDialog defaultOpen modal={modal} preventScroll={preventScroll}>
          <BaseDialog.Portal>
            <BaseDialog.Content aria-label="Matrix">Content</BaseDialog.Content>
          </BaseDialog.Portal>
        </BaseDialog>
      ))
      await Promise.resolve()
      await Promise.resolve()
      const content = document.body.querySelector('[data-slot="base-dialog-content"]')
      expect(content?.getAttribute('aria-modal')).toBe(ariaModal)
      expect(outside.getAttribute('aria-hidden')).toBe(ariaHidden)
      expect(document.body.style.overflow).toBe(overflow)
      screen.unmount()
      outside.remove()
    },
  )

  test('defaults preventScroll to the value of modal', async () => {
    const nonModal = render(() => (
      <BaseDialog defaultOpen modal={false}>
        <BaseDialog.Portal>
          <BaseDialog.Content aria-label="Non-modal">Content</BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))
    await Promise.resolve()
    await Promise.resolve()
    expect(document.body.style.overflow).toBe('')
    nonModal.unmount()

    const locking = render(() => (
      <BaseDialog defaultOpen modal={false} preventScroll>
        <BaseDialog.Portal>
          <BaseDialog.Content aria-label="Non-modal locking">Content</BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))
    await Promise.resolve()
    await Promise.resolve()
    expect(document.body.style.overflow).toBe('hidden')
    locking.unmount()
  })
  test.each([
    [
      'dialog',
      () => (
        <Dialog defaultOpen>
          <Dialog.Content>
            <BaseDialog defaultOpen modal={false}>
              <BaseDialog.Portal>
                <BaseDialog.Content>Nested modal</BaseDialog.Content>
              </BaseDialog.Portal>
            </BaseDialog>
          </Dialog.Content>
        </Dialog>
      ),
    ],
    [
      'sheet',
      () => (
        <Sheet defaultOpen>
          <Sheet.Content>
            <BaseDialog defaultOpen modal={false}>
              <BaseDialog.Portal>
                <BaseDialog.Content>Nested modal</BaseDialog.Content>
              </BaseDialog.Portal>
            </BaseDialog>
          </Sheet.Content>
        </Sheet>
      ),
    ],
  ] as const)('keeps an independent BaseDialog owner inside %s', (owner, component) => {
    render(component)
    expect(document.body.querySelectorAll(`[data-slot="${owner}-content"]`)).toHaveLength(1)
    expect(document.body.querySelectorAll('[data-slot="base-dialog-content"]')).toHaveLength(1)
  })

  test.each(['Trigger', 'Close'] as const)(
    'renders %s children across polymorphic root replacement',
    (part) => {
      const Part = BaseDialog[part]
      const [tag, setTag] = createSignal<'button' | 'div'>('button')
      const [value, setValue] = createSignal('Before')
      const Child = () => <span data-testid="part-child">{value()}</span>
      const screen = render(() => (
        <BaseDialog>
          <Part as={tag()}>
            <Child />
          </Part>
        </BaseDialog>
      ))
      expect(screen.getByTestId('part-child').parentElement?.tagName).toBe('BUTTON')
      expect(screen.getByTestId('part-child').textContent).toBe('Before')
      flush(() => setTag('div'))
      flush(() => setValue('After'))
      expect(screen.getByTestId('part-child').parentElement?.tagName).toBe('DIV')
      expect(screen.getByTestId('part-child').textContent).toBe('After')
    },
  )

  test('updates scroll prevention while present', async () => {
    const [open, setOpen] = createSignal(true)
    const [preventScroll, setPreventScroll] = createSignal(true)
    const screen = render(() => (
      <BaseDialog open={open()} preventScroll={preventScroll()}>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            <button type="button" data-testid="sample-first">
              First
            </button>
            <button type="button" data-testid="sample-second">
              Second
            </button>
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))
    try {
      await waitFor(() => expect(document.body.style.overflow).toBe('hidden'))
      const second = document.body.querySelector<HTMLButtonElement>(
        '[data-testid="sample-second"]',
      )!
      await waitFor(() =>
        expect(document.activeElement).toBe(
          document.body.querySelector<HTMLButtonElement>('[data-testid="sample-first"]')!,
        ),
      )
      second.focus()
      flush(() => setPreventScroll(false))
      await Promise.resolve()
      expect(document.body.style.overflow).toBe('')
      expect(document.activeElement).toBe(second)
      flush(() => setOpen(false))
      await finishExitMotion()
      await waitFor(() => expect(document.body.style.overflow).toBe(''))
      flush(() => setOpen(true))
      await Promise.resolve()
      expect(document.body.style.overflow).toBe('')
    } finally {
      screen.unmount()
    }
  })

  test('does not render closed content until the modal opens', () => {
    const screen = render(() => (
      <BaseDialog>
        <BaseDialog.Trigger>Open lazy content</BaseDialog.Trigger>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            <span>Lazy content</span>
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))
    expect(document.body.textContent).not.toContain('Lazy content')
    fireEvent.click(screen.getByRole('button', { name: 'Open lazy content' }))
    expect(document.body.querySelector('[role="dialog"]')?.textContent).toBe('Lazy content')
  })

  test('updates conditional content after opening', () => {
    const [visible, setVisible] = createSignal(true)
    render(() => (
      <BaseDialog defaultOpen>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            <Show when={visible()}>
              <span>Visible content</span>
            </Show>
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    expect(document.body.textContent).toContain('Visible content')
    flush(() => setVisible(false))
    expect(document.body.textContent).not.toContain('Visible content')
  })

  test('closes from a content render prop', () => {
    const onOpenChange = vi.fn()
    render(() => (
      <BaseDialog defaultOpen onOpenChange={onOpenChange}>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            {(state) => (
              <button type="button" onClick={() => state.close()}>
                Dismiss
              </button>
            )}
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    const dismiss = document.body.querySelector('button')!
    expect(dismiss.textContent).toBe('Dismiss')
    fireEvent.click(dismiss)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  test('releases closed content and creates a fresh instance when reopened', async () => {
    const [open, setOpen] = createSignal(false)
    let mounts = 0
    let cleanups = 0
    const Content = () => {
      mounts += 1
      onCleanup(() => {
        cleanups += 1
      })
      return <span>Lifecycle content</span>
    }

    const screen = render(() => (
      <BaseDialog open={open()}>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            <Content />
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    expect(mounts).toBe(0)
    flush(() => setOpen(true))
    await waitFor(() => {
      expect(mounts).toBe(1)
    })

    flush(() => setOpen(false))
    await finishExitMotion()
    await waitFor(() => {
      expect(cleanups).toBe(1)
      expect(document.body.querySelector('[data-slot="base-dialog-content"]')).toBeNull()
    })

    flush(() => setOpen(true))
    await waitFor(() => {
      expect(mounts).toBe(2)
    })
    screen.unmount()
  })

  test('replaces modal Design without replacing the focused surface', () => {
    const [design, setDesign] = createSignal(
      defineTheme({
        baseDialog: { base: { content: 'first-surface', overlay: 'first-overlay' } },
      }),
    )
    render(() => (
      <MoraineProvider theme={design()}>
        <BaseDialog defaultOpen>
          <BaseDialog.Portal>
            <BaseDialog.Overlay />
            <BaseDialog.Content>Content</BaseDialog.Content>
          </BaseDialog.Portal>
        </BaseDialog>
      </MoraineProvider>
    ))
    const surface = document.querySelector<HTMLElement>('[data-slot="base-dialog-content"]')!
    surface.focus()
    setDesign(
      defineTheme({
        baseDialog: { base: { content: 'second-surface', overlay: 'second-overlay' } },
      }),
    )
    expect(document.querySelector('[data-slot="base-dialog-content"]')).toBe(surface)
    expect(document.activeElement).toBe(surface)
    expect(surface.className).toContain('second-surface')
    expect(surface.className).not.toContain('first-surface')
    expect(document.querySelector('[data-slot="base-dialog-overlay"]')?.className).toContain(
      'second-overlay',
    )
    expect(document.querySelector('[data-slot="base-dialog-overlay"]')?.className).not.toContain(
      'first-overlay',
    )
  })

  test('Close honors cancellation and keyboard activation', () => {
    const onOpenChange = vi.fn()
    const [canceled, setCanceled] = createSignal(true)
    render(() => (
      <BaseDialog defaultOpen onOpenChange={onOpenChange}>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            <BaseDialog.Close as="span" onClick={(event) => canceled() && event.preventDefault()}>
              Close modal
            </BaseDialog.Close>
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))
    const close = document.body.querySelector<HTMLElement>('[data-slot="base-dialog-close"]')!
    expect(close.getAttribute('role')).toBe('button')
    fireEvent.click(close)
    expect(onOpenChange).not.toHaveBeenCalled()
    flush(() => setCanceled(false))
    fireEvent.keyDown(close, { key: 'Enter' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  test('forwards trigger props and honors canceled clicks', async () => {
    const onOpenChange = vi.fn()
    const onClick = vi.fn((event: MouseEvent) => event.preventDefault())
    let triggerElement: HTMLElement | undefined
    const screen = render(() => (
      <BaseDialog onOpenChange={onOpenChange}>
        <BaseDialog.Trigger
          class="flat-trigger"
          style={{ color: 'red' }}
          ref={(element) => (triggerElement = element)}
          onClick={onClick}
        >
          Open modal
        </BaseDialog.Trigger>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            <span>Content</span>
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))
    const trigger = screen.getByRole('button', { name: 'Open modal' })

    expect(trigger).toBe(triggerElement)
    expect(trigger.classList.contains('flat-trigger')).toBe(true)
    expect(trigger.style.color).toBe('red')
    expect(trigger.getAttribute('data-slot')).toBe('base-dialog-trigger')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(trigger)

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(document.body.querySelector('[data-slot="base-dialog-content"]')).toBeNull()
    screen.unmount()
  })

  test('renders a native button trigger with BaseDialog accessibility state', async () => {
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <BaseDialog onOpenChange={onOpenChange}>
        <BaseDialog.Trigger data-testid="trigger">Open modal</BaseDialog.Trigger>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            <span>Content</span>
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))
    const trigger = screen.getByTestId<HTMLButtonElement>('trigger')

    expect(trigger.tagName).toBe('BUTTON')
    expect(trigger.type).toBe('button')
    expect(trigger.getAttribute('data-slot')).toBe('base-dialog-trigger')
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.getAttribute('data-closed')).toBe('')
    expect(trigger.hasAttribute('data-expanded')).toBe(false)
    expect(trigger.hasAttribute('aria-controls')).toBe(false)

    fireEvent.click(trigger)

    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trigger.getAttribute('data-expanded')).toBe('')
    expect(trigger.hasAttribute('data-closed')).toBe(false)
    expect(document.getElementById(trigger.getAttribute('aria-controls')!)).not.toBeNull()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.getAttribute('data-closed')).toBe('')
    expect(trigger.hasAttribute('data-expanded')).toBe(false)
    expect(document.getElementById(trigger.getAttribute('aria-controls')!)).not.toBeNull()
    await finishExitMotion()
    expect(trigger.hasAttribute('aria-controls')).toBe(false)
    screen.unmount()
  })

  test('applies direct trigger class and style', () => {
    const screen = render(() => (
      <BaseDialog>
        <BaseDialog.Trigger
          data-testid="direct-trigger"
          class="modal-instance-class"
          style={{ color: 'green', border: '1px solid green' }}
        >
          Open modal
        </BaseDialog.Trigger>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            <span>Content</span>
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    const trigger = screen.getByTestId('direct-trigger')
    expect(trigger.className).toContain('modal-instance-class')
    expect(trigger.style.color).toBe('green')
    expect(trigger.style.border).toBe('1px solid green')
    screen.unmount()
  })

  test('composed overlays use their own Design without inheriting BaseDialog presentation', () => {
    const screen = render(() => (
      <MoraineProvider
        theme={defineTheme({
          baseDialog: { base: { content: 'modal-provider-class' } },
          dialog: { base: { content: 'dialog-design-surface' } },
          sheet: { base: { content: 'sheet-design-surface' } },
        })}
      >
        <Dialog open>
          <Dialog.Trigger as="button" type="button">
            Dialog trigger
          </Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Body>Dialog body</Dialog.Body>
          </Dialog.Content>
        </Dialog>
        <Sheet open>
          <Sheet.Trigger as="button" type="button">
            Sheet trigger
          </Sheet.Trigger>
          <Sheet.Content>
            <Sheet.Body>Sheet body</Sheet.Body>
          </Sheet.Content>
        </Sheet>
      </MoraineProvider>
    ))

    const triggers = screen.container.querySelectorAll(
      '[data-slot="dialog-trigger"], [data-slot="sheet-trigger"]',
    )
    expect(triggers).toHaveLength(2)
    expect(triggers[0]?.className).not.toContain('modal-provider')
    expect(triggers[1]?.className).not.toContain('modal-provider')

    const contents = document.body.querySelectorAll(
      '[data-slot="dialog-content"], [data-slot="sheet-content"]',
    )
    expect(contents).toHaveLength(2)
    expect((contents[0] as HTMLElement).className).not.toContain('modal-provider-class')
    expect((contents[0] as HTMLElement).className).not.toContain('modal-provider-trigger')
    expect((contents[0] as HTMLElement).className).toContain('dialog-design-surface')
    expect((contents[1] as HTMLElement).className).not.toContain('modal-provider-class')
    expect((contents[1] as HTMLElement).className).not.toContain('modal-provider-trigger')
    expect((contents[1] as HTMLElement).className).toContain('sheet-design-surface')
    screen.unmount()
  })

  test('respects disabled and canceled trigger activation', async () => {
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <>
        <BaseDialog onOpenChange={onOpenChange}>
          <BaseDialog.Trigger disabled data-testid="disabled-trigger">
            Disabled
          </BaseDialog.Trigger>
          <BaseDialog.Portal>
            <BaseDialog.Content>
              <span>Disabled content</span>
            </BaseDialog.Content>
          </BaseDialog.Portal>
        </BaseDialog>
        <BaseDialog onOpenChange={onOpenChange}>
          <BaseDialog.Trigger
            onClick={(event) => event.preventDefault()}
            data-testid="canceled-trigger"
          >
            Canceled
          </BaseDialog.Trigger>
          <BaseDialog.Portal>
            <BaseDialog.Content>
              <span>Canceled content</span>
            </BaseDialog.Content>
          </BaseDialog.Portal>
        </BaseDialog>
      </>
    ))

    fireEvent.click(screen.getByTestId('disabled-trigger'))
    fireEvent.click(screen.getByTestId('canceled-trigger'))

    expect(onOpenChange).not.toHaveBeenCalled()
    expect(document.body.querySelector('[data-slot="base-dialog-content"]')).toBeNull()
    screen.unmount()
  })

  test('supports non-native and Button trigger roots', async () => {
    let triggerElement: HTMLElement | undefined
    const screen = render(() => (
      <>
        <BaseDialog>
          <BaseDialog.Trigger
            as="div"
            ref={(element) => (triggerElement = element)}
            data-testid="div-trigger"
          >
            Open with keyboard
          </BaseDialog.Trigger>
          <BaseDialog.Portal>
            <BaseDialog.Content>
              <span>Div content</span>
            </BaseDialog.Content>
          </BaseDialog.Portal>
        </BaseDialog>
        <BaseDialog>
          <BaseDialog.Trigger as={Button} variant="outline" data-testid="button-trigger">
            Open with Button
          </BaseDialog.Trigger>
          <BaseDialog.Portal>
            <BaseDialog.Content>
              <span>Button content</span>
            </BaseDialog.Content>
          </BaseDialog.Portal>
        </BaseDialog>
      </>
    ))
    const divTrigger = screen.getByTestId('div-trigger')
    const buttonTrigger = screen.getByTestId('button-trigger')

    expect(divTrigger.getAttribute('role')).toBe('button')
    expect(divTrigger.getAttribute('tabindex')).toBe('0')
    expect(divTrigger.getAttribute('aria-haspopup')).toBe('dialog')
    expect(triggerElement).toBe(divTrigger)
    expect(buttonTrigger.tagName).toBe('BUTTON')

    const keyEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    divTrigger.dispatchEvent(keyEvent)
    expect(keyEvent.defaultPrevented).toBe(true)

    expect(document.body.textContent).toContain('Div content')
    screen.unmount()
  })

  test('forwards an explicit accessible name to modal content', () => {
    render(() => (
      <BaseDialog defaultOpen>
        <BaseDialog.Portal>
          <BaseDialog.Content aria-label="Named modal">
            <span>Content</span>
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    expect(document.body.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe(
      'Named modal',
    )
  })

  test('focuses the first input when a modal opens', async () => {
    const screen = render(() => (
      <BaseDialog defaultOpen>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            <input aria-label="Search" data-testid="search" />
            <button type="button">Other</button>
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    await waitFor(() =>
      expect(document.activeElement).toBe(
        document.body.querySelector<HTMLInputElement>('[data-testid="search"]'),
      ),
    )
    screen.unmount()
  })

  test('focuses the dialog surface when opened by touch', async () => {
    const screen = render(() => (
      <BaseDialog>
        <BaseDialog.Trigger>Open</BaseDialog.Trigger>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            <input aria-label="Search" data-testid="search" />
            <button type="button">Other</button>
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    const trigger = screen.getByRole('button', { name: 'Open' })
    fireEvent.pointerDown(trigger, { pointerType: 'touch' })
    fireEvent.click(trigger)

    await waitFor(() =>
      expect(document.activeElement).toBe(document.body.querySelector('[role="dialog"]')),
    )
    expect(document.activeElement).not.toBe(document.body.querySelector('[data-testid="search"]'))
    screen.unmount()
  })

  test('focuses the initialFocus target when a modal opens', async () => {
    let input!: HTMLInputElement
    const screen = render(() => (
      <BaseDialog defaultOpen initialFocus={() => input}>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            <button type="button">First</button>
            <input aria-label="Search" data-testid="search" ref={(element) => (input = element)} />
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    await waitFor(() => expect(document.activeElement).toBe(input))
    screen.unmount()
  })

  test('skips the open-time focus move when initialFocus is false', async () => {
    const screen = render(() => (
      <BaseDialog defaultOpen initialFocus={false}>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            <button type="button">First</button>
            <input aria-label="Search" data-testid="search" />
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="base-dialog-content"]')).toBeTruthy(),
    )
    await Promise.resolve()
    await Promise.resolve()

    expect(document.activeElement).toBe(document.body)
    screen.unmount()
  })

  test('prefers a data-autofocus element over the first focusable', async () => {
    const screen = render(() => (
      <BaseDialog defaultOpen>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            <button type="button">First</button>
            <input aria-label="Search" data-autofocus data-testid="search" />
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    await waitFor(() =>
      expect(document.activeElement).toBe(
        document.body.querySelector<HTMLInputElement>('[data-testid="search"]'),
      ),
    )
    screen.unmount()
  })

  test('focuses the finalFocus target instead of the trigger after close', async () => {
    const target = document.createElement('button')
    document.body.append(target)
    const screen = render(() => (
      <BaseDialog finalFocus={() => target}>
        <BaseDialog.Trigger>Open</BaseDialog.Trigger>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            {(context) => (
              <button type="button" data-testid="close" onClick={context.close}>
                Close
              </button>
            )}
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    const trigger = screen.getByRole('button', { name: 'Open' })
    fireEvent.click(trigger)
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="base-dialog-content"]')).toBeTruthy(),
    )

    fireEvent.click(document.body.querySelector('[data-testid="close"]')!)
    await Promise.resolve()
    const content = document.body.querySelector('[data-slot="base-dialog-content"]')!
    fireEvent.animationEnd(content)
    fireEvent.transitionEnd(content)

    await waitFor(() => expect(document.activeElement).toBe(target))
    screen.unmount()
    target.remove()
  })

  test('skips the close-time focus restore when finalFocus is false', async () => {
    const screen = render(() => (
      <BaseDialog finalFocus={false}>
        <BaseDialog.Trigger>Open</BaseDialog.Trigger>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            {(context) => (
              <button type="button" data-testid="close" onClick={context.close}>
                Close
              </button>
            )}
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    const trigger = screen.getByRole('button', { name: 'Open' })
    fireEvent.click(trigger)
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="base-dialog-content"]')).toBeTruthy(),
    )

    fireEvent.click(document.body.querySelector('[data-testid="close"]')!)
    await Promise.resolve()
    const content = document.body.querySelector('[data-slot="base-dialog-content"]')!
    fireEvent.animationEnd(content)
    fireEvent.transitionEnd(content)
    await Promise.resolve()
    await Promise.resolve()

    expect(document.activeElement).not.toBe(trigger)
    screen.unmount()
  })

  test('lets content override role', async () => {
    const screen = render(() => (
      <BaseDialog defaultOpen>
        <BaseDialog.Portal>
          <BaseDialog.Content role="alertdialog" aria-label="Confirm delete">
            Confirm this action
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    await waitFor(() =>
      expect(document.body.querySelector('[role="alertdialog"]')?.getAttribute('aria-label')).toBe(
        'Confirm delete',
      ),
    )
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
    screen.unmount()
  })

  test('does not acquire modal resources when an open root has no surfaces', async () => {
    document.body.style.overflow = 'auto'
    const onOpenChange = vi.fn()
    const screen = render(() => <BaseDialog defaultOpen onOpenChange={onOpenChange} />)
    await Promise.resolve()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
    expect(document.body.style.overflow).toBe('auto')
    expect(onOpenChange).not.toHaveBeenCalled()
    screen.unmount()
    document.body.style.overflow = ''
  })

  test('lets overlay activate the modal runtime', async () => {
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <BaseDialog defaultOpen onOpenChange={onOpenChange}>
        <BaseDialog.Portal>
          <BaseDialog.Overlay />
          <BaseDialog.Content>
            <span>Content</span>
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))
    await Promise.resolve()

    expect(document.body.querySelector('[data-slot="base-dialog-overlay"]')).not.toBeNull()
    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    screen.unmount()
  })

  test('applies a custom content class alongside the modal content anatomy', () => {
    render(() => (
      <BaseDialog defaultOpen>
        <BaseDialog.Portal>
          <BaseDialog.Content class="custom-content">
            <span>Content</span>
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    const content = document.body.querySelector('[data-slot="base-dialog-content"]')
    expect(content?.classList.contains('custom-content')).toBe(true)
    expect(content?.getAttribute('role')).toBe('dialog')
  })

  test('shares data attributes and waits for both surfaces before exiting', async () => {
    const [open, setOpen] = createSignal(true)
    const onExitComplete = vi.fn()
    const screen = render(() => (
      <BaseDialog open={open()} onOpenChange={setOpen} onExitComplete={onExitComplete}>
        <BaseDialog.Portal>
          <BaseDialog.Overlay />
          <BaseDialog.Content>
            <span>Content</span>
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    const overlay = document.body.querySelector('[data-slot="base-dialog-overlay"]') as HTMLElement
    const content = document.body.querySelector('[data-slot="base-dialog-content"]') as HTMLElement
    expect(overlay.getAttribute('data-expanded')).toBe('')
    expect(content.getAttribute('data-expanded')).toBe('')

    flush(() => setOpen(false))
    expect(overlay.getAttribute('data-closed')).toBe('')
    expect(content.getAttribute('data-closed')).toBe('')

    await Promise.resolve()
    fireEvent.animationEnd(content)
    expect(document.body.querySelector('[data-slot="base-dialog-content"]')).not.toBeNull()
    expect(onExitComplete).not.toHaveBeenCalled()

    fireEvent.animationEnd(overlay)
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="base-dialog-content"]')).toBeNull()
      expect(document.body.querySelector('[data-slot="base-dialog-overlay"]')).toBeNull()
      expect(onExitComplete).toHaveBeenCalledOnce()
    })
    screen.unmount()
  })

  test('does not call onExitComplete when Content is removed while open', async () => {
    const [showContent, setShowContent] = createSignal(true)
    const onExitComplete = vi.fn()
    const screen = render(() => (
      <BaseDialog open onExitComplete={onExitComplete}>
        <BaseDialog.Portal>
          <Show when={showContent()}>
            <BaseDialog.Content>
              <span>Content</span>
            </BaseDialog.Content>
          </Show>
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    flush(() => setShowContent(false))
    await Promise.resolve()

    expect(onExitComplete).not.toHaveBeenCalled()
    screen.unmount()
  })

  test('unmounts content and overlay without waiting for an animation when transition is false', async () => {
    const [open, setOpen] = createSignal(true)
    const screen = render(() => (
      <BaseDialog open={open()} transition={false}>
        <BaseDialog.Portal>
          <BaseDialog.Overlay />
          <BaseDialog.Content>
            <span>Content</span>
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    expect(
      document.body
        .querySelector('[data-slot="base-dialog-content"]')
        ?.hasAttribute('data-transition'),
    ).toBe(false)
    expect(
      document.body
        .querySelector('[data-slot="base-dialog-overlay"]')
        ?.hasAttribute('data-transition'),
    ).toBe(false)

    flush(() => setOpen(false))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="base-dialog-content"]')).toBeNull()
      expect(document.body.querySelector('[data-slot="base-dialog-overlay"]')).toBeNull()
    })
    screen.unmount()
  })

  test('keeps content mounted through the exit animation when transition is enabled', async () => {
    const [open, setOpen] = createSignal(true)
    const screen = render(() => (
      <BaseDialog open={open()}>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            <span>Content</span>
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))
    const content = document.body.querySelector('[data-slot="base-dialog-content"]')!
    expect(content.hasAttribute('data-transition')).toBe(true)

    flush(() => setOpen(false))
    await Promise.resolve()
    expect(document.body.querySelector('[data-slot="base-dialog-content"]')).toBe(content)

    await finishExitMotion()
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="base-dialog-content"]')).toBeNull()
    })
    screen.unmount()
  })

  test('renders BaseDialog.Content without children', () => {
    const screen = render(() => (
      <BaseDialog defaultOpen>
        <BaseDialog.Portal>
          <BaseDialog.Content aria-label="Empty modal" />
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    expect(document.body.querySelector('[data-slot="base-dialog-content"]')?.textContent).toBe('')
    screen.unmount()
  })

  test('does not render an overlay by default', () => {
    render(() => (
      <BaseDialog defaultOpen>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            <span>Content</span>
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    expect(document.body.querySelector('[data-slot="base-dialog-overlay"]')).toBeNull()
    expect(document.body.querySelector('[data-slot="base-dialog-content"]')).not.toBeNull()
  })

  test('renders overlay and content and forwards refs', () => {
    const overlayRef = vi.fn()
    const contentRef = vi.fn()

    const screen = render(() => (
      <BaseDialog defaultOpen>
        <BaseDialog.Portal>
          <BaseDialog.Overlay ref={overlayRef} class="custom-overlay" style={{ opacity: '0.4' }} />
          <BaseDialog.Content ref={contentRef}>
            <span>Content</span>
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    const overlay = document.body.querySelector('[data-slot="base-dialog-overlay"]')
    const content = document.body.querySelector('[data-slot="base-dialog-content"]')

    expect(overlay).not.toBeNull()
    expect(content).not.toBeNull()
    expect(overlay?.parentElement).toBe(content?.parentElement)
    expect(overlay?.classList.contains('custom-overlay')).toBe(true)
    expect((overlay as HTMLElement).style.opacity).toBe('0.4')
    expect(overlayRef).toHaveBeenCalledWith(overlay)
    expect(contentRef).toHaveBeenCalledWith(content)

    screen.unmount()
    expect(overlayRef).toHaveBeenCalledTimes(1)
    expect(contentRef).toHaveBeenCalledTimes(1)
  })

  test('mounts both parts in a custom portal target', () => {
    const mount = document.createElement('div')
    document.body.append(mount)
    const screen = render(() => (
      <BaseDialog defaultOpen>
        <BaseDialog.Portal mount={mount}>
          <BaseDialog.Overlay />
          <BaseDialog.Content>Content</BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    expect(mount.querySelector('[data-slot="base-dialog-overlay"]')).not.toBeNull()
    expect(mount.querySelector('[data-slot="base-dialog-content"]')).not.toBeNull()
    screen.unmount()
    mount.remove()
  })

  test('prefers the Portal mount over the root portal destination', () => {
    const rootMount = document.createElement('div')
    const mount = document.createElement('div')
    document.body.append(rootMount, mount)
    const screen = render(() => (
      <BaseDialog defaultOpen mount={rootMount}>
        <BaseDialog.Portal mount={mount}>
          <BaseDialog.Content>Content</BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    expect(rootMount.querySelector('[data-slot="base-dialog-content"]')).toBeNull()
    expect(mount.querySelector('[data-slot="base-dialog-content"]')).not.toBeNull()
    screen.unmount()
    rootMount.remove()
    mount.remove()
  })

  test('uses the trigger document body when no portal destination is specified', () => {
    const otherDocument = document.implementation.createHTMLDocument('trigger owner')
    const host = otherDocument.createElement('div')
    otherDocument.body.append(host)
    const screen = render(
      () => (
        <BaseDialog defaultOpen>
          <BaseDialog.Trigger>Open</BaseDialog.Trigger>
          <BaseDialog.Portal>
            <BaseDialog.Content>Content</BaseDialog.Content>
          </BaseDialog.Portal>
        </BaseDialog>
      ),
      { container: host },
    )

    expect(otherDocument.body.querySelector('[data-slot="base-dialog-content"]')).not.toBeNull()
    expect(document.body.querySelector('[data-slot="base-dialog-content"]')).toBeNull()
    screen.unmount()
  })

  test('leaves inline parts mounted without Portal', async () => {
    const [open, setOpen] = createSignal(true)
    const onExitComplete = vi.fn()
    const screen = render(() => (
      <BaseDialog open={open()} modal={false} onExitComplete={onExitComplete}>
        <div data-testid="inline-host">
          <BaseDialog.Overlay />
          <BaseDialog.Content>Inline content</BaseDialog.Content>
        </div>
      </BaseDialog>
    ))
    const host = screen.getByTestId('inline-host')
    const overlay = host.querySelector('[data-slot="base-dialog-overlay"]')
    const content = host.querySelector('[data-slot="base-dialog-content"]')

    expect(overlay).not.toBeNull()
    expect(content?.textContent).toBe('Inline content')
    flush(() => setOpen(false))
    await finishExitMotion()
    await waitFor(() => expect(onExitComplete).toHaveBeenCalledOnce())
    expect(host.querySelector('[data-slot="base-dialog-overlay"]')).toBe(overlay)
    expect(host.querySelector('[data-slot="base-dialog-content"]')).toBe(content)
    screen.unmount()
  })

  test('can contain the content inside a scrolling overlay', () => {
    render(() => (
      <BaseDialog defaultOpen>
        <BaseDialog.Portal>
          <BaseDialog.Overlay scrollable>
            <BaseDialog.Content>
              <span>Content</span>
            </BaseDialog.Content>
          </BaseDialog.Overlay>
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    const overlay = document.body.querySelector('[data-slot="base-dialog-overlay"]')
    const content = document.body.querySelector('[data-slot="base-dialog-content"]')

    expect(overlay?.contains(content ?? null)).toBe(true)
  })

  test('aria-hides background siblings while modal content is present and restores them on cleanup', async () => {
    const background = document.createElement('main')
    background.textContent = 'Application'
    document.body.append(background)
    const screen = render(() => (
      <BaseDialog defaultOpen>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            <span>Content</span>
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    await Promise.resolve()
    await Promise.resolve()

    expect(background.getAttribute('aria-hidden')).toBe('true')

    screen.unmount()

    expect(background.hasAttribute('aria-hidden')).toBe(false)
    background.remove()
  })

  test('reference-counts background isolation across nested layers and newly added siblings', async () => {
    const background = document.createElement('main')
    document.body.append(background)
    const [showInner, setShowInner] = createSignal(true)
    const screen = render(() => (
      <>
        <BaseDialog defaultOpen>
          <BaseDialog.Portal>
            <BaseDialog.Content>
              <span data-testid="outer-content">Outer</span>
            </BaseDialog.Content>
          </BaseDialog.Portal>
        </BaseDialog>
        <Show when={showInner()}>
          <BaseDialog defaultOpen>
            <BaseDialog.Portal>
              <BaseDialog.Content>
                <span data-testid="inner-content">Inner</span>
              </BaseDialog.Content>
            </BaseDialog.Portal>
          </BaseDialog>
        </Show>
      </>
    ))
    await Promise.resolve()
    await Promise.resolve()
    const outerContent = document.body
      .querySelector('[data-testid="outer-content"]')
      ?.closest('[data-slot="base-dialog-content"]') as HTMLElement
    const outerPortal = outerContent.parentElement!

    expect(background.getAttribute('aria-hidden')).toBe('true')
    expect(outerPortal.getAttribute('aria-hidden')).toBe('true')

    const lateSibling = document.createElement('aside')
    document.body.append(lateSibling)
    await Promise.resolve()
    expect(lateSibling.getAttribute('aria-hidden')).toBe('true')

    flush(() => setShowInner(false))
    await Promise.resolve()

    expect(background.getAttribute('aria-hidden')).toBe('true')
    expect(outerPortal.hasAttribute('aria-hidden')).toBe(false)

    screen.unmount()
    expect(background.hasAttribute('aria-hidden')).toBe(false)
    expect(lateSibling.hasAttribute('aria-hidden')).toBe(false)
    background.remove()
    lateSibling.remove()
  })

  test('keeps a registered descendant overlay portal exposed to assistive technology', async () => {
    const screen = render(() => (
      <BaseDialog defaultOpen>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            <span>Outer</span>
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))
    await Promise.resolve()
    await Promise.resolve()
    const descendantPortal = document.createElement('div')
    const descendantContent = document.createElement('div')
    descendantPortal.append(descendantContent)
    const release = pushOverlayLayer({
      contentElement: () => descendantContent,
      triggerElement: () => undefined,
    })

    document.body.append(descendantPortal)
    await Promise.resolve()

    expect(descendantPortal.hasAttribute('aria-hidden')).toBe(false)
    release()
    descendantPortal.remove()
    screen.unmount()
  })

  test.each([
    ['reserves the scrollbar gutter', true, '4px'],
    ['pads the body when the gutter is ignored', false, '24px'],
  ] as const)(
    'reference-counts scroll locking and %s without layout shift',
    async (_, gutterSupported, lockedPadding) => {
      const html = document.documentElement
      // Model a 20px classic viewport scrollbar that disappears when the body hides overflow.
      Object.defineProperty(html, 'offsetWidth', {
        configurable: true,
        get: () =>
          document.body.style.overflow === 'hidden' &&
          (!gutterSupported || html.style.getPropertyValue('scrollbar-gutter') !== 'stable')
            ? 1000
            : 980,
      })
      html.style.setProperty('scrollbar-gutter', 'auto')
      document.body.style.overflow = 'auto'
      document.body.style.paddingRight = '4px'
      const [showInner, setShowInner] = createSignal(true)
      const screen = render(() => (
        <>
          <BaseDialog defaultOpen>
            <BaseDialog.Portal>
              <BaseDialog.Content>
                <span>Outer</span>
              </BaseDialog.Content>
            </BaseDialog.Portal>
          </BaseDialog>
          <Show when={showInner()}>
            <BaseDialog defaultOpen>
              <BaseDialog.Portal>
                <BaseDialog.Content>
                  <span>Inner</span>
                </BaseDialog.Content>
              </BaseDialog.Portal>
            </BaseDialog>
          </Show>
        </>
      ))
      await Promise.resolve()

      expect(document.body.style.overflow).toBe('hidden')
      expect(html.style.getPropertyValue('scrollbar-gutter')).toBe('stable')
      expect(document.body.style.paddingRight).toBe(lockedPadding)

      flush(() => setShowInner(false))
      expect(document.body.style.overflow).toBe('hidden')
      expect(document.body.style.paddingRight).toBe(lockedPadding)

      screen.unmount()
      expect(document.body.style.overflow).toBe('auto')
      expect(html.style.getPropertyValue('scrollbar-gutter')).toBe('auto')
      expect(document.body.style.paddingRight).toBe('4px')

      Reflect.deleteProperty(html, 'offsetWidth')
      html.style.removeProperty('scrollbar-gutter')
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    },
  )

  test('locks <html> instead of <body> when <html> is the page scroller', async () => {
    const html = document.documentElement
    html.style.overflowY = 'auto'
    const screen = render(() => (
      <BaseDialog defaultOpen>
        <BaseDialog.Portal>
          <BaseDialog.Content>Content</BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))
    await Promise.resolve()

    expect(html.style.overflow).toBe('hidden')
    expect(document.body.style.overflow).toBe('')

    screen.unmount()
    expect(html.style.overflow).toBe('')
    expect(html.style.overflowY).toBe('auto')
    html.style.overflowY = ''
  })

  test('prevents the handled Escape event when dismissing the top modal', async () => {
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <BaseDialog defaultOpen onOpenChange={onOpenChange}>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            <span>Content</span>
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))
    await Promise.resolve()
    const content = document.body.querySelector('[data-slot="base-dialog-content"]') as HTMLElement
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Escape',
    })

    content.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(onOpenChange).toHaveBeenCalledWith(false)
    screen.unmount()
  })

  test('ignores Escape while an IME composition is active', async () => {
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <BaseDialog defaultOpen onOpenChange={onOpenChange}>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            <input data-testid="editor" />
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))
    await Promise.resolve()
    const editor = document.body.querySelector('[data-testid="editor"]')!

    fireEvent.compositionStart(editor)
    fireEvent.keyDown(editor, { key: 'Escape' })
    expect(onOpenChange).not.toHaveBeenCalled()

    fireEvent.compositionEnd(editor)
    fireEvent.keyDown(editor, { key: 'Escape' })
    expect(onOpenChange).not.toHaveBeenCalled()
    await new Promise((resolve) => setTimeout(resolve, 100))
    fireEvent.keyDown(editor, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    screen.unmount()
  })

  test('dismisses a completed touch tap but not touch pointerdown, movement, or multitouch', async () => {
    const outside = document.createElement('button')
    document.body.append(outside)
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <BaseDialog defaultOpen onOpenChange={onOpenChange}>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            <span>Content</span>
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))
    await Promise.resolve()

    fireEvent.pointerDown(outside, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 10,
      clientY: 10,
    })
    expect(onOpenChange).not.toHaveBeenCalled()
    fireEvent.pointerMove(outside, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 30,
      clientY: 10,
    })
    fireEvent.pointerUp(outside, { pointerId: 1, pointerType: 'touch' })
    expect(onOpenChange).not.toHaveBeenCalled()

    fireEvent.pointerDown(outside, { pointerId: 2, pointerType: 'touch' })
    fireEvent.pointerDown(outside, { pointerId: 3, pointerType: 'touch' })
    fireEvent.pointerUp(outside, { pointerId: 2, pointerType: 'touch' })
    fireEvent.pointerUp(outside, { pointerId: 3, pointerType: 'touch' })
    expect(onOpenChange).not.toHaveBeenCalled()

    fireEvent.pointerDown(outside, { pointerId: 4, pointerType: 'touch' })
    fireEvent.pointerUp(outside, { pointerId: 4, pointerType: 'touch' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    screen.unmount()
    outside.remove()
  })

  test('does not dismiss or report prevention for an outside right-click', async () => {
    const outside = document.createElement('button')
    document.body.append(outside)
    const onOpenChange = vi.fn()
    const onClosePrevented = vi.fn()
    const screen = render(() => (
      <BaseDialog defaultOpen onOpenChange={onOpenChange} onClosePrevented={onClosePrevented}>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            <span>Content</span>
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))
    await Promise.resolve()

    fireEvent.pointerDown(outside, { button: 2 })

    expect(onOpenChange).not.toHaveBeenCalled()
    expect(onClosePrevented).not.toHaveBeenCalled()
    expect(document.body.querySelector('[data-slot="base-dialog-content"]')).not.toBeNull()
    screen.unmount()
    outside.remove()
  })

  test('preserves cancellation from outside pointer and content Escape handlers', async () => {
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <>
        <button
          type="button"
          data-testid="outside"
          onPointerDown={(event) => event.preventDefault()}
        >
          Outside
        </button>
        <BaseDialog open onOpenChange={onOpenChange}>
          <BaseDialog.Portal>
            <BaseDialog.Content>
              <button
                type="button"
                data-testid="inside"
                onKeyDown={(event) => event.preventDefault()}
              >
                Inside
              </button>
            </BaseDialog.Content>
          </BaseDialog.Portal>
        </BaseDialog>
      </>
    ))
    await Promise.resolve()

    fireEvent.pointerDown(screen.getByTestId('outside'))
    fireEvent.keyDown(document.body.querySelector('[data-testid="inside"]')!, {
      key: 'Escape',
    })

    expect(onOpenChange).not.toHaveBeenCalled()
    screen.unmount()
  })

  test('recovers escaped focus to the last focused element inside the top modal', async () => {
    const outside = document.createElement('button')
    document.body.append(outside)
    const screen = render(() => (
      <BaseDialog defaultOpen>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            <>
              <button type="button" data-testid="first">
                First
              </button>
              <button type="button" data-testid="second">
                Second
              </button>
            </>
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))
    await Promise.resolve()
    await Promise.resolve()
    const second = document.body.querySelector('[data-testid="second"]') as HTMLButtonElement

    second.focus()
    outside.focus()
    await Promise.resolve()

    expect(document.activeElement).toBe(second)
    screen.unmount()
    outside.remove()
  })

  test('recovers focus when the focused child removes itself during pointerdown', async () => {
    const [showButton, setShowButton] = createSignal(true)
    const screen = render(() => (
      <BaseDialog defaultOpen>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            {() => (
              <Show when={showButton()} fallback={<span>Remaining content</span>}>
                <button
                  type="button"
                  data-testid="remove"
                  onPointerDown={() => setShowButton(false)}
                >
                  Remove
                </button>
              </Show>
            )}
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    const button = document.body.querySelector('[data-testid="remove"]') as HTMLButtonElement
    const content = document.body.querySelector('[data-slot="base-dialog-content"]') as HTMLElement
    button.focus()

    fireEvent.pointerDown(button, { pointerType: 'mouse' })
    await Promise.resolve()

    expect(document.activeElement).toBe(content)
    screen.unmount()
  })

  test('initial focus skips controls hidden with CSS', async () => {
    const screen = render(() => (
      <BaseDialog defaultOpen>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            <button type="button" style={{ display: 'none' }}>
              Display hidden
            </button>
            <button type="button" style={{ visibility: 'hidden' }}>
              Visibility hidden
            </button>
            <button type="button" data-testid="visible">
              Visible
            </button>
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    await waitFor(() =>
      expect(document.activeElement).toBe(
        document.body.querySelector<HTMLButtonElement>('[data-testid="visible"]'),
      ),
    )
    screen.unmount()
  })

  test('restores the previously focused element when an open modal has no trigger', async () => {
    const previous = document.createElement('button')
    document.body.append(previous)
    previous.focus()
    const screen = render(() => (
      <BaseDialog defaultOpen>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            {(context) => (
              <button type="button" data-testid="close" onClick={context.close}>
                Close
              </button>
            )}
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))
    await Promise.resolve()
    await Promise.resolve()

    fireEvent.click(document.body.querySelector('[data-testid="close"]')!)
    await Promise.resolve()
    const content = document.body.querySelector('[data-slot="base-dialog-content"]')!
    fireEvent.animationEnd(content)
    fireEvent.transitionEnd(content)

    await waitFor(() => {
      expect(document.activeElement).toBe(previous)
    })
    screen.unmount()
    previous.remove()
  })

  test('recaptures the restore target on each activation of a controlled modal', async () => {
    const [open, setOpen] = createSignal(false)
    const buttonA = document.createElement('button')
    const buttonB = document.createElement('button')
    document.body.append(buttonA, buttonB)
    const screen = render(() => (
      <BaseDialog open={open()}>
        <BaseDialog.Portal>
          <BaseDialog.Content>Content</BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    buttonA.focus()
    flush(() => setOpen(true))
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="base-dialog-content"]')).not.toBeNull(),
    )
    flush(() => setOpen(false))
    await finishExitMotion()
    await waitFor(() => {
      expect(document.activeElement).toBe(buttonA)
    })

    buttonB.focus()
    flush(() => setOpen(true))
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="base-dialog-content"]')).not.toBeNull(),
    )
    flush(() => setOpen(false))
    await finishExitMotion()
    await waitFor(() => {
      expect(document.activeElement).toBe(buttonB)
    })
    screen.unmount()
    buttonA.remove()
    buttonB.remove()
  })

  test('restores nested modal focus in stack order', async () => {
    const screen = render(() => (
      <BaseDialog>
        <BaseDialog.Trigger data-testid="outer-trigger">Open outer</BaseDialog.Trigger>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            {(outerContext) => (
              <>
                <button type="button" data-testid="outer-close" onClick={outerContext.close}>
                  Close outer
                </button>
                <BaseDialog>
                  <BaseDialog.Trigger data-testid="inner-trigger">Open inner</BaseDialog.Trigger>
                  <BaseDialog.Portal>
                    <BaseDialog.Content>
                      {(innerContext) => (
                        <button
                          type="button"
                          data-testid="inner-close"
                          onClick={innerContext.close}
                        >
                          Close inner
                        </button>
                      )}
                    </BaseDialog.Content>
                  </BaseDialog.Portal>
                </BaseDialog>
              </>
            )}
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    const outerTrigger = screen.getByTestId('outer-trigger')
    fireEvent.click(outerTrigger)
    await Promise.resolve()
    const innerTrigger = document.body.querySelector(
      '[data-testid="inner-trigger"]',
    ) as HTMLButtonElement
    fireEvent.click(innerTrigger)
    await Promise.resolve()

    fireEvent.click(document.body.querySelector('[data-testid="inner-close"]')!)
    await Promise.resolve()
    const innerContent = document.body.querySelectorAll('[data-slot="base-dialog-content"]')[1]!
    fireEvent.animationEnd(innerContent)
    fireEvent.transitionEnd(innerContent)
    await waitFor(() => {
      expect(document.activeElement).toBe(innerTrigger)
    })

    fireEvent.click(document.body.querySelector('[data-testid="outer-close"]')!)
    await Promise.resolve()
    const outerContent = document.body.querySelector('[data-slot="base-dialog-content"]')!
    fireEvent.animationEnd(outerContent)
    fireEvent.transitionEnd(outerContent)
    await waitFor(() => {
      expect(document.activeElement).toBe(outerTrigger)
    })
    screen.unmount()
  })

  test('focuses the first enabled control and loops Tab at both content boundaries', async () => {
    const screen = render(() => (
      <BaseDialog defaultOpen>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            <>
              <button type="button" disabled>
                Disabled
              </button>
              <div aria-hidden="true">
                <button type="button">Hidden</button>
              </div>
              <button type="button" data-testid="first-enabled">
                First enabled
              </button>
              <button type="button" data-testid="last-enabled">
                Last enabled
              </button>
            </>
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))
    await Promise.resolve()
    await Promise.resolve()
    const first = document.body.querySelector('[data-testid="first-enabled"]') as HTMLButtonElement
    const last = document.body.querySelector('[data-testid="last-enabled"]') as HTMLButtonElement

    expect(document.activeElement).toBe(first)

    last.focus()
    const forwardEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Tab',
    })
    last.dispatchEvent(forwardEvent)
    expect(forwardEvent.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(first)

    const backwardEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Tab',
      shiftKey: true,
    })
    first.dispatchEvent(backwardEvent)
    expect(backwardEvent.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(last)
    screen.unmount()
  })

  test('traps focus from container element to first and last focusables', async () => {
    const screen = render(() => (
      <BaseDialog defaultOpen>
        <BaseDialog.Portal>
          <BaseDialog.Content data-testid="base-dialog-content">
            <button type="button" data-testid="first-btn">
              First
            </button>
            <button type="button" data-testid="last-btn">
              Last
            </button>
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))
    await Promise.resolve()
    await Promise.resolve()
    const content = document.body.querySelector(
      '[data-testid="base-dialog-content"]',
    ) as HTMLElement
    const first = document.body.querySelector('[data-testid="first-btn"]') as HTMLButtonElement
    const last = document.body.querySelector('[data-testid="last-btn"]') as HTMLButtonElement

    content.focus()
    const forwardEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Tab',
    })
    content.dispatchEvent(forwardEvent)
    expect(forwardEvent.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(first)

    content.focus()
    const backwardEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Tab',
      shiftKey: true,
    })
    content.dispatchEvent(backwardEvent)
    expect(backwardEvent.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(last)
    screen.unmount()
  })

  test('keeps modal false surfaces consistently non-modal', async () => {
    const screen = render(() => (
      <>
        <button type="button" data-testid="outside">
          Outside
        </button>
        <BaseDialog defaultOpen modal={false}>
          <BaseDialog.Portal>
            <BaseDialog.Content>
              <button type="button" data-testid="first-btn">
                First
              </button>
              <button type="button" data-testid="last-btn">
                Last
              </button>
            </BaseDialog.Content>
          </BaseDialog.Portal>
        </BaseDialog>
      </>
    ))
    const outside = screen.getByTestId<HTMLButtonElement>('outside')
    outside.focus()
    await Promise.resolve()
    await Promise.resolve()
    const content = document.body.querySelector<HTMLElement>('[data-slot="base-dialog-content"]')!
    const last = document.body.querySelector('[data-testid="last-btn"]') as HTMLButtonElement
    expect(content.getAttribute('aria-modal')).toBeNull()
    expect(outside.getAttribute('aria-hidden')).toBeNull()
    expect(document.body.style.overflow).toBe('')
    expect(document.activeElement).toBe(outside)
    last.focus()

    const forwardEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Tab',
    })
    last.dispatchEvent(forwardEvent)
    expect(forwardEvent.defaultPrevented).toBe(false)

    outside.focus()
    await Promise.resolve()
    expect(document.activeElement).toBe(outside)

    const pointerDown = new PointerEvent('pointerdown', {
      bubbles: true,
      button: 0,
      cancelable: true,
      pointerType: 'mouse',
    })
    outside.dispatchEvent(pointerDown)
    expect(pointerDown.defaultPrevented).toBe(false)
    screen.unmount()
  })

  test.each([
    { closeOnOutsideClick: true, closeOnEscape: true, closes: 2, prevents: 0 },
    { closeOnOutsideClick: false, closeOnEscape: false, closes: 0, prevents: 2 },
  ])(
    'keeps outside and Escape handling when modal is false and dismissal is $closeOnOutsideClick/$closeOnEscape',
    async ({ closeOnOutsideClick, closeOnEscape, closes, prevents }) => {
      const onOpenChange = vi.fn()
      const onClosePrevented = vi.fn()
      const screen = render(() => (
        <>
          <button type="button" data-testid="outside">
            Outside
          </button>
          <BaseDialog
            open
            modal={false}
            closeOnOutsideClick={closeOnOutsideClick}
            closeOnEscape={closeOnEscape}
            onOpenChange={onOpenChange}
            onClosePrevented={onClosePrevented}
          >
            <BaseDialog.Portal>
              <BaseDialog.Content aria-label="Content">Content</BaseDialog.Content>
            </BaseDialog.Portal>
          </BaseDialog>
        </>
      ))
      await Promise.resolve()

      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        button: 0,
        cancelable: true,
        pointerType: 'mouse',
      })
      screen.getByTestId('outside').dispatchEvent(pointerDown)
      expect(pointerDown.defaultPrevented).toBe(false)

      const escape = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Escape',
      })
      document.dispatchEvent(escape)
      expect(escape.defaultPrevented).toBe(true)
      expect(onOpenChange).toHaveBeenCalledTimes(closes)
      expect(onClosePrevented).toHaveBeenCalledTimes(prevents)
      screen.unmount()
    },
  )

  test('restores trigger focus after enabling modal behavior while open', async () => {
    const [open, setOpen] = createSignal(true)
    const [modal, setModal] = createSignal(false)
    const screen = render(() => (
      <BaseDialog open={open()} modal={modal()}>
        <BaseDialog.Trigger>Open</BaseDialog.Trigger>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            <button type="button">Inside</button>
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))
    const trigger = screen.getByRole('button', { name: 'Open' })
    const inside = document.body.querySelector<HTMLButtonElement>(
      '[data-slot="base-dialog-content"] button',
    )!
    flush(() => setModal(true))
    await waitFor(() => expect(document.activeElement).toBe(inside))
    flush(() => setOpen(false))
    await finishExitMotion(
      document.body.querySelector<HTMLElement>('[data-slot="base-dialog-content"]'),
    )
    await waitFor(() => expect(document.activeElement).toBe(trigger))
    screen.unmount()
  })

  test('updates modal isolation when modal changes while open', async () => {
    const [modal, setModal] = createSignal(false)
    const screen = render(() => (
      <>
        <main data-testid="background">Background</main>
        <BaseDialog defaultOpen modal={modal()}>
          <BaseDialog.Portal>
            <BaseDialog.Content>Content</BaseDialog.Content>
          </BaseDialog.Portal>
        </BaseDialog>
      </>
    ))
    const background = screen.getByTestId('background')
    const content = document.body.querySelector('[data-slot="base-dialog-content"]')!

    expect(content.getAttribute('aria-modal')).toBeNull()
    expect(background.closest('[aria-hidden="true"]')).toBeNull()
    expect(document.body.style.overflow).toBe('')

    flush(() => setModal(true))
    await waitFor(() => {
      expect(content.getAttribute('aria-modal')).toBe('true')
      expect(background.closest('[aria-hidden="true"]')).not.toBeNull()
      expect(document.body.style.overflow).toBe('hidden')
    })

    flush(() => setModal(false))
    await waitFor(() => {
      expect(content.getAttribute('aria-modal')).toBeNull()
      expect(background.closest('[aria-hidden="true"]')).toBeNull()
      expect(document.body.style.overflow).toBe('')
    })
    screen.unmount()
  })

  test('does not restore focus to a trigger that became disabled while open', async () => {
    const [disabled, setDisabled] = createSignal(false)
    const screen = render(() => (
      <BaseDialog>
        <BaseDialog.Trigger disabled={disabled()} data-testid="trigger">
          Open
        </BaseDialog.Trigger>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            {(context) => (
              <button type="button" data-testid="close-disabled" onClick={context.close}>
                Close
              </button>
            )}
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))
    const trigger = screen.getByTestId('trigger')
    fireEvent.click(trigger)
    await Promise.resolve()
    flush(() => setDisabled(true))

    fireEvent.click(document.body.querySelector('[data-testid="close-disabled"]')!)
    await Promise.resolve()
    const content = document.body.querySelector('[data-slot="base-dialog-content"]')!
    fireEvent.animationEnd(content)
    fireEvent.transitionEnd(content)
    await Promise.resolve()

    expect(document.activeElement).not.toBe(trigger)
    screen.unmount()
  })

  test('does not restore focus to a trigger removed while open', async () => {
    const [showTrigger, setShowTrigger] = createSignal(true)
    const screen = render(() => (
      <BaseDialog>
        <Show when={showTrigger()}>
          <BaseDialog.Trigger data-testid="removable-trigger">Open</BaseDialog.Trigger>
        </Show>
        <BaseDialog.Portal>
          <BaseDialog.Content>
            {(context) => (
              <button type="button" data-testid="close-removed" onClick={context.close}>
                Close
              </button>
            )}
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))
    const trigger = screen.getByTestId('removable-trigger')
    fireEvent.click(trigger)
    await Promise.resolve()
    flush(() => setShowTrigger(false))

    fireEvent.click(document.body.querySelector('[data-testid="close-removed"]')!)
    await Promise.resolve()
    const content = document.body.querySelector('[data-slot="base-dialog-content"]')!
    fireEvent.animationEnd(content)
    fireEvent.transitionEnd(content)
    await Promise.resolve()

    expect(trigger.isConnected).toBe(false)
    expect(document.activeElement).not.toBe(trigger)
    screen.unmount()
  })

  test('cancels stale exit completion and focus restoration on rapid reopen', async () => {
    const [open, setOpen] = createSignal(false)
    const onExitComplete = vi.fn()
    const screen = render(() => (
      <BaseDialog open={open()} onOpenChange={setOpen} onExitComplete={onExitComplete}>
        <BaseDialog.Trigger data-testid="rapid-trigger">Open</BaseDialog.Trigger>
        <BaseDialog.Portal>
          <BaseDialog.Overlay />
          <BaseDialog.Content>
            {(context) => (
              <button type="button" data-testid="rapid-close" onClick={context.close}>
                Close
              </button>
            )}
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))
    const trigger = screen.getByTestId('rapid-trigger')
    fireEvent.click(trigger)
    await Promise.resolve()
    fireEvent.click(document.body.querySelector('[data-testid="rapid-close"]')!)

    flush(() => setOpen(true))
    await Promise.resolve()

    const reopenedContent = document.body.querySelector(
      '[data-slot="base-dialog-content"]',
    ) as HTMLElement
    expect(reopenedContent.hasAttribute('data-expanded')).toBe(true)
    expect(onExitComplete).not.toHaveBeenCalled()
    expect(document.activeElement).not.toBe(trigger)

    flush(() => setOpen(false))
    await Promise.resolve()
    fireEvent.animationEnd(reopenedContent)
    fireEvent.transitionEnd(reopenedContent)
    expect(onExitComplete).not.toHaveBeenCalled()

    const overlay = document.body.querySelector('[data-slot="base-dialog-overlay"]') as HTMLElement
    fireEvent.animationEnd(overlay)
    fireEvent.transitionEnd(overlay)
    await waitFor(() => {
      expect(onExitComplete).toHaveBeenCalledOnce()
      expect(document.activeElement).toBe(trigger)
    })
    screen.unmount()
  })

  test('modal retargets isolation when overlayScroll replaces content', async () => {
    const [scroll, setScroll] = createSignal(false)
    const screen = render(() => (
      <BaseDialog defaultOpen>
        <BaseDialog.Portal>
          <Show
            when={scroll()}
            fallback={
              <>
                <BaseDialog.Overlay />
                <BaseDialog.Content>
                  <button data-testid="content-action">Action</button>
                </BaseDialog.Content>
              </>
            }
          >
            <BaseDialog.Overlay scrollable>
              <BaseDialog.Content>
                <button data-testid="content-action">Action</button>
              </BaseDialog.Content>
            </BaseDialog.Overlay>
          </Show>
        </BaseDialog.Portal>
      </BaseDialog>
    ))
    try {
      await waitFor(() =>
        expect(document.activeElement).toBe(
          document.body.querySelector<HTMLButtonElement>('[data-testid="content-action"]')!,
        ),
      )
      const before = document.body.querySelector('[data-slot="base-dialog-content"]')
      flush(() => setScroll(true))
      await Promise.resolve()
      await Promise.resolve()
      const after = document.body.querySelector<HTMLButtonElement>(
        '[data-testid="content-action"]',
      )!
      expect(after.closest('[data-slot="base-dialog-content"]')).not.toBe(before)
      expect(after.closest('[aria-hidden="true"]')).toBeNull()
      expect(document.activeElement).toBe(after)
    } finally {
      screen.unmount()
    }
  })

  test('toggles open state on trigger activation when modal is false', async () => {
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <BaseDialog modal={false} onOpenChange={onOpenChange}>
        <BaseDialog.Trigger>Toggle non-modal</BaseDialog.Trigger>
        <BaseDialog.Portal>
          <BaseDialog.Content aria-label="Non-modal content">Content</BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))
    const trigger = screen.getByRole('button', { name: 'Toggle non-modal' })
    fireEvent.click(trigger)
    expect(onOpenChange).toHaveBeenCalledWith(true)

    fireEvent.click(trigger)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  test('preserves custom id on BaseDialog.Content and updates trigger aria-controls', () => {
    render(() => (
      <BaseDialog open>
        <BaseDialog.Trigger>Open</BaseDialog.Trigger>
        <BaseDialog.Portal>
          <BaseDialog.Content id="custom-modal-id">
            <span>Modal content</span>
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    const content = document.body.querySelector('[data-slot="base-dialog-content"]')!
    const trigger = document.body.querySelector('[data-slot="base-dialog-trigger"]')!
    expect(content.id).toBe('custom-modal-id')
    expect(trigger.getAttribute('aria-controls')).toBe('custom-modal-id')
  })

  test('runs the consumer onKeyDown handler and honors its preventDefault', () => {
    const onKeyDown = vi.fn((event: KeyboardEvent) => {
      event.preventDefault()
    })
    render(() => (
      <BaseDialog open modal>
        <BaseDialog.Portal>
          <BaseDialog.Content onKeyDown={onKeyDown}>
            <input data-testid="input" />
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))

    const content = document.body.querySelector('[data-slot="base-dialog-content"]')!
    const notCancelled = fireEvent.keyDown(content, { key: 'Tab' })
    expect(onKeyDown).toHaveBeenCalledTimes(1)
    expect(notCancelled).toBe(false)
  })

  test('supports polymorphic rendering via as prop on Content', () => {
    render(() => (
      <BaseDialog open>
        <BaseDialog.Portal>
          <BaseDialog.Content as="section" data-testid="section-modal">
            <span>Modal section</span>
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    ))
    const content = document.body.querySelector('[data-testid="section-modal"]')
    expect(content).not.toBeNull()
    expect(content?.tagName).toBe('SECTION')
    expect(content?.getAttribute('role')).toBe('dialog')
  })
})
