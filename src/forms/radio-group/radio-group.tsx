import type { JSX } from 'solid-js'
import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  onMount,
  splitProps,
  untrack,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { HiddenInput } from '../../shared/hidden-input.tsx'
import { resolveComponentStyle, useMoraineConfig } from '../../shared/provider/index.ts'
import { TEXT_SIZE_VARIANT } from '../../shared/recipe-common.class.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { useSelectableCollectionNavigation } from '../../shared/use-selectable-collection-navigation.ts'
import { callRef, cn, useId } from '../../shared/utils.ts'
import { useFormField } from '../form/form-context.ts'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
  FormValueOptions,
} from '../shared/form-options.ts'
import { useFormReset } from '../shared/use-form-reset.ts'

import type { RadioGroupVariantProps } from './radio-group.class.ts'
import { radioGroupItemVariants, radioGroupRecipe } from './radio-group.class.ts'

export namespace RadioGroupT {
  export interface Slot<T = unknown> {
    /**
     * Radio group container that owns selection state and layout.
     */
    root?: T

    /** Wrapper for one radio option. */
    item?: T

    /** Visible radio control for an individual option. */
    control?: T

    /** Vertical alignment wrapper for the radio control. */
    container?: T

    /** Selected-state layer inside an option control. */
    indicator?: T

    /** Inner layout wrapper used by grouped radio variants. */
    wrapper?: T

    /** Primary label text for an option. */
    label?: T

    /** Supporting description for an option. */
    description?: T
  }

  export type Variant = RadioGroupVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  /**
   * A radio item object.
   */
  export interface Item {
    /**
     * Value of the radio item.
     */
    value?: string

    /**
     * Label for the radio item.
     */
    label?: JSX.Element

    /**
     * Description for the radio item.
     */
    description?: JSX.Element

    /**
     * Whether the item is disabled.
     */
    disabled?: boolean
  }

  /**
   * Base props for the RadioGroup component.
   */
  export interface Base
    extends
      FormIdentityOptions,
      FormValueOptions<string>,
      FormRequiredOption,
      FormDisableOption,
      FormReadOnlyOption {
    /**
     * The orientation of the radio group.
     * @default 'vertical'
     */
    orientation?: 'horizontal' | 'vertical'

    /**
     * Array of items to render in the group.
     */
    items?: (string | Item)[]

    /**
     * Callback when the selected value changes.
     */
    onChange?: (value: string) => void
  }

  /**
   * Props for the RadioGroup component.
   */
  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>
}

/**
 * Props for the RadioGroup component.
 */
