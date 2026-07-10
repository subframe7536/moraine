import { fireEvent, render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { setPopperTestPlacementAccessor } from '../base/popper'

import { Tooltip } from './tooltip'
import type { TooltipProps } from './tooltip'

let getMockPlacement: () => string = () => 'top'
let setMockPlacement: (value: string) => void = () => undefined

describe('Tooltip', () => {
  beforeEach(() => {
    const [placement, setPlacement] = createSignal('top')
    getMockPlacement = placement
    setMockPlacement = setPlacement
    setPopperTestPlacementAccessor(getMockPlacement)
  })

  afterEach(() => {
    setPopperTestPlacementAccessor(undefined)
    vi.useRealTimers()
  })

  test('renders text content when open is controlled', () => {
    render(() => (
      <Tooltip open text="Tooltip content">
        <button type="button">Trigger</button>
      </Tooltip>
    ))

    expect(document.body.querySelector('[role=tooltip]')!.textContent).toContain('Tooltip content')
  })

  test('keeps trigger wrapper out of tab order', () => {
    render(() => (
      <Tooltip text="Tooltip content">
        <button type="button">Trigger</button>
      </Tooltip>
    ))

    const trigger = document.body.querySelector('[data-slot="trigger"]')

    expect(trigger?.getAttribute('tabindex')).toBe('-1')
  })

  test('applies top-level class and style to trigger', () => {
    render(() => (
      <Tooltip text="Tooltip content" class="trigger-class" style={{ width: '200px' }}>
        <button type="button">Trigger</button>
      </Tooltip>
    ))

    const trigger = document.body.querySelector('[data-slot="trigger"]') as HTMLElement | null

    expect(trigger?.className).toContain('trigger-class')
    expect(trigger?.style.width).toBe('200px')
  })

  test('renders keyboard hints', () => {
    render(() => (
      <Tooltip open text="Save" kbds={['Ctrl', 'S']}>
        <button type="button">Trigger</button>
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
        <button type="button">Trigger</button>
      </Tooltip>
    ))

    const content = document.body.querySelector('[data-slot="content"]')
    expect(content?.className).toContain('content-override')
  })

  test('renders tooltip container when no text or kbds are provided', () => {
    render(() => (
      <Tooltip open>
        <button type="button">Trigger</button>
      </Tooltip>
    ))

    const content = document.body.querySelector('[role=tooltip]')

    expect(content).not.toBeNull()
    expect(content?.textContent).toBe('')
  })

  test('does not render content when disabled', () => {
    const screen = render(() => (
      <Tooltip open text="Tooltip content" disabled>
        <button type="button">Trigger</button>
      </Tooltip>
    ))

    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  test('requires children in type contract', () => {
    // @ts-expect-error children is required
    const props: TooltipProps = { open: true, text: 'Tooltip content' }
    expect(props).toBeDefined()
  })

  test('applies styles override to content', () => {
    render(() => (
      <Tooltip open text="Styled" styles={{ content: { width: '200px' } }}>
        <button type="button">Trigger</button>
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
          <button type="button">Trigger</button>
        </Tooltip>
      )
    })

    const initialContent = document.body.querySelector('[data-slot="content"]')
    expect(initialContent?.className).toContain('data-expanded:animate-tooltip-in')
    expect(initialContent?.className).toContain('data-closed:animate-tooltip-out')
    expect(initialContent?.className).toContain('animate-tooltip-side-top')
    expect(initialContent?.className).not.toContain('animate-tooltip-side-bottom')

    setMockPlacement('bottom')
    setVersion(1)

    const updatedContent = document.body.querySelector('[data-slot="content"]')
    expect(updatedContent?.className).toContain('data-expanded:animate-tooltip-in')
    expect(updatedContent?.className).toContain('data-closed:animate-tooltip-out')
    expect(updatedContent?.className).toContain('animate-tooltip-side-bottom')
    expect(updatedContent?.className).not.toContain('animate-tooltip-side-top')
  })

  test('opens first hover after delay', async () => {
    vi.useFakeTimers()

    const screen = render(() => (
      <Tooltip text="Tooltip content">
        <button type="button">Trigger</button>
      </Tooltip>
    ))

    const trigger = screen.getByText('Trigger').parentElement!

    await fireEvent.pointerEnter(trigger)

    expect(document.body.querySelector('[role=tooltip]')).toBeNull()

    await vi.advanceTimersByTimeAsync(599)
    expect(document.body.querySelector('[role=tooltip]')).toBeNull()

    await vi.advanceTimersByTimeAsync(1)
    expect(document.body.querySelector('[role=tooltip]')?.textContent).toContain('Tooltip content')
  })

  test('opens the next tooltip immediately and closes the previous tooltip', async () => {
    vi.useFakeTimers()

    const screen = render(() => (
      <div>
        <Tooltip text="First tooltip">
          <button type="button">First</button>
        </Tooltip>
        <Tooltip text="Second tooltip">
          <button type="button">Second</button>
        </Tooltip>
      </div>
    ))

    const firstTrigger = screen.getByText('First').parentElement!
    const secondTrigger = screen.getByText('Second').parentElement!
    const firstButton = screen.getByText('First')

    await fireEvent.pointerEnter(firstTrigger)
    await vi.advanceTimersByTimeAsync(600)

    expect(document.body.querySelector('[role=tooltip]')?.textContent).toContain('First tooltip')

    await fireEvent.pointerLeave(firstTrigger)
    await fireEvent.pointerEnter(secondTrigger)

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

  test('keeps instant motion during the next tooltip close delay', async () => {
    vi.useFakeTimers()

    const screen = render(() => (
      <div>
        <Tooltip text="First tooltip">
          <button type="button">First</button>
        </Tooltip>
        <Tooltip text="Second tooltip">
          <button type="button">Second</button>
        </Tooltip>
      </div>
    ))

    const firstTrigger = screen.getByText('First').parentElement!
    const secondTrigger = screen.getByText('Second').parentElement!

    await fireEvent.pointerEnter(firstTrigger)
    await vi.advanceTimersByTimeAsync(600)
    await fireEvent.pointerLeave(firstTrigger)
    await fireEvent.pointerEnter(secondTrigger)
    await fireEvent.pointerLeave(secondTrigger)

    const activeTooltip = document.body.querySelector('[role=tooltip]')
    const activeTooltipClass = activeTooltip?.className

    expect(activeTooltipClass).toContain('data-expanded:animate-none')

    await vi.advanceTimersByTimeAsync(199)

    expect(document.body.querySelector('[role=tooltip]')?.className).toBe(activeTooltipClass)

    await vi.advanceTimersByTimeAsync(1)

    const closingTooltip = document.body.querySelector('[role=tooltip]')

    expect(closingTooltip?.getAttribute('data-closed')).toBe('')
    expect(closingTooltip?.className).toContain('data-closed:animate-tooltip-out')
    expect(closingTooltip?.className).not.toContain('data-closed:animate-none')
  })

  test('does not skip delay when the previous trigger never opened', async () => {
    vi.useFakeTimers()

    const screen = render(() => (
      <div>
        <Tooltip text="First tooltip">
          <button type="button">First</button>
        </Tooltip>
        <Tooltip text="Second tooltip">
          <button type="button">Second</button>
        </Tooltip>
      </div>
    ))

    const firstTrigger = screen.getByText('First').parentElement!
    const secondTrigger = screen.getByText('Second').parentElement!

    await fireEvent.pointerEnter(firstTrigger)
    await vi.advanceTimersByTimeAsync(100)
    await fireEvent.pointerLeave(firstTrigger)
    await fireEvent.pointerEnter(secondTrigger)

    expect(document.body.querySelector('[role=tooltip]')).toBeNull()

    await vi.advanceTimersByTimeAsync(599)
    expect(document.body.querySelector('[role=tooltip]')).toBeNull()

    await vi.advanceTimersByTimeAsync(1)
    expect(document.body.querySelector('[role=tooltip]')?.textContent).toContain('Second tooltip')
  })
})
