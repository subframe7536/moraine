import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { createDesign } from '../../design.ts'
import { MoraineProvider } from '../../shared/provider/index.ts'
import { renderWithDesign } from '../../test-utils/design-render.tsx'
import { setPopperTestPlacementAccessor } from '../base/popper'

import { Tooltip } from './tooltip'

let getMockPlacement: () => string = () => 'top'
let setMockPlacement: (value: string) => void = () => undefined

function mockInstantTooltipExit(): void {
  const readComputedStyle = window.getComputedStyle.bind(window)

  vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => {
    const style = readComputedStyle(element)
    const isInstantExit =
      element instanceof HTMLElement &&
      element.hasAttribute('data-closed') &&
      element.hasAttribute('data-instant-motion')

    if (!isInstantExit) {
      return style
    }

    return Object.create(style, {
      animationDelay: { value: '0s', configurable: true },
      animationDuration: { value: '0s', configurable: true },
      animationName: { value: 'none', configurable: true },
      display: { value: 'block', configurable: true },
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
      <Tooltip open>
        <Tooltip.Trigger as="button" type="button">
          Trigger
        </Tooltip.Trigger>
        <Tooltip.Content text="Tooltip content" />
      </Tooltip>
    ))

    expect(document.body.querySelector('[role=tooltip]')!.textContent).toContain('Tooltip content')
  })

  test('renders the trigger content as a native button root', () => {
    render(() => (
      <Tooltip>
        <Tooltip.Trigger as="button" type="button">
          Trigger
        </Tooltip.Trigger>
        <Tooltip.Content text="Tooltip content" />
      </Tooltip>
    ))

    const trigger = document.body.querySelector('[data-slot="trigger"]')

    expect(trigger?.tagName).toBe('BUTTON')
    expect(trigger?.getAttribute('type')).toBe('button')
  })

  test('renders a span trigger root', () => {
    render(() => (
      <Tooltip>
        <Tooltip.Trigger as="span">Trigger</Tooltip.Trigger>
        <Tooltip.Content text="Tooltip content" />
      </Tooltip>
    ))

    expect(document.body.querySelector('[data-slot="trigger"]')?.tagName).toBe('SPAN')
  })

  test('applies top-level class and style to trigger', () => {
    renderWithDesign(() => (
      <Tooltip>
        <Tooltip.Trigger as="button" class="trigger-class" style={{ width: '200px' }} type="button">
          Trigger
        </Tooltip.Trigger>
        <Tooltip.Content text="Tooltip content" />
      </Tooltip>
    ))

    const trigger = document.body.querySelector('[data-slot="trigger"]') as HTMLElement | null

    expect(trigger?.className).toContain('trigger-class')
    expect(trigger?.style.width).toBe('200px')
  })

  test('applies provider trigger classes and styles', () => {
    renderWithDesign(() => (
      <MoraineProvider
        design={createDesign({ tooltip: { base: { trigger: 'provider-trigger w-40' } } })}
      >
        <Tooltip>
          <Tooltip.Trigger as="button">Trigger</Tooltip.Trigger>
          <Tooltip.Content content="Help" />
        </Tooltip>
      </MoraineProvider>
    ))

    const trigger = document.body.querySelector<HTMLElement>('[data-slot="trigger"]')
    expect(trigger?.className).toContain('provider-trigger')
    expect(trigger?.className).toContain('w-40')
  })

  test('renders keyboard hints', () => {
    render(() => (
      <Tooltip open>
        <Tooltip.Trigger as="button" type="button">
          Trigger
        </Tooltip.Trigger>
        <Tooltip.Content text="Save" kbds={['Ctrl', 'S']} />
      </Tooltip>
    ))

    const kbds = document.body.querySelectorAll('[data-slot="item"]')
    expect(kbds.length).toBe(2)
    expect(kbds.item(0)?.textContent).toBe('Ctrl')
    expect(kbds.item(1)?.textContent).toBe('S')
    expect(document.body.querySelectorAll('[data-slot="root"]').length).toBe(1)
  })

  test('applies classes.content to content slot', () => {
    renderWithDesign(() => (
      <Tooltip open>
        <Tooltip.Trigger as="button" type="button">
          Trigger
        </Tooltip.Trigger>
        <Tooltip.Content text="Tooltip content" classes={{ content: 'content-override' }} />
      </Tooltip>
    ))

    const content = document.body.querySelector('[data-slot="content"]')
    expect(content?.className).toContain('content-override')
  })

  test('renders tooltip container when no text or kbds are provided', () => {
    render(() => (
      <Tooltip open>
        <Tooltip.Trigger as="button" type="button">
          Trigger
        </Tooltip.Trigger>
        <Tooltip.Content />
      </Tooltip>
    ))

    const content = document.body.querySelector('[role=tooltip]')

    expect(content).not.toBeNull()
    expect(content?.textContent).toBe('')
  })

  test('does not render content when disabled', () => {
    const screen = render(() => (
      <Tooltip open disabled>
        <Tooltip.Trigger as="button" type="button">
          Trigger
        </Tooltip.Trigger>
        <Tooltip.Content text="Tooltip content" />
      </Tooltip>
    ))

    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  test('renders controlled overlay without a trigger', async () => {
    render(() => (
      <Tooltip open>
        <Tooltip.Content text="Tooltip content" />
      </Tooltip>
    ))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')?.textContent).toContain(
        'Tooltip content',
      )
    })
  })

  test('applies styles override to content', () => {
    render(() => (
      <Tooltip open>
        <Tooltip.Trigger as="button" type="button">
          Trigger
        </Tooltip.Trigger>
        <Tooltip.Content text="Styled" styles={{ content: { width: '200px' } }} />
      </Tooltip>
    ))

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement | null
    expect(content?.style.width).toBe('200px')
  })

  test('uses runtime placement to resolve side-aware animation classes', () => {
    const [version, setVersion] = createSignal(0)

    // oxlint-disable-next-line subf/solid-reactivity
    renderWithDesign(() => {
      version()

      return (
        <Tooltip open>
          <Tooltip.Trigger as="button" type="button">
            Trigger
          </Tooltip.Trigger>
          <Tooltip.Content side="top" text="Tooltip content" />
        </Tooltip>
      )
    })

    const initialContent = document.body.querySelector('[data-slot="content"]')
    expect(initialContent?.className).toContain('data-expanded:animate-mo-enter')
    expect(initialContent?.className).toContain('data-closed:animate-mo-exit')
    expect(initialContent?.classList.contains('enter-translate-y-1')).toBe(true)
    expect(initialContent?.classList.contains('-enter-translate-y-1')).toBe(false)

    setMockPlacement('bottom')
    setVersion(1)

    const updatedContent = document.body.querySelector('[data-slot="content"]')
    expect(updatedContent?.className).toContain('data-expanded:animate-mo-enter')
    expect(updatedContent?.className).toContain('data-closed:animate-mo-exit')
    expect(updatedContent?.classList.contains('-enter-translate-y-1')).toBe(true)
    expect(updatedContent?.classList.contains('enter-translate-y-1')).toBe(false)
  })

  test('opens first hover after delay', async () => {
    vi.useFakeTimers()

    const screen = render(() => (
      <Tooltip>
        <Tooltip.Trigger as="button" type="button">
          Trigger
        </Tooltip.Trigger>
        <Tooltip.Content text="Tooltip content" />
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
      <Tooltip openDelay={50}>
        <Tooltip.Trigger as="button" type="button">
          Trigger
        </Tooltip.Trigger>
        <Tooltip.Content text="Mouse tooltip" />
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
      <Tooltip disabled={disabled()} openDelay={50} onOpenChange={onOpenChange}>
        <Tooltip.Trigger as="button" type="button">
          Trigger
        </Tooltip.Trigger>
        <Tooltip.Content text="Disabled tooltip" />
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
      <Tooltip open closeDelay={50} onOpenChange={onOpenChange}>
        <Tooltip.Trigger as="button" type="button">
          Trigger
        </Tooltip.Trigger>
        <Tooltip.Content text="Controlled tooltip" />
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
        <Tooltip open={false} openDelay={50} onOpenChange={onFirstOpenChange}>
          <Tooltip.Trigger as="button" type="button">
            Rejected
          </Tooltip.Trigger>
          <Tooltip.Content text="Rejected tooltip" />
        </Tooltip>
        <Tooltip openDelay={100}>
          <Tooltip.Trigger as="button" type="button">
            Second
          </Tooltip.Trigger>
          <Tooltip.Content text="Second tooltip" />
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
      <Tooltip openDelay={10}>
        <Tooltip.Trigger as="button" type="button">
          First
        </Tooltip.Trigger>
        <Tooltip.Content text="First tooltip" />
      </Tooltip>
    ))

    fireEvent.pointerEnter(first.getByRole('button'), { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(10)
    first.unmount()

    const second = render(() => (
      <Tooltip openDelay={50}>
        <Tooltip.Trigger as="button" type="button">
          Second
        </Tooltip.Trigger>
        <Tooltip.Content text="Second tooltip" />
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
      <Tooltip open>
        <Tooltip.Trigger as="button">First</Tooltip.Trigger>
        <Tooltip.Content text="First tooltip" />
      </Tooltip>
    ))
    const second = render(() => (
      <Tooltip open>
        <Tooltip.Trigger as="button">Second</Tooltip.Trigger>
        <Tooltip.Content text="Second tooltip" />
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

    render(() => (
      <Tooltip open>
        {createComponent(Tooltip.Trigger, {
          get children() {
            triggerReads += 1
            return <span>Trigger</span>
          },
        })}
        {createComponent(Tooltip.Content, {
          get text() {
            textReads += 1
            return <span>Cached tooltip</span>
          },
        })}
      </Tooltip>
    ))

    expect(triggerReads).toBe(1)
    expect(textReads).toBe(1)
  })

  test('opens the next tooltip immediately and closes the previous tooltip', async () => {
    vi.useFakeTimers()
    mockInstantTooltipExit()

    const screen = renderWithDesign(() => (
      <div>
        <Tooltip>
          <Tooltip.Trigger as="button" type="button">
            First
          </Tooltip.Trigger>
          <Tooltip.Content text="First tooltip" />
        </Tooltip>
        <Tooltip>
          <Tooltip.Trigger as="button" type="button">
            Second
          </Tooltip.Trigger>
          <Tooltip.Content text="Second tooltip" />
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
    expect(activeTooltip?.hasAttribute('data-instant-motion')).toBe(true)
    expect(document.body.querySelector('[data-slot=positioner]')?.className).toContain(
      'transition-transform',
    )
  })

  test('does not restart an always-open tooltip after switching from another tooltip', async () => {
    vi.useFakeTimers()

    const screen = renderWithDesign(() => (
      <div>
        <Tooltip open>
          <Tooltip.Trigger as="button" type="button">
            Always
          </Tooltip.Trigger>
          <Tooltip.Content text="Always open" />
        </Tooltip>
        <Tooltip>
          <Tooltip.Trigger as="button" type="button">
            Other
          </Tooltip.Trigger>
          <Tooltip.Content text="Other tooltip" />
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
    expect(getAlwaysContent().hasAttribute('data-instant-motion')).toBe(false)

    fireEvent.pointerLeave(alwaysTrigger)
    await vi.advanceTimersByTimeAsync(200)

    expect(getAlwaysContent().className).toBe(initialClass)
    expect(getAlwaysContent().getAttribute('data-expanded')).toBe('')
  })

  test('keeps the first hover delay when another tooltip starts open', async () => {
    vi.useFakeTimers()

    const screen = render(() => (
      <div>
        <Tooltip open>
          <Tooltip.Trigger as="button" type="button">
            Always
          </Tooltip.Trigger>
          <Tooltip.Content text="Always open" />
        </Tooltip>
        <Tooltip openDelay={100}>
          <Tooltip.Trigger as="button" type="button">
            Delayed
          </Tooltip.Trigger>
          <Tooltip.Content text="Delayed tooltip" />
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

    const screen = renderWithDesign(() => (
      <div>
        <Tooltip>
          <Tooltip.Trigger as="button" type="button">
            First
          </Tooltip.Trigger>
          <Tooltip.Content text="First tooltip" />
        </Tooltip>
        <Tooltip>
          <Tooltip.Trigger as="button" type="button">
            Second
          </Tooltip.Trigger>
          <Tooltip.Content text="Second tooltip" />
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
    expect(activeTooltip?.hasAttribute('data-instant-motion')).toBe(true)

    await vi.advanceTimersByTimeAsync(199)

    expect(document.body.querySelector('[role=tooltip]')?.className).toBe(activeTooltipClass)

    await vi.advanceTimersByTimeAsync(1)

    const closingTooltip = document.body.querySelector('[role=tooltip]')

    expect(closingTooltip?.getAttribute('data-closed')).toBe('')
    expect(closingTooltip?.className).toContain('data-closed:animate-mo-exit')
    expect(closingTooltip?.hasAttribute('data-instant-motion')).toBe(false)
  })

  test('does not skip delay when the previous trigger never opened', async () => {
    vi.useFakeTimers()

    const screen = render(() => (
      <div>
        <Tooltip>
          <Tooltip.Trigger as="button" type="button">
            First
          </Tooltip.Trigger>
          <Tooltip.Content text="First tooltip" />
        </Tooltip>
        <Tooltip>
          <Tooltip.Trigger as="button" type="button">
            Second
          </Tooltip.Trigger>
          <Tooltip.Content text="Second tooltip" />
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
