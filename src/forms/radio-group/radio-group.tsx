import * as KobalteRadioGroup from '@kobalte/core/radio-group'
import type { JSX } from 'solid-js'
import { For, Show, createMemo, mergeProps, splitProps } from 'solid-js'

import type { SlotClasses } from '../../shared/slot-class'
import { cn, useId } from '../../shared/utils'
import { useFormField } from '../form-field/form-field-context'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
  FormValueOptions,
} from '../form-field/form-options'
import { FORM_ID_NAME_VALUE_REQUIRED_DISABLED_KEYS } from '../form-field/form-options'

import type { RadioGroupVariantProps } from './radio-group.class'
import {
  radioGroupBaseVariants,
  radioGroupContainerVariants,
  radioGroupFieldsetVariants,
  radioGroupItemVariants,
  radioGroupLegendVariants,
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
  value?: string
  label?: JSX.Element
  description?: JSX.Element
  disabled?: boolean
}

export type RadioGroupItem = string | RadioGroupItemObject

interface NormalizedRadioGroupItem {
  id: string
  inputId: string
  value: RadioGroupValue
  label?: JSX.Element
  description?: JSX.Element
  disabled: boolean
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
  items?: RadioGroupItem[]
  onChange?: (value: RadioGroupValue) => void
  classes?: RadioGroupClasses
}

export type RadioGroupProps = RadioGroupBaseProps &
  Omit<
    KobalteRadioGroup.RadioGroupRootProps,
    keyof RadioGroupBaseProps | 'id' | 'children' | 'class'
  >

export function RadioGroup(props: RadioGroupProps): JSX.Element {
  const merged = mergeProps(
    {
      orientation: 'vertical' as const,
      variant: 'list' as const,
      indicator: 'start' as const,
      size: 'md' as const,
    },
    props,
  )

  const [formProps, collectionProps, styleProps, restProps] = splitProps(
    merged as RadioGroupProps,
    [...FORM_ID_NAME_VALUE_REQUIRED_DISABLED_KEYS, 'onChange'],
    ['legend', 'items'],
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
    () => ({
      bind: false,
      defaultId: groupId(),
      defaultSize: 'md',
      initialValue: formProps.defaultValue || '',
    }),
  )

  const legendId = createMemo(() => `${groupId()}-legend`)

  const normalizedItems = createMemo<NormalizedRadioGroupItem[]>(() => {
    const items = collectionProps.items ?? []

    return items.map((item, index) => {
      if (typeof item === 'string') {
        const baseId = `${groupId()}:${item}`
        return {
          id: baseId,
          inputId: `${baseId}-input`,
          value: item,
          label: item,
          disabled: false,
        }
      }

      const value = item.value ?? String(index)
      const baseId = `${groupId()}:${value}`

      return {
        id: baseId,
        inputId: `${baseId}-input`,
        value,
        label: item.label,
        description: item.description,
        disabled: Boolean(item.disabled),
      }
    })
  })

  function onChange(nextValue: string): void {
    field.setFormValue(nextValue)
    formProps.onChange?.(nextValue)
    field.emit('change')
    field.emit('input')
  }

  return (
    <KobalteRadioGroup.Root
      id={groupId()}
      name={field.name()}
      value={formProps.value}
      defaultValue={formProps.defaultValue}
      disabled={field.disabled()}
      required={formProps.required}
      orientation={styleProps.orientation}
      onChange={onChange}
      data-slot="root"
      class={cn('relative', styleProps.classes?.root)}
      {...field.ariaAttrs()}
      {...restProps}
    >
      <fieldset
        data-slot="fieldset"
        aria-labelledby={collectionProps.legend ? legendId() : undefined}
        class={radioGroupFieldsetVariants(
          {
            orientation: styleProps.orientation,
          },
          styleProps.variant !== 'table' && 'gap-2',
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
                  tableOrientation:
                    styleProps.variant === 'table' ? styleProps.orientation : undefined,
                  disabled: item.disabled || field.disabled(),
                },
                styleProps.classes?.item,
              )}
            >
              <div
                data-slot="container"
                class={radioGroupContainerVariants(
                  {
                    size: field.size(),
                  },
                  styleProps.classes?.container,
                )}
              >
                <KobalteRadioGroup.ItemInput id={item.inputId} class="peer" data-slot="input" />

                <KobalteRadioGroup.ItemControl
                  data-slot="base"
                  class={radioGroupBaseVariants(
                    {
                      size: field.size(),
                      invalid: field.invalid(),
                    },
                    styleProps.indicator === 'hidden' && 'sr-only',
                    styleProps.classes?.base,
                  )}
                >
                  <KobalteRadioGroup.ItemIndicator
                    data-slot="indicator"
                    class={cn(
                      'flex size-full items-center justify-center rounded-full ring-(4 primary inset ring)',
                      styleProps.classes?.indicator,
                    )}
                  />
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
                  )}
                >
                  <Show when={item.label}>
                    <Show
                      when={styleProps.variant === 'list'}
                      fallback={
                        <p
                          data-slot="label"
                          class={cn('font-medium text-foreground', styleProps.classes?.label)}
                        >
                          {item.label}
                        </p>
                      }
                    >
                      <label
                        for={item.inputId}
                        data-slot="label"
                        class={cn('font-medium text-foreground', styleProps.classes?.label)}
                      >
                        {item.label}
                      </label>
                    </Show>
                  </Show>

                  <Show when={item.description}>
                    <p
                      data-slot="description"
                      class={cn('text-muted-foreground', styleProps.classes?.description)}
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
