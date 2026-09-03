import type { JSX } from 'solid-js'
import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  onMount,
  splitProps,
} from 'solid-js'

import { Icon } from '../../elements/icon/index.ts'
import type { IconT } from '../../elements/icon/index.ts'
import { resolveComponentStyle, useMoraineConfig } from '../../shared/provider/index.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { useSelectableCollectionNavigation } from '../../shared/use-selectable-collection-navigation.ts'
import { cn, useId } from '../../shared/utils.ts'

import { tabsRecipe } from './tabs.class.ts'
import type { TabsVariantProps } from './tabs.class.ts'

export namespace TabsT {
  export interface Slot<T = unknown> {
    /**
     * Tabs container that owns tab selection and panel rendering.
     */
    root?: T

    /** Tablist that contains all tab triggers and the selection indicator. */
    list?: T

    /** Moving indicator aligned with the active tab trigger. */
    indicator?: T

    /** Tab button users activate to select a panel. */
    trigger?: T

    /** Optional icon rendered before a tab label. */
    leading?: T

    /** Text or custom label rendered inside a tab trigger. */
    label?: T

    /** Optional trailing content rendered after a tab label. */
    trailing?: T

    /** Tab panel rendered for the selected item. */
    content?: T
  }

  export type Variant = TabsVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  /**
   * An individual tab in the tabs component.
   */
  export interface Item {
    /**
     * Label to display on the tab trigger.
     */
    label?: JSX.Element

    /**
     * Icon to display next to the label.
     */
    icon?: IconT.Name

    /**
     * Unique value for the tab.
     * @default index of the item
     */
    value?: string

    /**
     * Content to display when the tab is active.
     */
    content?: JSX.Element

    /**
     * Whether the tab is disabled.
     * @default false
     */
    disabled?: boolean
  }

  /**
   * Base props for the Tabs component.
   */
  export interface Base {
    /**
     * Unique identifier for the tabs root element.
     */
    id?: string

    /**
     * Controlled active tab value.
     */
    value?: string

    /**
     * Default active tab value for uncontrolled usage.
     */
    defaultValue?: string

    /**
     * The orientation of the tab list.
     * @default 'horizontal'
     */
    orientation?: 'horizontal' | 'vertical'

    /**
     * Whether keyboard navigation activates the tab immediately or waits for confirmation.
     * @default 'automatic'
     */
    activationMode?: 'automatic' | 'manual'

    /**
     * Whether the tab list is disabled.
     * @default false
     */
    disabled?: boolean

    /**
     * Whether arrow-key navigation wraps from the ends.
     * @default true
     */
    keyboardLoop?: boolean

    /**
     * Callback when the active tab changes.
     */
    onChange?: (value: string) => void

    /**
     * Array of tabs to display.
     */
    items?: Item[]
  }

  /**
   * Props for the Tabs component.
   */
  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>
}

/**
 * Props for the Tabs component.
 */
export interface TabsProps extends TabsT.Props {}

interface NormalizedTabItem extends TabsT.Item {
  instanceKey: string
  value: string
}

