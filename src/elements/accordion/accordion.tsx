import type { JSX } from 'solid-js'
import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  splitProps,
  untrack,
} from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { useDisclosureState } from '../../shared/use-disclosure-state.ts'
import { useTransitionPresence } from '../../shared/use-transition-presence.ts'
import { callRef, cn, useId } from '../../shared/utils.ts'
import { Icon } from '../icon/index.ts'
import type { IconT } from '../icon/index.ts'

export namespace AccordionT {
  export interface Slot<T = unknown> {
    /**
     * Container that owns the accordion item collection and shared state attributes.
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
  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>
}

/**
 * Props for the Accordion component.
 */
export interface AccordionProps extends AccordionT.Props {}

/** Stacked disclosure component with single or multiple expanded sections. */
export function Accordion(props: AccordionProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'id',
    'value',
    'defaultValue',
    'multiple',
    'collapsible',
    'loopFocus',
    'onChange',
    'items',
    'disabled',
    'unmountOnHide',
    'trailing',
    'classes',
    'styles',
    'class',
    'style',
    'ref',
  ])
  const merged = mergeProps(
    {
      multiple: false,
      collapsible: true,
      loopFocus: true,
      unmountOnHide: true,
      trailing: 'icon-chevron-down' as IconT.Name,
    },
    local,
  )

  const rootId = useId(() => merged.id, 'accordion')
  const trailing = createMemo(() => merged.trailing)
  const [selectedValues, setSelectedValues] = useControllableValue<string[]>({
    value: () => merged.value,
    defaultValue: () => merged.defaultValue ?? [],
  })
  const resolvedSelectedValues = createMemo(() => selectedValues() ?? [])
  const items = createMemo(() => merged.items ?? [])
  const allocatedIdOccurrences = new Map<string, Set<number>>()
  let rootElement: HTMLDivElement | undefined
  let lastFocusedIndex = -1
  let lastFocusedTrigger: HTMLButtonElement | undefined
  let focusRecoveryVersion = 0

  function allocateItemIdSegment(base: string): [string, VoidFunction] {
    const occurrences = allocatedIdOccurrences.get(base) ?? new Set<number>()
    let occurrence = 1

    while (occurrences.has(occurrence)) {
      occurrence += 1
    }

    occurrences.add(occurrence)
    allocatedIdOccurrences.set(base, occurrences)

    return [occurrence === 1 ? base : `${base}-${occurrence}`, () => occurrences.delete(occurrence)]
  }

  function getTriggers(): HTMLButtonElement[] {
    if (!rootElement) {
      return []
    }

    const triggers: HTMLButtonElement[] = []

    for (const itemElement of rootElement.children) {
      if (!(itemElement instanceof HTMLElement) || itemElement.dataset.slot !== 'item') {
        continue
      }

      for (const header of itemElement.children) {
        if (!(header instanceof HTMLElement) || header.dataset.slot !== 'header') {
          continue
        }

        for (const trigger of header.children) {
          if (trigger instanceof HTMLButtonElement && trigger.dataset.slot === 'trigger') {
            triggers.push(trigger)
          }
        }
      }
    }

    return triggers
  }

