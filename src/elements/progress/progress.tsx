import type { JSX } from 'solid-js'
import { For, Show, createMemo, splitProps } from 'solid-js'

import { resolveComponentStyle, useMoraineDesign } from '../../shared/provider/index.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'

import type { ProgressProps, ProgressT } from './progress.types.ts'

export * from './progress.types.ts'

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
  const design = useMoraineDesign()
  const progressDesign = () => design().progress

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

  const orientation = createMemo<NonNullable<ProgressT.Variant['orientation']>>(
    () => local.orientation ?? progressDesign()?.defaultVariants?.orientation ?? 'horizontal',
  )
  const size = createMemo<NonNullable<ProgressT.Variant['size']>>(
    () => local.size ?? progressDesign()?.defaultVariants?.size ?? 'md',
  )
  const animation = createMemo<NonNullable<ProgressT.Variant['animation']>>(
    () => local.animation ?? progressDesign()?.defaultVariants?.animation ?? 'carousel',
  )

  const resolved = resolveComponentStyle({
    design: {
      get classes() {
        return progressDesign()?.recipe({
          orientation: orientation(),
          size: size(),
          animation: animation(),
        })
      },
    },
    get instance() {
      return {
        class: local.class,
        classes: local.classes,
        style: local.style,
        styles: local.styles,
      }
    },
  })

  const rawValue = createMemo(() => local.value ?? null)
  const rawMax = createMemo(() => local.max ?? 100)
  const getValueLabel = createMemo(() => local.getValueLabel)
  const steps = createMemo<string[]>(() => {
    const max = rawMax()
    return Array.isArray(max) ? max : []
  })
  const hasSteps = createMemo(() => steps().length > 0)
  const realMax = createMemo(() => resolveMaxValue(rawMax()))
  const isIndeterminate = createMemo(() => {
    const value = rawValue()
    return value === null || value === undefined || !Number.isFinite(value)
  })

  const minValue = 0
  const resolvedMax = createMemo(() => realMax())
  const resolvedValue = createMemo(() => {
    if (isIndeterminate()) {
      return minValue
    }

    return clamp(rawValue() as number, minValue, resolvedMax())
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
    return bounded * 100
  })

  const dataAttrs = createMemo(() => {
    if (isIndeterminate()) {
      return {
        'data-indeterminate': '',
        'data-progress': undefined,
      }
    }

    return {
      'data-indeterminate': undefined,
      'data-progress': resolvedValue() >= resolvedMax() ? 'complete' : 'loading',
    }
  })

  const valueText = createMemo(() => {
    if (isIndeterminate()) {
      return undefined
    }

    const valueLabel = getValueLabel()
    if (valueLabel) {
      return valueLabel({ value: resolvedValue(), min: minValue, max: resolvedMax() })
    }

    return `${percent() ?? 0}%`
  })

  const statusStyle = createMemo<JSX.CSSProperties>(() => {
    const currentPercent = Math.max(percent() ?? 0, 0)
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
      role="progressbar"
      aria-valuemin={minValue}
      aria-valuemax={resolvedMax()}
      aria-valuenow={isIndeterminate() ? undefined : resolvedValue()}
      aria-valuetext={valueText()}
      data-slot="root"
      data-orientation={orientation()}
      {...dataAttrs()}
      {...rest}
      {...resolved.rootClassAndStyle()}
    >
      <Show when={!isIndeterminate()}>
        {(_determinate) => {
          const statusRender = createMemo(() => local.statusRender)
          const shouldRenderStatus = createMemo(() => local.status || statusRender() !== undefined)

          return (
            <Show when={shouldRenderStatus()}>
              <div
                data-slot="status"
                {...resolved.slotClassAndStyle('status', {
                  get state() {
                    return { style: statusStyle() }
                  },
                })}
                {...dataAttrs()}
              >
                <Show when={statusRender() !== undefined} fallback={`${percent() ?? 0}%`}>
                  {renderComponentOrElement(statusRender(), {
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

      <div data-slot="track" {...resolved.slotClassAndStyle('track')} {...dataAttrs()}>
        <div
          data-slot="indicator"
          {...resolved.slotClassAndStyle('indicator', {
            get state() {
              return { style: indicatorStyle() }
            },
          })}
          {...dataAttrs()}
        />
      </div>

      <Show when={hasSteps()}>
        {(_hasSteps) => {
          const stepRender = createMemo(() => local.stepRender)

          return (
            <div data-slot="steps" {...resolved.slotClassAndStyle('steps')} {...dataAttrs()}>
              <For each={steps()}>
                {(step, index) => (
                  <div
                    data-slot="step"
                    data-state={stepState(index())}
                    {...resolved.slotClassAndStyle('step')}
                    {...dataAttrs()}
                  >
                    <Show when={stepRender() !== undefined} fallback={step}>
                      {renderComponentOrElement(stepRender(), {
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
          )
        }}
      </Show>
    </div>
  )
}
