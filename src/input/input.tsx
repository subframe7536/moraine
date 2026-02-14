import type { JSX, ValidComponent } from 'solid-js'
import { Show, createMemo, mergeProps, onMount, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useFieldGroupContext } from '../form-field/field-group-context'
import { useFormField } from '../form-field/form-field-context'
import type { IconName } from '../icon'
import { Icon } from '../icon'
import type { ModelModifiers } from '../shared/input-modifiers'
import { applyInputModifiers } from '../shared/input-modifiers'
import { callHandler, cn, useId } from '../shared/utils'

import type { InputVariantProps } from './input.class'
import {
  inputBaseVariants,
  inputLeadingAvatarVariants,
  inputLeadingIconVariants,
  inputLeadingVariants,
  inputRootVariants,
  inputTrailingIconVariants,
  inputTrailingVariants,
} from './input.class'

type InputStyleVariantProps = Pick<InputVariantProps, 'color' | 'size' | 'variant' | 'highlight'>
type InputColor = NonNullable<InputBaseProps['color']>
type InputSize = NonNullable<InputBaseProps['size']>
type InputVariant = NonNullable<InputBaseProps['variant']>

export type InputValue = string | number | boolean | null | undefined

export interface InputClasses {
  root?: string
  base?: string
  leading?: string
  leadingIcon?: string
  leadingAvatar?: string
  trailing?: string
  trailingIcon?: string
}

export interface InputBaseProps extends InputStyleVariantProps {
  as?: ValidComponent
  id?: string
  name?: string
  type?: JSX.InputHTMLAttributes<HTMLInputElement>['type']
  placeholder?: string
  required?: boolean
  autocomplete?: JSX.InputHTMLAttributes<HTMLInputElement>['autocomplete']
  autofocus?: boolean
  autofocusDelay?: number
  disabled?: boolean
  icon?: IconName
  avatar?: JSX.Element
  leading?: boolean | JSX.Element
  leadingIcon?: IconName
  trailing?: boolean | JSX.Element
  trailingIcon?: IconName
  loading?: boolean
  loadingIcon?: IconName
  modelModifiers?: ModelModifiers<InputValue>
  onValueChange?: (value: InputValue) => void
  class?: string
  classes?: InputClasses
  children?: JSX.Element
}

export type InputProps = InputBaseProps &
  Omit<JSX.InputHTMLAttributes<HTMLInputElement>, keyof InputBaseProps | 'id' | 'children' | 'size'>

function normalizeInputColor(value?: string): InputColor {
  if (value === 'secondary' || value === 'neutral' || value === 'error') {
    return value
  }

  return 'primary'
}

function normalizeInputSize(value?: string): InputSize {
  if (value === 'xs' || value === 'sm' || value === 'lg' || value === 'xl') {
    return value
  }

  return 'md'
}

function normalizeInputVariant(value?: string): InputVariant {
  if (value === 'soft' || value === 'subtle' || value === 'ghost' || value === 'none') {
    return value
  }

  return 'outline'
}

function isRenderableContent(value: unknown): value is JSX.Element {
  return value !== undefined && value !== null && typeof value !== 'boolean'
}

