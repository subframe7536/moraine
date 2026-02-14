import type { JSX, ValidComponent } from 'solid-js'
import { Show, createEffect, createMemo, mergeProps, on, onMount, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useFieldGroupContext } from '../form-field/field-group-context'
import { useFormField } from '../form-field/form-field-context'
import type { IconName } from '../icon'
import { Icon } from '../icon'
import type { ModelModifiers } from '../shared/input-modifiers'
import { applyInputModifiers } from '../shared/input-modifiers'
import { callHandler, cn, useId } from '../shared/utils'

import type { TextareaVariantProps } from './textarea.class'
import {
  textareaBaseVariants,
  textareaLeadingAvatarVariants,
  textareaLeadingIconVariants,
  textareaLeadingVariants,
  textareaRootVariants,
  textareaTrailingIconVariants,
  textareaTrailingVariants,
} from './textarea.class'

type TextareaStyleVariantProps = Pick<
  TextareaVariantProps,
  'color' | 'size' | 'variant' | 'highlight' | 'autoresize'
>
type TextareaColor = NonNullable<TextareaBaseProps['color']>
type TextareaSize = NonNullable<TextareaBaseProps['size']>
type TextareaVariant = NonNullable<TextareaBaseProps['variant']>

export type TextareaValue = string | number | null | undefined

export interface TextareaClasses {
  root?: string
  base?: string
  leading?: string
  leadingIcon?: string
  leadingAvatar?: string
  trailing?: string
  trailingIcon?: string
}

export interface TextareaBaseProps extends TextareaStyleVariantProps {
  as?: ValidComponent
  id?: string
  name?: string
  placeholder?: string
  required?: boolean
  autofocus?: boolean
  autofocusDelay?: number
  autoresizeDelay?: number
  disabled?: boolean
  rows?: number
  maxrows?: number
  icon?: IconName
  avatar?: JSX.Element
  leading?: boolean | JSX.Element
  leadingIcon?: IconName
  trailing?: boolean | JSX.Element
  trailingIcon?: IconName
  loading?: boolean
  loadingIcon?: IconName
  modelModifiers?: ModelModifiers<TextareaValue>
  onValueChange?: (value: TextareaValue) => void
  class?: string
  classes?: TextareaClasses
  children?: JSX.Element
}

export type TextareaProps = TextareaBaseProps &
  Omit<JSX.TextareaHTMLAttributes<HTMLTextAreaElement>, keyof TextareaBaseProps | 'id' | 'children'>

function normalizeTextareaColor(value?: string): TextareaColor {
  if (value === 'secondary' || value === 'neutral' || value === 'error') {
    return value
  }

  return 'primary'
}

function normalizeTextareaSize(value?: string): TextareaSize {
  if (value === 'xs' || value === 'sm' || value === 'lg' || value === 'xl') {
    return value
  }

  return 'md'
}

function normalizeTextareaVariant(value?: string): TextareaVariant {
  if (value === 'soft' || value === 'subtle' || value === 'ghost' || value === 'none') {
    return value
  }

  return 'outline'
}

function isRenderableContent(value: unknown): value is JSX.Element {
  return value !== undefined && value !== null && typeof value !== 'boolean'
}

