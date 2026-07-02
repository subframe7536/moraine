import type { JSX } from 'solid-js'
import { For, Show, createEffect, createMemo, createSignal, mergeProps, untrack } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { useControllableValue } from '../../shared/use-controllable-value'
import { useDisclosureState } from '../../shared/use-disclosure-state'
import { useTransitionPresence } from '../../shared/use-transition-presence'
import { cn, useId } from '../../shared/utils'
import { Icon } from '../icon'
import type { IconT } from '../icon'

export namespace AccordionT {
  export interface Slot<T = unknown> {
    /**
     * Container that owns the accordion item collection and shared state attributes.
     * @deprecated Use top-level `class` and `style` props for the component root.
     */

    root?: T

    /** Wrapper for one accordion entry, including its header trigger and collapsible panel. */
    item?: T

    /** Heading row that contains the interactive trigger for an item. */
    header?: T

    /** Button users activate to expand or collapse an item. */
    trigger?: T

    /** Optional icon or visual placed before the item label. */
    leading?: T

    /** Text label displayed inside the item trigger. */
    label?: T

    /** Optional icon placed after the label, commonly used for the disclosure indicator. */
    trailing?: T

    /** Panel that contains the item content when expanded. */
    content?: T
  }
  export type Variant = never
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Extend = never

  export interface Item {
    /**
     * Header label for the accordion item.
     */
    label?: JSX.Element

    /**
     * Unique value for the accordion item.
     */
    value?: string

    /**
     * Whether the accordion item is disabled.
     * @default false
     */
    disabled?: boolean

    /**
     * Leading icon name for the accordion item.
     */
    leading?: IconT.Name

    /**
     * Content to display when the accordion item is expanded.
     */
    content?: JSX.Element
  }
  /**
   * Base props for the Accordion component.
   */
  export interface Base {
    /**
     * Unique identifier for the accordion root element.
     */
    id?: string

    /**
     * Controlled list of expanded item values.
     */
    value?: string[]

    /**
     * Default list of expanded item values for uncontrolled usage.
     * @default []
     */
    defaultValue?: string[]

    /**
     * Whether multiple accordion items can be expanded at the same time.
     * @default false
     */
    multiple?: boolean

    /**
     * Whether the last expanded item can be collapsed.
     * @default true
     */
    collapsible?: boolean

    /**
     * Whether arrow-key focus wraps from the last trigger to the first and vice versa.
     * @default true
     */
    loopFocus?: boolean

    /**
     * Callback when the expanded item values change.
     */
    onChange?: (value: string[]) => void

    /**
     * Array of accordion items to render.
     */
    items?: Item[]

    /**
     * Whether the entire accordion is disabled.
     * @default false
     */
    disabled?: boolean

    /**
     * Whether to unmount accordion content when hidden.
     * @default true
     */
    unmountOnHide?: boolean

    /**
     * Trailing icon name for all accordion items.
     * @default 'icon-chevron-down'
     */
    trailing?: IconT.Name
  }

  /**
   * Props for the Accordion component.
   */
  export interface Props extends BaseProps<Base, Variant, Extend, Classes, Styles> {}
}

/**
 * Props for the Accordion component.
 */
export interface AccordionProps extends AccordionT.Props {}

interface NormalizedAccordionItem {
  disabled: boolean
  item: AccordionT.Item
  value: string
}

