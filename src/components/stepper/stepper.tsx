import type { JSX } from '@solidjs/web'
import { DEV, For, Show, createEffect, createMemo, createSignal, omit } from 'solid-js'

import { useRecipe } from '../../provider/index'
import { useLocale } from '../../provider/locale/locale-context'
import { createControllableValue } from '../../shared/controllable-value'
import { createLazyMemo } from '../../shared/create-lazy-memo'
import { hasContent } from '../../shared/jsx-content'
import { renderWithProps } from '../../shared/render-with-props'
import { createSelectableCollectionNavigation } from '../../shared/selectable-collection-navigation'
import { createId, mergeDefinedProps, toIdSegment } from '../../shared/utils'
import { Icon } from '../icon/index'
import { resolveDirection } from '../shared/overlay/direction'

import { stepperDataAttributes, stepperRecipe } from './stepper.recipe'
import type { StepperProps, StepperT } from './stepper.types'
type StepperState = 'inactive' | 'active' | 'completed'

interface NormalizedStepperItem {
  item: StepperT.Item
  index: number
  value: StepperT.Value
  disabled: boolean
  instanceKey: string
}

/**
 * Step navigation through a fixed sequence, with an indicator, label, and optional panel per step.
 * Use `Tabs` for peer panels that are not a sequence and `Pagination` for a result set with a known
 * page count. Controlled with `value` and `onValueChange`, or uncontrolled with `defaultValue`;
 * `navigation` decides how far users may jump ahead, and `none` leaves moving between steps to your
 * own controls.
 *
 * @example
 * ```tsx
 * import { createSignal, merge, For, omit } from 'solid-js'
 * import { Button, Stepper } from 'moraine'
 *
 * const [step, setStep] = createSignal('account')
 *
 * <>
 *   <Stepper
 *     value={step()}
 *     onValueChange={setStep}
 *     navigation="linear"
 *     items={[
 *       { value: 'account', label: 'Account' },
 *       { value: 'profile', label: 'Profile' },
 *       { value: 'review', label: 'Review' },
 *     ]}
 *   />
 *   <Button onClick={() => setStep('profile')}>Next</Button>
 * </>
 * ```
 */
