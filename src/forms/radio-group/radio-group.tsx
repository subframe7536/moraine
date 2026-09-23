import type { JSX } from 'solid-js'
import {
  For,
  Show,
  createEffect,
  createMemo,
  mergeProps,
  on,
  onCleanup,
  onMount,
  splitProps,
  untrack,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { containsComposed, getActiveElement, isNode } from '../../overlays/base/dom'
import { createStyles } from '../../provider'
import { useCn } from '../../provider/cn-context'
import { HiddenInput } from '../../shared/hidden-input'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { useSelectableCollectionNavigation } from '../../shared/use-selectable-collection-navigation'
import { callHandler, callRef, useId } from '../../shared/utils'
import { useFormField, useFieldContext } from '../field/field-context'
import { useFormReset } from '../shared/use-form-reset'

import { radioGroupDataAttributes, radioGroupRecipe } from './radio-group.recipe'
import type { RadioGroupProps } from './radio-group.types'

interface NormalizedRadioGroupItem {
  id: string
  inputId: string
  labelId: string
  descriptionId?: string
  value: string
  label?: JSX.Element
  description?: JSX.Element
  disabled: boolean
}

/** Single-select radio group with card, list, and table layout variants. */
export function RadioGroup(props: RadioGroupProps): JSX.Element {
  const cn = useCn()
  const [local, rest] = splitProps(props, [
    'id',
    'name',
    'value',
    'defaultValue',
    'required',
    'disabled',
    'readOnly',
    'orientation',
    'items',
    'loop',
    'onChange',
    'variant',
    'indicator',
    'size',
    'classes',
    'styles',
    'class',
    'style',
    'ref',
    'onFocusIn',
    'onFocusOut',
  ])
  const themeField = useFieldContext()
  const resolved = createStyles(radioGroupRecipe, local, {
    inheritedVariants: () => ({ size: themeField?.size }),
  })
  const merged = mergeProps(
    {
      get orientation() {
        return resolved.variants.orientation
      },
      loop: true,
    },
    local,
  )

  const items = createMemo(() => merged.items ?? [])
  const orientation = createMemo(() => merged.orientation)
  const variant = createMemo(() => resolved.variants.variant)
  const indicator = createMemo(() => resolved.variants.indicator)

  const initialDefaultValue = untrack(() => merged.defaultValue ?? '')
  const readOnly = createMemo(() => Boolean(merged.readOnly))

  const groupId = useId(() => merged.id, 'radio-group')
  const field = useFormField(
    () => ({
      id: merged.id,
      name: merged.name,
      size: local.size,
      disabled: merged.disabled,
      required: local.required,
      readOnly: readOnly(),
    }),
    () => ({
      bind: false,
      focus: true,
      defaultId: groupId(),
      initialValue: initialDefaultValue,
    }),
  )

  const [selectedValue, setSelectedValue] = useControllableValue<string>({
    value: () => {
      const value = merged.value
      if (value !== undefined) {
        return value
      }

      const fieldValue = field.value()
      return typeof fieldValue === 'string' ? fieldValue : undefined
    },
    defaultValue: () => initialDefaultValue,
  })
  const inputRefs = new Map<string, HTMLInputElement>()
  let groupEl: HTMLDivElement | undefined
  let pressedSpaceItemId: string | undefined
  const dataAttrs = radioGroupDataAttributes.root({
    invalid: field.invalid,
    disabled: field.disabled,
    readonly: readOnly,
    required: field.required,
  })

  const normalizedItems = createMemo<NormalizedRadioGroupItem[]>(() => {
    const valueOccurrences = new Map<string, number>()

    return items().map((item, index) => {
      const value = typeof item === 'string' ? item : (item.value ?? String(index))
      const occurrence = valueOccurrences.get(value) ?? 0
      valueOccurrences.set(value, occurrence + 1)
      const baseId = `${groupId()}:item:${encodeURIComponent(value)}:${occurrence}`

      if (typeof item === 'string') {
        return {
          id: baseId,
          inputId: `${baseId}-input`,
          labelId: `${baseId}-label`,
          value: item,
          label: item,
          disabled: false,
        }
      }

      const label = item.label
      const description = item.description

      return {
        id: baseId,
        inputId: `${baseId}-input`,
        labelId: `${baseId}-label`,
        descriptionId: description ? `${baseId}-description` : undefined,
        value,
        label,
        description,
        disabled: Boolean(item.disabled),
      }
    })
  })

  const selectedItemId = createMemo(
    () => normalizedItems().find((item) => item.value === selectedValue())?.id,
  )
  const tabbableItemId = createMemo(() => {
    const selectedId = selectedItemId()
    const selectedItem = normalizedItems().find((item) => item.id === selectedId)
    if (selectedItem && !selectedItem.disabled && !field.disabled()) {
      return selectedId
    }

    return normalizedItems().find((item) => !item.disabled && !field.disabled())?.id
  })

  createEffect(
    on(tabbableItemId, (itemId) => {
      field.setControlRef(itemId ? inputRefs.get(itemId) : undefined)
    }),
  )
  const groupAriaAttrs = createMemo(() => field.ariaAttrs())

  function isSelected(item: NormalizedRadioGroupItem): boolean {
    return item.id === selectedItemId()
  }

  function syncInputCheckedState(): void {
    for (const item of normalizedItems()) {
      const input = inputRefs.get(item.id)
      if (input) {
        input.checked = isSelected(item)
      }
    }
  }

  createEffect(
    on([() => merged.value, field.value], ([value, formValue]) => {
      if (value !== undefined && formValue !== value) {
        field.setFormValue(value)
      }
    }),
  )

  function onChange(nextValue: string): void {
    if (field.disabled() || readOnly() || nextValue === selectedValue()) {
      syncInputCheckedState()
      return
    }

    const value = merged.value
    if (value === undefined) {
      setSelectedValue(nextValue)
      field.setFormValue(nextValue)
    }

    merged.onChange?.(nextValue)

    if (value !== undefined) {
      field.setFormValue(merged.value ?? value)
    }

    syncInputCheckedState()
    field.emit('change')
    field.emit('input')
  }
  const { onNavigationKeyDown } = useSelectableCollectionNavigation<
    NormalizedRadioGroupItem,
    string
  >({
    items: normalizedItems,
    getValue: (item) => item.id,
    isDisabled: (item) => item.disabled || field.disabled(),
    loop: () => merged.loop,
    focusValue: (id) => inputRefs.get(id)?.focus(),
    onSelect: (id) => {
      const item = normalizedItems().find((candidate) => candidate.id === id)
      if (item) {
        onChange(item.value)
      }
    },
  })

  function onItemKeyDown(event: KeyboardEvent, item: NormalizedRadioGroupItem): void {
    if (
      field.disabled() ||
      readOnly() ||
      item.disabled ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    ) {
      return
    }

    const key = event.key === 'Spacebar' ? ' ' : event.key
    if (key === 'Enter') {
      return
    }

    if (key === ' ') {
      event.preventDefault()
      if (!event.repeat) {
        pressedSpaceItemId = item.id
      }
      return
    }

    onNavigationKeyDown(event, item.id, orientation())
  }

  function onItemKeyUp(event: KeyboardEvent, item: NormalizedRadioGroupItem): void {
    const key = event.key === 'Spacebar' ? ' ' : event.key
    if (key !== ' ' || pressedSpaceItemId !== item.id) {
      return
    }

    pressedSpaceItemId = undefined
    if (
      field.disabled() ||
      readOnly() ||
      item.disabled ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    ) {
      return
    }

    event.preventDefault()
    onChange(item.value)
  }

  onMount(() => {
    for (const item of normalizedItems()) {
      const input = inputRefs.get(item.id)
      if (input) {
        input.defaultChecked = isSelected(item)
      }
    }
  })

  useFormReset(
    () => groupEl?.closest('form'),
    () => {
      const value = merged.value
      const nextValue = value ?? initialDefaultValue
      if (value === undefined) {
        setSelectedValue(initialDefaultValue)
      }
      field.setFormValue(nextValue)
      syncInputCheckedState()
    },
  )

  const onGroupFocusIn: JSX.EventHandler<HTMLDivElement, FocusEvent> = (event) => {
    const { defaultPrevented } = callHandler(event, local.onFocusIn)
    if (defaultPrevented) {
      return
    }

    const relatedTarget = event.relatedTarget
    if (isNode(relatedTarget) && containsComposed(event.currentTarget, relatedTarget)) {
      return
    }

    field.emit('focus', event)
  }

  const onGroupFocusOut: JSX.EventHandler<HTMLDivElement, FocusEvent> = (event) => {
    const { defaultPrevented } = callHandler(event, local.onFocusOut)
    if (defaultPrevented) {
      return
    }

    const relatedTarget = event.relatedTarget
    if (isNode(relatedTarget) && containsComposed(event.currentTarget, relatedTarget)) {
      return
    }

    field.emit('blur', event)
  }

  return (
    <div
      ref={(element) => {
        groupEl = element
        callRef(local.ref, element)
      }}
      id={groupId()}
      role="radiogroup"
      aria-orientation={orientation()}
      data-slot="radio-group"
      {...dataAttrs}
      {...groupAriaAttrs()}
      {...rest}
      {...resolved.styles.root}
      onFocusIn={onGroupFocusIn}
      onFocusOut={onGroupFocusOut}
    >
      <For each={normalizedItems()}>
        {(item) => {
          const disabled = createMemo(() => item.disabled || field.disabled())
          const selected = createMemo(() => isSelected(item))

          onCleanup(() => {
            const input = inputRefs.get(item.id)
            const shouldRestoreFocus =
              input !== undefined && getActiveElement(input.ownerDocument) === input
            inputRefs.delete(item.id)

            if (shouldRestoreFocus) {
              // oxlint-disable-next-line subf/solid-reactivity -- The replacement tab stop exists after For reconciles.
              queueMicrotask(() => inputRefs.get(tabbableItemId() ?? '')?.focus())
            }
          })

          return (
            <Dynamic
              component={variant() === 'list' ? 'div' : 'label'}
              id={item.id}
              data-slot="radio-group-item"
              {...radioGroupDataAttributes.item({
                checked: selected,
                disabled,
              })}
              {...resolved.styles.item}
            >
              <div data-slot="radio-group-container" {...resolved.styles.container}>
                <HiddenInput
                  ref={(element) => {
                    inputRefs.set(item.id, element)
                  }}
                  id={item.inputId}
                  type="radio"
                  name={field.name()}
                  value={item.value}
                  checked={selected()}
                  required={field.required()}
                  disabled={disabled()}
                  readonly={readOnly()}
                  aria-required={field.required() || undefined}
                  aria-disabled={disabled() || undefined}
                  aria-readonly={readOnly() || undefined}
                  aria-labelledby={item.label ? item.labelId : undefined}
                  aria-describedby={
                    [item.descriptionId, groupAriaAttrs()['aria-describedby']]
                      .filter(Boolean)
                      .join(' ') || undefined
                  }
                  tabIndex={item.id === tabbableItemId() ? 0 : -1}
                  class="peer"
                  data-slot="radio-group-input"
                  onChange={(event) => {
                    event.stopPropagation()
                    onChange(item.value)
                    syncInputCheckedState()
                  }}
                  onKeyDown={(event) => {
                    onItemKeyDown(event, item)
                  }}
                  onKeyUp={(event) => onItemKeyUp(event, item)}
                  onBlur={() => {
                    if (pressedSpaceItemId === item.id) {
                      pressedSpaceItemId = undefined
                    }
                  }}
                />

                <div
                  data-slot="radio-group-control"
                  class={cn(resolved.styles.control.class, indicator() === 'hidden' && 'sr-only')}
                  style={resolved.styles.control.style}
                  {...radioGroupDataAttributes.control({
                    checked: selected,
                    invalid: field.invalid,
                    disabled,
                    readonly: readOnly,
                    required: field.required,
                  })}
                >
                  <Show when={selected()}>
                    <div
                      data-slot="radio-group-indicator"
                      {...resolved.styles.indicator}
                      {...radioGroupDataAttributes.indicator({ checked: selected })}
                    />
                  </Show>
                </div>
              </div>

              <Show when={item.label || item.description}>
                <div data-slot="radio-group-wrapper" {...resolved.styles.wrapper}>
                  <Show when={item.label}>
                    <Show
                      when={variant() === 'list'}
                      fallback={
                        <p
                          id={item.labelId}
                          data-slot="radio-group-label"
                          {...resolved.styles.label}
                        >
                          {item.label}
                        </p>
                      }
                    >
                      <label
                        id={item.labelId}
                        for={item.inputId}
                        data-slot="radio-group-label"
                        {...resolved.styles.label}
                      >
                        {item.label}
                      </label>
                    </Show>
                  </Show>

                  <Show when={item.description}>
                    <p
                      id={item.descriptionId}
                      data-slot="radio-group-description"
                      {...resolved.styles.description}
                    >
                      {item.description}
                    </p>
                  </Show>
                </div>
              </Show>
            </Dynamic>
          )
        }}
      </For>
    </div>
  )
}
