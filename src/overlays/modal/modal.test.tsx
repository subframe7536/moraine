import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { Show, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { Button } from '../../elements/button/index.ts'
import { pushOverlayLayer } from '../base/overlay-stack.ts'
import { getFocusableElements } from '../base/utils.ts'

import { ModalTriggerRenderer } from './modal-trigger.tsx'
import { Modal } from './modal.tsx'

describe('Modal primitives', () => {
  test('forwards flat callback trigger props and honors canceled clicks', async () => {
    const onOpenChange = vi.fn()
    const onClick = vi.fn((event: MouseEvent) => event.preventDefault())
    let triggerElement: HTMLElement | undefined
    const screen = render(() => (
      <Modal onOpenChange={onOpenChange}>
        <ModalTriggerRenderer
          class="flat-trigger"
          style={{ color: 'red' }}
          ref={(element) => (triggerElement = element)}
          onClick={onClick}
        >
          {(props) => (
            <button {...props} type="button">
              Open modal
            </button>
          )}
        </ModalTriggerRenderer>
        <Modal.Content contentRender={<span>Content</span>} />
      </Modal>
    ))
    const trigger = screen.getByRole('button', { name: 'Open modal' })

    expect(trigger).toBe(triggerElement)
    expect(trigger.className).toBe('flat-trigger')
    expect(trigger.style.color).toBe('red')
    expect(trigger.getAttribute('data-slot')).toBe('trigger')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(trigger)

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    screen.unmount()
  })

  test('renders a native button trigger with Modal accessibility state', async () => {
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <Modal onOpenChange={onOpenChange}>
        <Modal.Trigger data-testid="trigger">Open modal</Modal.Trigger>
        <Modal.Content contentRender={<span>Content</span>} />
      </Modal>
    ))
    const trigger = screen.getByTestId<HTMLButtonElement>('trigger')

    expect(trigger.tagName).toBe('BUTTON')
    expect(trigger.type).toBe('button')
    expect(trigger.getAttribute('data-slot')).toBe('trigger')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.hasAttribute('aria-controls')).toBe(false)

    fireEvent.click(trigger)

    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(document.getElementById(trigger.getAttribute('aria-controls')!)).not.toBeNull()
    screen.unmount()
  })

  test('respects disabled and canceled trigger activation', async () => {
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <>
        <Modal onOpenChange={onOpenChange}>
          <Modal.Trigger disabled data-testid="disabled-trigger">
            Disabled
          </Modal.Trigger>
          <Modal.Content contentRender={<span>Disabled content</span>} />
        </Modal>
        <Modal onOpenChange={onOpenChange}>
          <Modal.Trigger onClick={(event) => event.preventDefault()} data-testid="canceled-trigger">
            Canceled
          </Modal.Trigger>
          <Modal.Content contentRender={<span>Canceled content</span>} />
        </Modal>
      </>
    ))

    fireEvent.click(screen.getByTestId('disabled-trigger'))
    fireEvent.click(screen.getByTestId('canceled-trigger'))

    expect(onOpenChange).not.toHaveBeenCalled()
    expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    screen.unmount()
  })

  test('supports non-native and Button trigger roots', async () => {
    let triggerElement: HTMLElement | undefined
    const screen = render(() => (
      <>
        <Modal>
          <Modal.Trigger
            as="div"
            ref={(element) => (triggerElement = element)}
            data-testid="div-trigger"
          >
            Open with keyboard
          </Modal.Trigger>
          <Modal.Content contentRender={<span>Div content</span>} />
        </Modal>
        <Modal>
          <Modal.Trigger as={Button} variant="outline" data-testid="button-trigger">
            Open with Button
          </Modal.Trigger>
          <Modal.Content contentRender={<span>Button content</span>} />
        </Modal>
      </>
    ))
    const divTrigger = screen.getByTestId('div-trigger')
    const buttonTrigger = screen.getByTestId('button-trigger')

    expect(divTrigger.getAttribute('role')).toBe('button')
    expect(divTrigger.getAttribute('tabindex')).toBe('0')
    expect(triggerElement).toBe(divTrigger)
    expect(buttonTrigger.tagName).toBe('BUTTON')
    expect(buttonTrigger.className).toContain('border')

    fireEvent.keyDown(divTrigger, { key: 'Enter' })

    expect(document.body.textContent).toContain('Div content')
    screen.unmount()
  })

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

    fireEvent.keyDown(document, { key: 'Escape' })

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

    fireEvent.keyDown(document, { key: 'Escape' })
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
    expect(overlay?.className).not.toContain('duration-150')
    expect(overlay?.className).toContain('inset-0')
    expect(overlay?.className).toContain('fixed')
    expect(overlay?.className).toContain('z-floating')
    expect(overlay?.className).toContain('supports-[backdrop-filter]:backdrop-blur-xs')
    expect(overlay?.className).not.toContain('supports-backdrop-filter:backdrop-blur-xs')
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
    expect(content?.className).toContain('z-floating')
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
    expect(overlay.getAttribute('data-expanded')).toBe('')
    expect(content.getAttribute('data-expanded')).toBe('')

    setOpen(false)
    expect(overlay.getAttribute('data-closed')).toBe('')
    expect(content.getAttribute('data-closed')).toBe('')

    await Promise.resolve()
    fireEvent.animationEnd(content)
    expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    expect(onExitComplete).not.toHaveBeenCalled()

    fireEvent.animationEnd(overlay)
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

  test('can contain the content inside a scrolling overlay', () => {
    render(() => (
      <Modal defaultOpen>
        <Modal.Content overlay overlayScroll contentRender={<span>Content</span>} />
      </Modal>
    ))

    const overlay = document.body.querySelector('[data-slot="overlay"]')
    const content = document.body.querySelector('[data-slot="content"]')

    expect(overlay?.contains(content ?? null)).toBe(true)
    expect(overlay?.className).toContain('overflow-y-auto')
    expect(overlay?.className).toContain('p-4')
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

    fireEvent.compositionStart(editor)
    fireEvent.keyDown(editor, { key: 'Escape' })
    expect(onOpenChange).not.toHaveBeenCalled()

    fireEvent.compositionEnd(editor)
    fireEvent.keyDown(editor, { key: 'Escape' })
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
    const onClosePrevent = vi.fn()
    const screen = render(() => (
      <Modal defaultOpen onOpenChange={onOpenChange} onClosePrevent={onClosePrevent}>
        <Modal.Content contentRender={<span>Content</span>} />
      </Modal>
    ))
    await Promise.resolve()

    fireEvent.pointerDown(outside, { button: 2 })

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

    fireEvent.pointerDown(button, { pointerType: 'mouse' })
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

    fireEvent.click(document.body.querySelector('[data-testid="close"]')!)
    await Promise.resolve()
    const content = document.body.querySelector('[data-slot="content"]')!
    fireEvent.animationEnd(content)
    fireEvent.transitionEnd(content)

    await waitFor(() => {
      expect(document.activeElement).toBe(previous)
    })
    screen.unmount()
    previous.remove()
  })

  test('restores nested modal focus in stack order', async () => {
    const screen = render(() => (
      <Modal>
        <Modal.Trigger data-testid="outer-trigger">Open outer</Modal.Trigger>
        <Modal.Content
          contentRender={(outerContext) => (
            <>
              <button type="button" data-testid="outer-close" onClick={outerContext.close}>
                Close outer
              </button>
              <Modal>
                <Modal.Trigger data-testid="inner-trigger">Open inner</Modal.Trigger>
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
    fireEvent.click(outerTrigger)
    await Promise.resolve()
    const innerTrigger = document.body.querySelector(
      '[data-testid="inner-trigger"]',
    ) as HTMLButtonElement
    fireEvent.click(innerTrigger)
    await Promise.resolve()

    fireEvent.click(document.body.querySelector('[data-testid="inner-close"]')!)
    await Promise.resolve()
    const innerContent = document.body.querySelectorAll('[data-slot="content"]')[1]!
    fireEvent.animationEnd(innerContent)
    fireEvent.transitionEnd(innerContent)
    await waitFor(() => {
      expect(document.activeElement).toBe(innerTrigger)
    })

    fireEvent.click(document.body.querySelector('[data-testid="outer-close"]')!)
    await Promise.resolve()
    const outerContent = document.body.querySelector('[data-slot="content"]')!
    fireEvent.animationEnd(outerContent)
    fireEvent.transitionEnd(outerContent)
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
        <Modal.Trigger disabled={disabled()} data-testid="trigger">
          Open
        </Modal.Trigger>
        <Modal.Content
          contentRender={(context) => (
            <button type="button" data-testid="close-disabled" onClick={context.close}>
              Close
            </button>
          )}
        />
      </Modal>
    ))
    const trigger = screen.getByTestId('trigger')
    fireEvent.click(trigger)
    await Promise.resolve()
    setDisabled(true)

    fireEvent.click(document.body.querySelector('[data-testid="close-disabled"]')!)
    await Promise.resolve()
    const content = document.body.querySelector('[data-slot="content"]')!
    fireEvent.animationEnd(content)
    fireEvent.transitionEnd(content)
    await Promise.resolve()

    expect(document.activeElement).not.toBe(trigger)
    screen.unmount()
  })

  test('does not restore focus to a trigger removed while open', async () => {
    const [showTrigger, setShowTrigger] = createSignal(true)
    const screen = render(() => (
      <Modal>
        <Show when={showTrigger()}>
          <Modal.Trigger data-testid="removable-trigger">Open</Modal.Trigger>
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
    fireEvent.click(trigger)
    await Promise.resolve()
    setShowTrigger(false)

    fireEvent.click(document.body.querySelector('[data-testid="close-removed"]')!)
    await Promise.resolve()
    const content = document.body.querySelector('[data-slot="content"]')!
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
      <Modal open={open()} onOpenChange={setOpen} onExitComplete={onExitComplete}>
        <Modal.Trigger data-testid="rapid-trigger">Open</Modal.Trigger>
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
    fireEvent.click(trigger)
    await Promise.resolve()
    fireEvent.click(document.body.querySelector('[data-testid="rapid-close"]')!)

    setOpen(true)
    await Promise.resolve()

    const reopenedContent = document.body.querySelector('[data-slot="content"]') as HTMLElement
    expect(reopenedContent.hasAttribute('data-expanded')).toBe(true)
    expect(onExitComplete).not.toHaveBeenCalled()
    expect(document.activeElement).not.toBe(trigger)

    setOpen(false)
    await Promise.resolve()
    fireEvent.animationEnd(reopenedContent)
    fireEvent.transitionEnd(reopenedContent)
    expect(onExitComplete).not.toHaveBeenCalled()

    const overlay = document.body.querySelector('[data-slot="overlay"]') as HTMLElement
    fireEvent.animationEnd(overlay)
    fireEvent.transitionEnd(overlay)
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
        return <span>Open</span>
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
        <Modal.Trigger>Open</Modal.Trigger>
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
    fireEvent.click(document.querySelector('[data-slot="trigger"]')!)

    await waitFor(() => {
      expect(instances).toBe(1)
      expect(document.body.textContent).toContain('Content')
    })
  })
})
