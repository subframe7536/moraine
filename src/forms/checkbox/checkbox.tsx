import * as KobalteCheckbox from '@kobalte/core/checkbox'
import type { JSX } from 'solid-js'
import { Show, mergeProps, splitProps } from 'solid-js'

import type { IconName } from '../../elements/icon'
import { Icon } from '../../elements/icon'
import type { SlotClasses } from '../../shared/slot-class'
import { cn, useId } from '../../shared/utils'
import { useFormField } from '../form-field/form-field-context'
import type { FormDisableOption, FormIdentityOptions } from '../form-field/form-options'
import { FORM_ID_NAME_DISABLED_ON_CHANGE_KEYS } from '../form-field/form-options'

import type { CheckboxVariantProps } from './checkbox.class'
import {
  checkboxBaseVariants,
  checkboxCardPaddingVariants,
  checkboxContainerVariants,
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

  const [formProps, styleProps, restProps] = splitProps(
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
      defaultId: generatedId(),
      defaultSize: 'md',
      initialValue:
        formProps.formFieldBind === false ? undefined : restProps.defaultChecked || false,
    }),
  )

  function onChange(nextChecked: boolean): void {
    if (formProps.formFieldBind === false) {
      formProps.onChange?.(nextChecked)
      return
    }

    field.setFormValue(nextChecked)
    formProps.onChange?.(nextChecked)
    field.emit('change')
    field.emit('input')
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
      {...restProps}
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
            <KobalteCheckbox.Input
              id={field.id()}
              class="peer"
              data-slot="input"
              {...field.ariaAttrs()}
            />

            <KobalteCheckbox.Control
              data-slot="base"
              class={checkboxBaseVariants(
                {
                  size: field.size(),
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
                <Icon
                  name={
                    state.indeterminate() ? styleProps.indeterminateIcon : styleProps.checkedIcon
                  }
                  class={checkboxIconVariants(
                    {
                      size: field.size(),
                    },
                    styleProps.classes?.icon,
                  )}
                />
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
                          required: restProps.required,
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
                        required: restProps.required,
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
                  class={cn('text-muted-foreground', styleProps.classes?.description)}
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
