import type { JSX } from '@solidjs/web'
import {
  DEV,
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  omit,
  onSettled,
  untrack,
} from 'solid-js'

import { useRecipe } from '../../provider'
import { useLocale } from '../../provider/locale/locale-context'
import { createControllableValue } from '../../shared/controllable-value'
import { renderWithProps } from '../../shared/render-with-props'
import { createSelectableCollectionNavigation } from '../../shared/selectable-collection-navigation'
import { createId, mergeDefinedProps, toIdSegment } from '../../shared/utils'
import { Icon } from '../icon'
import { resolveDirection } from '../shared/overlay/direction'

import { tabsDataAttributes, tabsRecipe } from './tabs.recipe'
import type { TabsProps, TabsT } from './tabs.types'
interface NormalizedTabItem extends TabsT.Item {
  instanceKey: string
  rawItem: TabsT.Item
}

/**
 * Tabbed navigation component with configurable orientation and variant styles, built from an
 * `items` array. Use it to switch between peer panels within the same page context; use links
 * when each destination needs its own URL, `Stepper` for a fixed sequence, and `NavigationMenu`
 * for website destinations with expandable panels. Controlled with `value` and `onValueChange`,
 * or uncontrolled with `defaultValue`. Each item needs a unique `value`; pass a component as
 * `content` so a panel is only built while its tab is selected.
 *
 * @example
 * ```tsx
 * import { createSignal, merge, For, omit } from 'solid-js'
 * import { Tabs } from 'moraine'
 *
 * const [tab, setTab] = createSignal('account')
 *
 * <Tabs
 *   value={tab()}
 *   onValueChange={setTab}
 *   items={[
 *     { value: 'account', label: 'Account', content: () => <p>Profile settings</p> },
 *     { value: 'security', label: 'Security', content: () => <p>Password and 2FA</p> },
 *     { value: 'billing', label: 'Billing', disabled: true },
 *   ]}
 * />
 * ```
 */
