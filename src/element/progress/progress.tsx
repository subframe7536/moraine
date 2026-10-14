import type { JSX } from 'solid-js'
import { Show, createMemo, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { useMessages } from '../../provider/locale/locale-context'
import { renderWithProps } from '../../shared/render-with-props'

import { defaultProgressMessages } from './progress.messages'
import { progressDataAttributes, progressRecipe } from './progress.recipe'
import type { ProgressProps } from './progress.types'

function resolveMaxValue(max: number | undefined): number {
  if (typeof max === 'number' && Number.isFinite(max) && max >= 0) {
    return max
  }

  return 100
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function hasContent(content: JSX.Element): boolean {
  return content === 0 || Boolean(content)
}

/** Determinate or indeterminate progress indicator with an optional label and value. */
export function Progress(props: ProgressProps): JSX.Element {
  const [local, style, rest] = splitProps(
    props,
    ['value', 'max', 'label', 'showValue', 'valueLabel', 'valueRender'],
    ['orientation', 'animation', 'size', 'classes', 'styles', 'class', 'style'],
  )
  const messages = useMessages('progress', defaultProgressMessages)
  const labelContent = createMemo(() => local.label)
  const hasLabel = () => hasContent(labelContent())
  const isIndeterminate = createMemo(
    () => local.value === null || local.value === undefined || !Number.isFinite(local.value),
  )
  const valueRender = createMemo(() => (isIndeterminate() ? undefined : local.valueRender))
  const showValueSlot = () => {
    if (isIndeterminate()) {
      return false
    }

    if (local.showValue) {
      return true
    }

    return valueRender() !== undefined
  }
  const showHeader = () => hasLabel() || showValueSlot()

  const resolvedMax = createMemo(() => resolveMaxValue(local.max))
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
  const { slots } = useRecipe(progressRecipe, style, {
    vars: () => {
      const next = percent()
      if (next === undefined) {
        return undefined
      }

      return { '--p-value': next / 100 }
    },
    enforced: () => ({
      root: {
        class:
          hasLabel() && showValueSlot() ? 'grid-cols-[minmax(0,1fr)_auto] gap-x-2' : 'grid-cols-1',
      },
      label: { class: 'col-start-1 row-start-1' },
      value: { class: hasLabel() ? 'col-start-2 row-start-1' : 'col-start-1 row-start-1' },
      track: { class: showHeader() ? 'col-span-full row-start-2' : 'col-span-full row-start-1' },
    }),
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
      return messages().indeterminate
    }

    const formatValue = local.valueLabel
    if (formatValue) {
      return formatValue({ value: resolvedValue(), min: minValue, max: resolvedMax() })
    }

    return `${percent() ?? 0}%`
  })

  return (
    <div
      role="progressbar"
      data-slot="progress"
      {...rootDataAttrs}
      {...rest}
      aria-valuemin={minValue}
      aria-valuemax={resolvedMax()}
      aria-valuenow={isIndeterminate() ? undefined : resolvedValue()}
      aria-valuetext={valueText()}
      {...slots.root}
    >
      <Show when={hasLabel()}>
        <span data-slot="progress-label" {...slots.label}>
          {labelContent()}
        </span>
      </Show>

      <Show when={showValueSlot()}>
        <span data-slot="progress-value" {...slots.value}>
          <Show when={valueRender()} fallback={`${percent() ?? 0}%`}>
            {renderWithProps(valueRender(), {
              get percent() {
                return percent()
              },
            })}
          </Show>
        </span>
      </Show>

      <div data-slot="progress-track" {...slots.track}>
        <div data-slot="progress-indicator" {...indicatorDataAttrs} {...slots.indicator} />
      </div>
    </div>
  )
}
