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

  test('clips the fill copy and positions both indicators at the value edge', () => {
    const [value, setValue] = createSignal(25)
    const screen = render(() => <BoldSlider value={value()} />)
    const content = query(screen.container, '[data-slot="bold-slider-content"]')
    // Base layer, base indicator, then the clip box that holds the fill copy.
    const fill = content.children[2] as HTMLElement
    const indicators = queryAll(screen.container, '[data-slot="bold-slider-indicator"]')
    const range = query(screen.container, '[data-slot="slider-range"]')

    expect(fill.style.width).toBe('25%')
    expect(range.style.right).toBe('75%')
    expect(indicators).toHaveLength(2)
    expect(indicators[1]?.hasAttribute('data-fill')).toBe(true)
    for (const indicator of indicators) {
      expect(indicator.style.getPropertyValue('inset-inline-start')).toContain('25%')
    }

    setValue(80)
    expect(fill.style.width).toBe('80%')
    expect(indicators[0]?.style.getPropertyValue('inset-inline-start')).toContain('80%')
  })

  test('anchors the indicator to the end edge when inverted', () => {
    const screen = render(() => <BoldSlider inverted defaultValue={40} />)
    const indicator = query(screen.container, '[data-slot="bold-slider-indicator"]')

    expect(indicator.style.getPropertyValue('inset-inline-start')).toBe('')
    expect(indicator.style.getPropertyValue('inset-inline-end')).toContain('40%')
    expect(query(screen.container, '[data-slot="slider"]').hasAttribute('data-inverted')).toBe(true)
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
    expect(queryAll(screen.container, '[data-slot="bold-slider-indicator"]')).toHaveLength(2)
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

  test('applies size classes and forwards slot overrides to slider parts', () => {
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
    const thumb = query(screen.container, '[data-slot="slider-thumb"]')

    expect(root.classList).toContain('custom-root')
    expect(track.classList).toContain('custom-track')
    expect(track.classList).toContain('h-8')
    expect(track.classList).not.toContain('h-(--s-size)')
    expect(track.classList).not.toContain('rounded-full')
    expect(thumb.classList).toContain('opacity-0')
    expect(thumb.classList).not.toContain('size-(--s-thumb-size)')
    expect(query(screen.container, '[data-slot="bold-slider-indicator"]').classList).toContain(
      'custom-indicator',
    )
    expect(root.style.getPropertyValue('--bs-pad')).toBe('10px')

    setSize('lg')
    expect(track.classList).toContain('h-10')
    expect(root.style.getPropertyValue('--bs-pad')).toBe('14px')
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
