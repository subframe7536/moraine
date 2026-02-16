import type { JSX } from 'solid-js'
import { For, Show, createMemo, createSignal, mergeProps, splitProps } from 'solid-js'

import { Checkbox } from '../checkbox'
import type { CheckboxProps } from '../checkbox/checkbox'
import { useFormField } from '../form-field/form-field-context'
import { cn, useId } from '../shared/utils'

import type { CheckboxGroupVariantProps } from './checkbox-group.class'
import {
  checkboxGroupFieldsetVariants,
  checkboxGroupItemVariants,
  checkboxGroupLegendVariants,
} from './checkbox-group.class'

export type CheckboxGroupValue = string

export interface CheckboxGroupItemObject {
  value?: unknown
  label?: JSX.Element
  description?: JSX.Element
  disabled?: boolean
  classes?: {
    root?: string
    checkbox?: CheckboxProps['classes']
  }
  checkedIcon?: CheckboxProps['checkedIcon']
  indeterminateIcon?: CheckboxProps['indeterminateIcon']
  [key: string]: unknown
}

export type CheckboxGroupItem = string | number | boolean | null | CheckboxGroupItemObject

export interface CheckboxGroupClasses {
  root?: string
  fieldset?: string
  legend?: string
  item?: string
  checkbox?: CheckboxProps['classes']
}

type CheckboxGroupSize = NonNullable<CheckboxProps['size']>
type CheckboxGroupColor = NonNullable<CheckboxProps['color']>
type CheckboxGroupVariant = NonNullable<CheckboxProps['variant']>

export interface CheckboxGroupBaseProps extends CheckboxGroupVariantProps {
  id?: string
  name?: string
  legend?: JSX.Element
  valueKey?: string
  labelKey?: string
  descriptionKey?: string
  items?: CheckboxGroupItem[]
  color?: CheckboxProps['color']
  indicator?: CheckboxProps['indicator']
  checkedIcon?: CheckboxProps['checkedIcon']
  indeterminateIcon?: CheckboxProps['indeterminateIcon']
  value?: CheckboxGroupValue[]
  defaultValue?: CheckboxGroupValue[]
  required?: boolean
  disabled?: boolean
  onChange?: (value: CheckboxGroupValue[]) => void
  classes?: CheckboxGroupClasses
}

export type CheckboxGroupProps = CheckboxGroupBaseProps &
  Omit<
    JSX.HTMLAttributes<HTMLDivElement>,
    keyof CheckboxGroupBaseProps | 'id' | 'children' | 'class'
  >

interface NormalizedCheckboxGroupItem {
  id: string
  value: CheckboxGroupValue
  label?: JSX.Element
  description?: JSX.Element
  disabled: boolean
  classes?: {
    root?: string
    checkbox?: CheckboxProps['classes']
  }
  checkedIcon?: CheckboxProps['checkedIcon']
  indeterminateIcon?: CheckboxProps['indeterminateIcon']
}

function getAtPath(data: Record<string, unknown>, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>((value, key) => (value as Record<string, unknown> | undefined)?.[key], data)
}

function toValueString(value: unknown, fallback: string): CheckboxGroupValue {
  if (value === null || value === undefined) {
    return fallback
  }

  return String(value)
}

function normalizeCheckboxGroupSize(value?: string): CheckboxGroupSize {
  if (value === 'xs' || value === 'sm' || value === 'lg' || value === 'xl') {
    return value
  }

  return 'md'
}

function normalizeCheckboxGroupColor(value?: string): CheckboxGroupColor {
  if (value === 'secondary' || value === 'neutral' || value === 'error') {
    return value
  }

  return 'primary'
}

function normalizeCheckboxVariant(value?: string): CheckboxGroupVariant {
  return value === 'card' ? 'card' : 'list'
}

