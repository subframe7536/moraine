import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { MoraineProvider } from '../../provider'
import { stubViewportSize } from '../../test-util/overlay-test'
import { defineTheme } from '../../theme'
import { isHTMLElement } from '../shared/overlay/dom'

import { Tooltip } from './tooltip'

function mockInstantTooltipExit(): void {
  const readComputedStyle = window.getComputedStyle.bind(window)

  vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => {
    const style = readComputedStyle(element)
    const isInstantExit =
      isHTMLElement(element) &&
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
  test('coordinates independently across Documents', async () => {
    const firstFrame = document.createElement('iframe')
    const secondFrame = document.createElement('iframe')
    document.body.append(firstFrame, secondFrame)
    const firstDocument = firstFrame.contentDocument!
    const secondDocument = secondFrame.contentDocument!
    const firstHost = firstDocument.createElement('div')
    const secondHost = secondDocument.createElement('div')
    firstDocument.body.append(firstHost)
    secondDocument.body.append(secondHost)
    const first = render(
      () => (
        <Tooltip defaultOpen>
          <Tooltip.Trigger>First trigger</Tooltip.Trigger>
          <Tooltip.Content>First tooltip</Tooltip.Content>
        </Tooltip>
      ),
      { container: firstHost },
    )
    const second = render(
      () => (
        <Tooltip defaultOpen>
          <Tooltip.Trigger>Second trigger</Tooltip.Trigger>
          <Tooltip.Content>Second tooltip</Tooltip.Content>
        </Tooltip>
      ),
      { container: secondHost },
    )
    try {
      await waitFor(() => {
        expect(firstDocument.body.querySelector('[role="tooltip"]')).not.toBeNull()
        expect(secondDocument.body.querySelector('[role="tooltip"]')).not.toBeNull()
      })
      first.unmount()
      expect(secondDocument.body.querySelector('[role="tooltip"]')).not.toBeNull()
    } finally {
      second.unmount()
      firstFrame.remove()
      secondFrame.remove()
    }
  })

  test('does not share skip delay with a different Document', async () => {
    vi.useFakeTimers()
    const firstFrame = document.createElement('iframe')
    const secondFrame = document.createElement('iframe')
    document.body.append(firstFrame, secondFrame)
    const firstDocument = firstFrame.contentDocument!
    const secondDocument = secondFrame.contentDocument!
    const firstHost = firstDocument.createElement('div')
    const secondHost = secondDocument.createElement('div')
    firstDocument.body.append(firstHost)
    secondDocument.body.append(secondHost)
    const [open, setOpen] = createSignal(true)
    const first = render(
      () => (
        <Tooltip open={open()} instantOpenDelay={1000}>
          <Tooltip.Trigger>First</Tooltip.Trigger>
          <Tooltip.Content>First tooltip</Tooltip.Content>
        </Tooltip>
      ),
      { container: firstHost },
    )
    const second = render(
      () => (
        <Tooltip openDelay={600}>
          <Tooltip.Trigger>Second</Tooltip.Trigger>
          <Tooltip.Content>Second tooltip</Tooltip.Content>
        </Tooltip>
      ),
      { container: secondHost },
    )
    try {
      setOpen(false)
      fireEvent.pointerEnter(secondHost.querySelector('[data-slot="tooltip-trigger"]')!, {
        pointerType: 'mouse',
      })
      expect(secondDocument.body.querySelector('[role="tooltip"]')).toBeNull()
      await vi.advanceTimersByTimeAsync(599)
      expect(secondDocument.body.querySelector('[role="tooltip"]')).toBeNull()
      await vi.advanceTimersByTimeAsync(1)
      expect(secondDocument.body.querySelector('[role="tooltip"]')).not.toBeNull()
    } finally {
      first.unmount()
      second.unmount()
      firstFrame.remove()
      secondFrame.remove()
      vi.useRealTimers()
    }
  })
  test.each([0, 600])('dismisses activation and cancels reopening after %i ms', async (delay) => {
    vi.useFakeTimers()
    mockInstantTooltipExit()
    const screen = render(() => (
      <Tooltip>
        <Tooltip.Trigger>Press target</Tooltip.Trigger>
        <Tooltip.Content>Press hint</Tooltip.Content>
      </Tooltip>
    ))
    const trigger = screen.getByText('Press target')
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(delay)
    fireEvent.pointerDown(trigger, { pointerType: 'mouse' })
    fireEvent.focus(trigger)
    fireEvent.click(trigger)
    await vi.advanceTimersByTimeAsync(1000)
    expect(trigger.getAttribute('aria-expanded')).toBeNull()
    expect(document.querySelector('[role="tooltip"]')).toBeNull()
    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' })
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(600)
    expect(trigger.getAttribute('aria-expanded')).toBeNull()
    fireEvent.click(trigger, { detail: 0 })
    expect(trigger.getAttribute('aria-expanded')).toBeNull()
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  test('renders text content when open is controlled', () => {
    render(() => (
      <Tooltip open>
        <Tooltip.Trigger as="button" type="button">
          Trigger
        </Tooltip.Trigger>
        <Tooltip.Content>Tooltip content</Tooltip.Content>
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
        <Tooltip.Content>Tooltip content</Tooltip.Content>
      </Tooltip>
    ))

    const trigger = document.body.querySelector('[data-slot="tooltip-trigger"]')

    expect(trigger?.tagName).toBe('BUTTON')
    expect(trigger?.getAttribute('type')).toBe('button')
    expect(trigger?.hasAttribute('data-closed')).toBe(true)
    expect(trigger?.hasAttribute('data-expanded')).toBe(false)
  })

  test('renders a span trigger root', () => {
    render(() => (
      <Tooltip>
        <Tooltip.Trigger as="span">Trigger</Tooltip.Trigger>
        <Tooltip.Content>Tooltip content</Tooltip.Content>
      </Tooltip>
    ))

    expect(document.body.querySelector('[data-slot="tooltip-trigger"]')?.tagName).toBe('SPAN')
  })

  test('applies top-level class and style to trigger', () => {
    render(() => (
      <Tooltip>
        <Tooltip.Trigger as="button" class="trigger-class" style={{ width: '200px' }} type="button">
          Trigger
        </Tooltip.Trigger>
        <Tooltip.Content>Tooltip content</Tooltip.Content>
      </Tooltip>
    ))

    const trigger = document.body.querySelector(
      '[data-slot="tooltip-trigger"]',
    ) as HTMLElement | null

    expect(trigger?.className).toContain('trigger-class')
    expect(trigger?.style.width).toBe('200px')
  })

  test('applies provider trigger classes and styles', () => {
    render(() => (
      <MoraineProvider
        theme={defineTheme({
          tooltip: { base: { trigger: 'provider-trigger' } },
        })}
      >
        <Tooltip>
          <Tooltip.Trigger as="button">Trigger</Tooltip.Trigger>
          <Tooltip.Content>Help</Tooltip.Content>
        </Tooltip>
      </MoraineProvider>
    ))

    const trigger = document.body.querySelector<HTMLElement>('[data-slot="tooltip-trigger"]')
    expect(trigger?.className).toContain('provider-trigger')
  })

  test('renders keyboard hints', () => {
    render(() => (
      <Tooltip open>
        <Tooltip.Trigger as="button" type="button">
          Trigger
        </Tooltip.Trigger>
        <Tooltip.Content kbds={['Ctrl', 'S']}>Save</Tooltip.Content>
      </Tooltip>
    ))

    const kbds = document.body.querySelectorAll('[data-slot="kbd-group-item"]')
    expect(kbds.length).toBe(2)
    expect(kbds.item(0)?.textContent).toBe('Ctrl')
    expect(kbds.item(1)?.textContent).toBe('S')
    expect(document.body.querySelectorAll('[data-slot="tooltip-kbds"]').length).toBe(1)
  })

  test('routes classes and styles to their slots', () => {
    render(() => (
      <Tooltip
        open
        classes={{ content: 'user-content', text: 'user-text', kbds: 'user-kbds' }}
        styles={{ content: { width: '200px' } }}
      >
        <Tooltip.Trigger>Trigger</Tooltip.Trigger>
        <Tooltip.Content kbds={['S']}>Styled</Tooltip.Content>
      </Tooltip>
    ))

    const content = document.body.querySelector<HTMLElement>('[data-slot="tooltip-content"]')

    expect(content?.className).toContain('user-content')
    expect(content?.style.width).toBe('200px')
    expect(document.body.querySelector('[data-slot="tooltip-text"]')?.className).toContain(
      'user-text',
    )
    expect(document.body.querySelector('[data-slot="tooltip-kbds"]')?.className).toContain(
      'user-kbds',
    )
  })

  test('shows children as the tooltip text when text is not provided', () => {
    render(() => (
      <Tooltip open>
        <Tooltip.Trigger>Trigger</Tooltip.Trigger>
        <Tooltip.Content>Child text</Tooltip.Content>
      </Tooltip>
    ))

    expect(document.body.querySelector('[role="tooltip"]')?.textContent).toBe('Child text')
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
        <Tooltip.Content>Tooltip content</Tooltip.Content>
      </Tooltip>
    ))

    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  test('renders controlled overlay without a trigger', async () => {
    render(() => (
      <Tooltip open>
        <Tooltip.Content>Tooltip content</Tooltip.Content>
      </Tooltip>
    ))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="tooltip-content"]')?.textContent).toContain(
        'Tooltip content',
      )
    })
  })

  test('defaults to the top side with centered alignment', () => {
    render(() => (
      <Tooltip open>
        <Tooltip.Trigger>Trigger</Tooltip.Trigger>
        <Tooltip.Content>Tooltip content</Tooltip.Content>
      </Tooltip>
    ))

    const content = document.body.querySelector('[data-slot="tooltip-content"]')

    expect(content?.getAttribute('data-side')).toBe('top')
    expect(content?.getAttribute('data-align')).toBe('center')
  })

  test('updates side and alignment when placement props change without replacing content', () => {
    const [placement, setPlacement] = createSignal<'top' | 'bottom'>('top')
    const [align, setAlign] = createSignal<'center' | 'start'>('center')

    render(() => (
      <Tooltip open placement={placement()} align={align()}>
        <Tooltip.Trigger as="button" type="button">
          Trigger
        </Tooltip.Trigger>
        <Tooltip.Content>Tooltip content</Tooltip.Content>
      </Tooltip>
    ))

    const initialContent = document.body.querySelector('[data-slot="tooltip-content"]')
    expect(initialContent?.getAttribute('data-side')).toBe('top')
    expect(initialContent?.getAttribute('data-align')).toBe('center')

    setPlacement('bottom')
    setAlign('start')

    const updatedContent = document.body.querySelector('[data-slot="tooltip-content"]')
    expect(updatedContent).toBe(initialContent)
    expect(updatedContent?.getAttribute('data-side')).toBe('bottom')
    expect(updatedContent?.getAttribute('data-align')).toBe('start')
  })

  test('opens first hover after delay', async () => {
    vi.useFakeTimers()

    const screen = render(() => (
      <Tooltip>
        <Tooltip.Trigger as="button" type="button">
          Trigger
        </Tooltip.Trigger>
        <Tooltip.Content>Tooltip content</Tooltip.Content>
      </Tooltip>
    ))

    const trigger = screen.getByText('Trigger').closest('[data-slot="tooltip-trigger"]')!

    fireEvent.pointerEnter(trigger)

    expect(document.body.querySelector('[role=tooltip]')).toBeNull()

    await vi.advanceTimersByTimeAsync(599)
    expect(document.body.querySelector('[role=tooltip]')).toBeNull()

    await vi.advanceTimersByTimeAsync(1)
    expect(document.body.querySelector('[role=tooltip]')?.textContent).toContain('Tooltip content')
  })

  test('does not reopen when window focus returns to a trigger with a pending focus delay', async () => {
    vi.useFakeTimers()
    const screen = render(() => (
      <Tooltip openDelay={50}>
        <Tooltip.Trigger as="button" type="button">
          Trigger
        </Tooltip.Trigger>
        <Tooltip.Content>Tooltip content</Tooltip.Content>
      </Tooltip>
    ))
    const trigger = screen.getByRole('button')

    fireEvent.focus(trigger)
    fireEvent.blur(window)
    fireEvent.focus(trigger)
    await vi.advanceTimersByTimeAsync(50)

    expect(document.body.querySelector('[role="tooltip"]')).toBeNull()

    fireEvent.blur(trigger)
    fireEvent.focus(trigger)
    await vi.advanceTimersByTimeAsync(50)
    expect(document.body.querySelector('[role="tooltip"]')).not.toBeNull()
  })

  test('ignores touch and pen hover before accepting mouse hover', async () => {
    vi.useFakeTimers()
    const screen = render(() => (
      <Tooltip openDelay={50}>
        <Tooltip.Trigger as="button" type="button">
          Trigger
        </Tooltip.Trigger>
        <Tooltip.Content>Mouse tooltip</Tooltip.Content>
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
        <Tooltip.Content>Disabled tooltip</Tooltip.Content>
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
        <Tooltip.Content>Controlled tooltip</Tooltip.Content>
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
          <Tooltip.Content>Rejected tooltip</Tooltip.Content>
        </Tooltip>
        <Tooltip openDelay={100}>
          <Tooltip.Trigger as="button" type="button">
            Second
          </Tooltip.Trigger>
          <Tooltip.Content>Second tooltip</Tooltip.Content>
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
        <Tooltip.Content>First tooltip</Tooltip.Content>
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
        <Tooltip.Content>Second tooltip</Tooltip.Content>
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
        <Tooltip.Content>First tooltip</Tooltip.Content>
      </Tooltip>
    ))
    const second = render(() => (
      <Tooltip open>
        <Tooltip.Trigger as="button">Second</Tooltip.Trigger>
        <Tooltip.Content>Second tooltip</Tooltip.Content>
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

  test('opens the next tooltip immediately and closes the previous tooltip', async () => {
    vi.useFakeTimers()
    mockInstantTooltipExit()

    const screen = render(() => (
      <div>
        <Tooltip>
          <Tooltip.Trigger as="button" type="button">
            First
          </Tooltip.Trigger>
          <Tooltip.Content>First tooltip</Tooltip.Content>
        </Tooltip>
        <Tooltip>
          <Tooltip.Trigger as="button" type="button">
            Second
          </Tooltip.Trigger>
          <Tooltip.Content>Second tooltip</Tooltip.Content>
        </Tooltip>
        <Tooltip>
          <Tooltip.Trigger>Third</Tooltip.Trigger>
          <Tooltip.Content>Third tooltip</Tooltip.Content>
        </Tooltip>
      </div>
    ))

    const firstTrigger = screen.getByText('First').closest('[data-slot="tooltip-trigger"]')!
    const secondTrigger = screen.getByText('Second').closest('[data-slot="tooltip-trigger"]')!
    const firstButton = screen.getByText('First')

    fireEvent.pointerEnter(firstTrigger)
    await vi.advanceTimersByTimeAsync(600)
    expect(document.body.querySelector('[role=tooltip]')?.textContent).toContain('First tooltip')

    fireEvent.pointerLeave(firstTrigger)
    fireEvent.pointerEnter(secondTrigger)
    await vi.advanceTimersByTimeAsync(0)

    expect(document.body.querySelectorAll('[role=tooltip]')).toHaveLength(1)
    expect(document.body.querySelector('[role=tooltip]')?.textContent).toContain('Second tooltip')
    expect(document.body.querySelector('[role=tooltip]')?.textContent).not.toContain(
      'First tooltip',
    )
    expect(document.activeElement).not.toBe(firstButton)

    fireEvent.pointerLeave(secondTrigger)
    fireEvent.pointerEnter(screen.getByText('Third'))
    await vi.advanceTimersByTimeAsync(0)

    expect(document.body.querySelectorAll('[role=tooltip]')).toHaveLength(1)
    expect(document.body.querySelector('[role=tooltip]')?.textContent).toContain('Third tooltip')
  })

  test('opens the next tooltip without its delay right after another closes', async () => {
    vi.useFakeTimers()
    const screen = render(() => (
      <>
        <Tooltip closeDelay={0}>
          <Tooltip.Trigger>First</Tooltip.Trigger>
          <Tooltip.Content style={{ 'animation-name': 'none', 'animation-duration': '0s' }}>
            First tooltip
          </Tooltip.Content>
        </Tooltip>
        <Tooltip>
          <Tooltip.Trigger>Second</Tooltip.Trigger>
          <Tooltip.Content>Second tooltip</Tooltip.Content>
        </Tooltip>
      </>
    ))
    fireEvent.pointerEnter(screen.getByText('First'))
    await vi.advanceTimersByTimeAsync(600)
    fireEvent.pointerLeave(screen.getByText('First'))
    await vi.advanceTimersByTimeAsync(0)
    expect(document.body.querySelector('[role=tooltip]')).toBeNull()

    fireEvent.pointerEnter(screen.getByText('Second'))
    await vi.advanceTimersByTimeAsync(0)
    expect(document.body.querySelector('[role=tooltip]')?.textContent).toContain('Second tooltip')
  })

  test('keeps an always-open tooltip visible when another tooltip is hovered and left', async () => {
    vi.useFakeTimers()

    const screen = render(() => (
      <div>
        <Tooltip open>
          <Tooltip.Trigger as="button" type="button">
            Always
          </Tooltip.Trigger>
          <Tooltip.Content>Always open</Tooltip.Content>
        </Tooltip>
        <Tooltip>
          <Tooltip.Trigger as="button" type="button">
            Other
          </Tooltip.Trigger>
          <Tooltip.Content>Other tooltip</Tooltip.Content>
        </Tooltip>
      </div>
    ))

    const alwaysTrigger = screen.getByText('Always').closest('[data-slot="tooltip-trigger"]')!
    const otherTrigger = screen.getByText('Other').closest('[data-slot="tooltip-trigger"]')!
    const getAlwaysContent = (): HTMLElement =>
      Array.from(document.body.querySelectorAll('[role=tooltip]')).find((element) =>
        element.textContent?.includes('Always open'),
      ) as HTMLElement

    fireEvent.pointerEnter(otherTrigger)
    await vi.advanceTimersByTimeAsync(600)
    fireEvent.pointerLeave(otherTrigger)
    fireEvent.pointerEnter(alwaysTrigger)
    expect(getAlwaysContent()?.textContent).toContain('Always open')

    fireEvent.pointerLeave(alwaysTrigger)
    await vi.advanceTimersByTimeAsync(200)

    expect(getAlwaysContent()?.textContent).toContain('Always open')
    expect(getAlwaysContent()?.hasAttribute('data-expanded')).toBe(true)
  })

  test('skips the hover delay when another tooltip starts open', async () => {
    vi.useFakeTimers()

    const screen = render(() => (
      <div>
        <Tooltip open>
          <Tooltip.Trigger as="button" type="button">
            Always
          </Tooltip.Trigger>
          <Tooltip.Content>Always open</Tooltip.Content>
        </Tooltip>
        <Tooltip openDelay={100}>
          <Tooltip.Trigger as="button" type="button">
            Delayed
          </Tooltip.Trigger>
          <Tooltip.Content>Delayed tooltip</Tooltip.Content>
        </Tooltip>
      </div>
    ))

    const hasDelayedTooltip = (): boolean =>
      Array.from(document.body.querySelectorAll('[role="tooltip"]')).some((element) =>
        element.textContent?.includes('Delayed tooltip'),
      )

    fireEvent.pointerEnter(screen.getByText('Delayed'), { pointerType: 'mouse' })

    expect(hasDelayedTooltip()).toBe(true)
  })

  test('keeps the switched-to tooltip open for its close delay after leaving it', async () => {
    vi.useFakeTimers()
    mockInstantTooltipExit()

    const screen = render(() => (
      <div>
        <Tooltip>
          <Tooltip.Trigger as="button" type="button">
            First
          </Tooltip.Trigger>
          <Tooltip.Content>First tooltip</Tooltip.Content>
        </Tooltip>
        <Tooltip>
          <Tooltip.Trigger as="button" type="button">
            Second
          </Tooltip.Trigger>
          <Tooltip.Content>Second tooltip</Tooltip.Content>
        </Tooltip>
      </div>
    ))

    const firstTrigger = screen.getByText('First').closest('[data-slot="tooltip-trigger"]')!
    const secondTrigger = screen.getByText('Second').closest('[data-slot="tooltip-trigger"]')!

    fireEvent.pointerEnter(firstTrigger)
    await vi.advanceTimersByTimeAsync(600)
    fireEvent.pointerLeave(firstTrigger)
    fireEvent.pointerEnter(secondTrigger)
    await Promise.resolve()
    fireEvent.pointerLeave(secondTrigger)

    const activeTooltip = document.body.querySelector('[role=tooltip]')

    expect(activeTooltip?.textContent).toContain('Second tooltip')

    await vi.advanceTimersByTimeAsync(199)

    expect(activeTooltip?.hasAttribute('data-expanded')).toBe(true)

    await vi.advanceTimersByTimeAsync(1)

    const closingTooltip = document.body.querySelector('[role=tooltip]')

    expect(closingTooltip?.hasAttribute('data-closed')).toBe(true)
  })

  test('does not skip delay when the previous trigger never opened', async () => {
    vi.useFakeTimers()

    const screen = render(() => (
      <div>
        <Tooltip>
          <Tooltip.Trigger as="button" type="button">
            First
          </Tooltip.Trigger>
          <Tooltip.Content>First tooltip</Tooltip.Content>
        </Tooltip>
        <Tooltip>
          <Tooltip.Trigger as="button" type="button">
            Second
          </Tooltip.Trigger>
          <Tooltip.Content>Second tooltip</Tooltip.Content>
        </Tooltip>
      </div>
    ))

    const firstTrigger = screen.getByText('First').closest('[data-slot="tooltip-trigger"]')!
    const secondTrigger = screen.getByText('Second').closest('[data-slot="tooltip-trigger"]')!

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

  test.each([
    ['left', 'end'],
    ['right', 'start'],
  ] as const)('reports side %s and alignment %s on the content', (placement, align) => {
    render(() => (
      <Tooltip open placement={placement} align={align}>
        <Tooltip.Trigger>Trigger</Tooltip.Trigger>
        <Tooltip.Content>Placed tooltip</Tooltip.Content>
      </Tooltip>
    ))

    const content = document.body.querySelector('[data-slot="tooltip-content"]')

    expect(content?.getAttribute('data-side')).toBe(placement)
    expect(content?.getAttribute('data-align')).toBe(align)
  })

  test.each([
    ['the default gutter', undefined, 124],
    ['a configured gutter', 12, 132],
  ])('places content with %s', async (_, gutter, top) => {
    const restoreViewport = stubViewportSize(1000)
    try {
      render(() => (
        <Tooltip open placement="bottom" align="start" gutter={gutter}>
          <Tooltip.Trigger
            ref={(element) =>
              vi
                .spyOn(element, 'getBoundingClientRect')
                .mockReturnValue(new DOMRect(100, 100, 50, 20))
            }
          >
            Trigger
          </Tooltip.Trigger>
          <Tooltip.Content>Gap tooltip</Tooltip.Content>
        </Tooltip>
      ))
      const positioner = document.body.querySelector<HTMLElement>(
        '[data-slot="tooltip-content"]',
      )!.parentElement!

      await waitFor(() =>
        expect(positioner.style.transform).toBe(`translate3d(100px, ${top}px, 0px)`),
      )
    } finally {
      restoreViewport()
    }
  })

  test.each([
    ['the default overflow padding', undefined, 872],
    ['a configured overflow padding', 20, 856],
  ])('leaves %s between the content and the viewport edge', async (_, overflowPadding, height) => {
    const restoreViewport = stubViewportSize(1000)
    try {
      render(() => (
        <Tooltip open placement="bottom" overflowPadding={overflowPadding}>
          <Tooltip.Trigger
            ref={(element) =>
              vi
                .spyOn(element, 'getBoundingClientRect')
                .mockReturnValue(new DOMRect(100, 100, 50, 20))
            }
          >
            Trigger
          </Tooltip.Trigger>
          <Tooltip.Content>Padded tooltip</Tooltip.Content>
        </Tooltip>
      ))
      const positioner = document.body.querySelector<HTMLElement>(
        '[data-slot="tooltip-content"]',
      )!.parentElement!

      await waitFor(() =>
        expect(positioner.style.getPropertyValue('--mo-popper-content-available-height')).toBe(
          `${height}px`,
        ),
      )
    } finally {
      restoreViewport()
    }
  })
})
