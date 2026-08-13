import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { Show, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { Modal } from './modal.tsx'
import { pushOverlayLayer } from './overlay-stack.ts'
import type { OverlayTriggerProps } from './trigger.ts'
import { getFocusableElements } from './utils.ts'

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve: (() => void) | undefined
  const promise = new Promise<void>((nextResolve) => {
    resolve = nextResolve
  })

  return { promise, resolve: () => resolve?.() }
}

describe('Modal primitives', () => {
  test('forwards an explicit accessible name to modal content', () => {
    render(() => (
      <Modal defaultOpen>
        <Modal.Content ariaLabel="Named modal" contentRender={<span>Content</span>} />
      </Modal>
    ))

    expect(document.body.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe(
      'Named modal',
    )
  })

  test('does not acquire modal resources when an open root has no surfaces', async () => {
    document.body.style.overflow = 'auto'
    const onOpenChange = vi.fn()
    const screen = render(() => <Modal defaultOpen onOpenChange={onOpenChange} />)
    await Promise.resolve()

    await fireEvent.keyDown(document, { key: 'Escape' })

    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
    expect(document.body.style.overflow).toBe('auto')
    expect(onOpenChange).not.toHaveBeenCalled()
    screen.unmount()
    document.body.style.overflow = ''
  })

  test('lets content overlay activate the modal runtime', async () => {
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <Modal defaultOpen onOpenChange={onOpenChange}>
        <Modal.Content overlay contentRender={<span>Content</span>} />
      </Modal>
    ))
    await Promise.resolve()

    expect(document.body.querySelector('[data-slot="overlay"]')).not.toBeNull()
    expect(document.body.style.overflow).toBe('hidden')

    await fireEvent.keyDown(document, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    screen.unmount()
  })

  test('applies the shared dialog overlay classes by default', () => {
    render(() => (
      <Modal defaultOpen>
        <Modal.Content overlay contentRender={<span>Content</span>} />
      </Modal>
    ))

    const overlay = document.body.querySelector('[data-slot="overlay"]')
    expect(overlay?.className).toContain('bg-black/10')
    expect(overlay?.className).toContain('duration-150')
    expect(overlay?.className).toContain('inset-0')
    expect(overlay?.className).toContain('fixed')
    expect(overlay?.className).toContain('z-50')
    expect(overlay?.className).toContain('backdrop-blur-xs')
    expect(overlay?.className).toContain('data-closed:animate-overlay-out')
    expect(overlay?.className).toContain('data-expanded:animate-overlay-in')
  })

  test('applies the default popup transition classes to custom modal content', () => {
    render(() => (
      <Modal defaultOpen>
        <Modal.Content contentRender={<span>Content</span>} />
      </Modal>
    ))

    const content = document.body.querySelector('[data-slot="content"]')
    expect(content?.className).toContain('outline-none')
    expect(content?.className).toContain('w-full')
    expect(content?.className).toContain('z-50')
    expect(content?.className).toContain('data-closed:animate-popup-out')
    expect(content?.className).toContain('data-expanded:animate-popup-in')
  })

  test('replaces the default content classes when a custom class is provided', () => {
    render(() => (
      <Modal defaultOpen>
        <Modal.Content class="custom-content" contentRender={<span>Content</span>} />
      </Modal>
    ))

    const content = document.body.querySelector('[data-slot="content"]')
    expect(content?.className).toBe('custom-content')
  })

  test('shares data attributes and waits for both surfaces before exiting', async () => {
    const [open, setOpen] = createSignal(true)
    const onExitComplete = vi.fn()
    const screen = render(() => (
      <Modal open={open()} onOpenChange={setOpen} onExitComplete={onExitComplete}>
        <Modal.Content overlay contentRender={<span>Content</span>} />
      </Modal>
    ))

    const overlay = document.body.querySelector('[data-slot="overlay"]') as HTMLElement
    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement
    const overlayAnimation = deferred()
    const contentAnimation = deferred()

    Object.defineProperty(overlay, 'getAnimations', {
      configurable: true,
      value: () => [{ finished: overlayAnimation.promise }],
    })
    Object.defineProperty(content, 'getAnimations', {
      configurable: true,
      value: () => [{ finished: contentAnimation.promise }],
    })

    expect(overlay.getAttribute('data-expanded')).toBe('')
    expect(content.getAttribute('data-expanded')).toBe('')

    setOpen(false)
    expect(overlay.getAttribute('data-closed')).toBe('')
    expect(content.getAttribute('data-closed')).toBe('')

    contentAnimation.resolve()
    await Promise.resolve()
    expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    expect(onExitComplete).not.toHaveBeenCalled()

    overlayAnimation.resolve()
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
      expect(document.body.querySelector('[data-slot="overlay"]')).toBeNull()
      expect(onExitComplete).toHaveBeenCalledOnce()
    })
    screen.unmount()
  })

  test('does not call onExitComplete when Content is removed while open', async () => {
    const [showContent, setShowContent] = createSignal(true)
    const onExitComplete = vi.fn()
    const screen = render(() => (
      <Modal open onExitComplete={onExitComplete}>
        <Show when={showContent()}>
          <Modal.Content contentRender={<span>Content</span>} />
        </Show>
      </Modal>
    ))

    setShowContent(false)
    await Promise.resolve()

    expect(onExitComplete).not.toHaveBeenCalled()
    screen.unmount()
  })

  test('does not render an overlay by default', () => {
    render(() => (
      <Modal defaultOpen>
        <Modal.Content contentRender={<span>Content</span>} />
      </Modal>
    ))

    expect(document.body.querySelector('[data-slot="overlay"]')).toBeNull()
    expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
  })

  test('renders overlay and content as siblings in one portal and forwards refs', () => {
    const overlayRef = vi.fn()
    const contentRef = vi.fn()

    const screen = render(() => (
      <Modal defaultOpen>
        <Modal.Content
          overlay
          overlayRef={overlayRef}
          overlayClass="custom-overlay"
          overlayStyle={{ opacity: '0.4' }}
          ref={contentRef}
          contentRender={<span>Content</span>}
        />
      </Modal>
    ))

    const overlay = document.body.querySelector('[data-slot="overlay"]')
    const content = document.body.querySelector('[data-slot="content"]')

    expect(overlay).not.toBeNull()
    expect(content).not.toBeNull()
    expect(overlay?.parentElement).toBe(content?.parentElement)
    expect(overlay?.nextElementSibling).toBe(content)
    expect(overlay?.className).toContain('custom-overlay')
    expect(overlay?.getAttribute('style')).toContain('opacity: 0.4')
    expect(overlayRef).toHaveBeenCalledWith(overlay)
    expect(contentRef).toHaveBeenCalledWith(content)

    screen.unmount()
    expect(overlayRef).toHaveBeenLastCalledWith(undefined)
    expect(contentRef).toHaveBeenLastCalledWith(undefined)
  })

  test('aria-hides background siblings while modal content is present and restores them on cleanup', async () => {
    const background = document.createElement('main')
    background.textContent = 'Application'
    document.body.append(background)
    const screen = render(() => (
      <Modal defaultOpen>
        <Modal.Content contentRender={<span>Content</span>} />
      </Modal>
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
        <Modal defaultOpen>
          <Modal.Content contentRender={<span data-testid="outer-content">Outer</span>} />
        </Modal>
        <Show when={showInner()}>
          <Modal defaultOpen>
            <Modal.Content contentRender={<span data-testid="inner-content">Inner</span>} />
          </Modal>
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
      <Modal defaultOpen>
        <Modal.Content contentRender={<span>Outer</span>} />
      </Modal>
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
        <Modal defaultOpen>
          <Modal.Content contentRender={<span>Outer</span>} />
        </Modal>
        <Show when={showInner()}>
          <Modal defaultOpen>
            <Modal.Content contentRender={<span>Inner</span>} />
          </Modal>
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
      <Modal defaultOpen onOpenChange={onOpenChange}>
        <Modal.Content contentRender={<span>Content</span>} />
      </Modal>
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

  test('ignores Escape while an IME composition is active', async () => {
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <Modal defaultOpen onOpenChange={onOpenChange}>
        <Modal.Content contentRender={<input data-testid="editor" />} />
      </Modal>
    ))
    await Promise.resolve()
    const editor = document.body.querySelector('[data-testid="editor"]')!

    await fireEvent.compositionStart(editor)
    await fireEvent.keyDown(editor, { key: 'Escape' })
    expect(onOpenChange).not.toHaveBeenCalled()

    await fireEvent.compositionEnd(editor)
    await fireEvent.keyDown(editor, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    screen.unmount()
  })

  test('dismisses a completed touch tap but not touch pointerdown, movement, or multitouch', async () => {
    const outside = document.createElement('button')
    document.body.append(outside)
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <Modal defaultOpen onOpenChange={onOpenChange}>
        <Modal.Content contentRender={<span>Content</span>} />
      </Modal>
    ))
    await Promise.resolve()

    await fireEvent.pointerDown(outside, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 10,
      clientY: 10,
    })
    expect(onOpenChange).not.toHaveBeenCalled()
    await fireEvent.pointerMove(outside, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 30,
      clientY: 10,
    })
    await fireEvent.pointerUp(outside, { pointerId: 1, pointerType: 'touch' })
    expect(onOpenChange).not.toHaveBeenCalled()

    await fireEvent.pointerDown(outside, { pointerId: 2, pointerType: 'touch' })
    await fireEvent.pointerDown(outside, { pointerId: 3, pointerType: 'touch' })
    await fireEvent.pointerUp(outside, { pointerId: 2, pointerType: 'touch' })
    await fireEvent.pointerUp(outside, { pointerId: 3, pointerType: 'touch' })
    expect(onOpenChange).not.toHaveBeenCalled()

    await fireEvent.pointerDown(outside, { pointerId: 4, pointerType: 'touch' })
    await fireEvent.pointerUp(outside, { pointerId: 4, pointerType: 'touch' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    screen.unmount()
    outside.remove()
  })

  test('does not dismiss or report prevention for an outside right-click', async () => {
    const outside = document.createElement('button')
    document.body.append(outside)
    const onOpenChange = vi.fn()
    const onClosePrevent = vi.fn()
    const screen = render(() => (
      <Modal defaultOpen onOpenChange={onOpenChange} onClosePrevent={onClosePrevent}>
        <Modal.Content contentRender={<span>Content</span>} />
      </Modal>
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
        <Modal open onOpenChange={onOpenChange}>
          <Modal.Content
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
        </Modal>
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
      <Modal defaultOpen>
        <Modal.Content
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
      </Modal>
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
      <Modal defaultOpen>
        <Modal.Content
          contentRender={() => (
            <Show when={showButton()} fallback={<span>Remaining content</span>}>
              <button type="button" data-testid="remove" onPointerDown={() => setShowButton(false)}>
                Remove
              </button>
            </Show>
          )}
        />
      </Modal>
    ))
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    const button = document.body.querySelector('[data-testid="remove"]') as HTMLButtonElement
    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement
    button.focus()

    await fireEvent.pointerDown(button, { pointerType: 'mouse' })
    await Promise.resolve()

    expect(document.activeElement).toBe(content)
    screen.unmount()
  })

  test('filters CSS-hidden controls and includes media controls in focus order', () => {
    const container = document.createElement('div')
    container.innerHTML = `
      <button>Visible</button>
      <div style="display: none"><button>Display hidden</button></div>
      <button style="visibility: hidden">Visibility hidden</button>
      <audio controls tabindex="0"></audio>
      <video controls tabindex="0"></video>
    `
    document.body.append(container)

    expect(getFocusableElements(container).map((element) => element.tagName)).toEqual([
      'BUTTON',
      'AUDIO',
      'VIDEO',
    ])
    container.remove()
  })

  test('restores the previously focused element when an open modal has no trigger', async () => {
    const previous = document.createElement('button')
    document.body.append(previous)
    previous.focus()
    const screen = render(() => (
      <Modal defaultOpen>
        <Modal.Content
          contentRender={(context) => (
            <button type="button" data-testid="close" onClick={context.close}>
              Close
            </button>
          )}
        />
      </Modal>
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
      <Modal>
        <Modal.Trigger
          children={(props) => (
            <button {...props} type="button" data-testid="outer-trigger">
              Open outer
            </button>
          )}
        />
        <Modal.Content
          contentRender={(outerContext) => (
            <>
              <button type="button" data-testid="outer-close" onClick={outerContext.close}>
                Close outer
              </button>
              <Modal>
                <Modal.Trigger
                  children={(props) => (
                    <button {...props} type="button" data-testid="inner-trigger">
                      Open inner
                    </button>
                  )}
                />
                <Modal.Content
                  contentRender={(innerContext) => (
                    <button type="button" data-testid="inner-close" onClick={innerContext.close}>
                      Close inner
                    </button>
                  )}
                />
              </Modal>
            </>
          )}
        />
      </Modal>
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
      <Modal defaultOpen>
        <Modal.Content
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
      </Modal>
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
      <Modal>
        <Modal.Trigger
          children={(props) => (
            <button {...props} type="button" disabled={disabled()} data-testid="trigger">
              Open
            </button>
          )}
        />
        <Modal.Content
          contentRender={(context) => (
            <button type="button" data-testid="close-disabled" onClick={context.close}>
              Close
            </button>
          )}
        />
      </Modal>
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
      <Modal>
        <Show when={showTrigger()}>
          <Modal.Trigger
            children={(props) => (
              <button {...props} type="button" data-testid="removable-trigger">
                Open
              </button>
            )}
          />
        </Show>
        <Modal.Content
          contentRender={(context) => (
            <button type="button" data-testid="close-removed" onClick={context.close}>
              Close
            </button>
          )}
        />
      </Modal>
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
      <Modal open={open()} onOpenChange={setOpen} onExitComplete={onExitComplete}>
        <Modal.Trigger
          children={(props) => (
            <button {...props} type="button" data-testid="rapid-trigger">
              Open
            </button>
          )}
        />
        <Modal.Content
          overlay
          contentRender={(context) => (
            <button type="button" data-testid="rapid-close" onClick={context.close}>
              Close
            </button>
          )}
        />
      </Modal>
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
    expect(onExitComplete).not.toHaveBeenCalled()

    const overlay = document.body.querySelector('[data-slot="overlay"]') as HTMLElement
    await fireEvent.animationEnd(overlay)
    await fireEvent.transitionEnd(overlay)
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
      <Modal>
        <Modal.Trigger {...triggerProps} />
      </Modal>
    ))

    expect(childrenReads).toBe(1)
  })

  test('does not instantiate closed content and mounts it once after opening', async () => {
    let instances = 0

    render(() => (
      <Modal>
        <Modal.Trigger
          children={(props) => (
            <button {...props} type="button">
              Open
            </button>
          )}
        />
        <Show when={true}>
          <Modal.Content
            contentRender={() => {
              instances += 1
              return <span>Content</span>
            }}
          />
        </Show>
      </Modal>
    ))

    expect(instances).toBe(0)
    await fireEvent.click(document.querySelector('[data-slot="trigger"]')!)

    await waitFor(() => {
      expect(instances).toBe(1)
      expect(document.body.textContent).toContain('Content')
    })
  })
})
