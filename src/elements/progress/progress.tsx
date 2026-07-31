import type { JSX } from 'solid-js'
import { For, Show, createMemo, mergeProps, splitProps } from 'solid-js'

import type { ComponentOrElement } from '../../shared/render-prop'
import { renderComponentOrElement } from '../../shared/render-prop'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'

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
  export interface StatusRenderProps {
    /**
     * Current progress percentage (0-100).
     */
    percent?: number
  }

  export interface StepRenderProps {
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

  export interface Slot<T = unknown> {
    /**
     * Progress container that owns track, indicator, labels, and step markers.
     */
    root?: T

    /** Text region that displays the current progress status. */
    status?: T

    /** Background rail that represents the full progress range. */
    track?: T

    /** Filled bar that represents the current progress value. */
    indicator?: T

    /** Wrapper for step labels when progress is driven by named steps. */
    steps?: T

    /** Individual step label or marker rendered along the progress scale. */
    step?: T
  }
  export type Variant = ProgressVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}
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
    getValueLabel?: (params: { value: number; min: number; max: number }) => string

    /**
     * Custom render function for the status label.
     */
    statusRender?: ComponentOrElement<StatusRenderProps>

    /**
     * Custom render function for each step when `max` is an array.
     */
    stepRender?: ComponentOrElement<StepRenderProps>
  }

  export type Props = BaseProps<'div', Base, Variant, Slot>
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
  const merged = mergeProps(
    {
      value: null,
      max: 100,
      status: false,
      orientation: 'horizontal' as const,
      animation: 'carousel' as const,
      size: 'md' as const,
    },
    local,
  )

  const steps = createMemo<string[]>(() => (Array.isArray(merged.max) ? merged.max : []))
  const hasSteps = createMemo(() => steps().length > 0)
  const realMax = createMemo(() => resolveMaxValue(merged.max))
  const isIndeterminate = createMemo(() => merged.value === null || merged.value === undefined)

  const minValue = 0
  const resolvedMax = createMemo(() => (realMax() <= 0 ? 1 : realMax()))
  const resolvedValue = createMemo(() => {
    if (isIndeterminate()) {
      return minValue
    }

    const value = Number(merged.value)
    if (!Number.isFinite(value)) {
      return minValue
    }

    return clamp(value, minValue, resolvedMax())
  })

  const percent = createMemo<number | undefined>(() => {
    if (isIndeterminate()) {
      return undefined
    }

    const range = resolvedMax() - minValue
    if (range <= 0) {
      return 0
    }

    const ratio = (resolvedValue() - minValue) / range
    const bounded = Math.min(Math.max(ratio, 0), 1)
    return Math.round(bounded * 100)
  })

  const dataAttrs = createMemo(() => ({
    'data-indeterminate': isIndeterminate() ? '' : undefined,
  }))

  const valueText = createMemo(() => {
    if (isIndeterminate()) {
      return undefined
    }

    if (merged.getValueLabel) {
      return merged.getValueLabel({ value: resolvedValue(), min: minValue, max: resolvedMax() })
    }

    return `${percent() ?? 0}%`
  })

  const statusStyle = createMemo<JSX.CSSProperties>(() => {
    const currentPercent = Math.max(percent() ?? 0, 0)
    if (merged.orientation === 'vertical') {
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
    if (merged.orientation === 'vertical') {
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
      role="progressbar"
      aria-valuemin={isIndeterminate() ? undefined : minValue}
      aria-valuemax={isIndeterminate() ? undefined : resolvedMax()}
      aria-valuenow={isIndeterminate() ? undefined : resolvedValue()}
      aria-valuetext={valueText()}
      data-slot="root"
      style={{ ...merged.styles?.root, ...merged.style }}
      data-orientation={merged.orientation}
      {...dataAttrs()}
      {...rest}
      class={progressRootVariants(
        {
          orientation: merged.orientation,
        },
        merged.classes?.root,
        merged.class,
      )}
    >
      <Show when={!isIndeterminate() && (merged.status || merged.statusRender !== undefined)}>
        <div
          data-slot="status"
          class={progressStatusVariants(
            {
              orientation: merged.orientation,
              size: merged.size,
            },
            merged.classes?.status,
          )}
          style={{
            ...statusStyle(),
            ...merged.styles?.status,
          }}
        >
          <Show when={merged.statusRender !== undefined} fallback={`${percent() ?? 0}%`}>
            {renderComponentOrElement(merged.statusRender, {
              get percent() {
                return percent()
              },
            })}
          </Show>
        </div>
      </Show>

      <div
        data-slot="track"
        style={merged.styles?.track}
        class={progressBaseVariants(
          {
            orientation: merged.orientation,
            size: merged.size,
          },
          merged.classes?.track,
        )}
        {...dataAttrs()}
      >
        <div
          data-slot="indicator"
          class={progressIndicatorVariants(
            {
              orientation: merged.orientation,
              animation: merged.animation,
            },
            merged.classes?.indicator,
          )}
          style={{
            ...indicatorStyle(),
            ...merged.styles?.indicator,
          }}
          {...dataAttrs()}
        />
      </div>

      <Show when={hasSteps()}>
        <div
          data-slot="steps"
          style={merged.styles?.steps}
          class={progressStepsVariants(
            {
              orientation: merged.orientation,
              size: merged.size,
            },
            merged.classes?.steps,
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
                    size: merged.size,
                  },
                  merged.classes?.step,
                )}
              >
                <Show when={merged.stepRender !== undefined} fallback={step}>
                  {renderComponentOrElement(merged.stepRender, {
                    get step() {
                      return step
                    },
                    get index() {
                      return index()
                    },
                    get state() {
                      return stepState(index())
                    },
                  })}
                </Show>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
