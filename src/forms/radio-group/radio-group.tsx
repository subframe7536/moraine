import type { JSX } from 'solid-js'
import { For, Show, createMemo, mergeProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { HiddenInput } from '../../shared/hidden-input'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { useControllableValue } from '../../shared/use-controllable-value'
import { useSelectableCollectionNavigation } from '../../shared/use-selectable-collection-navigation'
import { cn, useId } from '../../shared/utils'
import { useFormField } from '../form-field/form-field-context'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
  FormValueOptions,
} from '../form-field/form-options'

import type { RadioGroupVariantProps } from './radio-group.class'
import {
  radioGroupBaseVariants,
  radioGroupItemVariants,
  radioGroupRootVariants,
  radioGroupWrapperVariants,
} from './radio-group.class'

export namespace RadioGroupT {
  export interface Slot<T = unknown> {
    /**
     * Radio group container that owns selection state and layout.
     */
    root?: T

    /** Wrapper for one radio option. */
    item?: T

    /** Visible radio control for an individual option. */
    control?: T

    /** Selected-state layer inside an option control. */
    indicator?: T

    /** Inner layout wrapper used by grouped radio variants. */
    wrapper?: T

    /** Primary label text for an option. */
    label?: T

    /** Supporting description for an option. */
    description?: T
  }

  export type Variant = RadioGroupVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  /**
   * A radio item object.
   */
  export interface Item {
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
     * The orientation of the radio group.
     * @default 'vertical'
     */
    orientation?: 'horizontal' | 'vertical'

    /**
     * Array of items to render in the group.
     */
    items?: (string | Item)[]

    /**
     * Callback when the selected value changes.
     */
    onChange?: (value: string) => void
  }

  /**
   * Props for the RadioGroup component.
   */
  export interface Props extends BaseProps<Base, Variant, Slot> {}
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

  const groupId = useId(() => merged.id, 'radio-group')
  const field = useFormField(
    () => ({
      id: merged.id,
      name: merged.name,
      size: merged.size,
      disabled: merged.disabled,
    }),
    () => ({
      bind: false,
      defaultId: groupId(),
      defaultSize: 'md',
      initialValue: merged.defaultValue || '',
    }),
  )
  const readOnly = createMemo(() => Boolean(merged.readOnly))
  const [selectedValue, setSelectedValue] = useControllableValue<string>({
    value: () => merged.value,
    defaultValue: () => merged.defaultValue ?? '',
  })
  const inputRefs = new Map<string, HTMLInputElement>()
  const dataAttrs = createMemo(() => ({
    'data-invalid': field.invalid() ? '' : undefined,
    'data-disabled': field.disabled() ? '' : undefined,
    'data-readonly': readOnly() ? '' : undefined,
    'data-required': merged.required ? '' : undefined,
  }))

