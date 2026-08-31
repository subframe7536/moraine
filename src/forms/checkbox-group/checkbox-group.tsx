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

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { cn, useId } from '../../shared/utils.ts'
import type { CheckboxProps } from '../checkbox/checkbox.tsx'
import { Checkbox } from '../checkbox/index.ts'
import { useFormField } from '../form-field/form-field-context.ts'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
  FormValueOptions,
} from '../form-field/form-options.ts'
import { useFormReset } from '../shared/use-form-reset.ts'

import type { CheckboxGroupVariantProps } from './checkbox-group.class.ts'
import {
  checkboxGroupFieldsetVariants,
  checkboxGroupItemVariants,
  checkboxGroupLegendVariants,
} from './checkbox-group.class.ts'

export namespace CheckboxGroupT {
  export interface Slot<T = unknown> {
    /**
     * Group container that owns checkbox collection state and layout.
     */
    root?: T

    /** Fieldset element that groups checkbox options for accessibility. */
    fieldset?: T

    /** Legend text that labels the checkbox group. */
    legend?: T

    /** Wrapper for one checkbox option in the group. */
    item?: T

    /** Text column for an option label and description. */
    container?: T

    /** Visible checkbox control for an individual option. */
    control?: T

    /** Visual checked or indeterminate state layer for an option. */
    indicator?: T

    /** Check or indeterminate icon rendered for an option state. */
    icon?: T

    /** Inner layout wrapper used by grouped checkbox variants. */
    wrapper?: T

    /** Primary label text for an option. */
    label?: T

    /** Supporting description for an option. */
    description?: T
  }

  export type Variant = CheckboxGroupVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item<TTrue = boolean, TFalse = boolean> {
    /**
     * Value of the group item.
     */
    value?: string
    /**
     * Label for the group item.
     */
    label?: JSX.Element
    /**
     * Description for the group item.
     */
    description?: JSX.Element
    /**
     * Whether the item is disabled.
     */
    disabled?: boolean
    /**
     * Whether the item is indeterminate.
     */
    indeterminate?: CheckboxProps<TTrue, TFalse>['indeterminate']
    /**
     * Custom checked icon for this item.
     */
    checkedIcon?: CheckboxProps<TTrue, TFalse>['checkedIcon']
    /**
     * Custom indeterminate icon for this item.
     */
    indeterminateIcon?: CheckboxProps<TTrue, TFalse>['indeterminateIcon']
  }

  /**
   * Base props for the CheckboxGroup component.
   */
  export interface Base<TTrue = boolean, TFalse = boolean>
    extends
      FormIdentityOptions,
      FormValueOptions<string[]>,
      FormRequiredOption,
      FormDisableOption,
      FormReadOnlyOption {
    /**
     * Legend for the checkbox group.
     */
    legend?: JSX.Element

    /**
     * Array of items to render in the group.
     */
    items?: (string | Item<TTrue, TFalse>)[]

    /**
     * Default indicator position for all items.
     */
    indicator?: CheckboxProps<TTrue, TFalse>['indicator']

    /**
     * Default checked icon for all items.
     */
    checkedIcon?: CheckboxProps<TTrue, TFalse>['checkedIcon']

    /**
     * Default indeterminate icon for all items.
     */
    indeterminateIcon?: CheckboxProps<TTrue, TFalse>['indeterminateIcon']

    /**
     * Callback when the selected values change.
     */
    onChange?: (value: string[]) => void
  }

  /**
   * Props for the CheckboxGroup component.
   */
  export type Props<TTrue = boolean, TFalse = boolean> = BaseProps<
    'div',
    Base<TTrue, TFalse>,
    Variant,
    Classes,
    Styles
  >
}

/**
 * Props for the CheckboxGroup component.
 */
export interface CheckboxGroupProps<TTrue = boolean, TFalse = boolean> extends CheckboxGroupT.Props<
  TTrue,
  TFalse
> {}

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
  const merged = mergeProps(
    {
      orientation: 'vertical' as const,
      variant: 'list' as const,
      size: 'md' as const,
      defaultValue: [] as string[],
    },
    local,
  )
  const legend = createMemo(() => merged.legend)
  const items = createMemo(() => merged.items ?? [])
  const controlledValue = createMemo(() => merged.value)
  const initialDefaultValue = untrack(() => [...(merged.defaultValue ?? [])])

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
      field.setFormValue([...value])
    }
  })

  function onItemCheckedChange(value: string, checked: boolean): void {
    const currentValues = selectedValues()
    const isSelected = currentValues.includes(value)

    if (checked === isSelected) {
      return
    }

    const nextValues = checked
      ? [...currentValues, value]
      : currentValues.filter((itemValue) => itemValue !== value)

    if (controlledValue() === undefined) {
      setUncontrolledValue(nextValues)
    }

    field.setFormValue([...nextValues])
    merged.onChange?.([...nextValues])
    field.emit('change')
    field.emit('input')
  }

  useFormReset(
    () => fieldsetEl?.closest('form'),
    () => {
      const value = controlledValue()
      const nextValue = value ?? initialDefaultValue

      if (value === undefined) {
        setUncontrolledValue([...initialDefaultValue])
      }

      field.setFormValue([...nextValue])
    },
  )

  return (
    <div
      id={`${groupId()}-root`}
      data-slot="root"
      style={{ ...merged.styles?.root, ...merged.style }}
      class={cn('relative', merged.classes?.root, merged.class)}
      {...rest}
    >
      <fieldset
        ref={(element) => {
          fieldsetEl = element
        }}
        id={groupId()}
        data-slot="fieldset"
        disabled={field.disabled()}
        style={merged.styles?.fieldset}
        aria-labelledby={
          (field.ariaAttrs()['aria-labelledby'] as string | undefined) ??
          (legend() ? legendId() : undefined)
        }
        class={checkboxGroupFieldsetVariants(
          {
            orientation: merged.orientation,
          },
          merged.variant !== 'table' && 'gap-2',
          merged.classes?.fieldset,
        )}
        {...field.ariaAttrs()}
      >
        <Show when={legend()}>
          <legend
            id={legendId()}
            data-slot="legend"
            style={merged.styles?.legend}
            class={checkboxGroupLegendVariants(
              {
                size: field.size(),
                required: field.required(),
              },
              merged.classes?.legend,
            )}
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
                size={field.size()}
                variant={merged.variant === 'list' ? 'list' : 'card'}
                indicator={merged.indicator}
                checkedIcon={item().checkedIcon ?? checkedIcon()}
                indeterminateIcon={item().indeterminateIcon ?? indeterminateIcon()}
                classes={{
                  root: checkboxGroupItemVariants(
                    {
                      tableSize: merged.variant === 'table' ? field.size() : undefined,
                      tableOrientation: merged.variant === 'table' ? merged.orientation : undefined,
                    },
                    merged.variant === 'table' && 'relative rounded-none border border-muted',
                    merged.classes?.item,
                  ),
                  ...merged.classes,
                }}
                styles={merged.styles}
                onChange={(checked) => onItemCheckedChange(item().value, checked)}
              />
            )
          }}
        </For>
      </fieldset>
    </div>
  )
}
