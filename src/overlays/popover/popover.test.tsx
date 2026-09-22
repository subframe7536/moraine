import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import type { JSX } from 'solid-js'
import { createComponent, createSignal } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { finishExitMotion } from '../../test-utils/overlay-test'
import { renderWithTheme } from '../../test-utils/theme-render'
import { setPopperTestPlacementAccessor } from '../base/popper'

import { Popover } from './popover'

let getMockPlacement: () => string = () => 'bottom'
let setMockPlacement: (value: string) => void = () => undefined

describe('Popover', () => {
  test.each([0, 100])('keeps hover content open when clicked after %i ms', async (delay) => {
    vi.useFakeTimers()
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <Popover mode="hover" openDelay={100} closeDelay={100} onOpenChange={onOpenChange}>
        <Popover.Trigger>Hover target</Popover.Trigger>
        <Popover.Content>{'Hover content'}</Popover.Content>
      </Popover>
    ))
    const trigger = screen.getByText('Hover target')
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(delay)
    fireEvent.pointerDown(trigger, { pointerType: 'mouse' })
    fireEvent.focus(trigger)
    fireEvent.click(trigger)
    await vi.advanceTimersByTimeAsync(200)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(onOpenChange.mock.calls).toEqual([[true]])
    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(100)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })
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
      <Popover open>
        <Popover.Trigger as="button" type="button">
          Trigger
        </Popover.Trigger>
        <Popover.Content>{'Popover content'}</Popover.Content>
      </Popover>
    ))

    const content = document.body.querySelector('[data-slot="content"]')

    expect(content?.textContent).toContain('Popover content')
    expect(content?.getAttribute('role')).toBe('dialog')
  })

  test('renders the trigger content as a native button root', () => {
    render(() => (
      <Popover open>
        <Popover.Trigger as="button" type="button">
          Trigger
        </Popover.Trigger>
        <Popover.Content>{'Popover content'}</Popover.Content>
      </Popover>
    ))

    const trigger = document.body.querySelector('[data-slot="trigger"]')

    expect(trigger?.tagName).toBe('BUTTON')
    expect(trigger?.getAttribute('type')).toBe('button')
    expect(trigger?.getAttribute('aria-haspopup')).toBe('dialog')
    expect(trigger?.getAttribute('aria-expanded')).toBe('true')
    expect(trigger?.hasAttribute('data-expanded')).toBe(true)
    expect(trigger?.hasAttribute('data-closed')).toBe(false)
    expect(document.getElementById(trigger?.getAttribute('aria-controls') ?? '')).not.toBeNull()
  })

  test('renders an anchor trigger root', () => {
    render(() => (
      <Popover open>
        <Popover.Trigger as="a" href="#options">
          Options
        </Popover.Trigger>
        <Popover.Content>{'Popover content'}</Popover.Content>
      </Popover>
    ))

    const trigger = document.body.querySelector('[data-slot="trigger"]') as HTMLAnchorElement
    expect(trigger.tagName).toBe('A')
    expect(trigger.getAttribute('href')).toBe('#options')
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
  })

  test('keeps trigger ARIA state reactive through controlled open and exit presence', async () => {
    const [open, setOpen] = createSignal(false)
    const screen = render(() => (
      <Popover open={open()}>
        <Popover.Trigger>Trigger</Popover.Trigger>
        <Popover.Content>Content</Popover.Content>
      </Popover>
    ))
    const trigger = screen.getByRole<HTMLButtonElement>('button', { name: 'Trigger' })

    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.hasAttribute('data-closed')).toBe(true)
    expect(trigger.hasAttribute('aria-controls')).toBe(false)
    setOpen(true)
    await waitFor(() => {
      expect(trigger.getAttribute('aria-expanded')).toBe('true')
      expect(trigger.hasAttribute('data-expanded')).toBe(true)
      expect(document.getElementById(trigger.getAttribute('aria-controls')!)).not.toBeNull()
    })

    setOpen(false)
    await waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('false'))
    expect(document.getElementById(trigger.getAttribute('aria-controls')!)).not.toBeNull()
    await finishExitMotion()
    await waitFor(() => expect(trigger.hasAttribute('aria-controls')).toBe(false))
  })

  test('supports hover mode and renders content', () => {
    render(() => (
      <Popover mode="hover" open>
        <Popover.Trigger as="button" type="button">
          Trigger
        </Popover.Trigger>
        <Popover.Content>{'Hover content'}</Popover.Content>
      </Popover>
    ))

    const content = document.body.querySelector('[data-slot="content"]')

    expect(content?.textContent).toContain('Hover content')
  })

  test('opens hover mode only for mouse pointers', async () => {
    vi.useFakeTimers()
    const screen = render(() => (
      <Popover mode="hover" openDelay={50}>
        <Popover.Trigger as="button" type="button">
          Trigger
        </Popover.Trigger>
        <Popover.Content>{'Mouse content'}</Popover.Content>
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
      <Popover mode="hover" open={false} openDelay={50} onOpenChange={onOpenChange}>
        <Popover.Trigger as="button" type="button">
          Trigger
        </Popover.Trigger>
        <Popover.Content>{'Keyboard content'}</Popover.Content>
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

  test('bridges keyboard-open hover content and cancels its close timer', async () => {
    vi.useFakeTimers()
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <>
        <Popover mode="hover" openDelay={0} closeDelay={50} onOpenChange={onOpenChange}>
          <Popover.Trigger>Trigger</Popover.Trigger>
          <Popover.Content>
            <button type="button" data-testid="popover-action">
              Action
            </button>
          </Popover.Content>
        </Popover>
        <button type="button" data-testid="following-page-control">
          Next
        </button>
      </>
    ))
    const trigger = screen.getByRole<HTMLButtonElement>('button', { name: 'Trigger' })
    trigger.focus()
    await vi.advanceTimersByTimeAsync(0)
    const action = document.body.querySelector<HTMLButtonElement>('[data-testid="popover-action"]')!

    const forward = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Tab' })
    trigger.dispatchEvent(forward)
    expect(forward.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(action)

    await vi.advanceTimersByTimeAsync(50)
    expect(document.body.querySelector('[data-testid="popover-action"]')).not.toBeNull()
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true)

    const reverse = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Tab',
      shiftKey: true,
    })
    action.dispatchEvent(reverse)
    expect(reverse.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(trigger)

    const enterAgain = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Tab',
    })
    trigger.dispatchEvent(enterAgain)
    expect(document.activeElement).toBe(action)

    const leaveForward = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Tab',
    })
    action.dispatchEvent(leaveForward)
    expect(leaveForward.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(screen.getByTestId('following-page-control'))

    await vi.advanceTimersByTimeAsync(50)
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  test('does not bridge a controlled hover popover that rejected opening', async () => {
    vi.useFakeTimers()
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <>
        <Popover mode="hover" open={false} openDelay={0} onOpenChange={onOpenChange}>
          <Popover.Trigger>Trigger</Popover.Trigger>
          <Popover.Content>
            <button type="button">Action</button>
          </Popover.Content>
        </Popover>
        <button type="button" data-testid="following-page-control">
          Next
        </button>
      </>
    ))
    const trigger = screen.getByRole<HTMLButtonElement>('button', { name: 'Trigger' })
    trigger.focus()
    await vi.advanceTimersByTimeAsync(0)

    const forward = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Tab' })
    trigger.dispatchEvent(forward)
    expect(forward.defaultPrevented).toBe(false)
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true)
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
  })

  test('cancels hover timers when mode or disabled changes', async () => {
    vi.useFakeTimers()
    const [mode, setMode] = createSignal<'click' | 'hover'>('hover')
    const [disabled, setDisabled] = createSignal(false)
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <Popover mode={mode()} disabled={disabled()} openDelay={50} onOpenChange={onOpenChange}>
        <Popover.Trigger as="button" type="button">
          Trigger
        </Popover.Trigger>
        <Popover.Content>{'Timed content'}</Popover.Content>
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
      <Popover mode="hover" open={false} openDelay={50} closeDelay={50} onOpenChange={onOpenChange}>
        <Popover.Trigger as="button" type="button">
          Trigger
        </Popover.Trigger>
        <Popover.Content>{'Controlled content'}</Popover.Content>
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
      <Popover mode="hover" open closeDelay={50} onOpenChange={onOpenChange}>
        <Popover.Trigger as="button" type="button">
          Trigger
        </Popover.Trigger>
        <Popover.Content>{'Controlled content'}</Popover.Content>
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
      <Popover open>
        <Popover.Trigger as="button" type="button">
          Trigger
        </Popover.Trigger>
        <Popover.Content ariaLabel="Account actions">{'Named content'}</Popover.Content>
      </Popover>
    ))

    expect(document.body.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe(
      'Account actions',
    )
  })

  test('evaluates getter-backed trigger and content values once', () => {
    let triggerReads = 0
    let contentReads = 0

    render(() => (
      <Popover open>
        {createComponent(Popover.Trigger, {
          get children() {
            triggerReads += 1
            return <span>Trigger</span>
          },
        })}
        {createComponent(Popover.Content, {
          get children() {
            contentReads += 1
            return <span>Cached content</span>
          },
        })}
      </Popover>
    ))

    expect(triggerReads).toBe(1)
    expect(contentReads).toBe(1)
  })

  test.each([
    ['top-start', 'mb-(--mo-popper-content-overflow-padding)'],
    ['right-start', 'ml-(--mo-popper-content-overflow-padding)'],
    ['bottom-start', 'mt-(--mo-popper-content-overflow-padding)'],
    ['left-start', 'mr-(--mo-popper-content-overflow-padding)'],
  ] as const)('applies side class for placement %s', (placement, expectedClass) => {
    setMockPlacement(placement)

    renderWithTheme(() => (
      <Popover open placement={placement}>
        <Popover.Trigger as="button" type="button">
          Trigger
        </Popover.Trigger>
        <Popover.Content>{'Placement content'}</Popover.Content>
      </Popover>
    ))

    const content = document.body.querySelector('[data-slot="content"]')

    expect(content?.className).toContain(expectedClass)
  })

  test('supports classes for content slot', () => {
    renderWithTheme(() => (
      <Popover open>
        <Popover.Trigger as="button" type="button">
          Trigger
        </Popover.Trigger>
        <Popover.Content
          classes={{
            content: 'content-slot-class',
          }}
        >
          {'Styled'}
        </Popover.Content>
      </Popover>
    ))

    const content = document.body.querySelector('[data-slot="content"]')

    expect(content?.className).toContain('content-slot-class')
  })

  test('renders into portal by default', () => {
    const screen = render(() => (
      <Popover open>
        <Popover.Trigger as="button" type="button">
          Trigger
        </Popover.Trigger>
        <Popover.Content>{'Portal default'}</Popover.Content>
      </Popover>
    ))

    expect(screen.container.querySelector('[data-slot="content"]')).toBeNull()
    expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
  })

  test('renders controlled overlay without a trigger', async () => {
    render(() => (
      <Popover open>
        <Popover.Content>{'No trigger'}</Popover.Content>
      </Popover>
    ))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')?.textContent).toContain(
        'No trigger',
      )
    })
  })

  test('does not render body wrapper when content is undefined or null', () => {
    const undefinedPanelScreen = render(() => (
      <Popover open>
        <Popover.Trigger as="button" type="button">
          Trigger
        </Popover.Trigger>
        <Popover.Content />
      </Popover>
    ))
    expect(
      undefinedPanelScreen.container.ownerDocument.body.querySelector('[data-slot="body"]'),
    ).toBeNull()

    render(() => (
      <Popover open>
        <Popover.Trigger as="button" type="button">
          Trigger
        </Popover.Trigger>
        <Popover.Content>{null}</Popover.Content>
      </Popover>
    ))
    expect(document.body.querySelector('[data-slot="body"]')).toBeNull()
  })

  test('keeps popover open and emits onClosePrevent when dismissible=false', async () => {
    const onClosePrevent = vi.fn()

    render(() => (
      <Popover defaultOpen dismissible={false} onClosePrevent={onClosePrevent}>
        <Popover.Trigger as="button" type="button">
          Trigger
        </Popover.Trigger>
        <Popover.Content>{'Persistent'}</Popover.Content>
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
        <Popover defaultOpen dismissible={false} onClosePrevent={onClosePrevent}>
          <Popover.Trigger as="button" type="button">
            Trigger
          </Popover.Trigger>
          <Popover.Content>{'Persistent'}</Popover.Content>
        </Popover>
      </>
    ))

    await new Promise((resolve) => setTimeout(resolve, 0))
    const event = new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      pointerType: 'mouse',
    })
    screen.getByTestId('outside').dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
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
        <Popover defaultOpen dismissible={false} onClosePrevent={onClosePrevent}>
          <Popover.Trigger as="button" type="button">
            Trigger
          </Popover.Trigger>
          <Popover.Content>{'Persistent'}</Popover.Content>
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
      <Popover defaultOpen dismissible onClosePrevent={onClosePrevent} onOpenChange={onOpenChange}>
        <Popover.Trigger as="button" type="button">
          Trigger
        </Popover.Trigger>
        <Popover.Content>{'Closable'}</Popover.Content>
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
        <Popover defaultOpen onOpenChange={onOpenChange}>
          <Popover.Trigger as="button" type="button">
            Trigger
          </Popover.Trigger>
          <Popover.Content>{'Closable'}</Popover.Content>
        </Popover>
      </>
    ))

    const event = new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      pointerType: 'mouse',
    })
    screen.getByTestId('outside').dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
    expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()

    await finishExitMotion()

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    })
  })

  test('prevents native outside pointer default action only for modal popovers', async () => {
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <>
        <button type="button" data-testid="outside">
          Outside target
        </button>
        <Popover defaultOpen modal onOpenChange={onOpenChange}>
          <Popover.Trigger as="button" type="button">
            Trigger
          </Popover.Trigger>
          <Popover.Content>
            Modal
            <Popover.Close>Close</Popover.Close>
          </Popover.Content>
        </Popover>
      </>
    ))

    await new Promise((resolve) => setTimeout(resolve, 0))
    const event = new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      pointerType: 'mouse',
    })
    screen.getByTestId('outside').dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    await finishExitMotion()

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    })
  })

  test('keeps modal behavior through exit presence when closed from its content', async () => {
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <Popover defaultOpen modal onOpenChange={onOpenChange}>
        <Popover.Trigger>Trigger</Popover.Trigger>
        <Popover.Content>
          Modal content
          <Popover.Close>Close</Popover.Close>
        </Popover.Content>
      </Popover>
    ))
    const trigger = screen.getByRole<HTMLButtonElement>('button', { name: 'Trigger' })
    const content = document.body.querySelector<HTMLElement>('[data-slot="content"]')!

    await waitFor(() => expect(content.getAttribute('aria-modal')).toBe('true'))
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.click(document.body.querySelector('[data-slot="close"]')!)
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
    expect(content.hasAttribute('data-closed')).toBe(true)
    expect(content.getAttribute('aria-modal')).toBe('true')

    await finishExitMotion(content)
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
      expect(document.activeElement).toBe(trigger)
    })
    screen.unmount()
  })

  test('resolves a custom Popover.Close DOM root before applying native button defaults', () => {
    const onSubmit = vi.fn()
    const CustomButton = (props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button {...props} />
    )
    const screen = render(() => (
      <Popover defaultOpen>
        <Popover.Trigger>Trigger</Popover.Trigger>
        <Popover.Content>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              onSubmit()
            }}
          >
            <Popover.Close as={CustomButton}>Close</Popover.Close>
          </form>
        </Popover.Content>
      </Popover>
    ))
    const close = document.body.querySelector<HTMLButtonElement>('[data-slot="close"]')!

    expect(close.type).toBe('button')
    fireEvent.click(close)
    expect(onSubmit).not.toHaveBeenCalled()
    screen.unmount()
  })

  test('closes an uncontrolled modal popover with Escape and restores its trigger', async () => {
    const screen = render(() => (
      <Popover defaultOpen modal>
        <Popover.Trigger>Trigger</Popover.Trigger>
        <Popover.Content>
          Modal content
          <Popover.Close>Close</Popover.Close>
        </Popover.Content>
      </Popover>
    ))
    const trigger = screen.getByRole<HTMLButtonElement>('button', { name: 'Trigger' })
    const content = document.body.querySelector<HTMLElement>('[data-slot="content"]')!

    await waitFor(() => expect(content.getAttribute('aria-modal')).toBe('true'))
    content.focus()
    fireEvent.keyDown(content, { key: 'Escape' })
    expect(content.hasAttribute('data-closed')).toBe(true)

    await finishExitMotion(content)
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
      expect(document.activeElement).toBe(trigger)
    })
    screen.unmount()
  })

  test('falls back to non-modal behavior when modal content has no Popover.Close', async () => {
    const screen = render(() => (
      <>
        <button type="button" data-testid="outside">
          Outside
        </button>
        <Popover defaultOpen modal>
          <Popover.Trigger>Trigger</Popover.Trigger>
          <Popover.Content>Modal request without a close route</Popover.Content>
        </Popover>
      </>
    ))
    const content = document.body.querySelector<HTMLElement>('[data-slot="content"]')!
    await Promise.resolve()

    expect(content.getAttribute('aria-modal')).toBeNull()
    expect(screen.getByTestId('outside').getAttribute('aria-hidden')).toBeNull()
    expect(document.body.style.overflow).toBe('')
  })

  test('keeps a parent modal popover open when a nested modal Popover.Close is used', async () => {
    const outerChanges = vi.fn()
    const innerChanges = vi.fn()
    render(() => (
      <Popover defaultOpen modal onOpenChange={outerChanges}>
        <Popover.Trigger>Outer trigger</Popover.Trigger>
        <Popover.Content>
          <Popover.Close>Close outer</Popover.Close>
          <Popover defaultOpen modal onOpenChange={innerChanges}>
            <Popover.Trigger>Inner trigger</Popover.Trigger>
            <Popover.Content>
              <Popover.Close>Close inner</Popover.Close>
            </Popover.Content>
          </Popover>
        </Popover.Content>
      </Popover>
    ))

    const closeInner = Array.from(
      document.body.querySelectorAll<HTMLElement>('[data-slot="close"]'),
    ).find((element) => element.textContent === 'Close inner')!
    fireEvent.click(closeInner)
    await finishExitMotion()
    await waitFor(() => {
      expect(innerChanges).toHaveBeenCalledExactlyOnceWith(false)
      expect(outerChanges).not.toHaveBeenCalled()
      expect(document.body.textContent).toContain('Close outer')
    })
  })

  test('does not restore focus after non-modal outside pointer dismissal', async () => {
    const screen = render(() => (
      <>
        <button type="button" data-testid="outside">
          Outside target
        </button>
        <Popover defaultOpen>
          <Popover.Trigger as="button" type="button">
            Trigger
          </Popover.Trigger>
          <Popover.Content>{'Content'}</Popover.Content>
        </Popover>
      </>
    ))

    await new Promise((resolve) => setTimeout(resolve, 0))
    const outside = screen.getByTestId('outside')
    fireEvent.pointerDown(outside, { pointerType: 'mouse' })
    outside.focus()
    expect(document.activeElement).toBe(outside)

    await finishExitMotion()

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
      expect(document.activeElement).toBe(outside)
    })
  })

  test('keeps lower popovers open when the top popover finishes closing', async () => {
    const onFirstOpenChange = vi.fn()
    const onSecondOpenChange = vi.fn()

    render(() => (
      <>
        <Popover defaultOpen onOpenChange={onFirstOpenChange}>
          <Popover.Trigger as="button" type="button">
            First trigger
          </Popover.Trigger>
          <Popover.Content>{'First content'}</Popover.Content>
        </Popover>
        <Popover defaultOpen onOpenChange={onSecondOpenChange}>
          <Popover.Trigger as="button" type="button">
            Second trigger
          </Popover.Trigger>
          <Popover.Content>{'Second content'}</Popover.Content>
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
        <Popover open={firstOpen()}>
          <Popover.Trigger as="button" type="button">
            First trigger
          </Popover.Trigger>
          <Popover.Content>{'First content'}</Popover.Content>
        </Popover>
        <Popover defaultOpen onOpenChange={onSecondOpenChange}>
          <Popover.Trigger as="button" type="button">
            Second trigger
          </Popover.Trigger>
          <Popover.Content>{'Second content'}</Popover.Content>
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
      <Popover defaultOpen>
        <Popover.Trigger as="button" type="button">
          Trigger
        </Popover.Trigger>
        <Popover.Content>{'Positioned'}</Popover.Content>
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
      <Popover open>
        <Popover.Trigger as="button" type="button">
          Trigger
        </Popover.Trigger>
        <Popover.Content styles={{ content: { width: '200px' } }}>{'Styled'}</Popover.Content>
      </Popover>
    ))

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement | null
    expect(content?.style.width).toBe('200px')
  })

  test('uses runtime placement to resolve side-aware animation classes', () => {
    const [version, setVersion] = createSignal(0)

    // oxlint-disable-next-line subf/solid-reactivity
    renderWithTheme(() => {
      version()

      return (
        <Popover open placement="bottom">
          <Popover.Trigger as="button" type="button">
            Trigger
          </Popover.Trigger>
          <Popover.Content>{'Popover content'}</Popover.Content>
        </Popover>
      )
    })

    const initialContent = document.body.querySelector('[data-slot="content"]')
    expect(initialContent?.className).toContain('data-expanded:animate-mo-enter')
    expect(initialContent?.className).toContain('data-closed:animate-mo-exit')
    expect(initialContent?.classList).toContain('data-[side=bottom]:-enter-translate-y-1')
    expect(initialContent?.getAttribute('data-side')).toBe('bottom')

    setMockPlacement('right')
    setVersion(1)

    const updatedContent = document.body.querySelector('[data-slot="content"]')
    expect(updatedContent?.className).toContain('data-expanded:animate-mo-enter')
    expect(updatedContent?.className).toContain('data-closed:animate-mo-exit')
    expect(updatedContent?.classList).toContain('data-[side=right]:-enter-translate-x-1')
    expect(updatedContent?.getAttribute('data-side')).toBe('right')
  })
})