export function Input(props: InputProps): JSX.Element {
  const merged = mergeProps(
    {
      as: 'div' as ValidComponent,
      type: 'text' as NonNullable<JSX.InputHTMLAttributes<HTMLInputElement>['type']>,
      autocomplete: 'off' as const,
      autofocusDelay: 0,
      size: 'md' as const,
      color: 'primary' as const,
      variant: 'outline' as const,
      loading: false,
      loadingIcon: 'icon-loading' as IconName,
    },
    props,
  )

  const [local, rest] = splitProps(merged as InputProps, [
    'as',
    'id',
    'name',
    'type',
    'placeholder',
    'color',
    'variant',
    'size',
    'required',
    'autocomplete',
    'autofocus',
    'autofocusDelay',
    'disabled',
    'highlight',
    'icon',
    'avatar',
    'leading',
    'leadingIcon',
    'trailing',
    'trailingIcon',
    'loading',
    'loadingIcon',
    'modelModifiers',
    'onValueChange',
    'onInput',
    'onChange',
    'onBlur',
    'onFocus',
    'class',
    'classes',
    'children',
  ])

  const field = useFormField(
    () => ({
      id: local.id,
      name: local.name,
      size: local.size,
      color: local.color,
      highlight: local.highlight,
      disabled: local.disabled,
    }),
    { deferInputValidation: true },
  )
  const fieldGroup = useFieldGroupContext()
  const generatedId = useId(() => local.id, 'input')

  let inputEl: HTMLInputElement | undefined

  const inputId = createMemo(() => field.id() ?? generatedId())
  const resolvedColor = createMemo(() => normalizeInputColor(field.color() ?? local.color))
  const resolvedSize = createMemo(() =>
    normalizeInputSize(local.size ?? fieldGroup?.size ?? field.size()),
  )
  const resolvedVariant = createMemo(() => normalizeInputVariant(local.variant))
  const resolvedHighlight = createMemo(() => field.highlight() ?? local.highlight)
  const disabled = createMemo(() => field.disabled())
  const fieldGroupOrientation = createMemo(() => fieldGroup?.orientation)
  const ariaAttrs = createMemo(() => field.ariaAttrs() ?? {})
  const isLazy = createMemo(() => Boolean(local.modelModifiers?.lazy))

  const customLeading = createMemo(() =>
    isRenderableContent(local.leading) ? (local.leading as JSX.Element) : undefined,
  )
  const customTrailing = createMemo(() =>
    isRenderableContent(local.trailing) ? (local.trailing as JSX.Element) : undefined,
  )

  const isLeadingIcon = createMemo(() => {
    const hasIcon = Boolean(local.icon)
    const leading = local.leading === true
    const trailing = local.trailing === true

    return Boolean(
      (hasIcon && leading) ||
      (hasIcon && !trailing) ||
      (local.loading && !trailing) ||
      local.leadingIcon,
    )
  })
  const isTrailingIcon = createMemo(() => {
    const hasIcon = Boolean(local.icon)
    const trailing = local.trailing === true

    return Boolean((hasIcon && trailing) || (local.loading && trailing) || local.trailingIcon)
  })

  const leadingIconName = createMemo<IconName | undefined>(() => {
    if (local.loading) {
      return local.loadingIcon
    }

    return local.leadingIcon ?? local.icon
  })
  const trailingIconName = createMemo<IconName | undefined>(() => {
    if (local.loading && !isLeadingIcon()) {
      return local.loadingIcon
    }

    return local.trailingIcon ?? local.icon
  })

  const hasLeading = createMemo(() => Boolean(customLeading() || isLeadingIcon() || local.avatar))
  const hasTrailing = createMemo(() => Boolean(customTrailing() || isTrailingIcon()))

  function updateInputValue(value: string | null | undefined): void {
    const nextValue = applyInputModifiers<InputValue>(value, local.modelModifiers, {
      number: local.type === 'number',
    })

    local.onValueChange?.(nextValue)
    field.emitFormInput()
  }

  const onInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (event) => {
    callHandler(event, local.onInput as JSX.EventHandlerUnion<HTMLInputElement, InputEvent>)

    if (!isLazy()) {
      updateInputValue(event.currentTarget.value)
    }
  }

  const onChange: JSX.EventHandlerUnion<HTMLInputElement, Event> = (event) => {
    const value = event.currentTarget.value

    if (isLazy()) {
      updateInputValue(value)
    }

    if (local.modelModifiers?.trim) {
      event.currentTarget.value = value.trim()
    }

    field.emitFormChange()
    callHandler(event, local.onChange as JSX.EventHandlerUnion<HTMLInputElement, Event>)
  }

  const onBlur: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent> = (event) => {
    field.emitFormBlur()
    callHandler(event, local.onBlur as any)
  }

  const onFocus: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent> = (event) => {
    field.emitFormFocus()
    callHandler(event, local.onFocus as any)
  }

  onMount(() => {
    if (!local.autofocus) {
      return
    }

    setTimeout(() => {
      inputEl?.focus()
    }, local.autofocusDelay ?? 0)
  })

  return (
    <Dynamic
      component={local.as}
      data-slot="root"
      class={cn(inputRootVariants(), local.classes?.root, local.class)}
    >
      <input
        id={inputId()}
        ref={(element) => (inputEl = element)}
        type={local.type}
        name={field.name()}
        placeholder={local.placeholder}
        autocomplete={local.autocomplete}
        required={local.required}
        disabled={disabled()}
        data-slot="base"
        class={cn(
          inputBaseVariants({
            color: resolvedColor(),
            size: resolvedSize(),
            variant: resolvedVariant(),
            highlight: resolvedHighlight(),
            leading: hasLeading(),
            trailing: hasTrailing(),
            loading: local.loading,
            fieldGroup: fieldGroupOrientation(),
            type: local.type === 'file' ? 'file' : undefined,
          }),
          local.classes?.base,
        )}
        onInput={onInput}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        {...rest}
        {...ariaAttrs()}
      />

      {local.children}

      <Show when={hasLeading()}>
        <span
          data-slot="leading"
          class={cn(
            inputLeadingVariants({
              size: resolvedSize(),
            }),
            local.classes?.leading,
          )}
        >
          <Show
            when={customLeading()}
            fallback={
              <Show
                when={isLeadingIcon() && leadingIconName()}
                fallback={
                  <Show when={local.avatar}>
                    <span
                      data-slot="leadingAvatar"
                      class={cn(
                        inputLeadingAvatarVariants({
                          size: resolvedSize(),
                        }),
                        local.classes?.leadingAvatar,
                      )}
                    >
                      {local.avatar}
                    </span>
                  </Show>
                }
              >
                {(iconName) => (
                  <Icon
                    name={iconName()}
                    data-slot="leadingIcon"
                    class={cn(
                      inputLeadingIconVariants({
                        size: resolvedSize(),
                        loading: local.loading,
                      }),
                      local.classes?.leadingIcon,
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

      <Show when={hasTrailing()}>
        <span
          data-slot="trailing"
          class={cn(
            inputTrailingVariants({
              size: resolvedSize(),
            }),
            local.classes?.trailing,
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
                    class={cn(
                      inputTrailingIconVariants({
                        size: resolvedSize(),
                        loading: local.loading,
                      }),
                      local.classes?.trailingIcon,
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
    </Dynamic>
  )
}
