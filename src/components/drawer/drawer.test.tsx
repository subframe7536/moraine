import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createSignal, untrack } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { finishExitMotion } from '../../test-util/overlay-test'

import { Drawer } from './drawer'
import type { DrawerT } from './drawer.types'

let now = 0

beforeEach(() => {
  now = 0
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(400)
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(300)
})

afterEach(() => {
  vi.restoreAllMocks()
})

function content(): HTMLElement {
  const element = document.body.querySelector<HTMLElement>('[data-slot="drawer-content"]')
  if (!element) {
    throw new Error('drawer content is not rendered')
  }
  return element
}

function overlay(): HTMLElement | null {
  return document.body.querySelector<HTMLElement>('[data-slot="drawer-overlay"]')
}

interface DragStep {
  x: number
  y: number
}

/**
 * Simulates a mouse drag over `steps` evenly spaced pointermove events, advancing
 * the mocked clock by `stepMs` between them, then releases.
 */
function dragPointer(
  target: HTMLElement,
  from: DragStep,
  to: DragStep,
  {
    steps = 4,
    stepMs = 20,
    release = true,
  }: { steps?: number; stepMs?: number; release?: boolean } = {},
): void {
  fireEvent.pointerDown(target, {
    pointerId: 1,
    pointerType: 'mouse',
    button: 0,
    buttons: 1,
    clientX: from.x,
    clientY: from.y,
  })
  for (let index = 1; index <= steps; index += 1) {
    now += stepMs
    fireEvent.pointerMove(document, {
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 1,
      clientX: from.x + ((to.x - from.x) * index) / steps,
      clientY: from.y + ((to.y - from.y) * index) / steps,
    })
  }
  if (release) {
    fireEvent.pointerUp(document, {
      pointerId: 1,
      pointerType: 'mouse',
      clientX: to.x,
      clientY: to.y,
    })
  }
}

function movementValue(): string {
  return content().style.getPropertyValue('--drawer-swipe-movement')
}

function snapOffsetValue(): string {
  return content().style.getPropertyValue('--drawer-snap-point-offset')
}

