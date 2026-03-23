import type { JSX } from 'solid-js'
import { For, Show, createMemo, createSignal, mergeProps, splitProps } from 'solid-js'

import type { RockUIProps, SlotStyles } from '../../shared/types'
import { cn, useId } from '../../shared/utils'
import { Checkbox } from '../checkbox'
import type { CheckboxProps } from '../checkbox/checkbox'
import { useFormField } from '../form-field/form-field-context'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormRequiredOption,
  FormValueOptions,
} from '../form-field/form-options'
import { FORM_ID_NAME_VALUE_REQUIRED_DISABLED_KEYS } from '../form-field/form-options'

import type { CheckboxGroupVariantProps } from './checkbox-group.class'
import {
  checkboxGroupFieldsetVariants,
  checkboxGroupItemVariants,
  checkboxGroupLegendVariants,
} from './checkbox-group.class'

export namespace CheckboxGroupT {
  export type Slot =
    | 'root'
    | 'fieldset'
    | 'legend'
    | 'item'
    | 'container'
    | 'control'
    | 'indicator'
    | 'icon'
    | 'wrapper'
    | 'label'
    | 'description'

  export type Variant = CheckboxGroupVariantProps

  export type Value = string

  export interface Items<TTrue = boolean, TFalse = boolean> {
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

  export interface Extend {}

  /**
   * Class overrides for CheckboxGroup and its items.
   */
  export interface Classes<TTrue = boolean, TFalse = boolean> {
    root?: string
    fieldset?: string
    legend?: string
    item?: string
    container?: CheckboxGroupItemClasses<TTrue, TFalse>['container']
    control?: CheckboxGroupItemClasses<TTrue, TFalse>['control']
    indicator?: CheckboxGroupItemClasses<TTrue, TFalse>['indicator']
    icon?: CheckboxGroupItemClasses<TTrue, TFalse>['icon']
    wrapper?: CheckboxGroupItemClasses<TTrue, TFalse>['wrapper']
    label?: CheckboxGroupItemClasses<TTrue, TFalse>['label']
    description?: CheckboxGroupItemClasses<TTrue, TFalse>['description']
  }

  export interface Styles extends SlotStyles<Slot> {}

  export type Item<TTrue = boolean, TFalse = boolean> = string | Items<TTrue, TFalse>

  /**
   * Base props for the CheckboxGroup component.
   */
  export interface Base<TTrue = boolean, TFalse = boolean>
    extends FormIdentityOptions, FormValueOptions<Value[]>, FormRequiredOption, FormDisableOption {
    /**
     * Legend for the checkbox group.
     */
    legend?: JSX.Element

    /**
     * Array of items to render in the group.
     */
    items?: Item<TTrue, TFalse>[]

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
    onChange?: (value: Value[]) => void
  }

