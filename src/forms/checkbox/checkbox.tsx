import * as KobalteCheckbox from '@kobalte/core/checkbox'
import type { JSX } from 'solid-js'
import { Show, createEffect, createMemo, mergeProps, splitProps } from 'solid-js'

import type { IconT } from '../../elements/icon'
import { Icon } from '../../elements/icon'
import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
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

export namespace CheckboxT {
  export type Slot =
    | 'root'
    | 'container'
    | 'control'
    | 'indicator'
    | 'icon'
    | 'wrapper'
    | 'label'
    | 'description'

  export type Variant = CheckboxVariantProps

  export interface Items {}

  export type Extend = KobalteCheckbox.CheckboxRootProps
  export interface Classes extends SlotClasses<Slot> {}
  export interface Styles extends SlotStyles<Slot> {}

  /**
   * Base props for the Checkbox component.
   */
  export interface Base<TTrue = boolean, TFalse = boolean>
    extends FormIdentityOptions, FormDisableOption {
    /**
     * Whether the checkbox is checked (controlled).
     */
    checked?: TTrue | TFalse | 'indeterminate'

    /**
     * Whether the checkbox is checked by default (uncontrolled).
     * @default false
     */
    defaultChecked?: boolean | 'indeterminate'

    /**
     * Value to use when the checkbox is checked.
     * @default true
     */
    trueValue?: TTrue

    /**
     * Value to use when the checkbox is unchecked.
     * @default false
     */
    falseValue?: TFalse

    /**
     * Label for the checkbox.
     */
    label?: JSX.Element

    /**
     * Description text for the checkbox.
     */
    description?: JSX.Element

    /**
     * Whether to bind the checkbox value to the parent FormField.
     * @default true
     */
    formFieldBind?: boolean

    /**
     * Callback when the checked state changes.
     */
    onChange?: (value: TTrue | TFalse) => void

    /**
     * Whether the checkbox is in an indeterminate state.
     * @default false
     */
    indeterminate?: boolean

    /**
     * Icon to show when checked.
     * @default 'icon-check'
     */
    checkedIcon?: IconT.Name

    /**
     * Icon to show when indeterminate.
     * @default 'icon-minus'
     */
    indeterminateIcon?: IconT.Name
  }

  /**
   * Props for the Checkbox component.
   */
  export interface Props<TTrue = boolean, TFalse = boolean> extends BaseProps<
    Base<TTrue, TFalse>,
    Variant,
    Extend,
    Slot,
    'ref' | 'indeterminate'
  > {}
}

/**
 * Props for the Checkbox component.
 */
export interface CheckboxProps<TTrue = boolean, TFalse = boolean> extends CheckboxT.Props<
  TTrue,
  TFalse
> {}

