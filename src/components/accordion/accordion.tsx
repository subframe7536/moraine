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
  untrack,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { pickSlotOverrides, useRecipe } from '../../provider'
import type { SlotOverrides } from '../../provider'
import { createControllableValue } from '../../shared/controllable-value'
import type { DisclosureState } from '../../shared/disclosure-state'
import { createDisclosureState } from '../../shared/disclosure-state'
import { bindElement } from '../../shared/element-binding'
import { createKeyDownHandler, createKeyUpHandler } from '../../shared/keyboard'
import { renderWithProps } from '../../shared/render-with-props'
import { callRef, createId } from '../../shared/utils'
import { Icon } from '../icon'

import { accordionDataAttributes, accordionRecipe } from './accordion.recipe'
import type { AccordionStyleSlot } from './accordion.style-types'
import type { AccordionProps, AccordionT } from './accordion.types'

function AccordionItemPanel(props: {
  disclosure: DisclosureState
  contentId: string
  triggerId: string
  slotOverrides: SlotOverrides<Extract<keyof AccordionStyleSlot, string>>
  children: JSX.Element
}): JSX.Element {
  const {
    slots: { content: contentSlot },
  } = useRecipe(
    accordionRecipe,
    {},
    {
      varsSlot: 'content',
      data: {
        content: accordionDataAttributes.content(() => ({
          closed: props.disclosure.closed,
          expanded: props.disclosure.open,
        })),
      },
      context: () => props.slotOverrides,
      own: {
        content: () => ({
          style: {
            '--mo-collapsible-content-height': `${props.disclosure.contentHeight()}px`,
          },
        }),
      },
      enforced: {
        content: () => ({
          style: {
            animation: props.disclosure.initialOpen() ? 'none' : undefined,
            height: props.disclosure.initialOpen() ? 'auto' : undefined,
          },
        }),
      },
    },
  )

  const [element, setElement] = createSignal<HTMLDivElement>()
  bindElement(element, (node) => props.disclosure.registerContentElement(node))

  return (
    <div
      ref={setElement}
      id={props.contentId}
      role="region"
      aria-labelledby={props.triggerId}
      aria-hidden={props.disclosure.ariaHidden()}
      hidden={props.disclosure.hidden()}
      inert={props.disclosure.inert()}
      data-slot="accordion-content"
      {...contentSlot}
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
    'mountMode',
    'trailing',
    'headingLevel',
    'classes',
    'styles',
    'class',
    'style',
    'ref',
  ])
  const {
    slots: {
      root: rootSlot,
      header: headerSlot,
      leading: leadingSlot,
      label: labelSlot,
      body: bodySlot,
    },
    slotWith,
  } = useRecipe(accordionRecipe, local, {
    data: { root: accordionDataAttributes.root(() => ({ disabled: () => merged.disabled })) },
  })

  const merged = mergeProps(
    {
      multiple: false,
      collapsible: true,
      loop: true,
      mountMode: 'unmount-on-hide' as const,
      trailing: 'icon-chevron-down',
      headingLevel: 3 as const,
    },
    local,
  )

  const rootId = createId(() => merged.id, 'accordion')
  const trailing = createMemo(() => merged.trailing)
  const headingTag = () => `h${merged.headingLevel}` as const
  const [selectedValues, setSelectedValues] = createControllableValue<string[]>({
    value: () => merged.value,
    defaultValue: () => merged.defaultValue ?? [],
  })
  const items = createMemo(() => {
    const list = merged.items ?? []
    if (DEV) {
      const values = list.map((item) => item.value)
      for (const value of new Set(values.filter((v, i) => values.indexOf(v) !== i))) {
        console.warn(`[moraine] Accordion received duplicate item value "${value}".`)
      }
    }
    return list
  })
  const triggerRefs = new Map<string, HTMLButtonElement>()
  let lastFocusedIndex = -1
  let lastFocusedValue: string | undefined
  let focusRecoveryVersion = 0

  function getEnabledItems(): Array<{ item: AccordionT.Item; key: string }> {
    if (merged.disabled) {
      return []
    }
    const result: Array<{ item: AccordionT.Item; key: string }> = []
    for (const item of items()) {
      if (!item.disabled && triggerRefs.has(item.value)) {
        result.push({ item, key: item.value })
      }
    }
    return result
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

  function focusTriggerByOffset(currentKey: string, offset: number): void {
    const enabled = getEnabledItems()
    const currentIndex = enabled.findIndex((entry) => entry.key === currentKey)

    if (currentIndex === -1) {
      return
    }

    const nextIndex = currentIndex + offset

    if (!merged.loop && (nextIndex < 0 || nextIndex >= enabled.length)) {
      return
    }

    const target = enabled[(nextIndex + enabled.length) % enabled.length]
    if (target) {
      triggerRefs.get(target.key)?.focus()
    }
  }

  function focusTriggerBoundary(last = false): void {
    const enabled = getEnabledItems()
    const target = enabled[last ? enabled.length - 1 : 0]
    if (target) {
      triggerRefs.get(target.key)?.focus()
    }
  }

  const itemDisabledSnapshot = () => items().map((item) => item.disabled)

  createEffect(
    on([itemDisabledSnapshot, () => merged.disabled], ([disabledItems, disabled]) => {
      const enabledItemCount = disabledItems.filter(
        (itemDisabled) => !disabled && !itemDisabled,
      ).length
      const version = ++focusRecoveryVersion

      queueMicrotask(() => {
        untrack(() => {
          if (version !== focusRecoveryVersion || !lastFocusedValue || enabledItemCount === 0) {
            return
          }

          const currentTrigger = triggerRefs.get(lastFocusedValue)
          const ownerDocument = currentTrigger?.ownerDocument ?? document
          const activeElement = ownerDocument.activeElement
          if (activeElement !== ownerDocument.body && activeElement !== currentTrigger) {
            return
          }

          if (currentTrigger && !currentTrigger.disabled && currentTrigger.isConnected) {
            currentTrigger.focus()
            return
          }

          const enabled = getEnabledItems()
          const targetIndex = Math.min(lastFocusedIndex, enabled.length - 1)
          const target = enabled[Math.max(0, targetIndex)]
          if (target) {
            triggerRefs.get(target.key)?.focus()
          }
        })
      })
    }),
  )

  onCleanup(() => {
    focusRecoveryVersion += 1
  })

  return (
    <div
      data-slot="accordion"
      {...rootSlot}
      {...rest}
      ref={(element) => {
        callRef(local.ref, element)
      }}
      id={rootId()}
    >
      <For each={items()}>
        {(item) => {
          const itemIdSegment = createId(undefined, 'accordion-item')
          const itemValue = () => item.value

          const disabled = createMemo(() => Boolean(merged.disabled || item.disabled))
          const leading = createMemo(() => item.leading)
          const label = createMemo(() => item.label)
          const expanded = createMemo(() => selectedValues().includes(itemValue()))
          const disclosure = createDisclosureState({
            open: expanded,
            disabled,
            mountMode: () => merged.mountMode,
            onBeforeMatch: () => {
              if (!disabled() && !expanded()) {
                toggleValue(itemValue())
              }
            },
          })
          const itemState = {
            closed: disclosure.closed,
            disabled,
            expanded,
          }
          const itemSlot = slotWith('item', {
            own: () => ({ class: item.class }),
            data: accordionDataAttributes.item(itemState),
          })
          const triggerSlot = slotWith('trigger', {
            data: accordionDataAttributes.trigger(itemState),
          })
          const trailingSlot = slotWith('trailing', {
            data: accordionDataAttributes.trailing({ expanded }),
          })

          const triggerId = () => `${rootId()}-${itemIdSegment()}-trigger`
          const contentId = () => `${rootId()}-${itemIdSegment()}-content`
          let spaceKeyDown = false

          function Content(): JSX.Element {
            // Create this memo only after the expanded branch mounts so closed content is not evaluated and hydration creates nodes in the same order.
            const content = createMemo(() => item.content)

            return (
              <Show when={content()}>
                {(value) => {
                  const [body, setBody] = createSignal<HTMLDivElement>()
                  // Measure natural content, independently of the shell's animated height.
                  bindElement(body, disclosure.registerMeasureElement)
                  return (
                    <div ref={setBody} data-slot="accordion-body" {...bodySlot}>
                      {renderWithProps(value(), {
                        get expanded() {
                          return expanded()
                        },
                        get closed() {
                          return disclosure.closed()
                        },
                        get disabled() {
                          return disabled()
                        },
                        get value() {
                          return itemValue()
                        },
                      })}
                    </div>
                  )
                }}
              </Show>
            )
          }

          function onTriggerClick(event: MouseEvent): void {
            spaceKeyDown = false
            if (!event.defaultPrevented && !disabled()) {
              toggleValue(itemValue())
            }
          }

          const onTriggerKeyDown = createKeyDownHandler<HTMLButtonElement>({
            keys: {
              Enter: (event) => {
                if (!event.repeat && !disabled()) {
                  toggleValue(itemValue())
                }
              },
              ' ': (event) => {
                if (!event.repeat) {
                  spaceKeyDown = true
                }
              },
              ArrowDown: () => focusTriggerByOffset(itemValue(), 1),
              ArrowUp: () => focusTriggerByOffset(itemValue(), -1),
              Home: () => focusTriggerBoundary(),
              End: () => focusTriggerBoundary(true),
            },
          })

          const onTriggerKeyUp = createKeyUpHandler<HTMLButtonElement>({
            keys: {
              ' ': () => {
                const shouldToggle = spaceKeyDown && !disabled()
                spaceKeyDown = false

                if (shouldToggle) {
                  toggleValue(itemValue())
                }
              },
            },
          })

          const [triggerEl, setTriggerEl] = createSignal<HTMLButtonElement>()
          bindElement(triggerEl, (element) => {
            const key = untrack(itemValue)
            disclosure.setTriggerElement(element)
            triggerRefs.set(key, element)
            return () => {
              triggerRefs.delete(key)
            }
          })

          return (
            <div data-slot="accordion-item" {...itemSlot}>
              <Dynamic component={headingTag()} data-slot="accordion-header" {...headerSlot}>
                <button
                  ref={setTriggerEl}
                  id={triggerId()}
                  type="button"
                  aria-controls={contentId()}
                  aria-expanded={expanded()}
                  aria-label={item.ariaLabel ?? (label() === undefined ? item.value : undefined)}
                  disabled={disabled()}
                  data-slot="accordion-trigger"
                  {...triggerSlot}
                  onClick={onTriggerClick}
                  onKeyDown={onTriggerKeyDown}
                  onKeyUp={onTriggerKeyUp}
                  onBlur={() => {
                    spaceKeyDown = false
                  }}
                  onFocus={() => {
                    lastFocusedIndex = items().indexOf(item)
                    lastFocusedValue = itemValue()
                  }}
                >
                  <Show when={leading()}>
                    {(value) => (
                      <Icon name={value()} data-slot="accordion-leading" {...leadingSlot} />
                    )}
                  </Show>

                  <Show when={label()}>
                    {(value) => (
                      <span data-slot="accordion-label" {...labelSlot}>
                        {value()}
                      </span>
                    )}
                  </Show>

                  <Show when={trailing()}>
                    <Icon name={trailing()} data-slot="accordion-trailing" {...trailingSlot} />
                  </Show>
                </button>
              </Dynamic>

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
