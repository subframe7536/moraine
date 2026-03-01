import * as KobalteRadioGroup from '@kobalte/core/radio-group'
import type { JSX } from 'solid-js'
import { For, Show, createMemo, mergeProps, splitProps } from 'solid-js'

import { useFormField } from '../form-field/form-field-context'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
  FormValueOptions,
} from '../form-field/form-options'
import { FORM_ID_NAME_DISABLED_ON_CHANGE_KEYS } from '../form-field/form-options'
import type { SlotClasses } from '../shared/slot-class'
import { cn, useId } from '../shared/utils'

import type { RadioGroupVariantProps } from './radio-group.class'
import {
  radioGroupBaseVariants,
  radioGroupCardPaddingVariants,
  radioGroupContainerVariants,
  radioGroupDescriptionVariants,
  radioGroupDotVariants,
  radioGroupFieldsetVariants,
  radioGroupItemVariants,
  radioGroupLabelVariants,
  radioGroupLegendVariants,
  radioGroupTableOrientationVariants,
  radioGroupTablePaddingVariants,
  radioGroupWrapperVariants,
} from './radio-group.class'

export type RadioGroupValue = string

type RadioGroupSlots =
  | 'root'
  | 'fieldset'
  | 'legend'
  | 'item'
  | 'container'
  | 'base'
  | 'indicator'
  | 'dot'
  | 'wrapper'
  | 'label'
  | 'description'

export type RadioGroupClasses = SlotClasses<RadioGroupSlots>

type RadioGroupItemSlots =
  | 'root'
  | 'container'
  | 'base'
  | 'indicator'
  | 'dot'
  | 'wrapper'
  | 'label'
  | 'description'

export type RadioGroupItemClasses = SlotClasses<RadioGroupItemSlots>

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

export interface RadioGroupBaseProps
  extends
    RadioGroupVariantProps,
    FormIdentityOptions,
    FormValueOptions<RadioGroupValue>,
    FormRequiredOption,
    FormDisableOption,
    FormReadOnlyOption {
  legend?: JSX.Element
  valueKey?: string
  labelKey?: string
  descriptionKey?: string
  items?: RadioGroupItem[]
  onChange?: (value: RadioGroupValue) => void
  classes?: RadioGroupClasses
}

