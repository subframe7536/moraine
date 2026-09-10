import type { JSX } from 'solid-js'
import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  on,
  splitProps,
  untrack,
} from 'solid-js'

import { createComponentStyles } from '../../shared/provider'
import { useId } from '../../shared/utils'
import { Checkbox } from '../checkbox'
import type { CheckboxProps } from '../checkbox/checkbox.types'
import { useFormField, useFormFieldContext } from '../form/form-context'
import { useFormReset } from '../shared/use-form-reset'

import type { CheckboxGroupProps, CheckboxGroupT } from './checkbox-group.types'

interface NormalizedCheckboxGroupItem<TTrue = boolean, TFalse = boolean> {
  value: string
  label?: JSX.Element
  description?: JSX.Element
  disabled: boolean
  indeterminate?: CheckboxProps<TTrue, TFalse>['indeterminate']
  checkedIcon?: CheckboxProps<TTrue, TFalse>['checkedIcon']
  indeterminateIcon?: CheckboxProps<TTrue, TFalse>['indeterminateIcon']
}

function getCheckboxGroupItemValue<TTrue = boolean, TFalse = boolean>(
  item: string | CheckboxGroupT.Item<TTrue, TFalse>,
  index: number,
): string {
  return typeof item === 'string' ? item : (item.value ?? String(index))
}

function isCheckboxGroupItemDisabled<TTrue = boolean, TFalse = boolean>(
  item: string | CheckboxGroupT.Item<TTrue, TFalse>,
): boolean {
  return typeof item !== 'string' && Boolean(item.disabled)
}

function isCheckboxGroupItemIndeterminate<TTrue = boolean, TFalse = boolean>(
  item: string | CheckboxGroupT.Item<TTrue, TFalse>,
): boolean {
  return typeof item !== 'string' && Boolean(item.indeterminate)
}

