import { render } from '@solidjs/testing-library'
import { Errored, createSignal, flush } from 'solid-js'
import { describe, expect, vi, it } from 'vitest'

import { MoraineProvider } from '../../provider'

import { Progress } from './progress'
describe('progress', () => {
  it('accepts a style override for thickness', () => {
    const screen = render(() => (
      <MoraineProvider>
        <Progress value={20} size="sm" style={{ '--p-size': '10px' }} />
      </MoraineProvider>
    ))
    const root = screen.container.querySelector('[data-slot="progress"]') as HTMLElement

    expect(root.style.getPropertyValue('--p-size')).toBe('10px')
  })

  it('formats the raw value with formatOptions', () => {
    const fraction = render(() => (
      <Progress value={0.25} max={1} formatOptions={{ style: 'percent' }} valueLabel />
    ))
    expect(fraction.getByRole('progressbar').getAttribute('aria-valuetext')).toBe('25%')

    const raw = render(() => (
      <Progress value={1} max={4} formatOptions={{ style: 'percent' }} valueLabel />
    ))
    expect(raw.getByRole('progressbar').getAttribute('aria-valuetext')).toBe('100%')

    const unformatted = render(() => <Progress value={1} max={4} valueLabel />)
    expect(unformatted.getByRole('progressbar').getAttribute('aria-valuetext')).toBe('25%')

    const currency = render(() => (
      <Progress value={5} formatOptions={{ style: 'currency', currency: 'USD' }} valueLabel />
    ))
    expect(currency.getByRole('progressbar').getAttribute('aria-valuetext')).toBe('$5.00')
  })

  it('renders determinate progress with default aria values', () => {
    const screen = render(() => <Progress value={50} />)
    const progress = screen.getByRole('progressbar')

    expect(progress.getAttribute('aria-valuemin')).toBe('0')
    expect(progress.getAttribute('aria-valuemax')).toBe('100')
    expect(progress.getAttribute('aria-valuenow')).toBe('50')
    expect(progress.getAttribute('aria-valuetext')).toBe('50%')
    expect(screen.container.querySelector('[data-slot="progress-label"]')).toBeNull()
    expect(screen.container.querySelector('[data-slot="progress-value"]')).toBeNull()
  })

  it('supports an accessible name', () => {
    const screen = render(() => <Progress aria-label="Loading page" />)

    expect(screen.getByRole('progressbar', { name: 'Loading page' })).not.toBeNull()
  })

  it('renders label and value before the track in document order', () => {
    const screen = render(() => (
      <MoraineProvider>
        <Progress value={40} label="Upload" valueLabel />
      </MoraineProvider>
    ))
    const root = screen.getByRole('progressbar')
    const label = screen.container.querySelector('[data-slot="progress-label"]')
    const value = screen.container.querySelector('[data-slot="progress-value"]') as HTMLElement

    expect(Array.from(root.children).map((child) => child.getAttribute('data-slot'))).toEqual([
      'progress-label',
      'progress-value',
      'progress-track',
    ])
    expect(label?.textContent).toBe('Upload')
    expect(value.textContent).toBe('40%')
    expect(root.style.getPropertyValue('--p-value')).toBe('0.4')
  })

  it('formats the displayed value and aria-valuetext with a valueLabel formatter', () => {
    const screen = render(() => (
      <Progress
        value={3}
        max={10}
        valueLabel={({ percent, value, max }) => `${value} of ${max} completed (${percent}%)`}
      />
    ))

    const progress = screen.getByRole('progressbar')
    expect(progress.getAttribute('aria-valuetext')).toBe('3 of 10 completed (30%)')
    expect(screen.container.querySelector('[data-slot="progress-value"]')?.textContent).toBe(
      '3 of 10 completed (30%)',
    )
  })

  it('updates the value text and formatter output when value changes', () => {
    const [value, setValue] = createSignal(25)
    const screen = render(() => (
      <Progress value={value()} valueLabel={({ percent }) => `Done ${percent}%`} />
    ))

    expect(screen.getByText('Done 25%')).not.toBeNull()
    flush(() => setValue(50))
    expect(screen.getByText('Done 50%')).not.toBeNull()

    const shown = render(() => <Progress value={value()} valueLabel />)
    expect(shown.container.querySelector('[data-slot="progress-value"]')?.textContent).toBe('50%')
    flush(() => setValue(80))
    expect(shown.container.querySelector('[data-slot="progress-value"]')?.textContent).toBe('80%')
  })

  it('clamps value using numeric max', () => {
    const maxClamp = render(() => <Progress value={12} max={4} valueLabel />)
    const maxProgress = maxClamp.getByRole('progressbar')

    expect(maxProgress.getAttribute('aria-valuemax')).toBe('4')
    expect(maxProgress.getAttribute('aria-valuenow')).toBe('4')
    expect(maxClamp.container.querySelector('[data-slot="progress-value"]')?.textContent).toBe(
      '100%',
    )

    const minClamp = render(() => <Progress value={-3} max={10} />)
    const minProgress = minClamp.getByRole('progressbar')

    expect(minProgress.getAttribute('aria-valuenow')).toBe('0')
  })

  it('indeterminate mode hides the value and keeps the label', () => {
    const screen = render(() => <Progress value={undefined} label="Scanning" valueLabel />)
    const progress = screen.getByRole('progressbar')
    const indicator = screen.container.querySelector('[data-slot="progress-indicator"]')

    expect(progress.hasAttribute('aria-valuenow')).toBe(false)
    expect(progress.getAttribute('aria-valuetext')).toBe('indeterminate progress')
    expect(progress.getAttribute('aria-valuemin')).toBe('0')
    expect(progress.getAttribute('aria-valuemax')).toBe('100')
    expect(screen.container.querySelector('[data-slot="progress-label"]')?.textContent).toBe(
      'Scanning',
    )
    expect(screen.container.querySelector('[data-slot="progress-value"]')).toBeNull()
    expect(indicator?.hasAttribute('data-indeterminate')).toBe(true)
  })

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'treats non-finite value %s as indeterminate',
    (value) => {
      const screen = render(() => <Progress value={value} label="Waiting" valueLabel />)
      const progress = screen.getByRole('progressbar')

      expect(progress.hasAttribute('data-indeterminate')).toBe(true)
      expect(progress.hasAttribute('aria-valuenow')).toBe(false)
      expect(progress.getAttribute('aria-valuetext')).toBe('indeterminate progress')
      expect(screen.container.querySelector('[data-slot="progress-value"]')).toBeNull()
      expect(progress.style.getPropertyValue('--p-value')).toBe('')
    },
  )

  it('preserves a zero maximum and reports zero-range completion consistently', () => {
    const screen = render(() => <Progress value={12} max={0} valueLabel />)
    const progress = screen.getByRole('progressbar')

    expect(progress.getAttribute('aria-valuemax')).toBe('0')
    expect(progress.getAttribute('aria-valuenow')).toBe('0')
    expect(progress.getAttribute('aria-valuetext')).toBe('0%')
    expect(progress.getAttribute('data-progress')).toBe('complete')
    expect(screen.container.querySelector('[data-slot="progress-value"]')?.textContent).toBe('0%')
    expect(progress.style.getPropertyValue('--p-value')).toBe('0')
  })

  it('keeps fractional percentages synchronized without integer rounding', () => {
    const screen = render(() => <Progress value={1} max={3} valueLabel />)
    const progress = screen.getByRole('progressbar')
    const value = screen.container.querySelector('[data-slot="progress-value"]') as HTMLElement

    expect(progress.getAttribute('aria-valuetext')).toBe('33.33%')
    expect(value.textContent).toBe('33.33%')
    expect(progress.style.getPropertyValue('--p-value')).toBe('0.3333')
  })

  it('keeps overall progress on root and indicator', () => {
    const [value, setValue] = createSignal<number | undefined>(25)
    const screen = render(() => <Progress value={value()} label="Working" valueLabel />)
    const root = screen.container.querySelector('[data-slot="progress"]')!
    const indicator = screen.container.querySelector('[data-slot="progress-indicator"]')!
    const structuralParts = screen.container.querySelectorAll(
      '[data-slot="progress-label"], [data-slot="progress-value"], [data-slot="progress-track"]',
    )

    expect(root.getAttribute('data-progress')).toBe('loading')
    expect(indicator.getAttribute('data-progress')).toBe('loading')
    for (const part of structuralParts) {
      expect(part.hasAttribute('data-progress')).toBe(false)
      expect(part.hasAttribute('data-indeterminate')).toBe(false)
    }

    flush(() => setValue(100))
    expect(root.getAttribute('data-progress')).toBe('complete')
    expect(indicator.getAttribute('data-progress')).toBe('complete')

    flush(() => setValue(undefined))
    expect(root.getAttribute('data-indeterminate')).toBe('')
    expect(indicator.getAttribute('data-indeterminate')).toBe('')
    expect(root.hasAttribute('data-progress')).toBe(false)
    expect(indicator.hasAttribute('data-progress')).toBe(false)
  })

  it('shows the value slot only while progress is determinate', () => {
    const [value, setValue] = createSignal<number | undefined>(undefined)
    const screen = render(() => <Progress value={value()} valueLabel />)
    const valueSlot = () => screen.container.querySelector('[data-slot="progress-value"]')

    expect(valueSlot()).toBeNull()

    flush(() => setValue(25))
    expect(valueSlot()?.textContent).toBe('25%')

    flush(() => setValue(undefined))
    expect(valueSlot()).toBeNull()

    flush(() => setValue(1))
    expect(valueSlot()?.textContent).toBe('1%')
  })

  it('updates to the latest valueLabel formatter and contains thrown label errors', () => {
    const [formatter, setFormatter] = createSignal<(value: number) => string>(
      () => (value: number) => `${value}`,
    )
    const screen = render(() => (
      <Errored fallback={(error) => <span data-testid="error">{String(error())}</span>}>
        <Progress value={2} max={4} valueLabel={({ value }) => formatter()(value)} />
      </Errored>
    ))
    const progress = screen.getByRole('progressbar')

    expect(progress.getAttribute('aria-valuetext')).toBe('2')
    flush(() => setFormatter(() => (value: number) => `${value} items`))
    expect(progress.getAttribute('aria-valuetext')).toBe('2 items')

    flush(() =>
      setFormatter(() => () => {
        throw new Error('label failure')
      }),
    )
    expect(screen.getByTestId('error').textContent).toContain('label failure')
  })

  it('remains passive and non-tabbable while forwarding caller pointer events', () => {
    const onPointerDown = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => <Progress value={25} onPointerDown={onPointerDown} />)
    const progress = screen.getByRole('progressbar')
    const event = new PointerEvent('pointerdown', { bubbles: true, cancelable: true })

    progress.dispatchEvent(event)

    expect(progress.hasAttribute('tabindex')).toBe(false)
    expect(event.defaultPrevented).toBe(false)
    expect(onPointerDown).toHaveBeenCalledTimes(1)
  })

  it('merges the progress value variable with user root style', () => {
    const screen = render(() => <Progress value={50} style={{ color: 'red' }} />)
    const root = screen.getByRole('progressbar')

    expect(root.style.color).toBe('red')
    expect(root.style.getPropertyValue('--p-value')).toBe('0.5')
  })

  it('merges classes overrides into all slots', () => {
    const screen = render(() => (
      <Progress
        value={60}
        label="Upload"
        valueLabel
        classes={{
          root: 'root-override',
          label: 'label-override',
          value: 'value-override',
          track: 'track-override',
          indicator: 'indicator-override',
        }}
      />
    ))

    expect(screen.container.querySelector('[data-slot="progress"]')?.className).toContain(
      'root-override',
    )
    expect(screen.container.querySelector('[data-slot="progress-label"]')?.className).toContain(
      'label-override',
    )
    expect(screen.container.querySelector('[data-slot="progress-value"]')?.className).toContain(
      'value-override',
    )
    expect(screen.container.querySelector('[data-slot="progress-track"]')?.className).toContain(
      'track-override',
    )
    expect(screen.container.querySelector('[data-slot="progress-indicator"]')?.className).toContain(
      'indicator-override',
    )
  })

  it('merges styles overrides into all slots', () => {
    const screen = render(() => (
      <Progress
        value={60}
        label="Upload"
        valueLabel
        styles={{
          root: { width: '200px' },
          label: { width: '200px' },
          value: { width: '200px' },
          track: { width: '200px' },
          indicator: { width: '200px' },
        }}
      />
    ))

    expect(
      (screen.container.querySelector('[data-slot="progress"]') as HTMLElement).style.width,
    ).toBe('200px')
    expect(
      (screen.container.querySelector('[data-slot="progress-label"]') as HTMLElement).style.width,
    ).toBe('200px')
    expect(
      (screen.container.querySelector('[data-slot="progress-value"]') as HTMLElement).style.width,
    ).toBe('200px')
    expect(
      (screen.container.querySelector('[data-slot="progress-track"]') as HTMLElement).style.width,
    ).toBe('200px')
    expect(
      (screen.container.querySelector('[data-slot="progress-indicator"]') as HTMLElement).style
        .width,
    ).toBe('200px')
  })

  it('hides an empty label', () => {
    const screen = render(() => <Progress value={10} label="" valueLabel />)

    expect(screen.container.querySelector('[data-slot="progress-label"]')).toBeNull()
    expect(screen.container.querySelector('[data-slot="progress-value"]')).not.toBeNull()
  })
})
