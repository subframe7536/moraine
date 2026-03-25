import * as KobalteSwitch from '@kobalte/core/switch'
import type { JSX } from 'solid-js'
import { Show, createEffect, createMemo, mergeProps, splitProps } from 'solid-js'

import type { IconT } from '../../elements/icon'
import { Icon } from '../../elements/icon'
import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
import { cn, useId } from '../../shared/utils'
import { useFormField } from '../form-field/form-field-context'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
} from '../form-field/form-options'
import { FORM_ID_NAME_DISABLED_ON_CHANGE_KEYS } from '../form-field/form-options'

import type { SwitchVariantProps } from './switch.class'
import {
  switchBaseVariants,
  switchContainerVariants,
  switchIconClass,
  switchThumbVariants,
  switchWrapperVariants,
} from './switch.class'

export namespace SwitchT {
  export type Slot =
    | 'root'
    | 'container'
    | 'track'
    | 'thumb'
    | 'icon'
    | 'wrapper'
    | 'label'
    | 'description'

  export type Variant = SwitchVariantProps

  export interface Items {}

  export type Extend = KobalteSwitch.SwitchRootProps
  export interface Classes extends SlotClasses<Slot> {}
  export interface Styles extends SlotStyles<Slot> {}

  /**
   * Base props for the Switch component.
   */
  export interface Base<TTrue = boolean, TFalse = boolean>
    extends FormIdentityOptions, FormDisableOption, FormRequiredOption, FormReadOnlyOption {
    /**
     * Whether the switch is checked.
     */
    checked?: TTrue | TFalse

    /**
     * Whether the switch is checked by default.
     */
    defaultChecked?: boolean

    /**
     * Value to use when the switch is checked.
     * @default true
     */
    trueValue?: TTrue

    /**
     * Value to use when the switch is unchecked.
     * @default false
     */
    falseValue?: TFalse

    /**
     * Whether the switch is in a loading state.
     * @default false
     */
    loading?: boolean

    /**
     * Icon shown during loading state.
     * @default 'icon-loading'
     */
    loadingIcon?: IconT.Name

    /**
     * Icon shown when the switch is checked.
     */
    checkedIcon?: IconT.Name

    /**
     * Icon shown when the switch is unchecked.
     */
    uncheckedIcon?: IconT.Name

    /**
     * Label for the switch.
     */
    label?: JSX.Element

    /**
     * Description for the switch.
     */
    description?: JSX.Element

    /**
     * Callback when the switch state changes.
     */
    onChange?: (value: TTrue | TFalse) => void
  }

  /**
   * Props for the Switch component.
   */
  export interface Props<TTrue = boolean, TFalse = boolean> extends BaseProps<
    Base<TTrue, TFalse>,
    Variant,
    Extend,
    Slot
  > {}
}

/**
 * Props for the Switch component.
 */
export interface SwitchProps<TTrue = boolean, TFalse = boolean> extends SwitchT.Props<
  TTrue,
  TFalse
> {}

