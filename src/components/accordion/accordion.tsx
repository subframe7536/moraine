import type { JSX } from 'solid-js'
import {
  For,
  Show,
  createEffect,
  createMemo,
  mergeProps,
  on,
  onCleanup,
  splitProps,
} from 'solid-js'

import { pickSlotOverrides, useRecipe } from '../../provider'
import type { SlotOverrides } from '../../provider'
import { createControllableValue } from '../../shared/controllable-value'
import type { DisclosureState } from '../../shared/disclosure-state'
import { createDisclosureState } from '../../shared/disclosure-state'
import { callRef, createId } from '../../shared/utils'
import { Icon } from '../icon'

import { accordionDataAttributes, accordionRecipe } from './accordion.recipe'
import type { AccordionStyleSlot } from './accordion.style-types'
import type { AccordionProps } from './accordion.types'

function AccordionItemPanel(props: {
  disclosure: DisclosureState
  contentId: string
  triggerId: string
  slotOverrides: SlotOverrides<Extract<keyof AccordionStyleSlot, string>>
  children: JSX.Element
}): JSX.Element {
  const { slots } = useRecipe(
    accordionRecipe,
    {},
    {
      varsSlot: 'content',
      contextSlots: () => props.slotOverrides,
      vars: () => ({
        '--mo-collapsible-content-height': `${props.disclosure.contentHeight()}px`,
      }),
      enforced: () => ({
        content: {
          style: {
            animation: props.disclosure.initialOpen() ? 'none' : undefined,
            height: props.disclosure.initialOpen() ? 'auto' : undefined,
          },
        },
      }),
    },
  )

  return (
    <div
      ref={(element) => {
        onCleanup(props.disclosure.registerPresenceElement(element))
      }}
      id={props.contentId}
      role="region"
      aria-labelledby={props.triggerId}
      aria-hidden={props.disclosure.ariaHidden()}
      hidden={props.disclosure.hidden()}
      inert={props.disclosure.inert()}
      data-slot="accordion-content"
      {...slots.content}
      {...accordionDataAttributes.content({
        closed: props.disclosure.closed,
        expanded: props.disclosure.open,
      })}
    >
      {props.children}
    </div>
  )
}