  function getEnabledTriggers(): HTMLButtonElement[] {
    return getTriggers().filter((trigger) => !trigger.disabled)
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

  function focusTriggerByKey(
    currentTrigger: HTMLButtonElement,
    key: 'ArrowDown' | 'ArrowUp' | 'Home' | 'End',
  ): void {
    const enabledTriggers = getEnabledTriggers()

    if (enabledTriggers.length === 0) {
      return
    }

    if (key === 'Home') {
      enabledTriggers[0]?.focus()
      return
    }

    if (key === 'End') {
      enabledTriggers[enabledTriggers.length - 1]?.focus()
      return
    }

    const currentIndex = enabledTriggers.indexOf(currentTrigger)

    if (currentIndex === -1) {
      return
    }

    const direction = key === 'ArrowDown' ? 1 : -1

    const nextIndex = currentIndex + direction

    if (!merged.loopFocus && (nextIndex < 0 || nextIndex >= enabledTriggers.length)) {
      return
    }

    enabledTriggers[(nextIndex + enabledTriggers.length) % enabledTriggers.length]?.focus()
  }

  createEffect(() => {
    const enabledItemCount = items().filter((item) => !merged.disabled && !item.disabled).length
    const version = ++focusRecoveryVersion

    queueMicrotask(() => {
      if (version !== focusRecoveryVersion || !lastFocusedTrigger || enabledItemCount === 0) {
        return
      }

      const activeElement = document.activeElement
      if (activeElement !== document.body && activeElement !== lastFocusedTrigger) {
        return
      }

      if (!lastFocusedTrigger.disabled && lastFocusedTrigger.isConnected) {
        lastFocusedTrigger.focus()
        return
      }

      const enabledTriggers = getEnabledTriggers()
      const targetIndex = Math.min(lastFocusedIndex, enabledTriggers.length - 1)
      enabledTriggers[Math.max(0, targetIndex)]?.focus()
    })
  })

  onCleanup(() => {
    focusRecoveryVersion += 1
  })

  return (
    <div
      ref={(element) => {
        rootElement = element
        callRef(local.ref, element)
      }}
      id={rootId()}
      data-slot="root"
      data-disabled={merged.disabled ? '' : undefined}
      {...rest}
      style={{ ...merged.styles?.root, ...merged.style }}
      class={cn(
        'flex flex-col w-full',
        merged.disabled && 'effect-dis',
        merged.classes?.root,
        merged.class,
      )}
    >
      <For each={items()}>
        {(item) => {
          const fallbackValue = useId(undefined, 'accordion-item')
          const itemValue = createMemo(() => item.value ?? fallbackValue())
          const [itemIdSegment, releaseItemId] = allocateItemIdSegment(untrack(itemValue))
          onCleanup(releaseItemId)

          const disabled = createMemo(() => Boolean(merged.disabled || item.disabled))
          const leading = createMemo(() => item.leading)
          const label = createMemo(() => item.label)
          const expanded = createMemo(() => resolvedSelectedValues().includes(itemValue()))
          const [contentExpanded, setContentExpanded] = createSignal(untrack(expanded))
          const itemDataAttrs = createMemo(() => ({
            'data-closed': expanded() ? undefined : '',
            'data-disabled': disabled() ? '' : undefined,
            'data-expanded': expanded() ? '' : undefined,
          }))
          const {
            contentHeight,
            dataAttrs: contentDataAttrs,
            setContentElement,
          } = useDisclosureState({
            open: contentExpanded,
            disabled,
          })
          const contentPresence = useTransitionPresence({
            open: expanded,
            mode: 'transition',
          })
          const triggerId = createMemo(() => `${rootId()}-${itemIdSegment}-trigger`)
          const contentId = createMemo(() => `${rootId()}-${itemIdSegment}-content`)
          let contentElement: HTMLDivElement | undefined
          let spaceKeyDown = false

          function renderContent(): JSX.Element {
            // Create this memo only after the expanded branch mounts so closed content is not evaluated and hydration creates nodes in the same order.
            const content = createMemo(() => item.content)

            return (
              <Show when={content()}>
                {(value) => <div class="style-accordion-content pb-2.5">{value()}</div>}
              </Show>
            )
          }

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
            spaceKeyDown = false
            if (!event.defaultPrevented && !disabled()) {
              toggleValue(itemValue())
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

            if (event.key === 'Enter') {
              event.preventDefault()
              if (!event.repeat && !disabled()) {
                toggleValue(itemValue())
              }
              return
            }

            if (event.key === ' ') {
              event.preventDefault()
              if (!event.repeat) {
                spaceKeyDown = true
              }
              return
            }

            event.preventDefault()
            focusTriggerByKey(event.currentTarget as HTMLButtonElement, event.key)
          }

          function onTriggerKeyUp(event: KeyboardEvent): void {
            if (event.key !== ' ') {
              return
            }

            event.preventDefault()
            const shouldToggle = spaceKeyDown && !disabled()
            spaceKeyDown = false

            if (shouldToggle) {
              toggleValue(itemValue())
            }
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
              <h3
                data-slot="header"
                style={merged.styles?.header}
                class={cn('flex', merged.classes?.header)}
                {...itemDataAttrs()}
              >
                <button
                  id={triggerId()}
                  type="button"
                  aria-controls={expanded() ? contentId() : undefined}
                  aria-expanded={expanded()}
                  disabled={disabled()}
                  data-slot="trigger"
                  style={merged.styles?.trigger}
                  class={cn(
                    'group text-sm font-medium py-2.5 text-left outline-none border border-transparent rounded-lg flex flex-1 gap-1.5 min-w-0 w-full transition items-center justify-between relative focus-visible:effect-fv-border disabled:effect-dis hover:underline',
                    merged.classes?.trigger,
                  )}
                  onClick={onTriggerClick}
                  onKeyDown={onTriggerKeyDown}
                  onKeyUp={onTriggerKeyUp}
                  onBlur={() => {
                    spaceKeyDown = false
                  }}
                  onFocus={(event) => {
                    lastFocusedIndex = getTriggers().indexOf(event.currentTarget)
                    lastFocusedTrigger = event.currentTarget
                  }}
                  {...itemDataAttrs()}
                >
                  <Show when={leading()}>
                    {(value) => (
                      <Icon
                        name={value()}
                        slotName="leading"
                        style={merged.styles?.leading}
                        class={cn('shrink-0 size-5', merged.classes?.leading)}
                      />
                    )}
                  </Show>

                  <Show when={label()}>
                    {(value) => (
                      <span
                        data-slot="label"
                        style={merged.styles?.label}
                        class={cn('text-start break-words', merged.classes?.label)}
                      >
                        {value()}
                      </span>
                    )}
                  </Show>

                  <Show when={trailing()}>
                    <Icon
                      name={trailing()}
                      slotName="trailing"
                      style={merged.styles?.trailing}
                      class={cn(
                        'text-muted-foreground ml-auto shrink-0 size-4 pointer-events-none duration-150 group-aria-expanded:rotate-180',
                        merged.classes?.trailing,
                      )}
                    />
                  </Show>
                </button>
              </h3>

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
                  {renderContent()}
                </div>
              </Show>
            </div>
          )
        }}
      </For>
    </div>
  )
}