function normalizeItemValue(value: string | null | undefined, index: number): string {
  if (value === null || value === undefined) {
    return String(index)
  }

  return value
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
    'keyboardLoop',
    'onChange',
    'items',
    'variant',
    'size',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const config = useMoraineConfig()
  const providerTabs = () => config().tabs

  const merged = mergeProps(
    {
      orientation: 'horizontal' as const,
      variant: 'pill' as const,
      size: 'md' as const,
    },
    () => providerTabs()?.defaultProps,
    local,
  )

  const slots = createMemo(() =>
    tabsRecipe({
      orientation: merged.orientation,
      variant: merged.variant,
      size: merged.size,
    }),
  )

  const resolved = resolveComponentStyle({
    get slots() {
      return slots()
    },
    get provider() {
      return providerTabs()
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

  const rootId = useId(() => merged.id, 'tabs')
  const [requestedValue, setRequestedValue] = useControllableValue<string>({
    value: () => merged.value,
    defaultValue: () => merged.defaultValue,
  })
  const normalizedItems = createMemo<NormalizedTabItem[]>(() => {
    const occurrences = new Map<string, number>()

    return (merged.items ?? []).map((item, index) => {
      const value = normalizeItemValue(item.value, index)
      const occurrence = occurrences.get(value) ?? 0
      occurrences.set(value, occurrence + 1)

      return {
        content: item.content,
        disabled: item.disabled,
        icon: item.icon,
        instanceKey: `${encodeURIComponent(value)}-${occurrence}`,
        label: item.label,
        value,
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
  const [highlightedKey, setHighlightedKey] = createSignal<string | undefined>()
  const [focusRecoveryRequested, setFocusRecoveryRequested] = createSignal(false)
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
  let listRef: HTMLDivElement | undefined
  const { onNavigationKeyDown } = useSelectableCollectionNavigation<NormalizedTabItem, string>({
    items: normalizedItems,
    getValue: (item) => item.instanceKey,
    isDisabled: (item) => Boolean(merged.disabled || item.disabled),
    loop: () => merged.keyboardLoop ?? true,
    activationMode: () => merged.activationMode ?? 'automatic',
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

    merged.onChange?.(nextValue)
  }

  function computeIndicatorStyle(): void {
    const currentKey = selectedKey()

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

    if (merged.orientation === 'vertical') {
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

  onMount(() => {
    computeIndicatorStyle()
  })

  createEffect(() => {
    normalizedItems()
    computeIndicatorStyle()
  })

  createEffect(() => {
    if (!focusRecoveryRequested()) {
      return
    }

    const recoveryKey = effectiveHighlighted()

    queueMicrotask(() => {
      if (recoveryKey !== undefined) {
        triggerRefs.get(recoveryKey)?.focus()
      }
      setFocusRecoveryRequested(false)
    })
  })

  createEffect(() => {
    const items = normalizedItems()
    const currentKey = selectedKey()
    const selectedTrigger = currentKey === undefined ? undefined : triggerRefs.get(currentKey)

    if (
      typeof ResizeObserver === 'undefined' ||
      !selectedTrigger?.isConnected ||
      !items.some((item) => item.instanceKey === currentKey)
    ) {
      return
    }

    const resizeObserver = new ResizeObserver(() => {
      computeIndicatorStyle()
    })

    resizeObserver.observe(selectedTrigger)

    if (listRef) {
      resizeObserver.observe(listRef)
    }

    onCleanup(() => {
      resizeObserver.disconnect()
    })
  })

  return (
    <div
      id={rootId()}
      data-slot="root"
      data-orientation={merged.orientation}
      style={resolved.rootStyle()}
      class={resolved.rootClass()}
      {...rest}
    >
      <div
        ref={(e) => (listRef = e)}
        role="tablist"
        aria-orientation={merged.orientation ?? undefined}
        data-slot="list"
        style={resolved.slotStyle('list')}
        class={resolved.slotClass('list')}
      >
        <div
          aria-hidden="true"
          data-slot="indicator"
          style={{ ...indicatorStyle(), ...resolved.slotStyle('indicator') }}
          class={resolved.slotClass('indicator')}
        />

        <For each={normalizedItems()}>
          {(item) => {
            const selected = createMemo(() => selectedKey() === item.instanceKey)
            const highlighted = createMemo(() => effectiveHighlighted() === item.instanceKey)
            let trigger: HTMLButtonElement | undefined

            onCleanup(() => {
              const wasFocused =
                typeof document !== 'undefined' && document.activeElement === trigger

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
                aria-controls={getContentId(item.instanceKey)}
                aria-selected={selected()}
                data-selected={selected() ? '' : undefined}
                data-highlighted={highlighted() && !selected() ? '' : undefined}
                disabled={Boolean(merged.disabled || item.disabled)}
                data-slot="trigger"
                style={resolved.slotStyle('trigger')}
                class={resolved.slotClass('trigger')}
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
                  <span
                    data-slot="leading"
                    style={resolved.slotStyle('leading')}
                    class={resolved.slotClass('leading')}
                  >
                    <Icon name={item.icon} />
                  </span>
                </Show>

                <Show when={typeof item.label === 'string'} fallback={item.label}>
                  <span
                    data-slot="label"
                    style={resolved.slotStyle('label')}
                    class={cn('truncate', resolved.slotClass('label'))}
                  >
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
                data-selected=""
                data-slot="content"
                style={resolved.slotStyle('content')}
                class={resolved.slotClass('content')}
              >
                {item.content}
              </div>
            </Show>
          )
        }}
      </For>
    </div>
  )
}
