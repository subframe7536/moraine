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
  switchTrackVariants,
  switchContainerVariants,
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
  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>
  export type Extend = KobalteSwitch.SwitchRootProps

  export interface Items {}

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

  const [local, rest] = splitProps(merged, [
    ...FORM_ID_NAME_DISABLED_ON_CHANGE_KEYS,
    'checked',
    'defaultChecked',
    'trueValue',
    'falseValue',
    'loading',
    'loadingIcon',
    'checkedIcon',
    'uncheckedIcon',
    'label',
    'description',
    'size',
    'classes',
  ])

  const generatedId = useId(() => local.id, 'switch')
  const field = useFormField(
    () => ({
      id: local.id,
      name: local.name,
      size: local.size,
      disabled: local.disabled || local.loading,
    }),
    () => ({
      defaultId: generatedId(),
      defaultSize: 'md',
      initialValue:
        normalizeFieldValue(local.checked !== undefined ? local.checked : local.defaultChecked) ??
        local.falseValue,
    }),
  )

  function toCheckedState(value: unknown): boolean {
    if (value === local.trueValue) {
      return true
    }

    if (value === local.falseValue) {
      return false
    }

    return typeof value === 'boolean' ? value : false
  }

  function normalizeFieldValue(value: unknown): unknown {
    if (value === undefined) {
      return value
    }

    if (value === local.trueValue || value === local.falseValue) {
      return value
    }

    if (typeof value === 'boolean') {
      return value ? local.trueValue : local.falseValue
    }

    return value
  }

  const checked = createMemo<boolean | undefined>(() => {
    if (local.checked !== undefined) {
      return toCheckedState(local.checked)
    }

    if (field.value() !== undefined) {
      return toCheckedState(field.value())
    }

    return undefined
  })

  createEffect(() => {
    if (local.checked === undefined) {
      return
    }

    field.setFormValue(normalizeFieldValue(local.checked))
  })

  function onChange(nextChecked: boolean): void {
    const nextValue = nextChecked ? (local.trueValue as TTrue) : (local.falseValue as TFalse)

    field.setFormValue(nextValue)
    local.onChange?.(nextValue)
    field.emit('change')
    field.emit('input')
  }

  return (
    <KobalteSwitch.Root
      id={`${field.id()}-root`}
      name={field.name()}
      disabled={field.disabled()}
      checked={checked()}
      defaultChecked={local.defaultChecked}
      onChange={onChange}
      data-slot="root"
      style={merged.styles?.root}
      class={cn('flex items-start relative', field.disabled() && 'effect-dis', local.classes?.root)}
      {...rest}
    >
      {(state) => {
        const resolvedIconName = (): IconT.Name | undefined => {
          if (local.loading) {
            return local.loadingIcon
          }

          return state.checked() ? local.checkedIcon : local.uncheckedIcon
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
                local.classes?.container,
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
                class={switchTrackVariants(
                  {
                    size: field.size(),
                  },
                  local.classes?.track,
                )}
              >
                <KobalteSwitch.Thumb
                  data-slot="thumb"
                  style={merged.styles?.thumb}
                  class={switchThumbVariants(
                    {
                      size: field.size(),
                    },
                    local.classes?.thumb,
                  )}
                >
                  <Show when={resolvedIconName()} keyed>
                    {(iconName) => (
                      <Icon
                        name={iconName}
                        data-checked={!local.loading && state.checked() ? '' : undefined}
                        data-unchecked={!local.loading && !state.checked() ? '' : undefined}
                        data-loading={local.loading ? '' : undefined}
                        class={cn(
                          'text-primary size-10/12 transition-opacity absolute data-unchecked:(text-muted-foreground opacity-90) data-checked:opacity-100 data-loading:effect-loading',
                          local.classes?.icon,
                        )}
                      />
                    )}
                  </Show>
                </KobalteSwitch.Thumb>
              </KobalteSwitch.Control>
            </div>

            <Show when={local.label || local.description}>
              <div
                data-slot="wrapper"
                style={merged.styles?.wrapper}
                class={switchWrapperVariants(
                  {
                    size: field.size(),
                  },
                  local.classes?.wrapper,
                )}
              >
                <Show when={local.label}>
                  <label
                    for={field.id()}
                    data-slot="label"
                    style={merged.styles?.label}
                    class={cn(
                      'text-foreground font-medium block cursor-pointer',
                      rest.required && "after:(text-destructive ms-0.5 content-['*'])",
                      local.classes?.label,
                    )}
                  >
                    {local.label}
                  </label>
                </Show>

                <Show when={local.description}>
                  <p
                    data-slot="description"
                    style={merged.styles?.description}
                    class={cn('text-muted-foreground', local.classes?.description)}
                  >
                    {local.description}
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
