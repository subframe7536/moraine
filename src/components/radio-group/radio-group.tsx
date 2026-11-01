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

import { useRecipe } from '../../provider'
import { HiddenInput } from '../../shared/hidden-input'
import { createKeyDownHandler, createKeyUpHandler, normalizeKey } from '../../shared/keyboard'
import { createSelectableCollectionNavigation } from '../../shared/selectable-collection-navigation'
import { callHandler, callRef, createId } from '../../shared/utils'
import { PEER_CLASS } from '../../theme/recipe-common.recipe'
import type { Orientation } from '../../theme/style-types'
import { useFormField, useFieldContext } from '../field/field-context'
import { useFormReset } from '../shared/form/use-form-reset'
import { useFormValue } from '../shared/form/use-form-value'
import { containsComposed, getActiveElement, isNode } from '../shared/overlay/dom'

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
    'onValueChange',
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
  const {
    slots: {
      root: rootSlot,
      container: containerSlot,
      wrapper: wrapperSlot,
      label: labelSlot,
      description: descriptionSlot,
    },
    slotWith,
    variants,
  } = useRecipe(radioGroupRecipe, local, {
    data: {
      root: radioGroupDataAttributes.root(() => ({
        invalid: field.invalid,
        disabled: field.disabled,
        readonly: field.readOnly,
        required: field.required,
      })),
    },
    context: () => ({ variants: { size: themeField?.size } }),
  })
  const merged = mergeProps(
    {
      loop: true,
    },
    local,
    {
      get orientation(): Orientation {
        return variants.orientation ?? 'vertical'
      },
    },
  )

  const items = createMemo(() => merged.items ?? [])

  const initialDefaultValue = untrack(() => merged.defaultValue ?? '')

  const groupId = createId(() => merged.id, 'radio-group')
  const fieldProps = mergeProps(merged, {
    get readOnly() {
      return Boolean(merged.readOnly)
    },
  })
  const field = useFormField(fieldProps, {
    bind: false,
    focus: true,
    get defaultId() {
      return groupId()
    },
    initialValue: initialDefaultValue,
  })

  const [selectedValue, setSelectedValue, resetSelectedValue] = useFormValue<string>({
    value: () => merged.value,
    defaultValue: () => initialDefaultValue,
    onValueChange: (val) => merged.onValueChange?.(val),
    field,
  })
  const inputRefs = new Map<string, HTMLInputElement>()
  let groupEl: HTMLDivElement | undefined
  let pressedSpaceItemId: string | undefined

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

  function onChange(nextValue: string): void {
    if (field.disabled() || field.readOnly() || nextValue === selectedValue()) {
      syncInputCheckedState()
      return
    }

    setSelectedValue(nextValue)
    syncInputCheckedState()
  }
  const { onNavigationKeyDown } = createSelectableCollectionNavigation<
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

  const onItemKeyDown = createKeyDownHandler<HTMLInputElement, [NormalizedRadioGroupItem]>({
    disabled: (_event, item) => field.disabled() || field.readOnly() || item.disabled,
    ignoreModifiers: ['alt', 'ctrl', 'meta'],
    ignore: ['Enter'],
    keys: {
      ' ': (event, item) => {
        if (!event.repeat) {
          pressedSpaceItemId = item.id
        }
      },
    },
    onUnhandled: (event, item) => onNavigationKeyDown(event, item.id, merged.orientation),
  })

  const dispatchItemKeyUp = createKeyUpHandler<HTMLInputElement, [NormalizedRadioGroupItem]>({
    disabled: (_event, item) => field.disabled() || field.readOnly() || item.disabled,
    ignoreModifiers: ['alt', 'ctrl', 'meta'],
    keys: {
      ' ': (_event, item) => onChange(item.value),
    },
  })

  function onItemKeyUp(event: KeyboardEvent, item: NormalizedRadioGroupItem): void {
    if (normalizeKey(event.key) !== ' ' || pressedSpaceItemId !== item.id) {
      return
    }

    pressedSpaceItemId = undefined
    dispatchItemKeyUp(event, item)
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
      resetSelectedValue()
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
      role="radiogroup"
      data-slot="radio-group"
      aria-orientation={merged.orientation}
      {...rootSlot}
      {...rest}
      id={groupId()}
      {...field.ariaAttrs()}
      ref={(element) => {
        groupEl = element
        callRef(local.ref, element)
      }}
      onFocusIn={onGroupFocusIn}
      onFocusOut={onGroupFocusOut}
    >
      <For each={normalizedItems()}>
        {(item) => {
          const disabled = createMemo(() => item.disabled || field.disabled())
          const selected = createMemo(() => isSelected(item))
          const itemSlot = slotWith('item', {
            data: radioGroupDataAttributes.item({
              checked: selected,
              disabled,
            }),
          })
          const controlSlot = slotWith('control', {
            data: radioGroupDataAttributes.control({
              checked: selected,
              invalid: field.invalid,
              disabled,
              readonly: field.readOnly,
              required: field.required,
            }),
          })
          const indicatorSlot = slotWith('indicator', {
            data: radioGroupDataAttributes.indicator({ checked: selected }),
          })

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
              component={variants.variant === 'list' ? 'div' : 'label'}
              id={item.id}
              data-slot="radio-group-item"
              {...itemSlot}
            >
              <div data-slot="radio-group-container" {...containerSlot}>
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
                  readonly={field.readOnly()}
                  aria-required={field.required() || undefined}
                  aria-disabled={disabled() || undefined}
                  aria-readonly={field.readOnly() || undefined}
                  aria-labelledby={item.label ? item.labelId : undefined}
                  aria-describedby={
                    [item.descriptionId, field.ariaAttrs()['aria-describedby']]
                      .filter(Boolean)
                      .join(' ') || undefined
                  }
                  tabIndex={item.id === tabbableItemId() ? 0 : -1}
                  class={PEER_CLASS}
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

                <div data-slot="radio-group-control" {...controlSlot}>
                  <Show when={selected()}>
                    <div data-slot="radio-group-indicator" {...indicatorSlot} />
                  </Show>
                </div>
              </div>

              <Show when={item.label || item.description}>
                <div data-slot="radio-group-wrapper" {...wrapperSlot}>
                  <Show when={item.label}>
                    <Show
                      when={variants.variant === 'list'}
                      fallback={
                        <p id={item.labelId} data-slot="radio-group-label" {...labelSlot}>
                          {item.label}
                        </p>
                      }
                    >
                      <label
                        id={item.labelId}
                        for={item.inputId}
                        data-slot="radio-group-label"
                        {...labelSlot}
                      >
                        {item.label}
                      </label>
                    </Show>
                  </Show>

                  <Show when={item.description}>
                    <p
                      id={item.descriptionId}
                      data-slot="radio-group-description"
                      {...descriptionSlot}
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
