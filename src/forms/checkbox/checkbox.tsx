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
  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>
  export type Extend = KobalteCheckbox.CheckboxRootProps

  export interface Items {}

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

  const [local, rest] = splitProps(merged, [
    ...FORM_ID_NAME_DISABLED_ON_CHANGE_KEYS,
    'checked',
    'defaultChecked',
    'formFieldBind',
    'trueValue',
    'falseValue',
    'indeterminate',
    'label',
    'description',
    'size',
    'variant',
    'indicator',
    'checkedIcon',
    'indeterminateIcon',
    'classes',
    'styles',
  ])

  const generatedId = useId(() => local.id, 'checkbox')

  const field = useFormField(
    () => ({
      id: local.id,
      name: local.name,
      size: local.size,
      disabled: local.disabled,
    }),
    () => ({
      bind: local.formFieldBind,
      defaultId: generatedId(),
      defaultSize: 'md',
      initialValue:
        local.formFieldBind === false
          ? undefined
          : (normalizeFieldValue(
              local.checked !== undefined ? local.checked : local.defaultChecked,
            ) ?? local.falseValue),
    }),
  )

  function toCheckedState(value: unknown): boolean | 'indeterminate' {
    if (value === 'indeterminate') {
      return 'indeterminate'
    }

    return value === local.trueValue || (typeof value === 'boolean' && value)
  }

  function normalizeFieldValue(value: unknown): unknown {
    if (value === undefined || value === 'indeterminate') {
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

  function toChangeValue(nextChecked: boolean): TTrue | TFalse {
    return nextChecked ? (local.trueValue as TTrue) : (local.falseValue as TFalse)
  }

  const checked = createMemo<boolean | 'indeterminate' | undefined>(() => {
    if (local.checked !== undefined) {
      return toCheckedState(local.checked)
    }

    if (local.formFieldBind !== false && field.value() !== undefined) {
      return toCheckedState(field.value())
    }

    return undefined
  })

  const defaultChecked = createMemo<boolean | 'indeterminate' | undefined>(() => {
    if (local.defaultChecked === undefined) {
      return undefined
    }

    return toCheckedState(local.defaultChecked)
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
    if (local.indeterminate !== undefined) {
      return local.indeterminate
    }
    return (
      checked() === 'indeterminate' ||
      (checked() === undefined && defaultChecked() === 'indeterminate')
    )
  })

  createEffect(() => {
    if (local.formFieldBind === false || local.checked === undefined) {
      return
    }

    field.setFormValue(normalizeFieldValue(local.checked))
  })

  function onChange(nextChecked: boolean): void {
    const nextValue = toChangeValue(nextChecked)

    if (local.formFieldBind === false) {
      local.onChange?.(nextValue)
      return
    }

    field.setFormValue(nextValue)
    local.onChange?.(nextValue)
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
      data-disabled={field.disabled() ? '' : undefined}
      style={local.styles?.root}
      class={checkboxRootVariants(
        {
          variant: local.variant === 'card' ? 'card' : undefined,
          indicator: local.indicator === 'hidden' ? undefined : local.indicator,
        },
        local.variant === 'card' &&
          checkboxCardPaddingVariants({
            size: field.size(),
          }),
        local.variant === 'card' && 'cursor-pointer',
        local.classes?.root,
      )}
      {...rest}
    >
      {(state) => (
        <>
          <Show when={local.variant === 'card'}>
            <label for={field.id()} class="inset-0 absolute" />
          </Show>
          <div
            data-slot="container"
            style={local.styles?.container}
            class={checkboxContainerVariants(
              {
                size: field.size(),
              },
              local.variant === 'card' && 'relative z-1',
              local.classes?.container,
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
              style={local.styles?.control}
              data-invalid={field.invalid() ? '' : undefined}
              class={checkboxBaseVariants(
                {
                  size: field.size(),
                },
                local.indicator === 'hidden' && 'sr-only',
                local.classes?.control,
              )}
            >
              <KobalteCheckbox.Indicator
                data-slot="indicator"
                style={local.styles?.indicator}
                class={cn(
                  'text-primary-foreground bg-primary flex size-full items-center justify-center',
                  local.classes?.indicator,
                )}
              >
                <Icon
                  name={state.indeterminate() ? local.indeterminateIcon : local.checkedIcon}
                  class={checkboxIconVariants(
                    {
                      size: field.size(),
                    },
                    local.classes?.icon,
                  )}
                />
              </KobalteCheckbox.Indicator>
            </KobalteCheckbox.Control>
          </div>

          <Show when={local.label || local.description}>
            <div
              data-slot="wrapper"
              style={local.styles?.wrapper}
              class={checkboxWrapperVariants(
                {
                  indicator: local.indicator,
                  size: field.size(),
                },
                local.classes?.wrapper,
              )}
            >
              <Show when={local.label}>
                <Show
                  when={local.variant === 'card'}
                  fallback={
                    <label
                      for={field.id()}
                      data-slot="label"
                      style={local.styles?.label}
                      class={checkboxLabelVariants(
                        {
                          required: rest.required,
                        },
                        local.classes?.label,
                      )}
                    >
                      {local.label}
                    </label>
                  }
                >
                  <p
                    data-slot="label"
                    style={local.styles?.label}
                    class={checkboxLabelVariants(
                      {
                        required: rest.required,
                      },
                      local.classes?.label,
                    )}
                  >
                    {local.label}
                  </p>
                </Show>
              </Show>

              <Show when={local.description}>
                <p
                  data-slot="description"
                  style={local.styles?.description}
                  class={cn('text-muted-foreground', local.classes?.description)}
                >
                  {local.description}
                </p>
              </Show>
            </div>
          </Show>
        </>
      )}
    </KobalteCheckbox.Root>
  )
}
