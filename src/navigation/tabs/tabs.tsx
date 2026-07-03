import type { JSX } from 'solid-js'
import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  on,
  onCleanup,
  onMount,
} from 'solid-js'

import { Icon } from '../../elements/icon'
import type { IconT } from '../../elements/icon'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { useControllableValue } from '../../shared/use-controllable-value'
import { useSelectableCollectionNavigation } from '../../shared/use-selectable-collection-navigation'
import { cn, useId } from '../../shared/utils'

import {
  tabsIndicatorVariants,
  tabsLeadingVariants,
  tabsListVariants,
  tabsRootVariants,
  tabsTriggerVariants,
} from './tabs.class'
import type { TabsVariantProps } from './tabs.class'

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
    renderContent?: JSX.Element

    /**
     * Whether the tab is disabled.
     * @default false
     */
    disabled?: boolean

    /**
     * Custom class for the tab content panel.
     */
    class?: string
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
  export interface Props extends BaseProps<Base, Variant, Slot> {}
}

/**
 * Props for the Tabs component.
 */
export interface TabsProps extends TabsT.Props {}

interface NormalizedTabItem extends TabsT.Item {
  value: string
}

function normalizeItemValue(item: TabsT.Item, index: number): string {
  if (item.value === undefined || item.value === null) {
    return String(index)
  }

  return String(item.value)
}

/**
 * Tabbed navigation component with configurable orientation and variant styles.
 */
export function Tabs(props: TabsProps): JSX.Element {
  const merged = mergeProps(
    {
      orientation: 'horizontal' as const,
      variant: 'pill' as const,
      size: 'md' as const,
    },
    props,
  )

  const rootId = useId(() => merged.id, 'tabs')
  const [requestedValue, setRequestedValue] = useControllableValue<string>({
    value: () => merged.value,
    defaultValue: () => merged.defaultValue,
  })
  const normalizedItems = createMemo<NormalizedTabItem[]>(() =>
    (merged.items ?? []).map((item, index) =>
      Object.assign({}, item, {
        value: normalizeItemValue(item, index),
      }),
    ),
  )
  const firstEnabledValue = createMemo(
    () => normalizedItems().find((item) => !item.disabled)?.value,
  )
  const selectedValue = createMemo(() => {
    const candidate = requestedValue()

    if (candidate && normalizedItems().some((item) => item.value === candidate && !item.disabled)) {
      return candidate
    }

    return firstEnabledValue()
  })
  const triggerRefs = new Map<string, HTMLButtonElement>()
  const [highlightedValue, setHighlightedValue] = createSignal<string | undefined>()
  const effectiveHighlighted = createMemo<string | undefined>(() => {
    const focused = highlightedValue()

    if (
      focused !== undefined &&
      normalizedItems().some((item) => item.value === focused && !item.disabled)
    ) {
      return focused
    }

    return selectedValue()
  })
  const [indicatorStyle, setIndicatorStyle] = createSignal<JSX.CSSProperties>({
    transform: undefined,
    width: undefined,
    height: undefined,
  })
  let listRef: HTMLDivElement | undefined
  const { onNavigationKeyDown } = useSelectableCollectionNavigation<NormalizedTabItem, string>({
    items: normalizedItems,
    getValue: (item) => item.value,
    isDisabled: (item) => Boolean(merged.disabled || item.disabled),
    loop: () => merged.keyboardLoop ?? true,
    activationMode: () => merged.activationMode ?? 'automatic',
    focusValue: (value) => {
      setHighlightedValue(value)
      triggerRefs.get(value)?.focus()
    },
    onSelect: (value) => selectValue(value),
  })

  function getTriggerId(value: string): string {
    return `${rootId()}-${value}-trigger`
  }

  function getContentId(value: string): string {
    return `${rootId()}-${value}-content`
  }

  function selectValue(nextValue: string): void {
    if (merged.disabled || nextValue === selectedValue()) {
      return
    }

    setRequestedValue(nextValue)

    merged.onChange?.(nextValue)
  }

  function computeIndicatorStyle(): void {
    const currentValue = selectedValue()

    if (!currentValue) {
      setIndicatorStyle({
        transform: undefined,
        width: undefined,
        height: undefined,
      })
      return
    }

    const selectedTrigger = triggerRefs.get(currentValue)

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

  createEffect(
    on(selectedValue, () => {
      computeIndicatorStyle()
    }),
  )

  createEffect(() => {
    const currentValue = selectedValue()
    const selectedTrigger = currentValue ? triggerRefs.get(currentValue) : undefined

    if (!selectedTrigger) {
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
      style={{ ...merged.styles?.root, ...merged.style }}
      class={tabsRootVariants(
        { orientation: merged.orientation },
        merged.classes?.root,
        merged.class,
      )}
    >
      <div
        ref={(e) => (listRef = e)}
        role="tablist"
        aria-orientation={merged.orientation}
        data-slot="list"
        style={merged.styles?.list}
        class={tabsListVariants(
          {
            orientation: merged.orientation,
            variant: merged.variant,
          },
          merged.classes?.list,
        )}
      >
        <div
          aria-hidden="true"
          data-slot="indicator"
          style={{ ...indicatorStyle(), ...merged.styles?.indicator }}
          class={tabsIndicatorVariants(
            {
              orientation: merged.orientation,
              variant: merged.variant,
            },
            merged.classes?.indicator,
          )}
        />

        <For each={normalizedItems()}>
          {(item) => {
            const selected = createMemo(() => selectedValue() === item.value)
            const highlighted = createMemo(() => effectiveHighlighted() === item.value)

            return (
              <button
                id={getTriggerId(item.value)}
                ref={(element) => {
                  triggerRefs.set(item.value, element)
                }}
                type="button"
                role="tab"
                tabIndex={highlighted() ? 0 : -1}
                aria-controls={getContentId(item.value)}
                aria-selected={selected()}
                data-selected={selected() ? '' : undefined}
                data-highlighted={highlighted() && !selected() ? '' : undefined}
                disabled={Boolean(merged.disabled || item.disabled)}
                data-slot="trigger"
                style={merged.styles?.trigger}
                class={tabsTriggerVariants(
                  {
                    orientation: merged.orientation,
                    variant: merged.variant,
                    size: merged.size,
                  },
                  merged.classes?.trigger,
                )}
                onClick={() => {
                  setHighlightedValue(item.value)
                  selectValue(item.value)
                }}
                onFocus={() => setHighlightedValue(item.value)}
                onKeyDown={(event) => {
                  onNavigationKeyDown(event, item.value, merged.orientation)
                }}
              >
                <Show when={item.icon}>
                  <span
                    data-slot="leading"
                    style={merged.styles?.leading}
                    class={tabsLeadingVariants({ size: merged.size }, merged.classes?.leading)}
                  >
                    <Icon name={item.icon} />
                  </span>
                </Show>

                <Show when={typeof item.label === 'string'} fallback={item.label}>
                  <span
                    data-slot="label"
                    style={merged.styles?.label}
                    class={cn('truncate', merged.classes?.label)}
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
          const selected = createMemo(() => selectedValue() === item.value)

          return (
            <Show when={selected()}>
              <div
                id={getContentId(item.value)}
                role="tabpanel"
                tabIndex={0}
                aria-labelledby={getTriggerId(item.value)}
                data-selected=""
                data-slot="content"
                style={merged.styles?.content}
                class={cn('outline-none w-full', merged.classes?.content, item.class)}
              >
                {item.renderContent}
              </div>
            </Show>
          )
        }}
      </For>
    </div>
  )
}
