import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { useSlider } from './hook/index'
import { Slider } from './slider'

function getThumbs(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('[data-slot="thumb"]')) as HTMLElement[]
}

function getInputs(container: HTMLElement): HTMLInputElement[] {
  return Array.from(container.querySelectorAll('input[type="range"]')) as HTMLInputElement[]
}

function mockPointerCapture(target: HTMLElement): void {
  const capturedPointers = new Set<number>()

  Object.defineProperty(target, 'setPointerCapture', {
    configurable: true,
    value(pointerId: number) {
      capturedPointers.add(pointerId)
    },
  })

  Object.defineProperty(target, 'hasPointerCapture', {
    configurable: true,
    value(pointerId: number) {
      return capturedPointers.has(pointerId)
    },
  })

  Object.defineProperty(target, 'releasePointerCapture', {
    configurable: true,
    value(pointerId: number) {
      capturedPointers.delete(pointerId)
    },
  })
}

function mockTrackRect(target: HTMLElement): void {
  Object.defineProperty(target, 'getBoundingClientRect', {
    configurable: true,
    value: () =>
      ({
        left: 0,
        top: 0,
        right: 100,
        bottom: 100,
        width: 100,
        height: 100,
        x: 0,
        y: 0,
        toJSON() {
          return this
        },
      }) as DOMRect,
  })
}

