import type { JSX } from '@solidjs/web'
import { DEV, For, Show, createEffect, createMemo, untrack, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { callHandler, createId, mergeDefinedProps } from '../../shared/utils'
import { CheckboxCore } from '../checkbox/checkbox'
import type { CheckboxProps } from '../checkbox/checkbox.types'
import { useFormField, useFieldContext } from '../field/field-context'
import { useFormReset } from '../shared/form/use-form-reset'
import { useFormValue } from '../shared/form/use-form-value'

import { checkboxGroupDataAttributes, checkboxGroupRecipe } from './checkbox-group.recipe'
import type { CheckboxGroupProps, CheckboxGroupT } from './checkbox-group.types'
interface NormalizedCheckboxGroupItem {
  value: string
  label?: JSX.Element
  description?: JSX.Element
  disabled: boolean
  indeterminate?: boolean
  checkedIcon?: CheckboxProps['checkedIcon']
  indeterminateIcon?: CheckboxProps['indeterminateIcon']
}

function getCheckboxGroupItemValue(item: string | CheckboxGroupT.Item, index: number): string {
  return typeof item === 'string' ? item : (item.value ?? String(index))
}

function isCheckboxGroupItemDisabled(item: string | CheckboxGroupT.Item): boolean {
  return typeof item !== 'string' && Boolean(item.disabled)
}

function isVisualControl(
  fieldset: HTMLFieldSetElement,
  target: EventTarget | null,
): target is HTMLElement {
  const HTMLElement = fieldset.ownerDocument.defaultView?.HTMLElement
  return (
    HTMLElement !== undefined &&
    target instanceof HTMLElement &&
    target.matches('[data-slot="checkbox-control"]')
  )
}

function isFocusWithinFieldset(fieldset: HTMLFieldSetElement, target: EventTarget | null): boolean {
  const Node = fieldset.ownerDocument.defaultView?.Node
  return Node !== undefined && target instanceof Node && fieldset.contains(target)
}

function normalizeCheckboxGroupItem(
  item: string | CheckboxGroupT.Item,
  index: number,
): NormalizedCheckboxGroupItem {
  if (typeof item === 'string') {
    return {
      value: item,
      label: item,
      disabled: false,
    }
  }

  return {
    value: getCheckboxGroupItemValue(item, index),
    label: item.label,
    description: item.description,
    disabled: Boolean(item.disabled),
    indeterminate: item.indeterminate,
    checkedIcon: item.checkedIcon,
    indeterminateIcon: item.indeterminateIcon,
  }
}

/**
 * Group of checkboxes whose value is the array of selected item values, with card, list, and table
 * layout variants. Use it when several choices submit as one array, individual `Checkbox` controls
 * when the fields are independent, and `RadioGroup` when only one option may be selected. Pair
 * `value` with `onValueChange` for controlled selection or use `defaultValue`; each checkbox keeps
 * its own tab stop, so the group does not use radio-style arrow navigation.
 *
 * @example
 * ```tsx
 * import { createSignal, merge, For, omit } from 'solid-js'
 * import { CheckboxGroup } from 'moraine'
 *
 * const [channels, setChannels] = createSignal<string[]>(['email'])
 *
 * <CheckboxGroup
 *   legend="Notification channels"
 *   items={[
 *     { value: 'email', label: 'Email' },
 *     { value: 'sms', label: 'SMS' },
 *   ]}
 *   value={channels()}
 *   onValueChange={setChannels}
 * />
 * ```
 */
export function CheckboxGroup(props: CheckboxGroupProps): JSX.Element {
  const rest = omit(
    props,
    'id',
    'name',
    'form',
    'value',
    'defaultValue',
    'required',
    'disabled',
    'readOnly',
    'legend',
    'items',
    'indicatorPosition',
    'checkedIcon',
    'indeterminateIcon',
    'onValueChange',
    'variant',
    'orientation',
    'size',
    'classes',
    'styles',
    'class',
    'style',
    'onFocus',
    'onBlur',
  )
  const themeField = useFieldContext()
  const {
    slots: { root: rootSlot, fieldset: fieldsetSlot, legend: legendSlot },
    variants,
    overrides,
  } = useRecipe(checkboxGroupRecipe, props, {
    data: {
      root: checkboxGroupDataAttributes.root(() => ({
        disabled: field.disabled,
        readonly: field.readOnly,
        required: field.required,
        invalid: field.invalid,
      })),
      legend: checkboxGroupDataAttributes.legend(() => ({ required: field.required })),
    },
    context: () => ({ variants: { size: themeField?.size } }),
  })

  const merged = mergeDefinedProps(
    {
      defaultValue: [] as Array<string>,
    },

    props,
  )
  const legend = createMemo(() => merged.legend)
  const items = createMemo(() => {
    const list = merged.items ?? []
    if (DEV) {
      const values = list.map((item, index) => getCheckboxGroupItemValue(item, index))
      for (const value of new Set(values.filter((v, i) => values.indexOf(v) !== i))) {
        console.warn(`[moraine] CheckboxGroup received duplicate item value "${value}".`)
      }
    }
    return list
  })
  const initialDefaultValue = untrack(() =>
    Array.isArray(merged.defaultValue) ? merged.defaultValue.slice() : [],
  )
  const groupId = createId(() => merged.id, 'checkbox-group')
  const field = useFormField(
    {
      get id() {
        return merged.id
      },
      get name() {
        return merged.name
      },
      get size() {
        return variants.size
      },
      get disabled() {
        return merged.disabled
      },
      get readOnly() {
        return merged.readOnly
      },
      get required() {
        return props.required
      },
    },
    {
      bind: false,
      focus: true,
      get defaultId() {
        return groupId()
      },
      initialValue: initialDefaultValue,
    },
  )

  const [selectedValues, setSelectedValues, resetSelectedValues] = useFormValue<Array<string>>({
    value: () => (Array.isArray(merged.value) ? merged.value : undefined),
    defaultValue: () => initialDefaultValue,
    onValueChange: (val) => merged.onValueChange?.(val),
    field,
    isEqual: (a, b) => a.length === b.length && a.every((v, i) => v === b[i]),
  })

  let fieldsetEl: HTMLFieldSetElement | undefined

  createEffect(
    () => [items(), field.disabled()],
    () => {
      let cancelled = false

      queueMicrotask(() => {
        if (cancelled) {
          return
        }
        field.setControlRef(
          fieldsetEl?.querySelector<HTMLElement>('[data-slot="checkbox-control"]:not(:disabled)') ??
            undefined,
        )
      })

      return () => {
        cancelled = true
      }
    },
  )

  const legendId = () => `${groupId()}-legend`
  const requiredOwnerIndex = createMemo(() =>
    items().findIndex((item) => !isCheckboxGroupItemDisabled(item)),
  )
  const hasEnabledSelection = createMemo(() => {
    const values = selectedValues()

    return items().some((sourceItem, index) => {
      return (
        !isCheckboxGroupItemDisabled(sourceItem) &&
        values.includes(getCheckboxGroupItemValue(sourceItem, index))
      )
    })
  })
  function onItemCheckedChange(value: string, checked: boolean): void {
    const currentValues = selectedValues()
    const isSelected = currentValues.includes(value)

    if (checked === isSelected) {
      return
    }

    const nextValues = checked
      ? currentValues.concat(value)
      : currentValues.filter((itemValue) => itemValue !== value)

    setSelectedValues(nextValues)
  }

  useFormReset(
    () => fieldsetEl?.querySelector('input')?.form ?? fieldsetEl?.closest('form'),
    () => {
      resetSelectedValues()
    },
  )

  function onFieldsetFocusIn(event: FocusEvent): void {
    const fieldset = event.currentTarget as HTMLFieldSetElement
    if (!isVisualControl(fieldset, event.target)) {
      return
    }
    if (isFocusWithinFieldset(fieldset, event.relatedTarget)) {
      return
    }

    callHandler(event, props.onFocus)
    field.emit('focus', event)
  }

  function onFieldsetFocusOut(event: FocusEvent): void {
    const fieldset = event.currentTarget as HTMLFieldSetElement
    if (!isVisualControl(fieldset, event.target)) {
      return
    }
    if (isFocusWithinFieldset(fieldset, event.relatedTarget)) {
      return
    }

    callHandler(event, props.onBlur)
    field.emit('blur', event)
  }

  return (
    <div data-slot="checkbox-group" {...rootSlot} {...rest} id={`${groupId()}-root`}>
      <fieldset
        data-slot="checkbox-group-fieldset"
        {...fieldsetSlot}
        id={groupId()}
        disabled={field.disabled()}
        aria-labelledby={
          field.ariaAttrs()['aria-labelledby'] ?? (legend() ? legendId() : undefined)
        }
        {...field.ariaAttrs()}
        ref={(element) => {
          fieldsetEl = element
        }}
        onFocusIn={onFieldsetFocusIn}
        onFocusOut={onFieldsetFocusOut}
      >
        <Show when={legend()}>
          <legend id={legendId()} data-slot="checkbox-group-legend" {...legendSlot}>
            {legend()}
          </legend>
        </Show>

        <For each={items()}>
          {(sourceItem, index) => {
            const itemId = createId(undefined, 'checkbox-group-item')
            const item = createMemo(() => normalizeCheckboxGroupItem(sourceItem, index()))

            return (
              <CheckboxCore
                data-slot="checkbox-group-item"
                id={itemId()}
                name={field.name()}
                form={merged.form}
                bound={false}
                checked={
                  item().indeterminate ? 'indeterminate' : selectedValues().includes(item().value)
                }
                defaultChecked={initialDefaultValue.includes(item().value)}
                value={item().value}
                label={item().label}
                description={item().description}
                disabled={item().disabled || field.disabled()}
                readOnly={field.readOnly()}
                required={
                  field.required() && !hasEnabledSelection() && index() === requiredOwnerIndex()
                }
                size={variants.size}
                variant={variants.variant === 'table' ? 'card' : variants.variant}
                indicatorPosition={variants.indicatorPosition}
                checkedIcon={item().checkedIcon ?? merged.checkedIcon}
                indeterminateIcon={item().indeterminateIcon ?? merged.indeterminateIcon}
                {...overrides({
                  root: 'item',
                  container: 'container',
                  control: 'control',
                  indicator: 'indicator',
                  wrapper: 'wrapper',
                  label: 'label',
                  description: 'description',
                })}
                onCheckedChange={(checked) => onItemCheckedChange(item().value, checked)}
              />
            )
          }}
        </For>
      </fieldset>
    </div>
  )
}
