import type { JSX } from 'solid-js'
import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  splitProps,
  untrack,
} from 'solid-js'

import { resolveComponentStyle, useMoraineDesign } from '../../shared/provider/index.ts'
import { useId } from '../../shared/utils.ts'
import type { CheckboxProps } from '../checkbox/checkbox.types.ts'
import { Checkbox } from '../checkbox/index.ts'
import { useFormField } from '../form/form-context.ts'
import { useFormReset } from '../shared/use-form-reset.ts'

import type { CheckboxGroupProps, CheckboxGroupT } from './checkbox-group.types.ts'

export * from './checkbox-group.types.ts'

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

  const design = useMoraineDesign()
  const checkboxGroupDesign = () => design().checkboxGroup

  const merged = mergeProps(
    {
      orientation: 'vertical' as const,
      variant: 'list' as const,
      defaultValue: [] as string[],
    },
    () => checkboxGroupDesign()?.defaultVariants,
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
      size: merged.size,
      disabled: merged.disabled,
      required: local.required,
    }),
    () => ({
      bind: false,
      defaultId: groupId(),
      defaultSize: 'md',
      initialValue: initialDefaultValue,
    }),
  )

  const resolved = resolveComponentStyle({
    design: {
      get classes() {
        return checkboxGroupDesign()?.recipe({
          orientation: merged.orientation,
          size: field.size(),
          required: field.required(),
          variant: merged.variant,
          tableOrientation: merged.variant === 'table' ? merged.orientation : undefined,
        })
      },
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

  createEffect(() => {
    const value = controlledValue()

    if (value !== undefined) {
      field.setFormValue(Array.isArray(value) ? value.slice() : [])
    }
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
    <div id={`${groupId()}-root`} data-slot="root" {...rest} {...resolved.rootClassAndStyle()}>
      <fieldset
        ref={(element) => {
          fieldsetEl = element
        }}
        id={groupId()}
        data-slot="fieldset"
        disabled={field.disabled()}
        aria-labelledby={
          (field.ariaAttrs()['aria-labelledby'] as string | undefined) ??
          (legend() ? legendId() : undefined)
        }
        data-variant={merged.variant}
        {...resolved.slotClassAndStyle('fieldset')}
        {...field.ariaAttrs()}
      >
        <Show when={legend()}>
          <legend id={legendId()} data-slot="legend" {...resolved.slotClassAndStyle('legend')}>
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
                size={field.size()}
                variant={merged.variant === 'list' ? 'list' : 'card'}
                indicator={merged.indicator}
                checkedIcon={item().checkedIcon ?? checkedIcon()}
                indeterminateIcon={item().indeterminateIcon ?? indeterminateIcon()}
                classes={{
                  root: resolved.slotClass('item'),
                  container: resolved.slotClass('container'),
                  control: resolved.slotClass('control'),
                  indicator: resolved.slotClass('indicator'),
                  icon: resolved.slotClass('icon'),
                  wrapper: resolved.slotClass('wrapper'),
                  label: resolved.slotClass('label'),
                  description: resolved.slotClass('description'),
                }}
                styles={{
                  root: resolved.slotStyle('item'),
                  container: resolved.slotStyle('container'),
                  control: resolved.slotStyle('control'),
                  indicator: resolved.slotStyle('indicator'),
                  icon: resolved.slotStyle('icon'),
                  wrapper: resolved.slotStyle('wrapper'),
                  label: resolved.slotStyle('label'),
                  description: resolved.slotStyle('description'),
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