export function Tabs(props: TabsProps): JSX.Element {
  const rest = omit(
    props,
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
  )
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
  } = useRecipe(tabsRecipe, props, {
    data: {
      root: tabsDataAttributes.root(() => ({
        disabled: (): boolean | undefined => merged.disabled,
      })),
      content: tabsDataAttributes.content({ selected: true }),
    },
    enforced: { indicator: () => ({ style: indicatorStyle() }) },
  })
  const direction = useLocale().dir
  const merged = mergeDefinedProps(
    {
      get orientation() {
        return variants.orientation
      },
    },
    props,
  )

  const rootId = createId(() => merged.id, 'tabs')
  const [requestedValue, setRequestedValue] = createControllableValue<string | undefined>({
    value: () => merged.value,
    defaultValue: () => merged.defaultValue,
  })
  const warnedDuplicateValues = new Set<string>()

  const normalizedItems = createMemo<Array<NormalizedTabItem>>((previous) => {
    const previousCache = new Map<string, NormalizedTabItem>(
      (previous ?? []).map((entry) => [entry.instanceKey, entry]),
    )
    const occurrences = new Map<string, number>()

    return (merged.items ?? []).map((item, index) => {
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
      const instanceKey = `${toIdSegment(value)}-${occurrence}`
      const disabled = item.disabled || occurrence > 0

      const cached = previousCache.get(instanceKey)
      if (
        cached &&
        cached.rawItem === item &&
        cached.disabled === disabled &&
        cached.label === item.label &&
        cached.ariaLabel === item.ariaLabel &&
        cached.icon === item.icon
      ) {
        return cached
      }

      return {
        rawItem: item,
        value,
        instanceKey,
        label: item.label,
        ariaLabel: item.ariaLabel,
        icon: item.icon,
        disabled,
        get content() {
          return item.content
        },
      }
    })
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
  const [triggerVersion, setTriggerVersion] = createSignal(0)
  const [highlightedKey, setHighlightedKey] = createSignal<string | undefined>()
  // DOM removal resets activeElement before owner cleanup runs, so the focused
  // trigger is captured on focus instead.
  let lastFocusedTrigger: HTMLButtonElement | undefined
  let disposed = false
  let focusRecoveryGeneration = 0

  onSettled(() => () => {
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
  const [indicatorStyle, setIndicatorStyle] = createSignal<JSX.CSSProperties>({
    transform: undefined,
    width: undefined,
    height: undefined,
  })
  const [listRef, setListRef] = createSignal<HTMLDivElement>()
  const { onNavigationKeyDown } = createSelectableCollectionNavigation<NormalizedTabItem, string>({
    items: normalizedItems,
    getValue: (item) => item.instanceKey,
    isDisabled: (item) => Boolean(merged.disabled || item.disabled),
    loop: () => merged.loop ?? true,
    activationMode: () => merged.activationMode ?? 'automatic',
    getDirection: () => resolveDirection(untrack(listRef), direction()),
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
    listElement: HTMLDivElement | undefined,
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
      const direction = listElement ? getComputedStyle(listElement).direction : 'ltr'
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
    () =>
      [normalizedItems(), selectedKey(), merged.orientation, triggerVersion(), listRef()] as const,
    ([, key, orientation, , listElement]) => {
      computeIndicatorStyle(key, orientation, listElement)
    },
  )

  // Reordered items keep their DOM nodes but lose focus, while recreated items
  // register fresh trigger refs only after old owner cleanups, so the recovery
  // lookup retries a few microtask hops.
  function recoverFocus(recoveryKey: string | undefined): void {
    const generation = ++focusRecoveryGeneration

    const attemptRecovery = (attemptsLeft: number): void => {
      if (disposed || generation !== focusRecoveryGeneration) {
        return
      }
      const trigger = lastFocusedTrigger?.isConnected
        ? lastFocusedTrigger
        : recoveryKey === undefined
          ? undefined
          : triggerRefs.get(recoveryKey)
      if (recoveryKey !== undefined && trigger === undefined && attemptsLeft > 0) {
        queueMicrotask(() => attemptRecovery(attemptsLeft - 1))
        return
      }
      const ownerDocument = trigger?.ownerDocument ?? untrack(listRef)?.ownerDocument
      if (ownerDocument !== undefined && ownerDocument.activeElement === ownerDocument.body) {
        trigger?.focus()
      }
    }
    queueMicrotask(() => attemptRecovery(8))
  }

  createEffect(
    () => normalizedItems(),
    () => {
      if (lastFocusedTrigger !== undefined) {
        recoverFocus(untrack(effectiveHighlighted))
      }
    },
  )

  const observedResizeTargets = createMemo(
    () => {
      const currentKey = selectedKey()
      const selectedTrigger = currentKey === undefined ? undefined : triggerRefs.get(currentKey)
      triggerVersion()
      if (!selectedTrigger || !normalizedItems().some((item) => item.instanceKey === currentKey)) {
        return undefined
      }
      return { selectedTrigger, listElement: listRef() }
    },
    {
      equals: (prev, next) =>
        prev?.selectedTrigger === next?.selectedTrigger && prev?.listElement === next?.listElement,
    },
  )

  createEffect(observedResizeTargets, (targets) => {
    if (typeof ResizeObserver === 'undefined' || !targets) {
      return
    }
    const { selectedTrigger, listElement } = targets

    const resizeObserver = new ResizeObserver(() => {
      // Observer callbacks run unowned; settle the measured style write.
      computeIndicatorStyle(
        untrack(selectedKey),
        untrack(() => merged.orientation),
        untrack(listRef),
      )
    })

    // Overlays may insert these nodes after the effect runs, so observe detached triggers too.
    resizeObserver.observe(selectedTrigger)

    if (listElement) {
      resizeObserver.observe(listElement)
    }

    return () => {
      resizeObserver.disconnect()
    }
  })

  return (
    <div data-slot="tabs" {...rootSlot} {...rest} id={rootId()}>
      <div
        ref={(e) => setListRef(e)}
        role="tablist"
        aria-label={props['aria-label']}
        aria-labelledby={props['aria-labelledby']}
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
            const [trigger, setTrigger] = createSignal<HTMLButtonElement>()

            createEffect(
              () => [trigger(), item.instanceKey] as const,
              ([element, key]) => {
                if (!element) {
                  return
                }
                triggerRefs.set(key, element)
                setTriggerVersion((v) => v + 1)

                return () => {
                  const wasFocused =
                    element.ownerDocument.activeElement === element ||
                    lastFocusedTrigger === element
                  if (triggerRefs.get(key) === element) {
                    triggerRefs.delete(key)
                    setTriggerVersion((v) => v + 1)
                  }

                  if (wasFocused) {
                    recoverFocus(untrack(effectiveHighlighted))
                  }
                }
              },
            )

            return (
              <button
                id={getTriggerId(item.instanceKey)}
                ref={setTrigger}
                type="button"
                role="tab"
                tabindex={highlighted() ? 0 : -1}
                aria-controls={selected() ? getContentId(item.instanceKey) : undefined}
                aria-selected={selected() ? 'true' : 'false'}
                aria-label={item.ariaLabel}
                disabled={Boolean(merged.disabled || item.disabled)}
                data-slot="tabs-trigger"
                {...triggerSlot}
                onClick={() => {
                  setHighlightedKey(item.instanceKey)
                  selectValue(item.value)
                }}
                onFocus={(event) => {
                  lastFocusedTrigger = event.currentTarget
                  setHighlightedKey(item.instanceKey)
                }}
                onBlur={(event) => {
                  if (lastFocusedTrigger === event.currentTarget) {
                    lastFocusedTrigger = undefined
                  }
                }}
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
                tabindex={0}
                aria-labelledby={getTriggerId(item.instanceKey)}
                data-slot="tabs-content"
                {...contentSlot}
              >
                {renderWithProps(item.content, {
                  get value() {
                    return item.value
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