/** Stacked disclosure component with single or multiple expanded sections. */
export function Accordion(props: AccordionProps): JSX.Element {
  const merged = mergeProps(
    {
      multiple: false,
      collapsible: true,
      loopFocus: true,
      unmountOnHide: true,
      trailing: 'icon-chevron-down' as IconT.Name,
    },
    props,
  )

  const rootId = useId(() => merged.id, 'accordion')
  const [selectedValues, setSelectedValues] = useControllableValue<string[]>({
    value: () => merged.value,
    defaultValue: () => merged.defaultValue ?? [],
  })
  const resolvedSelectedValues = createMemo(() => selectedValues() ?? [])
  const normalizedItems = createMemo<NormalizedAccordionItem[]>(() =>
    (merged.items ?? []).map((item, index) => ({
      disabled: Boolean(merged.disabled || item.disabled),
      item,
      value: item.value ?? String(index),
    })),
  )

  function getTriggerId(itemValue: string): string {
    return `${rootId()}-${itemValue}-trigger`
  }

  function getContentId(itemValue: string): string {
    return `${rootId()}-${itemValue}-content`
  }

  function setValue(nextValue: string[]): void {
    setSelectedValues(nextValue)

    merged.onChange?.(nextValue)
  }

  function toggleValue(itemValue: string): void {
    const currentValue = resolvedSelectedValues()
    const isOpen = currentValue.includes(itemValue)

    if (merged.multiple) {
      setValue(
        isOpen
          ? currentValue.filter((valueItem) => valueItem !== itemValue)
          : [...currentValue, itemValue],
      )
      return
    }

    if (isOpen) {
      if (merged.collapsible) {
        setValue([])
      }
      return
    }

    setValue([itemValue])
  }

  function focusTrigger(itemValue: string): void {
    const trigger = document.getElementById(getTriggerId(itemValue))

    trigger?.focus()
  }

  function focusTriggerByKey(
    currentValue: string,
    key: 'ArrowDown' | 'ArrowUp' | 'Home' | 'End',
  ): void {
    const enabledItems = normalizedItems().filter((item) => !item.disabled)

    if (enabledItems.length === 0) {
      return
    }

    if (key === 'Home') {
      const firstItem = enabledItems[0]
      if (firstItem) {
        focusTrigger(firstItem.value)
      }
      return
    }

    if (key === 'End') {
      const lastItem = enabledItems[enabledItems.length - 1]
      if (lastItem) {
        focusTrigger(lastItem.value)
      }
      return
    }

    const currentIndex = enabledItems.findIndex((item) => item.value === currentValue)

    if (currentIndex === -1) {
      return
    }

    const direction = key === 'ArrowDown' ? 1 : -1

    const nextIndex = currentIndex + direction

    if (!merged.loopFocus && (nextIndex < 0 || nextIndex >= enabledItems.length)) {
      return
    }

    const nextItem = enabledItems[(nextIndex + enabledItems.length) % enabledItems.length]

    if (nextItem) {
      focusTrigger(nextItem.value)
    }
  }

  return (
    <div
      id={rootId()}
      data-slot="root"
      data-disabled={merged.disabled ? '' : undefined}
      style={{ ...merged.styles?.root, ...merged.style }}
      class={cn(
        'flex flex-col w-full',
        merged.disabled && 'effect-dis',
        merged.classes?.root,
        merged.class,
      )}
    >
      <For each={normalizedItems()}>
        {(entry) => {
          const expanded = createMemo(() => resolvedSelectedValues().includes(entry.value))
          const [contentExpanded, setContentExpanded] = createSignal(untrack(expanded))
          const itemDataAttrs = createMemo(() => ({
            'data-closed': expanded() ? undefined : '',
            'data-disabled': entry.disabled ? '' : undefined,
            'data-expanded': expanded() ? '' : undefined,
          }))
          const {
            contentHeight,
            dataAttrs: contentDataAttrs,
            setContentElement,
          } = useDisclosureState({
            open: contentExpanded,
            disabled: () => entry.disabled,
          })
          const contentPresence = useTransitionPresence({
            open: expanded,
            mode: 'transition',
          })
          const triggerId = createMemo(() => getTriggerId(entry.value))
          const contentId = createMemo(() => getContentId(entry.value))
          let contentElement: HTMLDivElement | undefined

          function openContentElement(): void {
            if (!contentElement || contentExpanded()) {
              return
            }

            void contentElement.offsetHeight

            if (expanded()) {
              setContentExpanded(true)
            }
          }

          createEffect(() => {
            if (!expanded()) {
              setContentExpanded(false)
              return
            }

            openContentElement()
          })

          createEffect(() => {
            if (!contentPresence.present() && merged.unmountOnHide) {
              contentElement = undefined
            }
          })

          function onTriggerClick(event: MouseEvent): void {
            if (!event.defaultPrevented && !entry.disabled) {
              toggleValue(entry.value)
            }
          }

          function onTriggerKeyDown(event: KeyboardEvent): void {
            if (
              event.key !== 'Enter' &&
              event.key !== ' ' &&
              event.key !== 'ArrowDown' &&
              event.key !== 'ArrowUp' &&
              event.key !== 'Home' &&
              event.key !== 'End'
            ) {
              return
            }

            event.preventDefault()

            if (event.key === 'Enter' || event.key === ' ') {
              if (!entry.disabled) {
                toggleValue(entry.value)
              }
              return
            }

            focusTriggerByKey(entry.value, event.key)
          }

          return (
            <div
              data-slot="item"
              style={merged.styles?.item}
              class={cn(
                'not-last:border-(b b-border) data-disabled:effect-dis',
                merged.classes?.item,
              )}
              {...itemDataAttrs()}
            >
              <div
                data-slot="header"
                role="heading"
                style={merged.styles?.header}
                class={cn('flex', merged.classes?.header)}
                {...itemDataAttrs()}
              >
                <button
                  id={triggerId()}
                  type="button"
                  aria-controls={expanded() ? contentId() : undefined}
                  aria-expanded={expanded()}
                  disabled={entry.disabled}
                  data-slot="trigger"
                  style={merged.styles?.trigger}
                  class={cn(
                    'group text-sm font-medium py-2.5 text-left outline-none border border-transparent rounded-lg flex flex-1 gap-1.5 min-w-0 w-full transition items-center justify-between relative focus-visible:effect-fv-border disabled:effect-dis hover:underline',
                    merged.classes?.trigger,
                  )}
                  onClick={onTriggerClick}
                  onKeyDown={onTriggerKeyDown}
                  {...itemDataAttrs()}
                >
                  <Show when={entry.item.leading}>
                    <Icon
                      name={entry.item.leading}
                      slotName="leading"
                      style={merged.styles?.leading}
                      class={cn('shrink-0 size-5', merged.classes?.leading)}
                    />
                  </Show>

                  <Show when={entry.item.label}>
                    <span
                      data-slot="label"
                      style={merged.styles?.label}
                      class={cn('text-start break-words', merged.classes?.label)}
                    >
                      {entry.item.label}
                    </span>
                  </Show>

                  <Show when={merged.trailing}>
                    <Icon
                      name={merged.trailing}
                      slotName="trailing"
                      style={merged.styles?.trailing}
                      class={cn(
                        'text-muted-foreground ml-auto shrink-0 size-4 pointer-events-none duration-150 group-aria-expanded:rotate-180',
                        merged.classes?.trailing,
                      )}
                    />
                  </Show>
                </button>
              </div>

              <Show when={!merged.unmountOnHide || expanded() || contentPresence.present()}>
                <div
                  ref={(element) => {
                    contentElement = element
                    setContentElement(element)
                    contentPresence.setElement(element)

                    if (expanded() && !contentExpanded()) {
                      openContentElement()
                    }
                  }}
                  id={contentId()}
                  role="region"
                  aria-labelledby={triggerId()}
                  data-slot="content"
                  style={{
                    '--mo-collapsible-content-height': `${contentHeight()}px`,
                    ...(merged.styles?.content as JSX.CSSProperties | undefined),
                  }}
                  class={cn(
                    'text-sm h-$mo-collapsible-content-height transition-[height] overflow-hidden data-closed:h-0',
                    merged.classes?.content,
                  )}
                  {...contentDataAttrs()}
                >
                  <Show when={entry.item.content}>
                    <div class="style-accordion-content pb-2.5">{entry.item.content}</div>
                  </Show>
                </div>
              </Show>
            </div>
          )
        }}
      </For>
    </div>
  )
}
