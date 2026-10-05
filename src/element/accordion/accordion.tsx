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
  splitProps,
  untrack,
} from 'solid-js'

import { createStyles } from '../../provider'
import { useCn } from '../../provider/cn-context'
import { createControllableValue } from '../../shared/controllable-value'
import { createDisclosureState } from '../../shared/disclosure-state'
import { createTransitionPresence } from '../../shared/transition-presence'
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
  const resolved = createStyles(accordionRecipe, local)

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
      {...rest}
      ref={(element) => {
        rootElement = element
        callRef(local.ref, element)
      }}
      id={rootId()}
      data-slot="accordion"
      {...accordionDataAttributes.root({ disabled: () => merged.disabled })}
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
          const [contentExpanded, setContentExpanded] = createSignal(untrack(expanded))
          const itemState = {
            closed: () => !expanded(),
            disabled,
            expanded,
          }
          const itemDataAttrs = accordionDataAttributes.item(itemState)
          const triggerDataAttrs = accordionDataAttributes.trigger(itemState)
          const {
            contentHeight,
            dataAttrs: contentDataAttrs,
            registerElement,
          } = createDisclosureState({
            open: contentExpanded,
            disabled,
          })
          const [contentHidden, setContentHidden] = createSignal(!untrack(expanded))
          const contentPresence = createTransitionPresence({
            open: expanded,
            onExitComplete: () => {
              setContentHidden(true)
            },
          })
          const triggerId = createMemo(() => `${rootId()}-${itemIdSegment()}-trigger`)
          const contentId = createMemo(() => `${rootId()}-${itemIdSegment()}-content`)
          let contentElement: HTMLDivElement | undefined
          let triggerElement: HTMLButtonElement | undefined
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
                      onCleanup(registerElement(element))
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

          function openContentElement(isExpanded: boolean): void {
            if (!contentElement || contentExpanded()) {
              return
            }

            void contentElement.offsetHeight

            if (isExpanded) {
              setContentExpanded(true)
            }
          }

          createEffect(
            on(expanded, (isExpanded) => {
              if (!isExpanded) {
                if (contentElement?.contains(contentElement.ownerDocument.activeElement)) {
                  triggerElement?.focus()
                }
                setContentExpanded(false)
                return
              }

              setContentHidden(false)
              openContentElement(isExpanded)
            }),
          )

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
                    triggerElement = element
                  }}
                  id={triggerId()}
                  type="button"
                  aria-controls={contentId()}
                  aria-expanded={expanded()}
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
                    />
                  </Show>
                </button>
              </h3>

              <div
                ref={(element) => {
                  contentElement = element
                  const releasePresence = contentPresence.registerElement(element)
                  onCleanup(() => {
                    releasePresence()
                    if (contentElement === element) {
                      contentElement = undefined
                    }
                  })

                  if (expanded() && !contentExpanded()) {
                    openContentElement(expanded())
                  }
                }}
                id={contentId()}
                role="region"
                aria-labelledby={triggerId()}
                aria-hidden={!expanded() ? true : undefined}
                hidden={contentHidden()}
                inert={!expanded() ? true : undefined}
                data-slot="accordion-content"
                class={resolved.styles.content.class}
                style={{
                  get '--mo-collapsible-content-height'() {
                    return `${contentHeight()}px`
                  },
                  ...resolved.styles.content.style,
                }}
                {...accordionDataAttributes.content({
                  closed: () => contentDataAttrs()['data-closed'],
                  expanded: () => contentDataAttrs()['data-expanded'],
                })}
              >
                <Show when={!merged.unmountOnHide || expanded() || contentPresence.present()}>
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
