import * as KobalteRadioGroup from '@kobalte/core/radio-group'
import type { JSX } from 'solid-js'
import { For, Show, createMemo, mergeProps, splitProps } from 'solid-js'

import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
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

export namespace RadioGroupT {
  export type Slot =
    | 'root'
    | 'fieldset'
    | 'legend'
    | 'item'
    | 'container'
    | 'control'
    | 'indicator'
    | 'wrapper'
    | 'label'
    | 'description'

  export type Variant = RadioGroupVariantProps
  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>
  export type Extend = KobalteRadioGroup.RadioGroupRootProps

  /**
   * A radio item object.
   */
  export interface Items {
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

  /**
   * Base props for the RadioGroup component.
   */
  export interface Base
    extends
      FormIdentityOptions,
      FormValueOptions<string>,
      FormRequiredOption,
      FormDisableOption,
      FormReadOnlyOption {
    /**
     * Legend for the radio group.
     */
    legend?: JSX.Element

    /**
     * Array of items to render in the group.
     */
    items?: (string | Items)[]

    /**
     * Callback when the selected value changes.
     */
    onChange?: (value: string) => void
  }

  /**
   * Props for the RadioGroup component.
   */
  export interface Props extends BaseProps<Base, Variant, Extend, Slot> {}
}

/**
 * Props for the RadioGroup component.
 */
export interface RadioGroupProps extends RadioGroupT.Props {}

interface NormalizedRadioGroupItem {
  id: string
  inputId: string
  value: string
  label?: JSX.Element
  description?: JSX.Element
  disabled: boolean
}

/** Single-select radio group with card, list, and table layout variants. */
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

  const [local, rest] = splitProps(merged, [
    ...FORM_ID_NAME_VALUE_REQUIRED_DISABLED_KEYS,
    'onChange',
    'legend',
    'items',
    'variant',
    'indicator',
    'orientation',
    'size',
    'classes',
  ])

  const groupId = useId(() => local.id, 'radio-group')
  const field = useFormField(
    () => ({
      id: local.id,
      name: local.name,
      size: local.size,
      disabled: local.disabled,
    }),
    () => ({
      bind: false,
      defaultId: groupId(),
      defaultSize: 'md',
      initialValue: local.defaultValue || '',
    }),
  )

  const legendId = createMemo(() => `${groupId()}-legend`)

  const normalizedItems = createMemo<NormalizedRadioGroupItem[]>(() => {
    const items = local.items ?? []

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
    local.onChange?.(nextValue)
    field.emit('change')
    field.emit('input')
  }

  return (
    <KobalteRadioGroup.Root
      id={groupId()}
      name={field.name()}
      value={local.value}
      defaultValue={local.defaultValue}
      disabled={field.disabled()}
      required={local.required}
      orientation={local.orientation}
      onChange={onChange}
      data-slot="root"
      style={merged.styles?.root}
      class={cn('relative', local.classes?.root)}
      {...field.ariaAttrs()}
      {...rest}
    >
      <fieldset
        data-slot="fieldset"
        style={merged.styles?.fieldset}
        aria-labelledby={local.legend ? legendId() : undefined}
        class={radioGroupFieldsetVariants(
          {
            orientation: local.orientation,
          },
          local.variant !== 'table' && 'gap-2',
          local.classes?.fieldset,
        )}
      >
        <Show when={local.legend}>
          <legend
            id={legendId()}
            data-slot="legend"
            style={merged.styles?.legend}
            class={radioGroupLegendVariants(
              {
                size: field.size(),
                required: local.required,
              },
              local.classes?.legend,
            )}
          >
            {local.legend}
          </legend>
        </Show>

        <For each={normalizedItems()}>
          {(item) => (
            <KobalteRadioGroup.Item
              as={local.variant === 'list' ? 'div' : 'label'}
              id={item.id}
              value={item.value}
              disabled={item.disabled || field.disabled()}
              data-slot="item"
              style={merged.styles?.item}
              data-disabled={item.disabled || field.disabled() ? '' : undefined}
              class={radioGroupItemVariants(
                {
                  size: field.size(),
                  variant: local.variant === 'list' ? undefined : local.variant,
                  indicator: local.indicator === 'hidden' ? undefined : local.indicator,
                  tableOrientation: local.variant === 'table' ? local.orientation : undefined,
                },
                local.classes?.item,
              )}
            >
              <div
                data-slot="container"
                style={merged.styles?.container}
                class={radioGroupContainerVariants(
                  {
                    size: field.size(),
                  },
                  local.classes?.container,
                )}
              >
                <KobalteRadioGroup.ItemInput id={item.inputId} class="peer" data-slot="input" />

                <KobalteRadioGroup.ItemControl
                  data-slot="control"
                  style={merged.styles?.control}
                  data-invalid={field.invalid() ? '' : undefined}
                  class={radioGroupBaseVariants(
                    {
                      size: field.size(),
                    },
                    local.indicator === 'hidden' && 'sr-only',
                    local.classes?.control,
                  )}
                >
                  <KobalteRadioGroup.ItemIndicator
                    data-slot="indicator"
                    style={merged.styles?.indicator}
                    class={cn(
                      'rounded-full flex size-full ring-(4 primary ring inset) items-center justify-center',
                      local.classes?.indicator,
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
                      indicator: local.indicator,
                    },
                    local.classes?.wrapper,
                  )}
                >
                  <Show when={item.label}>
                    <Show
                      when={local.variant === 'list'}
                      fallback={
                        <p
                          data-slot="label"
                          style={merged.styles?.label}
                          class={cn('text-foreground font-medium', local.classes?.label)}
                        >
                          {item.label}
                        </p>
                      }
                    >
                      <label
                        for={item.inputId}
                        data-slot="label"
                        style={merged.styles?.label}
                        class={cn('text-foreground font-medium', local.classes?.label)}
                      >
                        {item.label}
                      </label>
                    </Show>
                  </Show>

                  <Show when={item.description}>
                    <p
                      data-slot="description"
                      style={merged.styles?.description}
                      class={cn('text-muted-foreground', local.classes?.description)}
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
