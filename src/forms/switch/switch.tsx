import * as KobalteSwitch from '@kobalte/core/switch'
import type { JSX } from 'solid-js'
import { Show, mergeProps, splitProps } from 'solid-js'

import type { IconName } from '../../elements/icon'
import { Icon } from '../../elements/icon'
import type { SlotClasses } from '../../shared/slot-class'
import { cn, useId } from '../../shared/utils'
import { useFormField } from '../form-field/form-field-context'
import type { FormDisableOption, FormIdentityOptions } from '../form-field/form-options'
import { FORM_ID_NAME_DISABLED_ON_CHANGE_KEYS } from '../form-field/form-options'

import type { SwitchVariantProps } from './switch.class'
import {
  switchBaseVariants,
  switchContainerVariants,
  switchIconVariants,
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

  const [formProps, displayProps, styleProps, restProps] = splitProps(
    merged as SwitchProps,
    [...FORM_ID_NAME_DISABLED_ON_CHANGE_KEYS],
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
      initialValue: restProps.defaultChecked || false,
    }),
  )

  function onChange(nextChecked: boolean): void {
    field.setFormValue(nextChecked)
    formProps.onChange?.(nextChecked)
    field.emit('change')
    field.emit('input')
  }

  return (
    <KobalteSwitch.Root
      id={`${field.id()}-root`}
      name={field.name()}
      disabled={field.disabled()}
      onChange={onChange}
      data-slot="root"
      class={cn(
        'relative flex items-start',
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
                class={switchBaseVariants(
                  {
                    size: field.size(),
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
                  <Show when={resolvedIconName()} keyed>
                    {(iconName) => (
                      <Icon
                        name={iconName}
                        class={switchIconVariants(
                          {
                            checked: !displayProps.loading && state.checked(),
                            unchecked: !displayProps.loading && !state.checked(),
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
                    class={cn(
                      'block font-medium text-foreground',
                      restProps.required && "after:(ms-0.5 text-destructive content-['*'])",
                      styleProps.classes?.label,
                    )}
                  >
                    {displayProps.label}
                  </label>
                </Show>

                <Show when={displayProps.description}>
                  <p
                    data-slot="description"
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