/** Single checkbox control with card and list variants and custom true/false values. */
export function Checkbox<TTrue = boolean, TFalse = boolean>(
  props: CheckboxProps<TTrue, TFalse>,
): JSX.Element {
  const merged = mergeProps(
    {
      size: 'md' as const,
      variant: 'list' as const,
      indicator: 'start' as const,
      checkedIcon: 'icon-check' as IconT.Name,
      indeterminateIcon: 'icon-minus' as IconT.Name,
      formFieldBind: true,
      trueValue: true,
      falseValue: false,
    },
    props,
  )

  const [formProps, styleProps, restProps] = splitProps(
    merged as CheckboxProps<TTrue, TFalse>,
    [
      ...FORM_ID_NAME_DISABLED_ON_CHANGE_KEYS,
      'checked',
      'defaultChecked',
      'formFieldBind',
      'trueValue',
      'falseValue',
      'indeterminate',
    ],
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
        formProps.formFieldBind === false
          ? undefined
          : (normalizeFieldValue(
              formProps.checked !== undefined ? formProps.checked : formProps.defaultChecked,
            ) ?? formProps.falseValue),
    }),
  )

  function toCheckedState(value: unknown): boolean | 'indeterminate' {
    if (value === 'indeterminate') {
      return 'indeterminate'
    }

    return value === formProps.trueValue || (typeof value === 'boolean' && value)
  }

  function normalizeFieldValue(value: unknown): unknown {
    if (value === undefined || value === 'indeterminate') {
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

  const checked = createMemo<boolean | 'indeterminate' | undefined>(() => {
    if (formProps.checked !== undefined) {
      return toCheckedState(formProps.checked)
    }

    if (formProps.formFieldBind !== false && field.value() !== undefined) {
      return toCheckedState(field.value())
    }

    return undefined
  })

  const defaultChecked = createMemo<boolean | 'indeterminate' | undefined>(() => {
    if (formProps.defaultChecked === undefined) {
      return undefined
    }

    return toCheckedState(formProps.defaultChecked)
  })

  const resolvedChecked = createMemo<boolean | undefined>(() => {
    const value = checked()

    return value === 'indeterminate' ? false : value
  })

  const resolvedDefaultChecked = createMemo<boolean | undefined>(() => {
    const value = defaultChecked()
    return value === 'indeterminate' ? false : value
  })

  const indeterminate = createMemo<boolean>(() => {
    if (formProps.indeterminate !== undefined) {
      return formProps.indeterminate
    }
    return (
      checked() === 'indeterminate' ||
      (checked() === undefined && defaultChecked() === 'indeterminate')
    )
  })

  createEffect(() => {
    if (formProps.formFieldBind === false || formProps.checked === undefined) {
      return
    }

    field.setFormValue(normalizeFieldValue(formProps.checked))
  })

  function onChange(nextChecked: boolean): void {
    const nextValue = toChangeValue(nextChecked)

    if (formProps.formFieldBind === false) {
      formProps.onChange?.(nextValue)
      return
    }

    field.setFormValue(nextValue)
    formProps.onChange?.(nextValue)
    field.emit('change')
    field.emit('input')
  }

  return (
    <KobalteCheckbox.Root
      id={`${field.id()}-root`}
      name={field.name()}
      disabled={field.disabled()}
      onChange={onChange}
      checked={resolvedChecked()}
      defaultChecked={resolvedDefaultChecked()}
      indeterminate={indeterminate()}
      data-slot="root"
      style={merged.styles?.root}
      data-disabled={field.disabled() ? '' : undefined}
      class={checkboxRootVariants(
        {
          variant: styleProps.variant === 'card' ? 'card' : undefined,
          indicator: styleProps.indicator === 'hidden' ? undefined : styleProps.indicator,
        },
        styleProps.variant === 'card' &&
          checkboxCardPaddingVariants({
            size: field.size(),
          }),
        styleProps.variant === 'card' && 'cursor-pointer',
        styleProps.classes?.root,
      )}
      {...restProps}
    >
      {(state) => (
        <>
          <Show when={styleProps.variant === 'card'}>
            <label for={field.id()} class="inset-0 absolute" />
          </Show>
          <div
            data-slot="container"
            style={merged.styles?.container}
            class={checkboxContainerVariants(
              {
                size: field.size(),
              },
              styleProps.variant === 'card' && 'relative z-1',
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
              data-slot="control"
              style={merged.styles?.control}
              data-invalid={field.invalid() ? '' : undefined}
              class={checkboxBaseVariants(
                {
                  size: field.size(),
                },
                styleProps.indicator === 'hidden' && 'sr-only',
                styleProps.classes?.control,
              )}
            >
              <KobalteCheckbox.Indicator
                data-slot="indicator"
                style={merged.styles?.indicator}
                class={cn(
                  'text-primary-foreground bg-primary flex size-full items-center justify-center',
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
              style={merged.styles?.wrapper}
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
                      style={merged.styles?.label}
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
                    style={merged.styles?.label}
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
                  style={merged.styles?.description}
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
