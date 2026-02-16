import * as KobalteRadioGroup from '@kobalte/core/radio-group'
import type { JSX } from 'solid-js'
import { For, Show, createMemo, mergeProps, splitProps } from 'solid-js'

import { useFormField } from '../form-field/form-field-context'
import { cn, useId } from '../shared/utils'

import type { RadioGroupVariantProps } from './radio-group.class'
import {
  radioGroupBaseVariants,
  radioGroupContainerVariants,
  radioGroupDescriptionVariants,
  radioGroupDotVariants,
  radioGroupFieldsetVariants,
  radioGroupIndicatorVariants,
  radioGroupItemVariants,
  radioGroupLabelVariants,
  radioGroupLegendVariants,
  radioGroupRootVariants,
  radioGroupWrapperVariants,
} from './radio-group.class'

type RadioGroupSize = NonNullable<RadioGroupVariantProps['size']>
type RadioGroupColor = NonNullable<RadioGroupVariantProps['color']>

export type RadioGroupValue = string

export interface RadioGroupClasses {
  root?: string
  fieldset?: string
  legend?: string
  item?: string
  container?: string
  base?: string
  indicator?: string
  dot?: string
  wrapper?: string
  label?: string
  description?: string
}

export interface RadioGroupItemClasses {
  root?: string
  container?: string
  base?: string
  indicator?: string
  dot?: string
  wrapper?: string
  label?: string
  description?: string
}

export interface RadioGroupItemObject {
  value?: unknown
  label?: JSX.Element
  description?: JSX.Element
  disabled?: boolean
  classes?: RadioGroupItemClasses
  [key: string]: unknown
}

export type RadioGroupItem = string | number | boolean | null | RadioGroupItemObject

interface NormalizedRadioGroupItem {
  id: string
  inputId: string
  value: RadioGroupValue
  label?: JSX.Element
  description?: JSX.Element
  disabled: boolean
  classes?: RadioGroupItemClasses
}

export interface RadioGroupBaseProps extends RadioGroupVariantProps {
  id?: string
  name?: string
  legend?: JSX.Element
  valueKey?: string
  labelKey?: string
  descriptionKey?: string
  items?: RadioGroupItem[]
  value?: RadioGroupValue
  defaultValue?: RadioGroupValue
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  onChange?: (value: RadioGroupValue) => void
  classes?: RadioGroupClasses
}

export type RadioGroupProps = RadioGroupBaseProps &
  Omit<JSX.HTMLAttributes<HTMLDivElement>, keyof RadioGroupBaseProps | 'id' | 'children' | 'class'>

function getAtPath(data: Record<string, unknown>, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>((value, key) => (value as Record<string, unknown> | undefined)?.[key], data)
}

function toValueString(value: unknown, fallback: string): RadioGroupValue {
  if (value === null || value === undefined) {
    return fallback
  }

  return String(value)
}

function normalizeRadioGroupSize(value?: string): RadioGroupSize {
  if (value === 'xs' || value === 'sm' || value === 'lg' || value === 'xl') {
    return value
  }

  return 'md'
}

function normalizeRadioGroupColor(value?: string): RadioGroupColor {
  if (value === 'secondary' || value === 'neutral' || value === 'error') {
    return value
  }

  return 'primary'
}

