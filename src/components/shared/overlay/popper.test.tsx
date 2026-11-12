import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { Show, createSignal, untrack } from 'solid-js'
import type { JSX } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { finishExitMotion } from '../../../test-util/overlay-test'
import { Popover } from '../../popover/popover'
import { Tooltip } from '../../tooltip/tooltip'

import { createPopper, PopperTrigger, PopperContent } from './popper'
import type { PopperProps } from './popper.types'

function PopperFixture(
  props: PopperProps & {
    contentRender: (context: ReturnType<typeof createPopper>) => JSX.Element
  },
): JSX.Element {
  return untrack(() => props.contentRender(createPopper(props, 'popover')))
}

describe('Popper primitives', () => {
  test('renders plain content children only while open and keeps them reactive', async () => {
    const [label, setLabel] = createSignal('First')
    const screen = render(() => (
      <PopperFixture
        contentRender={(popper) => (
          <>
            <PopperTrigger context={popper}>Open</PopperTrigger>
            <PopperContent context={popper}>
              <span data-testid="plain-content">{label()}</span>
            </PopperContent>
          </>
        )}
      />
    ))

    expect(document.querySelector('[data-testid="plain-content"]')).toBeNull()
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() =>
      expect(document.querySelector('[data-testid="plain-content"]')?.textContent).toBe('First'),
    )
    setLabel('Second')
    expect(document.querySelector('[data-testid="plain-content"]')?.textContent).toBe('Second')
  })

  test('forwards original pointer events to trigger and content callbacks', async () => {
    const onTriggerPointerEnter = vi.fn()
    const onTriggerPointerLeave = vi.fn()
    const onContentPointerEnter = vi.fn()
    const onContentPointerLeave = vi.fn()

    const screen = render(() => (
      <PopperFixture
        defaultOpen
        contentRender={(popper) => (
          <>
            <PopperTrigger
              context={popper}
              onPointerEnter={onTriggerPointerEnter}
              onPointerLeave={onTriggerPointerLeave}
              type="button"
            >
              Open
            </PopperTrigger>
            <PopperContent context={popper}>
              {(context) => (
                <div
                  data-testid="content"
                  {...context.contentProps}
                  onPointerEnter={onContentPointerEnter}
                  onPointerLeave={onContentPointerLeave}
                >
                  Content
                </div>
              )}
            </PopperContent>
          </>
        )}
      />
    ))
    const trigger = screen.getByRole('button')
    await waitFor(() => {
      expect(document.body.querySelector('[data-testid="content"]')).not.toBeNull()
    })
    const content = document.body.querySelector('[data-testid="content"]')!

    const triggerEnter = new PointerEvent('pointerenter', { pointerType: 'pen' })
    const triggerLeave = new PointerEvent('pointerleave', { pointerType: 'pen' })
    const contentEnter = new PointerEvent('pointerenter', { pointerType: 'touch' })
    const contentLeave = new PointerEvent('pointerleave', { pointerType: 'touch' })

    trigger.dispatchEvent(triggerEnter)
    trigger.dispatchEvent(triggerLeave)
    content.dispatchEvent(contentEnter)
    content.dispatchEvent(contentLeave)

    expect(onTriggerPointerEnter.mock.calls[0]?.[0]).toBe(triggerEnter)
    expect(onTriggerPointerLeave.mock.calls[0]?.[0]).toBe(triggerLeave)
    expect(onContentPointerEnter.mock.calls[0]?.[0]).toBe(contentEnter)
    expect(onContentPointerLeave.mock.calls[0]?.[0]).toBe(contentLeave)
  })

  test('does not render closed content until the trigger opens it', async () => {
    render(() => (
      <PopperFixture
        contentRender={(popper) => (
          <>
            <PopperTrigger context={popper} type="button">
              Open
            </PopperTrigger>
            <PopperContent context={popper}>{() => <div role="dialog">Content</div>}</PopperContent>
          </>
        )}
      />
    ))

    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
    fireEvent.click(document.querySelector('[data-slot="popover-trigger"]')!)

    await waitFor(() => expect(document.body.querySelector('[role="dialog"]')).not.toBeNull())
    expect(document.body.querySelector('[role="dialog"]')?.textContent).toBe('Content')
  })

  test('force-mounts closed content without activating open-state resources', async () => {
    const onEscapeKeyDown = vi.fn()
    const screen = render(() => (
      <PopperFixture
        contentRender={(popper) => (
          <>
            <PopperTrigger context={popper} type="button">
              Open
            </PopperTrigger>
            <PopperContent context={popper} forceMount modal onEscapeKeyDown={onEscapeKeyDown}>
              {(context) => (
                <div data-slot="popover-content" {...context.contentProps}>
                  Content
                </div>
              )}
            </PopperContent>
          </>
        )}
      />
    ))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="popover-content"]')).not.toBeNull()
    })

    const content = document.body.querySelector('[data-slot="popover-content"]')
    expect(content?.hasAttribute('data-closed')).toBe(true)
    expect(content?.hasAttribute('data-expanded')).toBe(false)
    expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('false')
    expect(document.body.style.overflow).toBe('')

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onEscapeKeyDown).not.toHaveBeenCalled()
  })

  test('unmounts the content host after closing', async () => {
    const screen = render(() => (
      <PopperFixture
        contentRender={(context) => (
          <>
            <PopperTrigger context={context} type="button">
              Open
            </PopperTrigger>
            <PopperContent context={context}>
              {(content) => (
                <div data-testid="content-host" {...content.contentProps}>
                  Content
                </div>
              )}
            </PopperContent>
          </>
        )}
      />
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    const host = await waitFor(() => {
      const element = document.body.querySelector<HTMLElement>('[data-testid="content-host"]')
      expect(element).not.toBeNull()
      return element!
    })

    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    await finishExitMotion(host)
    await waitFor(() =>
      expect(document.body.querySelector('[data-testid="content-host"]')).toBeNull(),
    )
  })

  test('stops positioning when its trigger is removed', async () => {
    const [showTrigger, setShowTrigger] = createSignal(true)
    render(() => (
      <PopperFixture
        defaultOpen
        contentRender={(popper) => (
          <>
            <Show when={showTrigger()}>
              <PopperTrigger context={popper} type="button">
                Open
              </PopperTrigger>
            </Show>
            <PopperContent context={popper}>
              {(context) => <div {...context.contentProps}>Content</div>}
            </PopperContent>
          </>
        )}
      />
    ))

    const positioner = document.body.querySelector(
      '[data-slot="popover-positioner"]',
    ) as HTMLElement
    await waitFor(() => {
      expect(positioner.hasAttribute('data-positioned')).toBe(true)
    })

    setShowTrigger(false)

    await waitFor(() => {
      expect(positioner.hasAttribute('data-positioned')).toBe(false)
      expect(positioner.style.visibility).toBe('hidden')
    })
  })

  test('preserves target cancellation for outside pointer interactions', async () => {
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
        <PopperFixture
          defaultOpen
          onOpenChange={onOpenChange}
          contentRender={(popper) => (
            <>
              <PopperTrigger context={popper} type="button">
                Open
              </PopperTrigger>
              <PopperContent context={popper}>
                {(context) => (
                  <div data-slot="popover-content" {...context.contentProps}>
                    Content
                  </div>
                )}
              </PopperContent>
            </>
          )}
        />
      </>
    ))

    fireEvent.pointerDown(screen.getByTestId('outside'))

    expect(onOpenChange).not.toHaveBeenCalled()
    expect(document.body.querySelector('[data-slot="popover-content"]')).not.toBeNull()
  })

  test('dismisses press-less outside clicks while retaining inside and cancelled click behavior', async () => {
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <>
        <button type="button" data-testid="outside" onClick={(event) => event.preventDefault()}>
          Cancelled outside
        </button>
        <PopperFixture
          defaultOpen
          onOpenChange={onOpenChange}
          contentRender={(popper) => (
            <>
              <PopperTrigger context={popper} type="button">
                Open
              </PopperTrigger>
              <PopperContent context={popper}>
                {(context) => (
                  <div data-slot="popover-content" {...context.contentProps}>
                    <button type="button" data-testid="inside">
                      Inside
                    </button>
                  </div>
                )}
              </PopperContent>
            </>
          )}
        />
      </>
    ))
    const outside = screen.getByTestId('outside')
    const inside = document.body.querySelector('[data-testid="inside"]')!

    fireEvent.click(inside, { detail: 0 })
    fireEvent.click(outside, { detail: 0 })
    expect(onOpenChange).not.toHaveBeenCalled()

    const uncancelledOutside = document.createElement('button')
    document.body.append(uncancelledOutside)
    fireEvent.click(uncancelledOutside, { detail: 0 })
    expect(onOpenChange).toHaveBeenCalledWith(false)

    screen.unmount()
    uncancelledOutside.remove()
  })

  test('does not replay an outside pointer dismissal as a click against a newly opened layer', async () => {
    const [firstOpen, setFirstOpen] = createSignal(true)
    const [secondOpen, setSecondOpen] = createSignal(false)
    const onSecondOpenChange = vi.fn((open: boolean) => setSecondOpen(open))
    const outside = document.createElement('button')
    document.body.append(outside)
    const screen = render(() => (
      <>
        <PopperFixture
          open={firstOpen()}
          onOpenChange={(open) => {
            setFirstOpen(open)
            if (!open) {
              setSecondOpen(true)
            }
          }}
          contentRender={(popper) => (
            <>
              <PopperTrigger context={popper}>First</PopperTrigger>
              <PopperContent context={popper}>
                {(context) => <div {...context.contentProps}>First content</div>}
              </PopperContent>
            </>
          )}
        />
        <PopperFixture
          open={secondOpen()}
          onOpenChange={onSecondOpenChange}
          contentRender={(popper) => (
            <>
              <PopperTrigger context={popper}>Second</PopperTrigger>
              <PopperContent context={popper}>
                {(context) => <div {...context.contentProps}>Second content</div>}
              </PopperContent>
            </>
          )}
        />
      </>
    ))

    fireEvent.pointerDown(outside, { pointerType: 'mouse' })
    fireEvent.pointerUp(outside, { pointerType: 'mouse' })
    fireEvent.click(outside, { detail: 1 })

    expect(onSecondOpenChange).not.toHaveBeenCalled()
    screen.unmount()
    outside.remove()
  })

  test('suppresses the click that dismissed a layer even after a delayed release', async () => {
    const [firstOpen, setFirstOpen] = createSignal(true)
    const [secondOpen, setSecondOpen] = createSignal(false)
    const onSecondOpenChange = vi.fn((open: boolean) => setSecondOpen(open))
    const outside = document.createElement('button')
    document.body.append(outside)
    const screen = render(() => (
      <>
        <PopperFixture
          open={firstOpen()}
          onOpenChange={(open) => {
            setFirstOpen(open)
            if (!open) {
              setSecondOpen(true)
            }
          }}
          contentRender={(popper) => (
            <>
              <PopperTrigger context={popper}>First</PopperTrigger>
              <PopperContent context={popper}>
                {(context) => <div {...context.contentProps}>First content</div>}
              </PopperContent>
            </>
          )}
        />
        <PopperFixture
          open={secondOpen()}
          onOpenChange={onSecondOpenChange}
          contentRender={(popper) => (
            <>
              <PopperTrigger context={popper}>Second</PopperTrigger>
              <PopperContent context={popper}>
                {(context) => <div {...context.contentProps}>Second content</div>}
              </PopperContent>
            </>
          )}
        />
      </>
    ))

    fireEvent.pointerDown(outside, { pointerType: 'mouse' })
    await new Promise((resolve) => setTimeout(resolve, 0))
    fireEvent.pointerUp(outside, { pointerType: 'mouse' })
    fireEvent.click(outside, { detail: 1 })

    expect(onSecondOpenChange).not.toHaveBeenCalled()

    fireEvent.pointerDown(outside, { pointerType: 'mouse' })
    fireEvent.pointerUp(outside, { pointerType: 'mouse' })
    fireEvent.click(outside, { detail: 1 })

    expect(onSecondOpenChange).toHaveBeenCalledWith(false)
    screen.unmount()
    outside.remove()
  })

  test('clears stale pointer-click suppression when a different target clicks first', async () => {
    const [firstOpen, setFirstOpen] = createSignal(true)
    const [secondOpen, setSecondOpen] = createSignal(false)
    const onSecondOpenChange = vi.fn((open: boolean) => setSecondOpen(open))
    const firstOutside = document.createElement('button')
    const secondOutside = document.createElement('button')
    document.body.append(firstOutside, secondOutside)
    const screen = render(() => (
      <>
        <PopperFixture
          open={firstOpen()}
          onOpenChange={(open) => {
            setFirstOpen(open)
            if (!open) {
              setSecondOpen(true)
            }
          }}
          contentRender={(popper) => (
            <>
              <PopperTrigger context={popper}>First</PopperTrigger>
              <PopperContent context={popper}>
                {(context) => <div {...context.contentProps}>First content</div>}
              </PopperContent>
            </>
          )}
        />
        <PopperFixture
          open={secondOpen()}
          onOpenChange={onSecondOpenChange}
          contentRender={(popper) => (
            <>
              <PopperTrigger context={popper}>Second</PopperTrigger>
              <PopperContent context={popper}>
                {(context) => <div {...context.contentProps}>Second content</div>}
              </PopperContent>
            </>
          )}
        />
      </>
    ))

    fireEvent.pointerDown(firstOutside, { pointerType: 'mouse' })
    fireEvent.click(secondOutside, { detail: 1 })
    expect(onSecondOpenChange).toHaveBeenCalledWith(false)

    onSecondOpenChange.mockClear()
    setSecondOpen(true)
    fireEvent.click(firstOutside, { detail: 1 })
    expect(onSecondOpenChange).toHaveBeenCalledWith(false)

    screen.unmount()
    firstOutside.remove()
    secondOutside.remove()
  })

  test('ignores secondary pointer dismissal and prevents handled Escape', async () => {
    const outside = document.createElement('button')
    document.body.append(outside)
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <PopperFixture
        defaultOpen
        onOpenChange={onOpenChange}
        contentRender={(popper) => (
          <>
            <PopperTrigger context={popper} type="button">
              Open
            </PopperTrigger>
            <PopperContent context={popper}>
              {(context) => (
                <div data-slot="popover-content" {...context.contentProps}>
                  Content
                </div>
              )}
            </PopperContent>
          </>
        )}
      />
    ))

    fireEvent.pointerDown(outside, { button: 2 })
    expect(onOpenChange).not.toHaveBeenCalled()

    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Escape',
    })
    document.body.querySelector('[data-slot="popover-content"]')!.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(onOpenChange).toHaveBeenCalledWith(false)
    screen.unmount()
    outside.remove()
  })

  test('delays touch outside dismissal until a completed tap', async () => {
    const outside = document.createElement('button')
    document.body.append(outside)
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <PopperFixture
        defaultOpen
        onOpenChange={onOpenChange}
        contentRender={(popper) => (
          <>
            <PopperTrigger context={popper}>Open</PopperTrigger>
            <PopperContent context={popper}>
              {(context) => <div {...context.contentProps}>Content</div>}
            </PopperContent>
          </>
        )}
      />
    ))

    fireEvent.pointerDown(outside, { pointerId: 1, pointerType: 'touch' })
    expect(onOpenChange).not.toHaveBeenCalled()
    fireEvent.pointerUp(outside, { pointerId: 1, pointerType: 'touch' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    screen.unmount()
    outside.remove()
  })

  test('ignores Escape while an IME composition is active', async () => {
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <PopperFixture
        defaultOpen
        onOpenChange={onOpenChange}
        contentRender={(popper) => (
          <>
            <PopperTrigger context={popper}>Open</PopperTrigger>
            <PopperContent context={popper}>
              {(context) => <input {...context.contentProps} />}
            </PopperContent>
          </>
        )}
      />
    ))
    const content = document.body.querySelector('input')!

    fireEvent.compositionStart(content)
    fireEvent.keyDown(content, { key: 'Escape' })
    expect(onOpenChange).not.toHaveBeenCalled()
    fireEvent.compositionEnd(content)
    fireEvent.keyDown(content, { key: 'Escape' })
    expect(onOpenChange).not.toHaveBeenCalled()
    await new Promise((resolve) => setTimeout(resolve, 100))
    fireEvent.keyDown(content, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    screen.unmount()
  })

  test('does not acquire global resources without a mounted content surface', async () => {
    const onEscapeKeyDown = vi.fn()
    const [show, setShow] = createSignal(false)
    const screen = render(() => (
      <PopperFixture
        defaultOpen
        contentRender={(popper) => (
          <>
            <PopperTrigger context={popper} type="button">
              Open
            </PopperTrigger>
            <Show when={show()}>
              <PopperContent context={popper} modal onEscapeKeyDown={onEscapeKeyDown}>
                {(context) => <div {...context.contentProps}>Hidden content</div>}
              </PopperContent>
            </Show>
          </>
        )}
      />
    ))

    await Promise.resolve()
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(document.body.style.overflow).toBe('')
    expect(onEscapeKeyDown).not.toHaveBeenCalled()
    setShow(true)
    await waitFor(() => expect(document.body.style.overflow).toBe('hidden'))
    screen.unmount()
    expect(document.body.style.overflow).toBe('')
  })

  test('keeps modal isolation for an open cycle when modal and scroll options change', async () => {
    const [open, setOpen] = createSignal(true)
    const [modal, setModal] = createSignal(true)
    const [preventScroll, setPreventScroll] = createSignal(false)
    const background = document.createElement('main')
    document.body.append(background)
    const screen = render(() => (
      <PopperFixture
        open={open()}
        contentRender={(popper) => (
          <>
            <PopperTrigger context={popper}>Open</PopperTrigger>
            <PopperContent
              context={popper}
              forceMount
              modal={modal()}
              preventScroll={preventScroll()}
            >
              {(context) => (
                <div data-slot="popover-content" {...context.contentProps}>
                  <button type="button" data-testid="sample-first">
                    First
                  </button>
                  <button type="button" data-testid="sample-second">
                    Second
                  </button>
                </div>
              )}
            </PopperContent>
          </>
        )}
      />
    ))
    try {
      const second = document.body.querySelector<HTMLButtonElement>(
        '[data-testid="sample-second"]',
      )!
      await waitFor(() => expect(background.getAttribute('aria-hidden')).toBe('true'))
      second.focus()
      setPreventScroll(true)
      await Promise.resolve()
      expect(document.activeElement).toBe(second)
      setModal(false)
      await Promise.resolve()
      expect(background.getAttribute('aria-hidden')).toBe('true')
      expect(document.body.style.overflow).toBe('hidden')

      setOpen(false)
      await finishExitMotion()
      await waitFor(() => expect(document.body.style.overflow).toBe(''))
      expect(background.hasAttribute('aria-hidden')).toBe(false)
      setOpen(true)
      await waitFor(() => expect(document.body.style.overflow).toBe('hidden'))
      expect(background.hasAttribute('aria-hidden')).toBe(false)
      setPreventScroll(false)
      expect(document.body.style.overflow).toBe('hidden')
      setOpen(false)
      await finishExitMotion()
      await waitFor(() => expect(document.body.style.overflow).toBe(''))
      setOpen(true)
      await Promise.resolve()
      expect(document.body.style.overflow).toBe('')
    } finally {
      screen.unmount()
      background.remove()
    }
  })

  test('isolates background content while a modal popper is open', async () => {
    const background = document.createElement('main')
    document.body.append(background)
    const screen = render(() => (
      <PopperFixture
        defaultOpen
        contentRender={(popper) => (
          <>
            <PopperTrigger context={popper} type="button">
              Open
            </PopperTrigger>
            <PopperContent context={popper} modal>
              {(context) => (
                <div data-slot="popover-content" {...context.contentProps}>
                  Content
                </div>
              )}
            </PopperContent>
          </>
        )}
      />
    ))

    await Promise.resolve()
    await Promise.resolve()
    expect(background.getAttribute('aria-hidden')).toBe('true')

    screen.unmount()
    expect(background.hasAttribute('aria-hidden')).toBe(false)
    background.remove()
  })

  test('reports the resolved placement when placement options change', async () => {
    const [placement, setPlacement] = createSignal<'top' | 'right'>('top')
    render(() => (
      <PopperFixture
        open
        contentRender={(popper) => (
          <>
            <PopperTrigger context={popper} type="button">
              Open
            </PopperTrigger>
            <PopperContent
              context={popper}
              placement={placement()}
              align={placement() === 'right' ? 'end' : 'center'}
              flip={false}
              slide={false}
            >
              {(context) => (
                <div data-slot="popover-content" {...context.contentProps}>
                  <span data-testid="placement">{context.currentPlacement()}</span>
                </div>
              )}
            </PopperContent>
          </>
        )}
      />
    ))

    await waitFor(() => {
      expect(document.body.querySelector('[data-testid="placement"]')?.textContent).toBe('top')
    })

    setPlacement('right')

    await waitFor(() => {
      expect(document.body.querySelector('[data-testid="placement"]')?.textContent).toBe(
        'right-end',
      )
    })
  })

  test('reuses the same content element through a rapid close and reopen', async () => {
    const [open, setOpen] = createSignal(true)
    render(() => (
      <PopperFixture
        open={open()}
        contentRender={(popper) => (
          <>
            <PopperTrigger context={popper} type="button">
              Open
            </PopperTrigger>
            <PopperContent context={popper}>
              {(context) => (
                <div data-slot="popover-content" {...context.contentProps}>
                  Content
                </div>
              )}
            </PopperContent>
          </>
        )}
      />
    ))

    const content = await waitFor(() => {
      const element = document.body.querySelector('[data-slot="popover-content"]')
      expect(element).not.toBeNull()
      return element!
    })
    setOpen(false)
    await Promise.resolve()
    setOpen(true)

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="popover-content"]')).toBe(content)
      expect(content.hasAttribute('data-expanded')).toBe(true)
    })
  })

  test('positions without ResizeObserver support', async () => {
    const resizeObserverDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'ResizeObserver')
    Reflect.deleteProperty(globalThis, 'ResizeObserver')
    const screen = render(() => (
      <PopperFixture
        defaultOpen
        contentRender={(popper) => (
          <>
            <PopperTrigger context={popper} type="button">
              Open
            </PopperTrigger>
            <PopperContent context={popper}>
              {(context) => <div {...context.contentProps}>Content</div>}
            </PopperContent>
          </>
        )}
      />
    ))

    await waitFor(() => {
      expect(
        document.body
          .querySelector('[data-slot="popover-positioner"]')
          ?.hasAttribute('data-positioned'),
      ).toBe(true)
    })

    screen.unmount()
    if (resizeObserverDescriptor) {
      Object.defineProperty(globalThis, 'ResizeObserver', resizeObserverDescriptor)
    }
  })

  test('releases modal resources when conditional content unmounts', async () => {
    const [showContent, setShowContent] = createSignal(true)
    const onEscapeKeyDown = vi.fn()
    render(() => (
      <PopperFixture
        defaultOpen
        contentRender={(popper) => (
          <>
            <PopperTrigger context={popper} type="button">
              Open
            </PopperTrigger>
            <Show when={showContent()}>
              <PopperContent context={popper} modal onEscapeKeyDown={onEscapeKeyDown}>
                {(context) => (
                  <div data-slot="popover-content" {...context.contentProps}>
                    Content
                  </div>
                )}
              </PopperContent>
            </Show>
          </>
        )}
      />
    ))

    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden')
    })

    setShowContent(false)

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="popover-content"]')).toBeNull()
      expect(document.body.style.overflow).toBe('')
    })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onEscapeKeyDown).not.toHaveBeenCalled()
  })

  test('retargets positioning when the trigger is replaced', async () => {
    const [useFirstTrigger, setUseFirstTrigger] = createSignal(true)
    render(() => (
      <PopperFixture
        open
        contentRender={(popper) => (
          <>
            <Show
              when={useFirstTrigger()}
              fallback={
                <PopperTrigger
                  context={popper}
                  ref={(element) => {
                    if (!element) {
                      return
                    }
                    element.getBoundingClientRect = () => ({
                      bottom: 50,
                      height: 10,
                      left: 110,
                      right: 120,
                      top: 40,
                      width: 10,
                      x: 110,
                      y: 40,
                      toJSON: () => undefined,
                    })
                  }}
                  type="button"
                >
                  Second
                </PopperTrigger>
              }
            >
              <PopperTrigger
                context={popper}
                ref={(element) => {
                  if (!element) {
                    return
                  }
                  element.getBoundingClientRect = () => ({
                    bottom: 20,
                    height: 10,
                    left: 10,
                    right: 20,
                    top: 10,
                    width: 10,
                    x: 10,
                    y: 10,
                    toJSON: () => undefined,
                  })
                }}
                type="button"
              >
                First
              </PopperTrigger>
            </Show>
            <PopperContent
              context={popper}
              placement="bottom"
              align="start"
              flip={false}
              slide={false}
            >
              {(context) => <div {...context.contentProps}>Content</div>}
            </PopperContent>
          </>
        )}
      />
    ))

    const positioner = document.body.querySelector(
      '[data-slot="popover-positioner"]',
    ) as HTMLElement
    await waitFor(() => {
      expect(positioner.style.transform).toBe('translate3d(10px, 20px, 0px)')
    })

    setUseFirstTrigger(false)

    await waitFor(() => {
      expect(positioner.style.transform).toBe('translate3d(110px, 50px, 0px)')
    })
  })

  test('rejects invalid fallback placements with a descriptive error', () => {
    expect(() =>
      render(() => (
        <PopperFixture
          defaultOpen
          contentRender={(popper) => (
            <>
              <PopperTrigger context={popper} type="button">
                Open
              </PopperTrigger>
              <PopperContent context={popper} flip="bottom sideways">
                {(context) => <div {...context.contentProps}>Content</div>}
              </PopperContent>
            </>
          )}
        />
      )),
    ).toThrow('`flip` expects a space-delimited list of placements')
  })
})

