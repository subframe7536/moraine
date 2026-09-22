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
  untrack,
} from 'solid-js'

import { createStyles } from '../../provider'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { useId } from '../../shared/utils'
import { Checkbox } from '../checkbox'
import type { CheckboxProps } from '../checkbox/checkbox.types'
import { useFormField, useFieldContext } from '../field/field-context'
import { useFormReset } from '../shared/use-form-reset'

import { checkboxGroupDataAttributes, checkboxGroupRecipe } from './checkbox-group.recipe'
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
  const themeField = useFieldContext()
  const resolved = createStyles(checkboxGroupRecipe, local, {
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
  const initialDefaultValue = untrack(() =>
    Array.isArray(merged.defaultValue) ? merged.defaultValue.slice() : [],
  )
  const [selectedValues, setSelectedValues] = useControllableValue<string[]>({
    value: () => (Array.isArray(merged.value) ? merged.value : undefined),
    defaultValue: () => initialDefaultValue,
  })

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
      focus: true,
      defaultId: groupId(),
      initialValue: initialDefaultValue,
    }),
  )

  let fieldsetEl: HTMLFieldSetElement | undefined

  createEffect(() => {
    items().map((item) => (typeof item === 'string' ? false : item.disabled))
    field.disabled()
    let cancelled = false

    queueMicrotask(() => {
      if (cancelled) {
        return
      }
      field.setControlRef(
        fieldsetEl?.querySelector<HTMLElement>('[data-slot="control"]:not(:disabled)') ?? undefined,
      )
    })

    onCleanup(() => {
      cancelled = true
    })
  })

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
    const value = merged.value
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

    setSelectedValues(nextValues)

    field.setFormValue(nextValues.slice())
    merged.onChange?.(nextValues.slice())
    field.emit('change')
    field.emit('input')
  }

  useFormReset(
    () => fieldsetEl?.closest('form'),
    () => {
      setSelectedValues(initialDefaultValue.slice())
      field.setFormValue(selectedValues().slice())
    },
  )

  function isVisualControl(
    fieldset: HTMLFieldSetElement,
    target: EventTarget | null,
  ): target is HTMLElement {
    const HTMLElement = fieldset.ownerDocument.defaultView?.HTMLElement
    return (
      HTMLElement !== undefined &&
      target instanceof HTMLElement &&
      target.matches('[data-slot="control"]')
    )
  }

  function isFocusWithinFieldset(
    fieldset: HTMLFieldSetElement,
    target: EventTarget | null,
  ): boolean {
    const Node = fieldset.ownerDocument.defaultView?.Node
    return Node !== undefined && target instanceof Node && fieldset.contains(target)
  }

  function onFieldsetFocusIn(event: FocusEvent): void {
    const fieldset = event.currentTarget as HTMLFieldSetElement
    if (!isVisualControl(fieldset, event.target)) {
      return
    }
    if (isFocusWithinFieldset(fieldset, event.relatedTarget)) {
      return
    }

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

    field.emit('blur', event)
  }

  return (
    <div
      {...rest}
      id={`${groupId()}-root`}
      data-slot="root"
      {...checkboxGroupDataAttributes.root({
        disabled: field.disabled,
        readonly: () => merged.readOnly,
        required: field.required,
        invalid: field.invalid,
      })}
      {...resolved.styles.root}
    >
      <fieldset
        ref={(element) => {
          fieldsetEl = element
        }}
        id={groupId()}
        data-slot="fieldset"
        disabled={field.disabled()}
        onFocusIn={onFieldsetFocusIn}
        onFocusOut={onFieldsetFocusOut}
        aria-labelledby={
          field.ariaAttrs()['aria-labelledby'] ?? (legend() ? legendId() : undefined)
        }
        {...resolved.styles.fieldset}
        {...field.ariaAttrs()}
      >
        <Show when={legend()}>
          <legend
            id={legendId()}
            data-slot="legend"
            {...checkboxGroupDataAttributes.legend({ required: field.required })}
            {...resolved.styles.legend}
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
                fieldBind={false}
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
                  root: resolved.styles.item.class,
                  container: resolved.styles.container.class,
                  control: resolved.styles.control.class,
                  indicator: resolved.styles.indicator.class,
                  icon: resolved.styles.icon.class,
                  wrapper: resolved.styles.wrapper.class,
                  label: resolved.styles.label.class,
                  description: resolved.styles.description.class,
                }}
                styles={{
                  root: resolved.styles.item.style,
                  container: resolved.styles.container.style,
                  control: resolved.styles.control.style,
                  indicator: resolved.styles.indicator.style,
                  icon: resolved.styles.icon.style,
                  wrapper: resolved.styles.wrapper.style,
                  label: resolved.styles.label.style,
                  description: resolved.styles.description.style,
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