  /**
   * Props for the CheckboxGroup component.
   */
  export interface Props<TTrue = boolean, TFalse = boolean> extends RockUIProps<
    Base<TTrue, TFalse>,
    Variant,
    Extend,
    Slot
  > {}
}

type CheckboxGroupValue = CheckboxGroupT.Value

type CheckboxGroupItemClasses<TTrue = boolean, TFalse = boolean> = Omit<
  NonNullable<CheckboxProps<TTrue, TFalse>['classes']>,
  'root'
>

/**
 * Props for the CheckboxGroup component.
 */
export interface CheckboxGroupProps<TTrue = boolean, TFalse = boolean> extends CheckboxGroupT.Props<
  TTrue,
  TFalse
> {}

interface NormalizedCheckboxGroupItem<TTrue = boolean, TFalse = boolean> {
  id: string
  value: CheckboxGroupValue
  label?: JSX.Element
  description?: JSX.Element
  disabled: boolean
  indeterminate?: CheckboxProps<TTrue, TFalse>['indeterminate']
  checkedIcon?: CheckboxProps<TTrue, TFalse>['checkedIcon']
  indeterminateIcon?: CheckboxProps<TTrue, TFalse>['indeterminateIcon']
}

/** Multi-select checkbox group with card, list, and table layout variants. */
export function CheckboxGroup<TTrue = boolean, TFalse = boolean>(
  props: CheckboxGroupProps<TTrue, TFalse>,
): JSX.Element {
  const merged = mergeProps(
    {
      orientation: 'vertical' as const,
      variant: 'list' as const,
      size: 'md' as const,
      defaultValue: [] as CheckboxGroupValue[],
    },
    props,
  )

  const [formProps, collectionProps, styleProps] = splitProps(
    merged as CheckboxGroupProps<TTrue, TFalse>,
    [...FORM_ID_NAME_VALUE_REQUIRED_DISABLED_KEYS, 'onChange'],
    ['legend', 'items'],
  )

  const groupId = useId(() => formProps.id, 'checkbox-group')
  const field = useFormField(
    () => ({
      id: formProps.id,
      name: formProps.name,
      size: styleProps.size,
      disabled: formProps.disabled,
    }),
    () => ({
      bind: false,
      defaultId: groupId(),
      defaultSize: 'md',
      initialValue: formProps.defaultValue || [],
    }),
  )

  const [uncontrolledValue, setUncontrolledValue] = createSignal<CheckboxGroupValue[]>(
    formProps.defaultValue ?? [],
  )

  const selectedValues = createMemo(() => formProps.value ?? uncontrolledValue())
  const legendId = createMemo(() => `${groupId()}-legend`)

  const normalizedItems = createMemo<NormalizedCheckboxGroupItem<TTrue, TFalse>[]>(() => {
    const items = collectionProps.items ?? []

    return items.map((item, index) => {
      if (typeof item === 'string') {
        return {
          id: `${groupId()}:${item}`,
          value: item,
          label: item,
          disabled: false,
        }
      }

      const value = item.value ?? String(index)

      return {
        id: `${groupId()}:${value}`,
        value,
        label: item.label,
        description: item.description,
        disabled: Boolean(item.disabled),
        indeterminate: item.indeterminate,
        checkedIcon: item.checkedIcon,
        indeterminateIcon: item.indeterminateIcon,
      }
    })
  })

  function onItemCheckedChange(value: CheckboxGroupValue, checked: boolean): void {
    const nextValues = checked
      ? selectedValues().includes(value)
        ? selectedValues()
        : [...selectedValues(), value]
      : selectedValues().filter((itemValue) => itemValue !== value)

    if (formProps.value === undefined) {
      setUncontrolledValue(nextValues)
    }

    field.setFormValue(nextValues)
    formProps.onChange?.(nextValues)
    field.emit('change')
    field.emit('input')
  }

  return (
    <div
      id={`${groupId()}-root`}
      data-slot="root"
      style={merged.styles?.root}
      class={cn('relative', styleProps.classes?.root)}
    >
      <fieldset
        id={groupId()}
        data-slot="fieldset"
        style={merged.styles?.fieldset}
        aria-labelledby={collectionProps.legend ? legendId() : undefined}
        class={checkboxGroupFieldsetVariants(
          {
            orientation: styleProps.orientation,
          },
          styleProps.variant !== 'table' && 'gap-2',
          styleProps.classes?.fieldset,
        )}
        {...field.ariaAttrs()}
      >
        <Show when={collectionProps.legend}>
          <legend
            id={legendId()}
            data-slot="legend"
            style={merged.styles?.legend}
            class={checkboxGroupLegendVariants(
              {
                size: field.size(),
                required: formProps.required,
              },
              styleProps.classes?.legend,
            )}
          >
            {collectionProps.legend}
          </legend>
        </Show>

        <For each={normalizedItems()}>
          {(item) => (
            <Checkbox
              id={item.id}
              name={field.name()}
              formFieldBind={false}
              checked={selectedValues().includes(item.value)}
              value={item.value}
              label={item.label}
              description={item.description}
              disabled={item.disabled || field.disabled()}
              indeterminate={item.indeterminate}
              required={formProps.required}
              size={field.size()}
              variant={styleProps.variant === 'list' ? 'list' : 'card'}
              indicator={styleProps.indicator}
              checkedIcon={item.checkedIcon ?? styleProps.checkedIcon}
              indeterminateIcon={item.indeterminateIcon ?? styleProps.indeterminateIcon}
              classes={{
                root: checkboxGroupItemVariants(
                  {
                    tableSize: styleProps.variant === 'table' ? field.size() : undefined,
                    tableOrientation:
                      styleProps.variant === 'table' ? styleProps.orientation : undefined,
                  },
                  styleProps.variant === 'table' &&
                    'relative rounded-none b-(1 muted) data-checked:(bg-primary/10 border-primary/50) data-checked:z-1',
                  styleProps.classes?.item,
                ),
                ...styleProps.classes,
              }}
              styles={styleProps.styles}
              onChange={(checked) => onItemCheckedChange(item.value, Boolean(checked))}
            />
          )}
        </For>
      </fieldset>
    </div>
  )
}
