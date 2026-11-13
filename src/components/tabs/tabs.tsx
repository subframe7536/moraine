import type { JSX } from 'solid-js'
import {
  DEV,
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  on,
  onCleanup,
  splitProps,
} from 'solid-js'

import { useRecipe } from '../../provider'
import { useLocale } from '../../provider/locale/locale-context'
import { createControllableValue } from '../../shared/controllable-value'
import { createLazyMemo } from '../../shared/create-lazy-memo'
import { renderWithProps } from '../../shared/render-with-props'
import { createSelectableCollectionNavigation } from '../../shared/selectable-collection-navigation'
import { createId } from '../../shared/utils'
import { Icon } from '../icon'
import { resolveDirection } from '../shared/overlay/direction'

import { tabsDataAttributes, tabsRecipe } from './tabs.recipe'
import type { TabsProps, TabsT } from './tabs.types'

interface NormalizedTabItem extends TabsT.Item {
  instanceKey: string
  rawItem: TabsT.Item
}

function sanitizeIdSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, (char) => `_${char.codePointAt(0)!.toString(16)}_`)
}

/**
 * Tabbed navigation component with configurable orientation and variant styles.
 */
export function Tabs(props: TabsProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'id',
    'value',
    'defaultValue',
    'orientation',
    'activationMode',
    'disabled',
    'loop',
    'onValueChange',
    'items',
    'variant',
    'size',
    'classes',
    'styles',
    'class',
    'style',
    'aria-label',
    'aria-labelledby',
  ])
  let indicatorStyle!: () => JSX.CSSProperties
  const {
    slots: {
      root: rootSlot,
      list: listSlot,
      indicator: indicatorSlot,
      leading: leadingSlot,
      label: labelSlot,
      content: contentSlot,
    },
    slotWith,
    variants,
  } = useRecipe(tabsRecipe, local, {
    data: {
      root: tabsDataAttributes.root(() => ({
        disabled: (): boolean | undefined => merged.disabled,
      })),
      content: tabsDataAttributes.content({ selected: true }),
    },
    enforced: { indicator: () => ({ style: indicatorStyle() }) },
  })
  const direction = useLocale().dir
  const merged = mergeProps(
    {
      get orientation() {
        return variants.orientation
      },
    },
    local,
  )

  const rootId = createId(() => merged.id, 'tabs')
  const [requestedValue, setRequestedValue] = createControllableValue<string | undefined>({
    value: () => merged.value,
    defaultValue: () => merged.defaultValue,
  })
  let previousCache = new Map<string, NormalizedTabItem>()
  const warnedDuplicateValues = new Set<string>()

  const normalizedItems = createMemo<NormalizedTabItem[]>(() => {
    const nextCache = new Map<string, NormalizedTabItem>()
    const occurrences = new Map<string, number>()

    const result = (merged.items ?? []).map((item, index) => {
      const value = item.value ?? ''
      if (DEV) {
        if (item.value === undefined || item.value === null) {
          console.warn(`[moraine] Tabs item at index ${index} is missing a required "value".`)
        } else if (occurrences.has(value) && !warnedDuplicateValues.has(value)) {
          warnedDuplicateValues.add(value)
          console.warn(`[moraine] Tabs received duplicate item value "${value}".`)
        }
      }
      const occurrence = occurrences.get(value) ?? 0
      occurrences.set(value, occurrence + 1)
      const instanceKey = `${sanitizeIdSegment(value)}-${occurrence}`
      const disabled = item.disabled || occurrence > 0

      const cached = previousCache.get(instanceKey)
      if (
        cached &&
        cached.rawItem === item &&
        cached.disabled === disabled &&
        cached.label === item.label &&
        cached.icon === item.icon
      ) {
        nextCache.set(instanceKey, cached)
        return cached
      }

      const content = createLazyMemo(() => item.content)

      const normalized: NormalizedTabItem = {
        rawItem: item,
        value,
        instanceKey,
        label: item.label,
        icon: item.icon,
        disabled,
        get content() {
          return content()
        },
      }
      nextCache.set(instanceKey, normalized)
      return normalized
    })
    previousCache = nextCache
    return result
  })
  const firstEnabledItem = createMemo(() => normalizedItems().find((item) => !item.disabled))
  const selectedItem = createMemo(() => {
    const candidate = requestedValue()

    if (candidate !== undefined) {
      const requestedItem = normalizedItems().find(
        (item) => item.value === candidate && !item.disabled,
      )

      if (requestedItem) {
        return requestedItem
      }
    }

    return firstEnabledItem()
  })
  const selectedValue = createMemo(() => selectedItem()?.value)
  const selectedKey = createMemo(() => selectedItem()?.instanceKey)
  const triggerRefs = new Map<string, HTMLButtonElement>()
  const [highlightedKey, setHighlightedKey] = createSignal<string | undefined>()
  const [focusRecoveryRequested, setFocusRecoveryRequested] = createSignal(false)
  let disposed = false
  let focusRecoveryGeneration = 0

  onCleanup(() => {
    disposed = true
  })
  const effectiveHighlighted = createMemo<string | undefined>(() => {
    const focused = highlightedKey()

    if (
      focused !== undefined &&
      normalizedItems().some((item) => item.instanceKey === focused && !item.disabled)
    ) {
      return focused
    }

    return selectedKey()
  })
  const [indicatorStyleSignal, setIndicatorStyle] = createSignal<JSX.CSSProperties>({
    transform: undefined,
    width: undefined,
    height: undefined,
  })
  indicatorStyle = indicatorStyleSignal
  let listRef: HTMLDivElement | undefined
  const { onNavigationKeyDown } = createSelectableCollectionNavigation<NormalizedTabItem, string>({
    items: normalizedItems,
    getValue: (item) => item.instanceKey,
    isDisabled: (item) => Boolean(merged.disabled || item.disabled),
    loop: () => merged.loop ?? true,
    activationMode: () => merged.activationMode ?? 'automatic',
    getDirection: () => resolveDirection(listRef, direction()),
    focusValue: (key) => {
      setHighlightedKey(key)
      triggerRefs.get(key)?.focus()
    },
    onSelect: (key) => {
      const item = normalizedItems().find((candidate) => candidate.instanceKey === key)

      if (item) {
        selectValue(item.value)
      }
    },
  })

  function getTriggerId(key: string): string {
    return `${rootId()}-${key}-trigger`
  }

  function getContentId(key: string): string {
    return `${rootId()}-${key}-content`
  }

  function selectValue(nextValue: string): void {
    if (merged.disabled || nextValue === selectedValue()) {
      return
    }

    setRequestedValue(nextValue)

    merged.onValueChange?.(nextValue)
  }

  function computeIndicatorStyle(
    currentKey: ReturnType<typeof selectedKey>,
    orientation: typeof merged.orientation,
  ): void {
    if (currentKey === undefined) {
      setIndicatorStyle({
        transform: undefined,
        width: undefined,
        height: undefined,
      })
      return
    }

    const selectedTrigger = triggerRefs.get(currentKey)

    if (!selectedTrigger) {
      return
    }

    const nextStyle: JSX.CSSProperties = {
      transform: undefined,
      width: undefined,
      height: undefined,
    }

    if (orientation === 'vertical') {
      nextStyle.transform = `translateY(${selectedTrigger.offsetTop}px)`
      nextStyle.height = `${selectedTrigger.offsetHeight}px`
    } else {
      const direction = listRef ? getComputedStyle(listRef).direction : 'ltr'
      const offset =
        direction === 'rtl'
          ? -1 *
            (((selectedTrigger.offsetParent as HTMLElement | null)?.offsetWidth ?? 0) -
              selectedTrigger.offsetWidth -
              selectedTrigger.offsetLeft)
          : selectedTrigger.offsetLeft

      nextStyle.transform = `translateX(${offset}px)`
      nextStyle.width = `${selectedTrigger.offsetWidth}px`
    }

    setIndicatorStyle(nextStyle)
  }

  createEffect(
    on([normalizedItems, selectedKey, () => merged.orientation], ([, key, orientation]) => {
      computeIndicatorStyle(key, orientation)
    }),
  )

  createEffect(
    on([focusRecoveryRequested, effectiveHighlighted], ([recovery, recoveryKey]) => {
      if (!recovery) {
        return
      }
      const generation = ++focusRecoveryGeneration

      queueMicrotask(() => {
        if (!disposed && generation === focusRecoveryGeneration) {
          const trigger = recoveryKey === undefined ? undefined : triggerRefs.get(recoveryKey)
          const ownerDocument = trigger?.ownerDocument ?? listRef?.ownerDocument
          if (ownerDocument !== undefined && ownerDocument.activeElement === ownerDocument.body) {
            trigger?.focus()
          }
          setFocusRecoveryRequested(false)
        }
      })
    }),
  )

  createEffect(
    on([normalizedItems, selectedKey], ([items, currentKey]) => {
      const selectedTrigger = currentKey === undefined ? undefined : triggerRefs.get(currentKey)

      if (
        typeof ResizeObserver === 'undefined' ||
        !selectedTrigger ||
        !items.some((item) => item.instanceKey === currentKey)
      ) {
        return
      }

      const resizeObserver = new ResizeObserver(() => {
        computeIndicatorStyle(selectedKey(), merged.orientation)
      })

      // Overlays may insert these nodes after the effect runs, so observe detached triggers too.
      resizeObserver.observe(selectedTrigger)

      if (listRef) {
        resizeObserver.observe(listRef)
      }

      onCleanup(() => {
        resizeObserver.disconnect()
      })
    }),
  )

  return (
    <div data-slot="tabs" {...rootSlot} {...rest} id={rootId()}>
      <div
        ref={(e) => (listRef = e)}
        role="tablist"
        aria-label={local['aria-label']}
        aria-labelledby={local['aria-labelledby']}
        aria-orientation={merged.orientation ?? undefined}
        data-slot="tabs-list"
        {...listSlot}
      >
        <div aria-hidden="true" data-slot="tabs-indicator" {...indicatorSlot} />

        <For each={normalizedItems()}>
          {(item) => {
            const selected = createMemo(() => selectedKey() === item.instanceKey)
            const highlighted = createMemo(() => effectiveHighlighted() === item.instanceKey)
            const triggerSlot = slotWith('trigger', {
              data: tabsDataAttributes.trigger({
                selected,
                highlighted,
                disabled: () => Boolean(merged.disabled || item.disabled),
              }),
            })
            let trigger: HTMLButtonElement | undefined

            onCleanup(() => {
              const wasFocused =
                trigger !== undefined && trigger.ownerDocument.activeElement === trigger

              if (triggerRefs.get(item.instanceKey) === trigger) {
                triggerRefs.delete(item.instanceKey)
              }

              if (wasFocused) {
                setFocusRecoveryRequested(true)
              }
            })

            return (
              <button
                id={getTriggerId(item.instanceKey)}
                ref={(element) => {
                  trigger = element
                  triggerRefs.set(item.instanceKey, element)
                }}
                type="button"
                role="tab"
                tabIndex={highlighted() ? 0 : -1}
                aria-controls={selected() ? getContentId(item.instanceKey) : undefined}
                aria-selected={selected()}
                disabled={Boolean(merged.disabled || item.disabled)}
                data-slot="tabs-trigger"
                {...triggerSlot}
                onClick={() => {
                  setHighlightedKey(item.instanceKey)
                  selectValue(item.value)
                }}
                onFocus={() => setHighlightedKey(item.instanceKey)}
                onKeyDown={(event) => {
                  onNavigationKeyDown(event, item.instanceKey, merged.orientation ?? 'horizontal')
                }}
              >
                <Show when={item.icon}>
                  <span data-slot="tabs-leading" {...leadingSlot}>
                    <Icon name={item.icon} />
                  </span>
                </Show>

                <Show when={typeof item.label === 'string'} fallback={item.label}>
                  <span data-slot="tabs-label" {...labelSlot}>
                    {item.label}
                  </span>
                </Show>
              </button>
            )
          }}
        </For>
      </div>

      <For each={normalizedItems()}>
        {(item) => {
          const selected = createMemo(() => selectedKey() === item.instanceKey)

          return (
            <Show when={selected()}>
              <div
                id={getContentId(item.instanceKey)}
                role="tabpanel"
                tabIndex={0}
                aria-labelledby={getTriggerId(item.instanceKey)}
                data-slot="tabs-content"
                {...contentSlot}
              >
                {renderWithProps(item.content, {
                  get value() {
                    return item.value
                  },
                  get selected() {
                    return selected()
                  },
                })}
              </div>
            </Show>
          )
        }}
      </For>
    </div>
  )
}