function normalizeCheckboxGroupItem<TTrue = boolean, TFalse = boolean>(
  item: string | CheckboxGroupT.Item<TTrue, TFalse>,
  index: number,
): NormalizedCheckboxGroupItem<TTrue, TFalse> {
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

/** Multi-select checkbox group with card, list, and table layout variants. */
export function CheckboxGroup<TTrue = boolean, TFalse = boolean>(
  props: CheckboxGroupProps<TTrue, TFalse>,
): JSX.Element {
  const [local, rest] = splitProps(props, [
    'id',
    'name',
    'value',
    'defaultValue',
    'required',
    'disabled',
    'readOnly',
    'legend',
    'items',
    'indicator',
    'checkedIcon',
    'indeterminateIcon',
    'onChange',
    'variant',
    'orientation',
    'size',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const themeField = useFormFieldContext()
  const resolved = createComponentStyles('checkboxGroup', local, {
    inheritedVariants: () => ({ size: themeField?.size }),
  })

  const merged = mergeProps(
    {
      defaultValue: [] as string[],
    },

    local,
  )
  const legend = createMemo(() => merged.legend)
  const items = createMemo(() => merged.items ?? [])
  const controlledValue = createMemo(() => merged.value)
  const initialDefaultValue = untrack(() =>
    Array.isArray(merged.defaultValue) ? merged.defaultValue.slice() : [],
  )

  const groupId = useId(() => merged.id, 'checkbox-group')
  const field = useFormField(
    () => ({
      id: merged.id,
      name: merged.name,
      size: resolved.variants.size,
      disabled: merged.disabled,
      required: local.required,
    }),
    () => ({
      bind: false,
      defaultId: groupId(),
      initialValue: initialDefaultValue,
    }),
  )

  const [uncontrolledValue, setUncontrolledValue] = createSignal<string[]>(initialDefaultValue)
  let fieldsetEl: HTMLFieldSetElement | undefined

  const selectedValues = createMemo(() => controlledValue() ?? uncontrolledValue())
  const legendId = createMemo(() => `${groupId()}-legend`)
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
  const hasCheckedItem = createMemo(() => {
    const values = selectedValues()

    return items().some((sourceItem, index) => {
      return (
        !isCheckboxGroupItemIndeterminate(sourceItem) &&
        values.includes(getCheckboxGroupItemValue(sourceItem, index))
      )
    })
  })
  const hasIndeterminateItem = createMemo(() =>
    items().some((sourceItem) => isCheckboxGroupItemIndeterminate(sourceItem)),
  )
  const checkedIcon = createMemo(() => (hasCheckedItem() ? merged.checkedIcon : undefined))
  const indeterminateIcon = createMemo(() =>
    hasIndeterminateItem() ? merged.indeterminateIcon : undefined,
  )

  const controlledValueSnapshot = () => {
    const value = controlledValue()
    return Array.isArray(value) ? value.slice() : value
  }

  createEffect(
    on([field.path, controlledValueSnapshot], ([, value]) => {
      if (value !== undefined) {
        field.setFormValue(Array.isArray(value) ? value : [])
      }
    }),
  )

  function onItemCheckedChange(value: string, checked: boolean): void {
    const currentValues = selectedValues()
    const isSelected = currentValues.includes(value)

    if (checked === isSelected) {
      return
    }

    const nextValues = checked
      ? currentValues.concat(value)
      : currentValues.filter((itemValue) => itemValue !== value)

    if (controlledValue() === undefined) {
      setUncontrolledValue(nextValues)
    }

    field.setFormValue(nextValues.slice())
    merged.onChange?.(nextValues.slice())
    field.emit('change')
    field.emit('input')
  }

  useFormReset(
    () => fieldsetEl?.closest('form'),
    () => {
      const value = controlledValue()
      const nextValue = value ?? initialDefaultValue

      if (value === undefined) {
        setUncontrolledValue(initialDefaultValue.slice())
      }

      field.setFormValue(Array.isArray(nextValue) ? nextValue.slice() : [])
    },
  )

  return (
    <div id={`${groupId()}-root`} data-slot="root" {...rest} {...resolved.root}>
      <fieldset
        ref={(element) => {
          fieldsetEl = element
        }}
        id={groupId()}
        data-slot="fieldset"
        disabled={field.disabled()}
        aria-labelledby={
          field.ariaAttrs()['aria-labelledby'] ?? (legend() ? legendId() : undefined)
        }
        {...resolved.slot('fieldset')}
        {...field.ariaAttrs()}
      >
        <Show when={legend()}>
          <legend
            id={legendId()}
            data-slot="legend"
            data-required={field.required() ? '' : undefined}
            {...resolved.slot('legend')}
          >
            {legend()}
          </legend>
        </Show>

        <For each={items()}>
          {(sourceItem, index) => {
            const itemId = useId(undefined, 'checkbox-group-item')
            const item = createMemo(() => normalizeCheckboxGroupItem(sourceItem, index()))

            return (
              <Checkbox
                id={itemId()}
                name={field.name()}
                formFieldBind={false}
                checked={selectedValues().includes(item().value)}
                defaultChecked={initialDefaultValue.includes(item().value)}
                value={item().value}
                label={item().label}
                description={item().description}
                disabled={item().disabled || field.disabled()}
                readOnly={merged.readOnly}
                indeterminate={item().indeterminate}
                required={
                  field.required() && !hasEnabledSelection() && index() === requiredOwnerIndex()
                }
                size={resolved.variants.size}
                variant={resolved.variants.variant === 'table' ? 'card' : resolved.variants.variant}
                indicator={merged.indicator}
                checkedIcon={item().checkedIcon ?? checkedIcon()}
                indeterminateIcon={item().indeterminateIcon ?? indeterminateIcon()}
                classes={{
                  root: resolved.slot('item').class,
                  container: resolved.slot('container').class,
                  control: resolved.slot('control').class,
                  indicator: resolved.slot('indicator').class,
                  icon: resolved.slot('icon').class,
                  wrapper: resolved.slot('wrapper').class,
                  label: resolved.slot('label').class,
                  description: resolved.slot('description').class,
                }}
                styles={{
                  root: resolved.slot('item').style,
                  container: resolved.slot('container').style,
                  control: resolved.slot('control').style,
                  indicator: resolved.slot('indicator').style,
                  icon: resolved.slot('icon').style,
                  wrapper: resolved.slot('wrapper').style,
                  label: resolved.slot('label').style,
                  description: resolved.slot('description').style,
                }}
                onChange={(checked) => onItemCheckedChange(item().value, checked)}
              />
            )
          }}
        </For>
      </fieldset>
    </div>
  )
}
