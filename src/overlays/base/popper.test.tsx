import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { Show, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { Popper } from './popper'
import type { PopperContentContext, PopperPlacement } from './popper'
import type { OverlayTriggerProps } from './trigger'

describe('Popper primitives', () => {
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
      <Popper>
        <Popper.Trigger {...triggerProps} />
      </Popper>
    ))

    expect(childrenReads).toBe(1)
  })

  test('forwards original pointer events to trigger and content callbacks', async () => {
    const onTriggerPointerEnter = vi.fn()
    const onTriggerPointerLeave = vi.fn()
    const onContentPointerEnter = vi.fn()
    const onContentPointerLeave = vi.fn()

    const screen = render(() => (
      <Popper
        defaultOpen
        onTriggerPointerEnter={onTriggerPointerEnter}
        onTriggerPointerLeave={onTriggerPointerLeave}
        onContentPointerEnter={onContentPointerEnter}
        onContentPointerLeave={onContentPointerLeave}
      >
        <Popper.Trigger
          children={(props) => (
            <button {...props} type="button">
              Open
            </button>
          )}
        />
        <Popper.Content
          contentRender={(context) => (
            <div data-testid="content" {...context.contentProps}>
              Content
            </div>
          )}
        />
      </Popper>
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

    expect(onTriggerPointerEnter.mock.calls[0]?.[1]).toBe(triggerEnter)
    expect(onTriggerPointerLeave.mock.calls[0]?.[1]).toBe(triggerLeave)
    expect(onContentPointerEnter.mock.calls[0]?.[1]).toBe(contentEnter)
    expect(onContentPointerLeave.mock.calls[0]?.[1]).toBe(contentLeave)
  })

  test('does not instantiate closed content and mounts it once after opening', async () => {
    let instances = 0

    render(() => (
      <Popper>
        <Popper.Trigger
          children={(props) => (
            <button {...props} type="button">
              Open
            </button>
          )}
        />
        <Popper.Content
          contentRender={() => {
            instances += 1
            return <div role="dialog">Content</div>
          }}
        />
      </Popper>
    ))

    expect(instances).toBe(0)
    fireEvent.click(document.querySelector('[data-slot="trigger"]')!)

    await waitFor(() => {
      expect(instances).toBe(1)
      expect(document.body.textContent).toContain('Content')
    })
  })

  test('force-mounts closed content without activating open-state resources', async () => {
    const onEscapeKeyDown = vi.fn()
    const screen = render(() => (
      <Popper forceMount modal onEscapeKeyDown={onEscapeKeyDown}>
        <Popper.Trigger
          children={(props) => (
            <button {...props} type="button">
              Open
            </button>
          )}
        />
        <Popper.Content
          contentRender={(context) => (
            <div data-slot="content" {...context.contentProps}>
              Content
            </div>
          )}
        />
      </Popper>
    ))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })

    const content = document.body.querySelector('[data-slot="content"]')
    expect(content?.hasAttribute('data-closed')).toBe(true)
    expect(content?.hasAttribute('data-expanded')).toBe(false)
    expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('false')
    expect(document.body.style.overflow).toBe('')

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onEscapeKeyDown).not.toHaveBeenCalled()
  })

  test('uses an absolute positioner for the absolute Floating UI strategy', async () => {
    render(() => (
      <Popper defaultOpen>
        <Popper.Trigger
          children={(props) => (
            <button {...props} type="button">
              Open
            </button>
          )}
        />
        <Popper.Content contentRender={(context) => <div {...context.contentProps}>Content</div>} />
      </Popper>
    ))

    const positioner = document.body.querySelector('[data-slot="positioner"]')
    expect(positioner?.classList.contains('absolute')).toBe(true)
    expect(positioner?.classList.contains('fixed')).toBe(false)
  })

  test('copies the content z-index to the positioner', async () => {
    render(() => (
      <Popper defaultOpen>
        <Popper.Trigger
          children={(props) => (
            <button {...props} type="button">
              Open
            </button>
          )}
        />
        <Popper.Content
          contentRender={(context) => (
            <div {...context.contentProps} style={{ 'z-index': '73' }}>
              Content
            </div>
          )}
        />
      </Popper>
    ))

    await waitFor(() => {
      expect(
        (document.body.querySelector('[data-slot="positioner"]') as HTMLElement).style.zIndex,
      ).toBe('73')
    })
  })

  test('stops positioning when its trigger is removed', async () => {
    const [showTrigger, setShowTrigger] = createSignal(true)
    render(() => (
      <Popper defaultOpen>
        <Show when={showTrigger()}>
          <Popper.Trigger
            children={(props) => (
              <button {...props} type="button">
                Open
              </button>
            )}
          />
        </Show>
        <Popper.Content contentRender={(context) => <div {...context.contentProps}>Content</div>} />
      </Popper>
    ))

    const positioner = document.body.querySelector('[data-slot="positioner"]') as HTMLElement
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
        <Popper defaultOpen onOpenChange={onOpenChange}>
          <Popper.Trigger
            children={(props) => (
              <button {...props} type="button">
                Open
              </button>
            )}
          />
          <Popper.Content
            contentRender={(context) => (
              <div data-slot="content" {...context.contentProps}>
                Content
              </div>
            )}
          />
        </Popper>
      </>
    ))

    fireEvent.pointerDown(screen.getByTestId('outside'))

    expect(onOpenChange).not.toHaveBeenCalled()
    expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
  })

  test('ignores secondary pointer dismissal and prevents handled Escape', async () => {
    const outside = document.createElement('button')
    document.body.append(outside)
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <Popper defaultOpen onOpenChange={onOpenChange}>
        <Popper.Trigger
          children={(props) => (
            <button {...props} type="button">
              Open
            </button>
          )}
        />
        <Popper.Content
          contentRender={(context) => (
            <div data-slot="content" {...context.contentProps}>
              Content
            </div>
          )}
        />
      </Popper>
    ))

    fireEvent.pointerDown(outside, { button: 2 })
    expect(onOpenChange).not.toHaveBeenCalled()

    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Escape',
    })
    document.body.querySelector('[data-slot="content"]')!.dispatchEvent(event)

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
      <Popper defaultOpen onOpenChange={onOpenChange}>
        <Popper.Trigger children={(props) => <button {...props}>Open</button>} />
        <Popper.Content contentRender={(context) => <div {...context.contentProps}>Content</div>} />
      </Popper>
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
      <Popper defaultOpen onOpenChange={onOpenChange}>
        <Popper.Trigger children={(props) => <button {...props}>Open</button>} />
        <Popper.Content contentRender={(context) => <input {...context.contentProps} />} />
      </Popper>
    ))
    const content = document.body.querySelector('input')!

    fireEvent.compositionStart(content)
    fireEvent.keyDown(content, { key: 'Escape' })
    expect(onOpenChange).not.toHaveBeenCalled()
    fireEvent.compositionEnd(content)
    fireEvent.keyDown(content, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    screen.unmount()
  })

  test('does not acquire global resources without a mounted content surface', async () => {
    const onEscapeKeyDown = vi.fn()
    const screen = render(() => (
      <Popper defaultOpen modal onEscapeKeyDown={onEscapeKeyDown}>
        <Popper.Trigger
          children={(props) => (
            <button {...props} type="button">
              Open
            </button>
          )}
        />
      </Popper>
    ))

    await Promise.resolve()
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(document.body.style.overflow).toBe('')
    expect(onEscapeKeyDown).not.toHaveBeenCalled()
    screen.unmount()
  })

  test('isolates background content while a modal popper is open', async () => {
    const background = document.createElement('main')
    document.body.append(background)
    const screen = render(() => (
      <Popper defaultOpen modal>
        <Popper.Trigger
          children={(props) => (
            <button {...props} type="button">
              Open
            </button>
          )}
        />
        <Popper.Content
          contentRender={(context) => (
            <div data-slot="content" {...context.contentProps}>
              Content
            </div>
          )}
        />
      </Popper>
    ))

    await Promise.resolve()
    await Promise.resolve()
    expect(background.getAttribute('aria-hidden')).toBe('true')

    screen.unmount()
    expect(background.hasAttribute('aria-hidden')).toBe(false)
    background.remove()
  })

  test('updates placement data and transform origin when options change', async () => {
    const [placement, setPlacement] = createSignal<PopperPlacement>('top')
    render(() => (
      <Popper open placement={placement()} flip={false} slide={false}>
        <Popper.Trigger
          children={(props) => (
            <button {...props} type="button">
              Open
            </button>
          )}
        />
        <Popper.Content
          contentRender={(context) => (
            <div data-slot="content" {...context.contentProps}>
              <span data-testid="placement">{context.currentPlacement()}</span>
            </div>
          )}
        />
      </Popper>
    ))

    const positioner = document.body.querySelector('[data-slot="positioner"]') as HTMLElement
    await waitFor(() => {
      expect(document.body.querySelector('[data-testid="placement"]')?.textContent).toBe('top')
      expect(positioner.style.getPropertyValue('--mo-popper-content-transform-origin')).toBe(
        'bottom center',
      )
    })

    setPlacement('right-end')

    await waitFor(() => {
      expect(document.body.querySelector('[data-testid="placement"]')?.textContent).toBe(
        'right-end',
      )
      expect(positioner.style.getPropertyValue('--mo-popper-content-transform-origin')).toBe(
        'left bottom',
      )
    })
  })

  test('keeps one content instance through a rapid close and reopen', async () => {
    const [open, setOpen] = createSignal(true)
    let instances = 0
    render(() => (
      <Popper open={open()}>
        <Popper.Trigger
          children={(props) => (
            <button {...props} type="button">
              Open
            </button>
          )}
        />
        <Popper.Content
          contentRender={(context) => {
            instances += 1
            return (
              <div data-slot="content" {...context.contentProps}>
                Content
              </div>
            )
          }}
        />
      </Popper>
    ))

    await waitFor(() => {
      expect(instances).toBe(1)
    })
    setOpen(false)
    await Promise.resolve()
    setOpen(true)

    await waitFor(() => {
      expect(instances).toBe(1)
      expect(
        document.body.querySelector('[data-slot="content"]')?.hasAttribute('data-expanded'),
      ).toBe(true)
    })
  })

  test('positions without ResizeObserver support', async () => {
    const resizeObserverDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'ResizeObserver')
    Reflect.deleteProperty(globalThis, 'ResizeObserver')
    const screen = render(() => (
      <Popper defaultOpen>
        <Popper.Trigger
          children={(props) => (
            <button {...props} type="button">
              Open
            </button>
          )}
        />
        <Popper.Content contentRender={(context) => <div {...context.contentProps}>Content</div>} />
      </Popper>
    ))

    await waitFor(() => {
      expect(
        document.body.querySelector('[data-slot="positioner"]')?.hasAttribute('data-positioned'),
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
      <Popper defaultOpen modal onEscapeKeyDown={onEscapeKeyDown}>
        <Popper.Trigger
          children={(props) => (
            <button {...props} type="button">
              Open
            </button>
          )}
        />
        <Show when={showContent()}>
          <Popper.Content
            contentRender={(context) => (
              <div data-slot="content" {...context.contentProps}>
                Content
              </div>
            )}
          />
        </Show>
      </Popper>
    ))

    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden')
    })

    setShowContent(false)

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
      expect(document.body.style.overflow).toBe('')
    })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onEscapeKeyDown).not.toHaveBeenCalled()
  })

  test('resolves a force-mounted content render prop once across state changes', async () => {
    let contentRenderReads = 0
    const contentProps = {
      get contentRender() {
        contentRenderReads += 1
        return (context: PopperContentContext) => (
          <div data-slot="content" {...context.contentProps}>
            Content
          </div>
        )
      },
    }
    const screen = render(() => (
      <Popper forceMount>
        <Popper.Trigger
          children={(props) => (
            <button {...props} type="button">
              Toggle
            </button>
          )}
        />
        <Popper.Content {...contentProps} />
      </Popper>
    ))

    expect(contentRenderReads).toBe(1)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByRole('button'))
    expect(contentRenderReads).toBe(1)
  })

  test('retargets positioning when the trigger is replaced', async () => {
    const [useFirstTrigger, setUseFirstTrigger] = createSignal(true)
    render(() => (
      <Popper open placement="bottom-start" flip={false} slide={false}>
        <Show
          when={useFirstTrigger()}
          fallback={
            <Popper.Trigger
              children={(props) => (
                <button
                  {...props}
                  ref={(element) => {
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
                    props.ref(element)
                  }}
                  type="button"
                >
                  Second
                </button>
              )}
            />
          }
        >
          <Popper.Trigger
            children={(props) => (
              <button
                {...props}
                ref={(element) => {
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
                  props.ref(element)
                }}
                type="button"
              >
                First
              </button>
            )}
          />
        </Show>
        <Popper.Content contentRender={(context) => <div {...context.contentProps}>Content</div>} />
      </Popper>
    ))

    const positioner = document.body.querySelector('[data-slot="positioner"]') as HTMLElement
    await waitFor(() => {
      expect(positioner.style.transform).toBe('translate3d(10px, 20px, 0)')
    })

    setUseFirstTrigger(false)

    await waitFor(() => {
      expect(positioner.style.transform).toBe('translate3d(110px, 50px, 0)')
    })
  })

  test('rejects invalid fallback placements with a descriptive error', () => {
    expect(() =>
      render(() => (
        <Popper defaultOpen flip="bottom sideways">
          <Popper.Trigger
            children={(props) => (
              <button {...props} type="button">
                Open
              </button>
            )}
          />
          <Popper.Content
            contentRender={(context) => <div {...context.contentProps}>Content</div>}
          />
        </Popper>
      )),
    ).toThrow('`flip` expects a space-delimited list of placements')
  })
})
