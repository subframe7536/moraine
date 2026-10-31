import type { JSX } from 'solid-js'
import { DEV, For, Show, createMemo, mergeProps, splitProps } from 'solid-js'

import { useRecipe } from '../../provider/index'
import { useLocale } from '../../provider/locale/locale-context'
import { createControllableValue } from '../../shared/controllable-value'
import { createLazyMemo } from '../../shared/create-lazy-memo'
import { hasContent } from '../../shared/jsx-content'
import { createSelectableCollectionNavigation } from '../../shared/selectable-collection-navigation'
import { createId } from '../../shared/utils'
import { Icon } from '../icon/index'
import { resolveDirection } from '../shared/overlay/utils'

import { stepperDataAttributes, stepperRecipe } from './stepper.recipe'
import type { StepperProps, StepperT } from './stepper.types'

type StepperState = 'inactive' | 'active' | 'completed'

interface NormalizedStepperItem {
  item: StepperT.Item
  index: number
  value: StepperT.Value
  instanceKey: string
}

/**
 * Tab-structured step navigation with configurable orientation and separator layout.
 */
export function Stepper(props: StepperProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'id',
    'value',
    'defaultValue',
    'onValueChange',
    'orientation',
    'activationMode',
    'items',
    'linear',
    'disabled',
    'clickable',
    'loop',
    'size',
    'classes',
    'styles',
    'class',
    'style',
    'aria-label',
    'aria-labelledby',
  ])
  const {
    slots: {
      root: rootSlot,
      header: headerSlot,
      wrapper: wrapperSlot,
      title: titleSlot,
      description: descriptionSlot,
      content: contentSlot,
    },
    variants,
    slotWith,
  } = useRecipe(stepperRecipe, local, {
    data: { content: stepperDataAttributes.content({ selected: true }) },
  })
  const direction = useLocale().dir
  const merged = mergeProps(
    {
      get orientation() {
        return variants.orientation
      },

      linear: true,
      clickable: false,
      loop: false,
    },
    local,
  )

  const id = createId(() => merged.id, 'stepper')
  const [requestedValue, setRequestedValue] = createControllableValue<StepperT.Value | undefined>({
    value: () => merged.value,
    defaultValue: () => merged.defaultValue,
  })
  const triggerRefs = new Map<string, HTMLButtonElement>()
  const warnedDuplicateValues = new Set<StepperT.Value>()
  let headerRef: HTMLDivElement | undefined

  const normalizedItems = createMemo<NormalizedStepperItem[]>(() => {
    const occurrences = new Map<StepperT.Value, number>()
    return (merged.items ?? []).map((item, index) => {
      const value = item.value ?? String(index)
      const occurrence = occurrences.get(value) ?? 0
      occurrences.set(value, occurrence + 1)
      if (DEV && occurrence > 0 && !warnedDuplicateValues.has(value)) {
        warnedDuplicateValues.add(value)
        console.warn(`[moraine] Stepper received duplicate item value "${value}".`)
      }
      const title = createLazyMemo(() => item.title)
      const description = createLazyMemo(() => item.description)
      const icon = createLazyMemo(() => item.icon)
      const content = createLazyMemo(() => item.content)
      const mergedItem = mergeProps(item, {
        get title() {
          return title()
        },
        get description() {
          return description()
        },
        get icon() {
          return icon()
        },
        get content() {
          return content()
        },
      })
      return {
        item: mergedItem,
        index,
        value,
        instanceKey: `${encodeURIComponent(value)}-${occurrence}`,
      }
    })
  })

  const selectedItem = createMemo(() => {
    const items = normalizedItems()
    const value = requestedValue()
    return (
      (value === undefined
        ? undefined
        : items.find((entry) => entry.value === value && !entry.item.disabled)) ??
      items.find((entry) => !entry.item.disabled)
    )
  })

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
    if (merged.disabled || entry.item.disabled) {
      return true
    }

    const activeIndex = currentIndex()

    if (!merged.clickable) {
      if (activeIndex < 0) {
        return false
      }

      return entry.index !== activeIndex
    }

    if (!merged.linear || activeIndex < 0) {
      return false
    }

    return entry.index > activeIndex + 1
  }

  function selectStep(nextValue: StepperT.Value): void {
    if (merged.disabled || nextValue === selectedItem()?.value) {
      return
    }

    setRequestedValue(nextValue)

    if (merged.clickable) {
      merged.onValueChange?.(nextValue)
    }
  }

  function getTriggerId(key: string): string {
    return `${id()}-${key}-trigger`
  }

  function getContentId(key: string): string {
    return `${id()}-${key}-content`
  }

  return (
    <div data-slot="stepper" {...rootSlot} {...rest} id={id()}>
      <div
        ref={(element) => {
          headerRef = element
        }}
        role="tablist"
        aria-label={local['aria-label']}
        aria-labelledby={local['aria-labelledby']}
        aria-orientation={merged.orientation ?? undefined}
        data-slot="stepper-header"
        {...headerSlot}
      >
        <For each={normalizedItems()}>
          {(entry) => {
            const state = createMemo(() => getItemState(entry.index))
            const disabled = createMemo(() => isItemDisabled(entry))
            const triggerId = () => getTriggerId(entry.instanceKey)
            const contentId = () => getContentId(entry.instanceKey)
            const titleId = () => `${contentId()}-step-${entry.index}-title`
            const descriptionId = () => `${contentId()}-step-${entry.index}-description`
            const selected = createMemo(() => selectedItem()?.instanceKey === entry.instanceKey)
            const panelMounted = createMemo(() => selected() && entry.item.content !== undefined)
            const itemSlot = slotWith('item', {
              own: () => ({ class: entry.item.class }),
              data: stepperDataAttributes.item({ state, disabled }),
            })
            const triggerSlot = slotWith('trigger', {
              data: stepperDataAttributes.trigger({
                selected,
                state,
                clickable: () => merged.clickable,
              }),
            })
            const indicatorSlot = slotWith('indicator', {
              data: stepperDataAttributes.indicator({ state }),
            })
            const separatorSlot = slotWith('separator', {
              data: stepperDataAttributes.separator({ state, disabled }),
            })

            return (
              <div data-slot="stepper-item" {...itemSlot}>
                <button
                  id={triggerId()}
                  ref={(element) => {
                    triggerRefs.set(entry.instanceKey, element)
                  }}
                  type="button"
                  role="tab"
                  tabIndex={selected() ? 0 : -1}
                  aria-controls={panelMounted() ? contentId() : undefined}
                  aria-selected={selected()}
                  data-slot="stepper-trigger"
                  {...triggerSlot}
                  disabled={disabled()}
                  aria-labelledby={entry.item.title ? titleId() : undefined}
                  aria-describedby={entry.item.description ? descriptionId() : undefined}
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
                    <Show when={entry.item.icon} fallback={entry.index + 1}>
                      {(icon) => <Icon name={icon()} data-slot="stepper-icon" />}
                    </Show>
                  </span>

                  <Show when={hasContent(entry.item.title) || hasContent(entry.item.description)}>
                    <span data-slot="stepper-wrapper" {...wrapperSlot}>
                      <Show when={hasContent(entry.item.title)}>
                        <span data-slot="stepper-title" id={titleId()} {...titleSlot}>
                          {entry.item.title}
                        </span>
                      </Show>

                      <Show when={hasContent(entry.item.description)}>
                        <span
                          data-slot="stepper-description"
                          id={descriptionId()}
                          {...descriptionSlot}
                        >
                          {entry.item.description}
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
              selectedItem()?.instanceKey === entry.instanceKey && entry.item.content !== undefined
            }
          >
            <div
              id={getContentId(entry.instanceKey)}
              role="tabpanel"
              tabIndex={0}
              aria-labelledby={getTriggerId(entry.instanceKey)}
              data-slot="stepper-content"
              {...contentSlot}
            >
              {entry.item.content}
            </div>
          </Show>
        )}
      </For>
    </div>
  )
}
