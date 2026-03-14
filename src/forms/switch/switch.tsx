import * as KobalteSwitch from '@kobalte/core/switch'
import type { JSX } from 'solid-js'
import { Show, createEffect, createMemo, mergeProps, splitProps } from 'solid-js'

import type { IconName } from '../../elements/icon'
import { Icon } from '../../elements/icon'
import type { SlotClasses, SlotStyles } from '../../shared/slot'
import { cn, useId } from '../../shared/utils'
import { useFormField } from '../form-field/form-field-context'
import type { FormDisableOption, FormIdentityOptions } from '../form-field/form-options'
import { FORM_ID_NAME_DISABLED_ON_CHANGE_KEYS } from '../form-field/form-options'

import type { SwitchVariantProps } from './switch.class'
import {
  switchBaseVariants,
  switchContainerVariants,
  switchIconClass,
  switchThumbVariants,
  switchWrapperVariants,
} from './switch.class'

type SwitchSlots =
  | 'root'
  | 'container'
  | 'base'
  | 'thumb'
  | 'icon'
  | 'wrapper'
  | 'label'
  | 'description'

export type SwitchClasses = SlotClasses<SwitchSlots>

export type SwitchStyles = SlotStyles<SwitchSlots>

export interface SwitchBaseProps<TTrue = boolean, TFalse = boolean>
  extends SwitchVariantProps, FormIdentityOptions, FormDisableOption {
  checked?: TTrue | TFalse
  defaultChecked?: boolean
  trueValue?: TTrue
  falseValue?: TFalse
  loading?: boolean
  loadingIcon?: IconName
  checkedIcon?: IconName
  uncheckedIcon?: IconName
  label?: JSX.Element
  description?: JSX.Element
  onChange?: (value: TTrue | TFalse) => void
  classes?: SwitchClasses
  styles?: SwitchStyles
}

export type SwitchProps<TTrue = boolean, TFalse = boolean> = SwitchBaseProps<TTrue, TFalse> &
  Omit<KobalteSwitch.SwitchRootProps, keyof SwitchBaseProps | 'children' | 'class'>

export function Switch<TTrue = boolean, TFalse = boolean>(
  props: SwitchProps<TTrue, TFalse>,
): JSX.Element {
  const merged = mergeProps(
    {
      size: 'md' as const,
      loading: false,
      loadingIcon: 'icon-loading' as IconName,
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
        const resolvedIconName = (): IconName | undefined => {
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
                data-slot="base"
                style={merged.styles?.base}
                data-invalid={field.invalid() ? '' : undefined}
                class={switchBaseVariants(
                  {
                    size: field.size(),
                  },
                  styleProps.classes?.base,
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