export function CheckboxGroup(props: CheckboxGroupProps): JSX.Element {
  const merged = mergeProps(
    {
      valueKey: 'value',
      labelKey: 'label',
      descriptionKey: 'description',
      orientation: 'vertical' as const,
      variant: 'list' as const,
      size: 'md' as const,
      defaultValue: [] as CheckboxGroupValue[],
    },
    props,
  )

  const [local, rest] = splitProps(merged as CheckboxGroupProps, [
    'id',
    'name',
    'legend',
    'valueKey',
    'labelKey',
    'descriptionKey',
    'items',
    'color',
    'size',
    'variant',
    'orientation',
    'indicator',
    'checkedIcon',
    'indeterminateIcon',
    'value',
    'defaultValue',
    'required',
    'disabled',
    'onChange',
    'classes',
  ])

  const field = useFormField(
    () => ({
      id: local.id,
      name: local.name,
      color: local.color,
      size: local.size,
      disabled: local.disabled,
    }),
    {
      bind: false,
    },
  )

  const groupId = useId(() => local.id, 'checkbox-group')
  const [uncontrolledValue, setUncontrolledValue] = createSignal<CheckboxGroupValue[]>(
    local.defaultValue ?? [],
  )

  const resolvedSize = createMemo(() => normalizeCheckboxGroupSize(field.size() ?? local.size))
  const resolvedColor = createMemo(() => normalizeCheckboxGroupColor(field.color() ?? local.color))
  const disabled = createMemo(() => field.disabled())
  const selectedValues = createMemo(() => local.value ?? uncontrolledValue())
  const ariaAttrs = createMemo(() => field.ariaAttrs() ?? {})
  const legendId = createMemo(() => `${groupId()}-legend`)

  const normalizedItems = createMemo<NormalizedCheckboxGroupItem[]>(() => {
    const items = local.items ?? []
    const valueKey = local.valueKey ?? 'value'
    const labelKey = local.labelKey ?? 'label'
    const descriptionKey = local.descriptionKey ?? 'description'

    return items.map((item, index) => {
      if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
        const value = toValueString(item, String(index))

        return {
          id: `${groupId()}:${value}`,
          value,
          label: value,
          disabled: false,
        }
      }

      if (item === null) {
        const value = String(index)

        return {
          id: `${groupId()}:${value}`,
          value,
          label: undefined,
          description: undefined,
          disabled: false,
        }
      }

      const objectItem = item as CheckboxGroupItemObject
      const value = toValueString(
        getAtPath(objectItem as Record<string, unknown>, valueKey),
        String(index),
      )
      const label = getAtPath(objectItem as Record<string, unknown>, labelKey) as
        | JSX.Element
        | undefined
      const description = getAtPath(objectItem as Record<string, unknown>, descriptionKey) as
        | JSX.Element
        | undefined

      return {
        id: `${groupId()}:${value}`,
        value,
        label,
        description,
        disabled: Boolean(objectItem.disabled),
        classes: objectItem.classes,
        checkedIcon: objectItem.checkedIcon,
        indeterminateIcon: objectItem.indeterminateIcon,
      }
    })
  })

  function setValue(nextValue: CheckboxGroupValue[]): void {
    if (local.value === undefined) {
      setUncontrolledValue(nextValue)
    }

    local.onChange?.(nextValue)
    field.emitFormChange()
    field.emitFormInput()
  }

  function onItemCheckedChange(value: CheckboxGroupValue, checked: boolean): void {
    const nextValues = checked
      ? selectedValues().includes(value)
        ? selectedValues()
        : [...selectedValues(), value]
      : selectedValues().filter((itemValue) => itemValue !== value)

    setValue(nextValues)
  }

  return (
    <div
      id={`${groupId()}-root`}
      data-slot="root"
      class={cn('relative', local.classes?.root)}
      {...rest}
    >
      <fieldset
        id={groupId()}
        data-slot="fieldset"
        aria-labelledby={local.legend ? legendId() : undefined}
        class={cn(
          checkboxGroupFieldsetVariants({
            orientation: local.orientation,
            size: resolvedSize(),
          }),
          local.classes?.fieldset,
        )}
        {...(ariaAttrs() as Record<string, string | boolean | undefined>)}
      >
        <Show when={local.legend}>
          <legend
            id={legendId()}
            data-slot="legend"
            class={cn(
              checkboxGroupLegendVariants({
                size: resolvedSize(),
                required: local.required,
              }),
              local.classes?.legend,
            )}
          >
            {local.legend}
          </legend>
        </Show>

        <For each={normalizedItems()}>
          {(item) => (
            <div
              data-slot="item"
              class={cn(
                checkboxGroupItemVariants({
                  variant: local.variant,
                  orientation: local.orientation,
                  size: resolvedSize(),
                  disabled: item.disabled || disabled(),
                }),
                local.classes?.item,
                item.classes?.root,
              )}
            >
              <Checkbox
                id={item.id}
                name={field.name()}
                formFieldBind={false}
                checked={selectedValues().includes(item.value)}
                value={item.value}
                label={item.label}
                description={item.description}
                disabled={item.disabled || disabled()}
                required={local.required}
                size={resolvedSize()}
                color={resolvedColor()}
                variant={normalizeCheckboxVariant(
                  local.variant === 'table' ? 'card' : local.variant,
                )}
                indicator={local.indicator}
                checkedIcon={item.checkedIcon ?? local.checkedIcon}
                indeterminateIcon={item.indeterminateIcon ?? local.indeterminateIcon}
                classes={{ ...local.classes?.checkbox, ...item.classes?.checkbox }}
                onChange={(checked) => onItemCheckedChange(item.value, checked)}
              />
            </div>
          )}
        </For>
      </fieldset>
    </div>
  )
}
