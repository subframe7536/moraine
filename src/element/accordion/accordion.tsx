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

import { createStyles } from '../../provider'
import { useCn } from '../../provider/cn-context'
import { createControllableValue } from '../../shared/controllable-value'
import { createDisclosureState } from '../../shared/disclosure-state'
import { callRef, createId } from '../../shared/utils'
import { Icon } from '../icon'

import { accordionDataAttributes, accordionRecipe } from './accordion.recipe'
import type { AccordionProps } from './accordion.types'

/** Stacked disclosure component with single or multiple expanded sections. */
export function Accordion(props: AccordionProps): JSX.Element {
  const cn = useCn()
  const [local, rest] = splitProps(props, [
    'id',
    'value',
    'defaultValue',
    'multiple',
    'collapsible',
    'loop',
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
  const resolved = createStyles(accordionRecipe, local, { variablesSlot: 'content' })

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
    merged.onChange?.(nextValue)
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
      {...resolved.styles.root}
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
          const itemDataAttrs = accordionDataAttributes.item(itemState)
          const triggerDataAttrs = accordionDataAttributes.trigger(itemState)
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
                    {...resolved.styles.body}
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
              class={cn(resolved.styles.item.class, item.class)}
              style={resolved.styles.item.style}
              {...itemDataAttrs}
            >
              <h3 data-slot="accordion-header" {...resolved.styles.header}>
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
                  {...resolved.styles.trigger}
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
                  {...triggerDataAttrs}
                >
                  <Show when={leading()}>
                    {(value) => (
                      <Icon
                        name={value()}
                        slotName="accordion-leading"
                        {...resolved.styles.leading}
                      />
                    )}
                  </Show>

                  <Show when={label()}>
                    {(value) => (
                      <span data-slot="accordion-label" {...resolved.styles.label}>
                        {value()}
                      </span>
                    )}
                  </Show>

                  <Show when={trailing()}>
                    <Icon
                      name={trailing()}
                      slotName="accordion-trailing"
                      {...resolved.styles.trailing}
                      {...accordionDataAttributes.trailing({ expanded })}
                    />
                  </Show>
                </button>
              </h3>

              <div
                ref={(element) => {
                  onCleanup(disclosure.registerPresenceElement(element))
                }}
                id={contentId()}
                role="region"
                aria-labelledby={triggerId()}
                aria-hidden={disclosure.ariaHidden()}
                hidden={disclosure.hidden()}
                inert={disclosure.inert()}
                data-slot="accordion-content"
                class={resolved.styles.content.class}
                style={{
                  ...resolved.styles.content.style,
                  get '--mo-collapsible-content-height'() {
                    return `${disclosure.contentHeight()}px`
                  },
                  get animation() {
                    return disclosure.initialOpen() ? 'none' : undefined
                  },
                  get height() {
                    return disclosure.initialOpen() ? 'auto' : undefined
                  },
                }}
                {...accordionDataAttributes.content({
                  closed: () => disclosure.dataAttrs()['data-closed'],
                  expanded: () => disclosure.dataAttrs()['data-expanded'],
                })}
              >
                <Show when={disclosure.shouldMount()}>
                  <Content />
                </Show>
              </div>
            </div>
          )
        }}
      </For>
    </div>
  )
}
