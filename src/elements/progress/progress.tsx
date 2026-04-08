import * as KobalteProgress from '@kobalte/core/progress'
import type { JSX } from 'solid-js'
import { For, Show, createMemo, mergeProps, splitProps } from 'solid-js'

import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'

import type { ProgressVariantProps } from './progress.class'
import {
  progressBaseVariants,
  progressIndicatorVariants,
  progressRootVariants,
  progressStatusVariants,
  progressStepVariants,
  progressStepsVariants,
} from './progress.class'

export namespace ProgressT {
  export interface StatusRenderContext {
    /**
     * Current progress percentage (0-100).
     */
    percent?: number
  }

  export interface StepRenderContext {
    /**
     * The label of the current step.
     */
    step: string
    /**
     * The index of the current step.
     */
    index: number
    /**
     * The state of the step relative to the active step.
     */
    state: 'active' | 'first' | 'last' | 'other'
  }

  export type Slot = 'root' | 'status' | 'track' | 'indicator' | 'steps' | 'step'
  export type Variant = ProgressVariantProps
  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>
  export type Extend = KobalteProgress.ProgressRootProps

  export interface Items {}
  /**
   * Base props for the Progress component.
   */
  export interface Base {
    /**
     * The current value of the progress bar. If null/undefined, it is indeterminate.
     * @default null
     */
    value?: number | null

    /**
     * The maximum value of the progress bar, or an array of step labels.
     * @default 100
     */
    max?: number | string[]

    /**
     * Whether to show the status label.
     * @default false
     */
    status?: boolean

    /**
     * Callback to get a localized label for the current value.
     */
    getValueLabel?: KobalteProgress.ProgressRootProps['getValueLabel']

    /**
     * Custom render function for the status label.
     */
    renderStatus?: (context: StatusRenderContext) => JSX.Element

    /**
     * Custom render function for each step when `max` is an array.
     */
    renderStep?: (context: StepRenderContext) => JSX.Element
  }

  export interface Props extends BaseProps<
    Base,
    Variant,
    Extend,
    Slot,
    'indeterminate' | 'minValue' | 'maxValue'
  > {}
}

/**
 * Props for the Progress component.
 */
export interface ProgressProps extends ProgressT.Props {}

function resolveMaxValue(max: ProgressProps['max']): number {
  if (Array.isArray(max)) {
    return Math.max(max.length - 1, 0)
  }

  if (typeof max === 'number' && Number.isFinite(max) && max >= 0) {
    return max
  }

  return 100
}

/** Determinate or indeterminate progress indicator with optional step labels. */
export function Progress(props: ProgressProps): JSX.Element {
  const merged = mergeProps(
    {
      value: null,
      max: 100,
      status: false,
      orientation: 'horizontal' as const,
      animation: 'carousel' as const,
      size: 'md' as const,
    },
    props,
  )

  const [local, rest] = splitProps(merged, [
    'value',
    'max',
    'status',
    'orientation',
    'animation',
    'renderStatus',
    'renderStep',
    'size',
    'classes',
  ])

  const steps = createMemo<string[]>(() => (Array.isArray(local.max) ? local.max : []))
  const hasSteps = createMemo(() => steps().length > 0)
  const realMax = createMemo(() => resolveMaxValue(local.max))
  const isIndeterminate = createMemo(() => local.value === null || local.value === undefined)

  const kobalteMax = createMemo(() => (realMax() <= 0 ? 1 : realMax()))
  const kobalteValue = createMemo(() => {
    if (isIndeterminate()) {
      return 0
    }

    const value = Number(local.value)
    if (!Number.isFinite(value)) {
      return 0
    }

    return value
  })

  function ProgressContent(): JSX.Element {
    const context = KobalteProgress.useProgressContext()
    const percent = createMemo<number | undefined>(() => {
      if (isIndeterminate()) {
        return undefined
      }

      const ratio = context.valuePercent()
      if (!Number.isFinite(ratio)) {
        return 0
      }

      const bounded = Math.min(Math.max(ratio, 0), 1)
      return Math.round(bounded * 100)
    })

    const statusStyle = createMemo<JSX.CSSProperties>(() => {
      const currentPercent = Math.max(percent() ?? 0, 0)
      if (local.orientation === 'vertical') {
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
      if (local.orientation === 'vertical') {
        return {
          transform: `translateY(${distance}%)`,
        }
      }

      return {
        transform: `translateX(-${distance}%)`,
      }
    })

    function stepState(index: number): ProgressT.StepRenderContext['state'] {
      const value = context.value()
      const activeIndex = Number.isFinite(value) ? Math.round(value) : 0
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
      <>
        <Show when={!isIndeterminate() && (local.status || local.renderStatus)}>
          <div
            data-slot="status"
            class={progressStatusVariants(
              {
                orientation: local.orientation,
                size: local.size,
              },
              local.classes?.status,
            )}
            style={{
              ...statusStyle(),
              ...merged.styles?.status,
            }}
          >
            {local.renderStatus ? local.renderStatus({ percent: percent() }) : `${percent() ?? 0}%`}
          </div>
        </Show>

        <KobalteProgress.Track
          data-slot="track"
          style={merged.styles?.track}
          class={progressBaseVariants(
            {
              orientation: local.orientation,
              size: local.size,
            },
            local.classes?.track,
          )}
        >
          <KobalteProgress.Fill
            data-slot="indicator"
            class={progressIndicatorVariants(
              {
                orientation: local.orientation,
                animation: local.animation,
              },
              local.classes?.indicator,
            )}
            style={{
              ...indicatorStyle(),
              ...merged.styles?.indicator,
            }}
          />
        </KobalteProgress.Track>

        <Show when={hasSteps()}>
          <div
            data-slot="steps"
            style={merged.styles?.steps}
            class={progressStepsVariants(
              {
                orientation: local.orientation,
                size: local.size,
              },
              local.classes?.steps,
            )}
          >
            <For each={steps()}>
              {(step, index) => (
                <div
                  data-slot="step"
                  style={merged.styles?.step}
                  class={progressStepVariants(
                    {
                      state: stepState(index()),
                      size: local.size,
                    },
                    local.classes?.step,
                  )}
                >
                  <Show when={local.renderStep} fallback={step}>
                    {(renderStep) =>
                      renderStep()({
                        step,
                        index: index(),
                        state: stepState(index()),
                      })
                    }
                  </Show>
                </div>
              )}
            </For>
          </div>
        </Show>
      </>
    )
  }

  return (
    <KobalteProgress.Root
      minValue={0}
      maxValue={kobalteMax()}
      value={kobalteValue()}
      indeterminate={isIndeterminate()}
      data-slot="root"
      style={merged.styles?.root}
      data-orientation={local.orientation}
      class={progressRootVariants(
        {
          orientation: local.orientation,
        },
        local.classes?.root,
      )}
      {...rest}
    >
      <ProgressContent />
    </KobalteProgress.Root>
  )
}
