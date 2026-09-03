import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { setPopperTestPlacementAccessor } from '../base/popper'

import { Tooltip } from './tooltip'
import type { TooltipT } from './tooltip'

let getMockPlacement: () => string = () => 'top'
let setMockPlacement: (value: string) => void = () => undefined

function mockInstantTooltipExit(): void {
  const readComputedStyle = window.getComputedStyle.bind(window)

  vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => {
    const style = readComputedStyle(element)
    const isInstantExit =
      element instanceof HTMLElement &&
      element.hasAttribute('data-closed') &&
      element.className.includes('data-closed:animate-none')

    if (!isInstantExit) {
      return style
    }

    return new Proxy(style, {
      get(target, property, receiver) {
        if (property === 'animationDelay') {
          return '0s'
        }
        if (property === 'animationDuration') {
          return '0s'
        }
        if (property === 'animationName') {
          return 'none'
        }
        if (property === 'display') {
          return 'block'
        }
        return Reflect.get(target, property, receiver)
      },
    })
  })
}

describe('Tooltip', () => {
  beforeEach(() => {
    const [placement, setPlacement] = createSignal('top')
    getMockPlacement = placement
    setMockPlacement = setPlacement
    setPopperTestPlacementAccessor(getMockPlacement)
  })

  afterEach(() => {
    setPopperTestPlacementAccessor(undefined)
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  test('renders text content when open is controlled', () => {
    render(() => (
      <Tooltip open text="Tooltip content">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Tooltip>
    ))

    expect(document.body.querySelector('[role=tooltip]')!.textContent).toContain('Tooltip content')
  })

  test('renders the trigger content as a native button root', () => {
    render(() => (
      <Tooltip text="Tooltip content">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Tooltip>
    ))

    const trigger = document.body.querySelector('[data-slot="trigger"]')

    expect(trigger?.tagName).toBe('BUTTON')
    expect(trigger?.getAttribute('type')).toBe('button')
  })

  test('renders a span trigger root', () => {
    render(() => (
      <Tooltip text="Tooltip content">{(props) => <span {...props}>Trigger</span>}</Tooltip>
    ))

    expect(document.body.querySelector('[data-slot="trigger"]')?.tagName).toBe('SPAN')
  })

  test('applies top-level class and style to trigger', () => {
    render(() => (
      <Tooltip text="Tooltip content">
        {(props) => (
          <button {...props} class="trigger-class" style={{ width: '200px' }} type="button">
            Trigger
          </button>
        )}
      </Tooltip>
    ))

    const trigger = document.body.querySelector('[data-slot="trigger"]') as HTMLElement | null

    expect(trigger?.className).toContain('trigger-class')
    expect(trigger?.style.width).toBe('200px')
  })

  test('renders keyboard hints', () => {
    render(() => (
      <Tooltip open text="Save" kbds={['Ctrl', 'S']}>
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Tooltip>
    ))

    const kbds = document.body.querySelectorAll('[data-slot="item"]')
    expect(kbds.length).toBe(2)
    expect(kbds.item(0)?.textContent).toBe('Ctrl')
    expect(kbds.item(1)?.textContent).toBe('S')
    expect(document.body.querySelectorAll('[data-slot="root"]').length).toBe(1)
  })

  test('applies classes.content to content slot', () => {
    render(() => (
      <Tooltip open text="Tooltip content" classes={{ content: 'content-override' }}>
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Tooltip>
    ))

    const content = document.body.querySelector('[data-slot="content"]')
    expect(content?.className).toContain('content-override')
  })

  test('renders tooltip container when no text or kbds are provided', () => {
    render(() => (
      <Tooltip open>
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Tooltip>
    ))

    const content = document.body.querySelector('[role=tooltip]')

    expect(content).not.toBeNull()
    expect(content?.textContent).toBe('')
  })

  test('does not render content when disabled', () => {
    const screen = render(() => (
      <Tooltip open text="Tooltip content" disabled>
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Tooltip>
    ))

    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  test('renders controlled overlay without a trigger', async () => {
    render(() => <Tooltip open text="Tooltip content" />)

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')?.textContent).toContain(
        'Tooltip content',
      )
    })
  })

  test('applies styles override to content', () => {
    render(() => (
      <Tooltip open text="Styled" styles={{ content: { width: '200px' } }}>
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Tooltip>
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
        <Tooltip open side="top" text="Tooltip content">
          {(props) => (
            <button {...props} type="button">
              Trigger
            </button>
          )}
        </Tooltip>
      )
    })

    const initialContent = document.body.querySelector('[data-slot="content"]')
    expect(initialContent?.className).toContain('data-expanded:animate-mo-enter')
    expect(initialContent?.className).toContain('data-closed:animate-mo-exit')
    expect(initialContent?.className).toContain('[--mo-enter-translate-y:0.25rem]')
    expect(initialContent?.className).not.toContain('[--mo-enter-translate-y:-0.25rem]')

    setMockPlacement('bottom')
    setVersion(1)

    const updatedContent = document.body.querySelector('[data-slot="content"]')
    expect(updatedContent?.className).toContain('data-expanded:animate-mo-enter')
    expect(updatedContent?.className).toContain('data-closed:animate-mo-exit')
    expect(updatedContent?.className).toContain('[--mo-enter-translate-y:-0.25rem]')
    expect(updatedContent?.className).not.toContain('[--mo-enter-translate-y:0.25rem]')
  })

  test('opens first hover after delay', async () => {
    vi.useFakeTimers()

    const screen = render(() => (
      <Tooltip text="Tooltip content">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Tooltip>
    ))

    const trigger = screen.getByText('Trigger').closest('[data-slot="trigger"]')!

    fireEvent.pointerEnter(trigger)

    expect(document.body.querySelector('[role=tooltip]')).toBeNull()

    await vi.advanceTimersByTimeAsync(599)
    expect(document.body.querySelector('[role=tooltip]')).toBeNull()

    await vi.advanceTimersByTimeAsync(1)
    expect(document.body.querySelector('[role=tooltip]')?.textContent).toContain('Tooltip content')
  })

  test('ignores touch and pen hover before accepting mouse hover', async () => {
    vi.useFakeTimers()
    const screen = render(() => (
      <Tooltip openDelay={50} text="Mouse tooltip">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Tooltip>
    ))
    const trigger = screen.getByRole('button')

    fireEvent.pointerEnter(trigger, { pointerType: 'touch' })
    fireEvent.pointerEnter(trigger, { pointerType: 'pen' })
    await vi.advanceTimersByTimeAsync(50)
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull()

    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(50)
    expect(document.body.querySelector('[role="tooltip"]')?.textContent).toContain('Mouse tooltip')
  })

  test('invalidates pending open and closes resolved state when disabled changes', async () => {
    vi.useFakeTimers()
    const [disabled, setDisabled] = createSignal(false)
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <Tooltip
        disabled={disabled()}
        openDelay={50}
        onOpenChange={onOpenChange}
        text="Disabled tooltip"
      >
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Tooltip>
    ))
    const trigger = screen.getByRole('button')

    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    setDisabled(true)
    setDisabled(false)
    await vi.advanceTimersByTimeAsync(50)
    expect(onOpenChange).not.toHaveBeenCalled()

    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(50)
    expect(document.body.querySelector('[role="tooltip"]')).not.toBeNull()

    setDisabled(true)
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    const closingTooltip = document.body.querySelector('[role="tooltip"]')
    expect(closingTooltip?.hasAttribute('data-closed')).toBe(true)
    await Promise.resolve()
    fireEvent.animationEnd(closingTooltip!)
    fireEvent.transitionEnd(closingTooltip!)
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull()
  })

  test('emits each controlled close attempt exactly once', async () => {
    vi.useFakeTimers()
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <Tooltip open closeDelay={50} onOpenChange={onOpenChange} text="Controlled tooltip">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Tooltip>
    ))

    fireEvent.pointerLeave(screen.getByRole('button'), { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(50)

    expect(onOpenChange).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  test('does not coordinate globally from a rejected controlled open', async () => {
    vi.useFakeTimers()
    const onFirstOpenChange = vi.fn()
    const screen = render(() => (
      <div>
        <Tooltip
          open={false}
          openDelay={50}
          onOpenChange={onFirstOpenChange}
          text="Rejected tooltip"
        >
          {(props) => (
            <button {...props} type="button">
              Rejected
            </button>
          )}
        </Tooltip>
        <Tooltip openDelay={100} text="Second tooltip">
          {(props) => (
            <button {...props} type="button">
              Second
            </button>
          )}
        </Tooltip>
      </div>
    ))

    fireEvent.pointerEnter(screen.getByText('Rejected'), { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(50)
    expect(onFirstOpenChange).toHaveBeenCalledTimes(1)
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull()

    fireEvent.pointerEnter(screen.getByText('Second'), { pointerType: 'mouse' })
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull()
    await vi.advanceTimersByTimeAsync(99)
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull()
    await vi.advanceTimersByTimeAsync(1)
    expect(document.body.querySelector('[role="tooltip"]')?.textContent).toContain('Second tooltip')
  })

  test('isolates global coordination after an owner is disposed', async () => {
    vi.useFakeTimers()
    const first = render(() => (
      <Tooltip openDelay={10} text="First tooltip">
        {(props) => (
          <button {...props} type="button">
            First
          </button>
        )}
      </Tooltip>
    ))

    fireEvent.pointerEnter(first.getByRole('button'), { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(10)
    first.unmount()

    const second = render(() => (
      <Tooltip openDelay={50} text="Second tooltip">
        {(props) => (
          <button {...props} type="button">
            Second
          </button>
        )}
      </Tooltip>
    ))
    fireEvent.pointerEnter(second.getByRole('button'), { pointerType: 'mouse' })

    expect(document.body.querySelector('[role="tooltip"]')).toBeNull()
    await vi.advanceTimersByTimeAsync(49)
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull()
    await vi.advanceTimersByTimeAsync(1)
    expect(document.body.querySelector('[role="tooltip"]')?.textContent).toContain('Second tooltip')
  })

  test('uses unique description ids across independent owners', () => {
    const first = render(() => (
      <Tooltip open text="First tooltip">
        {(props) => <button {...props}>First</button>}
      </Tooltip>
    ))
    const second = render(() => (
      <Tooltip open text="Second tooltip">
        {(props) => <button {...props}>Second</button>}
      </Tooltip>
    ))

    const firstId = first.getByRole('button').getAttribute('aria-describedby')
    const secondId = second.getByRole('button').getAttribute('aria-describedby')
    expect(firstId).toMatch(/.+/)
    expect(secondId).toMatch(/.+/)
    expect(firstId).not.toBe(secondId)
    expect(document.getElementById(firstId!)).not.toBeNull()
    expect(document.getElementById(secondId!)).not.toBeNull()
  })

  test('evaluates getter-backed trigger and text values once', () => {
    let triggerReads = 0
    let textReads = 0

    render(() =>
      createComponent(Tooltip, {
        open: true,
        get children() {
          triggerReads += 1
          return (props: TooltipT.TriggerProps) => <button {...props}>Trigger</button>
        },
        get text() {
          textReads += 1
          return <span>Cached tooltip</span>
        },
      }),
    )

    expect(triggerReads).toBe(1)
    expect(textReads).toBe(1)
  })

  test('opens the next tooltip immediately and closes the previous tooltip', async () => {
    vi.useFakeTimers()
    mockInstantTooltipExit()

    const screen = render(() => (
      <div>
        <Tooltip text="First tooltip">
          {(props) => (
            <button {...props} type="button">
              First
            </button>
          )}
        </Tooltip>
        <Tooltip text="Second tooltip">
          {(props) => (
            <button {...props} type="button">
              Second
            </button>
          )}
        </Tooltip>
      </div>
    ))

    const firstTrigger = screen.getByText('First').closest('[data-slot="trigger"]')!
    const secondTrigger = screen.getByText('Second').closest('[data-slot="trigger"]')!
    const firstButton = screen.getByText('First')

    fireEvent.pointerEnter(firstTrigger)
    await vi.advanceTimersByTimeAsync(600)

    expect(document.body.querySelector('[role=tooltip]')?.textContent).toContain('First tooltip')

    fireEvent.pointerLeave(firstTrigger)
    fireEvent.pointerEnter(secondTrigger)
    await Promise.resolve()

    const activeTooltip = document.body.querySelector('[role=tooltip]')

    expect(document.body.querySelectorAll('[role=tooltip]').length).toBe(1)
    expect(activeTooltip?.textContent).toContain('Second tooltip')
    expect(document.activeElement).not.toBe(firstButton)
    expect(document.body.querySelector('[role=tooltip]')?.textContent).not.toContain(
      'First tooltip',
    )
    expect(activeTooltip?.className).toContain('data-expanded:animate-none')
    expect(document.body.querySelector('[data-slot=positioner]')?.className).toContain(
      'transition-transform',
    )
  })

  test('does not restart an always-open tooltip after switching from another tooltip', async () => {
    vi.useFakeTimers()

    const screen = render(() => (
      <div>
        <Tooltip open text="Always open">
          {(props) => (
            <button {...props} type="button">
              Always
            </button>
          )}
        </Tooltip>
        <Tooltip text="Other tooltip">
          {(props) => (
            <button {...props} type="button">
              Other
            </button>
          )}
        </Tooltip>
      </div>
    ))

    const alwaysTrigger = screen.getByText('Always').closest('[data-slot="trigger"]')!
    const otherTrigger = screen.getByText('Other').closest('[data-slot="trigger"]')!
    const getAlwaysContent = (): HTMLElement =>
      Array.from(document.body.querySelectorAll('[role=tooltip]')).find((element) =>
        element.textContent?.includes('Always open'),
      ) as HTMLElement

    const initialClass = getAlwaysContent().className

    fireEvent.pointerEnter(otherTrigger)
    await vi.advanceTimersByTimeAsync(600)
    fireEvent.pointerLeave(otherTrigger)
    fireEvent.pointerEnter(alwaysTrigger)

    expect(getAlwaysContent().className).toBe(initialClass)
    expect(getAlwaysContent().className).not.toContain('data-expanded:animate-none')

    fireEvent.pointerLeave(alwaysTrigger)
    await vi.advanceTimersByTimeAsync(200)

    expect(getAlwaysContent().className).toBe(initialClass)
    expect(getAlwaysContent().getAttribute('data-expanded')).toBe('')
  })

  test('keeps the first hover delay when another tooltip starts open', async () => {
    vi.useFakeTimers()

    const screen = render(() => (
      <div>
        <Tooltip open text="Always open">
          {(props) => (
            <button {...props} type="button">
              Always
            </button>
          )}
        </Tooltip>
        <Tooltip openDelay={100} text="Delayed tooltip">
          {(props) => (
            <button {...props} type="button">
              Delayed
            </button>
          )}
        </Tooltip>
      </div>
    ))

    const hasDelayedTooltip = (): boolean =>
      Array.from(document.body.querySelectorAll('[role="tooltip"]')).some((element) =>
        element.textContent?.includes('Delayed tooltip'),
      )

    fireEvent.pointerEnter(screen.getByText('Delayed'), { pointerType: 'mouse' })

    expect(hasDelayedTooltip()).toBe(false)

    await vi.advanceTimersByTimeAsync(99)
    expect(hasDelayedTooltip()).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    expect(hasDelayedTooltip()).toBe(true)
  })

  test('keeps instant motion during the next tooltip close delay', async () => {
    vi.useFakeTimers()
    mockInstantTooltipExit()

    const screen = render(() => (
      <div>
        <Tooltip text="First tooltip">
          {(props) => (
            <button {...props} type="button">
              First
            </button>
          )}
        </Tooltip>
        <Tooltip text="Second tooltip">
          {(props) => (
            <button {...props} type="button">
              Second
            </button>
          )}
        </Tooltip>
      </div>
    ))

    const firstTrigger = screen.getByText('First').closest('[data-slot="trigger"]')!
    const secondTrigger = screen.getByText('Second').closest('[data-slot="trigger"]')!

    fireEvent.pointerEnter(firstTrigger)
    await vi.advanceTimersByTimeAsync(600)
    fireEvent.pointerLeave(firstTrigger)
    fireEvent.pointerEnter(secondTrigger)
    await Promise.resolve()
    fireEvent.pointerLeave(secondTrigger)

    const activeTooltip = document.body.querySelector('[role=tooltip]')
    const activeTooltipClass = activeTooltip?.className

    expect(activeTooltipClass).toContain('data-expanded:animate-none')

    await vi.advanceTimersByTimeAsync(199)

    expect(document.body.querySelector('[role=tooltip]')?.className).toBe(activeTooltipClass)

    await vi.advanceTimersByTimeAsync(1)

    const closingTooltip = document.body.querySelector('[role=tooltip]')

    expect(closingTooltip?.getAttribute('data-closed')).toBe('')
    expect(closingTooltip?.className).toContain('data-closed:animate-mo-exit')
    expect(closingTooltip?.className).not.toContain('data-closed:animate-none')
  })

  test('does not skip delay when the previous trigger never opened', async () => {
    vi.useFakeTimers()

    const screen = render(() => (
      <div>
        <Tooltip text="First tooltip">
          {(props) => (
            <button {...props} type="button">
              First
            </button>
          )}
        </Tooltip>
        <Tooltip text="Second tooltip">
          {(props) => (
            <button {...props} type="button">
              Second
            </button>
          )}
        </Tooltip>
      </div>
    ))

    const firstTrigger = screen.getByText('First').closest('[data-slot="trigger"]')!
    const secondTrigger = screen.getByText('Second').closest('[data-slot="trigger"]')!

    fireEvent.pointerEnter(firstTrigger)
    await vi.advanceTimersByTimeAsync(100)
    fireEvent.pointerLeave(firstTrigger)
    fireEvent.pointerEnter(secondTrigger)

    expect(document.body.querySelector('[role=tooltip]')).toBeNull()

    await vi.advanceTimersByTimeAsync(599)
    expect(document.body.querySelector('[role=tooltip]')).toBeNull()

    await vi.advanceTimersByTimeAsync(1)
    expect(document.body.querySelector('[role=tooltip]')?.textContent).toContain('Second tooltip')
  })
})
