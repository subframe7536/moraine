import * as KobalteRadioGroup from '@kobalte/core/radio-group'
import type { JSX } from 'solid-js'
import { For, Show, createMemo, mergeProps, splitProps } from 'solid-js'

import type { SlotClasses, SlotStyles } from '../../shared/slot'
import type { RockUIComposeProps } from '../../shared/types'
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

export type RadioGroupStyles = SlotStyles<RadioGroupSlots>

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

export type RadioGroupItemStyles = SlotStyles<RadioGroupItemSlots>

export interface RadioGroupItemObject {
  /**
   * Value of the radio item.
   */
  value?: string

  /**
   * Label for the radio item.
   */
  label?: JSX.Element

  /**
   * Description for the radio item.
   */
  description?: JSX.Element

  /**
   * Whether the item is disabled.
   */
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

/**
 * Base props for the RadioGroup component.
 */
export interface RadioGroupBaseProps
  extends
    FormIdentityOptions,
    FormValueOptions<RadioGroupValue>,
    FormRequiredOption,
    FormDisableOption,
    FormReadOnlyOption,
    RadioGroupVariantProps {
  /**
   * Legend for the radio group.
   */
  legend?: JSX.Element

  /**
   * Array of items to render in the group.
   */
  items?: RadioGroupItem[]

  /**
   * Callback when the selected value changes.
   */
  onChange?: (value: RadioGroupValue) => void

  /**
   * Slot-based class overrides.
   */
  classes?: RadioGroupClasses

  /**
   * Slot-based style overrides.
   */
  styles?: RadioGroupStyles
}

/**
 * Props for the RadioGroup component.
 */
export type RadioGroupProps = RockUIComposeProps<
  RadioGroupBaseProps,
  KobalteRadioGroup.RadioGroupRootProps
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
      style={merged.styles?.root}
      class={cn('relative', styleProps.classes?.root)}
      {...field.ariaAttrs()}
      {...restProps}
    >
      <fieldset
        data-slot="fieldset"
        style={merged.styles?.fieldset}
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
            style={merged.styles?.legend}
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
              style={merged.styles?.item}
              data-disabled={item.disabled || field.disabled() ? '' : undefined}
              class={radioGroupItemVariants(
                {
                  size: field.size(),
                  variant: styleProps.variant === 'list' ? undefined : styleProps.variant,
                  indicator: styleProps.indicator === 'hidden' ? undefined : styleProps.indicator,
                  tableOrientation:
                    styleProps.variant === 'table' ? styleProps.orientation : undefined,
                },
                styleProps.classes?.item,
              )}
            >
              <div
                data-slot="container"
                style={merged.styles?.container}
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
                  style={merged.styles?.base}
                  data-invalid={field.invalid() ? '' : undefined}
                  class={radioGroupBaseVariants(
                    {
                      size: field.size(),
                    },
                    styleProps.indicator === 'hidden' && 'sr-only',
                    styleProps.classes?.base,
                  )}
                >
                  <KobalteRadioGroup.ItemIndicator
                    data-slot="indicator"
                    style={merged.styles?.indicator}
                    class={cn(
                      'rounded-full flex size-full ring-(4 primary ring inset) items-center justify-center',
                      styleProps.classes?.indicator,
                    )}
                  />
                </KobalteRadioGroup.ItemControl>
              </div>

              <Show when={item.label || item.description}>
                <div
                  data-slot="wrapper"
                  style={merged.styles?.wrapper}
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
                          style={merged.styles?.label}
                          class={cn('text-foreground font-medium', styleProps.classes?.label)}
                        >
                          {item.label}
                        </p>
                      }
                    >
                      <label
                        for={item.inputId}
                        data-slot="label"
                        style={merged.styles?.label}
                        class={cn('text-foreground font-medium', styleProps.classes?.label)}
                      >
                        {item.label}
                      </label>
                    </Show>
                  </Show>

                  <Show when={item.description}>
                    <p
                      data-slot="description"
                      style={merged.styles?.description}
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
