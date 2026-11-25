import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { finishExitMotion } from '../../test-util/overlay-test'

import { HoverCard } from './hover-card'
const floatingMocks = vi.hoisted(() => ({
  middlewareNames: [] as Array<string>,
}))

vi.mock('@floating-ui/dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@floating-ui/dom')>()
  return {
    ...actual,
    computePosition: (...args: Parameters<typeof actual.computePosition>) => {
      floatingMocks.middlewareNames.push(
        ...(args[2]?.middleware?.flatMap((middleware) => (middleware ? [middleware.name] : [])) ??
          []),
      )
      return actual.computePosition(...args)
    },
  }
})

function stubFocusVisible(value: boolean): void {
  const originalMatches = Element.prototype.matches
  vi.spyOn(Element.prototype, 'matches').mockImplementation(function (
    this: Element,
    selector: string,
  ) {
    if (selector === ':focus-visible') {
      return value
    }
    return originalMatches.call(this, selector)
  })
}

const contentSelector = '[data-slot="hover-card-content"]'

describe('HoverCard', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    floatingMocks.middlewareNames.length = 0
  })

  test('opens after the open delay and closes after the close delay', async () => {
    vi.useFakeTimers()
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <HoverCard openDelay={600} closeDelay={300} onOpenChange={onOpenChange}>
        <HoverCard.Trigger href="/u/solid">@solidjs</HoverCard.Trigger>
        <HoverCard.Content>Card content</HoverCard.Content>
      </HoverCard>
    ))
    const trigger = screen.getByText('@solidjs')

    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    expect(document.body.querySelector(contentSelector)).toBeNull()
    await vi.advanceTimersByTimeAsync(599)
    expect(document.body.querySelector(contentSelector)).toBeNull()
    await vi.advanceTimersByTimeAsync(1)
    const content = document.body.querySelector<HTMLElement>(contentSelector)
    expect(content?.textContent).toContain('Card content')
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true)

    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(299)
    expect(content?.hasAttribute('data-expanded')).toBe(true)
    await vi.advanceTimersByTimeAsync(1)
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(content?.hasAttribute('data-closed')).toBe(true)
    await finishExitMotion(content)
    expect(document.body.querySelector(contentSelector)).toBeNull()
  })

  test('renders the trigger as an anchor without aria relation attributes', async () => {
    render(() => (
      <HoverCard defaultOpen>
        <HoverCard.Trigger href="/u/solid">@solidjs</HoverCard.Trigger>
        <HoverCard.Content>Card content</HoverCard.Content>
      </HoverCard>
    ))
    const trigger = document.body.querySelector<HTMLElement>('[data-slot="hover-card-trigger"]')!

    expect(trigger.tagName).toBe('A')
    expect(trigger.getAttribute('href')).toBe('/u/solid')
    expect(trigger.getAttribute('aria-haspopup')).toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBeNull()
    expect(trigger.getAttribute('aria-controls')).toBeNull()
    expect(trigger.getAttribute('aria-describedby')).toBeNull()

    await waitFor(() => {
      const content = document.body.querySelector<HTMLElement>(contentSelector)
      expect(content).not.toBeNull()
      expect(content!.getAttribute('role')).toBeNull()
      expect(content!.getAttribute('tabindex')).toBe('-1')
    })
    expect(
      document.body.querySelector<HTMLElement>('[data-slot="hover-card-trigger"]'),
    ).not.toBeNull()
  })

  test('honors a custom trigger root', () => {
    render(() => (
      <HoverCard>
        <HoverCard.Trigger as="button" type="button">
          Trigger
        </HoverCard.Trigger>
        <HoverCard.Content>Card content</HoverCard.Content>
      </HoverCard>
    ))

    const trigger = document.body.querySelector('[data-slot="hover-card-trigger"]')
    expect(trigger?.tagName).toBe('BUTTON')
  })

  test('defaults to bottom placement with centered alignment', async () => {
    render(() => (
      <HoverCard defaultOpen>
        <HoverCard.Trigger>Trigger</HoverCard.Trigger>
        <HoverCard.Content>Card content</HoverCard.Content>
      </HoverCard>
    ))

    await waitFor(() => {
      const content = document.body.querySelector(contentSelector)
      expect(content?.getAttribute('data-side')).toBe('bottom')
      expect(content?.getAttribute('data-align')).toBe('center')
    })
  })

  test('ignores touch and pen hover before accepting mouse hover', async () => {
    vi.useFakeTimers()
    const screen = render(() => (
      <HoverCard openDelay={50}>
        <HoverCard.Trigger>Trigger</HoverCard.Trigger>
        <HoverCard.Content>Card content</HoverCard.Content>
      </HoverCard>
    ))
    const trigger = screen.getByText('Trigger')

    fireEvent.pointerEnter(trigger, { pointerType: 'touch' })
    fireEvent.pointerEnter(trigger, { pointerType: 'pen' })
    await vi.advanceTimersByTimeAsync(50)
    expect(document.body.querySelector(contentSelector)).toBeNull()

    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(50)
    expect(document.body.querySelector(contentSelector)).not.toBeNull()
  })

  test('a disabled trigger does not open on hover or keyboard focus', async () => {
    vi.useFakeTimers()
    stubFocusVisible(true)
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <HoverCard openDelay={50} onOpenChange={onOpenChange}>
        <HoverCard.Trigger href="/u/solid" disabled>
          @solidjs
        </HoverCard.Trigger>
        <HoverCard.Content>Card content</HoverCard.Content>
      </HoverCard>
    ))
    const trigger = screen.getByText('@solidjs')

    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    fireEvent.focus(trigger)
    await vi.advanceTimersByTimeAsync(100)
    expect(document.body.querySelector(contentSelector)).toBeNull()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  test('opens on keyboard focus but not on pointer focus', { timeout: 15_000 }, async () => {
    vi.useFakeTimers()
    stubFocusVisible(false)
    const screen = render(() => (
      <HoverCard openDelay={50}>
        <HoverCard.Trigger>Trigger</HoverCard.Trigger>
        <HoverCard.Content>Card content</HoverCard.Content>
      </HoverCard>
    ))
    const trigger = screen.getByText('Trigger')

    fireEvent.focus(trigger)
    await vi.advanceTimersByTimeAsync(50)
    expect(document.body.querySelector(contentSelector)).toBeNull()

    fireEvent.blur(trigger)
    stubFocusVisible(true)
    fireEvent.focus(trigger)
    await vi.advanceTimersByTimeAsync(50)
    const content = document.body.querySelector(contentSelector)
    expect(content?.textContent).toContain('Card content')
    expect(content?.hasAttribute('data-instant-motion')).toBe(true)
  })

  test('does not reopen when window focus returns to a trigger after window blur', async () => {
    vi.useFakeTimers()
    stubFocusVisible(true)
    const screen = render(() => (
      <HoverCard openDelay={50}>
        <HoverCard.Trigger>Trigger</HoverCard.Trigger>
        <HoverCard.Content>Card content</HoverCard.Content>
      </HoverCard>
    ))
    const trigger = screen.getByText('Trigger')

    fireEvent.focus(trigger)
    fireEvent.blur(window)
    fireEvent.focus(trigger)
    await vi.advanceTimersByTimeAsync(50)
    expect(document.body.querySelector(contentSelector)).toBeNull()

    fireEvent.blur(trigger)
    fireEvent.focus(trigger)
    await vi.advanceTimersByTimeAsync(50)
    expect(document.body.querySelector(contentSelector)).not.toBeNull()
  })

  test('keeps the card open while the pointer moves from trigger to content', async () => {
    vi.useFakeTimers()
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <HoverCard openDelay={50} closeDelay={50} onOpenChange={onOpenChange}>
        <HoverCard.Trigger>Trigger</HoverCard.Trigger>
        <HoverCard.Content>Card content</HoverCard.Content>
      </HoverCard>
    ))
    const trigger = screen.getByText('Trigger')

    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(50)
    const content = document.body.querySelector<HTMLElement>(contentSelector)!
    expect(content).not.toBeNull()

    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' })
    fireEvent.pointerEnter(content, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(100)
    expect(content.hasAttribute('data-expanded')).toBe(true)
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true)

    fireEvent.pointerLeave(content, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(50)
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  test('does not close an externally opened card when leaving its content', async () => {
    vi.useFakeTimers()
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <HoverCard defaultOpen closeDelay={50} onOpenChange={onOpenChange}>
        <HoverCard.Trigger>Trigger</HoverCard.Trigger>
        <HoverCard.Content>Card content</HoverCard.Content>
      </HoverCard>
    ))
    const trigger = screen.getByText('Trigger')
    const content = document.body.querySelector<HTMLElement>(contentSelector)!

    fireEvent.pointerEnter(content, { pointerType: 'mouse' })
    fireEvent.pointerLeave(content, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(100)
    expect(content.hasAttribute('data-expanded')).toBe(true)
    expect(onOpenChange).not.toHaveBeenCalled()

    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(50)
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
  })

  test('does not fire onOpenChange again when re-hovering while open', async () => {
    vi.useFakeTimers()
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <HoverCard openDelay={50} closeDelay={50} onOpenChange={onOpenChange}>
        <HoverCard.Trigger>Trigger</HoverCard.Trigger>
        <HoverCard.Content>Card content</HoverCard.Content>
      </HoverCard>
    ))
    const trigger = screen.getByText('Trigger')

    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(50)
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true)

    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' })
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(100)
    expect(onOpenChange).toHaveBeenCalledTimes(1)
    expect(document.body.querySelector(contentSelector)?.hasAttribute('data-expanded')).toBe(true)
  })

  test('emits one controlled open request after rapid re-entry', async () => {
    vi.useFakeTimers()
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <HoverCard open={false} openDelay={50} closeDelay={50} onOpenChange={onOpenChange}>
        <HoverCard.Trigger>Trigger</HoverCard.Trigger>
        <HoverCard.Content>Card content</HoverCard.Content>
      </HoverCard>
    ))
    const trigger = screen.getByText('Trigger')

    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' })
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(50)

    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true)
    expect(document.body.querySelector(contentSelector)).toBeNull()
  })

  test('closes with instant motion on Escape and reopens on hover', async () => {
    vi.useFakeTimers()
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <HoverCard openDelay={50} closeDelay={50} onOpenChange={onOpenChange}>
        <HoverCard.Trigger>Trigger</HoverCard.Trigger>
        <HoverCard.Content>Card content</HoverCard.Content>
      </HoverCard>
    ))
    const trigger = screen.getByText('Trigger')

    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(50)
    const content = document.body.querySelector<HTMLElement>(contentSelector)!
    expect(content.hasAttribute('data-instant-motion')).toBe(false)

    fireEvent.keyDown(content, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(content.hasAttribute('data-closed')).toBe(true)
    expect(content.hasAttribute('data-instant-motion')).toBe(true)
    await finishExitMotion(content)
    expect(document.body.querySelector(contentSelector)).toBeNull()

    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(50)
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
    expect(document.body.querySelector(contentSelector)).not.toBeNull()
  })

  test('closes on outside press and reopens on hover', async () => {
    vi.useFakeTimers()
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <div>
        <HoverCard openDelay={50} closeDelay={50} onOpenChange={onOpenChange}>
          <HoverCard.Trigger>Trigger</HoverCard.Trigger>
          <HoverCard.Content>Card content</HoverCard.Content>
        </HoverCard>
        <button type="button" data-testid="outside">
          Outside
        </button>
      </div>
    ))
    const trigger = screen.getByText('Trigger')

    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(50)
    const content = document.body.querySelector<HTMLElement>(contentSelector)!
    expect(content).not.toBeNull()

    fireEvent.pointerDown(screen.getByTestId('outside'))
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(content.hasAttribute('data-instant-motion')).toBe(true)
    await finishExitMotion(content)
    expect(document.body.querySelector(contentSelector)).toBeNull()

    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(50)
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
  })

  test('does not close or prevent default when the trigger is clicked', async () => {
    vi.useFakeTimers()
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <HoverCard openDelay={50} onOpenChange={onOpenChange}>
        <HoverCard.Trigger>Trigger</HoverCard.Trigger>
        <HoverCard.Content>Card content</HoverCard.Content>
      </HoverCard>
    ))
    const trigger = screen.getByText('Trigger')

    expect(fireEvent.click(trigger)).toBe(true)
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(document.body.querySelector(contentSelector)).toBeNull()

    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(50)
    expect(document.body.querySelector(contentSelector)).not.toBeNull()

    expect(fireEvent.click(trigger)).toBe(true)
    expect(onOpenChange).toHaveBeenCalledTimes(1)
    expect(document.body.querySelector(contentSelector)?.hasAttribute('data-expanded')).toBe(true)
  })

  test('keeps the parent card open while a nested card is hovered and closes both together', async () => {
    vi.useFakeTimers()
    const parentChange = vi.fn()
    const childChange = vi.fn()
    const screen = render(() => (
      <HoverCard openDelay={50} closeDelay={50} onOpenChange={parentChange}>
        <HoverCard.Trigger>Parent trigger</HoverCard.Trigger>
        <HoverCard.Content>
          Parent content
          <HoverCard openDelay={50} closeDelay={50} onOpenChange={childChange}>
            <HoverCard.Trigger>Child trigger</HoverCard.Trigger>
            <HoverCard.Content>Child content</HoverCard.Content>
          </HoverCard>
        </HoverCard.Content>
      </HoverCard>
    ))
    const parentTrigger = screen.getByText('Parent trigger')

    fireEvent.pointerEnter(parentTrigger, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(50)
    const parentContent = document.body.querySelector<HTMLElement>(contentSelector)!
    const childTrigger = parentContent.querySelector<HTMLElement>(
      '[data-slot="hover-card-trigger"]',
    )!

    // Moving into the parent content and then the child trigger keeps the parent open.
    fireEvent.pointerLeave(parentTrigger, { pointerType: 'mouse' })
    fireEvent.pointerEnter(parentContent, { pointerType: 'mouse' })
    fireEvent.pointerEnter(childTrigger, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(50)

    const contents = document.body.querySelectorAll<HTMLElement>(contentSelector)
    const childContent = Array.from(contents).find((element) =>
      element.textContent?.includes('Child content'),
    )!
    expect(childContent).not.toBeUndefined()
    expect(parentContent.hasAttribute('data-expanded')).toBe(true)

    // Hovering the child content keeps the parent open as well.
    fireEvent.pointerLeave(childTrigger, { pointerType: 'mouse' })
    fireEvent.pointerEnter(childContent, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(100)
    expect(parentContent.hasAttribute('data-expanded')).toBe(true)
    expect(childContent.hasAttribute('data-expanded')).toBe(true)

    // Leaving the child content closes the child and the parent together.
    fireEvent.pointerLeave(childContent, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(50)
    expect(childChange).toHaveBeenLastCalledWith(false)
    expect(parentChange).toHaveBeenLastCalledWith(false)
  })

  test('moves one shared card across triggers and exposes each trigger value', async () => {
    vi.useFakeTimers()
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <HoverCard openDelay={50} closeDelay={50} onOpenChange={onOpenChange}>
        <HoverCard.Trigger value="ananya">@ananya</HoverCard.Trigger>
        <HoverCard.Trigger value="jules">@jules</HoverCard.Trigger>
        <HoverCard.Content>
          {(context) => <div>Profile: {context.value() ?? 'unknown'}</div>}
        </HoverCard.Content>
      </HoverCard>
    ))
    const first = screen.getByText('@ananya')
    const second = screen.getByText('@jules')

    fireEvent.pointerEnter(first, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(50)
    const content = document.body.querySelector<HTMLElement>(contentSelector)!
    expect(content.textContent).toContain('Profile: ananya')
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true)

    // Hovering another trigger moves the open card without closing it.
    fireEvent.pointerLeave(first, { pointerType: 'mouse' })
    fireEvent.pointerEnter(second, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(50)
    expect(content.textContent).toContain('Profile: jules')
    expect(content.hasAttribute('data-expanded')).toBe(true)
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true)

    // Leaving the last trigger closes the shared card once.
    fireEvent.pointerLeave(second, { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(50)
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    await finishExitMotion(content)
  })

  test('does not open while disabled', async () => {
    vi.useFakeTimers()
    stubFocusVisible(true)
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <HoverCard disabled openDelay={50} onOpenChange={onOpenChange}>
        <HoverCard.Trigger>Trigger</HoverCard.Trigger>
        <HoverCard.Content>Card content</HoverCard.Content>
      </HoverCard>
    ))
    const trigger = screen.getByText('Trigger')

    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    fireEvent.focus(trigger)
    await vi.advanceTimersByTimeAsync(50)
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(document.body.querySelector(contentSelector)).toBeNull()
  })

  test('anchors the content at the hovered point through the inline middleware', async () => {
    const screen = render(() => (
      <HoverCard openDelay={0}>
        <HoverCard.Trigger>Trigger</HoverCard.Trigger>
        <HoverCard.Content>Card content</HoverCard.Content>
      </HoverCard>
    ))
    const trigger = screen.getByText('Trigger')

    fireEvent.pointerEnter(trigger, { pointerType: 'mouse', clientX: 12, clientY: 34 })
    await waitFor(() => expect(floatingMocks.middlewareNames).toContain('inline'))
    expect(floatingMocks.middlewareNames.indexOf('inline')).toBeLessThan(
      floatingMocks.middlewareNames.indexOf('flip'),
    )
  })
})