describe('Slider', () => {
  test('uses the compact track thickness scale', () => {
    const horizontal = render(() => <Slider orientation="horizontal" size="sm" />)
    const vertical = render(() => <Slider orientation="vertical" size="lg" />)

    const horizontalTrack = horizontal.container.querySelector('[data-slot="track"]')
    const verticalTrack = vertical.container.querySelector('[data-slot="track"]')

    expect(horizontalTrack?.className).toContain('h-[var(--s-size)]')
    expect(
      (
        horizontal.container.querySelector('[data-slot="root"]') as HTMLElement
      ).style.getPropertyValue('--s-size'),
    ).toBe('4px')
    expect(verticalTrack?.className).toContain('w-[var(--s-size)]')
    expect(
      (
        vertical.container.querySelector('[data-slot="root"]') as HTMLElement
      ).style.getPropertyValue('--s-size'),
    ).toBe('6px')
  })

  test('renders base attributes and orientation without tooltip', () => {
    const screen = render(() => (
      <Slider
        id="volume"
        name="volume"
        min={1}
        max={10}
        step={2}
        orientation="vertical"
        required
        disabled
        readOnly
        inverted
      />
    ))

    const root = screen.container.querySelector('[data-slot="root"][id$="-root"]')
    const track = screen.container.querySelector('[data-slot="track"]')
    const thumb = screen.container.querySelector('[data-slot="thumb"]') as HTMLElement | null
    const inputs = getInputs(screen.container)

    expect(inputs.length).toBe(1)
    expect(inputs[0]?.id).toBe('volume')
    expect(inputs[0]?.name).toBe('volume')
    expect(inputs[0]?.min).toBe('1')
    expect(inputs[0]?.max).toBe('10')
    expect(inputs[0]?.step).toBe('2')
    expect(inputs[0]?.required).toBe(true)
    expect(inputs[0]?.disabled).toBe(true)
    expect(inputs[0]?.readOnly).toBe(true)
    expect(root?.getAttribute('data-orientation')).toBe('vertical')
    expect(root?.getAttribute('data-required')).toBe('')
    expect(root?.getAttribute('data-disabled')).toBe('')
    expect(root?.getAttribute('data-readonly')).toBe('')
    expect(thumb?.getAttribute('data-required')).toBe('')
    expect(thumb?.getAttribute('data-disabled')).toBe('')
    expect(thumb?.getAttribute('data-readonly')).toBe('')
    expect(thumb?.getAttribute('aria-required')).toBe('true')
    expect(thumb?.getAttribute('aria-disabled')).toBe('true')
    expect(thumb?.getAttribute('aria-readonly')).toBe('true')
    expect(track?.className).toContain('bg-input')
    expect(thumb?.className).toContain('absolute')
    expect(thumb?.style.translate).toBe('')
    expect(thumb?.className).toContain('-translate-y-1/2')
    expect(thumb?.className).toContain('scale-120')
    expect(thumb?.className).toContain('cursor-pointer')
    expect(thumb?.className).toContain('hover:ring-ring/50')
    expect(thumb?.className).toContain('focus-visible:ring-ring/50')
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  test('vertical arrow keys follow the visual direction', async () => {
    const verticalChange = vi.fn()
    const verticalScreen = render(() => (
      <Slider orientation="vertical" defaultValue={45} onValueChange={verticalChange} />
    ))
    const verticalThumb = getThumbs(verticalScreen.container)[0]

    fireEvent.focus(verticalThumb as HTMLElement)
    fireEvent.keyDown(verticalThumb as HTMLElement, { key: 'ArrowDown' })

    expect(verticalChange).toHaveBeenLastCalledWith(44)

    const invertedChange = vi.fn()
    const invertedScreen = render(() => (
      <Slider orientation="vertical" inverted defaultValue={45} onValueChange={invertedChange} />
    ))
    const invertedThumb = getThumbs(invertedScreen.container)[0]

    fireEvent.focus(invertedThumb as HTMLElement)
    fireEvent.keyDown(invertedThumb as HTMLElement, { key: 'ArrowDown' })

    expect(invertedChange).toHaveBeenLastCalledWith(46)
  })

  test('vertical max thumb stays centered on the top edge', () => {
    const screen = render(() => <Slider orientation="vertical" defaultValue={100} />)
    const thumb = getThumbs(screen.container)[0] as HTMLElement

    expect(thumb.style.bottom).toBe('100%')
    expect(thumb.className).toContain('translate-y-1/2')
    expect(thumb.className).not.toContain('-translate-y-1/2')
  })

  test('vertical pointer values increase from bottom to top by default', async () => {
    const verticalChange = vi.fn()
    const verticalScreen = render(() => (
      <Slider orientation="vertical" defaultValue={45} onValueChange={verticalChange} />
    ))
    const verticalTrack = verticalScreen.container.querySelector(
      '[data-slot="track"]',
    ) as HTMLElement
    mockPointerCapture(verticalTrack)
    mockTrackRect(verticalTrack)

    fireEvent.pointerDown(verticalTrack, {
      button: 0,
      clientY: 0,
      pointerId: 1,
    })

    expect(verticalChange).toHaveBeenLastCalledWith(100)

    const invertedChange = vi.fn()
    const invertedScreen = render(() => (
      <Slider orientation="vertical" inverted defaultValue={45} onValueChange={invertedChange} />
    ))
    const invertedTrack = invertedScreen.container.querySelector(
      '[data-slot="track"]',
    ) as HTMLElement
    mockPointerCapture(invertedTrack)
    mockTrackRect(invertedTrack)

    fireEvent.pointerDown(invertedTrack, {
      button: 0,
      clientY: 0,
      pointerId: 1,
    })

    expect(invertedChange).toHaveBeenLastCalledWith(0)
  })

  test('horizontal arrow keys follow RTL direction', async () => {
    const previousDir = document.documentElement.dir
    document.documentElement.dir = 'rtl'

    try {
      const onValueChange = vi.fn()
      const screen = render(() => <Slider defaultValue={45} onValueChange={onValueChange} />)
      const thumb = getThumbs(screen.container)[0] as HTMLElement

      fireEvent.focus(thumb)
      fireEvent.keyDown(thumb, { key: 'ArrowRight' })

      expect(onValueChange).toHaveBeenLastCalledWith(44)

      fireEvent.keyDown(thumb, { key: 'ArrowLeft' })

      expect(onValueChange).toHaveBeenLastCalledWith(45)
    } finally {
      document.documentElement.dir = previousDir
    }
  })

  test('PageUp and PageDown move by one tenth of the range snapped to step', async () => {
    const onValueChange = vi.fn()
    const screen = render(() => (
      <Slider min={0} max={100} step={5} defaultValue={50} onValueChange={onValueChange} />
    ))
    const thumb = getThumbs(screen.container)[0] as HTMLElement

    fireEvent.focus(thumb)
    fireEvent.keyDown(thumb, { key: 'PageUp' })

    expect(onValueChange).toHaveBeenLastCalledWith(60)

    fireEvent.keyDown(thumb, { key: 'PageDown' })

    expect(onValueChange).toHaveBeenLastCalledWith(50)
  })

  test('readOnly prevents keyboard and pointer value changes', async () => {
    const onValueChange = vi.fn()
    const screen = render(() => <Slider readOnly defaultValue={50} onValueChange={onValueChange} />)
    const thumb = getThumbs(screen.container)[0] as HTMLElement
    const track = screen.container.querySelector('[data-slot="track"]') as HTMLElement
    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement

    mockPointerCapture(thumb)
    mockTrackRect(track)

    expect(root.getAttribute('data-readonly')).toBe('')
    expect(thumb.getAttribute('aria-readonly')).toBe('true')

    fireEvent.focus(thumb)
    fireEvent.keyDown(thumb, { key: 'ArrowRight' })
    fireEvent.pointerDown(thumb, {
      button: 0,
      pointerId: 1,
      clientX: 50,
      clientY: 0,
    })
    fireEvent.pointerMove(thumb, {
      pointerId: 1,
      clientX: 80,
      clientY: 0,
    })

    expect(onValueChange).not.toHaveBeenCalled()
    expect(thumb.getAttribute('aria-valuenow')).toBe('50')
  })

  test('single uncontrolled emits number for input and commit phases', async () => {
    const onValueChange = vi.fn()
    const onChange = vi.fn()
    const screen = render(() => (
      <Slider defaultValue={10} onValueChange={onValueChange} onChange={onChange} />
    ))
    const thumbs = getThumbs(screen.container)

    fireEvent.focus(thumbs[0] as HTMLElement)
    fireEvent.keyDown(thumbs[0] as HTMLElement, { key: 'ArrowRight' })

    expect(onValueChange).toHaveBeenLastCalledWith(11)
    expect(onChange).not.toHaveBeenCalled()
    expect(typeof onValueChange.mock.calls[0]?.[0]).toBe('number')

    fireEvent.blur(thumbs[0] as HTMLElement)

    expect(onChange).toHaveBeenLastCalledWith(11)
    expect(typeof onChange.mock.calls[0]?.[0]).toBe('number')
  })

  test('uses continuous pointer values when step is omitted', async () => {
    const onValueChange = vi.fn()
    const onChange = vi.fn()
    const screen = render(() => (
      <Slider defaultValue={0} onValueChange={onValueChange} onChange={onChange} />
    ))
    const thumb = getThumbs(screen.container)[0] as HTMLElement
    const input = getInputs(screen.container)[0]
    const track = screen.container.querySelector('[data-slot="track"]') as HTMLElement

    mockPointerCapture(thumb)
    mockTrackRect(track)

    fireEvent.pointerDown(thumb, {
      button: 0,
      pointerId: 1,
      clientX: 0,
      clientY: 0,
    })
    fireEvent.pointerMove(thumb, {
      pointerId: 1,
      clientX: 25,
      clientY: 0,
    })

    expect(thumb.style.left).toBe('25%')
    expect(thumb.getAttribute('aria-valuenow')).toBe('25')
    expect(input?.step).toBe('any')
    expect(onValueChange).toHaveBeenLastCalledWith(25)

    fireEvent.pointerUp(thumb, {
      pointerId: 1,
      clientX: 25,
      clientY: 0,
    })

    expect(thumb.style.left).toBe('25%')
    expect(onChange).toHaveBeenLastCalledWith(25)
  })

  test('range uncontrolled emits number[] for input and commit phases', async () => {
    const onValueChange = vi.fn()
    const onChange = vi.fn()
    const screen = render(() => (
      <Slider defaultValue={[20, 80]} onValueChange={onValueChange} onChange={onChange} />
    ))
    const thumbs = getThumbs(screen.container)

    expect(thumbs.length).toBe(2)
    expect(thumbs[0]?.getAttribute('aria-label')).toBe('Thumb 1 of 2')
    expect(thumbs[1]?.getAttribute('aria-label')).toBe('Thumb 2 of 2')

    fireEvent.focus(thumbs[1] as HTMLElement)
    fireEvent.keyDown(thumbs[1] as HTMLElement, { key: 'ArrowLeft' })

    expect(onValueChange).toHaveBeenLastCalledWith([20, 79])
    expect(Array.isArray(onValueChange.mock.calls[0]?.[0])).toBe(true)

    fireEvent.blur(thumbs[1] as HTMLElement)

    expect(onChange).toHaveBeenLastCalledWith([20, 79])
    expect(Array.isArray(onChange.mock.calls[0]?.[0])).toBe(true)
  })

  test('moves overlapping thumbs in both directions', async () => {
    const rightChange = vi.fn()
    const rightScreen = render(() => <Slider defaultValue={[20, 20]} onValueChange={rightChange} />)
    const rightThumbs = getThumbs(rightScreen.container)

    fireEvent.focus(rightThumbs[0] as HTMLElement)
    fireEvent.keyDown(rightThumbs[0] as HTMLElement, { key: 'ArrowRight' })

    expect(rightChange).toHaveBeenLastCalledWith([20, 21])

    const leftChange = vi.fn()
    const leftScreen = render(() => <Slider defaultValue={[20, 20]} onValueChange={leftChange} />)
    const leftThumbs = getThumbs(leftScreen.container)

    fireEvent.focus(leftThumbs[0] as HTMLElement)
    fireEvent.keyDown(leftThumbs[0] as HTMLElement, { key: 'ArrowLeft' })

    expect(leftChange).toHaveBeenLastCalledWith([19, 20])
  })

  test('dragging past another thumb moves the dragged value across the range when minStepsBetweenThumbs is 0', async () => {
    const screen = render(() => <Slider defaultValue={[20, 50]} />)
    const thumbs = getThumbs(screen.container)
    const track = screen.container.querySelector('[data-slot="track"]') as HTMLElement

    mockPointerCapture(thumbs[0] as HTMLElement)
    mockTrackRect(track)

    fireEvent.pointerDown(thumbs[0] as HTMLElement, {
      button: 0,
      pointerId: 1,
      clientX: 20,
      clientY: 0,
    })
    fireEvent.pointerMove(thumbs[0] as HTMLElement, {
      pointerId: 1,
      clientX: 60,
      clientY: 0,
    })
    fireEvent.pointerMove(thumbs[0] as HTMLElement, {
      pointerId: 1,
      clientX: 70,
      clientY: 0,
    })

    expect(thumbs[0]?.getAttribute('aria-valuenow')).toBe('50')
    expect(thumbs[1]?.getAttribute('aria-valuenow')).toBe('70')
    expect(thumbs[0]?.className).toContain('hover:ring-ring/50')
    expect(thumbs[1]?.className).toContain('hover:ring-ring/50')
    expect(document.activeElement).toBe(thumbs[1])

    fireEvent.pointerUp(thumbs[0] as HTMLElement, {
      pointerId: 1,
      clientX: 70,
      clientY: 0,
    })
  })

  test('dragging the left thumb across the right thumb keeps updating when reversing direction', async () => {
    const onValueChange = vi.fn()
    const screen = render(() => <Slider defaultValue={[20, 50]} onValueChange={onValueChange} />)
    const thumbs = getThumbs(screen.container)
    const track = screen.container.querySelector('[data-slot="track"]') as HTMLElement

    mockPointerCapture(thumbs[0] as HTMLElement)
    mockTrackRect(track)

    fireEvent.pointerDown(thumbs[0] as HTMLElement, {
      button: 0,
      pointerId: 1,
      clientX: 20,
      clientY: 0,
    })
    fireEvent.pointerMove(thumbs[0] as HTMLElement, {
      pointerId: 1,
      clientX: 60,
      clientY: 0,
    })

    expect(onValueChange).toHaveBeenLastCalledWith([50, 60])
    expect(thumbs[0]?.getAttribute('aria-valuenow')).toBe('50')
    expect(thumbs[1]?.getAttribute('aria-valuenow')).toBe('60')
    expect(thumbs[1]?.getAttribute('data-dragging')).toBe('')
    expect(thumbs[0]?.className).toContain('hover:ring-ring/50')
    expect(thumbs[1]?.className).toContain('hover:ring-ring/50')
    expect(document.activeElement).toBe(thumbs[1])

    fireEvent.pointerMove(thumbs[0] as HTMLElement, {
      pointerId: 1,
      clientX: 40,
      clientY: 0,
    })

    expect(onValueChange).toHaveBeenLastCalledWith([40, 50])
    expect(thumbs[0]?.getAttribute('aria-valuenow')).toBe('40')
    expect(thumbs[1]?.getAttribute('aria-valuenow')).toBe('50')
    expect(thumbs[0]?.getAttribute('data-dragging')).toBe('')
    expect(thumbs[0]?.className).toContain('hover:ring-ring/50')
    expect(thumbs[1]?.className).toContain('hover:ring-ring/50')
    expect(document.activeElement).toBe(thumbs[0])

    fireEvent.pointerUp(thumbs[0] as HTMLElement, {
      pointerId: 1,
      clientX: 40,
      clientY: 0,
    })
  })

  test('can disable thumb crossing while dragging', async () => {
    const onValueChange = vi.fn()
    const screen = render(() => (
      <Slider defaultValue={[20, 50]} allowThumbCrossing={false} onValueChange={onValueChange} />
    ))
    const thumbs = getThumbs(screen.container)
    const track = screen.container.querySelector('[data-slot="track"]') as HTMLElement

    mockPointerCapture(thumbs[0] as HTMLElement)
    mockTrackRect(track)

    fireEvent.pointerDown(thumbs[0] as HTMLElement, {
      button: 0,
      pointerId: 1,
      clientX: 20,
      clientY: 0,
    })
    fireEvent.pointerMove(thumbs[0] as HTMLElement, {
      pointerId: 1,
      clientX: 60,
      clientY: 0,
    })
    fireEvent.pointerMove(thumbs[0] as HTMLElement, {
      pointerId: 1,
      clientX: 70,
      clientY: 0,
    })

    expect(onValueChange).toHaveBeenLastCalledWith([50, 50])
    expect(thumbs[0]?.getAttribute('aria-valuenow')).toBe('50')
    expect(thumbs[1]?.getAttribute('aria-valuenow')).toBe('50')
    expect(thumbs[0]?.getAttribute('data-dragging')).toBe('')
    expect(document.activeElement).toBe(thumbs[0])

    fireEvent.pointerUp(thumbs[0] as HTMLElement, {
      pointerId: 1,
      clientX: 70,
      clientY: 0,
    })
  })

  test('dragging overlapping thumbs respects minStepsBetweenThumbs without moving the sibling', async () => {
    const screen = render(() => <Slider defaultValue={[20, 20]} minStepsBetweenThumbs={10} />)
    const thumbs = getThumbs(screen.container)
    const track = screen.container.querySelector('[data-slot="track"]') as HTMLElement

    mockPointerCapture(thumbs[0] as HTMLElement)
    mockTrackRect(track)

    fireEvent.pointerDown(thumbs[0] as HTMLElement, {
      button: 0,
      pointerId: 1,
      clientX: 20,
      clientY: 0,
    })
    fireEvent.pointerMove(thumbs[0] as HTMLElement, {
      pointerId: 1,
      clientX: 30,
      clientY: 0,
    })

    expect(thumbs[0]?.getAttribute('aria-valuenow')).toBe('10')
    expect(thumbs[1]?.getAttribute('aria-valuenow')).toBe('20')

    fireEvent.pointerUp(thumbs[0] as HTMLElement, {
      pointerId: 1,
      clientX: 30,
      clientY: 0,
    })
  })

  test('single thumb uses default aria label', () => {
    const screen = render(() => <Slider defaultValue={10} />)
    const thumbs = getThumbs(screen.container)

    expect(thumbs.length).toBe(1)
    expect(thumbs[0]?.getAttribute('aria-label')).toBe('Thumb')
  })

  test('controlled single keeps rendered value while emitting updates', async () => {
    const onValueChange = vi.fn()
    const screen = render(() => <Slider value={10} onValueChange={onValueChange} />)
    const thumbs = getThumbs(screen.container)

    expect(thumbs[0]?.getAttribute('aria-valuenow')).toBe('10')

    fireEvent.focus(thumbs[0] as HTMLElement)
    fireEvent.keyDown(thumbs[0] as HTMLElement, { key: 'ArrowRight' })

    expect(onValueChange).toHaveBeenLastCalledWith(11)
    expect(thumbs[0]?.getAttribute('aria-valuenow')).toBe('10')
  })

  test('controlled range keeps rendered value while emitting updates', async () => {
    const onValueChange = vi.fn()
    const screen = render(() => <Slider value={[20, 80]} onValueChange={onValueChange} />)
    const thumbs = getThumbs(screen.container)

    expect(thumbs[0]?.getAttribute('aria-valuenow')).toBe('20')
    expect(thumbs[1]?.getAttribute('aria-valuenow')).toBe('80')

    fireEvent.focus(thumbs[0] as HTMLElement)
    fireEvent.keyDown(thumbs[0] as HTMLElement, { key: 'ArrowRight' })

    expect(onValueChange).toHaveBeenLastCalledWith([21, 80])
    expect(thumbs[0]?.getAttribute('aria-valuenow')).toBe('20')
    expect(thumbs[1]?.getAttribute('aria-valuenow')).toBe('80')
  })

  test('controlled single keeps thumb dom node stable after value updates', async () => {
    const screen = render(() => {
      const [value, setValue] = createSignal(10)

      return (
        <Slider
          value={value()}
          onValueChange={(nextValue) => {
            if (!Array.isArray(nextValue)) {
              setValue(nextValue)
            }
          }}
        />
      )
    })

    const thumbsBefore = getThumbs(screen.container)
    const thumbBefore = thumbsBefore[0]
    expect(thumbBefore?.getAttribute('aria-valuenow')).toBe('10')

    fireEvent.focus(thumbBefore as HTMLElement)
    fireEvent.keyDown(thumbBefore as HTMLElement, { key: 'ArrowRight' })

    await waitFor(() => {
      expect(getThumbs(screen.container)[0]?.getAttribute('aria-valuenow')).toBe('11')
    })

    const thumbAfter = getThumbs(screen.container)[0]
    expect(thumbAfter).toBe(thumbBefore)
  })

  test('controlled range keeps thumb dom nodes stable after value updates', async () => {
    const screen = render(() => {
      const [value, setValue] = createSignal<number[]>([20, 80])

      return (
        <Slider
          value={value()}
          onValueChange={(nextValue) => {
            if (Array.isArray(nextValue)) {
              setValue(nextValue)
            }
          }}
        />
      )
    })

    const thumbsBefore = getThumbs(screen.container)
    const firstThumbBefore = thumbsBefore[0]
    const secondThumbBefore = thumbsBefore[1]
    expect(firstThumbBefore?.getAttribute('aria-valuenow')).toBe('20')
    expect(secondThumbBefore?.getAttribute('aria-valuenow')).toBe('80')

    fireEvent.focus(firstThumbBefore as HTMLElement)
    fireEvent.keyDown(firstThumbBefore as HTMLElement, { key: 'ArrowRight' })

    await waitFor(() => {
      const [firstThumb, secondThumb] = getThumbs(screen.container)
      expect(firstThumb?.getAttribute('aria-valuenow')).toBe('21')
      expect(secondThumb?.getAttribute('aria-valuenow')).toBe('80')
    })

    const [firstThumbAfter, secondThumbAfter] = getThumbs(screen.container)
    expect(firstThumbAfter).toBe(firstThumbBefore)
    expect(secondThumbAfter).toBe(secondThumbBefore)
  })

  test('controlled range keeps thumb updates stable with thumb style overrides', async () => {
    const screen = render(() => {
      const [value, setValue] = createSignal<number[]>([20, 80])

      return (
        <Slider
          value={value()}
          styles={{ thumb: { width: '20px' } }}
          onValueChange={(nextValue) => {
            if (Array.isArray(nextValue)) {
              setValue(nextValue)
            }
          }}
        />
      )
    })

    const [firstThumbBefore, secondThumbBefore] = getThumbs(screen.container)

    expect(firstThumbBefore?.style.width).toBe('20px')
    expect(secondThumbBefore?.style.width).toBe('20px')

    fireEvent.focus(firstThumbBefore as HTMLElement)
    fireEvent.keyDown(firstThumbBefore as HTMLElement, { key: 'ArrowRight' })

    await waitFor(() => {
      const [firstThumb, secondThumb] = getThumbs(screen.container)
      expect(firstThumb?.getAttribute('aria-valuenow')).toBe('21')
      expect(secondThumb?.getAttribute('aria-valuenow')).toBe('80')
      expect(firstThumb?.style.width).toBe('20px')
      expect(secondThumb?.style.width).toBe('20px')
    })

    const [firstThumbAfter, secondThumbAfter] = getThumbs(screen.container)
    expect(firstThumbAfter).toBe(firstThumbBefore)
    expect(secondThumbAfter).toBe(secondThumbBefore)
  })

  test('applies class overrides for root and thumb slots', () => {
    const screen = render(() => (
      <Slider classes={{ root: 'root-override', thumb: 'thumb-override' }} />
    ))

    const root = screen.container.querySelector('[data-slot="root"][id$="-root"]')
    const thumb = screen.container.querySelector('[data-slot="thumb"]')

    expect(root?.className).toContain('root-override')
    expect(thumb?.className).toContain('thumb-override')
  })

  test('applies style overrides for root and thumb slots', () => {
    const screen = render(() => (
      <Slider styles={{ root: { width: '200px' }, thumb: { width: '200px' } }} />
    ))

    const root = screen.container.querySelector(
      '[data-slot="root"][id$="-root"]',
    ) as HTMLElement | null
    const thumb = screen.container.querySelector('[data-slot="thumb"]') as HTMLElement | null

    expect(root?.style.width).toBe('200px')
    expect(thumb?.style.width).toBe('200px')
  })

  test('renders step dividers when enabled', () => {
    const screen = render(() => <Slider divider min={0} max={10} step={2} />)

    const dividers = screen.container.querySelectorAll('[data-slot="divider"]')

    expect(dividers).toHaveLength(4)
    expect((dividers[0] as HTMLElement).style.left).toBe('20%')
    expect(dividers[0]?.className).toContain('h-full')
    expect(dividers[0]?.className).toContain('w-px')
  })

  test('uses a solid track and inset marker shape for bold variant', () => {
    const screen = render(() => <Slider divider variant="bold" min={0} max={4} step={1} />)

    const track = screen.container.querySelector('[data-slot="track"]')
    const range = screen.container.querySelector('[data-slot="range"]')
    const divider = screen.container.querySelector('[data-slot="divider"]')
    const thumb = screen.container.querySelector('[data-slot="thumb"]')

    expect(track?.className).toContain('h-[var(--s-size)]')
    expect(
      (screen.container.querySelector('[data-slot="root"]') as HTMLElement).style.getPropertyValue(
        '--s-size',
      ),
    ).toBe('24px')
    expect(
      (screen.container.querySelector('[data-slot="root"]') as HTMLElement).style.getPropertyValue(
        '--s-len',
      ),
    ).toBe('16px')
    expect(
      (screen.container.querySelector('[data-slot="root"]') as HTMLElement).style.getPropertyValue(
        '--s-offset',
      ),
    ).toBe('4px')
    expect(track?.className).toContain('rounded-sm')
    expect(track?.className).toContain('bg-input')
    expect(range?.className).toContain('rounded-[inherit]')
    expect(range?.className).toContain('bg-primary')
    expect(range?.className).toContain('z-raised')
    expect(range?.className).toContain('after:')
    expect(divider?.className).toContain('w-px')
    expect(thumb?.className).toContain('opacity-0')
    expect(thumb?.className).toContain('h-full')
    expect(thumb?.className).toContain('top-0')
    expect(thumb?.className).toContain('z-control')
    expect(thumb?.className).toContain('cursor-grab')
    expect(thumb?.className).toContain('-translate-x-1/2')
  })

  test('applies distinct border radius and heights across bold sizes', () => {
    const sm = render(() => <Slider variant="bold" size="sm" />)
    const md = render(() => <Slider variant="bold" size="md" />)
    const lg = render(() => <Slider variant="bold" size="lg" />)

    const smTrack = sm.container.querySelector('[data-slot="track"]')
    const mdTrack = md.container.querySelector('[data-slot="track"]')
    const lgTrack = lg.container.querySelector('[data-slot="track"]')

    expect(
      (sm.container.querySelector('[data-slot="root"]') as HTMLElement).style.getPropertyValue(
        '--s-size',
      ),
    ).toBe('20px')
    expect(smTrack?.className).toContain('rounded-xs')

    expect(
      (md.container.querySelector('[data-slot="root"]') as HTMLElement).style.getPropertyValue(
        '--s-size',
      ),
    ).toBe('24px')
    expect(mdTrack?.className).toContain('rounded-sm')

    expect(
      (lg.container.querySelector('[data-slot="root"]') as HTMLElement).style.getPropertyValue(
        '--s-size',
      ),
    ).toBe('28px')
    expect(lgTrack?.className).toContain('rounded-md')
  })

  test('dividerIndexes is reactive when step, divider, or bounds change', async () => {
    const [step, setStep] = createSignal<number | undefined>(2)
    const [divider, setDivider] = createSignal(true)
    const [max, setMax] = createSignal(10)

    const screen = render(() => <Slider min={0} max={max()} step={step()} divider={divider()} />)

    let dividers = screen.container.querySelectorAll('[data-slot="divider"]')
    expect(dividers).toHaveLength(4)

    setStep(5)
    await waitFor(() => {
      dividers = screen.container.querySelectorAll('[data-slot="divider"]')
      expect(dividers).toHaveLength(1)
      expect((dividers[0] as HTMLElement).style.left).toBe('50%')
    })

    setMax(20)
    await waitFor(() => {
      dividers = screen.container.querySelectorAll('[data-slot="divider"]')
      expect(dividers).toHaveLength(3)
      expect((dividers[0] as HTMLElement).style.left).toBe('25%')
    })

    setDivider(false)
    await waitFor(() => {
      dividers = screen.container.querySelectorAll('[data-slot="divider"]')
      expect(dividers).toHaveLength(0)
    })
  })

  test('useSlider.dividerIndexes reacts when step increases', async () => {
    const [step, setStep] = createSignal<number | undefined>(0)
    let sliderResult!: ReturnType<typeof useSlider>

    render(() => {
      sliderResult = useSlider({
        min: 0,
        max: 100,
        get step() {
          return step()
        },
        minStepsBetweenThumbs: 0,
        allowThumbCrossing: true,
        orientation: 'horizontal',
        inverted: false,
      })
      return <div>{sliderResult.dividerIndexes().join(',')}</div>
    })

    expect(sliderResult.dividerIndexes()).toEqual([])

    setStep(25)
    await waitFor(() => {
      expect(sliderResult.dividerIndexes()).toEqual([1, 2, 3])
    })

    setStep(50)
    await waitFor(() => {
      expect(sliderResult.dividerIndexes()).toEqual([1])
    })

    setStep(10)
    await waitFor(() => {
      expect(sliderResult.dividerIndexes()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    })
  })

  test('centers bold range thumbs on their target values', () => {
    const screen = render(() => <Slider variant="bold" defaultValue={[30, 70]} />)
    const thumbs = getThumbs(screen.container)

    expect(thumbs[0]?.className).toContain('-translate-x-1/2')
    expect(thumbs[1]?.className).toContain('-translate-x-1/2')
    expect(thumbs[0]?.className).not.toContain('translate-x-1 -translate-y-1/2')
    expect(thumbs[1]?.className).not.toContain('-translate-x-[calc(100%+4px)]')
  })

  test('renders both thumb indicators on bold range slider', () => {
    const screen = render(() => <Slider variant="bold" defaultValue={[30, 70]} />)
    const range = screen.container.querySelector('[data-slot="range"]') as HTMLElement

    expect(range.className).toContain('before:')
    expect(range.className).toContain('after:')
  })

  test('renders only one thumb indicator on bold single slider', () => {
    const screen = render(() => <Slider variant="bold" defaultValue={40} />)
    const range = screen.container.querySelector('[data-slot="range"]') as HTMLElement

    expect(range.className).not.toContain('before:')
    expect(range.className).toContain('after:')
  })

  test('clears pointer focus from bold thumb on pointer down', async () => {
    const screen = render(() => <Slider variant="bold" defaultValue={40} />)
    const thumb = screen.container.querySelector('[data-slot="thumb"]') as HTMLElement
    mockPointerCapture(thumb)

    thumb.focus()

    expect(document.activeElement).toBe(thumb)

    fireEvent.pointerDown(thumb, {
      button: 0,
      clientX: 0,
      pointerId: 1,
    })

    expect(document.activeElement).not.toBe(thumb)
  })

  test('sets data-dragging during active thumb drag', () => {
    const screen = render(() => <Slider defaultValue={20} variant="bold" />)
    const thumb = getThumbs(screen.container)[0] as HTMLElement
    const track = screen.container.querySelector('[data-slot="track"]') as HTMLElement
    const range = screen.container.querySelector('[data-slot="range"]') as HTMLElement
    mockPointerCapture(thumb)
    mockTrackRect(track)

    expect(track.getAttribute('data-dragging')).toBeNull()
    expect(range.getAttribute('data-dragging')).toBeNull()

    fireEvent.pointerDown(thumb, {
      button: 0,
      pointerId: 1,
      clientX: 20,
      clientY: 0,
    })

    expect(range.getAttribute('data-dragging')).toBe('')

    fireEvent.pointerUp(thumb, {
      pointerId: 1,
      clientX: 20,
      clientY: 0,
    })

    expect(track.getAttribute('data-dragging')).toBeNull()
    expect(range.getAttribute('data-dragging')).toBeNull()
  })

  describe('commit semantics', () => {
    test('keyboard changes commit on keyup without requiring blur', async () => {
      const onValueChange = vi.fn()
      const onChange = vi.fn()
      const screen = render(() => (
        <Slider defaultValue={50} onValueChange={onValueChange} onChange={onChange} />
      ))
      const thumb = getThumbs(screen.container)[0] as HTMLElement

      fireEvent.focus(thumb)
      fireEvent.keyDown(thumb, { key: 'ArrowRight' })

      expect(onValueChange).toHaveBeenLastCalledWith(51)
      expect(onChange).not.toHaveBeenCalled()

      fireEvent.keyUp(thumb, { key: 'ArrowRight' })

      expect(onChange).toHaveBeenLastCalledWith(51)
      expect(onChange).toHaveBeenCalledTimes(1)
    })

    test('Home key commits on keyup', async () => {
      const onChange = vi.fn()
      const screen = render(() => <Slider defaultValue={50} onChange={onChange} />)
      const thumb = getThumbs(screen.container)[0] as HTMLElement

      fireEvent.focus(thumb)
      fireEvent.keyDown(thumb, { key: 'Home' })
      expect(onChange).not.toHaveBeenCalled()

      fireEvent.keyUp(thumb, { key: 'Home' })
      expect(onChange).toHaveBeenLastCalledWith(0)
    })

    test('End key commits on keyup', async () => {
      const onChange = vi.fn()
      const screen = render(() => <Slider defaultValue={50} onChange={onChange} />)
      const thumb = getThumbs(screen.container)[0] as HTMLElement

      fireEvent.focus(thumb)
      fireEvent.keyDown(thumb, { key: 'End' })
      expect(onChange).not.toHaveBeenCalled()

      fireEvent.keyUp(thumb, { key: 'End' })
      expect(onChange).toHaveBeenLastCalledWith(100)
    })

    test('PageUp key commits on keyup', async () => {
      const onChange = vi.fn()
      const screen = render(() => <Slider defaultValue={50} onChange={onChange} />)
      const thumb = getThumbs(screen.container)[0] as HTMLElement

      fireEvent.focus(thumb)
      fireEvent.keyDown(thumb, { key: 'PageUp' })
      expect(onChange).not.toHaveBeenCalled()

      fireEvent.keyUp(thumb, { key: 'PageUp' })
      expect(onChange).toHaveBeenCalledWith(60)
    })

    test('multiple keydown events only commit once on final keyup', async () => {
      const onChange = vi.fn()
      const screen = render(() => <Slider defaultValue={50} onChange={onChange} />)
      const thumb = getThumbs(screen.container)[0] as HTMLElement

      fireEvent.focus(thumb)
      fireEvent.keyDown(thumb, { key: 'ArrowRight' })
      fireEvent.keyUp(thumb, { key: 'ArrowRight' })
      fireEvent.keyDown(thumb, { key: 'ArrowRight' })
      fireEvent.keyUp(thumb, { key: 'ArrowRight' })

      expect(onChange).toHaveBeenCalledTimes(2)
      expect(onChange).toHaveBeenNthCalledWith(1, 51)
      expect(onChange).toHaveBeenNthCalledWith(2, 52)
    })

    test('blur still commits if keyup was missed', async () => {
      const onChange = vi.fn()
      const screen = render(() => <Slider defaultValue={50} onChange={onChange} />)
      const thumb = getThumbs(screen.container)[0] as HTMLElement

      fireEvent.focus(thumb)
      fireEvent.keyDown(thumb, { key: 'ArrowRight' })

      fireEvent.blur(thumb)

      expect(onChange).toHaveBeenLastCalledWith(51)
    })
  })

  describe('multi-thumb keyboard edge cases', () => {
    test('Home moves current thumb to its minimum boundary, not global min', async () => {
      const onChange = vi.fn()
      const screen = render(() => (
        <Slider
          defaultValue={[20, 80]}
          minStepsBetweenThumbs={10}
          allowThumbCrossing={false}
          onChange={onChange}
        />
      ))
      const thumbs = getThumbs(screen.container)

      fireEvent.focus(thumbs[1] as HTMLElement)
      fireEvent.keyDown(thumbs[1] as HTMLElement, { key: 'Home' })
      fireEvent.keyUp(thumbs[1] as HTMLElement, { key: 'Home' })

      await waitFor(() => {
        expect(onChange).toHaveBeenLastCalledWith([20, 30])
      })
    })

    test('End moves current thumb to its maximum boundary, not global max', async () => {
      const onChange = vi.fn()
      const screen = render(() => (
        <Slider
          defaultValue={[20, 80]}
          minStepsBetweenThumbs={10}
          allowThumbCrossing={false}
          onChange={onChange}
        />
      ))
      const thumbs = getThumbs(screen.container)

      fireEvent.focus(thumbs[0] as HTMLElement)
      fireEvent.keyDown(thumbs[0] as HTMLElement, { key: 'End' })
      fireEvent.keyUp(thumbs[0] as HTMLElement, { key: 'End' })

      await waitFor(() => {
        expect(onChange).toHaveBeenLastCalledWith([70, 80])
      })
    })

    test('arrow key at boundary switches focus to adjacent thumb when blocked', async () => {
      const onValueChange = vi.fn()
      const screen = render(() => (
        <Slider
          defaultValue={[20, 50]}
          minStepsBetweenThumbs={0}
          allowThumbCrossing={false}
          onValueChange={onValueChange}
        />
      ))
      const thumbs = getThumbs(screen.container)

      ;(thumbs[0] as HTMLElement).focus()

      for (let i = 0; i < 30; i++) {
        fireEvent.keyDown(thumbs[0] as HTMLElement, { key: 'ArrowRight' })
      }

      expect(onValueChange).toHaveBeenLastCalledWith([50, 50])

      fireEvent.keyDown(thumbs[0] as HTMLElement, { key: 'ArrowRight' })

      expect(onValueChange).toHaveBeenLastCalledWith([50, 50])
      expect(document.activeElement).toBe(thumbs[1])
    })

    test('arrow key switches to previous thumb when blocked going left', async () => {
      const onValueChange = vi.fn()
      const screen = render(() => (
        <Slider defaultValue={[20, 50]} allowThumbCrossing={false} onValueChange={onValueChange} />
      ))
      const thumbs = getThumbs(screen.container)

      ;(thumbs[1] as HTMLElement).focus()

      for (let i = 0; i < 30; i++) {
        fireEvent.keyDown(thumbs[1] as HTMLElement, { key: 'ArrowLeft' })
      }

      expect(thumbs[1]?.getAttribute('aria-valuenow')).toBe('20')

      fireEvent.keyDown(thumbs[1] as HTMLElement, { key: 'ArrowLeft' })

      expect(onValueChange).toHaveBeenLastCalledWith([20, 20])
      expect(document.activeElement).toBe(thumbs[0])
    })

    test('arrow key does not switch thumb when allowThumbCrossing is true', async () => {
      const onValueChange = vi.fn()
      const screen = render(() => (
        <Slider defaultValue={[20, 50]} allowThumbCrossing={true} onValueChange={onValueChange} />
      ))
      const thumbs = getThumbs(screen.container)

      ;(thumbs[0] as HTMLElement).focus()

      for (let i = 0; i < 35; i++) {
        fireEvent.keyDown(thumbs[0] as HTMLElement, { key: 'ArrowRight' })
      }

      expect(onValueChange).toHaveBeenLastCalledWith([52, 53])
      expect(document.activeElement).toBe(thumbs[0])
    })

    test('arrow key does not switch thumb at global boundaries', async () => {
      const onValueChange = vi.fn()
      const screen = render(() => (
        <Slider defaultValue={[0, 50]} allowThumbCrossing={false} onValueChange={onValueChange} />
      ))
      const thumbs = getThumbs(screen.container)

      ;(thumbs[0] as HTMLElement).focus()
      fireEvent.keyDown(thumbs[0] as HTMLElement, { key: 'ArrowLeft' })

      expect(thumbs[0]?.getAttribute('aria-valuenow')).toBe('0')
      expect(onValueChange).not.toHaveBeenCalled()
      expect(document.activeElement).toBe(thumbs[0])
    })

    test('PageUp and PageDown do not switch thumbs, only move current thumb', async () => {
      const onValueChange = vi.fn()
      const screen = render(() => (
        <Slider defaultValue={[40, 60]} allowThumbCrossing={false} onValueChange={onValueChange} />
      ))
      const thumbs = getThumbs(screen.container)

      ;(thumbs[0] as HTMLElement).focus()
      fireEvent.keyDown(thumbs[0] as HTMLElement, { key: 'PageUp' })

      expect(thumbs[0]?.getAttribute('aria-valuenow')).toBe('50')
      expect(onValueChange).toHaveBeenLastCalledWith([50, 60])
      expect(document.activeElement).toBe(thumbs[0])
    })

    test('PageUp switches focus to adjacent thumb when blocked at thumb boundary', async () => {
      const screen = render(() => <Slider defaultValue={[40, 50]} allowThumbCrossing={false} />)
      const thumbs = getThumbs(screen.container)

      ;(thumbs[0] as HTMLElement).focus()
      fireEvent.keyDown(thumbs[0] as HTMLElement, { key: 'PageUp' })

      expect(thumbs[0]?.getAttribute('aria-valuenow')).toBe('50')
      expect(document.activeElement).toBe(thumbs[0])

      fireEvent.keyDown(thumbs[0] as HTMLElement, { key: 'PageUp' })

      expect(thumbs[0]?.getAttribute('aria-valuenow')).toBe('50')
      expect(document.activeElement).toBe(thumbs[1])
    })

    test('PageDown switches focus to previous thumb when blocked at thumb boundary', async () => {
      const screen = render(() => <Slider defaultValue={[40, 50]} allowThumbCrossing={false} />)
      const thumbs = getThumbs(screen.container)

      ;(thumbs[1] as HTMLElement).focus()
      fireEvent.keyDown(thumbs[1] as HTMLElement, { key: 'PageDown' })

      expect(thumbs[1]?.getAttribute('aria-valuenow')).toBe('40')
      expect(document.activeElement).toBe(thumbs[1])

      fireEvent.keyDown(thumbs[1] as HTMLElement, { key: 'PageDown' })

      expect(thumbs[1]?.getAttribute('aria-valuenow')).toBe('40')
      expect(document.activeElement).toBe(thumbs[0])
    })

    test('blur during programmatic focus shift does not double-commit', async () => {
      const onChange = vi.fn()
      const screen = render(() => (
        <Slider defaultValue={[20, 50]} allowThumbCrossing={false} onChange={onChange} />
      ))
      const thumbs = getThumbs(screen.container)

      ;(thumbs[0] as HTMLElement).focus()

      for (let i = 0; i < 30; i++) {
        fireEvent.keyDown(thumbs[0] as HTMLElement, { key: 'ArrowRight' })
      }
      fireEvent.keyUp(thumbs[0] as HTMLElement, { key: 'ArrowRight' })

      const commitsBefore = onChange.mock.calls.length

      fireEvent.keyDown(thumbs[0] as HTMLElement, { key: 'ArrowRight' })

      expect(document.activeElement).toBe(thumbs[1])
      expect(onChange).toHaveBeenCalledTimes(commitsBefore)
    })

    test('minStepsBetweenThumbs prevents move and switches focus', async () => {
      const screen = render(() => (
        <Slider defaultValue={[20, 30]} minStepsBetweenThumbs={10} allowThumbCrossing={false} />
      ))
      const thumbs = getThumbs(screen.container)

      ;(thumbs[0] as HTMLElement).focus()

      fireEvent.keyDown(thumbs[0] as HTMLElement, { key: 'ArrowRight' })

      expect(thumbs[0]?.getAttribute('aria-valuenow')).toBe('20')
      expect(document.activeElement).toBe(thumbs[1])
    })
  })

  describe('pointer commit semantics', () => {
    test('pointer drag emits live updates but commits only on release', async () => {
      const onValueChange = vi.fn()
      const onChange = vi.fn()
      const screen = render(() => (
        <Slider defaultValue={20} onValueChange={onValueChange} onChange={onChange} />
      ))
      const thumb = getThumbs(screen.container)[0] as HTMLElement
      const track = screen.container.querySelector('[data-slot="track"]') as HTMLElement

      mockPointerCapture(thumb)
      mockTrackRect(track)

      fireEvent.pointerDown(thumb, {
        button: 0,
        pointerId: 1,
        clientX: 20,
        clientY: 0,
      })
      fireEvent.pointerMove(thumb, {
        pointerId: 1,
        clientX: 40,
        clientY: 0,
      })
      fireEvent.pointerMove(thumb, {
        pointerId: 1,
        clientX: 60,
        clientY: 0,
      })

      expect(onValueChange).toHaveBeenCalled()
      expect(onChange).not.toHaveBeenCalled()

      fireEvent.pointerUp(thumb, {
        pointerId: 1,
        clientX: 60,
        clientY: 0,
      })

      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onChange).toHaveBeenLastCalledWith(60)
    })

    test('track press reuses the last focused overlapping thumb', async () => {
      const screen = render(() => <Slider defaultValue={[20, 20]} />)
      const thumbs = getThumbs(screen.container)
      const track = screen.container.querySelector('[data-slot="track"]') as HTMLElement

      mockPointerCapture(track)
      mockTrackRect(track)

      fireEvent.focus(thumbs[0] as HTMLElement)
      fireEvent.pointerDown(track, {
        button: 0,
        pointerId: 1,
        clientX: 20,
        clientY: 0,
      })

      expect(document.activeElement).toBe(thumbs[0])
    })

    test('pointer cancel commits pending drag values', async () => {
      const onChange = vi.fn()
      const screen = render(() => <Slider defaultValue={20} onChange={onChange} />)
      const thumb = getThumbs(screen.container)[0] as HTMLElement
      const track = screen.container.querySelector('[data-slot="track"]') as HTMLElement

      mockPointerCapture(thumb)
      mockTrackRect(track)

      fireEvent.pointerDown(thumb, {
        button: 0,
        pointerId: 1,
        clientX: 20,
        clientY: 0,
      })
      fireEvent.pointerMove(thumb, {
        pointerId: 1,
        clientX: 45,
        clientY: 0,
      })

      expect(onChange).not.toHaveBeenCalled()

      fireEvent.pointerCancel(thumb, {
        pointerId: 1,
        clientX: 45,
        clientY: 0,
      })

      expect(onChange).toHaveBeenLastCalledWith(45)
    })
  })

  test('normalizes initial scalar and range values before rendering', () => {
    const scalar = render(() => <Slider min={20} max={40} defaultValue={5} />)
    const range = render(() => <Slider min={20} max={40} defaultValue={[41, Number.NaN, 19]} />)

    expect(getThumbs(scalar.container).map((thumb) => thumb.getAttribute('aria-valuenow'))).toEqual(
      ['20'],
    )
    expect(getThumbs(range.container).map((thumb) => thumb.getAttribute('aria-valuenow'))).toEqual([
      '20',
      '20',
      '40',
    ])
  })

  test.each([
    ['equal bounds', 10, 10],
    ['inverted bounds', 10, 0],
    ['non-finite minimum', Number.NaN, 10],
    ['non-finite maximum', 0, Number.POSITIVE_INFINITY],
  ])('rejects %s', (_name, min, max) => {
    expect(() => render(() => <Slider min={min} max={max} />)).toThrow(
      'Slider `max` must be a finite number greater than `min`.',
    )
  })

  test('drops stale keyboard pending values after a controlled update', async () => {
    const onChange = vi.fn()
    const onValueChange = vi.fn()
    const [value, setValue] = createSignal(20)
    const screen = render(() => (
      <Slider value={value()} onChange={onChange} onValueChange={onValueChange} />
    ))
    const thumb = getThumbs(screen.container)[0] as HTMLElement

    fireEvent.keyDown(thumb, { key: 'ArrowRight' })
    expect(onValueChange).toHaveBeenCalledWith(21)

    setValue(60)
    await waitFor(() => expect(thumb.getAttribute('aria-valuenow')).toBe('60'))
    fireEvent.keyUp(thumb, { key: 'ArrowRight' })

    expect(onChange).not.toHaveBeenCalled()
  })

  test('drops stale pointer pending values after a controlled update', async () => {
    const onChange = vi.fn()
    const [value, setValue] = createSignal(20)
    const screen = render(() => <Slider value={value()} onChange={onChange} />)
    const thumb = getThumbs(screen.container)[0] as HTMLElement
    const track = screen.container.querySelector('[data-slot="track"]') as HTMLElement
    mockPointerCapture(thumb)
    mockTrackRect(track)

    fireEvent.pointerDown(thumb, { button: 0, clientX: 20, pointerId: 1 })
    fireEvent.pointerMove(thumb, { clientX: 40, pointerId: 1 })
    setValue(60)
    await waitFor(() => expect(thumb.getAttribute('aria-valuenow')).toBe('60'))
    fireEvent.pointerUp(thumb, { clientX: 40, pointerId: 1 })

    expect(onChange).not.toHaveBeenCalled()
  })

  test('does not emit input or commit callbacks for boundary no-ops', async () => {
    const onChange = vi.fn()
    const onValueChange = vi.fn()
    const screen = render(() => (
      <Slider defaultValue={100} onChange={onChange} onValueChange={onValueChange} />
    ))
    const thumb = getThumbs(screen.container)[0] as HTMLElement

    fireEvent.keyDown(thumb, { key: 'ArrowRight' })
    fireEvent.keyUp(thumb, { key: 'ArrowRight' })

    expect(onValueChange).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
  })

  test('restores uncontrolled values and repeated-name form data on reset', async () => {
    const screen = render(() => (
      <form>
        <Slider name="range" defaultValue={[20, 80]} />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const firstThumb = getThumbs(screen.container)[0] as HTMLElement

    firstThumb.focus()
    fireEvent.keyDown(firstThumb, { key: 'ArrowRight' })
    fireEvent.keyUp(firstThumb, { key: 'ArrowRight' })
    expect(new FormData(form).getAll('range')).toEqual(['21', '80'])

    form.reset()
    await waitFor(() => expect(new FormData(form).getAll('range')).toEqual(['20', '80']))
    expect(getThumbs(screen.container).map((thumb) => thumb.getAttribute('aria-valuenow'))).toEqual(
      ['20', '80'],
    )
  })

  test('preserves the current value when native reset is canceled', async () => {
    const screen = render(() => (
      <form onReset={(event) => event.preventDefault()}>
        <Slider name="volume" defaultValue={20} />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const thumb = getThumbs(screen.container)[0] as HTMLElement

    fireEvent.keyDown(thumb, { key: 'ArrowRight' })
    fireEvent.keyUp(thumb, { key: 'ArrowRight' })
    form.reset()
    await Promise.resolve()

    expect(thumb.getAttribute('aria-valuenow')).toBe('21')
    expect(new FormData(form).get('volume')).toBe('21')
  })

  test('releases an owned pointer capture when unmounted', async () => {
    const screen = render(() => <Slider defaultValue={20} />)
    const thumb = getThumbs(screen.container)[0] as HTMLElement
    mockPointerCapture(thumb)
    const releasePointerCapture = vi.spyOn(thumb, 'releasePointerCapture')

    fireEvent.pointerDown(thumb, { button: 0, pointerId: 7 })
    screen.unmount()

    expect(releasePointerCapture).toHaveBeenCalledWith(7)
  })

  test('renders children inside slider root', () => {
    const screen = render(() => (
      <Slider defaultValue={20}>
        <span data-testid="slider-child">Custom Child</span>
      </Slider>
    ))

    expect(screen.getByTestId('slider-child')).not.toBeNull()
  })

  test('reflects data-dragging on root during pointer interaction', () => {
    const screen = render(() => <Slider defaultValue={20} />)
    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement
    const track = screen.container.querySelector('[data-slot="track"]') as HTMLElement
    mockPointerCapture(track)

    expect(root.hasAttribute('data-dragging')).toBe(false)
    fireEvent.pointerDown(track, { button: 0, clientX: 50, pointerId: 1 })
    expect(root.hasAttribute('data-dragging')).toBe(true)
    fireEvent.pointerUp(track, { button: 0, pointerId: 1 })
    expect(root.hasAttribute('data-dragging')).toBe(false)
  })
})
