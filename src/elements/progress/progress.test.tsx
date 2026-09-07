import { render } from '@solidjs/testing-library'
import { ErrorBoundary, createComponent, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { createDesign } from '../../design.ts'
import { MoraineProvider } from '../../shared/provider/index.ts'

import { Progress } from './progress'
import type { ProgressT } from './progress'

const officialDesign = createDesign()

describe('Progress', () => {
  test('renders unstyled when provider is absent', () => {
    const screen = render(() => <Progress value={50} status />)
    const root = screen.container.querySelector('[data-slot="root"]')
    const track = screen.container.querySelector('[data-slot="track"]')
    const indicator = screen.container.querySelector('[data-slot="indicator"]')

    expect(root?.className).toBe('')
    expect(track?.className).toBe('')
    expect(indicator?.className).toBe('')
  })

  test('accepts static JSX for statusRender', () => {
    const screen = render(() => (
      <Progress value={40} statusRender={<span data-testid="status">Working</span>} />
    ))

    expect(screen.getByTestId('status').textContent).toBe('Working')
  })

  test('uses css variable classes for base thickness', () => {
    const horizontal = render(() => (
      <MoraineProvider design={officialDesign}>
        <Progress value={20} size="sm" />
      </MoraineProvider>
    ))
    const vertical = render(() => (
      <MoraineProvider design={officialDesign}>
        <Progress value={20} size="lg" orientation="vertical" />
      </MoraineProvider>
    ))

    const horizontalRoot = horizontal.container.querySelector('[data-slot="root"]') as HTMLElement
    const verticalRoot = vertical.container.querySelector('[data-slot="root"]') as HTMLElement
    const horizontalBase = horizontal.container.querySelector('[data-slot="track"]')
    const verticalBase = vertical.container.querySelector('[data-slot="track"]')

    expect(horizontalRoot.className).toContain('[--p-size:0.25rem]')
    expect(horizontalBase?.className).toContain('h-[var(--p-size)]')
    expect(verticalRoot.className).toContain('[--p-size:0.75rem]')
    expect(verticalBase?.className).toContain('w-[var(--p-size)]')
  })

  test('renders determinate progress with default aria values', () => {
    const screen = render(() => <Progress value={50} />)
    const progress = screen.getByRole('progressbar')

    expect(progress.getAttribute('aria-valuemin')).toBe('0')
    expect(progress.getAttribute('aria-valuemax')).toBe('100')
    expect(progress.getAttribute('aria-valuenow')).toBe('50')
    expect(progress.getAttribute('aria-valuetext')).toBe('50%')
    expect(screen.container.querySelector('[data-slot="status"]')).toBeNull()
  })

  test('supports an accessible label', () => {
    const screen = render(() => <Progress aria-label="Loading page" />)

    expect(screen.getByRole('progressbar', { name: 'Loading page' })).not.toBeNull()
  })

  test('renders status text and supports statusRender callback', () => {
    const withStatus = render(() => <Progress value={40} status />)
    const status = withStatus.container.querySelector('[data-slot="status"]') as HTMLElement

    expect(status.textContent).toBe('40%')
    expect(status.style.width).toBe('40%')

    const withRenderStatus = render(() => (
      <Progress value={25} statusRender={(props) => <>Done {props.percent}%</>} />
    ))
    expect(withRenderStatus.getByText('Done 25%')).not.toBeNull()
  })

  test('supports custom value labels for aria-valuetext', () => {
    const screen = render(() => (
      <Progress
        value={3}
        max={10}
        getValueLabel={({ value, max }) => `${value} of ${max} completed`}
      />
    ))

    expect(screen.getByRole('progressbar').getAttribute('aria-valuetext')).toBe('3 of 10 completed')
  })

  test('updates statusRender content when value changes', () => {
    const [value, setValue] = createSignal(25)
    const screen = render(() => (
      <Progress value={value()} statusRender={(props) => <>Done {props.percent}%</>} />
    ))

    expect(screen.getByText('Done 25%')).not.toBeNull()
    setValue(50)
    expect(screen.getByText('Done 50%')).not.toBeNull()
  })

  test('clamps value using numeric max', () => {
    const maxClamp = render(() => <Progress value={12} max={4} status />)
    const maxProgress = maxClamp.getByRole('progressbar')

    expect(maxProgress.getAttribute('aria-valuemax')).toBe('4')
    expect(maxProgress.getAttribute('aria-valuenow')).toBe('4')
    expect(maxClamp.container.querySelector('[data-slot="status"]')?.textContent).toBe('100%')

    const minClamp = render(() => <Progress value={-3} max={10} />)
    const minProgress = minClamp.getByRole('progressbar')

    expect(minProgress.getAttribute('aria-valuenow')).toBe('0')
  })

  test('renders steps when max is string[] and marks active step', () => {
    const steps = ['Waiting...', 'Cloning...', 'Done!']
    const screen = render(() => <Progress value={1} max={steps} />)

    const stepNodes = screen.container.querySelectorAll('[data-slot="step"]')
    expect(stepNodes.length).toBe(steps.length)
    expect(stepNodes[0]?.getAttribute('data-state')).toBe('other')
    expect(stepNodes[1]?.getAttribute('data-state')).toBe('active')
    expect(stepNodes[2]?.getAttribute('data-state')).toBe('other')
  })

  test('supports stepRender callback with state metadata', () => {
    const steps = ['Waiting...', 'Cloning...', 'Done!']
    const screen = render(() => (
      <Progress
        value={2}
        max={steps}
        stepRender={(props) => (
          <>
            {props.index}-{props.step}-{props.state}
          </>
        )}
      />
    ))

    expect(screen.getByText('2-Done!-last')).not.toBeNull()
  })

  test('indeterminate mode hides aria value fields and status', () => {
    const screen = render(() => <Progress value={null} status />)
    const progress = screen.getByRole('progressbar')
    const indicator = screen.container.querySelector('[data-slot="indicator"]')

    expect(progress.hasAttribute('aria-valuenow')).toBe(false)
    expect(progress.hasAttribute('aria-valuetext')).toBe(false)
    expect(progress.getAttribute('aria-valuemin')).toBe('0')
    expect(progress.getAttribute('aria-valuemax')).toBe('100')
    expect(screen.container.querySelector('[data-slot="status"]')).toBeNull()
    expect(indicator?.hasAttribute('data-indeterminate')).toBe(true)
  })

  test.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'treats non-finite value %s as indeterminate',
    (value) => {
      const screen = render(() => <Progress value={value} status />)
      const progress = screen.getByRole('progressbar')

      expect(progress.hasAttribute('data-indeterminate')).toBe(true)
      expect(progress.hasAttribute('aria-valuenow')).toBe(false)
      expect(progress.hasAttribute('aria-valuetext')).toBe(false)
      expect(screen.container.querySelector('[data-slot="status"]')).toBeNull()
      expect(
        (screen.container.querySelector('[data-slot="indicator"]') as HTMLElement).style.transform,
      ).toBe('')
    },
  )

  test('preserves a zero maximum and reports zero-range completion consistently', () => {
    const screen = render(() => <Progress value={12} max={0} status />)
    const progress = screen.getByRole('progressbar')

    expect(progress.getAttribute('aria-valuemax')).toBe('0')
    expect(progress.getAttribute('aria-valuenow')).toBe('0')
    expect(progress.getAttribute('aria-valuetext')).toBe('0%')
    expect(progress.getAttribute('data-progress')).toBe('complete')
    expect(screen.container.querySelector('[data-slot="status"]')?.textContent).toBe('0%')
    expect(
      (screen.container.querySelector('[data-slot="indicator"]') as HTMLElement).style.transform,
    ).toBe('translateX(-100%)')
  })

  test('keeps fractional percentages synchronized without integer rounding', () => {
    const screen = render(() => <Progress value={1} max={3} status />)
    const progress = screen.getByRole('progressbar')
    const status = screen.container.querySelector('[data-slot="status"]') as HTMLElement
    const indicator = screen.container.querySelector('[data-slot="indicator"]') as HTMLElement

    expect(progress.getAttribute('aria-valuetext')).toBe('33.33333333333333%')
    expect(status.textContent).toBe('33.33333333333333%')
    expect(status.style.width).toBe('33.33333333333333%')
    expect(indicator.style.transform).toBe('translateX(-66.66666666666667%)')
  })

  test('synchronizes loading, complete, and indeterminate data across rendered parts', () => {
    const [value, setValue] = createSignal<number | null>(25)
    const screen = render(() => (
      <Progress value={value()} status max={['Waiting', 'Working', 'Done']} />
    ))
    const allParts = () =>
      screen.container.querySelectorAll(
        '[data-slot="root"], [data-slot="status"], [data-slot="track"], [data-slot="indicator"], [data-slot="steps"], [data-slot="step"]',
      )

    for (const part of allParts()) {
      expect(part.getAttribute('data-progress')).toBe('complete')
      expect(part.hasAttribute('data-indeterminate')).toBe(false)
    }

    setValue(1)
    for (const part of allParts()) {
      expect(part.getAttribute('data-progress')).toBe('loading')
    }

    setValue(null)
    for (const part of allParts()) {
      expect(part.hasAttribute('data-indeterminate')).toBe(true)
      expect(part.hasAttribute('data-progress')).toBe(false)
    }
  })

  test('single-evaluates reactive normalization and renderer props', () => {
    const reads = { max: 0, statusRender: 0, stepRender: 0, value: 0 }
    const screen = render(() =>
      createComponent(Progress, {
        get max() {
          reads.max += 1
          return ['One', 'Two', 'Three']
        },
        get statusRender() {
          reads.statusRender += 1
          return (context: ProgressT.StatusRenderProps) => <span>Status {context.percent}</span>
        },
        get stepRender() {
          reads.stepRender += 1
          return (context: ProgressT.StepRenderProps) => <span>{context.step}</span>
        },
        get value() {
          reads.value += 1
          return 1
        },
      }),
    )

    expect(screen.getByRole('progressbar')).not.toBeNull()
    expect(reads).toEqual({ max: 1, statusRender: 1, stepRender: 1, value: 1 })
  })

  test.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, -1])(
    'falls back to max=100 for invalid maximum %s',
    (max) => {
      const screen = render(() => <Progress value={50} max={max} />)
      const progress = screen.getByRole('progressbar')

      expect(progress.getAttribute('aria-valuemax')).toBe('100')
      expect(progress.getAttribute('aria-valuenow')).toBe('50')
      expect(progress.getAttribute('aria-valuetext')).toBe('50%')
    },
  )

  test('handles empty and single-step ranges without inventing a maximum', () => {
    const empty = render(() => <Progress value={0} max={[]} />)
    const single = render(() => (
      <Progress
        value={0}
        max={['Only']}
        stepRender={(context) => `${context.index}-${context.step}-${context.state}`}
      />
    ))

    expect(empty.getByRole('progressbar').getAttribute('aria-valuemax')).toBe('0')
    expect(empty.container.querySelector('[data-slot="steps"]')).toBeNull()
    expect(single.getByRole('progressbar').getAttribute('aria-valuemax')).toBe('0')
    expect(single.getByText('0-Only-first')).not.toBeNull()
  })

  test('keeps duplicate step nodes stable while value and state update', () => {
    const steps = ['Same', 'Same', 'Done']
    const [value, setValue] = createSignal(0)
    const screen = render(() => <Progress value={value()} max={steps} />)
    const initial = Array.from(screen.container.querySelectorAll('[data-slot="step"]'))

    setValue(1)
    const updated = Array.from(screen.container.querySelectorAll('[data-slot="step"]'))

    expect(updated).toHaveLength(3)
    expect(updated[0]).toBe(initial[0])
    expect(updated[1]).toBe(initial[1])
    expect(updated[2]).toBe(initial[2])
    expect(updated[1]?.getAttribute('data-state')).toBe('active')
  })

  test('reads conditional renderers only while their branches are mounted', () => {
    const [value, setValue] = createSignal<number | null>(null)
    const [max, setMax] = createSignal<number | string[]>(100)
    let statusReads = 0
    let stepReads = 0
    const screen = render(() =>
      createComponent(Progress, {
        get max() {
          return max()
        },
        get statusRender() {
          statusReads += 1
          return <span data-testid="status-render">Status</span>
        },
        get stepRender() {
          stepReads += 1
          return (context: ProgressT.StepRenderProps) => (
            <span data-testid="step-render">{context.step}</span>
          )
        },
        get value() {
          return value()
        },
      }),
    )

    expect(statusReads).toBe(0)
    expect(stepReads).toBe(0)

    setValue(25)
    expect(statusReads).toBe(1)
    expect(screen.getByTestId('status-render')).not.toBeNull()
    expect(stepReads).toBe(0)

    setMax(['A', 'B'])
    expect(stepReads).toBe(1)
    expect(screen.getAllByTestId('step-render')).toHaveLength(2)

    setValue(null)
    setValue(1)
    expect(statusReads).toBe(2)
  })

  test('updates to the latest value-label callback and contains thrown label errors', () => {
    const [formatter, setFormatter] = createSignal<(value: number) => string>((value) => `${value}`)
    const screen = render(() => (
      <ErrorBoundary fallback={(error) => <span data-testid="error">{String(error)}</span>}>
        <Progress value={2} max={4} getValueLabel={({ value }) => formatter()(value)} />
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
      <MoraineProvider design={officialDesign}>
        <Progress value={25} status orientation="vertical" animation="swing" />
      </MoraineProvider>
    ))

    const root = screen.container.querySelector('[data-slot="root"]')
    const status = screen.container.querySelector('[data-slot="status"]') as HTMLElement
    const indicator = screen.container.querySelector('[data-slot="indicator"]') as HTMLElement

    expect(root?.className).toContain('flex-row-reverse')
    expect(status.style.height).toBe('75%')
    expect(indicator.className).toContain('animate-swing-vertical')
    expect(indicator.style.transform).toBe('translateY(75%)')
  })

  test('uses reverse animation classes without inverse utilities', () => {
    const horizontal = render(() => (
      <MoraineProvider design={officialDesign}>
        <Progress value={null} animation="reverse" />
      </MoraineProvider>
    ))
    const vertical = render(() => (
      <MoraineProvider design={officialDesign}>
        <Progress value={null} orientation="vertical" animation="reverse" />
      </MoraineProvider>
    ))

    const horizontalIndicator = horizontal.container.querySelector(
      '[data-slot="indicator"]',
    ) as HTMLElement
    const verticalIndicator = vertical.container.querySelector(
      '[data-slot="indicator"]',
    ) as HTMLElement

    expect(horizontalIndicator.className).toContain('animate-carousel-rtl')
    expect(horizontalIndicator.className).toContain('rtl:animate-carousel')
    expect(horizontalIndicator.className).not.toContain('animate-carousel-inverse')
    expect(verticalIndicator.className).toContain('animate-carousel-vertical')
    expect(verticalIndicator.className).toContain('animate-direction-reverse')
    expect(verticalIndicator.className).not.toContain('animate-carousel-inverse-vertical')
  })

  test('merges classes overrides into all slots', () => {
    const screen = render(() => (
      <Progress
        value={60}
        status
        max={['A', 'B', 'C']}
        classes={{
          root: 'root-override',
          status: 'status-override',
          track: 'track-override',
          indicator: 'indicator-override',
          steps: 'steps-override',
          step: 'step-override',
        }}
      />
    ))

    const root = screen.container.querySelector('[data-slot="root"]')
    const status = screen.container.querySelector('[data-slot="status"]')
    const base = screen.container.querySelector('[data-slot="track"]')
    const indicator = screen.container.querySelector('[data-slot="indicator"]')
    const steps = screen.container.querySelector('[data-slot="steps"]')
    const step = screen.container.querySelector('[data-slot="step"]')

    expect(root?.className).toContain('root-override')
    expect(status?.className).toContain('status-override')
    expect(base?.className).toContain('track-override')
    expect(indicator?.className).toContain('indicator-override')
    expect(steps?.className).toContain('steps-override')
    expect(step?.className).toContain('step-override')
  })

  test('merges styles overrides into all slots', () => {
    const screen = render(() => (
      <Progress
        value={60}
        status
        max={['A', 'B', 'C']}
        styles={{
          root: { width: '200px' },
          status: { width: '200px' },
          track: { width: '200px' },
          indicator: { width: '200px' },
          steps: { width: '200px' },
          step: { width: '200px' },
        }}
      />
    ))

    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement | null
    const status = screen.container.querySelector('[data-slot="status"]') as HTMLElement | null
    const base = screen.container.querySelector('[data-slot="track"]') as HTMLElement | null
    const indicator = screen.container.querySelector(
      '[data-slot="indicator"]',
    ) as HTMLElement | null
    const steps = screen.container.querySelector('[data-slot="steps"]') as HTMLElement | null
    const step = screen.container.querySelector('[data-slot="step"]') as HTMLElement | null

    expect(root?.style.width).toBe('200px')
    expect(status?.style.width).toBe('200px')
    expect(base?.style.width).toBe('200px')
    expect(indicator?.style.width).toBe('200px')
    expect(steps?.style.width).toBe('200px')
    expect(step?.style.width).toBe('200px')
  })
})
