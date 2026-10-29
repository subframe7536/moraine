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

    // `peer-*` selectors only reach later siblings of the track and thumb.
    expect(slots).toEqual([
      'slider-track',
      'slider-thumb',
      'bold-slider-content',
      'bold-slider-fill',
      'bold-slider-indicator',
    ])
    expect(query(screen.container, '[data-slot="slider-track"]').classList).toContain('peer')
    expect(query(screen.container, '[data-slot="slider-thumb"]').classList).toContain('peer')
  })

  test('sizes the fill copy and the indicator box to the value', () => {
    const [value, setValue] = createSignal(25)
    const screen = render(() => <BoldSlider value={value()} />)
    const fill = query(screen.container, '[data-slot="bold-slider-fill"]')
    const indicators = queryAll(screen.container, '[data-slot="bold-slider-indicator"]')
    const range = query(screen.container, '[data-slot="slider-range"]')

    const fillLayer = fill.firstElementChild as HTMLElement

    expect(indicators).toHaveLength(1)
    expect(fill.style.width).toBe('25%')
    // 400% of a box that is 25% of the track spans the full track.
    expect(fillLayer.style.width).toBe('400%')
    expect(indicators[0]?.style.width).toBe('25%')
    expect(range.style.right).toBe('75%')

    setValue(80)
    expect(fill.style.width).toBe('80%')
    expect(fillLayer.style.width).toBe('125%')

    setValue(0)
    expect(fill.style.width).toBe('0%')
    expect(fillLayer.style.width).toBe('100%')

    setValue(80)
    expect(indicators[0]?.style.width).toBe('80%')
  })

  test('uses only peer selectors for interaction state', () => {
    const screen = render(() => <BoldSlider label="Bounce" marker step={10} />)
    const classNames = queryAll(screen.container, '[class]')
      .flatMap((element) => Array.from(element.classList))
      .filter((token) => token !== 'group')

    expect(
      classNames.filter((token) => token.startsWith('group-') || token.includes('has-')),
    ).toEqual([])
    const indicator = query(screen.container, '[data-slot="bold-slider-indicator"]')
    expect(indicator.classList).toContain('peer-hover:opacity-90')
    expect(indicator.classList).toContain('peer-focus-visible:opacity-90')
    expect(indicator.classList).toContain('peer-data-[dragging]:opacity-90')
    expect(query(screen.container, '[data-slot="bold-slider-content"]').classList).toContain(
      'peer-focus-visible:ring-3',
    )
  })

  test('anchors the fill copy and indicator to the end edge when inverted', () => {
    const screen = render(() => <BoldSlider inverted defaultValue={40} />)
    const thumb = query(screen.container, '[data-slot="slider-thumb"]')
    const fill = query(screen.container, '[data-slot="bold-slider-fill"]')
    const indicator = query(screen.container, '[data-slot="bold-slider-indicator"]')

    expect(thumb.hasAttribute('data-inverted')).toBe(true)
    expect(fill.style.width).toBe('40%')
    expect(fill.classList).toContain('peer-data-[inverted]:end-0')
    expect(indicator.classList).toContain('peer-data-[inverted]:end-0')
    expect(indicator.classList).toContain('peer-data-[inverted]:justify-start')
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
    expect(root.style.getPropertyValue('--bs-pad')).toBe('13px')
    expect(root.style.getPropertyValue('--bs-indicator-gap')).toBe('5px')
    expect(query(screen.container, '[data-slot="bold-slider-indicator"]').classList).toContain(
      'before:h-4.5',
    )

    setSize('lg')
    expect(track.classList).toContain('h-10')
    expect(root.style.getPropertyValue('--bs-pad')).toBe('17px')
  })

  test('uses a theme token for step markers', () => {
    const screen = render(() => <BoldSlider marker min={0} max={4} step={1} defaultValue={1} />)
    const markers = queryAll(screen.container, '[data-slot="slider-marker"]')

    expect(markers).toHaveLength(3)
    for (const marker of markers) {
      expect(marker.classList).toContain('bg-muted-foreground/40')
      expect(marker.classList).not.toContain('bg-background')
    }
    expect(markers.map((marker) => marker.hasAttribute('data-active'))).toEqual([
      true,
      false,
      false,
    ])
    // The marker at the fill edge is hidden instead of showing half outside the fill.
    expect(markers[0]?.classList).toContain('data-active:opacity-0')
  })

  test('defaults to the subtle variant and switches fill colors for solid', () => {
    const [variant, setVariant] = createSignal<'solid' | 'subtle' | undefined>(undefined)
    const screen = render(() => <BoldSlider label="Bounce" variant={variant()} />)
    const range = query(screen.container, '[data-slot="slider-range"]')
    const fillLabel = query(screen.container, '[data-slot="bold-slider-label"][data-fill]')
    const fillValue = query(screen.container, '[data-slot="bold-slider-value"][data-fill]')
    const indicator = query(screen.container, '[data-slot="bold-slider-indicator"]')

    expect(range.classList).toContain('bg-muted-active')
    expect(range.classList).not.toContain('bg-primary')
    expect(fillLabel.classList).toContain('data-fill:text-muted-foreground')
    expect(fillValue.classList).toContain('data-fill:text-foreground')
    expect(indicator.classList).toContain('text-foreground')
    expect(indicator.classList).not.toContain('text-primary-foreground')

    setVariant('solid')
    expect(range.classList).toContain('bg-primary')
    expect(range.classList).not.toContain('bg-muted-active')
    expect(fillLabel.classList).toContain('data-fill:text-primary-foreground/80')
    expect(fillValue.classList).toContain('data-fill:text-primary-foreground')
    expect(indicator.classList).toContain('text-primary-foreground')

    setVariant('subtle')
    expect(range.classList).toContain('bg-muted-active')
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
