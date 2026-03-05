import * as KobalteProgress from '@kobalte/core/progress'
import type { JSX } from 'solid-js'
import { For, Show, createMemo, mergeProps, splitProps } from 'solid-js'

import type { SlotClasses } from '../../shared/slot-class'

import type { ProgressVariantProps } from './progress.class'
import {
  progressBaseVariants,
  progressIndicatorVariants,
  progressRootVariants,
  progressStatusVariants,
  progressStepVariants,
  progressStepsVariants,
} from './progress.class'

type ProgressStepState = ProgressStepRenderContext['state']

type ProgressSlots = 'root' | 'status' | 'base' | 'indicator' | 'steps' | 'step'

export type ProgressClasses = SlotClasses<ProgressSlots>

export interface ProgressStatusRenderContext {
  percent?: number
}

export interface ProgressStepRenderContext {
  step: string
  index: number
  state: 'active' | 'first' | 'last' | 'other'
}

export interface ProgressBaseProps extends Pick<
  ProgressVariantProps,
  'animation' | 'color' | 'orientation' | 'size'
> {
  value?: number | null
  max?: number | string[]
  status?: boolean
  getValueLabel?: KobalteProgress.ProgressRootProps['getValueLabel']
  renderStatus?: (context: ProgressStatusRenderContext) => JSX.Element
  renderStep?: (context: ProgressStepRenderContext) => JSX.Element
  classes?: ProgressClasses
}

export type ProgressProps = ProgressBaseProps &
  Omit<
    KobalteProgress.ProgressRootProps,
    | keyof ProgressBaseProps
    | 'as'
    | 'class'
    | 'value'
    | 'minValue'
    | 'maxValue'
    | 'indeterminate'
    | 'children'
  >

function resolveMaxValue(max: ProgressProps['max']): number {
  if (Array.isArray(max)) {
    return Math.max(max.length - 1, 0)
  }

  if (typeof max === 'number' && Number.isFinite(max) && max >= 0) {
    return max
  }

  return 100
}

export function Progress(props: ProgressProps): JSX.Element {
  const merged = mergeProps(
    {
      value: null,
      max: 100,
      status: false,
      orientation: 'horizontal' as const,
      animation: 'carousel' as const,
      color: 'primary' as const,
      size: 'md' as const,
    },
    props,
  )

  const [valueProps, behaviorProps, styleProps, restProps] = splitProps(
    merged as ProgressProps,
    ['value', 'max'],
    ['status', 'orientation', 'animation', 'renderStatus', 'renderStep'],
    ['color', 'size', 'classes'],
  )

  const steps = createMemo<string[]>(() => (Array.isArray(valueProps.max) ? valueProps.max : []))
  const hasSteps = createMemo(() => steps().length > 0)
  const realMax = createMemo(() => resolveMaxValue(valueProps.max))
  const isIndeterminate = createMemo(
    () => valueProps.value === null || valueProps.value === undefined,
  )

  const kobalteMax = createMemo(() => (realMax() <= 0 ? 1 : realMax()))
  const kobalteValue = createMemo(() => {
    if (isIndeterminate()) {
      return 0
    }

    const value = Number(valueProps.value)
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
      const styleValue = `${Math.max(percent() ?? 0, 0)}%`
      if (behaviorProps.orientation === 'vertical') {
        return { height: styleValue }
      }

      return { width: styleValue }
    })

    const indicatorStyle = createMemo<JSX.CSSProperties | undefined>(() => {
      const currentPercent = percent()
      if (currentPercent === undefined) {
        return undefined
      }

      const distance = 100 - currentPercent
      if (behaviorProps.orientation === 'vertical') {
        return {
          transform: `translateY(-${distance}%)`,
        }
      }

      return {
        transform: `translateX(-${distance}%)`,
      }
    })

    function stepState(index: number): ProgressStepState {
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
        <Show when={!isIndeterminate() && (behaviorProps.status || behaviorProps.renderStatus)}>
          <div
            data-slot="status"
            class={progressStatusVariants(
              {
                orientation: behaviorProps.orientation,
                size: styleProps.size,
                color: styleProps.color,
              },
              styleProps.classes?.status,
            )}
            style={statusStyle()}
          >
            <Show when={behaviorProps.renderStatus} fallback={`${percent() ?? 0}%`}>
              {(renderStatus) => renderStatus()({ percent: percent() })}
            </Show>
          </div>
        </Show>

        <KobalteProgress.Track
          data-slot="base"
          class={progressBaseVariants(
            {
              orientation: behaviorProps.orientation,
              size: styleProps.size,
            },
            styleProps.classes?.base,
          )}
        >
          <KobalteProgress.Fill
            data-slot="indicator"
            class={progressIndicatorVariants(
              {
                color: styleProps.color,
                orientation: behaviorProps.orientation,
                animation: behaviorProps.animation,
              },
              styleProps.classes?.indicator,
            )}
            style={indicatorStyle()}
          />
        </KobalteProgress.Track>

        <Show when={hasSteps()}>
          <div
            data-slot="steps"
            class={progressStepsVariants(
              {
                orientation: behaviorProps.orientation,
                size: styleProps.size,
                color: styleProps.color,
              },
              styleProps.classes?.steps,
            )}
          >
            <For each={steps()}>
              {(step, index) => (
                <div
                  data-slot="step"
                  class={progressStepVariants(
                    {
                      state: stepState(index()),
                      size: styleProps.size,
                      color: styleProps.color,
                    },
                    styleProps.classes?.step,
                  )}
                >
                  <Show when={behaviorProps.renderStep} fallback={step}>
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
      data-orientation={behaviorProps.orientation}
      class={progressRootVariants(
        {
          orientation: behaviorProps.orientation,
        },
        styleProps.classes?.root,
      )}
      {...restProps}
    >
      <ProgressContent />
    </KobalteProgress.Root>
  )
}
