import type { JSX } from '@solidjs/web'
import { dynamic } from '@solidjs/web'
import {
  DEV,
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  merge,
  onCleanup,
  untrack,
  omit,
} from 'solid-js'

import { pickSlotOverrides, useRecipe } from '../../provider'
import type { SlotOverrides } from '../../provider'
import { createControllableValue } from '../../shared/controllable-value'
import type { DisclosureState } from '../../shared/disclosure-state'
import { createDisclosureState } from '../../shared/disclosure-state'
import { bindElement } from '../../shared/element-binding'
import { createKeyDownHandler, createKeyUpHandler } from '../../shared/keyboard'
import { renderWithProps } from '../../shared/render-with-props'
import { callRef, createId, pick } from '../../shared/utils'
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
      {...{ 'prop:inert': props.disclosure.inert() }}
      data-slot="accordion-content"
      {...contentSlot}
    >
      {props.children}
    </div>
  )
}

/**
 * Stacked disclosure component with single or multiple expanded sections, driven by an `items`
 * array. Use `Accordion` for several related disclosures that share one open-item policy, and
 * `Collapsible` for a single independent disclosure. `value`, `defaultValue`, and `onValueChange`
 * always use an array of item values, even when `multiple` is off.
 *
 * @example
 * ```tsx
 * import { createSignal, merge, For, omit } from 'solid-js'
 * import { Accordion } from 'moraine'
 *
 * const [open, setOpen] = createSignal<string[]>(['shipping'])
 *
 * <Accordion
 *   items={[
 *     { value: 'shipping', label: 'Shipping', content: 'Ships in two days.' },
 *     { value: 'returns', label: 'Returns', content: 'Free returns within 30 days.' },
 *   ]}
 *   value={open()}
 *   onValueChange={setOpen}
 * />
 * ```
 */
export function Accordion(props: AccordionProps): JSX.Element {
  const local = pick(
    props,
    'id',
    'value',
    'defaultValue',
    'multiple',
    'collapsible',
    'loop',
    'onValueChange',
    'items',
    'disabled',
    'transition',
    'forceMount',
    'expandIcon',
    'headingLevel',
    'classes',
    'styles',
    'class',
    'style',
    'ref',
  )
  const rest = omit(
    props,
    'id',
    'value',
    'defaultValue',
    'multiple',
    'collapsible',
    'loop',
    'onValueChange',
    'items',
    'disabled',
    'transition',
    'forceMount',
    'expandIcon',
    'headingLevel',
    'classes',
    'styles',
    'class',
    'style',
    'ref',
  )
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

  const merged = merge(
    {
      multiple: false,
      collapsible: true,
      loop: true,
      forceMount: false,
      expandIcon: 'icon-chevron-down',
      headingLevel: 3 as const,
    },
    local,
  )

  const rootId = createId(() => merged.id, 'accordion')
  const expandIcon = createMemo(() => merged.expandIcon)
  const headingTag = () => `h${merged.headingLevel}` as const
  const Heading = dynamic(headingTag)
  const [selectedValues, setSelectedValues] = createControllableValue<Array<string>>({
    value: () => merged.value,
    defaultValue: () => merged.defaultValue ?? [],
  })
  const warnedDuplicateValues = new Set<string>()
  const items = createMemo(() => {
    const list = merged.items ?? []
    if (DEV) {
      const values = list.map((item) => item.value)
      for (const value of new Set(values.filter((v, i) => values.indexOf(v) !== i))) {
        if (!warnedDuplicateValues.has(value)) {
          warnedDuplicateValues.add(value)
          console.warn(`[moraine] Accordion received duplicate item value "${value}".`)
        }
      }
    }
    return list
  })
  const triggerRefs = new Map<string, HTMLButtonElement>()
  let lastFocusedIndex = -1
  let lastFocusedValue: string | undefined
  let focusRecoveryVersion = 0

  function getEnabledItems(): Array<string> {
    if (merged.disabled) {
      return []
    }
    const result: Array<string> = []
    for (const item of items()) {
      if (!item.disabled && triggerRefs.has(item.value)) {
        result.push(item.value)
      }
    }
    return result
  }

  function setValue(nextValue: Array<string>): void {
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
    const currentIndex = enabled.indexOf(currentKey)

    if (currentIndex === -1) {
      return
    }

    const nextIndex = currentIndex + offset

    if (!merged.loop && (nextIndex < 0 || nextIndex >= enabled.length)) {
      return
    }

    const target = enabled[(nextIndex + enabled.length) % enabled.length]
    if (target !== undefined) {
      triggerRefs.get(target)?.focus()
    }
  }

  function focusTriggerBoundary(last = false): void {
    const enabled = getEnabledItems()
    const target = enabled[last ? enabled.length - 1 : 0]
    if (target !== undefined) {
      triggerRefs.get(target)?.focus()
    }
  }

  const itemDisabledSnapshot = () => items().map((item) => item.disabled)

  createEffect(
    () => [itemDisabledSnapshot(), (() => merged.disabled)()],
    ([disabledItems, disabled]) => {
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
          if (target !== undefined) {
            triggerRefs.get(target)?.focus()
          }
        })
      })
    },
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
        callRef(() => local.ref, element)
      }}
      id={rootId()}
    >
      <For each={items()}>
        {(item) => {
          const itemIdSegment = createId(undefined, 'accordion-item')
          const itemValue = () => item.value

          const disabled = createMemo(() => Boolean(merged.disabled || item.disabled))
          const icon = createMemo(() => item.icon)
          const label = createMemo(() => item.label)
          const expanded = createMemo(() => selectedValues().includes(itemValue()))
          const disclosure = createDisclosureState({
            open: expanded,
            disabled,
            transition: () => merged.transition !== false,
            forceMount: () => merged.forceMount,
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
          bindElement(triggerEl, (element, scope) => {
            disclosure.setTriggerElement(element)
            let key = untrack(itemValue)
            triggerRefs.set(key, element)
            scope(() =>
              createEffect(
                itemValue,
                (nextKey) => {
                  triggerRefs.delete(key)
                  key = nextKey
                  triggerRefs.set(key, element)
                },
                { defer: true },
              ),
            )
            return () => {
              triggerRefs.delete(key)
            }
          })

          return (
            <div data-slot="accordion-item" {...itemSlot}>
              <Heading data-slot="accordion-header" {...headerSlot}>
                <button
                  ref={setTriggerEl}
                  id={triggerId()}
                  type="button"
                  aria-controls={contentId()}
                  aria-expanded={expanded() ? 'true' : 'false'}
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
                  <Show when={icon()}>
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

                  <Show when={expandIcon()}>
                    <Icon name={expandIcon()} data-slot="accordion-trailing" {...trailingSlot} />
                  </Show>
                </button>
              </Heading>

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