describe('Popper native event composition', () => {
  test('lets a reactive click handler cancel hover-mode activation', () => {
    const [cancel, setCancel] = createSignal(true)
    const changes = vi.fn()
    const events: MouseEvent[] = []
    const screen = render(() => (
      <Popover mode="hover" onOpenChange={changes}>
        <Popover.Trigger
          onClick={[
            (blocked, event) => {
              events.push(event)
              if (blocked) {
                event.preventDefault()
              }
            },
            cancel(),
          ]}
        >
          Open
        </Popover.Trigger>
        <Popover.Content>Content</Popover.Content>
      </Popover>
    ))
    const trigger = screen.getByRole('button')
    fireEvent.click(trigger)
    expect(changes).not.toHaveBeenCalled()
    setCancel(false)
    fireEvent.click(trigger)
    expect(changes).toHaveBeenCalledExactlyOnceWith(true)
    expect(events).toHaveLength(2)
    expect(events[0]?.defaultPrevented).toBe(true)
  })

  test('lets content pointer handlers cancel tooltip dismissal', async () => {
    const changes = vi.fn()
    render(() => (
      <Tooltip defaultOpen closeDelay={0} onOpenChange={changes}>
        <Tooltip.Trigger>Open</Tooltip.Trigger>
        <Tooltip.Content
          onPointerLeave={[
            (cancel, event) => {
              if (cancel) {
                event.preventDefault()
              }
            },
            true,
          ]}
        >
          Content
        </Tooltip.Content>
      </Tooltip>
    ))
    const event = new PointerEvent('pointerleave', { pointerType: 'mouse', cancelable: true })
    await waitFor(() => expect(document.querySelector('[role=tooltip]')).not.toBeNull())
    document.querySelector('[role=tooltip]')!.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(changes).not.toHaveBeenCalled()
  })

  test('preserves custom trigger keyboard activation and disabled state', () => {
    const CustomTrigger = (props: JSX.HTMLAttributes<HTMLSpanElement>) => <span {...props} />
    const [disabled, setDisabled] = createSignal(false)
    const changes = vi.fn()
    const ref = vi.fn()
    const screen = render(() => (
      <Popover onOpenChange={changes} disabled={disabled()}>
        <Popover.Trigger as={CustomTrigger} ref={ref}>
          Open
        </Popover.Trigger>
        <Popover.Content>Content</Popover.Content>
      </Popover>
    ))
    const trigger = screen.getByRole('button')
    expect(ref).toHaveBeenCalledExactlyOnceWith(trigger)
    fireEvent.keyDown(trigger, { key: 'Enter' })
    expect(changes).toHaveBeenCalledExactlyOnceWith(true)
    setDisabled(true)
    expect(trigger.getAttribute('aria-disabled')).toBe('true')
    fireEvent.click(trigger)
    expect(changes).toHaveBeenCalledTimes(1)
    screen.unmount()
    expect(ref).toHaveBeenCalledExactlyOnceWith(trigger)
  })
})

