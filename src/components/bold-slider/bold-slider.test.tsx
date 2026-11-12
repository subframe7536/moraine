import { fireEvent, render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { BoldSlider } from './bold-slider'

function query<T extends HTMLElement = HTMLElement>(container: HTMLElement, selector: string): T {
  return container.querySelector<T>(selector)!
}

function queryAll(container: HTMLElement, selector: string): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(selector))
}

describe('BoldSlider', () => {
  test('renders a single slider with label, value, and accessible name', () => {
    const screen = render(() => <BoldSlider label="Bounce" defaultValue={0.5} max={1} step={0.1} />)
    const root = query(screen.container, '[data-slot="slider"]')
    const thumbs = queryAll(screen.container, '[data-slot="slider-thumb"]')
    const content = query(screen.container, '[data-slot="bold-slider-content"]')

    expect(thumbs).toHaveLength(1)
    expect(root.getAttribute('aria-label')).toBe('Bounce')
    expect(thumbs[0]?.getAttribute('aria-valuenow')).toBe('0.5')
    expect(content.getAttribute('aria-hidden')).toBe('true')
    expect(root.contains(content)).toBe(true)

    const labels = queryAll(screen.container, '[data-slot="bold-slider-label"]')
    const values = queryAll(screen.container, '[data-slot="bold-slider-value"]')
    expect(labels.map((label) => label.textContent)).toEqual(['Bounce', 'Bounce'])
    expect(values.map((value) => value.textContent)).toEqual(['0.5', '0.5'])
    expect(labels.map((label) => label.hasAttribute('data-fill'))).toEqual([false, true])
    expect(values.map((value) => value.hasAttribute('data-fill'))).toEqual([false, true])
  })

  test('prefers an explicit aria-label over the label', () => {
    const screen = render(() => <BoldSlider label="Blur" aria-label="Background blur" />)

    expect(query(screen.container, '[data-slot="slider"]').getAttribute('aria-label')).toBe(
      'Background blur',
    )
  })

  test('renders overlay parts as root children after the track and thumb', () => {
    const screen = render(() => <BoldSlider label="Bounce" defaultValue={30} />)
    const root = query(screen.container, '[data-slot="slider"]')
    const slots = Array.from(root.children).map((child) => child.getAttribute('data-slot'))

    expect(slots).toEqual([
      'slider-track',
      'slider-thumb',
      'bold-slider-content',
      'bold-slider-fill',
      'bold-slider-indicator',
    ])
  })

  test('hides the range and keeps the indicator visible when the value is at the minimum', () => {
    const [value, setValue] = createSignal(25)
    const screen = render(() => <BoldSlider value={value()} />)
    const range = query(screen.container, '[data-slot="slider-range"]')
    const indicator = query(screen.container, '[data-slot="bold-slider-indicator"]')

    expect(range.style.right).toBe('75%')
    expect(range.hasAttribute('data-empty')).toBe(false)

    setValue(0)
    expect(range.style.display).toBe('none')
    expect(range.hasAttribute('data-empty')).toBe(true)
    expect(indicator.style.display).not.toBe('none')

    setValue(50)
    expect(range.style.display).not.toBe('none')
    expect(range.hasAttribute('data-empty')).toBe(false)
  })

  test('formats the value from step decimals or a custom formatter', () => {
    const [step, setStep] = createSignal<number | undefined>(0.25)
    const screen = render(() => (
      <>
        <BoldSlider data-testid="stepped" defaultValue={1.5} max={10} step={step()} />
        <BoldSlider data-testid="custom" defaultValue={40} formatValue={(value) => `${value}px`} />
      </>
    ))
    const stepped = screen.getByTestId('stepped')
    const custom = screen.getByTestId('custom')

    expect(query(stepped, '[data-slot="bold-slider-value"]').textContent).toBe('1.5')
    expect(query(custom, '[data-slot="bold-slider-value"]').textContent).toBe('40px')

    setStep(undefined)
    expect(query(stepped, '[data-slot="bold-slider-value"]').textContent).toBe('1.5')
  })

  test('hides the label and value when they are not requested', () => {
    const screen = render(() => <BoldSlider showValue={false} />)

    expect(screen.container.querySelector('[data-slot="bold-slider-label"]')).toBeNull()
    expect(screen.container.querySelector('[data-slot="bold-slider-value"]')).toBeNull()
    expect(queryAll(screen.container, '[data-slot="bold-slider-indicator"]')).toHaveLength(1)
  })

  test('updates the displayed value from keyboard input and reports changes', () => {
    const onValueChange = vi.fn()
    const onValueCommit = vi.fn()
    const screen = render(() => (
      <BoldSlider
        label="Volume"
        defaultValue={50}
        step={10}
        onValueChange={onValueChange}
        onValueCommit={onValueCommit}
      />
    ))
    const thumb = query(screen.container, '[data-slot="slider-thumb"]')

    fireEvent.keyDown(thumb, { key: 'ArrowRight' })
    fireEvent.keyUp(thumb, { key: 'ArrowRight' })

    expect(onValueChange).toHaveBeenCalledWith(60)
    expect(onValueCommit).toHaveBeenCalledWith(60)
    expect(
      queryAll(screen.container, '[data-slot="bold-slider-value"]').map((el) => el.textContent),
    ).toEqual(['60', '60'])
  })

  test('applies user classes to the root, track, and indicator and sizes the padding', () => {
    const [size, setSize] = createSignal<'sm' | 'md' | 'lg'>('sm')
    const screen = render(() => (
      <BoldSlider
        size={size()}
        class="custom-root"
        classes={{ track: 'custom-track', indicator: 'custom-indicator' }}
      />
    ))
    const root = query(screen.container, '[data-slot="slider"]')
    const track = query(screen.container, '[data-slot="slider-track"]')

    expect(root.classList.contains('custom-root')).toBe(true)
    expect(track.classList.contains('custom-track')).toBe(true)
    expect(
      query(screen.container, '[data-slot="bold-slider-indicator"]').classList.contains(
        'custom-indicator',
      ),
    ).toBe(true)
    expect(root.style.getPropertyValue('--bs-pad')).toBe('13px')

    setSize('lg')
    expect(root.style.getPropertyValue('--bs-pad')).toBe('17px')
  })

  test('marks step markers inside the fill as active', () => {
    const screen = render(() => <BoldSlider marker min={0} max={4} step={1} defaultValue={1} />)
    const markers = queryAll(screen.container, '[data-slot="slider-marker"]')

    expect(markers).toHaveLength(3)
    expect(markers.map((marker) => marker.hasAttribute('data-active'))).toEqual([
      true,
      false,
      false,
    ])
  })

  test('shows keyboard focus state only for keyboard focus', () => {
    const screen = render(() => <BoldSlider label="Bounce" defaultValue={50} step={10} />)
    const track = query(screen.container, '[data-slot="slider-track"]')
    const thumb = query(screen.container, '[data-slot="slider-thumb"]')
    for (const element of [track, thumb]) {
      const captured = new Set<number>()
      Object.assign(element, {
        setPointerCapture: (id: number) => captured.add(id),
        hasPointerCapture: (id: number) => captured.has(id),
        releasePointerCapture: (id: number) => captured.delete(id),
      })
    }
    Object.defineProperty(track, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 0, top: 0, right: 100, bottom: 36, width: 100, height: 36 }),
    })

    fireEvent.pointerDown(track, { button: 0, clientX: 30, pointerId: 1 })
    fireEvent.pointerUp(track, { button: 0, pointerId: 1 })
    expect(document.activeElement).toBe(thumb)
    expect(thumb.hasAttribute('data-focus-visible')).toBe(false)

    fireEvent.keyDown(thumb, { key: 'ArrowRight' })
    expect(thumb.hasAttribute('data-focus-visible')).toBe(true)

    // Pointer interaction on an already focused thumb clears the keyboard state.
    fireEvent.pointerDown(track, { button: 0, clientX: 60, pointerId: 2 })
    fireEvent.pointerUp(track, { button: 0, pointerId: 2 })
    expect(thumb.hasAttribute('data-focus-visible')).toBe(false)

    thumb.blur()
    thumb.focus()
    expect(thumb.hasAttribute('data-focus-visible')).toBe(true)
    thumb.blur()
    expect(thumb.hasAttribute('data-focus-visible')).toBe(false)
  })

  test('submits its value with a native form', () => {
    const screen = render(() => (
      <form data-testid="form">
        <BoldSlider name="opacity" defaultValue={70} />
      </form>
    ))
    const data = new FormData(screen.getByTestId('form') as HTMLFormElement)

    expect(data.get('opacity')).toBe('70')
  })
})
