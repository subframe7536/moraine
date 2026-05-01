import type { JSX } from 'solid-js'
import { For, Show, createMemo, mergeProps, splitProps } from 'solid-js'

import { Icon } from '../../elements/icon'
import type { IconT } from '../../elements/icon'
import { createControllableSignal } from '../../shared/create-controllable-signal'
import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
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
  export type Slot =
    | 'root'
    | 'list'
    | 'indicator'
    | 'trigger'
    | 'leading'
    | 'label'
    | 'trailing'
    | 'content'
  export type Variant = TabsVariantProps
  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>
  export type Extend = JSX.HTMLAttributes<HTMLDivElement> & {
    value?: string
    defaultValue?: string
    onChange?: (value: string) => void
    orientation?: 'horizontal' | 'vertical'
  }

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
     * Array of tabs to display.
     */
    items?: Item[]
  }

  /**
   * Props for the Tabs component.
   */
  export interface Props extends BaseProps<Base, Variant, Extend, Slot> {}
}

/**
 * Props for the Tabs component.
 */
export interface TabsProps extends TabsT.Props {}

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

  const [local, rest] = splitProps(merged, [
    'defaultValue',
    'onChange',
    'orientation',
    'value',
    'variant',
    'size',
    'classes',
    'styles',
    'items',
  ])

  const id = useId(() => rest.id as string | undefined, 'tabs')
  const items = createMemo(() =>
    (local.items ?? []).map((item, index) => ({
      item,
      index,
      value: normalizeItemValue(item, index),
    })),
  )
  const fallbackValue = createMemo(() => items().find((entry) => !entry.item.disabled)?.value)
  const [selectedValue, setSelectedValue] = createControllableSignal<string>({
    value: () => local.value,
    defaultValue: () => local.defaultValue ?? fallbackValue(),
    onChange: local.onChange,
  })
  const resolvedValue = createMemo(() => {
    const value = selectedValue()
    if (value && items().some((entry) => entry.value === value && !entry.item.disabled)) {
      return value
    }

    return fallbackValue()
  })

  const enabledValues = createMemo(() =>
    items()
      .filter((entry) => !entry.item.disabled)
      .map((entry) => entry.value),
  )

  function focusAdjacentTab(currentValue: string, direction: -1 | 1): void {
    const values = enabledValues()
    const currentIndex = values.indexOf(currentValue)
    if (currentIndex < 0) {
      return
    }

    const nextValue = values[currentIndex + direction]
    if (!nextValue) {
      return
    }

    const nextTab = document.getElementById(`${id()}-tab-${nextValue}`)
    nextTab?.focus()
    setSelectedValue(nextValue)
  }

  function handleTriggerKeyDown(event: KeyboardEvent, value: string): void {
    const isHorizontal = local.orientation === 'horizontal'

    if ((isHorizontal && event.key === 'ArrowRight') || (!isHorizontal && event.key === 'ArrowDown')) {
      event.preventDefault()
      focusAdjacentTab(value, 1)
      return
    }

    if ((isHorizontal && event.key === 'ArrowLeft') || (!isHorizontal && event.key === 'ArrowUp')) {
      event.preventDefault()
      focusAdjacentTab(value, -1)
      return
    }

    if (event.key === 'Home') {
      event.preventDefault()
      const firstValue = enabledValues()[0]
      if (!firstValue) {
        return
      }
      document.getElementById(`${id()}-tab-${firstValue}`)?.focus()
      setSelectedValue(firstValue)
      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      const lastValue = enabledValues().at(-1)
      if (!lastValue) {
        return
      }
      document.getElementById(`${id()}-tab-${lastValue}`)?.focus()
      setSelectedValue(lastValue)
    }
  }

  return (
    <div
      data-slot="root"
      style={local.styles?.root}
      class={tabsRootVariants({ orientation: local.orientation }, local.classes?.root)}
      {...rest}
    >
      <div
        role="tablist"
        aria-orientation={local.orientation}
        data-slot="list"
        style={local.styles?.list}
        class={tabsListVariants(
          {
            orientation: local.orientation,
            variant: local.variant,
          },
          local.classes?.list,
        )}
      >
        <div
          aria-hidden="true"
          data-slot="indicator"
          style={local.styles?.indicator}
          class={tabsIndicatorVariants(
            {
              orientation: local.orientation,
              variant: local.variant,
            },
            local.classes?.indicator,
          )}
        />

        <For each={items()}>
          {(entry) => (
            <button
              id={`${id()}-tab-${entry.value}`}
              type="button"
              role="tab"
              data-slot="trigger"
              data-selected={resolvedValue() === entry.value ? '' : undefined}
              style={local.styles?.trigger}
              aria-selected={resolvedValue() === entry.value}
              aria-controls={`${id()}-panel-${entry.value}`}
              tabIndex={resolvedValue() === entry.value ? 0 : -1}
              disabled={entry.item.disabled}
              class={tabsTriggerVariants(
                {
                  orientation: local.orientation,
                  variant: local.variant,
                  size: local.size,
                },
                local.classes?.trigger,
              )}
              onClick={() => setSelectedValue(entry.value)}
              onKeyDown={(event) => handleTriggerKeyDown(event, entry.value)}
            >
              <Show when={entry.item.icon}>
                <span
                  data-slot="leading"
                  style={local.styles?.leading}
                  class={tabsLeadingVariants({ size: local.size }, local.classes?.leading)}
                >
                  <Icon name={entry.item.icon} />
                </span>
              </Show>

              <Show when={typeof entry.item.label === 'string'} fallback={entry.item.label}>
                <span
                  data-slot="label"
                  style={local.styles?.label}
                  class={cn('truncate', local.classes?.label)}
                >
                  {entry.item.label}
                </span>
              </Show>
            </button>
          )}
        </For>
      </div>

      <For each={items()}>
        {(entry) => (
          <div
            id={`${id()}-panel-${entry.value}`}
            role="tabpanel"
            data-slot="content"
            data-selected={resolvedValue() === entry.value ? '' : undefined}
            style={local.styles?.content}
            aria-labelledby={`${id()}-tab-${entry.value}`}
            hidden={resolvedValue() !== entry.value}
            class={cn('outline-none w-full', local.classes?.content, entry.item.class)}
          >
            {entry.item.content}
          </div>
        )}
      </For>
    </div>
  )
}