  const normalizedItems = createMemo<NormalizedRadioGroupItem[]>(() => {
    const items = merged.items ?? []

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
    if (field.disabled() || readOnly() || nextValue === selectedValue()) {
      return
    }

    setSelectedValue(nextValue)

    field.setFormValue(nextValue)
    merged.onChange?.(nextValue)
    field.emit('change')
    field.emit('input')
  }
  const { onNavigationKeyDown } = useSelectableCollectionNavigation<
    NormalizedRadioGroupItem,
    string
  >({
    items: normalizedItems,
    getValue: (item) => item.value,
    isDisabled: (item) => item.disabled || field.disabled(),
    loop: () => true,
    focusValue: (value) => inputRefs.get(value)?.focus(),
    onSelect: onChange,
  })

  return (
    <div
      id={groupId()}
      role="radiogroup"
      aria-orientation={merged.orientation}
      aria-required={merged.required || undefined}
      aria-disabled={field.disabled() || undefined}
      aria-readonly={readOnly() || undefined}
      data-slot="root"
      style={{ ...merged.styles?.root, ...merged.style }}
      class={radioGroupRootVariants(
        {
          orientation: merged.orientation,
        },
        merged.variant !== 'table' && 'gap-2',
        merged.classes?.root,
        merged.class,
      )}
      {...dataAttrs()}
      {...field.ariaAttrs()}
    >
      <For each={normalizedItems()}>
        {(item) => {
          const disabled = createMemo(() => Boolean(item.disabled || field.disabled()))
          const selected = createMemo(() => item.value === selectedValue())

          return (
            <Dynamic
              component={merged.variant === 'list' ? 'div' : 'label'}
              id={item.id}
              data-slot="item"
              data-checked={merged.variant === 'list' ? undefined : selected() ? '' : undefined}
              style={merged.styles?.item}
              class={radioGroupItemVariants(
                {
                  size: field.size(),
                  variant: merged.variant === 'list' ? undefined : merged.variant,
                  indicator: merged.indicator === 'hidden' ? undefined : merged.indicator,
                  tableOrientation: merged.variant === 'table' ? merged.orientation : undefined,
                },
                merged.classes?.item,
              )}
            >
              <HiddenInput
                ref={(element) => {
                  inputRefs.set(item.value, element)
                }}
                id={item.inputId}
                type="radio"
                name={field.name()}
                value={item.value}
                checked={selected()}
                required={merged.required}
                disabled={disabled()}
                readOnly={readOnly()}
                aria-required={merged.required || undefined}
                aria-disabled={disabled() || undefined}
                aria-readonly={readOnly() || undefined}
                class="peer"
                data-slot="input"
                onChange={(event) => {
                  event.stopPropagation()
                  onChange(item.value)
                  event.currentTarget.checked = selected()
                }}
                onKeyDown={(event) => {
                  onNavigationKeyDown(event, item.value, merged.orientation)
                }}
              />

              <div
                data-slot="control"
                style={merged.styles?.control}
                class={radioGroupBaseVariants(
                  { size: field.size() },
                  merged.indicator === 'hidden' && 'sr-only',
                  merged.classes?.control,
                )}
                data-checked={selected() ? '' : undefined}
                data-invalid={field.invalid() ? '' : undefined}
                data-disabled={disabled() ? '' : undefined}
                data-readonly={readOnly() ? '' : undefined}
                data-required={merged.required ? '' : undefined}
              >
                <Show when={selected()}>
                  <div
                    data-slot="indicator"
                    style={merged.styles?.indicator}
                    class={cn(
                      'rounded-full flex size-full ring-(4 primary ring inset) items-center justify-center',
                      merged.classes?.indicator,
                    )}
                    data-checked={selected() ? '' : undefined}
                    data-invalid={field.invalid() ? '' : undefined}
                    data-disabled={disabled() ? '' : undefined}
                    data-readonly={readOnly() ? '' : undefined}
                    data-required={merged.required ? '' : undefined}
                  />
                </Show>
              </div>

              <Show when={item.label || item.description}>
                <div
                  data-slot="wrapper"
                  style={merged.styles?.wrapper}
                  class={radioGroupWrapperVariants(
                    {
                      indicator: merged.indicator,
                    },
                    merged.classes?.wrapper,
                  )}
                >
                  <Show when={item.label}>
                    <Show
                      when={merged.variant === 'list'}
                      fallback={
                        <p
                          data-slot="label"
                          style={merged.styles?.label}
                          class={cn('text-foreground font-medium', merged.classes?.label)}
                        >
                          {item.label}
                        </p>
                      }
                    >
                      <label
                        for={item.inputId}
                        data-slot="label"
                        style={merged.styles?.label}
                        class={cn('text-foreground font-medium', merged.classes?.label)}
                      >
                        {item.label}
                      </label>
                    </Show>
                  </Show>

                  <Show when={item.description}>
                    <p
                      data-slot="description"
                      style={merged.styles?.description}
                      class={cn('text-muted-foreground', merged.classes?.description)}
                    >
                      {item.description}
                    </p>
                  </Show>
                </div>
              </Show>
            </Dynamic>
          )
        }}
      </For>
    </div>
  )
}
