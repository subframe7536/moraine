import type { JSX } from '@solidjs/web'
import { Show, createMemo, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { useLocale, useMessages } from '../../provider/locale/locale-context'
import { formatLocaleNumber } from '../../provider/locale/number'
import { hasContent } from '../../shared/jsx-content'

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

/**
 * Progress bar for measurable task completion, or for work whose end is not yet known. Pass a
 * numeric `value` for determinate progress and omit it for indeterminate progress; only use a
 * determinate value when it represents real progress. Use `Skeleton` for a loading placeholder of
 * content structure. Give it an `aria-label` (or a `label` string) when the surrounding context
 * does not name the operation.
 *
 * @example
 * ```tsx
 * import { Progress } from 'moraine'
 *
 * <Progress value={40} max={100} label="Uploading design.fig" valueLabel />
 * ```
 */
export function Progress(props: ProgressProps): JSX.Element {
  const rest = omit(
    props,
    'value',
    'max',
    'label',
    'valueLabel',
    'formatOptions',
    'translations',
    'orientation',
    'animation',
    'size',
    'classes',
    'styles',
    'class',
    'style',
  )
  const messages = useMessages('progress', defaultProgressMessages, () => props.translations)
  const { locale } = useLocale()
  const labelContent = createMemo(() => props.label)
  const hasLabel = () => hasContent(labelContent())
  const isIndeterminate = createMemo(
    () => props.value === undefined || !Number.isFinite(props.value),
  )
  const showValueSlot = () => !isIndeterminate() && Boolean(props.valueLabel)
  const showHeader = () => hasLabel() || showValueSlot()

  const resolvedMax = createMemo(() => resolveMaxValue(props.max))
  const minValue = 0
  const resolvedValue = createMemo(() =>
    isIndeterminate() ? minValue : clamp(props.value as number, minValue, resolvedMax()),
  )
  const percent = createMemo<number | undefined>(() => {
    if (isIndeterminate()) {
      return undefined
    }

    const range = resolvedMax() - minValue
    if (range <= 0) {
      return 0
    }

    return Math.round(((resolvedValue() - minValue) / range) * 10_000) / 100
  })
  const {
    slots: {
      root: rootSlot,
      label: labelSlot,
      value: valueSlot,
      track: trackSlot,
      indicator: indicatorSlot,
    },
  } = useRecipe(progressRecipe, props, {
    data: {
      root: progressDataAttributes.root(() => progressState),
      indicator: progressDataAttributes.indicator(() => progressState),
    },
    own: {
      root: () => {
        const next = percent()
        return next === undefined ? undefined : { style: { '--p-value': next / 100 } }
      },
    },
    enforced: {
      root: () => ({
        class:
          hasLabel() && showValueSlot() ? 'grid-cols-[minmax(0,1fr)_auto] gap-x-2' : 'grid-cols-1',
      }),
      label: () => ({ class: 'col-start-1 row-start-1' }),
      value: () => ({ class: hasLabel() ? 'col-start-2 row-start-1' : 'col-start-1 row-start-1' }),
      track: () => ({
        class: showHeader() ? 'col-span-full row-start-2' : 'col-span-full row-start-1',
      }),
    },
  })

  const progressState = {
    indeterminate: isIndeterminate,
    progress: () =>
      isIndeterminate() ? undefined : resolvedValue() >= resolvedMax() ? 'complete' : 'loading',
  }
  const displayText = createMemo(() => {
    const next = percent() ?? 0
    if (typeof props.valueLabel === 'function') {
      return props.valueLabel({ percent: next, value: resolvedValue(), max: resolvedMax() })
    }
    const options = props.formatOptions
    if (!options) {
      return `${next}%`
    }
    return formatLocaleNumber(resolvedValue(), locale(), options)
  })
  const valueText = createMemo(() => (isIndeterminate() ? messages().indeterminate : displayText()))

  return (
    <div
      role="progressbar"
      data-slot="progress"
      {...rootSlot}
      {...rest}
      aria-valuemin={minValue}
      aria-valuemax={resolvedMax()}
      aria-valuenow={isIndeterminate() ? undefined : resolvedValue()}
      aria-valuetext={valueText()}
      aria-label={
        (rest as { 'aria-label'?: string })['aria-label'] ??
        (typeof labelContent() === 'string' ? (labelContent() as string) : undefined)
      }
    >
      <Show when={hasLabel()}>
        <span data-slot="progress-label" {...labelSlot}>
          {labelContent()}
        </span>
      </Show>

      <Show when={showValueSlot()}>
        <span data-slot="progress-value" {...valueSlot}>
          {displayText()}
        </span>
      </Show>

      <div data-slot="progress-track" {...trackSlot}>
        <div data-slot="progress-indicator" {...indicatorSlot} />
      </div>
    </div>
  )
}