export function Stepper(props: StepperProps): JSX.Element {
  const rest = omit(
    props,
    'id',
    'value',
    'defaultValue',
    'onValueChange',
    'orientation',
    'activationMode',
    'items',
    'navigation',
    'disabled',
    'loop',
    'size',
    'classes',
    'styles',
    'class',
    'style',
    'aria-label',
    'aria-labelledby',
  )
  const {
    slots: {
      root: rootSlot,
      header: headerSlot,
      wrapper: wrapperSlot,
      label: labelSlot,
      description: descriptionSlot,
      content: contentSlot,
    },
    variants,
    slotWith,
  } = useRecipe(stepperRecipe, props, {
    data: { content: stepperDataAttributes.content({ selected: true }) },
  })
  const direction = useLocale().dir
  const merged = mergeDefinedProps(
    {
      get orientation() {
        return variants.orientation
      },

      navigation: 'none',
      loop: false,
    },
    props,
  )

  const id = createId(() => merged.id, 'stepper')
  const [requestedValue, setRequestedValue] = createControllableValue<StepperT.Value | undefined>({
    value: () => merged.value,
    defaultValue: () => merged.defaultValue,
  })
  const triggerRefs = new Map<string, HTMLButtonElement>()
  const warnedDuplicateValues = new Set<StepperT.Value>()
  let headerRef: HTMLDivElement | undefined

  const normalizedItems = createMemo<Array<NormalizedStepperItem>>(() => {
    const occurrences = new Map<StepperT.Value, number>()
    return (merged.items ?? []).map((item, index) => {
      const value = item.value ?? ''
      const occurrence = occurrences.get(value) ?? 0
      occurrences.set(value, occurrence + 1)
      if (DEV) {
        if (item.value === undefined || item.value === null) {
          console.warn(`[moraine] Stepper item at index ${index} is missing a required "value".`)
        } else if (occurrence > 0 && !warnedDuplicateValues.has(value)) {
          warnedDuplicateValues.add(value)
          console.warn(`[moraine] Stepper received duplicate item value "${value}".`)
        }
      }
      return {
        item,
        index,
        value,
        disabled: item.disabled || occurrence > 0,
        instanceKey: `${toIdSegment(value)}-${occurrence}`,
      }
    })
  })

  const selectedItem = createMemo(() => {
    const items = normalizedItems()
    const value = requestedValue()
    return (
      (value === undefined
        ? undefined
        : items.find((entry) => entry.value === value && !entry.disabled)) ??
      items.find((entry) => !entry.disabled)
    )
  })
  const selectedContent = createMemo(() => selectedItem()?.item.content)

  const currentIndex = createMemo(() => {
    return selectedItem()?.index ?? -1
  })
  const { onNavigationKeyDown } = createSelectableCollectionNavigation<
    NormalizedStepperItem,
    StepperT.Value
  >({
    items: normalizedItems,
    getValue: (entry) => entry.instanceKey,
    isDisabled: isItemDisabled,
    loop: () => merged.loop,
    activationMode: () => merged.activationMode ?? 'automatic',
    getDirection: () => resolveDirection(headerRef, direction()),
    focusValue: (key) => triggerRefs.get(key)?.focus(),
    onSelect: (key) => {
      const entry = normalizedItems().find((item) => item.instanceKey === key)
      if (entry) {
        selectStep(entry.value)
      }
    },
  })

  function getItemState(index: number): StepperState {
    const activeIndex = currentIndex()
    if (activeIndex >= 0 && index < activeIndex) {
      return 'completed'
    }
    if (index === activeIndex) {
      return 'active'
    }

    return 'inactive'
  }

  function isItemDisabled(entry: NormalizedStepperItem): boolean {
    if (merged.disabled || entry.disabled) {
      return true
    }

    const activeIndex = currentIndex()

    if (merged.navigation === 'none') {
      return activeIndex >= 0 && entry.index !== activeIndex
    }

    if (merged.navigation === 'linear') {
      return activeIndex >= 0 && entry.index > activeIndex + 1
    }

    return false
  }

  function selectStep(nextValue: StepperT.Value): void {
    if (merged.disabled || nextValue === selectedItem()?.value) {
      return
    }

    setRequestedValue(nextValue)
    merged.onValueChange?.(nextValue)
  }

  function getTriggerId(key: string): string {
    return `${id()}-${key}-trigger`
  }

  function getContentId(key: string): string {
    return `${id()}-${key}-content`
  }

  const tabIds = createMemo(() =>
    normalizedItems()
      .map((entry) => getTriggerId(entry.instanceKey))
      .join(' '),
  )

  return (
    <div data-slot="stepper" {...rootSlot} {...rest} id={id()}>
      <div
        ref={(element) => {
          headerRef = element
        }}
        role="tablist"
        aria-owns={tabIds()}
        aria-label={props['aria-label']}
        aria-labelledby={props['aria-labelledby']}
        aria-orientation={merged.orientation ?? undefined}
        data-slot="stepper-header"
        {...headerSlot}
      >
        <For each={normalizedItems()}>
          {(entry) => {
            const label = createLazyMemo(() => entry.item.label)
            const description = createLazyMemo(() => entry.item.description)
            const icon = createLazyMemo(() => entry.item.icon)
            const state = createMemo(() => getItemState(entry.index))
            const disabled = createMemo(() => isItemDisabled(entry))
            const triggerId = () => getTriggerId(entry.instanceKey)
            const contentId = () => getContentId(entry.instanceKey)
            const labelId = () => `${contentId()}-step-${entry.index}-label`
            const descriptionId = () => `${contentId()}-step-${entry.index}-description`
            const selected = createMemo(() => selectedItem()?.instanceKey === entry.instanceKey)
            const panelMounted = createMemo(() => selected() && selectedContent() !== undefined)
            const itemSlot = slotWith('item', {
              own: () => ({ class: entry.item.class }),
              data: stepperDataAttributes.item({ state, disabled }),
            })
            const triggerSlot = slotWith('trigger', {
              data: stepperDataAttributes.trigger({
                selected,
                state,
                clickable: () => merged.navigation !== 'none',
              }),
            })
            const indicatorSlot = slotWith('indicator', {
              data: stepperDataAttributes.indicator({ state }),
            })
            const separatorSlot = slotWith('separator', {
              data: stepperDataAttributes.separator({ state, disabled }),
            })
            const [trigger, setTrigger] = createSignal<HTMLButtonElement>()
            createEffect(
              () => [trigger(), entry.instanceKey] as const,
              ([element, key]) => {
                if (!element) {
                  return
                }
                triggerRefs.set(key, element)
                return () => {
                  if (triggerRefs.get(key) === element) {
                    triggerRefs.delete(key)
                  }
                }
              },
            )

            return (
              <div data-slot="stepper-item" {...itemSlot}>
                <button
                  id={triggerId()}
                  ref={setTrigger}
                  type="button"
                  role="tab"
                  tabindex={selected() ? 0 : -1}
                  aria-controls={panelMounted() ? contentId() : undefined}
                  aria-selected={selected() ? 'true' : 'false'}
                  aria-current={selected() ? 'step' : undefined}
                  data-slot="stepper-trigger"
                  {...triggerSlot}
                  disabled={disabled()}
                  aria-labelledby={hasContent(label()) ? labelId() : undefined}
                  aria-describedby={hasContent(description()) ? descriptionId() : undefined}
                  onClick={() => selectStep(entry.value)}
                  onKeyDown={(event) => {
                    onNavigationKeyDown(
                      event,
                      entry.instanceKey,
                      merged.orientation ?? 'horizontal',
                    )
                  }}
                >
                  <span data-slot="stepper-indicator" {...indicatorSlot}>
                    <Show when={icon()} fallback={entry.index + 1}>
                      {(resolvedIcon) => <Icon name={resolvedIcon()} data-slot="stepper-icon" />}
                    </Show>
                  </span>

                  <Show when={hasContent(label()) || hasContent(description())}>
                    <span data-slot="stepper-wrapper" {...wrapperSlot}>
                      <Show when={hasContent(label())}>
                        <span data-slot="stepper-label" id={labelId()} {...labelSlot}>
                          {label()}
                        </span>
                      </Show>

                      <Show when={hasContent(description())}>
                        <span
                          data-slot="stepper-description"
                          id={descriptionId()}
                          {...descriptionSlot}
                        >
                          {description()}
                        </span>
                      </Show>
                    </span>
                  </Show>
                </button>
                <Show when={entry.index < normalizedItems().length - 1}>
                  <div aria-hidden="true" data-slot="stepper-separator" {...separatorSlot} />
                </Show>
              </div>
            )
          }}
        </For>
      </div>

      <For each={normalizedItems()}>
        {(entry) => (
          <Show
            when={
              selectedItem()?.instanceKey === entry.instanceKey && selectedContent() !== undefined
            }
          >
            <div
              id={getContentId(entry.instanceKey)}
              role="tabpanel"
              tabindex={0}
              aria-labelledby={getTriggerId(entry.instanceKey)}
              data-slot="stepper-content"
              {...contentSlot}
            >
              {renderWithProps(selectedContent(), {
                get value() {
                  return entry.value
                },
                get index() {
                  return entry.index
                },
              })}
            </div>
          </Show>
        )}
      </For>
    </div>
  )
}
