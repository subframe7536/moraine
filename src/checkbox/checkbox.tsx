import * as KobalteCheckbox from '@kobalte/core/checkbox'
import type { JSX } from 'solid-js'
import { Show, mergeProps, splitProps } from 'solid-js'

import { useFormField } from '../form-field/form-field-context'
import type { FormDisableOption, FormIdentityOptions } from '../form-field/form-options'
import { FORM_ID_NAME_DISABLED_ON_CHANGE_KEYS } from '../form-field/form-options'
import type { IconName } from '../icon'
import { Icon } from '../icon'
import type { SlotClasses } from '../shared/slot-class'
import { cn, useId } from '../shared/utils'

import type { CheckboxVariantProps } from './checkbox.class'
import {
  checkboxBaseVariants,
  checkboxCardPaddingVariants,
  checkboxContainerVariants,
  checkboxDescriptionVariants,
  checkboxIconVariants,
  checkboxLabelVariants,
  checkboxRootVariants,
  checkboxWrapperVariants,
} from './checkbox.class'

type CheckboxSlots =
  | 'root'
  | 'container'
  | 'base'
  | 'indicator'
  | 'icon'
  | 'wrapper'
  | 'label'
  | 'description'

export type CheckboxClasses = SlotClasses<CheckboxSlots>

export interface CheckboxBaseProps
  extends CheckboxVariantProps, FormIdentityOptions, FormDisableOption {
  label?: JSX.Element
  description?: JSX.Element
  formFieldBind?: boolean
  checkedIcon?: IconName
  indeterminateIcon?: IconName
  classes?: CheckboxClasses
}

export type CheckboxProps = CheckboxBaseProps &
  Omit<KobalteCheckbox.CheckboxRootProps, keyof CheckboxBaseProps | 'children' | 'class' | 'ref'>

export function Checkbox(props: CheckboxProps): JSX.Element {
  const merged = mergeProps(
    {
      size: 'md' as const,
      variant: 'list' as const,
      indicator: 'start' as const,
      checkedIcon: 'icon-check' as IconName,
      indeterminateIcon: 'icon-minus' as IconName,
      formFieldBind: true,
    },
    props,
  )

  const [formProps, styleProps, rootProps] = splitProps(
    merged as CheckboxProps,
    [...FORM_ID_NAME_DISABLED_ON_CHANGE_KEYS, 'formFieldBind'],
    [
      'label',
      'description',
      'size',
      'variant',
      'indicator',
      'checkedIcon',
      'indeterminateIcon',
      'classes',
    ],
  )

  const generatedId = useId(() => formProps.id, 'checkbox')
  const field = useFormField(
    () => ({
      id: formProps.id,
      name: formProps.name,
      size: styleProps.size,
      disabled: formProps.disabled,
    }),
    () => ({
      bind: formProps.formFieldBind,
      defaultId: generatedId,
      defaultSize: 'md',
    }),
  )

  function onChange(nextChecked: boolean): void {
    formProps.onChange?.(nextChecked)
    field.emitFormChange()
    field.emitFormInput()
  }

  return (
    <KobalteCheckbox.Root
      as={styleProps.variant === 'card' ? 'label' : 'div'}
      id={`${field.id()}-root`}
      name={field.name()}
      disabled={field.disabled()}
      onChange={onChange}
      data-slot="root"
      class={checkboxRootVariants(
        {
          variant: styleProps.variant === 'card' ? 'card' : undefined,
          indicator: styleProps.indicator === 'hidden' ? undefined : styleProps.indicator,
          disabled: field.disabled(),
        },
        styleProps.variant === 'card' &&
          checkboxCardPaddingVariants({
            size: field.size(),
          }),
        styleProps.classes?.root,
      )}
      {...rootProps}
    >
      {(state) => (
        <>
          <div
            data-slot="container"
            class={checkboxContainerVariants(
              {
                size: field.size(),
              },
              styleProps.classes?.container,
            )}
          >
            <KobalteCheckbox.Input id={field.id()} data-slot="input" {...field.ariaAttrs()} />

            <KobalteCheckbox.Control
              data-slot="base"
              class={checkboxBaseVariants(
                {
                  size: field.size(),
                  disabled: field.disabled(),
                  invalid: field.invalid(),
                },
                styleProps.indicator === 'hidden' && 'sr-only',
                styleProps.classes?.base,
              )}
            >
              <KobalteCheckbox.Indicator
                data-slot="indicator"
                class={cn(
                  'flex size-full items-center justify-center bg-primary text-primary-foreground',
                  styleProps.classes?.indicator,
                )}
              >
                <Show
                  when={state.indeterminate()}
                  fallback={
                    <Icon
                      name={styleProps.checkedIcon}
                      class={checkboxIconVariants(
                        {
                          size: field.size(),
                        },
                        styleProps.classes?.icon,
                      )}
                    />
                  }
                >
                  <Icon
                    name={styleProps.indeterminateIcon}
                    class={checkboxIconVariants(
                      {
                        size: field.size(),
                      },
                      styleProps.classes?.icon,
                    )}
                  />
                </Show>
              </KobalteCheckbox.Indicator>
            </KobalteCheckbox.Control>
          </div>

          <Show when={styleProps.label || styleProps.description}>
            <div
              data-slot="wrapper"
              class={checkboxWrapperVariants(
                {
                  indicator: styleProps.indicator,
                  size: field.size(),
                },
                styleProps.classes?.wrapper,
              )}
            >
              <Show when={styleProps.label}>
                <Show
                  when={styleProps.variant === 'card'}
                  fallback={
                    <label
                      for={field.id()}
                      data-slot="label"
                      class={checkboxLabelVariants(
                        {
                          required: rootProps.required,
                          disabled: field.disabled(),
                        },
                        styleProps.classes?.label,
                      )}
                    >
                      {styleProps.label}
                    </label>
                  }
                >
                  <p
                    data-slot="label"
                    class={checkboxLabelVariants(
                      {
                        required: rootProps.required,
                        disabled: field.disabled(),
                      },
                      styleProps.classes?.label,
                    )}
                  >
                    {styleProps.label}
                  </p>
                </Show>
              </Show>

              <Show when={styleProps.description}>
                <p
                  data-slot="description"
                  class={checkboxDescriptionVariants(
                    {
                      disabled: field.disabled(),
                    },
                    styleProps.classes?.description,
                  )}
                >
                  {styleProps.description}
                </p>
              </Show>
            </div>
          </Show>
        </>
      )}
    </KobalteCheckbox.Root>
  )
}
