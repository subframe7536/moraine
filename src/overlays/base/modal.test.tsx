import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { Show, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { ModalContent, ModalRoot, ModalTrigger } from './modal.tsx'
import { pushOverlayLayer } from './overlay-stack.ts'
import type { OverlayTriggerProps } from './trigger.ts'

describe('Modal primitives', () => {
  test('forwards an explicit accessible name to modal content', () => {
    render(() => (
      <ModalRoot defaultOpen hasOverlay={false} hasContent>
        <ModalContent ariaLabel="Named modal" contentRender={<span>Content</span>} />
      </ModalRoot>
    ))

    expect(document.body.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe(
      'Named modal',
    )
  })

  test('does not acquire modal resources when an open root has no surfaces', async () => {
    document.body.style.overflow = 'auto'
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <ModalRoot defaultOpen onOpenChange={onOpenChange} hasOverlay={false} hasContent={false} />
    ))
    await Promise.resolve()

    await fireEvent.keyDown(document, { key: 'Escape' })

    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
    expect(document.body.style.overflow).toBe('auto')
    expect(onOpenChange).not.toHaveBeenCalled()
    screen.unmount()
    document.body.style.overflow = ''
  })

  test('aria-hides background siblings while modal content is present and restores them on cleanup', async () => {
    const background = document.createElement('main')
    background.textContent = 'Application'
    document.body.append(background)
    const screen = render(() => (
      <ModalRoot defaultOpen hasOverlay={false} hasContent>
        <ModalContent contentRender={<span>Content</span>} />
      </ModalRoot>
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
        <ModalRoot defaultOpen hasOverlay={false} hasContent>
          <ModalContent contentRender={<span data-testid="outer-content">Outer</span>} />
        </ModalRoot>
        <Show when={showInner()}>
          <ModalRoot defaultOpen hasOverlay={false} hasContent>
            <ModalContent contentRender={<span data-testid="inner-content">Inner</span>} />
          </ModalRoot>
        </Show>
      </>
    ))
    await Promise.resolve()
    await Promise.resolve()
    const outerContent = document.body
      .querySelector('[data-testid="outer-content"]')
      ?.closest('[data-slot="content"]') as HTMLElement
    const outerPortal = outerContent.parentElement!

    expect(background.getAttribute('aria-hidden')).toBe('true')
    expect(outerPortal.getAttribute('aria-hidden')).toBe('true')

    const lateSibling = document.createElement('aside')
    document.body.append(lateSibling)
    await Promise.resolve()
    expect(lateSibling.getAttribute('aria-hidden')).toBe('true')

    setShowInner(false)
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
      <ModalRoot defaultOpen hasOverlay={false} hasContent>
        <ModalContent contentRender={<span>Outer</span>} />
      </ModalRoot>
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

  test('reference-counts scroll locking with scrollbar compensation and exact style restoration', async () => {
    const innerWidthDescriptor = Object.getOwnPropertyDescriptor(window, 'innerWidth')
    const clientWidthDescriptor = Object.getOwnPropertyDescriptor(
      document.documentElement,
      'clientWidth',
    )
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 })
    Object.defineProperty(document.documentElement, 'clientWidth', {
      configurable: true,
      value: 980,
    })
    document.body.style.overflow = 'auto'
    document.body.style.paddingRight = '4px'
    const [showInner, setShowInner] = createSignal(true)
    const screen = render(() => (
      <>
        <ModalRoot defaultOpen hasOverlay={false} hasContent>
          <ModalContent contentRender={<span>Outer</span>} />
        </ModalRoot>
        <Show when={showInner()}>
          <ModalRoot defaultOpen hasOverlay={false} hasContent>
            <ModalContent contentRender={<span>Inner</span>} />
          </ModalRoot>
        </Show>
      </>
    ))
    await Promise.resolve()

    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.style.paddingRight).toBe('24px')

    setShowInner(false)
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.style.paddingRight).toBe('24px')

    screen.unmount()
    expect(document.body.style.overflow).toBe('auto')
    expect(document.body.style.paddingRight).toBe('4px')

    if (innerWidthDescriptor) {
      Object.defineProperty(window, 'innerWidth', innerWidthDescriptor)
    }
    if (clientWidthDescriptor) {
      Object.defineProperty(document.documentElement, 'clientWidth', clientWidthDescriptor)
    } else {
      Reflect.deleteProperty(document.documentElement, 'clientWidth')
    }
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
  })

  test('prevents the handled Escape event when dismissing the top modal', async () => {
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <ModalRoot defaultOpen onOpenChange={onOpenChange} hasOverlay={false} hasContent>
        <ModalContent contentRender={<span>Content</span>} />
      </ModalRoot>
    ))
    await Promise.resolve()
    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement
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

  test('does not dismiss or report prevention for an outside right-click', async () => {
    const outside = document.createElement('button')
    document.body.append(outside)
    const onOpenChange = vi.fn()
    const onClosePrevent = vi.fn()
    const screen = render(() => (
      <ModalRoot
        defaultOpen
        onOpenChange={onOpenChange}
        onClosePrevent={onClosePrevent}
        hasOverlay={false}
        hasContent
      >
        <ModalContent contentRender={<span>Content</span>} />
      </ModalRoot>
    ))
    await Promise.resolve()

    await fireEvent.pointerDown(outside, { button: 2 })

    expect(onOpenChange).not.toHaveBeenCalled()
    expect(onClosePrevent).not.toHaveBeenCalled()
    expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
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
        <ModalRoot open onOpenChange={onOpenChange} hasOverlay={false} hasContent>
          <ModalContent
            contentRender={
              <button
                type="button"
                data-testid="inside"
                onKeyDown={(event) => event.preventDefault()}
              >
                Inside
              </button>
            }
          />
        </ModalRoot>
      </>
    ))
    await Promise.resolve()

    await fireEvent.pointerDown(screen.getByTestId('outside'))
    await fireEvent.keyDown(document.body.querySelector('[data-testid="inside"]')!, {
      key: 'Escape',
    })

    expect(onOpenChange).not.toHaveBeenCalled()
    screen.unmount()
  })

  test('recovers escaped focus to the last focused element inside the top modal', async () => {
    const outside = document.createElement('button')
    document.body.append(outside)
    const screen = render(() => (
      <ModalRoot defaultOpen hasOverlay={false} hasContent>
        <ModalContent
          contentRender={
            <>
              <button type="button" data-testid="first">
                First
              </button>
              <button type="button" data-testid="second">
                Second
              </button>
            </>
          }
        />
      </ModalRoot>
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

  test('restores the previously focused element when an open modal has no trigger', async () => {
    const previous = document.createElement('button')
    document.body.append(previous)
    previous.focus()
    const screen = render(() => (
      <ModalRoot defaultOpen hasOverlay={false} hasContent>
        <ModalContent
          contentRender={(context) => (
            <button type="button" data-testid="close" onClick={context.close}>
              Close
            </button>
          )}
        />
      </ModalRoot>
    ))
    await Promise.resolve()
    await Promise.resolve()

    await fireEvent.click(document.body.querySelector('[data-testid="close"]')!)
    const content = document.body.querySelector('[data-slot="content"]')!
    await fireEvent.animationEnd(content)
    await fireEvent.transitionEnd(content)

    await waitFor(() => {
      expect(document.activeElement).toBe(previous)
    })
    screen.unmount()
    previous.remove()
  })

  test('restores nested modal focus in stack order', async () => {
    const screen = render(() => (
      <ModalRoot hasOverlay={false} hasContent>
        <ModalTrigger
          children={(props) => (
            <button {...props} type="button" data-testid="outer-trigger">
              Open outer
            </button>
          )}
        />
        <ModalContent
          contentRender={(outerContext) => (
            <>
              <button type="button" data-testid="outer-close" onClick={outerContext.close}>
                Close outer
              </button>
              <ModalRoot hasOverlay={false} hasContent>
                <ModalTrigger
                  children={(props) => (
                    <button {...props} type="button" data-testid="inner-trigger">
                      Open inner
                    </button>
                  )}
                />
                <ModalContent
                  contentRender={(innerContext) => (
                    <button type="button" data-testid="inner-close" onClick={innerContext.close}>
                      Close inner
                    </button>
                  )}
                />
              </ModalRoot>
            </>
          )}
        />
      </ModalRoot>
    ))

    const outerTrigger = screen.getByTestId('outer-trigger')
    await fireEvent.click(outerTrigger)
    await Promise.resolve()
    const innerTrigger = document.body.querySelector(
      '[data-testid="inner-trigger"]',
    ) as HTMLButtonElement
    await fireEvent.click(innerTrigger)
    await Promise.resolve()

    await fireEvent.click(document.body.querySelector('[data-testid="inner-close"]')!)
    const innerContent = document.body.querySelectorAll('[data-slot="content"]')[1]!
    await fireEvent.animationEnd(innerContent)
    await fireEvent.transitionEnd(innerContent)
    await waitFor(() => {
      expect(document.activeElement).toBe(innerTrigger)
    })

    await fireEvent.click(document.body.querySelector('[data-testid="outer-close"]')!)
    const outerContent = document.body.querySelector('[data-slot="content"]')!
    await fireEvent.animationEnd(outerContent)
    await fireEvent.transitionEnd(outerContent)
    await waitFor(() => {
      expect(document.activeElement).toBe(outerTrigger)
    })
    screen.unmount()
  })

  test('focuses the first enabled control and loops Tab at both content boundaries', async () => {
    const screen = render(() => (
      <ModalRoot defaultOpen hasOverlay={false} hasContent>
        <ModalContent
          contentRender={
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
          }
        />
      </ModalRoot>
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

  test('does not restore focus to a trigger that became disabled while open', async () => {
    const [disabled, setDisabled] = createSignal(false)
    const screen = render(() => (
      <ModalRoot hasOverlay={false} hasContent>
        <ModalTrigger
          children={(props) => (
            <button {...props} type="button" disabled={disabled()} data-testid="trigger">
              Open
            </button>
          )}
        />
        <ModalContent
          contentRender={(context) => (
            <button type="button" data-testid="close-disabled" onClick={context.close}>
              Close
            </button>
          )}
        />
      </ModalRoot>
    ))
    const trigger = screen.getByTestId('trigger') as HTMLButtonElement
    await fireEvent.click(trigger)
    await Promise.resolve()
    setDisabled(true)

    await fireEvent.click(document.body.querySelector('[data-testid="close-disabled"]')!)
    const content = document.body.querySelector('[data-slot="content"]')!
    await fireEvent.animationEnd(content)
    await fireEvent.transitionEnd(content)
    await Promise.resolve()

    expect(document.activeElement).not.toBe(trigger)
    screen.unmount()
  })

  test('does not restore focus to a trigger removed while open', async () => {
    const [showTrigger, setShowTrigger] = createSignal(true)
    const screen = render(() => (
      <ModalRoot hasOverlay={false} hasContent>
        <Show when={showTrigger()}>
          <ModalTrigger
            children={(props) => (
              <button {...props} type="button" data-testid="removable-trigger">
                Open
              </button>
            )}
          />
        </Show>
        <ModalContent
          contentRender={(context) => (
            <button type="button" data-testid="close-removed" onClick={context.close}>
              Close
            </button>
          )}
        />
      </ModalRoot>
    ))
    const trigger = screen.getByTestId('removable-trigger')
    await fireEvent.click(trigger)
    await Promise.resolve()
    setShowTrigger(false)

    await fireEvent.click(document.body.querySelector('[data-testid="close-removed"]')!)
    const content = document.body.querySelector('[data-slot="content"]')!
    await fireEvent.animationEnd(content)
    await fireEvent.transitionEnd(content)
    await Promise.resolve()

    expect(trigger.isConnected).toBe(false)
    expect(document.activeElement).not.toBe(trigger)
    screen.unmount()
  })

  test('cancels stale exit completion and focus restoration on rapid reopen', async () => {
    const [open, setOpen] = createSignal(false)
    const onExitComplete = vi.fn()
    const screen = render(() => (
      <ModalRoot
        open={open()}
        onOpenChange={setOpen}
        onExitComplete={onExitComplete}
        hasOverlay={false}
        hasContent
      >
        <ModalTrigger
          children={(props) => (
            <button {...props} type="button" data-testid="rapid-trigger">
              Open
            </button>
          )}
        />
        <ModalContent
          contentRender={(context) => (
            <button type="button" data-testid="rapid-close" onClick={context.close}>
              Close
            </button>
          )}
        />
      </ModalRoot>
    ))
    const trigger = screen.getByTestId('rapid-trigger')
    await fireEvent.click(trigger)
    await Promise.resolve()
    await fireEvent.click(document.body.querySelector('[data-testid="rapid-close"]')!)

    setOpen(true)
    await Promise.resolve()

    const reopenedContent = document.body.querySelector('[data-slot="content"]') as HTMLElement
    expect(reopenedContent.hasAttribute('data-expanded')).toBe(true)
    expect(onExitComplete).not.toHaveBeenCalled()
    expect(document.activeElement).not.toBe(trigger)

    setOpen(false)
    await fireEvent.animationEnd(reopenedContent)
    await fireEvent.transitionEnd(reopenedContent)
    await waitFor(() => {
      expect(onExitComplete).toHaveBeenCalledOnce()
      expect(document.activeElement).toBe(trigger)
    })
    screen.unmount()
  })

  test('resolves trigger children getter once', () => {
    let childrenReads = 0

    const triggerProps = {
      get children() {
        childrenReads += 1
        return (props: OverlayTriggerProps) => (
          <button {...props} type="button">
            Open
          </button>
        )
      },
    }

    render(() => (
      <ModalRoot hasOverlay={false} hasContent={false}>
        <ModalTrigger {...triggerProps} />
      </ModalRoot>
    ))

    expect(childrenReads).toBe(1)
  })

  test('does not instantiate closed content and mounts it once after opening', async () => {
    let instances = 0

    render(() => (
      <ModalRoot hasOverlay={false} hasContent>
        <ModalTrigger
          children={(props) => (
            <button {...props} type="button">
              Open
            </button>
          )}
        />
        <Show when={true}>
          <ModalContent
            contentRender={() => {
              instances += 1
              return <span>Content</span>
            }}
          />
        </Show>
      </ModalRoot>
    ))

    expect(instances).toBe(0)
    await fireEvent.click(document.querySelector('[data-slot="trigger"]')!)

    await waitFor(() => {
      expect(instances).toBe(1)
      expect(document.body.textContent).toContain('Content')
    })
  })
})