export type RadioGroupProps = RadioGroupBaseProps &
  Omit<
    KobalteRadioGroup.RadioGroupRootProps,
    keyof RadioGroupBaseProps | 'id' | 'children' | 'class'
  >

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
    },
    props,
  )

  const [formProps, rootStateProps, collectionProps, styleProps, rootProps] = splitProps(
    merged as RadioGroupProps,
    [...FORM_ID_NAME_DISABLED_ON_CHANGE_KEYS],
    ['value', 'defaultValue', 'required', 'readOnly'],
    ['legend', 'items', 'valueKey', 'labelKey', 'descriptionKey'],
    ['variant', 'indicator', 'orientation', 'size', 'classes'],
  )

  const groupId = useId(() => formProps.id, 'radio-group')
  const field = useFormField(
    () => ({
      id: formProps.id,
      name: formProps.name,
      size: styleProps.size,
      disabled: formProps.disabled,
    }),
    {
      bind: false,
      defaultId: groupId,
      defaultSize: 'md',
    },
  )

  const legendId = createMemo(() => `${groupId()}-legend`)

  const normalizedItems = createMemo<NormalizedRadioGroupItem[]>(() => {
    const items = collectionProps.items ?? []
    const valueKey = collectionProps.valueKey ?? 'value'
    const labelKey = collectionProps.labelKey ?? 'label'
    const descriptionKey = collectionProps.descriptionKey ?? 'description'

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
    formProps.onChange?.(nextValue)
    field.emitFormChange()
    field.emitFormInput()
  }

  return (
    <KobalteRadioGroup.Root
      {...rootStateProps}
      id={groupId()}
      name={field.name()}
      disabled={field.disabled()}
      orientation={styleProps.orientation}
      onChange={onChange}
      data-slot="root"
      class={cn('relative', styleProps.classes?.root)}
      {...field.ariaAttrs()}
      {...rootProps}
    >
      <fieldset
        data-slot="fieldset"
        aria-labelledby={collectionProps.legend ? legendId() : undefined}
        class={radioGroupFieldsetVariants(
          {
            orientation: styleProps.orientation,
            size: field.size(),
          },
          styleProps.classes?.fieldset,
        )}
      >
        <Show when={collectionProps.legend}>
          <legend
            id={legendId()}
            data-slot="legend"
            class={radioGroupLegendVariants(
              {
                size: field.size(),
                required: rootStateProps.required,
              },
              styleProps.classes?.legend,
            )}
          >
            {collectionProps.legend}
          </legend>
        </Show>

        <For each={normalizedItems()}>
          {(item) => (
            <KobalteRadioGroup.Item
              as={styleProps.variant === 'list' ? 'div' : 'label'}
              id={item.id}
              value={item.value}
              disabled={item.disabled || field.disabled()}
              data-slot="item"
              class={radioGroupItemVariants(
                {
                  size: field.size(),
                  variant: styleProps.variant === 'list' ? undefined : styleProps.variant,
                  indicator: styleProps.indicator === 'hidden' ? undefined : styleProps.indicator,
                  disabled: item.disabled || field.disabled(),
                },
                styleProps.variant === 'card' &&
                  radioGroupCardPaddingVariants({ size: field.size() }),
                styleProps.variant === 'table' &&
                  radioGroupTablePaddingVariants({
                    size: field.size(),
                  }),
                styleProps.variant === 'table' &&
                  radioGroupTableOrientationVariants({
                    orientation: styleProps.orientation,
                  }),
                styleProps.variant === 'card' && 'data-checked:border-primary',
                styleProps.variant === 'table' &&
                  'z-1 data-checked:(bg-primary/10 border-primary/50)',
                styleProps.classes?.item,
                item.classes?.root,
              )}
            >
              <div
                data-slot="container"
                class={radioGroupContainerVariants(
                  {
                    size: field.size(),
                  },
                  styleProps.classes?.container,
                  item.classes?.container,
                )}
              >
                <KobalteRadioGroup.ItemInput id={item.inputId} data-slot="input" />

                <KobalteRadioGroup.ItemControl
                  data-slot="base"
                  class={radioGroupBaseVariants(
                    {
                      size: field.size(),
                      disabled: item.disabled || field.disabled(),
                      invalid: field.invalid(),
                    },
                    styleProps.indicator === 'hidden' && 'sr-only',
                    styleProps.classes?.base,
                    item.classes?.base,
                  )}
                >
                  <KobalteRadioGroup.ItemIndicator
                    data-slot="indicator"
                    class={cn(
                      'flex size-full items-center justify-center rounded-full bg-primary',
                      styleProps.classes?.indicator,
                      item.classes?.indicator,
                    )}
                  >
                    <span
                      data-slot="dot"
                      class={radioGroupDotVariants(
                        {
                          size: field.size(),
                        },
                        styleProps.classes?.dot,
                        item.classes?.dot,
                      )}
                    />
                  </KobalteRadioGroup.ItemIndicator>
                </KobalteRadioGroup.ItemControl>
              </div>

              <Show when={item.label || item.description}>
                <div
                  data-slot="wrapper"
                  class={radioGroupWrapperVariants(
                    {
                      indicator: styleProps.indicator,
                    },
                    styleProps.classes?.wrapper,
                    item.classes?.wrapper,
                  )}
                >
                  <Show when={item.label}>
                    <Show
                      when={styleProps.variant === 'list'}
                      fallback={
                        <p
                          data-slot="label"
                          class={radioGroupLabelVariants(
                            {
                              disabled: item.disabled || field.disabled(),
                            },
                            styleProps.classes?.label,
                            item.classes?.label,
                          )}
                        >
                          {item.label}
                        </p>
                      }
                    >
                      <label
                        for={item.inputId}
                        data-slot="label"
                        class={radioGroupLabelVariants(
                          {
                            disabled: item.disabled || field.disabled(),
                          },
                          styleProps.classes?.label,
                          item.classes?.label,
                        )}
                      >
                        {item.label}
                      </label>
                    </Show>
                  </Show>

                  <Show when={item.description}>
                    <p
                      data-slot="description"
                      class={radioGroupDescriptionVariants(
                        {
                          disabled: item.disabled || field.disabled(),
                        },
                        styleProps.classes?.description,
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