/** Stacked disclosure component with single or multiple expanded sections. */
export function Accordion(props: AccordionProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'id',
    'value',
    'defaultValue',
    'multiple',
    'collapsible',
    'loop',
    'onValueChange',
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
  const { slots, slotWith } = useRecipe(accordionRecipe, local)

  const merged = mergeProps(
    {
      multiple: false,
      collapsible: true,
      loop: true,
      unmountOnHide: true,
      trailing: 'icon-chevron-down',
    },
    local,
  )

  const rootId = createId(() => merged.id, 'accordion')
  const trailing = createMemo(() => merged.trailing)
  const [selectedValues, setSelectedValues] = createControllableValue<string[]>({
    value: () => merged.value,
    defaultValue: () => merged.defaultValue ?? [],
  })
  const items = createMemo(() => merged.items ?? [])
  let rootElement: HTMLDivElement | undefined
  let lastFocusedIndex = -1
  let lastFocusedTrigger: HTMLButtonElement | undefined
  let focusRecoveryVersion = 0

  function getTriggers(): HTMLButtonElement[] {
    if (!rootElement) {
      return []
    }

    return Array.from(
      rootElement.querySelectorAll<HTMLButtonElement>(
        ':scope > [data-slot="accordion-item"] > [data-slot="accordion-header"] > [data-slot="accordion-trigger"]',
      ),
    )
  }

  function getEnabledTriggers(): HTMLButtonElement[] {
    return getTriggers().filter((trigger) => !trigger.disabled)
  }

  function setValue(nextValue: string[]): void {
    setSelectedValues(nextValue)
    merged.onValueChange?.(nextValue)
  }

  function toggleValue(itemValue: string): void {
    const currentValue = selectedValues()
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

    if (!merged.loop && (nextIndex < 0 || nextIndex >= enabledTriggers.length)) {
      return
    }

    enabledTriggers[(nextIndex + enabledTriggers.length) % enabledTriggers.length]?.focus()
  }

  const itemDisabledSnapshot = () => items().map((item) => item.disabled)

  createEffect(
    on([itemDisabledSnapshot, () => merged.disabled], ([disabledItems, disabled]) => {
      const enabledItemCount = disabledItems.filter(
        (itemDisabled) => !disabled && !itemDisabled,
      ).length
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
    }),
  )

  onCleanup(() => {
    focusRecoveryVersion += 1
  })

  return (
    <div
      data-slot="accordion"
      {...accordionDataAttributes.root({ disabled: () => merged.disabled })}
      {...rest}
      ref={(element) => {
        rootElement = element
        callRef(local.ref, element)
      }}
      id={rootId()}
      {...slots.root}
    >
      <For each={items()}>
        {(item) => {
          const itemIdSegment = createId(undefined, 'accordion-item')
          const itemValue = createMemo(() => item.value ?? itemIdSegment())

          const disabled = createMemo(() => Boolean(merged.disabled || item.disabled))
          const leading = createMemo(() => item.leading)
          const label = createMemo(() => item.label)
          const expanded = createMemo(() => selectedValues().includes(itemValue()))
          const disclosure = createDisclosureState({
            open: expanded,
            disabled,
            unmountOnHide: () => merged.unmountOnHide,
          })
          const itemState = {
            closed: disclosure.closed,
            disabled,
            expanded,
          }

          const triggerId = () => `${rootId()}-${itemIdSegment()}-trigger`
          const contentId = () => `${rootId()}-${itemIdSegment()}-content`
          let spaceKeyDown = false

          function Content(): JSX.Element {
            // Create this memo only after the expanded branch mounts so closed content is not evaluated and hydration creates nodes in the same order.
            const content = createMemo(() => item.content)

            return (
              <Show when={content()}>
                {(value) => (
                  <div
                    ref={(element) => {
                      // Measure natural content, independently of the shell's animated height.
                      onCleanup(disclosure.registerMeasureElement(element))
                    }}
                    data-slot="accordion-body"
                    {...slots.body}
                  >
                    {value()}
                  </div>
                )}
              </Show>
            )
          }

          function onTriggerClick(event: MouseEvent): void {
            spaceKeyDown = false
            if (!event.defaultPrevented && !disabled()) {
              toggleValue(itemValue())
            }
          }

          function onTriggerKeyDown(event: KeyboardEvent): void {
            switch (event.key) {
              case 'Enter':
                event.preventDefault()
                if (!event.repeat && !disabled()) {
                  toggleValue(itemValue())
                }
                return
              case ' ':
                event.preventDefault()
                if (!event.repeat) {
                  spaceKeyDown = true
                }
                return
              case 'ArrowDown':
              case 'ArrowUp':
              case 'Home':
              case 'End':
                event.preventDefault()
                focusTriggerByKey(event.currentTarget as HTMLButtonElement, event.key)
            }
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
              data-slot="accordion-item"
              {...slotWith('item', () => ({ class: item.class }))}
              {...accordionDataAttributes.item(itemState)}
            >
              <h3 data-slot="accordion-header" {...slots.header}>
                <button
                  ref={(element) => {
                    disclosure.setTriggerElement(element)
                  }}
                  id={triggerId()}
                  type="button"
                  aria-controls={contentId()}
                  aria-expanded={expanded()}
                  aria-label={item.ariaLabel ?? (label() === undefined ? itemValue() : undefined)}
                  disabled={disabled()}
                  data-slot="accordion-trigger"
                  {...slots.trigger}
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
                  {...accordionDataAttributes.trigger(itemState)}
                >
                  <Show when={leading()}>
                    {(value) => (
                      <Icon name={value()} data-slot="accordion-leading" {...slots.leading} />
                    )}
                  </Show>

                  <Show when={label()}>
                    {(value) => (
                      <span data-slot="accordion-label" {...slots.label}>
                        {value()}
                      </span>
                    )}
                  </Show>

                  <Show when={trailing()}>
                    <Icon
                      name={trailing()}
                      data-slot="accordion-trailing"
                      {...slots.trailing}
                      {...accordionDataAttributes.trailing({ expanded })}
                    />
                  </Show>
                </button>
              </h3>

              <AccordionItemPanel
                disclosure={disclosure}
                contentId={contentId()}
                triggerId={triggerId()}
                slotOverrides={pickSlotOverrides(local)}
              >
                <Show when={disclosure.shouldMount()}>
                  <Content />
                </Show>
              </AccordionItemPanel>
            </div>
          )
        }}
      </For>
    </div>
  )
}
