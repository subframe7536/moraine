import type { JSX } from 'solid-js'
import { Index, Show, createMemo, splitProps } from 'solid-js'

import { createStyles } from '../../provider'
import { renderWithProps } from '../../shared/render-with-props'

import { progressDataAttributes, progressRecipe } from './progress.recipe'
import type { ProgressProps, ProgressT } from './progress.types'

function resolveMaxValue(max: ProgressProps['max']): number {
  if (Array.isArray(max)) {
    return Math.max(max.length - 1, 0)
  }

  if (typeof max === 'number' && Number.isFinite(max) && max >= 0) {
    return max
  }

  return 100
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Determinate or indeterminate progress indicator with optional step labels. */
export function Progress(props: ProgressProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'value',
    'max',
    'status',
    'getValueLabel',
    'statusRender',
    'stepRender',
    'orientation',
    'animation',
    'size',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const resolved = createStyles(progressRecipe, local)

  const orientation = () => resolved.variants.orientation

  const steps = createMemo<string[]>(() => {
    const max = local.max
    return Array.isArray(max) ? max : []
  })
  const hasSteps = createMemo(() => steps().length > 0)
  const resolvedMax = createMemo(() => resolveMaxValue(local.max))
  const isIndeterminate = createMemo(
    () => local.value === null || local.value === undefined || !Number.isFinite(local.value),
  )

  const minValue = 0
  const resolvedValue = createMemo(() =>
    isIndeterminate() ? minValue : clamp(local.value as number, minValue, resolvedMax()),
  )

  const percent = createMemo<number | undefined>(() => {
    if (isIndeterminate()) {
      return undefined
    }

    const range = resolvedMax() - minValue
    if (range <= 0) {
      return 0
    }

    return Math.round(((resolvedValue() - minValue) / range) * 10000) / 100
  })

  const progressState = {
    indeterminate: isIndeterminate,
    progress: () =>
      isIndeterminate() ? undefined : resolvedValue() >= resolvedMax() ? 'complete' : 'loading',
  }
  const rootDataAttrs = progressDataAttributes.root(progressState)
  const indicatorDataAttrs = progressDataAttributes.indicator(progressState)

  const valueText = createMemo(() => {
    if (isIndeterminate()) {
      return undefined
    }

    const valueLabel = local.getValueLabel
    if (valueLabel) {
      return valueLabel({ value: resolvedValue(), min: minValue, max: resolvedMax() })
    }

    return `${percent() ?? 0}%`
  })

  const statusStyle = createMemo<JSX.CSSProperties>(() => {
    const currentPercent = percent() ?? 0
    if (orientation() === 'vertical') {
      return { height: `${100 - currentPercent}%` }
    }

    return { width: `${currentPercent}%` }
  })

  const indicatorStyle = createMemo<JSX.CSSProperties | undefined>(() => {
    const currentPercent = percent()
    if (currentPercent === undefined) {
      return undefined
    }

    const distance = 100 - currentPercent
    if (orientation() === 'vertical') {
      return {
        transform: `translateY(${distance}%)`,
      }
    }

    return {
      transform: `translateX(-${distance}%)`,
    }
  })

  function stepState(index: number): ProgressT.StepRenderProps['state'] {
    const activeIndex = Number.isFinite(resolvedValue()) ? Math.round(resolvedValue()) : 0
    const isActive = !isIndeterminate() && index === activeIndex
    const lastIndex = steps().length - 1

    if (isActive && index === 0) {
      return 'first'
    }

    if (isActive && index === lastIndex) {
      return 'last'
    }

    if (isActive) {
      return 'active'
    }

    return 'other'
  }

  return (
    <div
      {...rest}
      role="progressbar"
      aria-valuemin={minValue}
      aria-valuemax={resolvedMax()}
      aria-valuenow={isIndeterminate() ? undefined : resolvedValue()}
      aria-valuetext={valueText()}
      data-slot="progress"
      {...rootDataAttrs}
      {...resolved.styles.root}
    >
      <Show when={!isIndeterminate()}>
        {(_determinate) => {
          const statusRender = createMemo(() => local.statusRender)
          const shouldRenderStatus = createMemo(() => local.status || statusRender() !== undefined)

          return (
            <Show when={shouldRenderStatus()}>
              <div
                data-slot="progress-status"
                class={resolved.styles.status.class}
                style={{ ...statusStyle(), ...resolved.styles.status.style }}
              >
                <Show when={statusRender() !== undefined} fallback={`${percent() ?? 0}%`}>
                  {renderWithProps(statusRender(), {
                    get percent() {
                      return percent()
                    },
                  })}
                </Show>
              </div>
            </Show>
          )
        }}
      </Show>

      <div data-slot="progress-track" {...resolved.styles.track}>
        <div
          data-slot="progress-indicator"
          class={resolved.styles.indicator.class}
          style={{ ...indicatorStyle(), ...resolved.styles.indicator.style }}
          {...indicatorDataAttrs}
        />
      </div>

      <Show when={hasSteps()}>
        <div data-slot="progress-steps" {...resolved.styles.steps}>
          <Index each={steps()}>
            {(step, index) => (
              <div
                data-slot="progress-step"
                {...progressDataAttributes.step({ state: () => stepState(index) })}
                {...resolved.styles.step}
              >
                <Show when={local.stepRender} fallback={step()} keyed>
                  {(StepRender) => (
                    <StepRender step={step()} index={index} state={stepState(index)} />
                  )}
                </Show>
              </div>
            )}
          </Index>
        </div>
      </Show>
    </div>
  )
}
