import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { finishExitMotion } from '../../test-utils/overlay-test'
import { setPopperTestPlacementAccessor } from '../base/popper'

import { Popover } from './popover'
import type { PopoverT } from './popover'

let getMockPlacement: () => string = () => 'bottom'
let setMockPlacement: (value: string) => void = () => undefined

describe('Popover', () => {
  beforeEach(() => {
    const [placement, setPlacement] = createSignal('bottom')
    getMockPlacement = placement
    setMockPlacement = setPlacement
    setPopperTestPlacementAccessor(getMockPlacement)
  })

  afterEach(() => {
    setPopperTestPlacementAccessor(undefined)
    vi.useRealTimers()
  })

  test('supports click mode and renders content', () => {
    render(() => (
      <Popover open content="Popover content">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Popover>
    ))

    const content = document.body.querySelector('[data-slot="content"]')

    expect(content?.textContent).toContain('Popover content')
    expect(content?.getAttribute('role')).toBe('dialog')
  })

  test('renders the trigger content as a native button root', () => {
    render(() => (
      <Popover open content="Popover content">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Popover>
    ))

    const trigger = document.body.querySelector('[data-slot="trigger"]')

    expect(trigger?.tagName).toBe('BUTTON')
    expect(trigger?.getAttribute('type')).toBe('button')
  })

  test('renders an anchor trigger root', () => {
    render(() => (
      <Popover open content="Popover content">
        {(props) => (
          <a {...props} href="#options">
            Options
          </a>
        )}
      </Popover>
    ))

    const trigger = document.body.querySelector('[data-slot="trigger"]') as HTMLAnchorElement
    expect(trigger.tagName).toBe('A')
    expect(trigger.getAttribute('href')).toBe('#options')
  })

  test('supports hover mode and renders content', () => {
    render(() => (
      <Popover mode="hover" open content="Hover content">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Popover>
    ))

    const content = document.body.querySelector('[data-slot="content"]')

    expect(content?.textContent).toContain('Hover content')
  })

  test('opens hover mode only for mouse pointers', async () => {
    vi.useFakeTimers()
    const screen = render(() => (
      <Popover mode="hover" openDelay={50} content="Mouse content">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Popover>
    ))
    const trigger = screen.getByRole('button')

    fireEvent.pointerEnter(trigger, { pointerType: 'touch' })
    fireEvent.pointerEnter(trigger, { pointerType: 'pen' })
    await vi.advanceTimersByTimeAsync(50)
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()

    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(50)
    expect(document.body.querySelector('[role="dialog"]')?.textContent).toContain('Mouse content')
  })

  test('keeps hover mode reachable by keyboard focus and press', async () => {
    vi.useFakeTimers()
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <Popover
        mode="hover"
        open={false}
        openDelay={50}
        onOpenChange={onOpenChange}
        content="Keyboard content"
      >
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Popover>
    ))
    const trigger = screen.getByRole('button')

    fireEvent.focus(trigger)
    await vi.advanceTimersByTimeAsync(50)
    expect(onOpenChange).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenLastCalledWith(true)

    onOpenChange.mockClear()
    fireEvent.click(trigger, { detail: 0 })
    expect(onOpenChange).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
  })

  test('cancels hover timers when mode or disabled changes', async () => {
    vi.useFakeTimers()
    const [mode, setMode] = createSignal<'click' | 'hover'>('hover')
    const [disabled, setDisabled] = createSignal(false)
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <Popover
        mode={mode()}
        disabled={disabled()}
        openDelay={50}
        onOpenChange={onOpenChange}
        content="Timed content"
      >
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Popover>
    ))
    const trigger = screen.getByRole('button')

    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    setMode('click')
    await vi.advanceTimersByTimeAsync(50)
    expect(onOpenChange).not.toHaveBeenCalled()

    setMode('hover')
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    setDisabled(true)
    setDisabled(false)
    await vi.advanceTimersByTimeAsync(50)
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  test('emits one controlled hover request after rapid re-entry', async () => {
    vi.useFakeTimers()
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <Popover
        mode="hover"
        open={false}
        openDelay={50}
        closeDelay={50}
        onOpenChange={onOpenChange}
        content="Controlled content"
      >
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Popover>
    ))
    const trigger = screen.getByRole('button')

    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' })
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(50)

    expect(onOpenChange).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  test('emits one controlled close request after rapid pointer leave', async () => {
    vi.useFakeTimers()
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <Popover
        mode="hover"
        open
        closeDelay={50}
        onOpenChange={onOpenChange}
        content="Controlled content"
      >
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Popover>
    ))
    const trigger = screen.getByRole('button')

    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(25)
    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(50)

    expect(onOpenChange).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  test('provides an explicit accessible name for dialog content', () => {
    render(() => (
      <Popover open ariaLabel="Account actions" content="Named content">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Popover>
    ))

    expect(document.body.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe(
      'Account actions',
    )
  })

  test('evaluates getter-backed trigger and content values once', () => {
    let triggerReads = 0
    let contentReads = 0

    render(() =>
      createComponent(Popover, {
        open: true,
        get children() {
          triggerReads += 1
          return (props: PopoverT.TriggerProps) => (
            <button {...props} type="button">
              Trigger
            </button>
          )
        },
        get content() {
          contentReads += 1
          return <span>Cached content</span>
        },
      }),
    )

    expect(triggerReads).toBe(1)
    expect(contentReads).toBe(1)
  })

  test.each([
    ['top-start', 'mb-$mo-popper-content-overflow-padding'],
    ['right-start', 'ml-$mo-popper-content-overflow-padding'],
    ['bottom-start', 'mt-$mo-popper-content-overflow-padding'],
    ['left-start', 'mr-$mo-popper-content-overflow-padding'],
  ] as const)('applies side class for placement %s', (placement, expectedClass) => {
    setMockPlacement(placement)

    render(() => (
      <Popover open placement={placement} content="Placement content">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Popover>
    ))

    const content = document.body.querySelector('[data-slot="content"]')

    expect(content?.className).toContain(expectedClass)
  })

  test('supports classes for content slot', () => {
    render(() => (
      <Popover
        open
        classes={{
          content: 'content-slot-class',
        }}
        content="Styled"
      >
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Popover>
    ))

    const content = document.body.querySelector('[data-slot="content"]')

    expect(content?.className).toContain('content-slot-class')
  })

  test('renders into portal by default', () => {
    const screen = render(() => (
      <Popover open content="Portal default">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Popover>
    ))

    expect(screen.container.querySelector('[data-slot="content"]')).toBeNull()
    expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
  })

  test('renders controlled overlay without a trigger', async () => {
    render(() => <Popover open content="No trigger" />)

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')?.textContent).toContain(
        'No trigger',
      )
    })
  })

  test('does not render body wrapper when content is undefined or null', () => {
    const undefinedPanelScreen = render(() => (
      <Popover open>
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Popover>
    ))
    expect(
      undefinedPanelScreen.container.ownerDocument.body.querySelector('[data-slot="body"]'),
    ).toBeNull()

    render(() => (
      <Popover open content={null}>
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Popover>
    ))
    expect(document.body.querySelector('[data-slot="body"]')).toBeNull()
  })

  test('keeps popover open and emits onClosePrevent when dismissible=false', async () => {
    const onClosePrevent = vi.fn()

    render(() => (
      <Popover defaultOpen dismissible={false} onClosePrevent={onClosePrevent} content="Persistent">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Popover>
    ))

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement
    content.focus()
    fireEvent.keyDown(content, { key: 'Escape' })

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
        <Popover
          defaultOpen
          dismissible={false}
          onClosePrevent={onClosePrevent}
          content="Persistent"
        >
          {(props) => (
            <button {...props} type="button">
              Trigger
            </button>
          )}
        </Popover>
      </>
    ))

    await new Promise((resolve) => setTimeout(resolve, 0))
    fireEvent.pointerDown(screen.getByTestId('outside'))

    await waitFor(() => {
      expect(onClosePrevent).toHaveBeenCalledTimes(1)
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })
  })

  test('does not double count pointer attempt followed by outside focus', async () => {
    const onClosePrevent = vi.fn()

    const screen = render(() => (
      <>
        <button type="button" data-testid="outside">
          Outside target
        </button>
        <Popover
          defaultOpen
          dismissible={false}
          onClosePrevent={onClosePrevent}
          content="Persistent"
        >
          {(props) => (
            <button {...props} type="button">
              Trigger
            </button>
          )}
        </Popover>
      </>
    ))

    const outside = screen.getByTestId('outside')

    await new Promise((resolve) => setTimeout(resolve, 0))
    fireEvent.pointerDown(outside)
    fireEvent.focusIn(outside)

    await waitFor(() => {
      expect(onClosePrevent).toHaveBeenCalledTimes(1)
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })
  })

  test('closes popover on escape when dismissible=true', async () => {
    const onClosePrevent = vi.fn()
    const onOpenChange = vi.fn()

    render(() => (
      <Popover
        defaultOpen
        dismissible
        onClosePrevent={onClosePrevent}
        onOpenChange={onOpenChange}
        content="Closable"
      >
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Popover>
    ))

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement
    content.focus()
    fireEvent.keyDown(content, { key: 'Escape' })

    expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()

    await finishExitMotion()

    await waitFor(() => {
      expect(onClosePrevent).not.toHaveBeenCalled()
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()

      const trigger = document.body.querySelector('[data-slot="trigger"]')
      expect(trigger?.getAttribute('aria-expanded')).toBe('false')
    })
  })

  test('closes popover on outside pointer interaction in click mode', async () => {
    const onOpenChange = vi.fn()

    const screen = render(() => (
      <>
        <button type="button" data-testid="outside">
          Outside target
        </button>
        <Popover defaultOpen onOpenChange={onOpenChange} content="Closable">
          {(props) => (
            <button {...props} type="button">
              Trigger
            </button>
          )}
        </Popover>
      </>
    ))

    fireEvent.pointerDown(screen.getByTestId('outside'))

    expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()

    await finishExitMotion()

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    })
  })

  test('keeps lower popovers open when the top popover finishes closing', async () => {
    const onFirstOpenChange = vi.fn()
    const onSecondOpenChange = vi.fn()

    render(() => (
      <>
        <Popover defaultOpen onOpenChange={onFirstOpenChange} content="First content">
          {(props) => (
            <button {...props} type="button">
              First trigger
            </button>
          )}
        </Popover>
        <Popover defaultOpen onOpenChange={onSecondOpenChange} content="Second content">
          {(props) => (
            <button {...props} type="button">
              Second trigger
            </button>
          )}
        </Popover>
      </>
    ))

    const secondContent = Array.from(
      document.body.querySelectorAll<HTMLElement>('[data-slot="content"]'),
    ).find((content) => content.textContent?.includes('Second content')) as HTMLElement

    secondContent.focus()
    fireEvent.keyDown(secondContent, { key: 'Escape' })
    const closingContent = document.body.querySelector<HTMLElement>(
      '[data-slot="content"][data-closed]',
    )
    await finishExitMotion(closingContent)

    await waitFor(() => {
      expect(onFirstOpenChange).not.toHaveBeenCalled()
      expect(onSecondOpenChange).toHaveBeenCalledWith(false)
      expect(document.body.textContent).toContain('First content')
      expect(document.body.textContent).not.toContain('Second content')
    })
  })

  test('does not restore focus when a non-top popover finishes closing', async () => {
    const [firstOpen, setFirstOpen] = createSignal(true)
    const onSecondOpenChange = vi.fn()

    render(() => (
      <>
        <Popover open={firstOpen()} content="First content">
          {(props) => (
            <button {...props} type="button">
              First trigger
            </button>
          )}
        </Popover>
        <Popover defaultOpen onOpenChange={onSecondOpenChange} content="Second content">
          {(props) => (
            <button {...props} type="button">
              Second trigger
            </button>
          )}
        </Popover>
      </>
    ))

    const contents = Array.from(
      document.body.querySelectorAll<HTMLElement>('[data-slot="content"]'),
    )
    const firstContent = contents.find((content) =>
      content.textContent?.includes('First content'),
    ) as HTMLElement
    const secondContent = contents.find((content) =>
      content.textContent?.includes('Second content'),
    ) as HTMLElement

    secondContent.focus()
    setFirstOpen(false)
    const closingContent = document.body.querySelector<HTMLElement>(
      '[data-slot="content"][data-closed]',
    )
    expect(closingContent?.textContent).toContain(firstContent.textContent)
    await finishExitMotion(closingContent)

    await waitFor(() => {
      expect(onSecondOpenChange).not.toHaveBeenCalled()
      expect(document.activeElement).toBe(secondContent)
      expect(document.body.textContent).not.toContain('First content')
      expect(document.body.textContent).toContain('Second content')
    })
  })

  test('positions defaultOpen popover on initial mount', async () => {
    render(() => (
      <Popover defaultOpen content="Positioned">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Popover>
    ))

    await waitFor(() => {
      const positioner = document.body.querySelector(
        '[data-slot="positioner"]',
      ) as HTMLElement | null

      expect(positioner?.style.transform).toContain('translate3d(')
    })
  })

  test('applies styles override to content', () => {
    render(() => (
      <Popover open styles={{ content: { width: '200px' } }} content="Styled">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Popover>
    ))

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement | null
    expect(content?.style.width).toBe('200px')
  })

  test('uses runtime placement to resolve side-aware animation classes', () => {
    const [version, setVersion] = createSignal(0)

    // oxlint-disable-next-line subf/solid-reactivity
    render(() => {
      version()

      return (
        <Popover open placement="bottom" content="Popover content">
          {(props) => (
            <button {...props} type="button">
              Trigger
            </button>
          )}
        </Popover>
      )
    })

    const initialContent = document.body.querySelector('[data-slot="content"]')
    expect(initialContent?.className).toContain('data-expanded:animate-popover-in')
    expect(initialContent?.className).toContain('data-closed:animate-popover-out')
    expect(initialContent?.className).toContain('animate-popover-side-bottom')
    expect(initialContent?.className).not.toContain('animate-popover-side-right')

    setMockPlacement('right')
    setVersion(1)

    const updatedContent = document.body.querySelector('[data-slot="content"]')
    expect(updatedContent?.className).toContain('data-expanded:animate-popover-in')
    expect(updatedContent?.className).toContain('data-closed:animate-popover-out')
    expect(updatedContent?.className).toContain('animate-popover-side-right')
    expect(updatedContent?.className).not.toContain('animate-popover-side-bottom')
  })
})