export function Textarea(props: TextareaProps): JSX.Element {
  const merged = mergeProps(
    {
      as: 'div' as ValidComponent,
      rows: 3,
      maxrows: 0,
      autofocusDelay: 0,
      autoresizeDelay: 0,
      size: 'md' as const,
      color: 'primary' as const,
      variant: 'outline' as const,
      loading: false,
      loadingIcon: 'icon-loading' as IconName,
      autoresize: false,
    },
    props,
  )

  const [local, rest] = splitProps(merged as TextareaProps, [
    'as',
    'id',
    'name',
    'placeholder',
    'color',
    'variant',
    'size',
    'required',
    'autofocus',
    'autofocusDelay',
    'autoresize',
    'autoresizeDelay',
    'disabled',
    'rows',
    'maxrows',
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
    'value',
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
  const generatedId = useId(() => local.id, 'textarea')

  let textareaEl: HTMLTextAreaElement | undefined

  const textareaId = createMemo(() => field.id() ?? generatedId())
  const resolvedColor = createMemo(() => normalizeTextareaColor(field.color() ?? local.color))
  const resolvedSize = createMemo(() =>
    normalizeTextareaSize(local.size ?? fieldGroup?.size ?? field.size()),
  )
  const resolvedVariant = createMemo(() => normalizeTextareaVariant(local.variant))
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
    const nextValue = applyInputModifiers<TextareaValue>(value, local.modelModifiers)

    local.onValueChange?.(nextValue)
    field.emitFormInput()
  }

  function autoResize(): void {
    if (!local.autoresize || !textareaEl) {
      return
    }

    const rows = local.rows ?? 3
    textareaEl.rows = rows

    const previousOverflow = textareaEl.style.overflow
    textareaEl.style.overflow = 'hidden'

    const styles = window.getComputedStyle(textareaEl)
    const paddingTop = Number.parseInt(styles.paddingTop, 10) || 0
    const paddingBottom = Number.parseInt(styles.paddingBottom, 10) || 0
    const padding = paddingTop + paddingBottom

    let lineHeight = Number.parseInt(styles.lineHeight, 10) || 0
    if (lineHeight <= 0) {
      lineHeight = 16
    }

    const nextRows = Math.ceil((textareaEl.scrollHeight - padding) / lineHeight)
    if (nextRows > rows) {
      textareaEl.rows = local.maxrows ? Math.min(nextRows, local.maxrows) : nextRows
    }

    textareaEl.style.overflow = previousOverflow
  }

  const onInput: JSX.EventHandlerUnion<HTMLTextAreaElement, InputEvent> = (event) => {
    autoResize()
    callHandler(event, local.onInput as JSX.EventHandlerUnion<HTMLTextAreaElement, InputEvent>)

    if (!isLazy()) {
      updateInputValue(event.currentTarget.value)
    }
  }

  const onChange: JSX.EventHandlerUnion<HTMLTextAreaElement, Event> = (event) => {
    const value = event.currentTarget.value

    if (isLazy()) {
      updateInputValue(value)
    }

    if (local.modelModifiers?.trim) {
      event.currentTarget.value = value.trim()
    }

    field.emitFormChange()
    callHandler(event, local.onChange as JSX.EventHandlerUnion<HTMLTextAreaElement, Event>)
  }

  const onBlur: JSX.FocusEventHandlerUnion<HTMLTextAreaElement, FocusEvent> = (event) => {
    field.emitFormBlur()
    callHandler(event, local.onBlur as any)
  }

  const onFocus: JSX.FocusEventHandlerUnion<HTMLTextAreaElement, FocusEvent> = (event) => {
    field.emitFormFocus()
    callHandler(event, local.onFocus as any)
  }

  createEffect(
    on(
      () => local.value,
      () => {
        // oxlint-disable-next-line solid/reactivity
        queueMicrotask(() => {
          autoResize()
        })
      },
    ),
  )

  onMount(() => {
    setTimeout(() => {
      if (local.autofocus) {
        textareaEl?.focus()
      }
    }, local.autofocusDelay ?? 0)

    setTimeout(() => {
      autoResize()
    }, local.autoresizeDelay ?? 0)
  })

  return (
    <Dynamic
      component={local.as}
      data-slot="root"
      class={cn(textareaRootVariants(), local.classes?.root, local.class)}
    >
      <textarea
        id={textareaId()}
        ref={(element) => (textareaEl = element)}
        name={field.name()}
        value={local.value as string | number | string[] | undefined}
        rows={local.rows ?? 3}
        placeholder={local.placeholder}
        required={local.required}
        disabled={disabled()}
        data-slot="base"
        class={cn(
          textareaBaseVariants({
            color: resolvedColor(),
            size: resolvedSize(),
            variant: resolvedVariant(),
            highlight: resolvedHighlight(),
            leading: hasLeading(),
            trailing: hasTrailing(),
            loading: local.loading,
            fieldGroup: fieldGroupOrientation(),
            autoresize: local.autoresize,
          }),
          local.classes?.base,
        )}
        onInput={onInput}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        {...rest}
        {...(ariaAttrs() as Record<string, string | boolean | undefined>)}
      />

      {local.children}

      <Show when={hasLeading()}>
        <span
          data-slot="leading"
          class={cn(
            textareaLeadingVariants({
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
                        textareaLeadingAvatarVariants({
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
                      textareaLeadingIconVariants({
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
            textareaTrailingVariants({
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
                      textareaTrailingIconVariants({
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
