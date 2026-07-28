import { render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { Progress } from './progress'
import type { ProgressProps } from './progress'

describe('Progress', () => {
  test('accepts static JSX for statusRender', () => {
    const screen = render(() => (
      <Progress value={40} statusRender={<span data-testid="status">Working</span>} />
    ))

    expect(screen.getByTestId('status').textContent).toBe('Working')
  })

  test('uses css variable classes for base thickness', () => {
    const horizontal = render(() => <Progress value={20} size="xs" />)
    const vertical = render(() => <Progress value={20} size="xl" orientation="vertical" />)

    const horizontalBase = horizontal.container.querySelector('[data-slot="track"]')
    const verticalBase = vertical.container.querySelector('[data-slot="track"]')

    expect(horizontalBase?.className).toContain('h-$p-size')
    expect(horizontalBase?.className).toContain('var-progress-0.5')
    expect(verticalBase?.className).toContain('w-$p-size')
    expect(verticalBase?.className).toContain('var-progress-4')
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
    expect(stepNodes[0]?.className).toContain('opacity-0')
    expect(stepNodes[1]?.className).toContain('opacity-100')
    expect(stepNodes[2]?.className).toContain('opacity-0')
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
    expect(screen.container.querySelector('[data-slot="status"]')).toBeNull()
    expect(indicator?.hasAttribute('data-indeterminate')).toBe(true)
  })

  test('applies orientation and animation classes', () => {
    const screen = render(() => (
      <Progress value={25} status orientation="vertical" animation="swing" />
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
    const horizontal = render(() => <Progress value={null} animation="reverse" />)
    const vertical = render(() => (
      <Progress value={null} orientation="vertical" animation="reverse" />
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

  test('rejects removed props in type contract', () => {
    // @ts-expect-error inverted has been removed from Progress props
    const invertedProps: ProgressProps = { inverted: true }
    // @ts-expect-error color has been removed from Progress props
    const colorProps: ProgressProps = { color: 'secondary' }
    // @ts-expect-error renderStatus has been replaced by statusRender
    const legacyStatusProps: ProgressProps = { renderStatus: () => 'status' }
    // @ts-expect-error renderStep has been replaced by stepRender
    const legacyStepProps: ProgressProps = { renderStep: () => 'step' }
    expect(invertedProps).toBeDefined()
    expect(colorProps).toBeDefined()
    expect(legacyStatusProps).toBeDefined()
    expect(legacyStepProps).toBeDefined()
  })
})
