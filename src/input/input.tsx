import type { JSX } from 'solid-js'
import { Show, createMemo, mergeProps, onMount, splitProps } from 'solid-js'

import { useFieldGroupContext } from '../field-group/field-group-context'
import { useFormField } from '../form-field/form-field-context'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
  FormValueOptions,
} from '../form-field/form-options'
import { FORM_ID_NAME_DISABLED_KEYS, FORM_INPUT_INTERACTION_KEYS } from '../form-field/form-options'
import type { IconName } from '../icon'
import { Icon } from '../icon'
import type { ModelModifiers } from '../shared/input-modifiers'
import { applyInputModifiers } from '../shared/input-modifiers'
import type { SlotClasses } from '../shared/slot-class'
import { callHandler, useId } from '../shared/utils'

import type { InputVariantProps } from './input.class'
import {
  inputBaseVariants,
  inputEndPaddingNoSlotVariants,
  inputEndPaddingWithSlotVariants,
  inputLeadingIconVariants,
  inputLeadingVariants,
  inputRootVariants,
  inputStartPaddingNoSlotVariants,
  inputStartPaddingWithSlotVariants,
  inputTrailingIconVariants,
  inputTrailingVariants,
} from './input.class'

type InputStyleVariantProps = Pick<InputVariantProps, 'size' | 'variant' | 'highlight'>

export type InputValue = string | number | boolean | null | undefined

type InputSlots = 'root' | 'input' | 'leading' | 'leadingIcon' | 'trailing' | 'trailingIcon'

export type InputClasses = SlotClasses<InputSlots>

export interface InputBaseProps
  extends
    InputStyleVariantProps,
    FormIdentityOptions,
    FormValueOptions<InputValue>,
    FormRequiredOption,
    FormReadOnlyOption,
    FormDisableOption {
  type?: JSX.InputHTMLAttributes<HTMLInputElement>['type']
  placeholder?: string
  autocomplete?: JSX.InputHTMLAttributes<HTMLInputElement>['autocomplete']
  autofocus?: boolean
  autofocusDelay?: number
  icon?: IconName
  leading?: boolean | JSX.Element
  leadingIcon?: IconName
  trailing?: boolean | JSX.Element
  trailingIcon?: IconName
  loading?: boolean
  loadingIcon?: IconName
  modelModifiers?: ModelModifiers<InputValue>
  onValueChange?: (value: InputValue) => void
  onInput?: JSX.EventHandlerUnion<HTMLInputElement, InputEvent>
  onChange?: JSX.EventHandlerUnion<HTMLInputElement, Event>
  onBlur?: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent>
  onFocus?: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent>
  classes?: InputClasses
  children?: JSX.Element
}

export type InputProps = InputBaseProps

function isRenderableContent(value: unknown): value is JSX.Element {
  return value !== undefined && value !== null && typeof value !== 'boolean'
}

