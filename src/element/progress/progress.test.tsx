import { render } from '@solidjs/testing-library'
import { ErrorBoundary, createComponent, createSignal, onCleanup, onMount } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { MoraineProvider } from '../../provider'

import { Progress } from './progress'
import type { ProgressT } from './progress.types'

describe('Progress', () => {
  test('accepts static JSX for valueRender', () => {
    const screen = render(() => (
      <Progress value={40} valueRender={<span data-testid="value">Working</span>} />
    ))

    expect(screen.getByTestId('value').textContent).toBe('Working')
  })

  test('uses recipe css variables for base thickness', () => {
    const horizontal = render(() => (
      <MoraineProvider>
        <Progress value={20} size="sm" />
      </MoraineProvider>
    ))
    const vertical = render(() => (
      <MoraineProvider>
        <Progress value={20} size="lg" orientation="vertical" />
      </MoraineProvider>
    ))

    const horizontalRoot = horizontal.container.querySelector(
      '[data-slot="progress"]',
    ) as HTMLElement
    const verticalRoot = vertical.container.querySelector('[data-slot="progress"]') as HTMLElement
    const horizontalTrack = horizontal.container.querySelector('[data-slot="progress-track"]')
    const verticalTrack = vertical.container.querySelector('[data-slot="progress-track"]')

    expect(horizontalRoot.style.getPropertyValue('--p-size')).toBe('0.25rem')
    expect(horizontalRoot.className).not.toContain('[--p-size:')
    expect(horizontalTrack?.className).toContain('h-(--p-size)')
    expect(verticalRoot.style.getPropertyValue('--p-size')).toBe('0.75rem')
    expect(verticalTrack?.className).toContain('w-(--p-size)')
    expect(verticalRoot.className).toContain('w-fit')
  })

  test('accepts a style override for thickness', () => {
    const screen = render(() => (
      <MoraineProvider>
        <Progress value={20} size="sm" style={{ '--p-size': '10px' }} />
      </MoraineProvider>
    ))
    const root = screen.container.querySelector('[data-slot="progress"]') as HTMLElement

    expect(root.style.getPropertyValue('--p-size')).toBe('10px')
  })

  test('renders determinate progress with default aria values', () => {
    const screen = render(() => <Progress value={50} />)
    const progress = screen.getByRole('progressbar')

    expect(progress.getAttribute('aria-valuemin')).toBe('0')
    expect(progress.getAttribute('aria-valuemax')).toBe('100')
    expect(progress.getAttribute('aria-valuenow')).toBe('50')
    expect(progress.getAttribute('aria-valuetext')).toBe('50%')
    expect(screen.container.querySelector('[data-slot="progress-label"]')).toBeNull()
    expect(screen.container.querySelector('[data-slot="progress-value"]')).toBeNull()
    expect(screen.container.querySelector('[data-slot="progress-track"]')?.className).toContain(
      'row-start-1',
    )
  })

  test('supports an accessible name', () => {
    const screen = render(() => <Progress aria-label="Loading page" />)

    expect(screen.getByRole('progressbar', { name: 'Loading page' })).not.toBeNull()
  })

  test('places label and value on the header row', () => {
    const screen = render(() => (
      <MoraineProvider>
        <Progress value={40} label="Upload" showValue />
      </MoraineProvider>
    ))
    const root = screen.getByRole('progressbar')
    const label = screen.container.querySelector('[data-slot="progress-label"]')
    const value = screen.container.querySelector('[data-slot="progress-value"]') as HTMLElement
    const track = screen.container.querySelector('[data-slot="progress-track"]')

    expect(Array.from(root.children).map((child) => child.getAttribute('data-slot'))).toEqual([
      'progress-label',
      'progress-value',
      'progress-track',
    ])
    expect(label?.textContent).toBe('Upload')
    expect(label?.className).toContain('col-start-1')
    expect(value.textContent).toBe('40%')
    expect(value.className).toContain('col-start-2')
    expect(root.className).toContain('grid-cols-[minmax(0,1fr)_auto]')
    expect(track?.className).toContain('row-start-2')
    expect(root.style.getPropertyValue('--p-value')).toBe('0.4')
  })

  test('shows valueRender without showValue and keeps a lone value at the start column', () => {
    const screen = render(() => (
      <MoraineProvider>
        <Progress value={25} valueRender={(props) => <>Done {props.percent}%</>} />
      </MoraineProvider>
    ))
    const value = screen.container.querySelector('[data-slot="progress-value"]') as HTMLElement

    expect(screen.getByText('Done 25%')).not.toBeNull()
    expect(value.className).toContain('col-start-1')
    expect(value.className).not.toContain('col-start-2')
    expect(screen.container.querySelector('[data-slot="progress-track"]')?.className).toContain(
      'row-start-2',
    )
  })

  test('supports valueLabel for aria-valuetext', () => {
    const screen = render(() => (
      <Progress
        value={3}
        max={10}
        valueLabel={({ value, max }) => `${value} of ${max} completed`}
      />
    ))

    expect(screen.getByRole('progressbar').getAttribute('aria-valuetext')).toBe('3 of 10 completed')
  })

  test('updates the value text and valueRender content when value changes', () => {
    const [value, setValue] = createSignal(25)
    let mounts = 0
    const renderValue = (props: ProgressT.ValueRenderProps) => {
      onMount(() => {
        mounts += 1
      })
      return <>Done {props.percent}%</>
    }
    const screen = render(() => <Progress value={value()} showValue valueRender={renderValue} />)

    expect(screen.getByText('Done 25%')).not.toBeNull()
    expect(mounts).toBe(1)
    setValue(50)
    expect(screen.getByText('Done 50%')).not.toBeNull()
    expect(mounts).toBe(1)

    const shown = render(() => <Progress value={value()} showValue />)
    expect(shown.container.querySelector('[data-slot="progress-value"]')?.textContent).toBe('50%')
    setValue(80)
    expect(shown.container.querySelector('[data-slot="progress-value"]')?.textContent).toBe('80%')
  })

  test('clamps value using numeric max', () => {
    const maxClamp = render(() => <Progress value={12} max={4} showValue />)
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

  test('indeterminate mode hides the value and keeps the label', () => {
    const screen = render(() => <Progress value={null} label="Scanning" showValue />)
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
    expect(screen.container.querySelector('[data-slot="progress-track"]')?.className).toContain(
      'row-start-2',
    )
    expect(indicator?.hasAttribute('data-indeterminate')).toBe(true)
  })

  test.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'treats non-finite value %s as indeterminate',
    (value) => {
      const screen = render(() => <Progress value={value} label="Waiting" showValue />)
      const progress = screen.getByRole('progressbar')

      expect(progress.hasAttribute('data-indeterminate')).toBe(true)
      expect(progress.hasAttribute('aria-valuenow')).toBe(false)
      expect(progress.getAttribute('aria-valuetext')).toBe('indeterminate progress')
      expect(screen.container.querySelector('[data-slot="progress-value"]')).toBeNull()
      expect(progress.style.getPropertyValue('--p-value')).toBe('')
      expect(
        (screen.container.querySelector('[data-slot="progress-indicator"]') as HTMLElement).style
          .transform,
      ).toBe('')
    },
  )

  test('preserves a zero maximum and reports zero-range completion consistently', () => {
    const screen = render(() => <Progress value={12} max={0} showValue />)
    const progress = screen.getByRole('progressbar')

    expect(progress.getAttribute('aria-valuemax')).toBe('0')
    expect(progress.getAttribute('aria-valuenow')).toBe('0')
    expect(progress.getAttribute('aria-valuetext')).toBe('0%')
    expect(progress.getAttribute('data-progress')).toBe('complete')
    expect(screen.container.querySelector('[data-slot="progress-value"]')?.textContent).toBe('0%')
    expect(progress.style.getPropertyValue('--p-value')).toBe('0')
    expect(
      (screen.container.querySelector('[data-slot="progress-indicator"]') as HTMLElement).style
        .transform,
    ).toBe('')
  })

  test('keeps fractional percentages synchronized without integer rounding', () => {
    const screen = render(() => <Progress value={1} max={3} showValue />)
    const progress = screen.getByRole('progressbar')
    const value = screen.container.querySelector('[data-slot="progress-value"]') as HTMLElement
    const indicator = screen.container.querySelector(
      '[data-slot="progress-indicator"]',
    ) as HTMLElement

    expect(progress.getAttribute('aria-valuetext')).toBe('33.33%')
    expect(value.textContent).toBe('33.33%')
    expect(progress.style.getPropertyValue('--p-value')).toBe('0.3333')
    expect(indicator.style.transform).toBe('')
  })

  test('keeps overall progress on root and indicator', () => {
    const [value, setValue] = createSignal<number | null>(25)
    const screen = render(() => <Progress value={value()} label="Working" showValue />)
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

    setValue(100)
    expect(root.getAttribute('data-progress')).toBe('complete')
    expect(indicator.getAttribute('data-progress')).toBe('complete')

    setValue(null)
    expect(root.getAttribute('data-indeterminate')).toBe('')
    expect(indicator.getAttribute('data-indeterminate')).toBe('')
    expect(root.hasAttribute('data-progress')).toBe(false)
    expect(indicator.hasAttribute('data-progress')).toBe(false)
  })

  test('reads valueRender only while progress is determinate', () => {
    const [value, setValue] = createSignal<number | null>(null)
    let valueReads = 0
    const screen = render(() =>
      createComponent(Progress, {
        get valueRender() {
          valueReads += 1
          return <span data-testid="value-render">Status</span>
        },
        get value() {
          return value()
        },
      }),
    )

    expect(valueReads).toBe(0)
    expect(screen.queryByTestId('value-render')).toBeNull()

    setValue(25)
    expect(valueReads).toBe(1)
    expect(screen.getByTestId('value-render')).not.toBeNull()

    setValue(null)
    setValue(1)
    expect(valueReads).toBe(2)
    expect(screen.getByTestId('value-render')).not.toBeNull()
  })

  test('updates to the latest valueLabel callback and contains thrown label errors', () => {
    const [formatter, setFormatter] = createSignal<(value: number) => string>((value) => `${value}`)
    const screen = render(() => (
      <ErrorBoundary fallback={(error) => <span data-testid="error">{String(error)}</span>}>
        <Progress value={2} max={4} valueLabel={({ value }) => formatter()(value)} />
      </ErrorBoundary>
    ))
    const progress = screen.getByRole('progressbar')

    expect(progress.getAttribute('aria-valuetext')).toBe('2')
    setFormatter(() => (value: number) => `${value} items`)
    expect(progress.getAttribute('aria-valuetext')).toBe('2 items')

    setFormatter(() => () => {
      throw new Error('label failure')
    })
    expect(screen.getByTestId('error').textContent).toContain('label failure')
  })

  test('remains passive and non-tabbable while forwarding caller pointer events', () => {
    const onPointerDown = vi.fn()
    const screen = render(() => <Progress value={25} onPointerDown={onPointerDown} />)
    const progress = screen.getByRole('progressbar')
    const event = new PointerEvent('pointerdown', { bubbles: true, cancelable: true })

    progress.dispatchEvent(event)

    expect(progress.hasAttribute('tabindex')).toBe(false)
    expect(event.defaultPrevented).toBe(false)
    expect(onPointerDown).toHaveBeenCalledTimes(1)
  })

  test('applies orientation and animation classes', () => {
    const screen = render(() => (
      <MoraineProvider>
        <Progress value={25} showValue orientation="vertical" animation="swing" />
      </MoraineProvider>
    ))

    const root = screen.container.querySelector('[data-slot="progress"]') as HTMLElement
    const indicator = screen.container.querySelector(
      '[data-slot="progress-indicator"]',
    ) as HTMLElement

    expect(root.className).toContain('w-fit')
    expect(root.style.getPropertyValue('--p-value')).toBe('0.25')
    expect(indicator.className).toContain('animate-swing-vertical')
    expect(indicator.className).toContain('not-[[data-indeterminate]]:scale-y-[var(--p-value)]')
    expect(indicator.className).toContain('origin-bottom')
    expect(indicator.style.transform).toBe('')
  })

  test('drives horizontal fill with scale from the inline-start edge, including RTL', () => {
    const screen = render(() => (
      <MoraineProvider>
        <div dir="rtl">
          <Progress value={60} showValue />
        </div>
      </MoraineProvider>
    ))

    const root = screen.getByRole('progressbar')
    const indicator = screen.container.querySelector(
      '[data-slot="progress-indicator"]',
    ) as HTMLElement

    expect(root.style.getPropertyValue('--p-value')).toBe('0.6')
    expect(indicator.className).toContain('not-[[data-indeterminate]]:scale-x-[var(--p-value)]')
    expect(indicator.className).toContain('origin-left')
    expect(indicator.className).toContain('rtl:origin-right')
    expect(indicator.style.transform).toBe('')
  })

  test('merges the progress value variable with user root style', () => {
    const screen = render(() => <Progress value={50} style={{ color: 'red' }} />)
    const root = screen.getByRole('progressbar')

    expect(root.style.color).toBe('red')
    expect(root.style.getPropertyValue('--p-value')).toBe('0.5')
  })

  test('uses reverse animation classes without inverse utilities', () => {
    const horizontal = render(() => (
      <MoraineProvider>
        <Progress value={null} animation="reverse" />
      </MoraineProvider>
    ))
    const vertical = render(() => (
      <MoraineProvider>
        <Progress value={null} orientation="vertical" animation="reverse" />
      </MoraineProvider>
    ))

    const horizontalIndicator = horizontal.container.querySelector(
      '[data-slot="progress-indicator"]',
    ) as HTMLElement
    const verticalIndicator = vertical.container.querySelector(
      '[data-slot="progress-indicator"]',
    ) as HTMLElement

    expect(horizontalIndicator.className).toContain('animate-carousel-rtl')
    expect(horizontalIndicator.className).toContain('rtl:animate-carousel')
    expect(horizontalIndicator.className).not.toContain('animate-carousel-inverse')
    expect(verticalIndicator.className).toContain('animate-carousel-vertical')
    expect(verticalIndicator.className).toContain('[animation-direction:reverse]')
    expect(verticalIndicator.className).not.toContain('animate-carousel-inverse-vertical')
  })

  test('merges classes overrides into all slots', () => {
    const screen = render(() => (
      <Progress
        value={60}
        label="Upload"
        showValue
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

  test('merges styles overrides into all slots', () => {
    const screen = render(() => (
      <Progress
        value={60}
        label="Upload"
        showValue
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

  test('hides an empty label', () => {
    const screen = render(() => <Progress value={10} label="" showValue />)

    expect(screen.container.querySelector('[data-slot="progress-label"]')).toBeNull()
    expect(screen.container.querySelector('[data-slot="progress-value"]')).not.toBeNull()
  })

  test('cleans up a valueRender component when progress becomes indeterminate', () => {
    const [value, setValue] = createSignal<number | null>(20)
    let cleanups = 0
    const screen = render(() =>
      createComponent(Progress, {
        get value() {
          return value()
        },
        get valueRender() {
          return (_props: ProgressT.ValueRenderProps) => {
            onCleanup(() => {
              cleanups += 1
            })
            return <span>Shown</span>
          }
        },
      }),
    )

    expect(screen.getByText('Shown')).not.toBeNull()
    setValue(null)
    expect(screen.queryByText('Shown')).toBeNull()
    expect(cleanups).toBe(1)
    screen.unmount()
    expect(cleanups).toBe(1)
  })
})