describe('Floating component context isolation', () => {
  test.each(['popover', 'tooltip'] as const)(
    'isolates a nested %s from its parent popover',
    async (kind) => {
      const Inner = kind === 'popover' ? Popover : Tooltip
      const outerChanges = vi.fn()
      const innerChanges = vi.fn()
      const screen = render(() => (
        <Popover defaultOpen onOpenChange={outerChanges}>
          <Popover.Trigger>Outer trigger</Popover.Trigger>
          <Popover.Content aria-label="Outer panel">
            <Inner defaultOpen onOpenChange={innerChanges}>
              <Inner.Trigger>Inner trigger</Inner.Trigger>
              <Inner.Content aria-label="Inner panel">Inner content</Inner.Content>
            </Inner>
          </Popover.Content>
        </Popover>
      ))
      const outer = screen.getByRole('button', { name: 'Outer trigger' })
      await waitFor(() =>
        expect(document.querySelector('[aria-label="Inner panel"]')).not.toBeNull(),
      )
      const inner = document.querySelector('[aria-label="Outer panel"] button') as HTMLButtonElement
      expect(
        document.getElementById(outer.getAttribute('aria-controls')!)?.getAttribute('aria-label'),
      ).toBe('Outer panel')
      if (kind === 'popover') {
        expect(inner.getAttribute('aria-controls')).not.toBe(outer.getAttribute('aria-controls'))
        expect(
          document.getElementById(inner.getAttribute('aria-controls')!)?.getAttribute('aria-label'),
        ).toBe('Inner panel')
      } else {
        expect(inner.getAttribute('aria-haspopup')).toBeNull()
        expect(inner.getAttribute('aria-controls')).toBeNull()
        expect(inner.getAttribute('aria-expanded')).toBeNull()
        expect(
          document
            .getElementById(inner.getAttribute('aria-describedby')!)
            ?.getAttribute('aria-label'),
        ).toBe('Inner panel')
      }
      fireEvent.click(inner)
      expect(innerChanges).toHaveBeenCalledExactlyOnceWith(false)
      expect(outerChanges).not.toHaveBeenCalled()
      expect(outer.getAttribute('aria-expanded')).toBe('true')
      screen.unmount()
    },
  )

  test.each(['popover', 'tooltip'] as const)(
    'cancels a %s opening timer when its root unmounts',
    async (kind) => {
      vi.useFakeTimers()
      try {
        const changes = vi.fn()
        const screen = render(() =>
          kind === 'popover' ? (
            <Popover id="pending-popover" mode="hover" openDelay={50} onOpenChange={changes}>
              <Popover.Trigger>Trigger</Popover.Trigger>
              <Popover.Content>Content</Popover.Content>
            </Popover>
          ) : (
            <Tooltip id="pending-tooltip" openDelay={50} onOpenChange={changes}>
              <Tooltip.Trigger>Trigger</Tooltip.Trigger>
              <Tooltip.Content>Content</Tooltip.Content>
            </Tooltip>
          ),
        )
        fireEvent.focus(screen.getByRole('button'))
        screen.unmount()
        await vi.advanceTimersByTimeAsync(100)
        expect(changes).not.toHaveBeenCalled()
        expect(document.getElementById(`pending-${kind}-content`)).toBeNull()
      } finally {
        vi.useRealTimers()
      }
    },
  )

  test('modal popper starts resources after delayed inner content', async () => {
    const [show, setShow] = createSignal(false)
    const [modal, setModal] = createSignal(true)
    const screen = render(() => (
      <PopperFixture
        defaultOpen
        contentRender={(popper) => (
          <>
            <PopperTrigger context={popper}>Open</PopperTrigger>
            <PopperContent context={popper} modal={modal()}>
              {(context) => (
                <Show when={show()}>
                  <div {...context.contentProps} data-testid="delayed-content">
                    <button data-testid="content-action">Action</button>
                  </div>
                </Show>
              )}
            </PopperContent>
          </>
        )}
      />
    ))
    try {
      expect(document.body.style.overflow).toBe('')
      setModal(false)
      setShow(true)
      await waitFor(() => expect(document.body.style.overflow).toBe('hidden'))
      expect(
        document.body
          .querySelector('[data-testid="delayed-content"]')!
          .contains(document.activeElement),
      ).toBe(true)
    } finally {
      screen.unmount()
    }
  })

  test('supports polymorphic trigger element via as prop and opens with keyboard', async () => {
    const screen = render(() => (
      <PopperFixture
        contentRender={(popper) => (
          <>
            <PopperTrigger as="div" context={popper} data-testid="poly-trigger">
              Open
            </PopperTrigger>
            <PopperContent context={popper}>
              <div data-testid="poly-content">Popper content</div>
            </PopperContent>
          </>
        )}
      />
    ))
    try {
      const trigger = screen.getByTestId('poly-trigger')
      expect(trigger.tagName.toLowerCase()).toBe('div')
      expect(trigger.getAttribute('role')).toBe('button')
      expect(trigger.getAttribute('tabindex')).toBe('0')

      // Press Enter to open
      trigger.focus()
      fireEvent.keyDown(trigger, { key: 'Enter' })
      await waitFor(() =>
        expect(document.querySelector('[data-testid="poly-content"]')?.textContent).toBe(
          'Popper content',
        ),
      )
      expect(trigger.getAttribute('aria-expanded')).toBe('true')

      // Press Enter to close
      fireEvent.keyDown(trigger, { key: 'Enter' })
      await waitFor(() => expect(document.querySelector('[data-testid="poly-content"]')).toBeNull())
      expect(trigger.getAttribute('aria-expanded')).toBe('false')

      // Press Space (keydown arms, keyup dispatches click) to open
      fireEvent.keyDown(trigger, { key: ' ' })
      fireEvent.keyUp(trigger, { key: ' ' })
      await waitFor(() =>
        expect(document.querySelector('[data-testid="poly-content"]')?.textContent).toBe(
          'Popper content',
        ),
      )
      expect(trigger.getAttribute('aria-expanded')).toBe('true')

      // Press Space to close
      fireEvent.keyDown(trigger, { key: ' ' })
      fireEvent.keyUp(trigger, { key: ' ' })
      await waitFor(() => expect(document.querySelector('[data-testid="poly-content"]')).toBeNull())
      expect(trigger.getAttribute('aria-expanded')).toBe('false')
    } finally {
      screen.unmount()
    }
  })
})