export function Input(props: InputProps): JSX.Element {
  const merged = mergeProps(
    {
      type: 'text' as NonNullable<JSX.InputHTMLAttributes<HTMLInputElement>['type']>,
      autocomplete: 'off' as const,
      autofocusDelay: 0,
      variant: 'outline' as const,
      loading: false,
      loadingIcon: 'icon-loading' as IconName,
    },
    props,
  )

  const [formProps, baseProps, adornmentStyleProps] = splitProps(
    merged as InputProps,
    [
      ...FORM_ID_NAME_DISABLED_KEYS,
      'value',
      'required',
      'readOnly',
      'modelModifiers',
      'onValueChange',
      'onInput',
      'onChange',
      ...FORM_INPUT_INTERACTION_KEYS,
    ],
    ['type', 'placeholder', 'autocomplete', 'autofocus', 'autofocusDelay', 'children'],
  )

  const fieldGroup = useFieldGroupContext()
  const generatedId = useId(() => formProps.id, 'input')
  const field = useFormField(
    () => ({
      id: formProps.id,
      name: formProps.name,
      size: adornmentStyleProps.size ?? fieldGroup?.size,
      highlight: adornmentStyleProps.highlight,
      disabled: formProps.disabled,
    }),
    {
      deferInputValidation: true,
      defaultId: generatedId,
      defaultSize: 'md',
    },
  )

  let inputEl: HTMLInputElement | undefined

  const isLazy = createMemo(() => Boolean(formProps.modelModifiers?.lazy))

  const customLeading = createMemo(() =>
    isRenderableContent(adornmentStyleProps.leading)
      ? (adornmentStyleProps.leading as JSX.Element)
      : undefined,
  )
  const customTrailing = createMemo(() =>
    isRenderableContent(adornmentStyleProps.trailing)
      ? (adornmentStyleProps.trailing as JSX.Element)
      : undefined,
  )

  const isLeadingIcon = createMemo(() => {
    const hasIcon = Boolean(adornmentStyleProps.icon)
    const leading = adornmentStyleProps.leading === true
    const trailing = adornmentStyleProps.trailing === true

    return Boolean(
      (hasIcon && leading) ||
      (hasIcon && !trailing) ||
      (adornmentStyleProps.loading && !trailing) ||
      adornmentStyleProps.leadingIcon,
    )
  })
  const isTrailingIcon = createMemo(() => {
    const hasIcon = Boolean(adornmentStyleProps.icon)
    const trailing = adornmentStyleProps.trailing === true

    return Boolean(
      (hasIcon && trailing) ||
      (adornmentStyleProps.loading && trailing) ||
      adornmentStyleProps.trailingIcon,
    )
  })

  const leadingIconName = createMemo<IconName | undefined>(() => {
    if (adornmentStyleProps.loading) {
      return adornmentStyleProps.loadingIcon
    }

    return adornmentStyleProps.leadingIcon ?? adornmentStyleProps.icon
  })
  const trailingIconName = createMemo<IconName | undefined>(() => {
    if (adornmentStyleProps.loading && !isLeadingIcon()) {
      return adornmentStyleProps.loadingIcon
    }

    return adornmentStyleProps.trailingIcon ?? adornmentStyleProps.icon
  })

  const hasLeading = createMemo(() => Boolean(customLeading() || isLeadingIcon()))
  const hasTrailing = createMemo(() => Boolean(customTrailing() || isTrailingIcon()))

  function updateInputValue(value: string | null | undefined): void {
    const nextValue = applyInputModifiers<InputValue>(value, formProps.modelModifiers, {
      number: baseProps.type === 'number',
    })

    formProps.onValueChange?.(nextValue)
    field.emitFormInput()
  }

  const onInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (event) => {
    callHandler(event, formProps.onInput as JSX.EventHandlerUnion<HTMLInputElement, InputEvent>)

    if (!isLazy()) {
      updateInputValue(event.currentTarget.value)
    }
  }

  const onChange: JSX.EventHandlerUnion<HTMLInputElement, Event> = (event) => {
    const value = event.currentTarget.value

    if (isLazy()) {
      updateInputValue(value)
    }

    if (formProps.modelModifiers?.trim) {
      event.currentTarget.value = value.trim()
    }

    field.emitFormChange()
    callHandler(event, formProps.onChange as JSX.EventHandlerUnion<HTMLInputElement, Event>)
  }

  const onBlur: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent> = (event) => {
    field.emitFormBlur()
    callHandler(event, formProps.onBlur as any)
  }

  const onFocus: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent> = (event) => {
    field.emitFormFocus()
    callHandler(event, formProps.onFocus as any)
  }

  const onRootPointerDown: JSX.EventHandlerUnion<HTMLDivElement, PointerEvent> = (event) => {
    if (event.button !== 0 || event.defaultPrevented || event.target === inputEl) {
      return
    }

    inputEl?.focus()
  }

  onMount(() => {
    if (!baseProps.autofocus) {
      return
    }

    setTimeout(() => {
      inputEl?.focus()
    }, baseProps.autofocusDelay ?? 0)
  })

  return (
    <div
      data-slot="root"
      class={inputRootVariants(
        {
          size: field.size(),
          variant: adornmentStyleProps.variant,
          highlight: field.highlight(),
          disabled: field.disabled(),
        },
        adornmentStyleProps.classes?.root,
      )}
      onPointerDown={onRootPointerDown}
    >
      <Show when={hasLeading()}>
        <span
          data-slot="leading"
          class={inputLeadingVariants(
            {
              size: field.size(),
            },
            adornmentStyleProps.classes?.leading,
          )}
        >
          <Show
            when={customLeading()}
            fallback={
              <Show when={isLeadingIcon() && leadingIconName()}>
                {(iconName) => (
                  <Icon
                    name={iconName()}
                    data-slot="leadingIcon"
                    class={inputLeadingIconVariants(
                      {
                        size: field.size(),
                        loading: adornmentStyleProps.loading,
                      },
                      adornmentStyleProps.classes?.leadingIcon,
                    )}
                  />
                )}
              </Show>
            }
          >
            {(content) => content()}
          </Show>
        </span>
      </Show>

      <input
        id={field.id()}
        ref={(element) => (inputEl = element)}
        type={baseProps.type}
        value={formProps.value as string | number | string[] | undefined}
        name={field.name()}
        placeholder={baseProps.placeholder}
        required={formProps.required}
        disabled={field.disabled()}
        readOnly={formProps.readOnly}
        autocomplete={baseProps.autocomplete}
        data-slot="base"
        class={inputBaseVariants(
          {
            type: baseProps.type === 'file' ? 'file' : undefined,
          },
          hasLeading()
            ? inputStartPaddingWithSlotVariants({
                size: field.size(),
              })
            : inputStartPaddingNoSlotVariants({
                size: field.size(),
              }),
          hasTrailing()
            ? inputEndPaddingWithSlotVariants({
                size: field.size(),
              })
            : inputEndPaddingNoSlotVariants({
                size: field.size(),
              }),
          adornmentStyleProps.classes?.input,
        )}
        onInput={onInput}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        {...field.ariaAttrs()}
      />

      {baseProps.children}

      <Show when={hasTrailing()}>
        <span
          data-slot="trailing"
          class={inputTrailingVariants(
            {
              size: field.size(),
            },
            adornmentStyleProps.classes?.trailing,
          )}
        >
          <Show
            when={customTrailing()}
            fallback={
              <Show when={isTrailingIcon() && trailingIconName()}>
                {(iconName) => (
                  <Icon
                    name={iconName()}
                    data-slot="trailingIcon"
                    class={inputTrailingIconVariants(
                      {
                        size: field.size(),
                        loading: adornmentStyleProps.loading,
                      },
                      adornmentStyleProps.classes?.trailingIcon,
                    )}
                  />
                )}
              </Show>
            }
          >
            {(content) => content()}
          </Show>
        </span>
      </Show>
    </div>
  )
}