export interface RadioGroupProps extends RadioGroupT.Props {}

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
    'onChange',
    'variant',
    'indicator',
    'size',
    'classes',
    'styles',
    'class',
    'style',
    'ref',
  ])

  const config = useMoraineConfig()
  const provider = () => config().radioGroup

  const merged = mergeProps(
    {
      orientation: 'vertical' as const,
      variant: 'list' as const,
      indicator: 'start' as const,
    },
    () => provider()?.variants,
    local,
  )

  const items = createMemo(() => merged.items ?? [])
  const orientation = createMemo(() => merged.orientation ?? 'vertical')
  const variant = createMemo(() => merged.variant ?? 'list')
  const indicator = createMemo(() => merged.indicator ?? 'start')
  const itemVariant = createMemo(() => {
    const value = variant()
    return value === 'list' ? undefined : value
  })
  const visibleIndicator = createMemo(() => {
    const value = indicator()
    return value === 'hidden' ? undefined : value
  })
  const controlledValue = createMemo(() => merged.value)
  const initialDefaultValue = untrack(() => merged.defaultValue ?? '')
  const readOnly = createMemo(() => Boolean(merged.readOnly))

  const groupId = useId(() => merged.id, 'radio-group')
  const field = useFormField(
    () => ({
      id: merged.id,
      name: merged.name,
      size: merged.size ?? undefined,
      disabled: merged.disabled,
      required: local.required,
      readOnly: readOnly(),
    }),
    () => ({
      bind: false,
      defaultId: groupId(),
      defaultSize: 'md',
      initialValue: initialDefaultValue,
    }),
  )

  const slots = createMemo(() =>
    radioGroupRecipe({
      orientation: orientation(),
      size: field.size(),
      variant: itemVariant(),
      indicator: visibleIndicator(),
      tableOrientation: variant() === 'table' ? orientation() : undefined,
    }),
  )

  const resolved = resolveComponentStyle({
    get slots() {
      return slots()
    },
    get provider() {
      return provider()
    },
    get instance() {
      return {
        class: local.class,
        classes: local.classes,
        style: local.style,
        styles: local.styles,
      }
    },
  })

  const [uncontrolledValue, setUncontrolledValue] = createSignal(initialDefaultValue)
  const selectedValue = createMemo(() => {
    const value = controlledValue()
    if (value !== undefined) {
      return value
    }

    const fieldValue = field.value()
    return typeof fieldValue === 'string' ? fieldValue : uncontrolledValue()
  })
  const inputRefs = new Map<string, HTMLInputElement>()
  let groupEl: HTMLDivElement | undefined
  let pressedSpaceItemId: string | undefined
  const dataAttrs = createMemo(() => ({
    'data-invalid': field.invalid() ? '' : undefined,
    'data-disabled': field.disabled() ? '' : undefined,
    'data-readonly': readOnly() ? '' : undefined,
    'data-required': field.required() ? '' : undefined,
  }))

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

  createEffect(() => {
    const value = controlledValue()
    if (value !== undefined && field.value() !== value) {
      field.setFormValue(value)
    }
  })

  function onChange(nextValue: string): void {
    if (field.disabled() || readOnly() || nextValue === selectedValue()) {
      syncInputCheckedState()
      return
    }

    const value = controlledValue()
    if (value === undefined) {
      setUncontrolledValue(nextValue)
      field.setFormValue(nextValue)
    }

    merged.onChange?.(nextValue)

    if (value !== undefined) {
      field.setFormValue(controlledValue() ?? value)
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
    loop: () => true,
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
      const value = controlledValue()
      const nextValue = value ?? initialDefaultValue
      if (value === undefined) {
        setUncontrolledValue(initialDefaultValue)
      }
      field.setFormValue(nextValue)
      syncInputCheckedState()
    },
  )

  return (
    <div
      ref={(element) => {
        groupEl = element
        callRef(local.ref, element)
      }}
      id={groupId()}
      role="radiogroup"
      aria-orientation={orientation()}
      data-slot="root"
      style={resolved.rootStyle()}
      class={cn(resolved.rootClass(), variant() !== 'table' && 'gap-2')}
      {...dataAttrs()}
      {...groupAriaAttrs()}
      {...rest}
    >
      <For each={normalizedItems()}>
        {(item) => {
          const disabled = createMemo(() => item.disabled || field.disabled())
          const selected = createMemo(() => isSelected(item))

          onCleanup(() => {
            const input = inputRefs.get(item.id)
            const shouldRestoreFocus =
              typeof document !== 'undefined' &&
              input !== undefined &&
              document.activeElement === input
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
              data-slot="item"
              data-checked={variant() === 'list' ? undefined : selected() ? '' : undefined}
              data-disabled={disabled() ? '' : undefined}
              style={resolved.slotStyle('item')}
              class={cn(
                radioGroupItemVariants({
                  size: field.size(),
                  variant: itemVariant(),
                  indicator: visibleIndicator(),
                  tableOrientation: variant() === 'table' ? orientation() : undefined,
                }),
                resolved.slotClass('item'),
              )}
            >
              <div
                data-slot="container"
                style={resolved.slotStyle('container')}
                class={resolved.slotClass('container')}
              >
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
                  readOnly={readOnly()}
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
                  data-slot="input"
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
                  data-slot="control"
                  style={resolved.slotStyle('control')}
                  class={cn(resolved.slotClass('control'), indicator() === 'hidden' && 'sr-only')}
                  data-checked={selected() ? '' : undefined}
                  data-invalid={field.invalid() ? '' : undefined}
                  data-disabled={disabled() ? '' : undefined}
                  data-readonly={readOnly() ? '' : undefined}
                  data-required={field.required() ? '' : undefined}
                >
                  <Show when={selected()}>
                    <div
                      data-slot="indicator"
                      style={resolved.slotStyle('indicator')}
                      class={resolved.slotClass('indicator')}
                      data-checked={selected() ? '' : undefined}
                      data-invalid={field.invalid() ? '' : undefined}
                      data-disabled={disabled() ? '' : undefined}
                      data-readonly={readOnly() ? '' : undefined}
                      data-required={field.required() ? '' : undefined}
                    />
                  </Show>
                </div>
              </div>

              <Show when={item.label || item.description}>
                <div
                  data-slot="wrapper"
                  style={resolved.slotStyle('wrapper')}
                  class={resolved.slotClass('wrapper')}
                >
                  <Show when={item.label}>
                    <Show
                      when={variant() === 'list'}
                      fallback={
                        <p
                          id={item.labelId}
                          data-slot="label"
                          style={resolved.slotStyle('label')}
                          class={cn(
                            'text-foreground font-medium block',
                            resolved.slotClass('label'),
                          )}
                        >
                          {item.label}
                        </p>
                      }
                    >
                      <label
                        id={item.labelId}
                        for={item.inputId}
                        data-slot="label"
                        style={resolved.slotStyle('label')}
                        class={cn('text-foreground font-medium block', resolved.slotClass('label'))}
                      >
                        {item.label}
                      </label>
                    </Show>
                  </Show>

                  <Show when={item.description}>
                    <p
                      id={item.descriptionId}
                      data-slot="description"
                      style={resolved.slotStyle('description')}
                      class={cn(
                        TEXT_SIZE_VARIANT[field.size()],
                        'text-muted-foreground leading-normal',
                        resolved.slotClass('description'),
                      )}
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
