import * as KobalteSwitch from '@kobalte/core/switch'
import type { JSX } from 'solid-js'
import { Show, createMemo, mergeProps, splitProps } from 'solid-js'

import { useFormField } from '../form-field/form-field-context'
import type { FormDisableOption, FormIdentityOptions } from '../form-field/form-options'
import { FORM_ID_NAME_DISABLED_ON_CHANGE_KEYS } from '../form-field/form-options'
import type { IconName } from '../icon'
import { Icon } from '../icon'
import type { SlotClasses } from '../shared/slot-class'
import { useId } from '../shared/utils'

import type { SwitchVariantProps } from './switch.class'
import {
  switchBaseVariants,
  switchContainerVariants,
  switchDescriptionVariants,
  switchIconVariants,
  switchLabelVariants,
  switchRootVariants,
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

export interface SwitchBaseProps
  extends SwitchVariantProps, FormIdentityOptions, FormDisableOption {
  loading?: boolean
  loadingIcon?: IconName
  checkedIcon?: IconName
  uncheckedIcon?: IconName
  label?: JSX.Element
  description?: JSX.Element
  classes?: SwitchClasses
}

export type SwitchProps = SwitchBaseProps &
  Omit<KobalteSwitch.SwitchRootProps, keyof SwitchBaseProps | 'children' | 'class'>

export function Switch(props: SwitchProps): JSX.Element {
  const merged = mergeProps(
    {
      size: 'md' as const,
      loading: false,
      loadingIcon: 'icon-loading' as IconName,
    },
    props,
  )

  const [formProps, rootStateProps, displayProps, styleProps, rootProps] = splitProps(
    merged as SwitchProps,
    [...FORM_ID_NAME_DISABLED_ON_CHANGE_KEYS],
    ['value', 'checked', 'defaultChecked', 'required', 'readOnly'],
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
    {
      defaultId: generatedId,
      defaultSize: 'md',
    },
  )

  function onChange(nextChecked: boolean): void {
    formProps.onChange?.(nextChecked)
    field.emitFormChange()
    field.emitFormInput()
  }

  return (
    <KobalteSwitch.Root
      {...rootStateProps}
      id={`${field.id()}-root`}
      name={field.name()}
      disabled={field.disabled()}
      onChange={onChange}
      data-slot="root"
      class={switchRootVariants(
        {
          disabled: field.disabled(),
        },
        styleProps.classes?.root,
      )}
      {...rootProps}
    >
      {(state) => {
        const checked = createMemo(() => state.checked())
        const iconName = createMemo<IconName | undefined>(() => {
          if (displayProps.loading) {
            return displayProps.loadingIcon
          }

          return checked() ? displayProps.checkedIcon : displayProps.uncheckedIcon
        })

        return (
          <>
            <div
              data-slot="container"
              class={switchContainerVariants(
                {
                  size: field.size(),
                },
                styleProps.classes?.container,
              )}
            >
              <KobalteSwitch.Input id={field.id()} data-slot="input" {...field.ariaAttrs()} />

              <KobalteSwitch.Control
                data-slot="base"
                class={switchBaseVariants(
                  {
                    size: field.size(),
                    disabled: field.disabled(),
                    invalid: field.invalid(),
                  },
                  styleProps.classes?.base,
                )}
              >
                <KobalteSwitch.Thumb
                  data-slot="thumb"
                  class={switchThumbVariants(
                    {
                      size: field.size(),
                    },
                    styleProps.classes?.thumb,
                  )}
                >
                  <Show when={iconName()}>
                    {(resolvedIconName) => (
                      <Icon
                        name={resolvedIconName()}
                        class={switchIconVariants(
                          {
                            checked: !displayProps.loading && checked(),
                            unchecked: !displayProps.loading && !checked(),
                            loading: displayProps.loading,
                          },
                          styleProps.classes?.icon,
                        )}
                      />
                    )}
                  </Show>
                </KobalteSwitch.Thumb>
              </KobalteSwitch.Control>
            </div>

            <Show when={displayProps.label || displayProps.description}>
              <div
                data-slot="wrapper"
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
                    class={switchLabelVariants(
                      {
                        required: rootStateProps.required,
                        disabled: field.disabled(),
                      },
                      styleProps.classes?.label,
                    )}
                  >
                    {displayProps.label}
                  </label>
                </Show>

                <Show when={displayProps.description}>
                  <p
                    data-slot="description"
                    class={switchDescriptionVariants(
                      {
                        disabled: field.disabled(),
                      },
                      styleProps.classes?.description,
                    )}
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