describe('Drawer', () => {
  test('opens from the trigger with dialog semantics and a handle on bottom', async () => {
    const screen = render(() => (
      <Drawer>
        <Drawer.Trigger>Open drawer</Drawer.Trigger>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Drawer title</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>Body</Drawer.Body>
        </Drawer.Content>
      </Drawer>
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Open drawer' }))
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
    )

    const dialog = document.body.querySelector<HTMLElement>('[role="dialog"]')!
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    const titleId = dialog.getAttribute('aria-labelledby')!
    expect(document.getElementById(titleId)?.textContent).toBe('Drawer title')
    expect(dialog.getAttribute('data-expanded')).not.toBeNull()

    const handle = dialog.querySelector('[data-slot="drawer-handle"]')
    expect(handle).not.toBeNull()
    expect(handle?.getAttribute('aria-hidden')).toBe('true')
    // No automatic close button by default.
    expect(dialog.querySelector('[data-slot="drawer-content-close"]')).toBeNull()
  })

  test('renders no handle on the left side or with handle={false} and a close button when closable', async () => {
    const screen = render(() => (
      <>
        <Drawer side="left" closable>
          <Drawer.Trigger>Left</Drawer.Trigger>
          <Drawer.Content>
            <Drawer.Body>Left body</Drawer.Body>
          </Drawer.Content>
        </Drawer>
        <Drawer handle={false}>
          <Drawer.Trigger>No handle</Drawer.Trigger>
          <Drawer.Content>
            <Drawer.Body>Plain body</Drawer.Body>
          </Drawer.Content>
        </Drawer>
      </>
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Left' }))
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
    )
    const leftContent = content()
    expect(leftContent.querySelector('[data-slot="drawer-handle"]')).toBeNull()
    expect(leftContent.querySelector('[data-slot="drawer-content-close"]')).not.toBeNull()

    fireEvent.click(document.body.querySelector('[data-slot="drawer-content-close"]')!)
    await finishExitMotion()
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="drawer-content"]')).toBeNull(),
    )

    fireEvent.click(screen.getByRole('button', { name: 'No handle' }))
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
    )
    expect(content().querySelector('[data-slot="drawer-handle"]')).toBeNull()
  })

  test('mouse drag beyond half height closes with swipe state during the drag', async () => {
    const onOpenChange = vi.fn()
    render(() => (
      <Drawer defaultOpen onOpenChange={onOpenChange}>
        <Drawer.Content>
          <Drawer.Body>Body</Drawer.Body>
        </Drawer.Content>
      </Drawer>
    ))
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
    )

    const el = content()
    dragPointer(el, { x: 0, y: 100 }, { x: 0, y: 160 }, { release: false })

    expect(el.hasAttribute('data-swiping')).toBe(true)
    expect(overlay()?.hasAttribute('data-swiping')).toBe(true)
    // The first move is absorbed as the new drag origin: 160 - 115 = 45px.
    expect(movementValue()).toBe('45px')
    const opacity = Number.parseFloat(overlay()!.style.opacity)
    expect(opacity).toBeGreaterThan(0)
    expect(opacity).toBeLessThan(1)

    // Continue past the half-height threshold (200px of 400px) slowly.
    now += 20
    fireEvent.pointerMove(document, {
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 1,
      clientX: 0,
      clientY: 120,
    })
    now += 20
    fireEvent.pointerMove(document, {
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 1,
      clientX: 0,
      clientY: 360,
    })
    fireEvent.pointerUp(document, { pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 360 })

    expect(onOpenChange).toHaveBeenCalledWith(false)
    await finishExitMotion()
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="drawer-content"]')).toBeNull(),
    )
  })

  test('short slow drag animates back and stays open', async () => {
    const onOpenChange = vi.fn()
    render(() => (
      <Drawer defaultOpen onOpenChange={onOpenChange}>
        <Drawer.Content>
          <Drawer.Body>Body</Drawer.Body>
        </Drawer.Content>
      </Drawer>
    ))
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
    )

    // 50px over ~400ms is too slow and too short to dismiss.
    dragPointer(content(), { x: 0, y: 100 }, { x: 0, y: 150 }, { steps: 4, stepMs: 100 })

    expect(onOpenChange).not.toHaveBeenCalled()
    expect(content().hasAttribute('data-swiping')).toBe(false)
    expect(movementValue()).toBe('0px')
    expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull()
  })

  test('fast short flick closes where the same slow distance does not', async () => {
    const onOpenChange = vi.fn()
    render(() => (
      <Drawer defaultOpen onOpenChange={onOpenChange}>
        <Drawer.Content>
          <Drawer.Body>Body</Drawer.Body>
        </Drawer.Content>
      </Drawer>
    ))
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
    )

    // 30px over ~40ms is a flick (velocity >= 0.5px/ms).
    dragPointer(content(), { x: 0, y: 100 }, { x: 0, y: 130 }, { steps: 4, stepMs: 10 })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  test('opposite-direction drag grows the popup instead of translating it', async () => {
    const onOpenChange = vi.fn()
    render(() => (
      <Drawer defaultOpen onOpenChange={onOpenChange}>
        <Drawer.Content>
          <Drawer.Body>Body</Drawer.Body>
        </Drawer.Content>
      </Drawer>
    ))
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
    )

    dragPointer(content(), { x: 0, y: 200 }, { x: 0, y: 75 }, { steps: 5, release: false })

    // The popup stays anchored and its open edge follows the drag upward.
    expect(movementValue()).toBe('0px')
    expect(content().style.height).toBe('500px')

    fireEvent.pointerUp(document, { pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 75 })
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(movementValue()).toBe('0px')
    expect(content().style.height).toBe('')
  })

  test('dragging the handle up grows the popup instead of translating it', async () => {
    render(() => (
      <Drawer defaultOpen>
        <Drawer.Content>
          <Drawer.Body>Body</Drawer.Body>
        </Drawer.Content>
      </Drawer>
    ))
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
    )
    const handle = content().querySelector<HTMLElement>('[data-slot="drawer-handle"]')!

    dragPointer(handle, { x: 0, y: 200 }, { x: 0, y: 75 }, { steps: 5, release: false })

    expect(movementValue()).toBe('0px')
    expect(content().style.height).toBe('500px')

    fireEvent.pointerUp(document, { pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 75 })
    expect(content().style.height).toBe('')
  })

  test('dragging the handle down shrinks the popup and restores on release', async () => {
    const onOpenChange = vi.fn()
    render(() => (
      <Drawer defaultOpen onOpenChange={onOpenChange}>
        <Drawer.Content>
          <Drawer.Body>Body</Drawer.Body>
        </Drawer.Content>
      </Drawer>
    ))
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
    )
    const handle = content().querySelector<HTMLElement>('[data-slot="drawer-handle"]')!

    dragPointer(
      handle,
      { x: 0, y: 100 },
      { x: 0, y: 225 },
      { steps: 5, stepMs: 80, release: false },
    )

    expect(movementValue()).toBe('0px')
    expect(content().style.height).toBe('300px')

    fireEvent.pointerUp(document, { pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 225 })
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(content().style.height).toBe('')
  })

  test('dragging the handle down past halfway dismisses the drawer', async () => {
    const onOpenChange = vi.fn()
    render(() => (
      <Drawer defaultOpen onOpenChange={onOpenChange}>
        <Drawer.Content>
          <Drawer.Body>Body</Drawer.Body>
        </Drawer.Content>
      </Drawer>
    ))
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
    )
    const handle = content().querySelector<HTMLElement>('[data-slot="drawer-handle"]')!

    // d = 300px shrunk of the 400px popup, below the fast-swipe velocity.
    dragPointer(handle, { x: 0, y: 50 }, { x: 0, y: 400 }, { steps: 7, stepMs: 150 })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  test('does not swipe from a button, a swipe-ignore element, or the body for mouse drags', async () => {
    const onOpenChange = vi.fn()
    render(() => (
      <Drawer defaultOpen onOpenChange={onOpenChange}>
        <Drawer.Content>
          <Drawer.Header>
            <button type="button">Inner button</button>
          </Drawer.Header>
          <div data-swipe-ignore>Ignore region</div>
          <Drawer.Body>Scrollable body</Drawer.Body>
        </Drawer.Content>
      </Drawer>
    ))
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
    )

    const button = document.body.querySelector('[data-slot="drawer-header"] button')!
    const ignored = document.body.querySelector('[data-swipe-ignore]')!
    const body = document.body.querySelector('[data-slot="drawer-body"]')!

    for (const target of [button, ignored, body] as HTMLElement[]) {
      dragPointer(target, { x: 0, y: 100 }, { x: 0, y: 400 }, { steps: 4, stepMs: 100 })
    }

    expect(onOpenChange).not.toHaveBeenCalled()
    expect(content().hasAttribute('data-swiping')).toBe(false)
  })

  test('side="right" closes on a rightward drag and ignores vertical drags', async () => {
    const onOpenChange = vi.fn()
    render(() => (
      <Drawer defaultOpen side="right" onOpenChange={onOpenChange}>
        <Drawer.Content>
          <Drawer.Body>Body</Drawer.Body>
        </Drawer.Content>
      </Drawer>
    ))
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
    )

    // Vertical drags on a horizontal drawer abandon at the axis lock.
    dragPointer(content(), { x: 0, y: 0 }, { x: 0, y: 200 }, { steps: 4, stepMs: 100 })
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(content().hasAttribute('data-swiping')).toBe(false)

    // Rightward drag beyond half the 300px width closes.
    dragPointer(content(), { x: 0, y: 0 }, { x: 200, y: 0 }, { steps: 4, stepMs: 100 })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  describe('snap points', () => {
    test('applies the default snap point offset and settles drags on the nearest point', async () => {
      const onSnapPointChange = vi.fn()
      render(() => (
        <Drawer defaultOpen snapPoints={['148px', 1]} onSnapPointChange={onSnapPointChange}>
          <Drawer.Content>
            <Drawer.Body>Body</Drawer.Body>
          </Drawer.Content>
        </Drawer>
      ))
      await waitFor(() =>
        expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
      )

      // popupHeight 400 - snap height 148 = offset 252, kept as a pure-CSS
      // expression so the first style resolution already computes it.
      expect(snapOffsetValue()).toBe('max(0px, calc(100% - 148px), calc(100% - 100dvh))')

      // Drag up 200px: target offset 52 is closer to the full-height point (offset 0).
      dragPointer(content(), { x: 0, y: 300 }, { x: 0, y: 100 }, { steps: 4, stepMs: 100 })

      expect(onSnapPointChange).toHaveBeenCalledWith(1)
      expect(snapOffsetValue()).toBe('max(0px, calc(100% - 100dvh), calc(100% - 100dvh))')
      expect(movementValue()).toBe('0px')
    })

    test('controlled snapPoint drives the offset', async () => {
      const [snapPoint, setSnapPoint] = createSignal<DrawerT.SnapPoint | null>('148px')
      render(() => (
        <Drawer defaultOpen snapPoints={['148px', 1]} snapPoint={snapPoint()}>
          <Drawer.Content>
            <Drawer.Body>Body</Drawer.Body>
          </Drawer.Content>
        </Drawer>
      ))
      await waitFor(() =>
        expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
      )

      expect(snapOffsetValue()).toBe('max(0px, calc(100% - 148px), calc(100% - 100dvh))')
      setSnapPoint(1)
      await waitFor(() =>
        expect(snapOffsetValue()).toBe('max(0px, calc(100% - 100dvh), calc(100% - 100dvh))'),
      )
    })

    test('drags down from the lowest snap point close the drawer', async () => {
      const onOpenChange = vi.fn()
      render(() => (
        <Drawer defaultOpen snapPoints={['148px', 1]} onOpenChange={onOpenChange}>
          <Drawer.Content>
            <Drawer.Body>Body</Drawer.Body>
          </Drawer.Content>
        </Drawer>
      ))
      await waitFor(() =>
        expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
      )

      // From offset 252, +100px down targets offset 352, closer to closed (400) than to 252.
      dragPointer(content(), { x: 0, y: 100 }, { x: 0, y: 200 }, { steps: 4, stepMs: 100 })
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    test('handle drags at a recessed snap point translate instead of resizing', async () => {
      const onSnapPointChange = vi.fn()
      render(() => (
        <Drawer defaultOpen snapPoints={['148px', 1]} onSnapPointChange={onSnapPointChange}>
          <Drawer.Content>
            <Drawer.Body>Body</Drawer.Body>
          </Drawer.Content>
        </Drawer>
      ))
      await waitFor(() =>
        expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
      )
      const handle = content().querySelector<HTMLElement>('[data-slot="drawer-handle"]')!

      // Dragging up 200px from offset 252 targets offset 52, closer to the
      // fully-open point. The popup moves; its height is untouched.
      dragPointer(handle, { x: 0, y: 300 }, { x: 0, y: 100 }, { steps: 4, stepMs: 100 })

      expect(onSnapPointChange).toHaveBeenCalledWith(1)
      expect(content().style.height).toBe('')
    })

    test('snapToSequentialPoints advances at most one point per flick', async () => {
      const onSnapPointChange = vi.fn()
      render(() => (
        <Drawer
          defaultOpen
          snapPoints={['100px', '200px', 1]}
          snapToSequentialPoints
          onSnapPointChange={onSnapPointChange}
        >
          <Drawer.Content>
            <Drawer.Body>Body</Drawer.Body>
          </Drawer.Content>
        </Drawer>
      ))
      await waitFor(() =>
        expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
      )

      // offsets: 300, 200, 0. Resting on 300 (default first point). A short fast
      // flick up advances exactly one adjacent point; without sequential mode the
      // velocity alone would carry it to the fully open point (offset 0).
      dragPointer(content(), { x: 0, y: 300 }, { x: 0, y: 270 }, { steps: 4, stepMs: 10 })
      expect(onSnapPointChange).toHaveBeenCalledWith('200px')
      expect(snapOffsetValue()).toBe('max(0px, calc(100% - 200px), calc(100% - 100dvh))')
    })

    test('overlay fades alone at a snap point while content stays a sibling at full opacity', async () => {
      render(() => (
        <Drawer defaultOpen snapPoints={['148px', 1]}>
          <Drawer.Content>
            <Drawer.Body>Body</Drawer.Body>
          </Drawer.Content>
        </Drawer>
      ))
      await waitFor(() =>
        expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
      )

      const el = content()
      const backdrop = overlay()!
      // Resting at the 148px point: offset 252 of 400px -> progress-driven backdrop fade.
      expect(Number.parseFloat(backdrop.style.opacity)).toBeLessThan(1)
      expect(backdrop.contains(el)).toBe(false)
      expect(el.style.opacity).toBe('')
    })

    test('resolves the snap offset before the presence style flush', async () => {
      const realGetComputedStyle = window.getComputedStyle
      const flushedOffsets: string[] = []
      vi.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) => {
        const result = realGetComputedStyle(el, pseudo)
        if (el instanceof HTMLElement && el.dataset.slot === 'drawer-content') {
          flushedOffsets.push(el.style.getPropertyValue('--drawer-snap-point-offset'))
        }
        return result
      })

      render(() => (
        <Drawer defaultOpen snapPoints={['148px', 1]}>
          <Drawer.Content>
            <Drawer.Body>Body</Drawer.Body>
          </Drawer.Content>
        </Drawer>
      ))
      await waitFor(() =>
        expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
      )
      await Promise.resolve()

      const cssOffset = 'max(0px, calc(100% - 148px), calc(100% - 100dvh))'
      expect(content().style.getPropertyValue('--drawer-snap-point-offset')).toBe(cssOffset)
      expect(flushedOffsets.length).toBeGreaterThan(0)
      // The first flush (presence registration) must already see the resolved offset.
      expect(flushedOffsets[0]).toBe(cssOffset)
    })

    test('resets the snap point to the default after the drawer finishes closing', async () => {
      const onSnapPointChange = vi.fn()
      const [open, setOpen] = createSignal(true)
      render(() => (
        <Drawer
          open={open()}
          snapPoints={['148px', 1]}
          snapPoint={1}
          onSnapPointChange={onSnapPointChange}
        >
          <Drawer.Content>
            <Drawer.Body>Body</Drawer.Body>
          </Drawer.Content>
        </Drawer>
      ))
      await waitFor(() =>
        expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
      )
      expect(snapOffsetValue()).toBe('max(0px, calc(100% - 100dvh), calc(100% - 100dvh))')

      setOpen(false)
      await finishExitMotion()
      await waitFor(() =>
        expect(document.body.querySelector('[data-slot="drawer-content"]')).toBeNull(),
      )
      expect(onSnapPointChange).toHaveBeenCalledWith('148px')
    })
  })

  test('resets drag state when the drawer reopens after a swipe close', async () => {
    const [open, setOpen] = createSignal(false)
    render(() => (
      <Drawer open={open()} onOpenChange={setOpen}>
        <Drawer.Trigger>Open</Drawer.Trigger>
        <Drawer.Content>
          <Drawer.Body>Body</Drawer.Body>
        </Drawer.Content>
      </Drawer>
    ))

    setOpen(true)
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
    )
    dragPointer(content(), { x: 0, y: 100 }, { x: 0, y: 400 }, { steps: 4, stepMs: 10 })
    expect(untrack(open)).toBe(false)

    await finishExitMotion()
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="drawer-content"]')).toBeNull(),
    )

    setOpen(true)
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
    )
    expect(movementValue()).toBe('0px')
    expect(content().hasAttribute('data-swiping')).toBe(false)
  })

  test('controlled open that ignores the close request resets the drag', async () => {
    const onOpenChange = vi.fn()
    render(() => (
      <Drawer open onOpenChange={onOpenChange}>
        <Drawer.Content>
          <Drawer.Body>Body</Drawer.Body>
        </Drawer.Content>
      </Drawer>
    ))
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
    )

    dragPointer(content(), { x: 0, y: 100 }, { x: 0, y: 380 }, { steps: 4, stepMs: 10 })
    expect(onOpenChange).toHaveBeenCalledWith(false)

    await waitFor(() => expect(movementValue()).toBe('0px'))
    expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull()
  })

  test('touch swipe dismisses, but a scrollable body scrolled down wins the gesture', async () => {
    const onOpenChange = vi.fn()
    render(() => (
      <Drawer defaultOpen onOpenChange={onOpenChange}>
        <Drawer.Content>
          <Drawer.Body>Scrollable body</Drawer.Body>
        </Drawer.Content>
      </Drawer>
    ))
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
    )

    const el = content()

    // Direct downward touch drag on the content dismisses.
    fireEvent.touchStart(el, {
      touches: [{ identifier: 1, clientX: 0, clientY: 100 }],
    })
    fireEvent.touchMove(el, {
      touches: [{ identifier: 1, clientX: 0, clientY: 300 }],
    })
    fireEvent.touchMove(el, {
      touches: [{ identifier: 1, clientX: 0, clientY: 520 }],
    })
    fireEvent.touchEnd(el, {
      changedTouches: [{ identifier: 1, clientX: 0, clientY: 520 }],
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  test('touch drag starting in a scrolled body region does not swipe', async () => {
    const onOpenChange = vi.fn()
    render(() => (
      <Drawer defaultOpen onOpenChange={onOpenChange}>
        <Drawer.Content>
          <Drawer.Body>Scrollable body</Drawer.Body>
        </Drawer.Content>
      </Drawer>
    ))
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
    )

    const el = content()
    const body = document.body.querySelector<HTMLElement>('[data-slot="drawer-body"]')!
    body.style.overflowY = 'auto'
    Object.defineProperty(body, 'scrollTop', { value: 50, configurable: true })
    Object.defineProperty(body, 'scrollHeight', { value: 800, configurable: true })
    Object.defineProperty(body, 'clientHeight', { value: 200, configurable: true })

    fireEvent.touchStart(body, {
      touches: [{ identifier: 2, clientX: 0, clientY: 200 }],
    })
    fireEvent.touchMove(body, {
      touches: [{ identifier: 2, clientX: 0, clientY: 240 }],
    })
    fireEvent.touchMove(body, {
      touches: [{ identifier: 2, clientX: 0, clientY: 280 }],
    })
    fireEvent.touchEnd(body, {
      changedTouches: [{ identifier: 2, clientX: 0, clientY: 280 }],
    })

    expect(onOpenChange).not.toHaveBeenCalled()
    expect(el.hasAttribute('data-swiping')).toBe(false)
  })

  test('a second pointer press cannot take over or reset the active drag', async () => {
    const onOpenChange = vi.fn()
    render(() => (
      <Drawer defaultOpen onOpenChange={onOpenChange}>
        <Drawer.Content>
          <Drawer.Body>Body</Drawer.Body>
        </Drawer.Content>
      </Drawer>
    ))
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
    )

    const el = content()
    fireEvent.pointerDown(el, {
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      clientX: 0,
      clientY: 100,
    })
    now += 20
    fireEvent.pointerMove(document, {
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 1,
      clientX: 0,
      clientY: 150,
    })
    now += 20
    fireEvent.pointerMove(document, {
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 1,
      clientX: 0,
      clientY: 170,
    })
    expect(el.hasAttribute('data-swiping')).toBe(true)

    // The competing pointer is ignored: it registers no drag of its own.
    fireEvent.pointerDown(el, {
      pointerId: 2,
      pointerType: 'mouse',
      button: 0,
      clientX: 0,
      clientY: 300,
    })

    // Releasing the first pointer settles below the threshold and stays open.
    fireEvent.pointerUp(document, { pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 170 })
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(movementValue()).toBe('0px')

    // The ignored pointer keeps no document listeners that could drive a stale gesture.
    now += 20
    fireEvent.pointerMove(document, {
      pointerId: 2,
      pointerType: 'mouse',
      buttons: 1,
      clientX: 0,
      clientY: 380,
    })
    fireEvent.pointerUp(document, { pointerId: 2, pointerType: 'mouse', clientX: 0, clientY: 380 })
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(el.hasAttribute('data-swiping')).toBe(false)
    expect(movementValue()).toBe('0px')
  })

  test('RTL scroller claims drags toward content start and yields at the edge', async () => {
    const onOpenChange = vi.fn()
    render(() => (
      <Drawer defaultOpen side="left" onOpenChange={onOpenChange}>
        <Drawer.Content>
          <Drawer.Body>Scrollable body</Drawer.Body>
        </Drawer.Content>
      </Drawer>
    ))
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
    )

    const el = content()
    const body = document.body.querySelector<HTMLElement>('[data-slot="drawer-body"]')!
    body.style.direction = 'rtl'
    body.style.overflowX = 'auto'
    Object.defineProperty(body, 'scrollWidth', { value: 800, configurable: true })
    Object.defineProperty(body, 'clientWidth', { value: 200, configurable: true })

    // Finger left scrolls toward content start in RTL; scrollLeft < 0 means it can.
    Object.defineProperty(body, 'scrollLeft', { value: -50, configurable: true })
    fireEvent.touchStart(body, {
      touches: [{ identifier: 3, clientX: 200, clientY: 0 }],
    })
    fireEvent.touchMove(body, {
      touches: [{ identifier: 3, clientX: 160, clientY: 0 }],
    })
    fireEvent.touchMove(body, {
      touches: [{ identifier: 3, clientX: 120, clientY: 0 }],
    })
    expect(el.hasAttribute('data-swiping')).toBe(false)
    fireEvent.touchEnd(body, {
      changedTouches: [{ identifier: 3, clientX: 120, clientY: 0 }],
    })

    // At the start edge (scrollLeft 0) the same leftward drag swipes the drawer.
    Object.defineProperty(body, 'scrollLeft', { value: 0, configurable: true })
    fireEvent.touchStart(body, {
      touches: [{ identifier: 4, clientX: 200, clientY: 0 }],
    })
    fireEvent.touchMove(body, {
      touches: [{ identifier: 4, clientX: 160, clientY: 0 }],
    })
    fireEvent.touchMove(body, {
      touches: [{ identifier: 4, clientX: 120, clientY: 0 }],
    })
    expect(el.hasAttribute('data-swiping')).toBe(true)
    fireEvent.touchEnd(body, {
      changedTouches: [{ identifier: 4, clientX: 120, clientY: 0 }],
    })
  })

  test('a scrolled body hands the gesture back once it reaches its edge', async () => {
    const onOpenChange = vi.fn()
    render(() => (
      <Drawer defaultOpen onOpenChange={onOpenChange}>
        <Drawer.Content>
          <Drawer.Body>Scrollable body</Drawer.Body>
        </Drawer.Content>
      </Drawer>
    ))
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
    )

    const el = content()
    const body = document.body.querySelector<HTMLElement>('[data-slot="drawer-body"]')!
    body.style.overflowY = 'auto'
    Object.defineProperty(body, 'scrollTop', { value: 60, configurable: true })
    Object.defineProperty(body, 'scrollHeight', { value: 800, configurable: true })
    Object.defineProperty(body, 'clientHeight', { value: 200, configurable: true })

    fireEvent.touchStart(body, {
      touches: [{ identifier: 5, clientX: 0, clientY: 200 }],
    })
    fireEvent.touchMove(body, {
      touches: [{ identifier: 5, clientX: 0, clientY: 240 }],
    })
    fireEvent.touchMove(body, {
      touches: [{ identifier: 5, clientX: 0, clientY: 280 }],
    })
    // The scroller can still move in the drag direction, so it owns the gesture.
    expect(el.hasAttribute('data-swiping')).toBe(false)

    // Reaching the top edge hands the rest of the gesture to the drawer.
    Object.defineProperty(body, 'scrollTop', { value: 0, configurable: true })
    fireEvent.touchMove(body, {
      touches: [{ identifier: 5, clientX: 0, clientY: 320 }],
    })
    expect(el.hasAttribute('data-swiping')).toBe(true)
    // The full displacement from the press is preserved across the handoff.
    expect(movementValue()).toBe('80px')

    fireEvent.touchMove(body, {
      touches: [{ identifier: 5, clientX: 0, clientY: 460 }],
    })
    fireEvent.touchEnd(body, {
      changedTouches: [{ identifier: 5, clientX: 0, clientY: 460 }],
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  test('the first move absorbs the press offset so the content does not jump', async () => {
    const onOpenChange = vi.fn()
    render(() => (
      <Drawer defaultOpen onOpenChange={onOpenChange}>
        <Drawer.Content>
          <Drawer.Body>Body</Drawer.Body>
        </Drawer.Content>
      </Drawer>
    ))
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
    )

    const el = content()
    fireEvent.touchStart(el, {
      touches: [{ identifier: 8, clientX: 0, clientY: 100 }],
    })
    // An already-offset first move (as iOS touch delivers) becomes the new origin.
    fireEvent.touchMove(el, {
      touches: [{ identifier: 8, clientX: 0, clientY: 150 }],
    })
    expect(movementValue()).toBe('0px')
    expect(el.hasAttribute('data-swiping')).toBe(false)

    fireEvent.touchMove(el, {
      touches: [{ identifier: 8, clientX: 0, clientY: 170 }],
    })
    expect(el.hasAttribute('data-swiping')).toBe(true)
    expect(movementValue()).toBe('20px')

    fireEvent.touchEnd(el, {
      changedTouches: [{ identifier: 8, clientX: 0, clientY: 170 }],
    })
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  test('reversing the drag cancels the dismiss even past the threshold', async () => {
    const onOpenChange = vi.fn()
    render(() => (
      <Drawer defaultOpen onOpenChange={onOpenChange}>
        <Drawer.Content>
          <Drawer.Body>Body</Drawer.Body>
        </Drawer.Content>
      </Drawer>
    ))
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
    )

    const el = content()
    fireEvent.pointerDown(el, {
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      clientX: 0,
      clientY: 100,
    })
    now += 20
    fireEvent.pointerMove(document, {
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 1,
      clientX: 0,
      clientY: 160,
    })
    now += 20
    fireEvent.pointerMove(document, {
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 1,
      clientX: 0,
      clientY: 300,
    })
    now += 20
    fireEvent.pointerMove(document, {
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 1,
      clientX: 0,
      clientY: 400,
    })
    expect(movementValue()).toBe('240px')

    // Pulling back up marks the gesture as a change of mind.
    now += 20
    fireEvent.pointerMove(document, {
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 1,
      clientX: 0,
      clientY: 390,
    })
    now += 20
    fireEvent.pointerMove(document, {
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 1,
      clientX: 0,
      clientY: 380,
    })
    fireEvent.pointerUp(document, { pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 380 })

    // The release still lands past the 200px threshold, but the reversal cancels it.
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(movementValue()).toBe('0px')
  })

  test('a pointermove with released buttons commits the drag like a release', async () => {
    const onOpenChange = vi.fn()
    render(() => (
      <Drawer defaultOpen onOpenChange={onOpenChange}>
        <Drawer.Content>
          <Drawer.Body>Body</Drawer.Body>
        </Drawer.Content>
      </Drawer>
    ))
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
    )

    const el = content()
    fireEvent.pointerDown(el, {
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      clientX: 0,
      clientY: 100,
    })
    now += 20
    fireEvent.pointerMove(document, {
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 1,
      clientX: 0,
      clientY: 160,
    })
    now += 20
    fireEvent.pointerMove(document, {
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 1,
      clientX: 0,
      clientY: 300,
    })
    expect(el.hasAttribute('data-swiping')).toBe(true)

    // A trailing move with buttons: 0 is the release even when no pointerup arrives.
    now += 20
    fireEvent.pointerMove(document, {
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 0,
      clientX: 0,
      clientY: 400,
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)

    // The drag is over: further moves are ignored.
    now += 20
    fireEvent.pointerMove(document, {
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 0,
      clientX: 0,
      clientY: 200,
    })
    expect(el.hasAttribute('data-swiping')).toBe(false)
  })

  test('a non-primary button cancels an active pointer drag', async () => {
    const onOpenChange = vi.fn()
    render(() => (
      <Drawer defaultOpen onOpenChange={onOpenChange}>
        <Drawer.Content>
          <Drawer.Body>Body</Drawer.Body>
        </Drawer.Content>
      </Drawer>
    ))
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
    )

    const el = content()
    fireEvent.pointerDown(el, {
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      clientX: 0,
      clientY: 100,
    })
    now += 20
    fireEvent.pointerMove(document, {
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 1,
      clientX: 0,
      clientY: 160,
    })
    now += 20
    fireEvent.pointerMove(document, {
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 1,
      clientX: 0,
      clientY: 300,
    })
    expect(el.hasAttribute('data-swiping')).toBe(true)

    // A right-click taking over the interaction cancels the swipe.
    now += 20
    fireEvent.pointerMove(document, {
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 2,
      clientX: 0,
      clientY: 320,
    })
    expect(el.hasAttribute('data-swiping')).toBe(false)
    expect(movementValue()).toBe('0px')

    fireEvent.pointerUp(document, { pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 320 })
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  test('a second finger pauses the swipe instead of driving it', async () => {
    const onOpenChange = vi.fn()
    render(() => (
      <Drawer defaultOpen onOpenChange={onOpenChange}>
        <Drawer.Content>
          <Drawer.Body>Body</Drawer.Body>
        </Drawer.Content>
      </Drawer>
    ))
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
    )

    const el = content()
    fireEvent.touchStart(el, {
      touches: [{ identifier: 6, clientX: 0, clientY: 100 }],
    })
    fireEvent.touchMove(el, {
      touches: [{ identifier: 6, clientX: 0, clientY: 160 }],
    })
    fireEvent.touchMove(el, {
      touches: [{ identifier: 6, clientX: 0, clientY: 220 }],
    })
    expect(movementValue()).toBe('60px')

    // The pinch is left to the browser; the drawer stays where it is.
    fireEvent.touchMove(el, {
      touches: [
        { identifier: 6, clientX: 0, clientY: 280 },
        { identifier: 7, clientX: 0, clientY: 10 },
      ],
    })
    expect(movementValue()).toBe('60px')

    fireEvent.touchEnd(el, {
      changedTouches: [{ identifier: 6, clientX: 0, clientY: 220 }],
    })
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  test('does not swipe from a label or a role="button" element', async () => {
    const onOpenChange = vi.fn()
    render(() => (
      <Drawer defaultOpen onOpenChange={onOpenChange}>
        <Drawer.Content>
          <Drawer.Header>
            <label>Label region</label>
            <div role="button">Role button</div>
          </Drawer.Header>
          <Drawer.Body>Body</Drawer.Body>
        </Drawer.Content>
      </Drawer>
    ))
    await waitFor(() =>
      expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
    )

    const label = document.body.querySelector<HTMLElement>('label')!
    const roleButton = document.body.querySelector<HTMLElement>('[role="button"]')!
    for (const target of [label, roleButton]) {
      dragPointer(target, { x: 0, y: 100 }, { x: 0, y: 400 }, { steps: 4, stepMs: 100 })
    }

    expect(onOpenChange).not.toHaveBeenCalled()
    expect(content().hasAttribute('data-swiping')).toBe(false)
  })

  test('an open nested drawer disables the parent swipe', async () => {
    const onParentChange = vi.fn()
    render(() => (
      <Drawer defaultOpen onOpenChange={onParentChange}>
        <Drawer.Content>
          <Drawer.Body>
            <Drawer defaultOpen>
              <Drawer.Content>
                <Drawer.Body>Child body</Drawer.Body>
              </Drawer.Content>
            </Drawer>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer>
    ))
    await waitFor(() =>
      expect(document.body.querySelectorAll('[data-slot="drawer-content"]')).toHaveLength(2),
    )

    const parent = document.body.querySelectorAll<HTMLElement>('[data-slot="drawer-content"]')[0]!
    dragPointer(parent, { x: 0, y: 100 }, { x: 0, y: 400 }, { steps: 4, stepMs: 10 })

    expect(onParentChange).not.toHaveBeenCalled()
    expect(parent.hasAttribute('data-swiping')).toBe(false)
    expect(parent.style.getPropertyValue('--drawer-swipe-movement')).toBe('0px')
  })

  describe('nested stack', () => {
    test('ancestors are marked nested-open with the open descendant count', async () => {
      render(() => (
        <Drawer defaultOpen>
          <Drawer.Content>
            <Drawer.Body>
              <Drawer defaultOpen>
                <Drawer.Content>
                  <Drawer.Body>
                    <Drawer defaultOpen>
                      <Drawer.Content>
                        <Drawer.Body>Grandchild</Drawer.Body>
                      </Drawer.Content>
                    </Drawer>
                  </Drawer.Body>
                </Drawer.Content>
              </Drawer>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer>
      ))
      await waitFor(() =>
        expect(document.body.querySelectorAll('[data-slot="drawer-content"]')).toHaveLength(3),
      )

      const contents = document.body.querySelectorAll<HTMLElement>('[data-slot="drawer-content"]')
      const parent = contents[0]!
      const child = contents[1]!
      const grandchild = contents[2]!
      expect(parent.hasAttribute('data-nested-open')).toBe(true)
      expect(parent.style.getPropertyValue('--nested-drawers')).toBe('2')
      expect(child.hasAttribute('data-nested-open')).toBe(true)
      expect(child.style.getPropertyValue('--nested-drawers')).toBe('1')
      expect(grandchild.hasAttribute('data-nested-open')).toBe(false)
      expect(grandchild.style.getPropertyValue('--nested-drawers')).toBe('0')
    })

    test('ancestors track the frontmost drawer height', async () => {
      render(() => (
        <Drawer defaultOpen>
          <Drawer.Content>
            <Drawer.Body>
              <Drawer defaultOpen>
                <Drawer.Content>
                  <Drawer.Body>Child</Drawer.Body>
                </Drawer.Content>
              </Drawer>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer>
      ))
      await waitFor(() =>
        expect(document.body.querySelectorAll('[data-slot="drawer-content"]')).toHaveLength(2),
      )

      const contents = document.body.querySelectorAll<HTMLElement>('[data-slot="drawer-content"]')
      const parent = contents[0]!
      const child = contents[1]!
      Object.defineProperty(child, 'offsetHeight', { value: 480, configurable: true })
      fireEvent(window, new Event('resize'))

      expect(parent.style.getPropertyValue('--drawer-frontmost-height')).toBe('480px')
      expect(child.style.getPropertyValue('--drawer-frontmost-height')).toBe('480px')
    })

    test('a nested swipe marks ancestors and forwards its progress', async () => {
      render(() => (
        <Drawer defaultOpen>
          <Drawer.Content>
            <Drawer.Body>
              <Drawer defaultOpen>
                <Drawer.Content>
                  <Drawer.Body>Child</Drawer.Body>
                </Drawer.Content>
              </Drawer>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer>
      ))
      await waitFor(() =>
        expect(document.body.querySelectorAll('[data-slot="drawer-content"]')).toHaveLength(2),
      )

      const contents = document.body.querySelectorAll<HTMLElement>('[data-slot="drawer-content"]')
      const parent = contents[0]!
      const child = contents[1]!
      Object.defineProperty(child, 'offsetHeight', { value: 400, configurable: true })
      fireEvent(window, new Event('resize'))

      fireEvent.pointerDown(child, {
        pointerId: 1,
        pointerType: 'mouse',
        button: 0,
        clientX: 0,
        clientY: 100,
      })
      now += 20
      fireEvent.pointerMove(document, {
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
        clientX: 0,
        clientY: 160,
      })
      now += 20
      fireEvent.pointerMove(document, {
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
        clientX: 0,
        clientY: 260,
      })

      expect(child.hasAttribute('data-swiping')).toBe(true)
      expect(parent.hasAttribute('data-nested-swiping')).toBe(true)
      expect(parent.style.getPropertyValue('--drawer-nested-progress')).toBe('0.25')

      fireEvent.pointerUp(document, {
        pointerId: 1,
        pointerType: 'mouse',
        clientX: 0,
        clientY: 260,
      })
      expect(parent.hasAttribute('data-nested-swiping')).toBe(false)
    })

    test('closing the nested drawer restores the ancestor', async () => {
      const onChildChange = vi.fn()
      render(() => (
        <Drawer defaultOpen>
          <Drawer.Content>
            <Drawer.Body>
              <Drawer defaultOpen onOpenChange={onChildChange}>
                <Drawer.Content>
                  <Drawer.Body>Child</Drawer.Body>
                </Drawer.Content>
              </Drawer>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer>
      ))
      await waitFor(() =>
        expect(document.body.querySelectorAll('[data-slot="drawer-content"]')).toHaveLength(2),
      )

      const contents = document.body.querySelectorAll<HTMLElement>('[data-slot="drawer-content"]')
      const parent = contents[0]!
      const child = contents[1]!
      expect(parent.hasAttribute('data-nested-open')).toBe(true)

      fireEvent.keyDown(document, { key: 'Escape' })
      expect(onChildChange).toHaveBeenCalledWith(false)
      await finishExitMotion()
      await waitFor(() => expect(document.body.contains(child)).toBe(false))
      expect(parent.hasAttribute('data-nested-open')).toBe(false)
      expect(parent.style.getPropertyValue('--nested-drawers')).toBe('0')
    })
  })

  describe('Android back gesture', () => {
    interface FakeWatcher extends EventTarget {
      destroy: ReturnType<typeof vi.fn>
    }

    const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36'
    let watchers: FakeWatcher[]

    function stubAndroidAndWatcher(): void {
      vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ANDROID_UA)
      watchers = []
      const FakeCloseWatcher = class extends EventTarget {
        destroy = vi.fn()
        constructor() {
          super()
          watchers.push(this)
        }
      }
      vi.stubGlobal('CloseWatcher', FakeCloseWatcher)
    }

    test('cancel event closes the drawer', async () => {
      stubAndroidAndWatcher()
      const onOpenChange = vi.fn()
      render(() => (
        <Drawer defaultOpen onOpenChange={onOpenChange}>
          <Drawer.Content>
            <Drawer.Body>Body</Drawer.Body>
          </Drawer.Content>
        </Drawer>
      ))
      await waitFor(() =>
        expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
      )
      expect(watchers).toHaveLength(1)

      watchers[0]!.dispatchEvent(new Event('cancel', { cancelable: true }))
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    test('closing destroys the watcher', async () => {
      stubAndroidAndWatcher()
      const [open, setOpen] = createSignal(true)
      render(() => (
        <Drawer open={open()} onOpenChange={setOpen}>
          <Drawer.Content>
            <Drawer.Body>Body</Drawer.Body>
          </Drawer.Content>
        </Drawer>
      ))
      await waitFor(() =>
        expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
      )
      expect(watchers).toHaveLength(1)

      setOpen(false)
      await finishExitMotion()
      await waitFor(() => expect(watchers[0]!.destroy).toHaveBeenCalled())
    })

    test('no watcher is created on a non-Android user agent', async () => {
      watchers = []
      const FakeCloseWatcher = class extends EventTarget {
        destroy = vi.fn()
        constructor() {
          super()
          watchers.push(this)
        }
      }
      vi.stubGlobal('CloseWatcher', FakeCloseWatcher)
      render(() => (
        <Drawer defaultOpen>
          <Drawer.Content>
            <Drawer.Body>Body</Drawer.Body>
          </Drawer.Content>
        </Drawer>
      ))
      await waitFor(() =>
        expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
      )
      expect(watchers).toHaveLength(0)
    })

    test('closeOnEscape={false} prevents a cancelable cancel and reports it', async () => {
      stubAndroidAndWatcher()
      const onClosePrevent = vi.fn()
      const onOpenChange = vi.fn()
      render(() => (
        <Drawer
          defaultOpen
          closeOnEscape={false}
          onClosePrevent={onClosePrevent}
          onOpenChange={onOpenChange}
        >
          <Drawer.Content>
            <Drawer.Body>Body</Drawer.Body>
          </Drawer.Content>
        </Drawer>
      ))
      await waitFor(() =>
        expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull(),
      )

      const notPrevented = watchers[0]!.dispatchEvent(new Event('cancel', { cancelable: true }))
      expect(notPrevented).toBe(false)
      expect(onClosePrevent).toHaveBeenCalled()
      expect(onOpenChange).not.toHaveBeenCalled()
      expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull()
    })

    test('nested drawers close only the child on the latest watcher', async () => {
      stubAndroidAndWatcher()
      const onParentChange = vi.fn()
      const onChildChange = vi.fn()
      render(() => (
        <Drawer defaultOpen onOpenChange={onParentChange}>
          <Drawer.Content>
            <Drawer.Body>
              <Drawer defaultOpen onOpenChange={onChildChange}>
                <Drawer.Content>
                  <Drawer.Body>Child body</Drawer.Body>
                </Drawer.Content>
              </Drawer>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer>
      ))
      await waitFor(() =>
        expect(document.body.querySelectorAll('[data-slot="drawer-content"]')).toHaveLength(2),
      )
      expect(watchers.length).toBeGreaterThanOrEqual(2)

      watchers[watchers.length - 1]!.dispatchEvent(new Event('cancel', { cancelable: true }))
      expect(onChildChange).toHaveBeenCalledWith(false)
      expect(onParentChange).not.toHaveBeenCalled()
    })
  })

  test('a swipe dismiss on a nested child closes only the child', async () => {
    const onParentChange = vi.fn()
    const onChildChange = vi.fn()
    render(() => (
      <Drawer defaultOpen onOpenChange={onParentChange}>
        <Drawer.Content>
          <Drawer.Body>
            <Drawer defaultOpen onOpenChange={onChildChange}>
              <Drawer.Content>
                <Drawer.Body>Child body</Drawer.Body>
              </Drawer.Content>
            </Drawer>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer>
    ))
    await waitFor(() =>
      expect(document.body.querySelectorAll('[data-slot="drawer-content"]')).toHaveLength(2),
    )

    const contents = document.body.querySelectorAll<HTMLElement>('[data-slot="drawer-content"]')
    const child = contents[1]!
    const parent = contents[0]!
    dragPointer(child, { x: 0, y: 100 }, { x: 0, y: 400 }, { steps: 4, stepMs: 10 })

    expect(onChildChange).toHaveBeenCalledWith(false)
    expect(onParentChange).not.toHaveBeenCalled()
    expect(parent.style.getPropertyValue('--drawer-swipe-movement')).toBe('0px')
  })
})