/** Toggle switch control with icon slots and loading state. */
export function Switch<TTrue = boolean, TFalse = boolean>(
  props: SwitchProps<TTrue, TFalse>,
): JSX.Element {
  const merged = mergeProps(
    {
      size: 'md' as const,
      loading: false,
      loadingIcon: 'icon-loading' as IconT.Name,
      trueValue: true,
      falseValue: false,
    },
    props,
  )

  const [formProps, displayProps, styleProps, restProps] = splitProps(
    merged as SwitchProps<TTrue, TFalse>,
    [
      ...FORM_ID_NAME_DISABLED_ON_CHANGE_KEYS,
      'checked',
      'defaultChecked',
      'trueValue',
      'falseValue',
    ],
    ['loading', 'loadingIcon', 'checkedIcon', 'uncheckedIcon', 'label', 'description'],
    ['size', 'classes'],
  )

  const generatedId = useId(() => formProps.id, 'switch')
  const field = useFormField(
    () => ({
      id: formProps.id,
      name: formProps.name,
      size: styleProps.size,
      disabled: formProps.disabled || displayProps.loading,
    }),
    () => ({
      defaultId: generatedId(),
      defaultSize: 'md',
      initialValue:
        normalizeFieldValue(
          formProps.checked !== undefined ? formProps.checked : formProps.defaultChecked,
        ) ?? formProps.falseValue,
    }),
  )

  function toCheckedState(value: unknown): boolean {
    if (value === formProps.trueValue) {
      return true
    }

    if (value === formProps.falseValue) {
      return false
    }

    return typeof value === 'boolean' ? value : false
  }

  function normalizeFieldValue(value: unknown): unknown {
    if (value === undefined) {
      return value
    }

    if (value === formProps.trueValue || value === formProps.falseValue) {
      return value
    }

    if (typeof value === 'boolean') {
      return value ? formProps.trueValue : formProps.falseValue
    }

    return value
  }

  function toChangeValue(nextChecked: boolean): TTrue | TFalse {
    return nextChecked ? (formProps.trueValue as TTrue) : (formProps.falseValue as TFalse)
  }

  const checked = createMemo<boolean | undefined>(() => {
    if (formProps.checked !== undefined) {
      return toCheckedState(formProps.checked)
    }

    if (field.value() !== undefined) {
      return toCheckedState(field.value())
    }

    return undefined
  })

  createEffect(() => {
    if (formProps.checked === undefined) {
      return
    }

    field.setFormValue(normalizeFieldValue(formProps.checked))
  })

  function onChange(nextChecked: boolean): void {
    const nextValue = toChangeValue(nextChecked)

    field.setFormValue(nextValue)
    formProps.onChange?.(nextValue)
    field.emit('change')
    field.emit('input')
  }

  return (
    <KobalteSwitch.Root
      id={`${field.id()}-root`}
      name={field.name()}
      disabled={field.disabled()}
      checked={checked()}
      defaultChecked={formProps.defaultChecked}
      onChange={onChange}
      data-slot="root"
      style={merged.styles?.root}
      class={cn(
        'flex items-start relative',
        field.disabled() && 'effect-dis',
        styleProps.classes?.root,
      )}
      {...restProps}
    >
      {(state) => {
        const resolvedIconName = (): IconT.Name | undefined => {
          if (displayProps.loading) {
            return displayProps.loadingIcon
          }

          return state.checked() ? displayProps.checkedIcon : displayProps.uncheckedIcon
        }

        return (
          <>
            <div
              data-slot="container"
              style={merged.styles?.container}
              class={switchContainerVariants(
                {
                  size: field.size(),
                },
                styleProps.classes?.container,
              )}
            >
              <KobalteSwitch.Input
                id={field.id()}
                class="peer"
                data-slot="input"
                {...field.ariaAttrs()}
              />

              <KobalteSwitch.Control
                data-slot="track"
                style={merged.styles?.track}
                data-invalid={field.invalid() ? '' : undefined}
                class={switchBaseVariants(
                  {
                    size: field.size(),
                  },
                  styleProps.classes?.track,
                )}
              >
                <KobalteSwitch.Thumb
                  data-slot="thumb"
                  style={merged.styles?.thumb}
                  class={switchThumbVariants(
                    {
                      size: field.size(),
                    },
                    styleProps.classes?.thumb,
                  )}
                >
                  <Show when={resolvedIconName()} keyed>
                    {(iconName) => (
                      <Icon
                        name={iconName}
                        data-checked={!displayProps.loading && state.checked() ? '' : undefined}
                        data-unchecked={!displayProps.loading && !state.checked() ? '' : undefined}
                        data-loading={displayProps.loading ? '' : undefined}
                        class={cn(switchIconClass, styleProps.classes?.icon)}
                      />
                    )}
                  </Show>
                </KobalteSwitch.Thumb>
              </KobalteSwitch.Control>
            </div>

            <Show when={displayProps.label || displayProps.description}>
              <div
                data-slot="wrapper"
                style={merged.styles?.wrapper}
                class={switchWrapperVariants(
                  {
                    size: field.size(),
                  },
                  styleProps.classes?.wrapper,
                )}
              >
                <Show when={displayProps.label}>
                  <label
                    for={field.id()}
                    data-slot="label"
                    style={merged.styles?.label}
                    class={cn(
                      'text-foreground font-medium block',
                      restProps.required && "after:(text-destructive ms-0.5 content-['*'])",
                      styleProps.classes?.label,
                    )}
                  >
                    {displayProps.label}
                  </label>
                </Show>

                <Show when={displayProps.description}>
                  <p
                    data-slot="description"
                    style={merged.styles?.description}
                    class={cn('text-muted-foreground', styleProps.classes?.description)}
                  >
                    {displayProps.description}
                  </p>
                </Show>
              </div>
            </Show>
          </>
        )
      }}
    </KobalteSwitch.Root>
  )
}