export function RadioGroup(props: RadioGroupProps): JSX.Element {
  const merged = mergeProps(
    {
      valueKey: 'value',
      labelKey: 'label',
      descriptionKey: 'description',
      orientation: 'vertical' as const,
      variant: 'list' as const,
      indicator: 'start' as const,
      size: 'md' as const,
      color: 'primary' as const,
    },
    props,
  )

  const [local, rest] = splitProps(merged as RadioGroupProps, [
    'id',
    'name',
    'legend',
    'valueKey',
    'labelKey',
    'descriptionKey',
    'items',
    'value',
    'defaultValue',
    'required',
    'disabled',
    'readOnly',
    'onChange',
    'variant',
    'indicator',
    'orientation',
    'size',
    'color',
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

  const groupId = useId(() => local.id, 'radio-group')
  const legendId = createMemo(() => `${groupId()}-legend`)
  const resolvedSize = createMemo(() => normalizeRadioGroupSize(field.size() ?? local.size))
  const resolvedColor = createMemo(() => normalizeRadioGroupColor(field.color() ?? local.color))
  const disabled = createMemo(() => field.disabled())
  const ariaAttrs = createMemo(() => field.ariaAttrs() ?? {})

  const normalizedItems = createMemo<NormalizedRadioGroupItem[]>(() => {
    const items = local.items ?? []
    const valueKey = local.valueKey ?? 'value'
    const labelKey = local.labelKey ?? 'label'
    const descriptionKey = local.descriptionKey ?? 'description'

    return items.map((item, index) => {
      if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
        const value = toValueString(item, String(index))
        const baseId = `${groupId()}:${value}`

        return {
          id: baseId,
          inputId: `${baseId}-input`,
          value,
          label: value,
          disabled: false,
        }
      }

      if (item === null) {
        const value = String(index)
        const baseId = `${groupId()}:${value}`

        return {
          id: baseId,
          inputId: `${baseId}-input`,
          value,
          disabled: false,
        }
      }

      const objectItem = item as RadioGroupItemObject
      const value = toValueString(
        getAtPath(objectItem as Record<string, unknown>, valueKey),
        String(index),
      )
      const baseId = `${groupId()}:${value}`
      const label = getAtPath(objectItem as Record<string, unknown>, labelKey) as
        | JSX.Element
        | undefined
      const description = getAtPath(objectItem as Record<string, unknown>, descriptionKey) as
        | JSX.Element
        | undefined

      return {
        id: baseId,
        inputId: `${baseId}-input`,
        value,
        label,
        description,
        disabled: Boolean(objectItem.disabled),
        classes: objectItem.classes,
      }
    })
  })

  function onChange(nextValue: string): void {
    local.onChange?.(nextValue)
    field.emitFormChange()
    field.emitFormInput()
  }

  return (
    <KobalteRadioGroup.Root
      id={groupId()}
      name={field.name()}
      value={local.value}
      defaultValue={local.defaultValue}
      required={local.required}
      disabled={disabled()}
      readOnly={local.readOnly}
      orientation={local.orientation}
      onChange={onChange}
      data-slot="root"
      class={cn(radioGroupRootVariants(), local.classes?.root)}
      {...(ariaAttrs() as Record<string, string | boolean | undefined>)}
      {...rest}
    >
      <fieldset
        data-slot="fieldset"
        aria-labelledby={local.legend ? legendId() : undefined}
        class={cn(
          radioGroupFieldsetVariants({
            orientation: local.orientation,
            size: resolvedSize(),
          }),
          local.classes?.fieldset,
        )}
      >
        <Show when={local.legend}>
          <legend
            id={legendId()}
            data-slot="legend"
            class={cn(
              radioGroupLegendVariants({
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
            <KobalteRadioGroup.Item
              id={item.id}
              value={item.value}
              disabled={item.disabled || disabled()}
              data-slot="item"
              class={cn(
                radioGroupItemVariants({
                  size: resolvedSize(),
                  variant: local.variant,
                  indicator: local.indicator,
                  orientation: local.orientation,
                  color: resolvedColor(),
                  disabled: item.disabled || disabled(),
                }),
                local.classes?.item,
                item.classes?.root,
              )}
            >
              <div
                data-slot="container"
                class={cn(
                  radioGroupContainerVariants({
                    size: resolvedSize(),
                  }),
                  local.classes?.container,
                  item.classes?.container,
                )}
              >
                <KobalteRadioGroup.ItemInput id={item.inputId} data-slot="input" />

                <KobalteRadioGroup.ItemControl
                  data-slot="base"
                  class={cn(
                    radioGroupBaseVariants({
                      size: resolvedSize(),
                      disabled: item.disabled || disabled(),
                    }),
                    local.indicator === 'hidden' && 'sr-only',
                    local.classes?.base,
                    item.classes?.base,
                  )}
                >
                  <KobalteRadioGroup.ItemIndicator
                    data-slot="indicator"
                    class={cn(
                      radioGroupIndicatorVariants({
                        color: resolvedColor(),
                      }),
                      local.classes?.indicator,
                      item.classes?.indicator,
                    )}
                  >
                    <span
                      data-slot="dot"
                      class={cn(
                        radioGroupDotVariants({
                          size: resolvedSize(),
                        }),
                        local.classes?.dot,
                        item.classes?.dot,
                      )}
                    />
                  </KobalteRadioGroup.ItemIndicator>
                </KobalteRadioGroup.ItemControl>
              </div>

              <Show when={item.label || item.description}>
                <div
                  data-slot="wrapper"
                  class={cn(
                    radioGroupWrapperVariants({
                      indicator: local.indicator,
                    }),
                    local.classes?.wrapper,
                    item.classes?.wrapper,
                  )}
                >
                  <Show when={item.label}>
                    <label
                      for={item.inputId}
                      data-slot="label"
                      class={cn(
                        radioGroupLabelVariants({
                          disabled: item.disabled || disabled(),
                        }),
                        local.classes?.label,
                        item.classes?.label,
                      )}
                    >
                      {item.label}
                    </label>
                  </Show>

                  <Show when={item.description}>
                    <p
                      data-slot="description"
                      class={cn(
                        radioGroupDescriptionVariants({
                          disabled: item.disabled || disabled(),
                        }),
                        local.classes?.description,
                        item.classes?.description,
                      )}
                    >
                      {item.description}
                    </p>
                  </Show>
                </div>
              </Show>
            </KobalteRadioGroup.Item>
          )}
        </For>
      </fieldset>
    </KobalteRadioGroup.Root>
  )
}
